'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BLOCKS,
  BLOCK_ORDER,
  EMPTY_CONTACT,
  EMPTY_SEGMENT,
  QUESTIONS,
  SEGMENT_FIELDS,
  calculateScore,
  calculateScoreFromRawBlocks,
  type Block,
  type Contact,
  type Segment,
  type TrackingData,
} from '@/lib/quiz';

type Step = 'segment' | 'questions' | 'contact';

// AI-generated question from DB
interface AiQuestion {
  id: number;
  text: string;
  icon: string | null;
  order: number;
  type: string;
  block: string | null;  // category assigned by AI, stored in DB
  options?: string[] | null;
}

interface AiSurvey {
  id: number;
  title: string;
  description: string;
}

const blockColors: Record<Block, string> = {
  sales_support: '#d6a0ff',
  automation: '#b6e8e3',
  data_knowledge: '#82d5cc',
  predictive_ops: '#a8d5ba',
  culture_ready: '#ffd966',
};

// Map answer option text → numeric score using position.
// Prompt orders options from BEST (index 0 = 10 pts) to WORST (last = 0 pts).
function getOptionScore(optionIndex: number, totalOptions: number): number {
  const maps: Record<number, number[]> = {
    3: [10, 4, 0],
    4: [10, 7, 4, 0],
    5: [10, 7, 4, 2, 0],
  };
  const arr = maps[totalOptions] ?? maps[4];
  return arr[Math.min(optionIndex, arr.length - 1)] ?? 0;
}

// Distribute question index across 5 blocks proportionally
function getBlockForIndex(questionIndex: number, totalQuestions: number): Block {
  const blockIndex = Math.min(
    Math.floor((questionIndex / totalQuestions) * BLOCK_ORDER.length),
    BLOCK_ORDER.length - 1,
  );
  return BLOCK_ORDER[blockIndex];
}

