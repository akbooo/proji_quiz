import { NextRequest, NextResponse } from 'next/server';
import { createSurveyRecord, createQuestionRecord, getSurveysWithCounts } from '@/lib/db';
import { generateSurveyFromPrompt, buildSurveyPrompt } from '@/lib/survey';

export async function GET() {
  try {
    const surveys = await getSurveysWithCounts();
    return NextResponse.json({ surveys });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to load surveys' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, questionCount, tone, focus, extraContext, categories } = body;

  if (!title || !description) {
    return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
  }

  const count = typeof questionCount === 'number' && [3, 5, 7, 12].includes(questionCount) ? questionCount : 7;

  try {
    const promptText = buildSurveyPrompt(title, description, count, tone, focus, extraContext, categories);
    const draft = await generateSurveyFromPrompt(promptText, title, description, count);
    const survey = await createSurveyRecord({ title: draft.title, description: draft.description, promptSource: 'groq', promptText, categories });

    await Promise.all(
      draft.questions.map((question, index) =>
        createQuestionRecord({ 
          surveyId: survey.id, 
          text: question.text, 
          icon: question.icon, 
          order: index + 1, 
          type: question.type,
          block: question.block,
          options: question.options
        }),
      ),
    );

    return NextResponse.json({ surveyId: survey.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create survey' }, { status: 500 });
  }
}
