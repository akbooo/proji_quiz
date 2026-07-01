import { NextRequest, NextResponse } from 'next/server';
import { 
  getRespondentById, 
  getAnswersByRespondent, 
  getQuestionsBySurveyId, 
  updateRespondentScoresAndContact,
  updateRespondentFeedback 
} from '@/lib/db';
import { google } from 'googleapis';
import { Block, BLOCKS } from '@/lib/quiz';

const BLOCK_ORDER: Block[] = [
  'sales_support',
  'automation',
  'data_knowledge',
  'predictive_ops',
  'culture_ready',
];

const SHEET_HEADERS = [
  'Дата',
  'Score',
  'Уровень',
  'Lead Score',
  'Оценки по блокам (JSON)',
  'Сильная зона',
  'Слабые зоны',
  'Сфера',
  'Размер команды',
  'Модель продаж',
  'Стадия',
  'Город',
  'Имя',
  'Компания',
  'Телефон',
  'Email',
  'UTM Source',
  'UTM Medium',
  'UTM Campaign',
  'UTM Content',
  'UTM Term',
  'Referrer',
  'Landing Path',
  'Device',
  'Language',
  'Ответы (JSON)',
  'Обратная связь (JSON)',
  'ID',
];

function getOptionScore(optionIndex: number, totalOptions: number): number {
  const maps: Record<number, number[]> = {
    3: [10, 4, 1],
    4: [10, 7, 4, 1],
    5: [10, 7, 4, 2, 1],
  };
  const arr = maps[totalOptions] ?? maps[4];
  return arr[Math.min(optionIndex, arr.length - 1)] ?? 0;
}

function getLevelLabel(total: number) {
  if (total < 30) return 'Аналоговый бизнес';
  if (total < 55) return 'Точечный потенциал';
  if (total < 75) return 'AI-Трансформация';
  return 'AI-Лидер';
}

