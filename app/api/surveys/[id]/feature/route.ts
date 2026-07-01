import { NextRequest, NextResponse } from 'next/server';
import { toggleSurveyFeatured } from '@/lib/db';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Survey id is required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    if (typeof body.is_featured !== 'boolean') {
      return NextResponse.json({ error: 'is_featured must be a boolean' }, { status: 400 });
    }

    const survey = await toggleSurveyFeatured(id, body.is_featured);
    return NextResponse.json({ survey });
  } catch (error) {
    console.error('Failed to toggle featured status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
