'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface AnswerItem {
  id: number;
  question_text: string;
  question_icon: string | null;
  value: string;
  time_spent_sec: number;
  flags: string[];
}

interface RespondentInfo {
  id: number;
  contact_info: {
    name: string;
    email: string;
    phone: string;
  };
  flags: string[];
}

export default function ResultPage() {
  const params = useParams();
  const respondentId = params.respondentId as string;
  const router = useRouter();

  const [answers, setAnswers] = useState<AnswerItem[]>([]);
  const [respondent, setRespondent] = useState<RespondentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!respondentId) return;

    const loadData = async () => {
      try {
        const respRes = await fetch(`/api/respondents/${respondentId}`);
        const respData = await respRes.json();
        setRespondent(respData.respondent);

        const answersRes = await fetch(`/api/answers/${respondentId}`);
        const answersData = await answersRes.json();
        setAnswers(answersData.answers || []);
      } catch (err) {
        console.error('Failed to load results', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [respondentId]);

  if (loading) {
    return (
      <div className="page-wrap">
        <div style={{ color: 'var(--text3)', fontWeight: 500 }}>Загружаем результаты...</div>
      </div>
    );
  }

  return (
    <div className="page-wrap page-wrap-scroll" style={{ width: '100%', maxWidth: '720px', margin: '0 auto' }}>
      <div className="card" style={{ width: '100%', maxWidth: '720px', marginBottom: 20 }}>
        <span className="label" style={{ color: 'var(--primary-blue)' }}>Результат опроса</span>
        <h1 className="screen-title" style={{ marginTop: 8, marginBottom: 12 }}>Ответы успешно сохранены</h1>
        
        {respondent && (
          <div style={{ 
            padding: '16px 20px', 
            background: 'rgba(255, 255, 255, 0.4)', 
            border: '1px solid var(--border)', 
            borderRadius: 'var(--radius)',
            marginBottom: 28,
            fontSize: '14px',
            color: 'var(--text2)',
            lineHeight: 1.6
          }}>
            <div><strong>Имя:</strong> {respondent.contact_info.name}</div>
            <div><strong>Email:</strong> {respondent.contact_info.email}</div>
            <div><strong>Телефон:</strong> {respondent.contact_info.phone}</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {answers.map((answer) => (
            <div 
              key={answer.id} 
              style={{ 
                padding: '20px', 
                background: 'rgba(255, 255, 255, 0.65)', 
                borderRadius: 'var(--radius)', 
                border: '1px solid var(--border)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)'
              }}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ fontSize: '20px', lineHeight: 1 }}>{answer.question_icon || '📝'}</span>
                <strong style={{ fontSize: '15px', color: 'var(--text)', lineHeight: 1.4 }}>
                  {answer.question_text}
                </strong>
              </div>
              
              <div style={{ 
                padding: '12px 14px', 
                background: '#ffffff', 
                borderRadius: '6px', 
                border: '1px solid rgba(26,26,26,0.06)',
                color: 'var(--text2)',
                fontSize: '14px',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap'
              }}>
                {answer.value}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, fontSize: '12px', color: 'var(--text3)' }}>
                <span>Время на ответ: {answer.time_spent_sec} сек</span>
                {answer.flags?.length > 0 && (
                  <span style={{ 
                    color: '#c0392b', 
                    background: 'rgba(192, 57, 43, 0.1)', 
                    padding: '2px 8px', 
                    borderRadius: '4px',
                    fontWeight: 600
                  }}>
                    {answer.flags.join(', ')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link href="/admin">
            <button className="btn btn-primary">Создать новый опрос</button>
          </Link>
          <Link href="/">
            <button className="btn btn-ghost">На главную</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
