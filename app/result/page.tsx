'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BLOCKS, type Block } from '@/lib/quiz';

interface ResultData {
  segment?: Record<string, string>;
  contact?: Record<string, string>;
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
          <p style={{ color: '#a7b0c0' }}>Данные результата не найдены.</p>
          <Link href="/quiz">
            <button className="btn btn-primary" style={{ marginTop: 20 }}>Пройти заново</button>
          </Link>
        </div>
      </div>
    );
  }

  const data = JSON.parse(decodeURIComponent(raw)) as ResultData;
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

  return (
    <div className="page-wrap page-wrap-scroll">
      <div className="result-shell">
        <section className="result-hero">
          <div>
            <span className="label" style={{ color: data.levelColor }}>PROJI GROWTH SCORE</span>
            <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', lineHeight: 1.12, marginTop: 12, marginBottom: 14 }}>
              Ваш бизнес набрал {data.total}/100
            </h1>
            <p style={{ color: '#a7b0c0', fontSize: 16, lineHeight: 1.7, maxWidth: 640 }}>{data.summary}</p>
          </div>

          <div className="score-panel">
            <div style={{ position: 'relative', width: 136, height: 136, flexShrink: 0 }}>
              <svg width="136" height="136" viewBox="0 0 136 136">
                <circle cx="68" cy="68" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
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
              <p style={{ color: '#d7dde8', fontWeight: 700, marginTop: 10 }}>
                Сильная зона: {BLOCKS[data.strongestBlock].label}
              </p>
              <p style={{ color: '#a7b0c0', fontSize: 14, marginTop: 6 }}>
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
            <p style={{ color: '#d7dde8', fontSize: 15, lineHeight: 1.7, marginTop: 14 }}>{data.comparison}</p>
            <div className="lead-box">
              <span>Внутренний Lead Score</span>
              <strong>{data.leadScore}/100</strong>
            </div>
          </div>
        </section>

        <section className="cta-band">
          <div>
            <p className="label" style={{ color: '#93c5fd' }}>Следующий шаг</p>
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
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="page-wrap">
        <div style={{ color: '#667085' }}>Загружаем результат...</div>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
