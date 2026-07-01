import { Pool } from 'pg';

const pool = new Pool({ connectionString: 'postgresql://postgres.oqinqianacjbvrxvclaf:Army200418%40%23%24%25@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres' });

async function test() {
  const surveyId = '1fe0a751-69e8-45c9-b3fc-ef2ac8a50ef7';
  const respondentId = '33b05850-007d-40a1-bdda-bacf5a3ec07e';

  // Get a question
  const qRes = await pool.query('SELECT id FROM questions WHERE survey_id = $1 LIMIT 1', [surveyId]);
  if (qRes.rows.length === 0) {
    console.log('No questions found');
    return;
  }
  const questionId = qRes.rows[0].id;

  try {
    const res = await pool.query(
      `INSERT INTO answers (respondent_id, question_id, value, time_spent_sec, flags)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [respondentId, questionId, 'Test Value', 5, []]
    );
    console.log('Insert success:', res.rows[0]);
  } catch (err) {
    console.error('Insert failed:', err);
  }
  pool.end();
}

test().catch(console.error);
