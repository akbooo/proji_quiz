'use client';

import { useEffect, useState } from 'react';

interface AnswerItem {
  id: number;
  question_text: string;
  question_icon: string | null;
  value: string;
  time_spent_sec: number;
  flags: string[];
}

export default function ResultPage({ params }: { params: { respondentId: string } }) {
  const [answers, setAnswers] = useState<AnswerItem[]>([]);
  const [respondent, setRespondent] = useState<{ id: number; contact_info: { name: string; email: string; phone: string }; flags: string[] } | null>(null);

  useEffect(() => {
    fetch(`/api/respondents/${params.respondentId}`)
      .then((res) => res.json())
      .then((data) => setRespondent(data.respondent));

    fetch(`/api/answers/${params.respondentId}`)
      .then((res) => res.json())
      .then((data) => setAnswers(data.answers || []));
  }, [params.respondentId]);

  return (
    <div className="page-wrap">
      <div className="card">
        <span className="label">Результат респондента</span>
        <h1 className="screen-title">Ответы сохранены</h1>
        {respondent && (
          <p className="screen-copy">Контакт: {respondent.contact_info.name}, {respondent.contact_info.email}, {respondent.contact_info.phone}</p>
        )}

        <div style={{ marginTop: 20 }}>
          {answers.map((answer) => (
            <div key={answer.id} style={{ marginBottom: 18, padding: 16, background: 'rgba(255,255,255,0.9)', borderRadius: 12, border: '1px solid rgba(26,26,26,0.08)' }}>
              <strong>{answer.question_icon ? `${answer.question_icon} ` : ''}{answer.question_text}</strong>
              <p style={{ marginTop: 8 }}>{answer.value}</p>
              <small>Время: {answer.time_spent_sec}s</small>
              {answer.flags?.length > 0 && (
                <p style={{ marginTop: 8, color: '#bf1f1f' }}>Флаги: {answer.flags.join(', ')}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
