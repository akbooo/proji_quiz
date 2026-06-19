'use client';

import { Suspense, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BLOCKS,
  EMPTY_CONTACT,
  EMPTY_SEGMENT,
  QUESTIONS,
  SEGMENT_FIELDS,
  calculateScore,
  type Block,
  type Contact,
  type Segment,
  type TrackingData,
} from '@/lib/quiz';

type Step = 'segment' | 'questions';

const blockColors: Record<Block, string> = {
  sales_support: '#d6a0ff',
  automation: '#b6e8e3',
  data_knowledge: '#82d5cc',
  predictive_ops: '#a8d5ba',
  culture_ready: '#ffd966',
};

function QuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>('segment');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [segment, setSegment] = useState<Segment>(EMPTY_SEGMENT);
  const [contact, setContact] = useState<Contact>(EMPTY_CONTACT);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [submissionId] = useState(() => {
    const rnd = Math.random().toString(36).substring(2, 11);
    return `sub_${Date.now()}_${rnd}`;
  });

  const tracking = useMemo<TrackingData>(() => {
    if (typeof window === 'undefined') {
      return {
        utm_source: '',
        utm_medium: '',
        utm_campaign: '',
        utm_content: '',
        utm_term: '',
        referrer: '',
        landingPath: '',
        device: '',
        language: '',
      };
    }

    const width = window.innerWidth;
    return {
      utm_source: searchParams.get('utm_source') || '',
      utm_medium: searchParams.get('utm_medium') || '',
      utm_campaign: searchParams.get('utm_campaign') || '',
      utm_content: searchParams.get('utm_content') || '',
      utm_term: searchParams.get('utm_term') || '',
      referrer: document.referrer,
      landingPath: window.location.pathname + window.location.search,
      device: width < 640 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop',
      language: navigator.language,
    };
  }, [searchParams]);

  const q = QUESTIONS[current];
  const total = QUESTIONS.length;
  const progress = step === 'segment'
    ? 8
    : 12 + ((current + 1) / total) * 76;
  const blockInfo = q ? BLOCKS[q.block] : null;
  const color = q ? blockColors[q.block] : '#e1f2ab';

  const canStart = SEGMENT_FIELDS.every((field) => segment[field.id].trim().length > 0);

  const handleNextQuestion = () => {
    if (selected === null) return;

    const newAnswers = { ...answers, [q.id]: selected };
    setAnswers(newAnswers);

    if (current < total - 1) {
      const next = current + 1;
      setCurrent(next);
      setSelected(newAnswers[QUESTIONS[next].id] ?? null);
      return;
    }

    const numericAnswers: Record<string, number> = {};
    for (const question of QUESTIONS) {
      const label = newAnswers[question.id];
      const opt = question.options.find((o) => o.label === label);
      numericAnswers[question.id] = opt ? opt.value : 0;
    }

    submitAndShowResult(numericAnswers);
  };

  const handleBack = () => {
    if (current === 0) {
      setStep('segment');
      return;
    }

    const prev = current - 1;
    setCurrent(prev);
    setSelected(answers[QUESTIONS[prev].id] ?? null);
  };

  const submitAndShowResult = async (finalAnswers: Record<string, number>) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);

    const result = calculateScore(finalAnswers, segment, contact);

    // Call submit API asynchronously in the background with keepalive: true
    // so it doesn't block navigation and completes even if the page unloads.
    fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        submissionId,
        answers: finalAnswers,
        segment,
        contact,
        tracking,
        scores: result.byBlock,
        total: result.total,
        level: result.level,
        leadScore: result.leadScore,
        weakestBlocks: result.weakestBlocks,
        strongestBlock: result.strongestBlock,
      }),
    }).catch((err) => {
      console.error('Background submit failed:', err);
    });

    submittingRef.current = false;
    setSubmitting(false);

    router.push(
      `/result?data=${encodeURIComponent(JSON.stringify({
        submissionId,
        segment,
        contact,
        answers: finalAnswers,
        scores: result.byBlock,
        total: result.total,
        level: result.level,
        levelLabel: result.levelLabel,
        levelColor: result.levelColor,
        strongestBlock: result.strongestBlock,
        weakestBlocks: result.weakestBlocks,
        summary: result.summary,
        comparison: result.comparison,
        leadScore: result.leadScore,
      }))}`
    );
  };

  return (
    <div className="page-wrap">
      <div className="card">
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <span className="label">
              {step === 'segment' && 'Контекст бизнеса'}
              {step === 'questions' && blockInfo && `${blockInfo.emoji} ${blockInfo.label}`}
            </span>
            <span style={{ fontSize: 13, color: '#5a6c7d' }}>
              {step === 'questions' ? `${current + 1} / ${total}` : '1 / 2'}
            </span>
          </div>

          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%`, background: color }} />
          </div>
        </div>

        {step === 'segment' && (
          <>
            <h1 className="screen-title">Сначала настроим диагностику под ваш бизнес</h1>
            <p className="screen-copy">
              Это нужно, чтобы рекомендации были не общими, а привязанными к размеру, модели продаж и стадии компании.
            </p>

            <div className="form-grid">
              {SEGMENT_FIELDS.map((field) => (
                <label key={field.id} className="field-label">
                  {field.label}
                  {field.type === 'select' ? (
                    <select
                      value={segment[field.id]}
                      onChange={(event) => setSegment((prev) => ({ ...prev, [field.id]: event.target.value }))}
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
                      onChange={(event) => setSegment((prev) => ({ ...prev, [field.id]: event.target.value }))}
                      placeholder={field.placeholder}
                      className="field-control"
                    />
                  )}
                </label>
              ))}
            </div>

            <button
              className="btn btn-primary"
              disabled={!canStart}
              onClick={() => setStep('questions')}
              style={{ width: '100%', marginTop: 26 }}
            >
              Начать диагностику →
            </button>
          </>
        )}

        {step === 'questions' && (
          <>
            <h2 className="screen-title">{q.text}</h2>
            <div className="option-list">
              {q.options.map((opt) => {
                const isSelected = selected === opt.label;
                return (
                  <button
                    key={opt.label}
                    onClick={() => setSelected(opt.label)}
                    className="option-button"
                    style={{
                      background: isSelected ? `${color}18` : 'rgba(255,255,255,0.03)',
                      borderColor: isSelected ? color : 'rgba(255,255,255,0.08)',
                      color: isSelected ? '#1a1a1a' : '#2c3e50',
                    }}
                  >
                    <span
                      className="radio-dot"
                      style={{
                        borderColor: isSelected ? color : 'rgba(255,255,255,0.22)',
                        background: isSelected ? color : 'transparent',
                      }}
                    >
                      {isSelected && <span />}
                    </span>
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="btn btn-ghost"
                onClick={handleBack}
              >
                ← Назад
              </button>
              <button
                className="btn btn-primary"
                onClick={handleNextQuestion}
                disabled={selected === null || submitting}
                style={{ flex: 1 }}
              >
                {current === total - 1 ? 'К результату →' : 'Следующий вопрос →'}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={
      <div className="page-wrap">
        <div style={{ color: '#5a6c7d' }}>Загружаем квиз...</div>
      </div>
    }>
      <QuizContent />
    </Suspense>
  );
}
