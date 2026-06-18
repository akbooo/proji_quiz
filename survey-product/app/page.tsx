'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');

  const createSurvey = async () => {
    setStatus('Сохраняем...');
    const response = await fetch('/api/surveys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, promptSource: 'groq' }),
    });

    if (response.ok) {
      setStatus('Опросник создан');
      setTitle('');
      setDescription('');
      return;
    }

    setStatus('Ошибка создания опросника');
  };

  return (
    <div className="page-wrap">
      <div className="card">
        <span className="label">AI Survey Product</span>
        <h1 className="screen-title">Генерация опросника на Groq</h1>
        <p className="screen-copy">Создайте MVP-опросник на основе промпта и сохраните структуру в PostgreSQL.</p>

        <div className="field-label">
          <label>Заголовок</label>
          <input className="field-control" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="field-label" style={{ marginTop: 16 }}>
          <label>Описание</label>
          <textarea className="field-control" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={createSurvey}>Создать опросник</button>
          <Link href="/respondents">
            <button className="btn btn-ghost">Перейти к респондентам</button>
          </Link>
        </div>

        {status && <p style={{ marginTop: 18, color: '#2c3e50' }}>{status}</p>}
      </div>
    </div>
  );
}
