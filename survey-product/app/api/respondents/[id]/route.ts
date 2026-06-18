import { NextRequest, NextResponse } from 'next/server';
import { getRespondentById, updateRespondentFinishedAt } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id) {
    return NextResponse.json({ error: 'Respondent id is required' }, { status: 400 });
  }

  try {
    const respondent = await getRespondentById(id);
    return NextResponse.json({ respondent });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to load respondent' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id) {
    return NextResponse.json({ error: 'Respondent id is required' }, { status: 400 });
  }

  try {
    const respondent = await updateRespondentFinishedAt(id);
    return NextResponse.json({ respondent });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update respondent finish time' }, { status: 500 });
  }
}
