import { getFeaturedSurveys } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const featuredSurveys = await getFeaturedSurveys(4);

  return (
    <div className="page-wrap" style={{ padding: '60px 20px', alignItems: 'center' }}>
      <div style={{ 
        maxWidth: 800, 
        width: '100%', 
        textAlign: 'center', 
        marginBottom: 60,
        background: '#e9f4a5', // Pale greenish-yellow from image
        padding: '40px',
        borderRadius: '24px',
        border: '1px solid #d4e18b'
      }}>
        <div style={{ marginBottom: 24 }}>
          <span className="label" style={{ color: '#856404', background: 'rgba(133,100,4,0.1)' }}>
            PROJI
          </span>
        </div>
        
        <h1 style={{
          fontSize: 'clamp(32px, 6vw, 48px)',
          fontWeight: 800,
          lineHeight: 1.15,
          marginBottom: 24,
          color: '#1a1a1a',
        }}>
          Узнайте ваш Growth Score
        </h1>
        
        <p style={{
          fontSize: 'clamp(16px, 3vw, 18px)',
          color: '#4a5568',
          lineHeight: 1.6,
          maxWidth: 700,
          margin: '0 auto',
        }}>
          Growth Score — это масштабный исследовательский проект по оценке развития, цифровой трансформации и готовности некоммерческих и социальных организаций к внедрению AI. Выберите опрос ниже, чтобы начать диагностику.
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: 24, 
        maxWidth: 1000, 
        width: '100%' 
      }}>
        {featuredSurveys.map((survey) => {
          let categories: string[] = [];
          if (survey.categories) {
             if (Array.isArray(survey.categories)) {
               categories = survey.categories;
             } else if (typeof survey.categories === 'string') {
               try { categories = JSON.parse(survey.categories); } catch (e) {}
             }
          }
          
          return (
            <Link href={`/survey/${survey.id}`} key={survey.id} style={{ textDecoration: 'none' }}>
              <div className="card home-survey-card" style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'pointer',
                border: 'none',
                background: 'var(--primary-blue)'
              }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 12, flex: 1 }}>
                  {survey.title}
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, marginBottom: 20 }}>
                  {categories.length > 0 ? (
                    categories.map((cat, i) => (
                      <span key={i} style={{ 
                        background: 'rgba(255,255,255,0.15)', 
                        color: '#fff', 
                        padding: '6px 14px', 
                        borderRadius: '99px', 
                        fontSize: 13, 
                        fontWeight: 500 
                      }}>
                        {cat}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Без категорий</span>
                  )}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                    {survey.question_count || 0} вопросов
                  </span>
                  <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>
                    Пройти →
                  </span>
                </div>
              </div>
            </Link>
          );
        })}

        {featuredSurveys.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: '#718096', background: 'rgba(255,255,255,0.5)', borderRadius: 16, border: '1px dashed #cbd5e0' }}>
            Нет активных опросов. Пожалуйста, добавьте опросы на главную через панель администратора.
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .home-survey-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.08) !important;
        }
      `}} />
    </div>
  );
}