// Compute per-block percentage scores using the real block assignment from DB
function computeAiBlockScores(
  aiQuestions: AiQuestion[],
  answers: Record<string, string>,
): Record<Block, number> {
  const byBlock: Record<Block, { sum: number; count: number }> = {
    sales_support: { sum: 0, count: 0 },
    automation: { sum: 0, count: 0 },
    data_knowledge: { sum: 0, count: 0 },
    predictive_ops: { sum: 0, count: 0 },
    culture_ready: { sum: 0, count: 0 },
  };

  aiQuestions.forEach((q, idx) => {
    // Use the block stored in DB; fall back to proportional index if missing
    const rawBlock = q.block?.trim() ?? '';
    const block: Block = (BLOCK_ORDER as string[]).includes(rawBlock)
      ? (rawBlock as Block)
      : getBlockForIndex(idx, aiQuestions.length);

    const selectedOption = answers[String(q.id)];
    if (selectedOption && Array.isArray(q.options) && q.options.length > 0) {
      const optIdx = q.options.indexOf(selectedOption);
      const score = optIdx >= 0 ? getOptionScore(optIdx, q.options.length) : 0;
      byBlock[block].sum += score;
      byBlock[block].count += 1;
    }
  });

  const result = {} as Record<Block, number>;
  for (const block of BLOCK_ORDER) {
    const { sum, count } = byBlock[block];
    result[block] = count > 0 ? Math.round((sum / (count * 10)) * 100) : 0;
  }
  return result;
}

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

  // AI survey from DB
  const [aiSurvey, setAiSurvey] = useState<AiSurvey | null>(null);
  const [aiQuestions, setAiQuestions] = useState<AiQuestion[]>([]);
  const [aiLoading, setAiLoading] = useState(true);

  useEffect(() => {
    fetch('/api/active-survey')
      .then((r) => r.json())
      .then((data) => {
        if (data.survey && Array.isArray(data.questions) && data.questions.length > 0) {
          setAiSurvey(data.survey);
          setAiQuestions(data.questions);
        }
      })
      .catch(() => {})
      .finally(() => setAiLoading(false));
  }, []);

  const tracking = useMemo<TrackingData>(() => {
    if (typeof window === 'undefined') {
      return { utm_source: '', utm_medium: '', utm_campaign: '', utm_content: '', utm_term: '', referrer: '', landingPath: '', device: '', language: '' };
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

  // Which mode are we in?
  const usingAi = aiQuestions.length > 0;

  // Static quiz
  const q = QUESTIONS[current];
  const staticTotal = QUESTIONS.length;

  // AI quiz
  const aiQ = aiQuestions[current];
  const aiTotal = aiQuestions.length;

  const total = usingAi ? aiTotal : staticTotal;
  const progress = step === 'segment'
    ? 8
    : step === 'contact'
      ? 100
      : 12 + ((current + 1) / total) * 76;

  // Block info only for static quiz
  const blockInfo = !usingAi && q ? BLOCKS[q.block] : null;
  const color = !usingAi && q ? blockColors[q.block] : '#b6e8e3';

  const canStart = SEGMENT_FIELDS.every((field) => segment[field.id].trim().length > 0);

  // ── Static quiz handlers ─────────────────────────────────────────────────────
  const handleNextStatic = () => {
    if (selected === null) return;
    const newAnswers = { ...answers, [q.id]: selected };
    setAnswers(newAnswers);

    if (current < staticTotal - 1) {
      const next = current + 1;
      setCurrent(next);
      setSelected(newAnswers[QUESTIONS[next].id] ?? null);
      return;
    }

    setStep('contact');
  };

  const handleBackStatic = () => {
    if (current === 0) { setStep('segment'); return; }
    const prev = current - 1;
    setCurrent(prev);
    setSelected(answers[QUESTIONS[prev].id] ?? null);
  };

  const submitStatic = async (finalAnswers: Record<string, number>) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);

    const result = calculateScore(finalAnswers, segment, contact);

    await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submissionId, answers: finalAnswers, segment, contact, tracking,
        scores: result.byBlock, total: result.total, level: result.level,
        leadScore: result.leadScore, weakestBlocks: result.weakestBlocks, strongestBlock: result.strongestBlock,
      }),
    }).catch(console.error);

    submittingRef.current = false;
    setSubmitting(false);

    router.push(`/result?data=${encodeURIComponent(JSON.stringify({
      submissionId, segment, contact, answers: finalAnswers,
      scores: result.byBlock, total: result.total,
      level: result.level, levelLabel: result.levelLabel, levelColor: result.levelColor,
      strongestBlock: result.strongestBlock, weakestBlocks: result.weakestBlocks,
      summary: result.summary, comparison: result.comparison, leadScore: result.leadScore,
    }))}`);
  };

  // ── AI quiz handlers ─────────────────────────────────────────────────────────
  const handleNextAi = () => {
    if (!aiQ) return;
    if (selected === null) return;

    const key = String(aiQ.id);
    const newAnswers = { ...answers, [key]: selected };
    setAnswers(newAnswers);

    if (current < aiTotal - 1) {
      const next = current + 1;
      setCurrent(next);
      setSelected(newAnswers[String(aiQuestions[next].id)] ?? null);
      return;
    }

    setStep('contact');
  };

  const handleBackAi = () => {
    if (current === 0) { setStep('segment'); return; }
    const prev = current - 1;
    setCurrent(prev);
    setSelected(answers[String(aiQuestions[prev].id)] ?? null);
  };

  const submitAi = async (finalAnswers: Record<string, string>) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);

    // Compute block-based scores (same 5 blocks as original result page)
    const blockScores = computeAiBlockScores(aiQuestions, finalAnswers);
    const result = calculateScoreFromRawBlocks(blockScores, segment, contact);

    if (aiSurvey) {
      await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          surveyId: aiSurvey.id,
          answers: finalAnswers, // raw answers mapping question.id -> string value
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
      }).catch(console.error);
    }

    submittingRef.current = false;
    setSubmitting(false);

    // Navigate to the SAME /result page as the static quiz
    router.push(`/result?data=${encodeURIComponent(JSON.stringify({
      submissionId, segment, contact, answers: blockScores,
      scores: result.byBlock, total: result.total,
      level: result.level, levelLabel: result.levelLabel, levelColor: result.levelColor,
      strongestBlock: result.strongestBlock, weakestBlocks: result.weakestBlocks,
      summary: result.summary, comparison: result.comparison, leadScore: result.leadScore,
    }))}`);
  };

  if (aiLoading) {
    return (
      <div className="page-wrap">
        <div style={{ color: '#5a6c7d' }}>Загружаем вопросы...</div>
      </div>
    );
  }

  const aiHasOptions = usingAi && aiQ ? (Array.isArray(aiQ.options) && aiQ.options.length > 0) : false;
  const aiIsAnswered = usingAi ? (aiHasOptions ? selected !== null : false) : false;

  return (
    <div className="page-wrap">
      <div className="card">
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <span className="label">
              {step === 'segment' && 'Контекст бизнеса'}
              {step === 'questions' && usingAi && aiQ && `${aiQ.icon || '📝'} Вопрос`}
              {step === 'questions' && !usingAi && blockInfo && `${blockInfo.emoji} ${blockInfo.label}`}
              {step === 'contact' && 'Контактная информация'}
            </span>
            <span style={{ fontSize: 13, color: '#5a6c7d' }}>
              {step === 'segment' ? '1 / 3' : step === 'questions' ? '2 / 3' : '3 / 3'}
            </span>
          </div>

          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%`, background: usingAi ? 'var(--primary-blue)' : color }} />
          </div>
        </div>

        {/* ── SEGMENT STEP — always shows default text, regardless of AI mode ── */}
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
              disabled={!canStart}
              onClick={() => { setStep('questions'); setCurrent(0); setSelected(null); }}
              style={{ width: '100%', marginTop: 26 }}
            >
              Начать диагностику →
            </button>
          </>
        )}

        {/* ── AI QUESTIONS ── */}
        {step === 'questions' && usingAi && aiQ && (
          <>
            <h2 className="screen-title">{aiQ.text}</h2>

            {aiHasOptions && (
              <div className="option-list">
                {aiQ.options!.map((opt) => {
                  const isSelected = selected === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => setSelected(opt)}
                      className="option-button"
                      style={{
                        background: isSelected ? 'rgba(16,47,93,0.08)' : 'rgba(255,255,255,0.03)',
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
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-ghost" onClick={handleBackAi} disabled={submitting}>← Назад</button>
              <button
                className="btn btn-primary"
                onClick={handleNextAi}
                disabled={!aiIsAnswered || submitting}
                style={{ flex: 1 }}
              >
                {current === aiTotal - 1 ? 'Далее →' : 'Следующий вопрос →'}
              </button>
            </div>
          </>
        )}

        {/* ── STATIC QUESTIONS ── */}
        {step === 'questions' && !usingAi && (
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
              <button className="btn btn-ghost" onClick={handleBackStatic}>← Назад</button>
              <button
                className="btn btn-primary"
                onClick={handleNextStatic}
                disabled={selected === null || submitting}
                style={{ flex: 1 }}
              >
                {current === staticTotal - 1 ? 'Далее →' : 'Следующий вопрос →'}
              </button>
            </div>
          </>
        )}

        {/* ── CONTACT STEP ── */}
        {step === 'contact' && (
          <>
            <h1 className="screen-title">Почти готово! Оставьте ваши контакты</h1>
            <p className="screen-copy">
              Введите ФИО, телефон и почту, чтобы получить детальный результат и рекомендации для вашего бизнеса.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label className="field-label">
                ФИО
                <input
                  value={contact.name}
                  onChange={(e) => setContact((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Иван Иванов"
                  className="field-control"
                  disabled={submitting}
                />
              </label>

              <label className="field-label">
                Электронная почта
                <input
                  type="email"
                  value={contact.email}
                  onChange={(e) => setContact((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="ivan@example.com"
                  className="field-control"
                  disabled={submitting}
                />
              </label>

              <label className="field-label">
                Телефон
                <input
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => setContact((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+7 (707) 123-45-67"
                  className="field-control"
                  disabled={submitting}
                />
              </label>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setStep('questions');
                  setCurrent(total - 1);
                  const lastId = usingAi ? String(aiQuestions[total - 1].id) : QUESTIONS[total - 1].id;
                  setSelected(answers[lastId] ?? null);
                }}
                disabled={submitting}
              >
                ← Назад
              </button>
              <button
                className="btn btn-primary"
                disabled={!contact.name.trim() || !contact.email.trim() || !contact.phone.trim() || submitting}
                onClick={() => {
                  if (usingAi) {
                    submitAi(answers);
                  } else {
                    const numericAnswers: Record<string, number> = {};
                    for (const question of QUESTIONS) {
                      const label = answers[question.id];
                      const opt = question.options.find((o) => o.label === label);
                      numericAnswers[question.id] = opt ? opt.value : 0;
                    }
                    submitStatic(numericAnswers);
                  }
                }}
                style={{ flex: 1 }}
              >
                {submitting ? 'Отправка...' : 'Получить результаты →'}
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
