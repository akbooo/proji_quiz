'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BLOCKS, type Block } from '@/lib/quiz';

interface DashboardData {
  connected: boolean;
  completed: number;
  contacts: number;
  contactRate: number;
  averageScore: number;
  averageLeadScore: number;
  sourceCounts: Record<string, number>;
  cityCounts: Record<string, number>;
  industryCounts: Record<string, number>;
  weakZones: Record<Block, number>;
  hotLeads: Array<{
    date: string;
    name: string;
    company: string;
    contact: string;
    score: number;
    leadScore: number;
    weakZones: string;
    source: string;
  }>;
  error?: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((response) => response.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const topWeakZones = useMemo(() => {
    if (!data) return [];
    return (Object.keys(BLOCKS) as Block[])
      .map((block) => ({ block, count: data.weakZones[block] || 0 }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  if (loading) {
    return (
      <div className="page-wrap">
        <div style={{ color: '#667085' }}>Загружаем дашборд...</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="page-wrap page-wrap-scroll">
      <div className="dashboard-shell">
        <header className="dashboard-header">
          <div>
            <span className="label" style={{ color: '#38bdf8' }}>PROJI DASHBOARD</span>
            <h1>Growth Score аналитика</h1>
            <p>Прохождения, источники, слабые зоны и горячие лиды из Google Sheets.</p>
          </div>
          <Link href="/quiz">
            <button className="btn btn-primary">Открыть квиз</button>
          </Link>
        </header>

        {!data.connected && (
          <div className="notice" style={{ marginBottom: 18 }}>
            Google Sheets пока не подключен. Добавьте переменные окружения, и здесь появятся живые ответы.
          </div>
        )}

        {data.error && <div className="notice" style={{ marginBottom: 18 }}>{data.error}</div>}

        <section className="metric-grid">
          <Metric label="Прошли квиз" value={data.completed} />
          <Metric label="Оставили контакт" value={data.contacts} suffix={` · ${data.contactRate}%`} />
          <Metric label="Средний Score" value={data.averageScore} suffix="/100" />
          <Metric label="Средний Lead Score" value={data.averageLeadScore} suffix="/100" />
        </section>

        <section className="dashboard-grid">
          <Panel title="Источники трафика">
            <RankList data={data.sourceCounts} />
          </Panel>

          <Panel title="Зоны, которые проседают чаще">
            <div className="block-list">
              {topWeakZones.map(({ block, count }) => {
                const max = Math.max(...topWeakZones.map((item) => item.count), 1);
                return (
                  <div key={block}>
                    <div className="bar-row">
                      <span>{BLOCKS[block].emoji} {BLOCKS[block].label}</span>
                      <strong>{count}</strong>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${(count / max) * 100}%`, background: BLOCKS[block].color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Города">
            <RankList data={data.cityCounts} />
          </Panel>

          <Panel title="Сферы">
            <RankList data={data.industryCounts} />
          </Panel>
        </section>

        <section className="result-section">
          <p className="label">Горячие лиды</p>
          <div className="lead-table">
            <div className="lead-table-head">
              <span>Лид</span>
              <span>Score</span>
              <span>Lead</span>
              <span>Источник</span>
            </div>
            {data.hotLeads.length === 0 && (
              <div className="empty-state">Пока нет лидов с контактами.</div>
            )}
            {data.hotLeads.map((lead, index) => (
              <div className="lead-row" key={`${lead.date}-${lead.contact}-${index}`}>
                <div>
                  <strong>{lead.name}</strong>
                  <small>{lead.company || lead.contact || 'Контакт не указан'}</small>
                </div>
                <span>{lead.score}</span>
                <span>{lead.leadScore}</span>
                <span>{lead.source}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value, suffix = '' }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}{suffix}</strong>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="result-section">
      <p className="label">{title}</p>
      {children}
    </section>
  );
}

function RankList({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 8);

  if (!entries.length) {
    return <div className="empty-state">Пока нет данных.</div>;
  }

  const max = Math.max(...entries.map(([, count]) => count), 1);

  return (
    <div className="rank-list">
      {entries.map(([label, count]) => (
        <div key={label}>
          <div className="bar-row">
            <span>{label}</span>
            <strong>{count}</strong>
          </div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(count / max) * 100}%`, background: '#38bdf8' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
