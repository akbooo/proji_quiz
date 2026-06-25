'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface QuestionItem {
  id: number;
  text: string;
  icon: string | null;
  order: number;
  type: string;
  options?: string[] | null;
}

type Step = 'contact' | 'questions';

export default function SurveyPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [survey, setSurvey] = useState<{ id: number; title: string; description: string } | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [step, setStep] = useState<Step>('contact');
  const [current, setCurrent] = useState(0);

  // Contacts
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Answers mapping question.id -> string answer value
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState('');

  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Timing tracking
  const [questionShownAt, setQuestionShownAt] = useState<number>(0);
  const [questionTimeSec, setQuestionTimeSec] = useState<Record<number, number>>({});
  const [pageOpenedAt] = useState(() => Date.now());

  // Load survey details and questions
  useEffect(() => {
    if (!id) return;

    fetch(`/api/surveys/${id}`)
      .then((res) => res.json())
      .then((data) => setSurvey(data.survey))
      .catch((err) => console.error('Failed to load survey', err));

    fetch(`/api/questions/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.questions) {
          // Sort by order
          const sorted = [...data.questions].sort((a, b) => a.order - b.order);
          setQuestions(sorted);
        }
      })
      .catch((err) => console.error('Failed to load questions', err));
  }, [id]);

  const total = questions.length;
  const q = questions[current];
  
  // Progress calculations
  const progress = step === 'contact'
    ? 10
    : 15 + ((current + 1) / total) * 85;

  const canStart = name.trim().length > 0 && email.trim().length > 0 && phone.trim().length > 0;

  const handleStart = () => {
    if (!canStart) return;
    setStep('questions');
    setCurrent(0);
    setQuestionShownAt(Date.now());
  };

  const handleNext = () => {
    if (!q) return;

    // Calculate elapsed time for current question
    const elapsed = Math.max(1, Math.round((Date.now() - questionShownAt) / 1000));
    const newTimeSec = {
      ...questionTimeSec,
      [q.id]: (questionTimeSec[q.id] ?? 0) + elapsed
    };
    setQuestionTimeSec(newTimeSec);

    // Save answer
    const hasOptions = Array.isArray(q.options) && q.options.length > 0;
    const val = hasOptions ? selected : textAnswer;
    const newAnswers = { ...answers, [q.id]: val ?? '' };
    setAnswers(newAnswers);

    if (current < total - 1) {
      const nextIndex = current + 1;
      setCurrent(nextIndex);
      
      // Initialize states for the next question
      const nextQ = questions[nextIndex];
      const nextHasOptions = Array.isArray(nextQ.options) && nextQ.options.length > 0;
      if (nextHasOptions) {
        setSelected(newAnswers[nextQ.id] ?? null);
      } else {
        setTextAnswer(newAnswers[nextQ.id] ?? '');
      }

      setQuestionShownAt(Date.now());
      return;
    }

    // Submit if it is the last question
    submitAndShowResult(newAnswers, newTimeSec);
  };

  const handleBack = () => {
    if (!q) return;

    // Calculate elapsed time for current question and save draft
    const elapsed = Math.max(1, Math.round((Date.now() - questionShownAt) / 1000));
    const newTimeSec = {
      ...questionTimeSec,
      [q.id]: (questionTimeSec[q.id] ?? 0) + elapsed
    };
    setQuestionTimeSec(newTimeSec);

    const hasOptions = Array.isArray(q.options) && q.options.length > 0;
    const val = hasOptions ? selected : textAnswer;
    const newAnswers = { ...answers, [q.id]: val ?? '' };
    setAnswers(newAnswers);

    if (current === 0) {
      setStep('contact');
      return;
    }

    const prevIndex = current - 1;
    setCurrent(prevIndex);

    // Initialize states for the previous question
    const prevQ = questions[prevIndex];
    const prevHasOptions = Array.isArray(prevQ.options) && prevQ.options.length > 0;
    if (prevHasOptions) {
      setSelected(newAnswers[prevQ.id] ?? null);
    } else {
      setTextAnswer(newAnswers[prevQ.id] ?? '');
    }

    setQuestionShownAt(Date.now());
  };

  const submitAndShowResult = async (
    finalAnswers: Record<number, string>,
    finalTimeSec: Record<number, number>
  ) => {
    if (submitting) return;
    setSubmitting(true);
    setStatus('Сохраняем ответы...');

    try {
      const contactInfo = { name, email, phone };
      const respondentRes = await fetch('/api/respondents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyId: survey!.id, contactInfo }),
      });
      const respondentData = await respondentRes.json();

      if (!respondentData.respondentId) {
        setStatus('Ошибка регистрации респондента');
        setSubmitting(false);
        return;
      }

      const respondentId = respondentData.respondentId;
      const totalTimeSec = Math.max(1, Math.round((Date.now() - pageOpenedAt) / 1000));

      await Promise.all(
        questions.map((question) => {
          const timeSpent = finalTimeSec[question.id] ?? Math.max(1, Math.round(totalTimeSec / total));
          return fetch('/api/answers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              respondentId,
              questionId: question.id,
              value: finalAnswers[question.id] ?? '',
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
    } catch (err) {
      console.error(err);
      setStatus('Ошибка при сохранении ответов');
      setSubmitting(false);
    }
  };

  if (!survey || questions.length === 0) {
    return (
      <div className="page-wrap">
        <div style={{ color: 'var(--text3)', fontWeight: 500 }}>Загружаем опрос...</div>
      </div>
    );
  }

  const hasOptions = q ? (Array.isArray(q.options) && q.options.length > 0) : false;
  const isAnswered = q ? (hasOptions ? selected !== null : textAnswer.trim().length > 0) : false;

  return (
    <div className="page-wrap">
      <div className="card">
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <span className="label">
              {step === 'contact' && 'Контактная информация'}
              {step === 'questions' && q && `${q.icon || '📝'} Опрос: ${survey.title}`}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text3)' }}>
              {step === 'questions' ? `${current + 1} / ${total}` : '1 / 2'}
            </span>
          </div>

          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%`, background: 'var(--primary-blue)' }} />
          </div>
        </div>

        {step === 'contact' && (
          <>
            <h1 className="screen-title">{survey.title}</h1>
            <p className="screen-copy">
              {survey.description || 'Пожалуйста, заполните форму ниже, чтобы начать опрос.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label className="field-label">
                Ваше имя
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Иван Иванов"
                  className="field-control"
                />
              </label>

              <label className="field-label">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ivan@example.com"
                  className="field-control"
                />
              </label>

              <label className="field-label">
                Телефон
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (707) 123-45-67"
                  className="field-control"
                />
              </label>
            </div>

            <button
              className="btn btn-primary"
              disabled={!canStart}
              onClick={handleStart}
              style={{ width: '100%', marginTop: 28 }}
            >
              Начать опрос →
            </button>
          </>
        )}

        {step === 'questions' && q && (
          <>
            <h2 className="screen-title">{q.text}</h2>

            {hasOptions ? (
              <div className="option-list">
                {q.options!.map((opt) => {
                  const isSelected = selected === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => setSelected(opt)}
                      className="option-button"
                      style={{
                        background: isSelected ? 'rgba(16, 47, 93, 0.08)' : 'rgba(255,255,255,0.03)',
                        borderColor: isSelected ? 'var(--primary-blue)' : 'rgba(255,255,255,0.08)',
                        color: isSelected ? '#1a1a1a' : '#2c3e50',
                      }}
                    >
                      <span
                        className="radio-dot"
                        style={{
                          borderColor: isSelected ? 'var(--primary-blue)' : 'rgba(255,255,255,0.22)',
                          background: isSelected ? 'var(--primary-blue)' : 'transparent',
                        }}
                      >
                        {isSelected && <span />}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ margin: '24px 0 32px' }}>
                <textarea
                  className="field-control"
                  rows={4}
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="Введите ваш ответ здесь..."
                  style={{ resize: 'vertical' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="btn btn-ghost"
                onClick={handleBack}
                disabled={submitting}
              >
                ← Назад
              </button>
              <button
                className="btn btn-primary"
                onClick={handleNext}
                disabled={!isAnswered || submitting}
                style={{ flex: 1 }}
              >
                {current === total - 1 ? (submitting ? 'Отправка...' : 'Отправить ответы →') : 'Следующий вопрос →'}
              </button>
            </div>

            {status && (
              <p style={{ marginTop: 18, color: 'var(--primary-blue)', fontWeight: 500, textAlign: 'center' }}>
                {status}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
