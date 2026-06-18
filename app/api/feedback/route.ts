import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const FEEDBACK_HEADERS = [
  'Дата',
  'Score',
  'Уровень',
  'Lead Score',
  'Сфера',
  'Размер команды',
  'Модель продаж',
  'Стадия',
  'Город',
  'Имя',
  'Компания',
  'Телефон',
  'Email',
  'Feedback Q1',
  'Feedback Q2',
  'Feedback Q3',
  'Feedback JSON',
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      feedback = {},
      total,
      level,
      leadScore,
      segment = {},
      contact = {},
    } = body;

    const SHEET_ID = process.env.GOOGLE_SHEET_ID;
    const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
    const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!SHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
      console.warn('Google Sheets env vars not set - skipping feedback save');
      return NextResponse.json({ ok: true, saved: false });
    }

    const auth = new google.auth.JWT({
      email: CLIENT_EMAIL,
      key: PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const now = new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' });
    const sheetName = 'Feedback';

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${sheetName}!A1:Q1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [FEEDBACK_HEADERS] },
    });

    const row = [
      now,
      total,
      level,
      leadScore,
      segment.industry ?? '',
      segment.companySize ?? '',
      segment.businessModel ?? '',
      segment.revenueStage ?? '',
      segment.city ?? '',
      contact.name ?? '',
      contact.company ?? '',
      contact.phone ?? '',
      contact.email ?? '',
      feedback.f1 ?? '',
      feedback.f2 ?? '',
      feedback.f3 ?? '',
      JSON.stringify(feedback),
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${sheetName}!A:Q`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] },
    });

    return NextResponse.json({ ok: true, saved: true });
  } catch (err) {
    console.error('Feedback save error:', err);
    return NextResponse.json({ ok: false, saved: false });
  }
}
