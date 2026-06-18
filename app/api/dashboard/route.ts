import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { BLOCKS, type Block } from '@/lib/quiz';

export const dynamic = 'force-dynamic';

type Row = Record<string, string>;

const blockNames: Record<Block, string> = {
  sales_support: 'Продажи и Клиентский сервис',
  automation: 'Рутинные процессы',
  data_knowledge: 'Данные и База знаний',
  predictive_ops: 'Операционка и Прогнозы',
  culture_ready: 'Культура и Готовность команды',
};

export async function GET() {
  try {
    const SHEET_ID = process.env.GOOGLE_SHEET_ID;
    const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
    const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!SHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
      return NextResponse.json(emptyDashboard(false));
    }

    const auth = new google.auth.JWT({
      email: CLIENT_EMAIL,
      key: PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A:AF',
    });

    const values = response.data.values || [];
    if (values.length <= 1) {
      return NextResponse.json(emptyDashboard(true));
    }

    const headers = values[0] as string[];
    const rows: Row[] = values.slice(1).map((valueRow) => {
      const row: Row = {};
      headers.forEach((header, index) => {
        row[header] = String(valueRow[index] ?? '');
      });
      return row;
    });

    const completed = rows.length;
    const contacts = rows.filter((row) => row['Телефон'] || row['Email']).length;
    const averageScore = average(rows.map((row) => numberValue(row['Score'])));
    const averageLeadScore = average(rows.map((row) => numberValue(row['Lead Score'])));
    const sourceCounts = countBy(rows.map((row) => row['UTM Source'] || 'direct'));
    const cityCounts = countBy(rows.map((row) => row['Город'] || 'Не указан'));
    const industryCounts = countBy(rows.map((row) => row['Сфера'] || 'Не указана'));
    const weakZones = getWeakZones(rows);

    const hotLeads = rows
      .filter((row) => numberValue(row['Lead Score']) >= 50 || row['Телефон'] || row['Email'])
      .sort((a, b) => numberValue(b['Lead Score']) - numberValue(a['Lead Score']))
      .slice(0, 10)
      .map((row) => ({
        date: row['Дата'],
        name: row['Имя'] || 'Без имени',
        company: row['Компания'] || '',
        contact: row['Телефон'] || row['Email'] || '',
        score: numberValue(row['Score']),
        leadScore: numberValue(row['Lead Score']),
        weakZones: row['Слабые зоны'] || '',
        source: row['UTM Source'] || 'direct',
      }));

    return NextResponse.json({
      connected: true,
      completed,
      contacts,
      contactRate: completed ? Math.round((contacts / completed) * 100) : 0,
      averageScore,
      averageLeadScore,
      sourceCounts,
      cityCounts,
      industryCounts,
      weakZones,
      hotLeads,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ ...emptyDashboard(false), error: 'Не удалось загрузить Google Sheets' });
  }
}

function emptyDashboard(connected: boolean) {
  return {
    connected,
    completed: 0,
    contacts: 0,
    contactRate: 0,
    averageScore: 0,
    averageLeadScore: 0,
    sourceCounts: {},
    cityCounts: {},
    industryCounts: {},
    weakZones: Object.fromEntries(Object.keys(BLOCKS).map((block) => [block, 0])),
    hotLeads: [],
  };
}

function numberValue(value: string | undefined): number {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function average(values: number[]): number {
  const filtered = values.filter((value) => Number.isFinite(value));
  if (!filtered.length) return 0;
  return Math.round(filtered.reduce((sum, value) => sum + value, 0) / filtered.length);
}

function countBy(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function getWeakZones(rows: Row[]): Record<string, number> {
  const counts: Record<string, number> = Object.fromEntries(Object.keys(BLOCKS).map((block) => [block, 0]));

  for (const row of rows) {
    const scored = (Object.keys(blockNames) as Block[])
      .map((block) => ({ block, score: numberValue(row[blockNames[block]]) }))
      .sort((a, b) => a.score - b.score);

    for (const item of scored.slice(0, 2)) {
      counts[item.block] += 1;
    }
  }

  return counts;
}
