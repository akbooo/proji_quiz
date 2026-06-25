import { NextRequest, NextResponse } from 'next/server';
import { getAnswersByRespondent } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ respondentId: string }> }) {
  const { respondentId } = await params;
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
