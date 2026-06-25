import { NextRequest, NextResponse } from 'next/server';
import { createRespondentRecord, findRespondentDuplicateContact } from '@/lib/db';

export async function POST(request: NextRequest) {
  const { surveyId, contactInfo } = await request.json();

  if (!surveyId || !contactInfo) {
    return NextResponse.json({ error: 'surveyId and contactInfo are required' }, { status: 400 });
  }

  try {
    const existing = await findRespondentDuplicateContact(surveyId, contactInfo);
    if (existing) {
      return NextResponse.json({ respondentId: existing.id, duplicate: true });
    }

    const respondent = await createRespondentRecord({ surveyId, contactInfo });
    return NextResponse.json({ respondentId: respondent.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create respondent' }, { status: 500 });
  }
}
