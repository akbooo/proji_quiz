import { NextRequest, NextResponse } from 'next/server';
import { createSurveyRecord, createQuestionRecord } from '@/lib/db';
import { generateSurveyFromPrompt, buildSurveyPrompt } from '@/lib/survey';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description } = body;

  if (!title || !description) {
    return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
  }

  try {
    const promptText = buildSurveyPrompt(title, description);
    const draft = await generateSurveyFromPrompt(promptText);
    const survey = await createSurveyRecord({ title: draft.title, description: draft.description, promptSource: 'groq', promptText });

    await Promise.all(
      draft.questions.map((question, index) =>
        createQuestionRecord({ surveyId: survey.id, text: question.text, icon: question.icon, order: index + 1, type: question.type }),
      ),
    );

    return NextResponse.json({ surveyId: survey.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create survey' }, { status: 500 });
  }
}
