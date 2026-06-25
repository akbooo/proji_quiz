import { NextRequest, NextResponse } from 'next/server';
import { deleteQuestionsBySurveyId, createQuestionRecord, getSurveyById } from '@/lib/db';
import { generateSurveyFromPrompt, buildSurveyPrompt } from '@/lib/survey';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Survey ID is required' }, { status: 400 });
  }

  const body = await request.json();
  const { questionCount, tone, focus, extraContext } = body;

  const count = typeof questionCount === 'number' && [3, 5, 7, 12].includes(questionCount)
    ? questionCount
    : 7;

  try {
    // Load existing survey for title/description
    const survey = await getSurveyById(id);
    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Build prompt and generate new questions
    const promptText = buildSurveyPrompt(
      survey.title,
      survey.description,
      count,
      tone,
      focus,
      extraContext,
    );
    const draft = await generateSurveyFromPrompt(promptText, survey.title, survey.description, count);

    // Delete existing questions
    await deleteQuestionsBySurveyId(id);

    // Insert new questions
    await Promise.all(
      draft.questions.map((question, index) =>
        createQuestionRecord({
          surveyId: id,
          text: question.text,
          icon: question.icon,
          order: index + 1,
          type: question.type,
          block: question.block,
          options: question.options,
        })
      )
    );

    return NextResponse.json({ ok: true, questionCount: draft.questions.length });
  } catch (error) {
    console.error('Regenerate error:', error);
    return NextResponse.json({ error: 'Failed to regenerate questions' }, { status: 500 });
  }
}
