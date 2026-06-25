import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { saveSubmissionRecord } from '@/lib/db';

const SHEET_HEADERS = [
  'Дата',
  'Score',
  'Уровень',
  'Lead Score',
  'Продажи и Клиентский сервис',
  'Рутинные процессы',
  'Данные и База знаний',
  'Операционка и Прогнозы',
  'Культура и Готовность команды',
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

function getColumnLetter(colIndex: number): string {
  let temp = colIndex;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      submissionId,
      surveyId,
      answers = {},
      feedback = {},
      segment = {},
      contact = {},
      tracking = {},
      scores = {},
      total = 0,
      level = '',
      leadScore = 0,
      weakestBlocks = [],
      strongestBlock = '',
    } = body;

    // Save to local PostgreSQL database
    let dbRespondentId = null;
    try {
      dbRespondentId = await saveSubmissionRecord({
        submissionId,
        surveyId,
        answers,
        segment,
        contact,
        tracking,
        scores,
        total,
        level,
        leadScore,
        weakestBlocks,
        strongestBlock,
        feedback,
      });
    } catch (dbErr) {
      console.error('PostgreSQL save error:', dbErr);
    }

    const SHEET_ID = process.env.GOOGLE_SHEET_ID;
    const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
    const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!SHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
      console.warn('Google Sheets env vars not set - skipping save');
      return NextResponse.json({ ok: true, saved: false });
    }

    const auth = new google.auth.JWT({
      email: CLIENT_EMAIL,
      key: PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const now = new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' });

    // Always ensure the headers match the latest definition
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A1:AF1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [SHEET_HEADERS] },
    });

    // Check for existing rows to handle update vs append
    let existingRows: any[][] = [];
    try {
      const existing = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'Sheet1!A:AF',
      });
      existingRows = existing.data.values || [];
    } catch (err) {
      console.warn('Duplicate check: failed to fetch existing rows, proceeding to append', err);
    }

    let foundRowIndex = -1;
    let idColIndex = SHEET_HEADERS.indexOf('ID');
    let feedbackColIndex = SHEET_HEADERS.indexOf('Обратная связь (JSON)');

    if (existingRows.length > 0) {
      const headers = existingRows[0];
      const foundIdIndex = headers.indexOf('ID');
      if (foundIdIndex !== -1) idColIndex = foundIdIndex;

      const foundFeedbackIndex = headers.indexOf('Обратная связь (JSON)');
      if (foundFeedbackIndex !== -1) feedbackColIndex = foundFeedbackIndex;

      if (submissionId && idColIndex !== -1) {
        for (let i = 1; i < existingRows.length; i++) {
          if (existingRows[i][idColIndex] === submissionId) {
            foundRowIndex = i + 1; // 1-based index in Google Sheets
            break;
          }
        }
      }
    }

    // If row exists, we update or skip
    if (foundRowIndex !== -1) {
      const hasFeedback = feedback && Object.keys(feedback).length > 0;
      if (hasFeedback && feedbackColIndex !== -1) {
        const feedbackColLetter = getColumnLetter(feedbackColIndex);
        const updateRange = `Sheet1!${feedbackColLetter}${foundRowIndex}`;

        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: updateRange,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[JSON.stringify(feedback)]],
          },
        });

        return NextResponse.json({ ok: true, saved: true, updated: true });
      }

      // If it's a duplicate request without feedback, return success without appending
      return NextResponse.json({ ok: true, saved: true, duplicate: true });
    }

    // Otherwise, append new row
    const row = [
      now,
      total,
      level,
      leadScore,
      scores.sales_support ?? '',
      scores.automation ?? '',
      scores.data_knowledge ?? '',
      scores.predictive_ops ?? '',
      scores.culture_ready ?? '',
      strongestBlock,
      Array.isArray(weakestBlocks) ? weakestBlocks.join(', ') : '',
      segment.industry ?? '',
      segment.companySize ?? '',
      segment.businessModel ?? '',
      segment.revenueStage ?? '',
      segment.city ?? '',
      contact.name ?? '',
      contact.company ?? '',
      contact.phone ?? '',
      contact.email ?? '',
      tracking.utm_source || 'direct',
      tracking.utm_medium || '',
      tracking.utm_campaign || '',
      tracking.utm_content || '',
      tracking.utm_term || '',
      tracking.referrer || '',
      tracking.landingPath || '',
      tracking.device || '',
      tracking.language || '',
      answers && Object.keys(answers).length > 0 ? JSON.stringify(answers) : '',
      feedback && Object.keys(feedback).length > 0 ? JSON.stringify(feedback) : '',
      submissionId ?? '',
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A:AF',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] },
    });

    return NextResponse.json({ ok: true, saved: true });
  } catch (err) {
    console.error('Sheets submit error:', err);
    return NextResponse.json({ ok: true, saved: false });
  }
}
