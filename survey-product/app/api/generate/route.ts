import { NextRequest, NextResponse } from 'next/server';
import { generateSurveyFromPrompt } from '@/lib/survey';

export async function POST(request: NextRequest) {
  const { title, description } = await request.json();

  if (!title || !description) {
    return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
  }

  try {
    const draft = await generateSurveyFromPrompt(`Заголовок: ${title}\nОписание: ${description}`);
    return NextResponse.json({ draft });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate survey draft' }, { status: 500 });
  }
}
