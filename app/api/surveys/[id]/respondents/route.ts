import { NextRequest, NextResponse } from 'next/server';
import { getSurveyRespondentsDetailed } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Survey ID is required' }, { status: 400 });
  }

  try {
    const respondents = await getSurveyRespondentsDetailed(id);
    return NextResponse.json({ respondents });
  } catch (error) {
    console.error('Respondents list error:', error);
    return NextResponse.json({ error: 'Failed to load respondents' }, { status: 500 });
  }
}
