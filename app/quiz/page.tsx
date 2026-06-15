'use client';

import { Suspense, useMemo, useState } from 'react';
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

type Step = 'segment' | 'questions' | 'contact';

const blockColors: Record<Block, string> = {
  sales: '#d6a0ff',
  automation: '#b6e8e3',
  data: '#82d5cc',
  team: '#a8d5ba',
  ai: '#ffd966',
};

function QuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>('segment');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [segment, setSegment] = useState<Segment>(EMPTY_SEGMENT);
  const [contact, setContact] = useState<Contact>(EMPTY_CONTACT);
  const [submitting, setSubmitting] = useState(false);

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
    : step === 'contact'
      ? 96
      : 12 + ((current + 1) / total) * 76;
  const blockInfo = q ? BLOCKS[q.block] : null;
  const color = q ? blockColors[q.block] : '#e1f2ab';

  const canStart = SEGMENT_FIELDS.every((field) => segment[field.id].trim().length > 0);

  const handleNextQuestion = () => {
    if (selected === null) return;

    const newAnswers = { ...answers, [q.id]: selected };
    setAnswers(newAnswers);

    if (current < total - 1) {
      setCurrent(current + 1);
      setSelected(newAnswers[QUESTIONS[current + 1].id] ?? null);
      return;
    }

    setStep('contact');
  };

  const submitAndShowResult = async () => {
    setSubmitting(true);
    const result = calculateScore(answers, segment, contact);

    try {
      await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
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
      });
    } catch {
      // The participant should still receive the result if saving fails.
    }

    const encoded = encodeURIComponent(JSON.stringify({
      segment,
      contact,
      answers,
      scores: result.byBlock,
      total: result.total,
      level: result.level,
      levelLabel: result.levelLabel,
      levelColor: result.levelColor,
      strongestBlock: result.strongestBlock,
      weakestBlocks: result.weakestBlocks,
      summary: result.summary,
      comparison: result.comparison,
      recommendations: result.recommendations,
      leadScore: result.leadScore,
    }));

    router.push(`/result?data=${encoded}`);
  };

  return (
    <div className="page-wrap">
      <div className="card">
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <span className="label top-label">
              {step === 'segment' && 'Контекст бизнеса'}
              {step === 'questions' && blockInfo && `${blockInfo.emoji} ${blockInfo.label}`}
              {step === 'contact' && 'Персональный отчет'}
            </span>
            <span style={{ fontSize: 13, color: '#5a6c7d' }}>
              {step === 'questions' ? `${current + 1} / ${total}` : step === 'segment' ? '1 / 3' : '3 / 3'}
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
                const isSelected = selected === opt.value;
                return (
                  <button
                    key={opt.label}
                    onClick={() => setSelected(opt.value)}
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
                onClick={() => {
                  if (current === 0) {
                    setStep('segment');
                    return;
                  }
                  const prev = current - 1;
                  setCurrent(prev);
                  setSelected(answers[QUESTIONS[prev].id] ?? null);
                }}
              >
                ← Назад
              </button>
              <button
                className="btn btn-primary"
                onClick={handleNextQuestion}
                disabled={selected === null}
                style={{ flex: 1 }}
              >
                {current === total - 1 ? 'К результату →' : 'Следующий вопрос →'}
              </button>
            </div>
          </>
        )}

        {step === 'contact' && (
          <>
            <h1 className="screen-title">Куда отправить короткий план роста?</h1>
            <p className="screen-copy">
              Результат покажем сразу. Контакт поможет Proji отправить PDF-отчет или пригласить на бесплатный разбор.
            </p>

            <div className="form-grid">
              <label className="field-label">
                Имя
                <input className="field-control" value={contact.name} onChange={(event) => setContact((prev) => ({ ...prev, name: event.target.value }))} placeholder="Как к вам обращаться" />
              </label>
              <label className="field-label">
                Компания
                <input className="field-control" value={contact.company} onChange={(event) => setContact((prev) => ({ ...prev, company: event.target.value }))} placeholder="Название компании" />
              </label>
              <label className="field-label">
                WhatsApp / телефон
                <input className="field-control" value={contact.phone} onChange={(event) => setContact((prev) => ({ ...prev, phone: event.target.value }))} placeholder="+7..." />
              </label>
              <label className="field-label">
                Email
                <input className="field-control" value={contact.email} onChange={(event) => setContact((prev) => ({ ...prev, email: event.target.value }))} placeholder="name@company.kz" />
              </label>
            </div>

            <div className="notice">
              Контакт можно оставить позже, но с ним команда Proji сможет подготовить более точный разбор.
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
              <button className="btn btn-ghost" onClick={() => setStep('questions')}>← Назад</button>
              <button className="btn btn-primary" onClick={submitAndShowResult} disabled={submitting} style={{ flex: 1 }}>
                {submitting ? 'Считаем...' : 'Показать результат →'}
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
