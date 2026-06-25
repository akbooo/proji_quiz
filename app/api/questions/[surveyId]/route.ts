import { NextRequest, NextResponse } from 'next/server';
import { getQuestionsBySurveyId } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ surveyId: string }> }) {
  const { surveyId } = await params;
  if (!surveyId) {
    return NextResponse.json({ error: 'surveyId is required' }, { status: 400 });
  }

  try {
    const questions = await getQuestionsBySurveyId(surveyId);
    return NextResponse.json({ questions });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 });
  }
}
