import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function query<T = any>(text: string, params?: unknown[]) {
  const client = await pool.connect();
  try {
    const res = await client.query<T>(text, params);
    return res;
  } finally {
    client.release();
  }
}

export async function createSurveyRecord({ title, description, promptSource, promptText }: { title: string; description: string; promptSource: string; promptText: string | null; }) {
  console.log({ title, description, promptSource, promptText });
  const result = await query(
    `INSERT INTO surveys (title, description, prompt_source, prompt_text, created_at)
     VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
    [title, description, promptSource, promptText],
  );
  return result.rows[0];
}

export async function createQuestionRecord({ surveyId, text, icon, order, type }: { surveyId: string; text: string; icon: string; order: number; type: string; }) {
  const result = await query(
    `INSERT INTO questions (survey_id, text, icon, "order", type)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [surveyId, text, icon, order, type],
  );
  return result.rows[0];
}

export async function getSurveys() {
  const result = await query(`SELECT * FROM surveys ORDER BY created_at DESC`);
  return result.rows;
}

export async function getSurveyById(surveyId: number) {
  const result = await query(`SELECT * FROM surveys WHERE id = $1`, [surveyId]);
  return result.rows[0];
}

export async function createRespondentRecord({ surveyId, contactInfo, flags }: { surveyId: number; contactInfo: unknown; flags?: string[]; }) {
  const result = await query(
    `INSERT INTO respondents (survey_id, contact_info, started_at, finished_at, flags)
     VALUES ($1, $2, NOW(), NULL, $3) RETURNING *`,
    [surveyId, contactInfo, flags || []],
  );
  return result.rows[0];
}

export async function updateRespondentFinishedAt(respondentId: number) {
  const result = await query(
    `UPDATE respondents SET finished_at = NOW() WHERE id = $1 RETURNING *`,
    [respondentId],
  );
  return result.rows[0];
}

export async function createAnswerRecord({ respondentId, questionId, value, timeSpentSec, flags }: { respondentId: number; questionId: number; value: string; timeSpentSec: number; flags?: string[]; }) {
  const result = await query(
    `INSERT INTO answers (respondent_id, question_id, value, time_spent_sec, flags)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [respondentId, questionId, value, timeSpentSec, flags || []],
  );
  return result.rows[0];
}

export async function getRespondentById(respondentId: number) {
  const result = await query(`SELECT * FROM respondents WHERE id = $1`, [respondentId]);
  return result.rows[0];
}

export async function getAnswersByRespondent(respondentId: number) {
  const result = await query(
    `SELECT a.*, q.text AS question_text, q.icon AS question_icon
     FROM answers a
     JOIN questions q ON q.id = a.question_id
     WHERE a.respondent_id = $1`,
    [respondentId],
  );
  return result.rows;
}

export async function getQuestionsBySurveyId(surveyId: number) {
  const result = await query(
    `SELECT * FROM questions WHERE survey_id = $1 ORDER BY "order" ASC`,
    [surveyId],
  );
  return result.rows;
}

export async function getRespondentsBySurveyId(surveyId: number) {
  const result = await query(
    `SELECT r.id, r.contact_info, r.started_at, r.finished_at, r.flags,
            COUNT(a.id)::INT AS answer_count
     FROM respondents r
     LEFT JOIN answers a ON a.respondent_id = r.id
     WHERE r.survey_id = $1
     GROUP BY r.id
     ORDER BY r.finished_at DESC NULLS LAST, r.id DESC`,
    [surveyId],
  );
  return result.rows;
}

export async function findRespondentDuplicateContact(surveyId: number, contactInfo: { email?: string; phone?: string }) {
  const result = await query(
    `SELECT * FROM respondents
     WHERE survey_id = $1
       AND (
         (contact_info->>'email' = $2 AND $2 IS NOT NULL)
         OR (contact_info->>'phone' = $3 AND $3 IS NOT NULL)
       )
     LIMIT 1`,
    [surveyId, contactInfo.email || null, contactInfo.phone || null],
  );
  return result.rows[0];
}

export async function findRespondentByContact(surveyId: number, contactInfo: unknown) {
  const result = await query(
    `SELECT * FROM respondents WHERE survey_id = $1 AND contact_info = $2`,
    [surveyId, contactInfo],
  );
  return result.rows[0];
}
