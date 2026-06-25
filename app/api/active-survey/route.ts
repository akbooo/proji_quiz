import { NextResponse } from 'next/server';
import { getActiveSurveyWithQuestions } from '@/lib/db';

export async function GET() {
  try {
    const data = await getActiveSurveyWithQuestions();
    if (!data) {
      return NextResponse.json({ survey: null, questions: [] });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to load active survey:', error);
    return NextResponse.json({ survey: null, questions: [] });
  }
}
