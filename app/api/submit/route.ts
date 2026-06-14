import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const SHEET_HEADERS = [
  'Дата',
  'Score',
  'Уровень',
  'Lead Score',
  'Продажи',
  'Автоматизация',
  'Данные',
  'Команда',
  'AI',
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
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      answers = {},
      segment = {},
      contact = {},
      tracking = {},
      scores = {},
      total,
      level,
      leadScore,
      weakestBlocks = [],
      strongestBlock = '',
    } = body;

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

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A1:AD1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [SHEET_HEADERS] },
    });

    const row = [
      now,
      total,
      level,
      leadScore,
      scores.sales ?? '',
      scores.automation ?? '',
      scores.data ?? '',
      scores.team ?? '',
      scores.ai ?? '',
      strongestBlock,
      weakestBlocks.join(', '),
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
      JSON.stringify(answers),
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A:AD',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] },
    });

    return NextResponse.json({ ok: true, saved: true });
  } catch (err) {
    console.error('Sheets error:', err);
    return NextResponse.json({ ok: true, saved: false });
  }
}
