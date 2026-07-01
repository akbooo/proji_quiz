import { getSurveyById, getQuestionsBySurveyId, incrementSurveyViewCount } from '@/lib/db';
import SurveyClient from './SurveyClient';
import { notFound } from 'next/navigation';

export default async function SurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const survey = await getSurveyById(id);
  
  if (!survey) {
    notFound();
  }

  const questions = await getQuestionsBySurveyId(id);
  
  // Track view
  await incrementSurveyViewCount(id);

  return (
    <SurveyClient survey={survey} questions={questions} />
  );
}
