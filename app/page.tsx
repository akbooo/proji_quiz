'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const blocks = [
  { emoji: '💰', label: 'Продажи' },
  { emoji: '⚙️', label: 'Автоматизация' },
  { emoji: '📊', label: 'Данные' },
  { emoji: '👥', label: 'Команда' },
  { emoji: '🤖', label: 'AI-готовность' },
];

function HomeContent() {
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const quizHref = query ? `/quiz?${query}` : '/quiz';

  return (
    <div className="page-wrap">
      <div className="card home-card" style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: 30 }}>
          <span className="label" style={{ color: '#2c3e50' }}>PROJI</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(28px, 5vw, 42px)',
          fontWeight: 750,
          lineHeight: 1.14,
          marginBottom: 16,
          color: '#1a1a1a',
        }}>
          Growth Score для бизнеса в Казахстане
        </h1>

        <p style={{
          fontSize: 16,
          color: '#2c3e50',
          lineHeight: 1.7,
          marginBottom: 34,
          maxWidth: 500,
          margin: '0 auto 34px',
        }}>
          12 вопросов, профиль зрелости по 5 блокам и понятный сигнал, где бизнес теряет деньги, процессы и скорость команды.
        </p>

        <div className="stats-row">
          {[
            { num: '5', label: 'зон анализа' },
            { num: '12', label: 'вопросов' },
            { num: 'Lead', label: 'скоринг' },
          ].map(({ num, label }) => (
            <div key={label}>
              <div style={{ fontSize: 26, fontWeight: 750, color: '#1a1a1a' }}>{num}</div>
              <div style={{ fontSize: 13, color: '#5a6c7d', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        <Link href={quizHref}>
          <button className="btn btn-primary" style={{ width: '100%', fontSize: 16, padding: '16px 28px' }}>
            Пройти диагностику →
          </button>
        </Link>

        <div className="chip-row">
          {blocks.map(({ emoji, label }) => (
            <span key={label} className="chip">
              {emoji} {label}
            </span>
          ))}
        </div>
      </div>

      <p style={{ marginTop: 20, fontSize: 13, color: '#5a6c7d', textAlign: 'center', maxWidth: 560 }}>
        Ответы сохраняются для аналитики Proji и помогают подготовить короткий разбор под вашу компанию.
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="page-wrap">
        <div style={{ color: '#5a6c7d' }}>Загружаем...</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
