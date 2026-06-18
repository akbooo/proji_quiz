'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface QuestionItem {
  id: number;
  text: string;
  icon: string | null;
  order: number;
  type: string;
}

export default function SurveyPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [survey, setSurvey] = useState<{ id: number; title: string; description: string } | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [status, setStatus] = useState('');
  const [questionStartAt, setQuestionStartAt] = useState<Record<number, number>>({});
  const [questionTimeSec, setQuestionTimeSec] = useState<Record<number, number>>({});
  const [pageOpenedAt] = useState(() => Date.now());
  const searchParams = useSearchParams();

  useEffect(() => {
    fetch(`/api/surveys/${params.id}`)
      .then((res) => res.json())
      .then((data) => setSurvey(data.survey));

    fetch(`/api/questions/${params.id}`)
      .then((res) => res.json())
      .then((data) => setQuestions(data.questions));
  }, [params.id]);

  const submit = async () => {
    if (!survey) return;
    setStatus('Сохраняем ответы...');

    const contactInfo = { name, email, phone };
    const respondentRes = await fetch('/api/respondents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ surveyId: survey.id, contactInfo }),
    });
    const respondentData = await respondentRes.json();

    if (!respondentData.respondentId) {
      setStatus('Ошибка регистрации респондента');
      return;
    }

    const respondentId = respondentData.respondentId;
    const submitTimeSec = Math.max(1, Math.round((Date.now() - pageOpenedAt) / 1000));

    await Promise.all(
      questions.map((question) => {
        const timeSpent = questionTimeSec[question.id] ?? submitTimeSec;
        return fetch('/api/answers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            respondentId,
            questionId: question.id,
            value: answers[question.id] ?? '',
            timeSpentSec: timeSpent,
          }),
        });
      }),
    );

    await fetch(`/api/respondents/${respondentId}`, {
      method: 'PATCH',
    });

    setStatus('Ответы сохранены');
    router.push(`/results/${respondentId}`);
  };

  return (
    <div className="page-wrap">
      <div className="card">
        <span className="label">{survey?.title || 'Загрузка...'}</span>
        <h1 className="screen-title">{survey?.title || 'Опрос'}</h1>
        <p className="screen-copy">{survey?.description || 'Загрузка опроса...'}</p>

        <div className="field-label">
          <label>Имя</label>
          <input className="field-control" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field-label">
          <label>Email</label>
          <input className="field-control" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field-label">
          <label>Телефон</label>
          <input className="field-control" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        {questions.map((question) => (
          <div key={question.id} className="field-label" style={{ marginTop: 18 }}>
            <label>{question.icon ? `${question.icon} ${question.text}` : question.text}</label>
            <textarea
              className="field-control"
              rows={3}
              value={answers[question.id] ?? ''}
              onFocus={() => {
                setQuestionStartAt((prev) => ({ ...prev, [question.id]: prev[question.id] || Date.now() }));
              }}
              onBlur={() => {
                const startedAt = questionStartAt[question.id];
                if (!startedAt) return;
                const spent = Math.round((Date.now() - startedAt) / 1000) || 1;
                setQuestionTimeSec((prev) => ({
                  ...prev,
                  [question.id]: (prev[question.id] ?? 0) + spent,
                }));
                setQuestionStartAt((prev) => {
                  const next = { ...prev };
                  delete next[question.id];
                  return next;
                });
              }}
              onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            />
          </div>
        ))}

        <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={submit}>Отправить ответы</button>
        {status && <p style={{ marginTop: 18, color: '#2c3e50' }}>{status}</p>}
      </div>
    </div>
  );
}