function calculateLeadScore(total: number, contact: any): number {
  let score = 0;
  if (contact.phone || contact.email) score += 25;
  if (contact.company) score += 10;
  if (total >= 35 && total <= 75) score += 15;
  return Math.min(score, 100);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Respondent id is required' }, { status: 400 });
  }

  try {
    const respondent = await getRespondentById(id);
    return NextResponse.json({ respondent });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to load respondent' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Respondent id is required' }, { status: 400 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    
    // If this is a feedback submission
    if (body.feedback) {
      const updatedRespondent = await updateRespondentFeedback(id, body.feedback);
      
      const SHEET_ID = process.env.GOOGLE_SHEET_ID;
      const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
      const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

      if (SHEET_ID && CLIENT_EMAIL && PRIVATE_KEY) {
        try {
          const auth = new google.auth.JWT({
            email: CLIENT_EMAIL,
            key: PRIVATE_KEY,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
          });

          const sheets = google.sheets({ version: 'v4', auth });
          const existing = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: 'Sheet1!A:AB',
          });
          const existingRows = existing.data.values || [];
          
          let foundRowIndex = -1;
          const headers = existingRows[0] || [];
          const idColIndex = headers.indexOf('ID');
          const feedbackColIndex = headers.indexOf('Обратная связь (JSON)');
          
          if (idColIndex !== -1 && feedbackColIndex !== -1) {
            for (let i = 1; i < existingRows.length; i++) {
              if (existingRows[i][idColIndex] === id) {
                foundRowIndex = i + 1;
                break;
              }
            }
          }
          
          if (foundRowIndex !== -1) {
            const getColumnLetter = (colIndex: number): string => {
              let temp = colIndex;
              let letter = '';
              while (temp >= 0) {
                letter = String.fromCharCode((temp % 26) + 65) + letter;
                temp = Math.floor(temp / 26) - 1;
              }
              return letter;
            };
            
            const feedbackColLetter = getColumnLetter(feedbackColIndex);
            await sheets.spreadsheets.values.update({
              spreadsheetId: SHEET_ID,
              range: `Sheet1!${feedbackColLetter}${foundRowIndex}`,
              valueInputOption: 'USER_ENTERED',
              requestBody: {
                values: [[JSON.stringify(body.feedback)]],
              },
            });
          }
        } catch (sheetErr) {
          console.error('Failed to sync feedback to Sheets:', sheetErr);
        }
      }
      
      return NextResponse.json({ respondent: updatedRespondent });
    }

    const contactInfo = body.contactInfo || {};
    const segmentInfo = body.segmentInfo || {};

    const respondent = await getRespondentById(id);
    if (!respondent) {
      return NextResponse.json({ error: 'Respondent not found' }, { status: 404 });
    }

    const answers = await getAnswersByRespondent(id);
    const questions = await getQuestionsBySurveyId(respondent.survey_id);

    // Calculate block scores dynamically
    const categories: string[] | null = respondent.survey_categories
      ? (typeof respondent.survey_categories === 'string' ? JSON.parse(respondent.survey_categories) : respondent.survey_categories)
      : null;

    const blockList: string[] = categories && categories.length > 0
      ? categories.map((_, idx) => `cat_${idx}`)
      : ['sales_support', 'automation', 'data_knowledge', 'predictive_ops', 'culture_ready'];

    const byBlock: Record<string, { sum: number; count: number }> = {};
    blockList.forEach((b) => {
      byBlock[b] = { sum: 0, count: 0 };
    });

    const answersMap: Record<string, string> = {};

    answers.forEach((ans) => {
      const q = questions.find((quest) => String(quest.id) === String(ans.question_id));
      if (!q) return;

      answersMap[q.text] = ans.value;

      const rawBlock = q.block?.trim() ?? '';
      const block = blockList.includes(rawBlock) ? rawBlock : blockList[0];

      let opts: string[] = [];
      if (typeof q.options === 'string') {
        try {
          opts = JSON.parse(q.options);
        } catch {
          opts = [];
        }
      } else if (Array.isArray(q.options)) {
        opts = q.options;
      }

      if (opts.length > 0) {
        const optIdx = opts.indexOf(ans.value);
        const score = optIdx >= 0 ? getOptionScore(optIdx, opts.length) : 0;
        byBlock[block].sum += score;
        byBlock[block].count += 1;
      }
    });

    const blockScores = {} as Record<string, number>;
    let totalSum = 0;
    let totalCount = 0;

    for (const block of blockList) {
      const { sum, count } = byBlock[block];
      blockScores[block] = count > 0 ? Math.round((sum / (count * 10)) * 100) : 0;
      totalSum += sum;
      totalCount += count;
    }

    const totalScore = totalCount > 0 ? Math.round((totalSum / (totalCount * 10)) * 100) : 0;
    const level = getLevelLabel(totalScore);
    const sortedBlocks = [...blockList].sort((a, b) => (blockScores[a] ?? 0) - (blockScores[b] ?? 0));
    const weakestBlocks = sortedBlocks.slice(0, 3);
    const strongestBlock = [...sortedBlocks].reverse()[0];
    const leadScore = calculateLeadScore(totalScore, contactInfo);

    // Save calculation to Postgres
    const updatedRespondent = await updateRespondentScoresAndContact({
      respondentId: id,
      contactInfo,
      segmentInfo,
      scores: blockScores,
      totalScore,
      level,
      leadScore,
      strongestBlock,
      weakestBlocks,
      answersJson: answersMap
    });

    // Save to Google Sheets if configured
    const SHEET_ID = process.env.GOOGLE_SHEET_ID;
    const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
    const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (SHEET_ID && CLIENT_EMAIL && PRIVATE_KEY) {
      try {
        const auth = new google.auth.JWT({
          email: CLIENT_EMAIL,
          key: PRIVATE_KEY,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const now = new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' });

        // Ensure headers
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: 'Sheet1!A1:AB1',
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [SHEET_HEADERS] },
        });

        const row = [
          now,
          totalScore,
          level,
          leadScore,
          JSON.stringify(blockScores),
          strongestBlock,
          weakestBlocks.join(', '),
          segmentInfo.industry ?? '',
          segmentInfo.companySize ?? '',
          segmentInfo.businessModel ?? '',
          segmentInfo.revenueStage ?? '',
          segmentInfo.city ?? '',
          contactInfo.name ?? '',
          contactInfo.company ?? '',
          contactInfo.phone ?? '',
          contactInfo.email ?? '',
          'survey_detail', // UTM Source
          '', // UTM Medium
          '', // UTM Campaign
          '', // UTM Content
          '', // UTM Term
          '', // Referrer
          `/survey/${respondent.survey_id}`, // Landing Path
          respondent.flags?.[0] || 'unknown', // Device
          'ru', // Language
          JSON.stringify(answersMap),
          '', // feedback
          id, // submission_id
        ];

        await sheets.spreadsheets.values.append({
          spreadsheetId: SHEET_ID,
          range: 'Sheet1!A:AB',
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [row] },
        });
      } catch (sheetErr) {
        console.error('Google Sheets append error in PATCH respondent:', sheetErr);
      }
    }

    return NextResponse.json({ respondent: updatedRespondent });
  } catch (error) {
    console.error('Failed to update respondent scores:', error);
    return NextResponse.json({ error: 'Failed to update respondent' }, { status: 500 });
  }
}
