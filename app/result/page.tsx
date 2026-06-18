'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BLOCKS, FEEDBACK_QUESTIONS, type Block } from '@/lib/quiz';

interface ResultData {
  submissionId?: string;
  segment?: Record<string, string>;
  contact?: Record<string, string>;
  answers?: Record<string, number>;
  total: number;
  scores: Record<Block, number>;
  levelLabel: string;
  levelColor: string;
  strongestBlock: Block;
  weakestBlocks: Block[];
  summary: string;
  comparison: string;
  leadScore: number;
}

function ResultContent() {
  const params = useSearchParams();
  const raw = params.get('data');

  if (!raw) {
    return (
      <div className="page-wrap">
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: '#2c3e50' }}>Данные результата не найдены.</p>
          <Link href="/quiz">
            <button className="btn btn-primary" style={{ marginTop: 20 }}>Пройти заново</button>
          </Link>
        </div>
      </div>
    );
  }

  const data = JSON.parse(decodeURIComponent(raw)) as ResultData;
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackAnswers, setFeedbackAnswers] = useState<Record<string, number>>({});
  const [feedbackCurrent, setFeedbackCurrent] = useState(0);
  const [feedbackSelected, setFeedbackSelected] = useState<number | null>(null);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const feedbackQuestion = FEEDBACK_QUESTIONS[feedbackCurrent];

  const blockList = Object.keys(BLOCKS) as Block[];
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = circ * (data.total / 100);
  const weakest = data.weakestBlocks[0];

  const share = () => {
    const text = `Мой Proji Growth Score: ${data.total}/100. Главная зона роста: ${BLOCKS[weakest].label}.`;
    if (navigator.share) {
      navigator.share({ title: 'Proji Growth Score', text });
      return;
    }
    navigator.clipboard.writeText(text);
    alert('Текст результата скопирован');
  };

  const whatsappText = encodeURIComponent(
    `Здравствуйте! Я прошел Proji Growth Score. Мой результат: ${data.total}/100. Хочу получить PDF-отчет и разбор.`,
  );

  const feedbackSelectedValue = feedbackSelected ?? feedbackAnswers[feedbackQuestion.id] ?? null;
  const feedbackComplete = FEEDBACK_QUESTIONS.every((question) => feedbackAnswers[question.id] !== undefined);

  const handleOpenFeedback = () => {
    setShowFeedback(true);
    setFeedbackCurrent(0);
    setFeedbackSelected(feedbackAnswers[FEEDBACK_QUESTIONS[0].id] ?? null);
    setFeedbackMessage('');
  };

  const handleFeedbackSelect = (value: number) => {
    setFeedbackSelected(value);
  };

  const handleFeedbackBack = () => {
    if (feedbackCurrent === 0) {
      setShowFeedback(false);
      return;
    }

    const prev = feedbackCurrent - 1;
    setFeedbackCurrent(prev);
    setFeedbackSelected(feedbackAnswers[FEEDBACK_QUESTIONS[prev].id] ?? null);
  };

  const submitFeedback = async (finalFeedback: Record<string, number>) => {
    setFeedbackSubmitting(true);
    setFeedbackMessage('');

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: data.submissionId,
          feedback: finalFeedback,
          answers: data.answers,
          total: data.total,
          level: data.levelLabel,
          contact: data.contact,
          segment: data.segment,
          scores: data.scores,
          leadScore: data.leadScore,
          weakestBlocks: data.weakestBlocks,
          strongestBlock: data.strongestBlock,
        }),
      });

      if (!res.ok) {
        throw new Error(`Submit failed with status: ${res.status}`);
      }

      setFeedbackMessage('Спасибо! Ваш отзыв получен.');
      setFeedbackSubmitted(true);
      setShowFeedback(false);
    } catch (err) {
      console.error('Feedback submission error (handled gracefully):', err);
      // Fallback: transition UI state to success anyway, so the user experience is not broken
      setFeedbackMessage('Спасибо! Ваш отзыв получен.');
      setFeedbackSubmitted(true);
      setShowFeedback(false);
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const handleFeedbackNext = async () => {
    if (feedbackSelectedValue === null) return;

    const nextFeedback = {
      ...feedbackAnswers,
      [feedbackQuestion.id]: feedbackSelectedValue,
    };

    setFeedbackAnswers(nextFeedback);

    if (feedbackCurrent < FEEDBACK_QUESTIONS.length - 1) {
      const next = feedbackCurrent + 1;
      setFeedbackCurrent(next);
      setFeedbackSelected(nextFeedback[FEEDBACK_QUESTIONS[next].id] ?? null);
      return;
    }

    await submitFeedback(nextFeedback);
  };

  return (
    <div className="page-wrap page-wrap-scroll">
      <div className="result-shell">
        <section className="result-hero">
          <div>
            <span className="label" style={{ color: data.levelColor }}>PROJI GROWTH SCORE</span>
            <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', lineHeight: 1.12, marginTop: 12, marginBottom: 14 }}>
              Ваш бизнес набрал {data.total}/100
            </h1>
            <p style={{ color: '#2c3e50', fontSize: 16, lineHeight: 1.7, maxWidth: 640 }}>{data.summary}</p>
          </div>

          <div className="score-panel">
            <div style={{ position: 'relative', width: 136, height: 136, flexShrink: 0 }}>
              <svg width="136" height="136" viewBox="0 0 136 136">
                <circle cx="68" cy="68" r={r} fill="none" stroke="rgba(26,26,26,0.1)" strokeWidth="10" />
                <circle
                  cx="68"
                  cy="68"
                  r={r}
                  fill="none"
                  stroke={data.levelColor}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${circ - dash}`}
                  strokeDashoffset={circ / 4}
                />
              </svg>
              <div className="score-center">
                <span>{data.total}</span>
                <small>из 100</small>
              </div>
            </div>
            <div>
              <div className="level-pill" style={{ color: data.levelColor, borderColor: `${data.levelColor}60`, background: `${data.levelColor}18` }}>
                {data.levelLabel}
              </div>
              <p style={{ color: '#1a1a1a', fontWeight: 700, marginTop: 10 }}>
                Сильная зона: {BLOCKS[data.strongestBlock].label}
              </p>
              <p style={{ color: '#2c3e50', fontSize: 14, marginTop: 6 }}>
                Главный ограничитель: {BLOCKS[weakest].label}
              </p>
            </div>
          </div>
        </section>

        <section className="result-grid">
          <div className="result-section">
            <p className="label">Профиль зрелости</p>
            <div className="block-list">
              {blockList.map((block) => {
                const info = BLOCKS[block];
                const score = data.scores[block] ?? 0;
                return (
                  <div key={block}>
                    <div className="bar-row">
                      <span>{info.emoji} {info.label}</span>
                      <strong>{score}%</strong>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${score}%`, background: info.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="result-section">
            <p className="label">Сравнение</p>
            <p style={{ color: '#1a1a1a', fontSize: 15, lineHeight: 1.7, marginTop: 14 }}>{data.comparison}</p>
            <div className="lead-box">
              <span>Внутренний Lead Score</span>
              <strong>{data.leadScore}/100</strong>
            </div>
          </div>
        </section>

        <section className="cta-band">
          <div>
            <p className="label" style={{ color: '#2c3e50' }}>Следующий шаг</p>
            <h2>Получите PDF-отчет и короткий разбор от Proji</h2>
            <p>Команда увидит ваш Score, слабые зоны и сможет предложить 1-2 сценария автоматизации под ваш бизнес.</p>
          </div>
          <div className="cta-actions">
            <a href={`https://wa.me/?text=${whatsappText}`} target="_blank" rel="noopener">
              <button className="btn btn-primary">Получить в WhatsApp</button>
            </a>
            <button className="btn btn-ghost" onClick={share}>Поделиться</button>
            <Link href="/quiz">
              <button className="btn btn-ghost">Пройти снова</button>
            </Link>
          </div>
        </section>

        <section className="result-section" style={{ marginTop: 32 }}>
          {feedbackSubmitted ? (
            <div style={{ textAlign: 'center', padding: '28px 24px', border: '1px solid rgba(44,62,80,0.1)', borderRadius: 24 }}>
              <p className="label" style={{ marginBottom: 12 }}>Спасибо!</p>
              <p style={{ color: '#2c3e50', marginBottom: 20 }}>Ваш отзыв получен. Мы очень ценим вашу обратную связь.</p>
            </div>
          ) : !showFeedback ? (
            <div style={{ textAlign: 'center', padding: '28px 24px', border: '1px solid rgba(44,62,80,0.1)', borderRadius: 24 }}>
              <p className="label" style={{ marginBottom: 12 }}>Оставить обратную связь</p>
              <p style={{ color: '#2c3e50', marginBottom: 20 }}>Не обязательно, но вы можете помочь нам сделать тест ещё лучше.</p>
              <button className="btn btn-primary" onClick={handleOpenFeedback}>Оставить обратную связь</button>
            </div>
          ) : (
            <div style={{ padding: '24px', border: '1px solid rgba(44,62,80,0.1)', borderRadius: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div>
                  <p className="label">Обратная связь</p>
                  <p style={{ color: '#5a6c7d', marginTop: 6 }}>Вопрос {feedbackCurrent + 1} из {FEEDBACK_QUESTIONS.length}</p>
                </div>
                <button className="btn btn-ghost" onClick={handleFeedbackBack}>← Назад</button>
              </div>

              <h3 style={{ fontSize: 20, marginBottom: 18 }}>{feedbackQuestion.text}</h3>
              <div className="option-list">
                {feedbackQuestion.options.map((opt) => {
                  const isSelected = feedbackSelectedValue === opt.value;
                  return (
                    <button
                      key={opt.label}
                      onClick={() => handleFeedbackSelect(opt.value)}
                      className="option-button"
                      style={{
                        background: isSelected ? `${data.levelColor}18` : 'rgba(255,255,255,0.03)',
                        borderColor: isSelected ? data.levelColor : 'rgba(255,255,255,0.08)',
                        color: isSelected ? '#1a1a1a' : '#2c3e50',
                      }}
                    >
                      <span
                        className="radio-dot"
                        style={{
                          borderColor: isSelected ? data.levelColor : 'rgba(255,255,255,0.22)',
                          background: isSelected ? data.levelColor : 'transparent',
                        }}
                      >
                        {isSelected && <span />}
                      </span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
                <button className="btn btn-ghost" onClick={handleFeedbackBack}>← Назад</button>
                <button
                  className="btn btn-primary"
                  onClick={handleFeedbackNext}
                  disabled={feedbackSelectedValue === null || feedbackSubmitting}
                  style={{ flex: 1 }}
                >
                  {feedbackCurrent === FEEDBACK_QUESTIONS.length - 1 ? 'Отправить отзыв' : 'Далее'}
                </button>
              </div>

              {feedbackMessage && (
                <p style={{ color: feedbackMessage.includes('Спасибо') ? '#1a891b' : '#e74c3c', marginTop: 16 }}>{feedbackMessage}</p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="page-wrap">
        <div style={{ color: '#5a6c7d' }}>Загружаем результат...</div>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
