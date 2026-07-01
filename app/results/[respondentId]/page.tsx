'use client';

import { useEffect, useState, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { BLOCKS, FEEDBACK_QUESTIONS, cleanOptionText, type Block } from '@/lib/quiz';

interface AnswerItem {
  id: string;
  question_text: string;
  question_icon: string | null;
  value: string;
  time_spent_sec: number;
  flags: string[];
}

interface RespondentInfo {
  id: string;
  survey_id: string;
  contact_info: {
    name?: string;
    email?: string;
    phone?: string;
  };
  total_score: number | null;
  level: string | null;
  lead_score: number | null;
  scores: Record<string, number> | null;
  strongest_block: string | null;
  weakest_blocks: string[] | null;
  survey_categories: string[] | null;
  flags: string[];
}

function getLevelColor(level: string | null): string {
  if (!level) return 'var(--primary-blue)';
  if (level.includes('Аналоговый')) return '#e74c3c';
  if (level.includes('Потенциал') || level.includes('Точечный')) return '#f39c12';
  if (level.includes('Трансформация')) return '#82d5cc';
  if (level.includes('Лидер')) return '#27ae60';
  return 'var(--primary-blue)';
}

const DEFAULT_EMOJIS = ['📊', '⚙️', '👥', '📈', '💰', '📝', '🤖', '💡'];
const DEFAULT_COLORS = ['#82d5cc', '#b6e8e3', '#ffd966', '#a8d5ba', '#d6a0ff', '#82d5cc'];

export default function ResultPage() {
  const params = useParams();
  const respondentId = params.respondentId as string;
  const router = useRouter();

  const [answers, setAnswers] = useState<AnswerItem[]>([]);
  const [respondent, setRespondent] = useState<RespondentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  // Feedback states
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackAnswers, setFeedbackAnswers] = useState<Record<string, number>>({});
  const [feedbackCurrent, setFeedbackCurrent] = useState(0);
  const [feedbackSelected, setFeedbackSelected] = useState<number | null>(null);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

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

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Результаты диагностики AI-зрелости',
          text: 'Мой результат в диагностике Proji:',
          url,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="page-wrap">
        <div style={{ color: 'var(--text3)', fontWeight: 500 }}>Загружаем результаты...</div>
      </div>
    );
  }

  if (!respondent) {
    return (
      <div className="page-wrap">
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: '#2c3e50' }}>Данные результата не найдены.</p>
          <Link href="/">
            <button className="btn btn-primary" style={{ marginTop: 20 }}>На главную</button>
          </Link>
        </div>
      </div>
    );
  }

  const hasScore = respondent.total_score !== null;
  const total = respondent.total_score || 0;
  const levelColor = getLevelColor(respondent.level);
  
  // Circle parameters
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = circ * (total / 100);

  const blockList = Object.keys(BLOCKS) as Block[];
  const weakest = respondent.weakest_blocks && respondent.weakest_blocks.length > 0
    ? respondent.weakest_blocks[0]
    : null;

  // Resolve Categories/Blocks
  let displayBlocks: Array<{ id: string; label: string; emoji: string; color: string }> = [];

  if (respondent.survey_categories && respondent.survey_categories.length > 0) {
    displayBlocks = respondent.survey_categories.map((cat, idx) => ({
      id: `cat_${idx}`,
      label: cat,
      emoji: DEFAULT_EMOJIS[idx % DEFAULT_EMOJIS.length],
      color: DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
    }));
  } else {
    displayBlocks = blockList.map((block) => ({
      id: block,
      label: BLOCKS[block].label,
      emoji: BLOCKS[block].emoji,
      color: BLOCKS[block].color,
    }));
  }

  const strongestBlockObj = displayBlocks.find(b => b.id === respondent.strongest_block);
  const weakestBlockObj = weakest ? displayBlocks.find(b => b.id === weakest) : null;

  // Feedback helpers
  const feedbackQuestion = FEEDBACK_QUESTIONS[feedbackCurrent];
  const feedbackSelectedValue = feedbackSelected ?? feedbackAnswers[feedbackQuestion.id] ?? null;

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
      const res = await fetch(`/api/respondents/${respondentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback: finalFeedback,
        }),
      });

      if (!res.ok) {
        throw new Error(`Submit failed with status: ${res.status}`);
      }

      setFeedbackMessage('Спасибо! Ваш отзыв получен.');
      setFeedbackSubmitted(true);
      setShowFeedback(false);
    } catch (err) {
      console.error('Feedback submission error:', err);
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
      <div className="result-shell" style={{ width: '100%', maxWidth: '780px', padding: '20px 0' }}>
        
        {/* Hero Section */}
        <section className="result-hero" style={{ marginBottom: 24 }}>
          <div>
            <span className="label" style={{ color: levelColor }}>Результаты диагностики</span>
            <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)', lineHeight: 1.15, marginTop: 12, marginBottom: 14 }}>
              {hasScore ? `Ваш результат: ${total}%` : 'Ответы успешно сохранены'}
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: 15, lineHeight: 1.65, maxWidth: 640 }}>
              {hasScore 
                ? `Диагностика проведена по основным направлениям вашего бизнеса. Ниже представлен подробный анализ зрелости процессов и рекомендации по оптимизации.`
                : `Спасибо за прохождение опроса! Ответы были успешно записаны.`
              }
            </p>
          </div>

          {hasScore && (
            <div className="score-panel" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
              <div style={{ position: 'relative', width: 136, height: 136, flexShrink: 0 }}>
                <svg width="136" height="136" viewBox="0 0 136 136">
                  <circle cx="68" cy="68" r={r} fill="none" stroke="rgba(26,26,26,0.1)" strokeWidth="10" />
                  <circle
                    cx="68"
                    cy="68"
                    r={r}
                    fill="none"
                    stroke={levelColor}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${circ - dash}`}
                    strokeDashoffset={circ / 4}
                  />
                </svg>
                <div className="score-center">
                  <span>{total}</span>
                  <small>из 100</small>
                </div>
              </div>
              <div>
                <div className="level-pill" style={{ color: levelColor, borderColor: `${levelColor}60`, background: `${levelColor}15` }}>
                  {respondent.level}
                </div>
                {strongestBlockObj && (
                  <p style={{ color: 'var(--text)', fontWeight: 700, marginTop: 10, fontSize: 13 }}>
                    👍 Сильная зона: {strongestBlockObj.label}
                  </p>
                )}
                {weakestBlockObj && (
                  <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 6 }}>
                    ⚠️ Главная точка роста: {weakestBlockObj.label}
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Maturity Profile by Blocks */}
        {hasScore && respondent.scores && (
          <section className="result-section" style={{ background: 'var(--bg2)', marginBottom: 24 }}>
            <p className="label">Профиль зрелости по категориям</p>
            <div className="block-list" style={{ marginTop: 12 }}>
              {displayBlocks.map((block) => {
                const score = respondent.scores?.[block.id] ?? 0;
                return (
                  <div key={block.id}>
                    <div className="bar-row">
                      <span>{block.emoji} {block.label}</span>
                      <strong>{score}%</strong>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${score}%`, background: block.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}



        {/* Toggle Detailed Answers (Drill-down) */}
        <section style={{ marginBottom: 24 }}>
          <button 
            className="btn btn-ghost" 
            onClick={() => setShowDetails(!showDetails)}
            style={{ width: '100%', justifyContent: 'space-between', padding: '12px 18px', background: 'var(--bg2)', borderColor: 'var(--border)' }}
          >
            <span>{showDetails ? '🔽 Скрыть подробные ответы' : '▶️ Посмотреть отдельные ответы (детализация)'}</span>
            <span>{answers.length} вопросов</span>
          </button>

          {showDetails && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
              {answers.map((answer) => (
                <div 
                  key={answer.id} 
                  style={{ 
                    padding: '18px', 
                    background: 'rgba(255, 255, 255, 0.55)', 
                    borderRadius: 'var(--radius)', 
                    border: '1px solid var(--border)',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.01)'
                  }}
                >
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                    <span style={{ fontSize: '18px', lineHeight: 1 }}>{answer.question_icon || '📝'}</span>
                    <strong style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.4 }}>
                      {answer.question_text}
                    </strong>
                  </div>
                  
                  <div style={{ 
                    padding: '10px 12px', 
                    background: '#ffffff', 
                    borderRadius: '6px', 
                    border: '1px solid rgba(26,26,26,0.05)',
                    color: 'var(--text2)',
                    fontSize: '13px',
                    lineHeight: 1.4
                  }}>
                    {cleanOptionText(answer.value)}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: '11px', color: 'var(--text3)' }}>
                    <span>Время ответа: {answer.time_spent_sec} сек</span>
                    {answer.flags?.length > 0 && (
                      <span style={{ color: '#c0392b', fontWeight: 600 }}>
                        {answer.flags.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CTA Action Band */}
        <section className="cta-band" style={{ background: 'var(--bg2)', padding: 24, borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: 24 }}>
          <div>
            <p className="label" style={{ color: 'var(--text3)' }}>Следующий шаг</p>
            <h2 style={{ fontSize: 22, margin: '8px 0' }}>Получите подробный разбор результатов</h2>
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.5 }}>
              Наши эксперты проанализируют слабые зоны вашего бизнеса и подготовят персональные рекомендации по автоматизации процессов.
            </p>
          </div>
          <div className="cta-actions" style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link href="/" style={{ width: '100%' }}>
              <button className="btn btn-primary" style={{ width: '100%' }}>На главную</button>
            </Link>
            {respondent?.survey_id && (
              <Link href={`/survey/${respondent.survey_id}`} style={{ width: '100%' }}>
                <button className="btn btn-ghost" style={{ width: '100%' }}>Пройти еще раз</button>
              </Link>
            )}
            <button className="btn btn-ghost" onClick={handleShare} style={{ width: '100%' }}>
              {copied ? 'Ссылка скопирована!' : 'Поделиться'}
            </button>
          </div>
        </section>

        {/* Feedback Section */}
        <section className="result-section" style={{ background: 'var(--bg2)', padding: '24px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: 24 }}>
          {feedbackSubmitted ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <p className="label" style={{ marginBottom: 12 }}>Спасибо!</p>
              <p style={{ color: 'var(--text2)', marginBottom: 0 }}>Ваш отзыв получен. Мы очень ценим вашу обратную связь.</p>
            </div>
          ) : !showFeedback ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <p className="label" style={{ marginBottom: 12 }}>Оставить обратную связь</p>
              <p style={{ color: 'var(--text2)', marginBottom: 20 }}>Пожалуйста, поделитесь своим мнением, чтобы помочь нам сделать опрос еще полезнее.</p>
              <button className="btn btn-primary" onClick={handleOpenFeedback}>Оставить обратную связь</button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div>
                  <p className="label">Обратная связь</p>
                  <p style={{ color: 'var(--text3)', marginTop: 6, fontSize: 13 }}>Вопрос {feedbackCurrent + 1} из {FEEDBACK_QUESTIONS.length}</p>
                </div>
                <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={handleFeedbackBack}>← Назад</button>
              </div>

              <h3 style={{ fontSize: 18, marginBottom: 18, fontWeight: 700, color: 'var(--text)' }}>{feedbackQuestion.text}</h3>
              <div className="option-list">
                {feedbackQuestion.options.map((opt) => {
                  const isSelected = feedbackSelectedValue === opt.value;
                  return (
                    <button
                      key={opt.label}
                      onClick={() => handleFeedbackSelect(opt.value)}
                      className="option-button"
                      style={{
                        background: isSelected ? `${levelColor}15` : 'rgba(255,255,255,0.03)',
                        borderColor: isSelected ? levelColor : 'rgba(255,255,255,0.08)',
                        color: isSelected ? '#1a1a1a' : '#2c3e50',
                      }}
                    >
                      <span
                        className="radio-dot"
                        style={{
                          borderColor: isSelected ? levelColor : 'rgba(255,255,255,0.22)',
                          background: isSelected ? levelColor : 'transparent',
                        }}
                      >
                        {isSelected && <span />}
                      </span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
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
                <p style={{ color: '#1a891b', marginTop: 16, fontSize: 13, textAlign: 'center', fontWeight: 500 }}>{feedbackMessage}</p>
              )}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
