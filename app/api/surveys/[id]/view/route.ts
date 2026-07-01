import { NextRequest, NextResponse } from 'next/server';
import { incrementSurveyViewCount } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Survey id is required' }, { status: 400 });
  }

  try {
    await incrementSurveyViewCount(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('View tracking error:', error);
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
  }
}
