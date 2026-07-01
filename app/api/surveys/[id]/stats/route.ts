import { NextRequest, NextResponse } from 'next/server';
import { getSurveyStats } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Survey id is required' }, { status: 400 });
  }

  try {
    const stats = await getSurveyStats(id);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
