'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { cleanOptionText } from '@/lib/quiz';

interface RespondentInfo {
  id: string;
  survey_id: string;
  survey_title: string;
  contact_info: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
  };
  started_at: string;
  finished_at: string | null;
  total_score: number | null;
  level: string | null;
  lead_score: number | null;
  strongest_block: string | null;
  weakest_blocks: string[] | null;
  survey_categories: string[] | null;
}

interface AnswerItem {
  id: string;
  value: string;
  time_spent_sec: number;
  flags: string[];
  question_text: string;
  question_icon: string | null;
  question_block: string;
  question_options: string[] | null;
  question_order: number;
}

const BLOCK_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  sales_support: { label: 'Продажи и клиентский сервис', emoji: '💰', color: '#d6a0ff' },
  automation: { label: 'Процессы и автоматизация', emoji: '⚙️', color: '#b6e8e3' },
  data_knowledge: { label: 'Данные и база знаний', emoji: '📊', color: '#82d5cc' },
  predictive_ops: { label: 'Планирование и аналитика', emoji: '📈', color: '#a8d5ba' },
  culture_ready: { label: 'Команда и культура', emoji: '👥', color: '#ffd966' },
};

export default function RespondentDrilldownPage({
  params,
}: {
  params: Promise<{ id: string; respondentId: string }>;
}) {
  const { id, respondentId } = use(params);

  const [respondent, setRespondent] = useState<RespondentInfo | null>(null);
  const [answers, setAnswers] = useState<AnswerItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const res = await fetch(`/api/surveys/${id}/respondents/${respondentId}`);
      if (res.ok) {
        const data = await res.json();
        setRespondent(data.respondent);
        setAnswers(data.answers || []);
      }
    } catch (err) {
      console.error('Failed to load drilldown data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (respondentId) loadData();
  }, [id, respondentId]);

  if (loading) {
    return (
      <div className="page-wrap">
        <div style={{ color: 'var(--text3)', fontWeight: 500 }}>Загружаем ответы респондента...</div>
      </div>
    );
  }

  if (!respondent) {
    return (
      <div className="page-wrap">
        <div className="card" style={{ textAlign: 'center' }}>
          <h1 className="screen-title">Респондент не найден</h1>
          <p className="screen-copy">Данные по респонденту не существуют или были удалены.</p>
          <Link href={`/admin/surveys/${id}`}>
            <button className="btn btn-primary">Назад к аналитике</button>
          </Link>
        </div>
      </div>
    );
  }

  const name = respondent.contact_info.name || 'Анонимный респондент';
  const hasContact = respondent.contact_info && (respondent.contact_info.name || respondent.contact_info.phone || respondent.contact_info.email);

  return (
    <div className="page-wrap page-wrap-scroll">
      <div className="dashboard-shell" style={{ maxWidth: 850, width: '100%', padding: '20px 0' }}>
        
        {/* Header */}
        <header className="dashboard-header" style={{ marginBottom: 28 }}>
          <div>
            <span className="label">👤 Детализация ответов (drill-down)</span>
            <h1 className="screen-title" style={{ margin: '8px 0 4px', fontSize: 28 }}>{name}</h1>
            <p className="screen-copy" style={{ marginBottom: 0 }}>
              Опрос: <strong>{respondent.survey_title || 'Загрузка...'}</strong>
            </p>
          </div>
          <Link href={`/admin/surveys/${id}`}>
            <button className="btn btn-ghost">← К аналитике опроса</button>
          </Link>
        </header>

        {/* Profile Card & Scores */}
        <div className="dashboard-grid" style={{ marginBottom: 24 }}>
          
          {/* Profile Card */}
          <section className="result-section" style={{ background: 'var(--bg2)' }}>
            <p className="label" style={{ marginBottom: 12 }}>Контактные данные</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <span style={{ fontSize: 12, color: 'var(--text3)', display: 'block' }}>Имя:</span>
                <strong style={{ fontSize: 16 }}>{name}</strong>
              </div>
              {respondent.contact_info.phone && (
                <div>
                  <span style={{ fontSize: 12, color: 'var(--text3)', display: 'block' }}>Телефон:</span>
                  <strong style={{ fontSize: 16 }}>{respondent.contact_info.phone}</strong>
                </div>
              )}
              {respondent.contact_info.email && (
                <div>
                  <span style={{ fontSize: 12, color: 'var(--text3)', display: 'block' }}>Email:</span>
                  <strong style={{ fontSize: 16 }}>{respondent.contact_info.email}</strong>
                </div>
              )}
              {respondent.contact_info.company && (
                <div>
                  <span style={{ fontSize: 12, color: 'var(--text3)', display: 'block' }}>Компания:</span>
                  <strong style={{ fontSize: 16 }}>{respondent.contact_info.company}</strong>
                </div>
              )}
              {!hasContact && (
                <div style={{ fontStyle: 'italic', color: 'var(--text3)' }}>
                  Респондент не оставил контакты
                </div>
              )}
            </div>
          </section>

          {/* Scores Panel */}
          <section className="result-section" style={{ background: 'var(--bg2)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p className="label" style={{ marginBottom: 12 }}>Результаты скоринга</p>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <div style={{ textAlign: 'center', padding: '8px 24px', background: 'rgba(26,26,26,0.04)', borderRadius: 10 }}>
                <span style={{ fontSize: 44, fontWeight: 800, color: 'var(--primary-blue)' }}>
                  {respondent.total_score !== null ? `${respondent.total_score}%` : '—'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text3)', display: 'block' }}>Total Score</span>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                  {respondent.level || 'Не пройден'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>
                  Lead Score: <strong>{respondent.lead_score ?? 0} / 100</strong>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                  Старт: {new Date(respondent.started_at).toLocaleString('ru-RU')}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Detailed Answers */}
        <section className="result-section" style={{ background: 'var(--bg2)' }}>
          <p className="label" style={{ marginBottom: 16 }}>Ответы респондента по вопросам</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {(() => {
              const DEFAULT_EMOJIS = ['📊', '⚙️', '👥', '📈', '💰', '📝', '🤖', '💡'];
              const DEFAULT_COLORS = ['#82d5cc', '#b6e8e3', '#ffd966', '#a8d5ba', '#d6a0ff', '#82d5cc'];
              const categories: string[] | null = respondent.survey_categories 
                ? (typeof respondent.survey_categories === 'string' ? JSON.parse(respondent.survey_categories) : respondent.survey_categories)
                : null;

              return answers.map((ans, idx) => {
                const isCustom = ans.question_block?.startsWith('cat_');
                const catIdx = isCustom ? parseInt(ans.question_block.replace('cat_', '')) : -1;
                
                const blockInfo = categories && isCustom && catIdx >= 0 && catIdx < categories.length
                  ? {
                      label: categories[catIdx],
                      emoji: DEFAULT_EMOJIS[catIdx % DEFAULT_EMOJIS.length],
                      color: DEFAULT_COLORS[catIdx % DEFAULT_COLORS.length]
                    }
                  : (BLOCK_LABELS[ans.question_block] || { label: ans.question_block, emoji: '📝', color: '#b6e8e3' });
                
                const isFast = ans.flags && (Array.isArray(ans.flags) ? ans.flags.includes('fast answer') : String(ans.flags).includes('fast answer'));
                return (
                  <div 
                    key={ans.id}
                    style={{
                      padding: '16px',
                      borderRadius: 10,
                      border: '1.5px solid var(--border)',
                      background: 'rgba(255, 255, 255, 0.4)',
                    }}
                  >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 18 }}>{ans.question_icon || '❓'}</span>
                      <strong style={{ fontSize: 15, color: 'var(--text)' }}>
                        Вопрос {ans.question_order || idx + 1}: {ans.question_text}
                      </strong>
                    </div>
                    <span 
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: blockInfo.color,
                        color: 'var(--primary-blue)',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {blockInfo.emoji} {blockInfo.label}
                    </span>
                  </div>

                  <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(26,26,26,0.03)', borderRadius: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 2 }}>Выбранный ответ:</span>
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--primary-blue)' }}>{cleanOptionText(ans.value)}</span>
                  </div>

                  <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12, color: 'var(--text3)' }}>
                    <span>⏳ Время ответа: <strong>{ans.time_spent_sec} сек</strong></span>
                    {isFast && (
                      <span style={{ color: '#e74c3c', fontWeight: 600 }}>⚠️ Быстрый ответ (менее 5 сек)</span>
                    )}
                  </div>
                </div>
                );
              });
            })()}
          </div>
        </section>

      </div>
    </div>
  );
}
