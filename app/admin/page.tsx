'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SurveyItem {
  id: number;
  title: string;
  description: string;
  created_at: string;
  question_count: number;
  respondent_count: number;
}

type Tab = 'create' | 'surveys';
type Tone = 'neutral' | 'friendly' | 'professional';
type Focus = 'feedback' | 'satisfaction' | 'knowledge' | 'nps';

const TONE_LABELS: Record<Tone, string> = {
  neutral: 'Нейтральный',
  friendly: 'Дружелюбный',
  professional: 'Профессиональный',
};

const FOCUS_LABELS: Record<Focus, string> = {
  feedback: 'Обратная связь',
  satisfaction: 'Удовлетворённость',
  knowledge: 'Проверка знаний',
  nps: 'NPS / Рекомендации',
};

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('create');

  // Create form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questionCount, setQuestionCount] = useState(7);
  const [tone, setTone] = useState<Tone>('neutral');
  const [focus, setFocus] = useState<Focus>('feedback');
  const [extraContext, setExtraContext] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // Surveys list state
  const [surveys, setSurveys] = useState<SurveyItem[]>([]);
  const [surveysLoading, setSurveysLoading] = useState(false);

  // Regenerate modal state
  const [regenSurvey, setRegenSurvey] = useState<SurveyItem | null>(null);
  const [regenCount, setRegenCount] = useState(7);
  const [regenTone, setRegenTone] = useState<Tone>('neutral');
  const [regenFocus, setRegenFocus] = useState<Focus>('feedback');
  const [regenContext, setRegenContext] = useState('');
  const [regenLoading, setRegenLoading] = useState(false);
  const [regenStatus, setRegenStatus] = useState('');

  const loadSurveys = async () => {
    setSurveysLoading(true);
    try {
      const res = await fetch('/api/surveys');
      const data = await res.json();
      if (Array.isArray(data.surveys)) setSurveys(data.surveys);
    } catch {
      // ignore
    } finally {
      setSurveysLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'surveys') loadSurveys();
  }, [tab]);

  const createSurvey = async () => {
    if (!title.trim() || !description.trim()) {
      setStatus('Пожалуйста, заполните заголовок и описание');
      return;
    }

    setLoading(true);
    setStatus('Генерируем вопросы через AI...');
    try {
      const response = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, questionCount, tone, focus, extraContext, promptSource: 'groq' }),
      });

      if (response.ok) {
        const data = await response.json();
        setStatus('✅ Опросник создан и теперь активен на главной!');
        setTitle('');
        setDescription('');
        setExtraContext('');
        // Optionally navigate
        // router.push(`/survey/${data.surveyId}`);
        return;
      }

      setStatus('Ошибка создания опросника');
    } catch (err) {
      console.error(err);
      setStatus('Ошибка сети при создании опросника');
    } finally {
      setLoading(false);
    }
  };

  const openRegen = (survey: SurveyItem) => {
    setRegenSurvey(survey);
    setRegenCount(7);
    setRegenTone('neutral');
    setRegenFocus('feedback');
    setRegenContext('');
    setRegenStatus('');
  };

  const doRegenerate = async () => {
    if (!regenSurvey) return;
    setRegenLoading(true);
    setRegenStatus('Перегенерируем вопросы...');
    try {
      const res = await fetch(`/api/surveys/${regenSurvey.id}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionCount: regenCount,
          tone: regenTone,
          focus: regenFocus,
          extraContext: regenContext,
        }),
      });
      if (res.ok) {
        setRegenStatus('✅ Вопросы обновлены! Теперь на главной новые вопросы.');
        await loadSurveys();
      } else {
        setRegenStatus('Ошибка перегенерации');
      }
    } catch {
      setRegenStatus('Ошибка сети');
    } finally {
      setRegenLoading(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="page-wrap" style={{ alignItems: 'flex-start', paddingTop: 40 }}>
      <div className="card" style={{ maxWidth: 700 }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <span className="label">Панель администратора</span>
          <h1 className="screen-title" style={{ marginTop: 6 }}>AI-генератор опросников</h1>
          <p className="screen-copy" style={{ marginBottom: 0 }}>
            Создайте опрос — и он автоматически появится на{' '}
            <a href="/" target="_blank" style={{ color: 'var(--primary-blue)', textDecoration: 'underline' }}>
              главной странице
            </a>.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {(['create', 'surveys'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '10px 18px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 14,
                fontWeight: tab === t ? 700 : 500,
                color: tab === t ? 'var(--primary-blue)' : 'var(--text3)',
                borderBottom: tab === t ? '2px solid var(--primary-blue)' : '2px solid transparent',
                marginBottom: -1,
                transition: 'all 0.15s',
              }}
            >
              {t === 'create' ? '✨ Создать новый' : '📋 Мои опросники'}
            </button>
          ))}
        </div>

        {/* ── TAB: CREATE ── */}
        {tab === 'create' && (
          <div>
            <div className="field-label">
              <label style={{ fontWeight: 600 }}>Заголовок опроса</label>
              <input
                className="field-control"
                placeholder="Например: Мастер-класс по приготовлению пиццы"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="field-label" style={{ marginTop: 16 }}>
              <label style={{ fontWeight: 600 }}>Описание / Контекст</label>
              <textarea
                className="field-control"
                placeholder="Опишите тему, аудиторию и цель опроса. Чем больше деталей — тем лучше вопросы."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Question count */}
            <div className="field-label" style={{ marginTop: 16 }}>
              <label style={{ fontWeight: 600 }}>Количество вопросов</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                {[3, 5, 7, 12].map((count) => {
                  const isActive = questionCount === count;
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setQuestionCount(count)}
                      disabled={loading}
                      style={{
                        flex: 1,
                        padding: '10px 0',
                        borderRadius: 8,
                        border: '1.5px solid',
                        borderColor: isActive ? 'var(--primary-blue)' : 'var(--border)',
                        background: isActive ? 'var(--primary-blue)' : 'rgba(255,255,255,0.6)',
                        color: isActive ? '#fff' : 'var(--text)',
                        fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s',
                        fontFamily: 'inherit',
                        fontSize: 15,
                      }}
                    >
                      {count}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tone + Focus */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 16 }}>
              <div className="field-label">
                <label style={{ fontWeight: 600 }}>Тон вопросов</label>
                <select
                  className="field-control"
                  value={tone}
                  onChange={(e) => setTone(e.target.value as Tone)}
                  disabled={loading}
                >
                  {(Object.keys(TONE_LABELS) as Tone[]).map((t) => (
                    <option key={t} value={t}>{TONE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div className="field-label">
                <label style={{ fontWeight: 600 }}>Фокус опроса</label>
                <select
                  className="field-control"
                  value={focus}
                  onChange={(e) => setFocus(e.target.value as Focus)}
                  disabled={loading}
                >
                  {(Object.keys(FOCUS_LABELS) as Focus[]).map((f) => (
                    <option key={f} value={f}>{FOCUS_LABELS[f]}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Extra context */}
            <div className="field-label" style={{ marginTop: 16 }}>
              <label style={{ fontWeight: 600 }}>Дополнительные уточнения <span style={{ fontWeight: 400, color: 'var(--text3)' }}>(необязательно)</span></label>
              <textarea
                className="field-control"
                placeholder="Например: фокус на вопросах о питании, избегать технических терминов, аудитория — студенты."
                rows={2}
                value={extraContext}
                onChange={(e) => setExtraContext(e.target.value)}
                disabled={loading}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                onClick={createSurvey}
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? '⏳ Генерируем...' : '✨ Создать и сделать активным'}
              </button>
              <Link href="/respondents">
                <button className="btn btn-ghost" disabled={loading}>Респонденты</button>
              </Link>
            </div>

            {status && (
              <div
                style={{
                  marginTop: 16,
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: status.includes('Ошибка') ? 'rgba(192,57,43,0.08)' : 'rgba(16,47,93,0.08)',
                  color: status.includes('Ошибка') ? '#c0392b' : 'var(--primary-blue)',
                  fontWeight: 500,
                  fontSize: 14,
                }}
              >
                {status}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: MY SURVEYS ── */}
        {tab === 'surveys' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p style={{ fontSize: 14, color: 'var(--text3)' }}>
                Последний созданный опрос — активный на главной.
              </p>
              <button className="btn btn-ghost" style={{ fontSize: 13, padding: '8px 14px' }} onClick={loadSurveys}>
                🔄 Обновить
              </button>
            </div>

            {surveysLoading && (
              <div style={{ color: 'var(--text3)', fontSize: 14, padding: '20px 0' }}>Загружаем список...</div>
            )}

            {!surveysLoading && surveys.length === 0 && (
              <div style={{ color: 'var(--text3)', fontSize: 14, padding: '20px 0' }}>
                Опросников пока нет. Создайте первый во вкладке «Создать».
              </div>
            )}

            {!surveysLoading && surveys.map((survey, index) => (
              <div
                key={survey.id}
                style={{
                  padding: '16px 18px',
                  borderRadius: 10,
                  border: `1.5px solid ${index === 0 ? 'var(--primary-blue)' : 'var(--border)'}`,
                  background: index === 0 ? 'rgba(16,47,93,0.04)' : 'rgba(255,255,255,0.5)',
                  marginBottom: 12,
                  position: 'relative',
                }}
              >
                {index === 0 && (
                  <span style={{
                    position: 'absolute', top: -10, right: 14,
                    background: 'var(--primary-blue)', color: '#fff',
                    fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 999,
                    letterSpacing: '0.05em',
                  }}>
                    АКТИВНЫЙ
                  </span>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>
                      {survey.title}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.5 }}>
                      {survey.description?.slice(0, 100)}{survey.description?.length > 100 ? '…' : ''}
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                      <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                        📅 {formatDate(survey.created_at)}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                        ❓ {survey.question_count} вопросов
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                        👤 {survey.respondent_count} респондентов
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                    <a href={`/survey/${survey.id}`} target="_blank">
                      <button
                        style={{
                          width: '100%', padding: '8px 14px', borderRadius: 8,
                          border: '1px solid var(--border)', background: 'rgba(255,255,255,0.7)',
                          cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                        }}
                      >
                        👁 Открыть
                      </button>
                    </a>
                    <button
                      onClick={() => openRegen(survey)}
                      style={{
                        width: '100%', padding: '8px 14px', borderRadius: 8,
                        border: '1.5px solid var(--primary-blue)', background: 'transparent',
                        cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--primary-blue)',
                        fontFamily: 'inherit',
                      }}
                    >
                      🔁 Перегенерировать
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── REGENERATE MODAL ── */}
      {regenSurvey && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 24,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setRegenSurvey(null); }}
        >
          <div style={{
            background: 'var(--bg2)', borderRadius: 14, padding: 32,
            maxWidth: 520, width: '100%', position: 'relative',
            border: '1px solid var(--border)',
          }}>
            <button
              onClick={() => setRegenSurvey(null)}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 20, color: 'var(--text3)', lineHeight: 1,
              }}
            >×</button>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
              🔁 Перегенерировать вопросы
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20, lineHeight: 1.5 }}>
              «{regenSurvey.title}» — старые вопросы будут заменены новыми.
            </p>

            {/* Count */}
            <div className="field-label" style={{ marginBottom: 14 }}>
              <label style={{ fontWeight: 600 }}>Количество вопросов</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {[3, 5, 7, 12].map((count) => {
                  const isActive = regenCount === count;
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setRegenCount(count)}
                      disabled={regenLoading}
                      style={{
                        flex: 1, padding: '8px 0', borderRadius: 8,
                        border: '1.5px solid',
                        borderColor: isActive ? 'var(--primary-blue)' : 'var(--border)',
                        background: isActive ? 'var(--primary-blue)' : 'rgba(255,255,255,0.6)',
                        color: isActive ? '#fff' : 'var(--text)',
                        fontWeight: 600, cursor: regenLoading ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit', fontSize: 14,
                      }}
                    >
                      {count}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tone + Focus */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div className="field-label">
                <label style={{ fontWeight: 600 }}>Тон</label>
                <select className="field-control" value={regenTone} onChange={(e) => setRegenTone(e.target.value as Tone)} disabled={regenLoading}>
                  {(Object.keys(TONE_LABELS) as Tone[]).map((t) => (
                    <option key={t} value={t}>{TONE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div className="field-label">
                <label style={{ fontWeight: 600 }}>Фокус</label>
                <select className="field-control" value={regenFocus} onChange={(e) => setRegenFocus(e.target.value as Focus)} disabled={regenLoading}>
                  {(Object.keys(FOCUS_LABELS) as Focus[]).map((f) => (
                    <option key={f} value={f}>{FOCUS_LABELS[f]}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Extra context */}
            <div className="field-label" style={{ marginBottom: 20 }}>
              <label style={{ fontWeight: 600 }}>Уточнения <span style={{ fontWeight: 400, color: 'var(--text3)' }}>(необязательно)</span></label>
              <textarea
                className="field-control"
                rows={2}
                placeholder="Дополнительный контекст для AI..."
                value={regenContext}
                onChange={(e) => setRegenContext(e.target.value)}
                disabled={regenLoading}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setRegenSurvey(null)} disabled={regenLoading}>
                Отмена
              </button>
              <button className="btn btn-primary" onClick={doRegenerate} disabled={regenLoading} style={{ flex: 1 }}>
                {regenLoading ? '⏳ Генерируем...' : '🔁 Перегенерировать вопросы'}
              </button>
            </div>

            {regenStatus && (
              <div style={{
                marginTop: 14, padding: '10px 14px', borderRadius: 8,
                background: regenStatus.includes('Ошибка') ? 'rgba(192,57,43,0.08)' : 'rgba(16,47,93,0.08)',
                color: regenStatus.includes('Ошибка') ? '#c0392b' : 'var(--primary-blue)',
                fontSize: 13, fontWeight: 500,
              }}>
                {regenStatus}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
