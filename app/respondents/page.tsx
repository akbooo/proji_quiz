'use client';

import Link from 'next/link';

export default function RespondentsPage() {
  return (
    <div className="page-wrap">
      <div className="card">
        <span className="label">Респонденты</span>
        <h1 className="screen-title">Прохождение опроса</h1>
        <p className="screen-copy">Эта страница пока заглушка MVP для проверки ответов и контактов.</p>

        <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
          <Link href="/admin">
            <button className="btn btn-ghost">Назад</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
