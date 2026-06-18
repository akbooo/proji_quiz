import { NextRequest, NextResponse } from 'next/server';
import { createAnswerRecord } from '@/lib/db';

const FAST_ANSWER_THRESHOLD = 5;

export async function POST(request: NextRequest) {
  const { respondentId, questionId, value, timeSpentSec } = await request.json();

  if (!respondentId || !questionId || typeof value !== 'string' || typeof timeSpentSec !== 'number') {
    return NextResponse.json({ error: 'Invalid answer payload' }, { status: 400 });
  }

  try {
    const flags = timeSpentSec < FAST_ANSWER_THRESHOLD ? ['fast answer'] : [];
    const answer = await createAnswerRecord({ respondentId, questionId, value, timeSpentSec, flags });
    return NextResponse.json({ answer });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 });
  }
}
