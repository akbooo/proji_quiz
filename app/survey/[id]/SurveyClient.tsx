'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BLOCKS, SEGMENT_FIELDS, cleanOptionText, type Block } from '@/lib/quiz';

interface QuestionItem {
  id: string;
  text: string;
  icon: string | null;
  order: number;
  type: string;
  options?: string[] | null;
}

type Step = 'welcome' | 'segment' | 'questions' | 'contact';

const DEFAULT_EMOJIS = ['📊', '⚙️', '👥', '📈', '💰', '📝', '🤖', '💡'];

export default function SurveyClient({
  survey,
  questions,
}: {
  survey: { id: string; title: string; description: string; categories: string[] | null };
  questions: QuestionItem[];
}) {
  const router = useRouter();

  const [step, setStep] = useState<Step>('welcome');
  const [current, setCurrent] = useState(0);

  // Contacts
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Segment fields
  const [segment, setSegment] = useState<Record<string, string>>({
    industry: '',
    companySize: '',
    businessModel: '',
    revenueStage: '',
  });

  // Answers mapping question.id -> string answer value
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState('');

  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [respondentId, setRespondentId] = useState<string | null>(null);

  // Timing tracking
  const [questionShownAt, setQuestionShownAt] = useState<number>(0);
  const [questionTimeSec, setQuestionTimeSec] = useState<Record<string, number>>({});

  const total = questions.length;
  const q = questions[current];
  
  // Progress calculations
  const progress = step === 'welcome'
    ? 5
    : step === 'segment'
    ? 12
    : step === 'questions'
    ? 20 + ((current + 1) / total) * 70
    : 95;

  const handleStart = async () => {
    if (submitting) return;
    setSubmitting(true);
    setStatus('Запуск опроса...');
    try {
      // Create respondent (start)
      const res = await fetch('/api/respondents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyId: survey.id, contactInfo: {} }),
      });
      const data = await res.json();
      if (data.respondentId) {
        setRespondentId(data.respondentId);
        setStep('segment');
        setStatus('');
      } else {
        setStatus('Не удалось начать опрос. Попробуйте еще раз.');
      }
    } catch (err) {
      console.error(err);
      setStatus('Ошибка сети при начале опроса.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (!q || !respondentId) return;

    // Calculate elapsed time for current question
    const elapsed = Math.max(1, Math.round((Date.now() - questionShownAt) / 1000));
    const newTimeSec = {
      ...questionTimeSec,
      [q.id]: (questionTimeSec[q.id] ?? 0) + elapsed
    };
    setQuestionTimeSec(newTimeSec);

    // Save answer locally
    const hasOptions = Array.isArray(q.options) && q.options.length > 0;
    const val = hasOptions ? selected : textAnswer;
    const newAnswers = { ...answers, [q.id]: val ?? '' };
    setAnswers(newAnswers);

    // Save answer to DB
    fetch('/api/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        respondentId,
        questionId: q.id,
        value: val ?? '',
        timeSpentSec: elapsed,
      }),
    }).catch((err) => console.error('Failed to save answer to server', err));

    if (current < total - 1) {
      const nextIndex = current + 1;
      setCurrent(nextIndex);
      
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

    // Go to contact form step (questions complete)
    setStep('contact');
  };

  const handleBack = () => {
    if (!q) return;

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
      setStep('segment');
      return;
    }

    const prevIndex = current - 1;
    setCurrent(prevIndex);

    const prevQ = questions[prevIndex];
    const prevHasOptions = Array.isArray(prevQ.options) && prevQ.options.length > 0;
    if (prevHasOptions) {
      setSelected(newAnswers[prevQ.id] ?? null);
    } else {
      setTextAnswer(newAnswers[prevQ.id] ?? '');
    }

    setQuestionShownAt(Date.now());
  };

  const submitAndShowResult = async (skip = false) => {
    if (submitting || !respondentId) return;
    setSubmitting(true);
    setStatus('Завершаем опрос...');

    const contactInfo = skip ? {} : { name, email, phone };

    try {
      // Calculate scores on server side & set finished_at (complete / contact)
      const res = await fetch(`/api/respondents/${respondentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactInfo, segmentInfo: segment }),
      });

      if (res.ok) {
        setStatus('Ответы сохранены!');
        router.push(`/results/${respondentId}`);
      } else {
        setStatus('Ошибка при сохранении ответов');
        setSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setStatus('Ошибка сети при сохранении ответов');
      setSubmitting(false);
    }
  };

  const hasOptions = q ? (Array.isArray(q.options) && q.options.length > 0) : false;
  const isAnswered = q ? (hasOptions ? selected !== null : textAnswer.trim().length > 0) : false;

  const categoriesList = survey.categories
    ? (typeof survey.categories === 'string' ? JSON.parse(survey.categories) : survey.categories)
    : null;

  // Resolve Categories/Blocks
  let displayBlocks: Array<{ id: string; label: string; emoji: string }> = [];
  const blockList = Object.keys(BLOCKS) as Block[];

  if (categoriesList && categoriesList.length > 0) {
    displayBlocks = categoriesList.map((cat: string, idx: number) => ({
      id: `cat_${idx}`,
      label: cat,
      emoji: DEFAULT_EMOJIS[idx % DEFAULT_EMOJIS.length],
    }));
  } else {
    displayBlocks = blockList.map((block) => ({
      id: block,
      label: BLOCKS[block].label,
      emoji: BLOCKS[block].emoji,
    }));
  }

  const canContinueSegment = SEGMENT_FIELDS.every((field) => segment[field.id]?.trim().length > 0);

  return (
    <div className="page-wrap">
      <div className="card">
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <span className="label">
              {step === 'welcome' && 'Добро пожаловать'}
              {step === 'segment' && 'Контекст бизнеса'}
              {step === 'questions' && q && `${q.icon || '📝'} Вопрос`}
              {step === 'contact' && 'Контакты для связи'}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text3)' }}>
              {step === 'questions' ? `${current + 1} / ${total}` : step === 'welcome' ? 'Начало' : 'Финал'}
            </span>
          </div>

          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%`, background: 'var(--primary-blue)' }} />
          </div>
        </div>

        {step === 'welcome' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 24 }}>
              <span className="label" style={{ color: 'var(--primary-blue)' }}>PROJI</span>
            </div>

            <h1 style={{
              fontSize: 'clamp(26px, 5vw, 38px)',
              fontWeight: 750,
              lineHeight: 1.15,
              marginBottom: 16,
              color: '#1a1a1a',
            }}>
              {survey.title}
            </h1>

            <div className="stats-row" style={{ margin: '0 auto 30px', display: 'flex', justifyContent: 'center', gap: 28 }}>
              {[
                { num: String(displayBlocks.length), label: 'зон анализа' },
                { num: String(total), label: 'вопросов' },
                { num: 'Lead', label: 'скоринг' },
              ].map(({ num, label }) => (
                <div key={label}>
                  <div style={{ fontSize: 24, fontWeight: 750, color: '#1a1a1a' }}>{num}</div>
                  <div style={{ fontSize: 12, color: '#5a6c7d', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>

            <button
              className="btn btn-primary"
              disabled={submitting}
              onClick={handleStart}
              style={{ width: '100%', fontSize: 16, padding: '14px 28px' }}
            >
              {submitting ? 'Загрузка...' : 'Начать диагностику →'}
            </button>

            <div className="chip-row" style={{ marginTop: 28, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {displayBlocks.map((block) => (
                <span key={block.id} className="chip" style={{ fontSize: 12, padding: '6px 12px', background: 'rgba(26,26,26,0.04)', borderRadius: 999 }}>
                  {block.emoji} {block.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {step === 'segment' && (
          <>
            <h1 className="screen-title">Сначала настроим диагностику под ваш бизнес</h1>
            <p className="screen-copy">
              Это нужно, чтобы рекомендации были привязаны к размеру, модели продаж и стадии вашей компании.
            </p>

            <div className="form-grid" style={{ display: 'flex', flexDirection: 'column', gap: 16, margin: '24px 0' }}>
              {SEGMENT_FIELDS.map((field) => (
                <label key={field.id} className="field-label" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{field.label}</span>
                  {field.type === 'select' ? (
                    <select
                      value={segment[field.id]}
                      onChange={(e) => setSegment((prev) => ({ ...prev, [field.id]: e.target.value }))}
                      className="field-control"
                    >
                      <option value="">Выберите вариант</option>
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={segment[field.id]}
                      onChange={(e) => setSegment((prev) => ({ ...prev, [field.id]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="field-control"
                    />
                  )}
                </label>
              ))}
            </div>

            <button
              className="btn btn-primary"
              disabled={!canContinueSegment}
              onClick={() => {
                setStep('questions');
                setCurrent(0);
                setQuestionShownAt(Date.now());
              }}
              style={{ width: '100%' }}
            >
              Продолжить опрос →
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
                      {cleanOptionText(opt)}
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

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
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
                {current === total - 1 ? 'Далее →' : 'Следующий вопрос →'}
              </button>
            </div>
          </>
        )}

        {step === 'contact' && (
          <>
            <h2 className="screen-title">Диагностика завершена!</h2>
            <p className="screen-copy" style={{ marginBottom: 20 }}>
              Оставьте контактные данные, чтобы мы сохранили ваши результаты и связали их с вашим профилем.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label className="field-label">
                Ваше имя
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Иван Иванов"
                  className="field-control"
                  disabled={submitting}
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
                  disabled={submitting}
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
                  disabled={submitting}
                />
              </label>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
              <button
                className="btn btn-ghost"
                onClick={() => submitAndShowResult(true)}
                disabled={submitting}
              >
                Пропустить
              </button>
              <button
                className="btn btn-primary"
                onClick={() => submitAndShowResult(false)}
                disabled={!name.trim() || !phone.trim() || submitting}
                style={{ flex: 1 }}
              >
                {submitting ? 'Сохранение...' : 'Показать результаты →'}
              </button>
            </div>
          </>
        )}

        {status && (
          <p style={{ marginTop: 18, color: 'var(--primary-blue)', fontWeight: 500, textAlign: 'center' }}>
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
