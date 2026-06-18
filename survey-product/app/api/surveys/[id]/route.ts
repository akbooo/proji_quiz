import { NextRequest, NextResponse } from 'next/server';
import { getSurveyById } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id) {
    return NextResponse.json({ error: 'Survey id is required' }, { status: 400 });
  }

  try {
    const survey = await getSurveyById(id);
    return NextResponse.json({ survey });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to load survey' }, { status: 500 });
  }
}
