'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface StatsData {
  views: number;
  started: number;
  completed: number;
  withContact: number;
  avgScore: number;
  scoreDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  blockAggregations: Array<{
    block: string;
    answer_count: number;
    avg_value: number; // 0-10 или 0-100
  }>;
}

interface RespondentItem {
  id: string;
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
  flags: string[];
  answer_count: number;
}

const BLOCK_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  sales_support: { label: 'Продажи и клиентский сервис', emoji: '💰', color: '#d6a0ff' },
  automation: { label: 'Процессы и автоматизация', emoji: '⚙️', color: '#b6e8e3' },
  data_knowledge: { label: 'Данные и база знаний', emoji: '📊', color: '#82d5cc' },
  predictive_ops: { label: 'Планирование и аналитика', emoji: '📈', color: '#a8d5ba' },
  culture_ready: { label: 'Команда и культура', emoji: '👥', color: '#ffd966' },
};

export default function SurveyAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [survey, setSurvey] = useState<{ title: string; description: string; categories: string[] | null } | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [respondents, setRespondents] = useState<RespondentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const surveyRes = await fetch(`/api/surveys/${id}`);
      const surveyData = await surveyRes.json();
      setSurvey(surveyData.survey);

      const statsRes = await fetch(`/api/surveys/${id}/stats`);
      const statsData = await statsRes.json();
      setStats(statsData);

      const respondentsRes = await fetch(`/api/surveys/${id}/respondents`);
      const respondentsData = await respondentsRes.json();
      setRespondents(respondentsData.respondents || []);
    } catch (err) {
      console.error('Failed to load analytics data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="page-wrap">
        <div style={{ color: 'var(--text3)', fontWeight: 500 }}>Загружаем аналитику опроса...</div>
      </div>
    );
  }

  if (!survey || !stats) {
    return (
      <div className="page-wrap">
        <div className="card" style={{ textAlign: 'center' }}>
          <h1 className="screen-title">Опрос не найден</h1>
          <p className="screen-copy">Запрашиваемый опрос не существует.</p>
          <Link href="/admin">
            <button className="btn btn-primary">Назад в админку</button>
          </Link>
        </div>
      </div>
    );
  }

  // Funnel calculations
  const views = stats.views || 0;
  const started = stats.started || 0;
  const completed = stats.completed || 0;
  const withContact = stats.withContact || 0;

  const startConv = views > 0 ? Math.round((started / views) * 100) : 0;
  const completeConv = started > 0 ? Math.round((completed / started) * 100) : 0;
  const contactConv = completed > 0 ? Math.round((withContact / completed) * 100) : 0;
  const totalConv = views > 0 ? Math.round((withContact / views) * 100) : 0;

  // Distribution chart parameters
  const totalDist = stats.scoreDistribution.low + stats.scoreDistribution.medium + stats.scoreDistribution.high || 1;
  const lowPct = Math.round((stats.scoreDistribution.low / totalDist) * 100);
  const medPct = Math.round((stats.scoreDistribution.medium / totalDist) * 100);
  const highPct = Math.round((stats.scoreDistribution.high / totalDist) * 100);

  return (
    <div className="page-wrap page-wrap-scroll">
      <div className="dashboard-shell" style={{ maxWidth: 1000, width: '100%', padding: '20px 0' }}>
        
        {/* Header */}
        <header className="dashboard-header" style={{ marginBottom: 28 }}>
          <div>
            <span className="label">📊 Аналитика опросника</span>
            <h1 className="screen-title" style={{ margin: '8px 0 4px', fontSize: 28 }}>{survey.title}</h1>
            <p className="screen-copy" style={{ marginBottom: 0 }}>{survey.description}</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/admin">
              <button className="btn btn-ghost">← К списку опросов</button>
            </Link>
            <a href={`/survey/${id}`} target="_blank">
              <button className="btn btn-primary">🔗 Открыть опрос</button>
            </a>
          </div>
        </header>

        {/* Top Metric Cards */}
        <section className="metric-grid" style={{ marginBottom: 24 }}>
          <div className="metric-card">
            <span>Просмотры (view)</span>
            <strong>{views}</strong>
          </div>
          <div className="metric-card">
            <span>Начали (start)</span>
            <strong>{started} <small style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 400 }}>({startConv}%)</small></strong>
          </div>
          <div className="metric-card">
            <span>Завершили (complete)</span>
            <strong>{completed} <small style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 400 }}>({completeConv}%)</small></strong>
          </div>
          <div className="metric-card">
            <span>Оставили контакт (contact)</span>
            <strong>{withContact} <small style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 400 }}>({contactConv}%)</small></strong>
          </div>
        </section>

        <div className="dashboard-grid" style={{ marginBottom: 24 }}>
          
          {/* Funnel Visualisation */}
          <section className="result-section" style={{ background: 'var(--bg2)' }}>
            <p className="label" style={{ marginBottom: 16 }}>Воронка конверсии</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div className="bar-row">
                  <span>Открыли опрос</span>
                  <strong>100% ({views})</strong>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: '100%', background: 'var(--primary-blue)' }} />
                </div>
              </div>

              <div>
                <div className="bar-row">
                  <span>Начали прохождение</span>
                  <strong>{startConv}% ({started})</strong>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${startConv}%`, background: '#82d5cc' }} />
                </div>
              </div>

              <div>
                <div className="bar-row">
                  <span>Завершили вопросы</span>
                  <strong>{startConv > 0 ? Math.round((completed / views) * 100) : 0}% ({completed})</strong>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${startConv > 0 ? (completed / views) * 100 : 0}%`, background: '#ffd966' }} />
                </div>
              </div>

              <div>
                <div className="bar-row">
                  <span>Оставили контакты</span>
                  <strong>{totalConv}% ({withContact})</strong>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${totalConv}%`, background: '#e74c3c' }} />
                </div>
              </div>
            </div>
            <div style={{ marginTop: 16, fontSize: 13, color: 'var(--text3)' }}>
              Общая конверсия из просмотра в лид: <strong>{totalConv}%</strong>
            </div>
          </section>

          {/* Ratings & Score Distribution */}
          <section className="result-section" style={{ background: 'var(--bg2)' }}>
            <p className="label" style={{ marginBottom: 12 }}>Результаты и оценки</p>
            <div style={{ textAlign: 'center', padding: '16px 0', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
              <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--primary-blue)', lineHeight: 1 }}>
                {stats.avgScore}%
              </div>
              <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Средний score респондентов</div>
            </div>

            <p className="label" style={{ fontSize: 11, marginBottom: 10 }}>Распределение оценок</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div className="bar-row" style={{ fontSize: 12 }}>
                  <span>Low (0 - 49%)</span>
                  <strong>{lowPct}% ({stats.scoreDistribution.low})</strong>
                </div>
                <div className="bar-track" style={{ height: 5 }}>
                  <div className="bar-fill" style={{ width: `${lowPct}%`, background: '#e74c3c' }} />
                </div>
              </div>
              <div>
                <div className="bar-row" style={{ fontSize: 12 }}>
                  <span>Medium (50 - 79%)</span>
                  <strong>{medPct}% ({stats.scoreDistribution.medium})</strong>
                </div>
                <div className="bar-track" style={{ height: 5 }}>
                  <div className="bar-fill" style={{ width: `${medPct}%`, background: '#ffd966' }} />
                </div>
              </div>
              <div>
                <div className="bar-row" style={{ fontSize: 12 }}>
                  <span>High (80 - 100%)</span>
                  <strong>{highPct}% ({stats.scoreDistribution.high})</strong>
                </div>
                <div className="bar-track" style={{ height: 5 }}>
                  <div className="bar-fill" style={{ width: `${highPct}%`, background: '#82d5cc' }} />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Aggregations by Blocks */}
        <section className="result-section" style={{ background: 'var(--bg2)', marginBottom: 24 }}>
          <p className="label">Агрегации по блокам (Категории)</p>
          <div className="block-list" style={{ marginTop: 12 }}>
            {stats.blockAggregations && stats.blockAggregations.length > 0 ? (
              (() => {
                const DEFAULT_EMOJIS = ['📊', '⚙️', '👥', '📈', '💰', '📝', '🤖', '💡'];
                const DEFAULT_COLORS = ['#82d5cc', '#b6e8e3', '#ffd966', '#a8d5ba', '#d6a0ff', '#82d5cc'];
                const categories: string[] | null = survey.categories 
                  ? (typeof survey.categories === 'string' ? JSON.parse(survey.categories) : survey.categories)
                  : null;

                return stats.blockAggregations.map((agg) => {
                  const isCustom = agg.block.startsWith('cat_');
                  const catIdx = isCustom ? parseInt(agg.block.replace('cat_', '')) : -1;
                  
                  const info = categories && isCustom && catIdx >= 0 && catIdx < categories.length
                    ? {
                        label: categories[catIdx],
                        emoji: DEFAULT_EMOJIS[catIdx % DEFAULT_EMOJIS.length],
                        color: DEFAULT_COLORS[catIdx % DEFAULT_COLORS.length]
                      }
                    : (BLOCK_LABELS[agg.block] || { label: agg.block, emoji: '📝', color: '#b6e8e3' });
                  
                  const val = Math.round(agg.avg_value || 0);
                  const pct = val * 10;
                  return (

                  <div key={agg.block}>
                    <div className="bar-row">
                      <span>{info.emoji} {info.label}</span>
                      <strong>{pct}% ({val} / 10 баллов)</strong>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${pct}%`, background: info.color }} />
                    </div>
                  </div>
                  );
                });
              })()
            ) : (
              <div className="empty-state">Нет данных для агрегации по блокам.</div>
            )}
          </div>
        </section>

        {/* Respondents Detail List */}
        <section className="result-section" style={{ background: 'var(--bg2)' }}>
          <p className="label">Детализация по респондентам</p>
          <div style={{ overflowX: 'auto', marginTop: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text3)' }}>
                  <th style={{ padding: '8px 12px' }}>Респондент</th>
                  <th style={{ padding: '8px 12px' }}>Контакты</th>
                  <th style={{ padding: '8px 12px' }}>Дата старта</th>
                  <th style={{ padding: '8px 12px' }}>Статус</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {respondents.length > 0 ? (
                  respondents.map((resp) => {
                    const hasContact = resp.contact_info && (resp.contact_info.name || resp.contact_info.phone || resp.contact_info.email);
                    const name = resp.contact_info.name || 'Анонимный респондент';
                    const email = resp.contact_info.email;
                    const phone = resp.contact_info.phone;
                    const date = new Date(resp.started_at).toLocaleDateString('ru-RU', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const statusText = resp.finished_at ? '✅ Пройден' : '⏳ Не завершен';

                    return (
                      <tr 
                        key={resp.id} 
                        style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.2s' }}
                        onClick={() => router.push(`/admin/surveys/${id}/respondents/${resp.id}`)}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(26,26,26,0.03)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px' }}>
                          <strong style={{ display: 'block', color: 'var(--text)' }}>{name}</strong>
                          <small style={{ color: 'var(--text3)' }}>id: {resp.id.slice(0, 8)}...</small>
                        </td>
                        <td style={{ padding: '12px' }}>
                          {hasContact ? (
                            <>
                              {phone && <span style={{ display: 'block' }}>{phone}</span>}
                              {email && <span style={{ display: 'block', fontSize: 12, color: 'var(--text3)' }}>{email}</span>}
                            </>
                          ) : (
                            <span style={{ color: 'var(--text3)', fontStyle: 'italic' }}>Нет контактов</span>
                          )}
                        </td>
                        <td style={{ padding: '12px', color: 'var(--text2)' }}>{date}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: resp.finished_at ? '#27ae60' : '#f39c12',
                          }}>
                            {statusText}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, fontSize: 16, color: 'var(--primary-blue)' }}>
                          {resp.total_score !== null ? `${resp.total_score}%` : '—'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text3)' }}>
                      Респондентов пока нет.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}
