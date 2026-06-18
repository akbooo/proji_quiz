'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  SURVEY_PROMPT,
  SURVEY_COUNT_OPTIONS,
  getSurveyQuestions,
  chooseOptimalSurveySize,
  auditSurveyQuestions,
} from '@/lib/quiz';

export default function SurveyPage() {
  const [selectedCount, setSelectedCount] = useState<number>(0);
  const [useOptimal, setUseOptimal] = useState(false);

  const effectiveCount = useMemo(() => {
    if (useOptimal) {
      return chooseOptimalSurveySize();
    }
    return selectedCount || 0;
  }, [selectedCount, useOptimal]);

  const questions = useMemo(() => getSurveyQuestions(effectiveCount), [effectiveCount]);
  const audit = useMemo(() => auditSurveyQuestions(questions), [questions]);

  return (
    <div className="page-wrap page-wrap-scroll">
      <div className="card" style={{ maxWidth: 760 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, marginBottom: 26 }}>
          <div>
            <span className="label">AI-опросник</span>
            <h1 className="screen-title" style={{ marginTop: 10 }}>Генератор пост-ивент опросника</h1>
            <p className="screen-copy">
              Тестовый кейс для выступления «Полная автоматизация бизнес-процессов с искусственным интеллектом: возможности AI».
              Выберите размер опроса, посмотрите предложенный комплект вопросов и получите базовую AI-аудит проверку.
            </p>
          </div>
          <Link href="/">
            <button className="btn btn-ghost" style={{ height: 44 }}>На главную</button>
          </Link>
        </div>

        <section className="result-section" style={{ marginBottom: 24 }}>
          <p className="label">Тестовый AI-промпт</p>
          <pre style={{ whiteSpace: 'pre-wrap', padding: 18, borderRadius: 12, background: 'rgba(255,255,255,0.7)', color: '#1a1a1a', fontSize: 14, lineHeight: 1.7, border: '1px solid rgba(26,26,26,0.08)' }}>
{SURVEY_PROMPT}
          </pre>
        </section>

        <section className="result-section" style={{ marginBottom: 24 }}>
          <p className="label">Выберите количество вопросов</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginTop: 16 }}>
            {SURVEY_COUNT_OPTIONS.map((option) => (
              <button
                key={option.count}
                type="button"
                className="btn"
                style={{
                  border: selectedCount === option.count && !useOptimal ? '2px solid #1a1a1a' : '1px solid rgba(26,26,26,0.12)',
                  background: selectedCount === option.count && !useOptimal ? '#f7f9d4' : 'transparent',
                  color: '#1a1a1a',
                  minHeight: 86,
                }}
                onClick={() => {
                  setSelectedCount(option.count);
                  setUseOptimal(false);
                }}
              >
                <strong style={{ display: 'block', marginBottom: 6 }}>{option.count}</strong>
                <small style={{ color: '#5a6c7d' }}>{option.label}</small>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18, alignItems: 'center' }}>
            <span style={{ color: '#5a6c7d' }}>Или</span>
            <button
              className="btn btn-primary"
              style={{ padding: '12px 18px' }}
              onClick={() => setUseOptimal(true)}
            >
              Предложите оптимальный
            </button>
            <span style={{ color: '#5a6c7d' }}>
              {useOptimal ? `Оптимальный объём: ${effectiveCount} вопросов` : effectiveCount ? `Выбрано ${effectiveCount}` : 'Выберите опцию'}
            </span>
          </div>
        </section>

        {effectiveCount > 0 && (
          <section className="result-section" style={{ marginBottom: 24 }}>
            <p className="label">Предложенный опросник</p>
            <p style={{ color: '#2c3e50', marginTop: 8, marginBottom: 18 }}>
              {useOptimal
                ? 'AI рекомендует этот объём на основе баланса глубины и скорости заполнения.'
                : 'Ниже предложены вопросы для выбранного объёма.'}
            </p>
            <ol style={{ paddingLeft: 18, color: '#1a1a1a', lineHeight: 1.8 }}>
              {questions.map((question, index) => (
                <li key={`${effectiveCount}-${index}`} style={{ marginBottom: 12 }}>
                  {question}
                </li>
              ))}
            </ol>
          </section>
        )}

        {effectiveCount > 0 && (
          <section className="result-section">
            <p className="label">AI-рекомендации</p>
            <div style={{ marginTop: 14, display: 'grid', gap: 16 }}>
              <div style={{ color: '#1a1a1a' }}>
                <strong>Анализ по объёму:</strong> {audit.summary}
              </div>
              {audit.issues.map((issue) => (
                <div key={issue.id} style={{ padding: 14, borderRadius: 12, background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(26,26,26,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start' }}>
                    <div>
                      <strong style={{ display: 'block', marginBottom: 8 }}>{issue.title}</strong>
                      <p style={{ color: '#2c3e50', fontSize: 14, lineHeight: 1.65, marginBottom: 10 }}>{issue.message}</p>
                      {issue.question && (
                        <p style={{ fontSize: 13, color: '#5a6c7d' }}><strong>Вопрос:</strong> {issue.question}</p>
                      )}
                    </div>
                    <button className="btn btn-ghost" disabled style={{ height: 38, fontSize: 13 }}>
                      Исправить автоматически
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
