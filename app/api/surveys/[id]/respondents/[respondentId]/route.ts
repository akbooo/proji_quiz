import { NextRequest, NextResponse } from 'next/server';
import { getRespondentDrilldown } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; respondentId: string }> }
) {
  const { respondentId } = await params;
  if (!respondentId) {
    return NextResponse.json({ error: 'Respondent ID is required' }, { status: 400 });
  }

  try {
    const drilldown = await getRespondentDrilldown(respondentId);
    if (!drilldown) {
      return NextResponse.json({ error: 'Respondent not found' }, { status: 404 });
    }
    return NextResponse.json(drilldown);
  } catch (error) {
    console.error('Respondent drilldown error:', error);
    return NextResponse.json({ error: 'Failed to load respondent drilldown' }, { status: 500 });
  }
}
