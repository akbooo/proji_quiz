import { getActiveSurveyWithQuestions } from '@/lib/db';
import Link from 'next/link';

const blocks = [
  { emoji: '💰', label: 'Продажи' },
  { emoji: '⚙️', label: 'Автоматизация' },
  { emoji: '📊', label: 'Данные' },
  { emoji: '👥', label: 'Команда' },
  { emoji: '🤖', label: 'AI-готовность' },
];

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function Home(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;

  // Convert searchParams object to a query string
  const urlParams = new URLSearchParams();
  for (const [key, val] of Object.entries(searchParams || {})) {
    if (typeof val === 'string') {
      urlParams.set(key, val);
    } else if (Array.isArray(val)) {
      val.forEach(v => urlParams.append(key, v));
    }
  }
  const query = urlParams.toString();
  const quizHref = query ? `/quiz?${query}` : '/quiz';

  let questionCount = 11;
  let surveyTitle = 'Growth Score для бизнеса в Казахстане';

  try {
    const data = await getActiveSurveyWithQuestions();
    if (data) {
      if (data.questions && data.questions.length > 0) {
        questionCount = data.questions.length;
      }
      if (data.survey?.title) {
        surveyTitle = data.survey.title;
      }
    }
  } catch (err) {
    console.error('Failed to load active survey on server:', err);
  }

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
          {surveyTitle}
        </h1>

        <p style={{
          fontSize: 16,
          color: '#2c3e50',
          lineHeight: 1.7,
          marginBottom: 34,
          maxWidth: 500,
          margin: '0 auto 34px',
        }}>
          {questionCount} вопросов, профиль зрелости по 5 blocks и понятный сигнал, где бизнес теряет деньги, процессы и скорость команды.
        </p>

        <div className="stats-row">
          {[
            { num: '5', label: 'зон анализа' },
            { num: String(questionCount), label: 'вопросов' },
            { num: 'Lead', label: 'скоринг' },
          ].map(({ num, label }) => (
            <div key={label}>
              <div style={{ fontSize: 26, fontWeight: 750, color: '#1a1a1a' }}>{num}</div>
              <div style={{ fontSize: 13, color: '#5a6c7d', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gap: 12, width: '100%' }}>
          <Link href={quizHref}>
            <button className="btn btn-primary" style={{ width: '100%', fontSize: 16, padding: '16px 28px' }}>
              Пройти диагностику →
            </button>
          </Link>
        </div>

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
