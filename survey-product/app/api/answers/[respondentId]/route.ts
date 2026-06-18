import { NextRequest, NextResponse } from 'next/server';
import { getAnswersByRespondent } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { respondentId: string } }) {
  const respondentId = Number(params.respondentId);
  if (!respondentId) {
    return NextResponse.json({ error: 'Respondent id is required' }, { status: 400 });
  }

  try {
    const answers = await getAnswersByRespondent(respondentId);
    return NextResponse.json({ answers });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to load answers' }, { status: 500 });
  }
}
