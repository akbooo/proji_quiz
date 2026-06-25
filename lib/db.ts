import { Pool, QueryResultRow } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Auto-apply schema migrations on first use
let migrated = false;
async function ensureMigrated() {
  if (migrated) return;
  migrated = true;
  const client = await pool.connect();
  try {
    // Add block column to questions if it doesn't exist
    await client.query(
      `ALTER TABLE questions ADD COLUMN IF NOT EXISTS block VARCHAR(60)`
    );

    // Add analytical & metadata columns to respondents if they don't exist
    await client.query(`
      ALTER TABLE respondents 
        ADD COLUMN IF NOT EXISTS segment_info JSONB,
        ADD COLUMN IF NOT EXISTS scores JSONB,
        ADD COLUMN IF NOT EXISTS total_score INTEGER,
        ADD COLUMN IF NOT EXISTS level VARCHAR(100),
        ADD COLUMN IF NOT EXISTS lead_score INTEGER,
        ADD COLUMN IF NOT EXISTS strongest_block VARCHAR(100),
        ADD COLUMN IF NOT EXISTS weakest_blocks TEXT[],
        ADD COLUMN IF NOT EXISTS answers JSONB,
        ADD COLUMN IF NOT EXISTS feedback JSONB,
        ADD COLUMN IF NOT EXISTS submission_id VARCHAR(100)
    `);
  } catch (err) {
    console.error('Migration error (non-fatal):', err);
  } finally {
    client.release();
  }
}

export async function query<T extends QueryResultRow = any>(text: string, params?: unknown[]) {
  await ensureMigrated();
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

export async function createQuestionRecord({ surveyId, text, icon, order, type, block, options }: { surveyId: string; text: string; icon: string; order: number; type: string; block?: string; options?: string[]; }) {
  await ensureMigrated();
  const result = await query(
    `INSERT INTO questions (survey_id, text, icon, "order", type, block, options)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [surveyId, text, icon, order, type, block || null, options ? JSON.stringify(options) : null],
  );
  return result.rows[0];
}

export async function getSurveys() {
  const result = await query(`SELECT * FROM surveys ORDER BY created_at DESC`);
  return result.rows;
}

export async function getSurveyById(surveyId: string) {
  const result = await query(`SELECT * FROM surveys WHERE id = $1`, [surveyId]);
  return result.rows[0];
}

export async function createRespondentRecord({ surveyId, contactInfo, flags }: { surveyId: string; contactInfo: unknown; flags?: string[]; }) {
  const result = await query(
    `INSERT INTO respondents (survey_id, contact_info, started_at, finished_at, flags)
     VALUES ($1, $2, NOW(), NULL, $3) RETURNING *`,
    [surveyId, contactInfo, flags || []],
  );
  return result.rows[0];
}

export async function updateRespondentFinishedAt(respondentId: string) {
  const result = await query(
    `UPDATE respondents SET finished_at = NOW() WHERE id = $1 RETURNING *`,
    [respondentId],
  );
  return result.rows[0];
}

export async function createAnswerRecord({ respondentId, questionId, value, timeSpentSec, flags }: { respondentId: string; questionId: string; value: string; timeSpentSec: number; flags?: string[]; }) {
  const result = await query(
    `INSERT INTO answers (respondent_id, question_id, value, time_spent_sec, flags)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [respondentId, questionId, value, timeSpentSec, flags || []],
  );
  return result.rows[0];
}

export async function getRespondentById(respondentId: string) {
  const result = await query(`SELECT * FROM respondents WHERE id = $1`, [respondentId]);
  return result.rows[0];
}

export async function getAnswersByRespondent(respondentId: string) {
  const result = await query(
    `SELECT a.*, q.text AS question_text, q.icon AS question_icon
     FROM answers a
     JOIN questions q ON q.id = a.question_id
     WHERE a.respondent_id = $1`,
    [respondentId],
  );
  return result.rows;
}

export async function getQuestionsBySurveyId(surveyId: string) {
  const result = await query(
    `SELECT * FROM questions WHERE survey_id = $1 ORDER BY "order" ASC`,
    [surveyId],
  );
  return result.rows;
}

export async function getRespondentsBySurveyId(surveyId: string) {
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

export async function findRespondentDuplicateContact(surveyId: string, contactInfo: { email?: string; phone?: string }) {
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

export async function findRespondentByContact(surveyId: string, contactInfo: unknown) {
  const result = await query(
    `SELECT * FROM respondents WHERE survey_id = $1 AND contact_info = $2`,
    [surveyId, contactInfo],
  );
  return result.rows[0];
}

export async function getActiveSurveyWithQuestions() {
  // Get the most recently created survey that has questions
  const surveyResult = await query(
    `SELECT s.* FROM surveys s
     INNER JOIN questions q ON q.survey_id = s.id
     ORDER BY s.created_at DESC
     LIMIT 1`
  );
  const survey = surveyResult.rows[0];
  if (!survey) return null;

  const questionsResult = await query(
    `SELECT * FROM questions WHERE survey_id = $1 ORDER BY "order" ASC`,
    [survey.id]
  );
  return { survey, questions: questionsResult.rows };
}

export async function deleteQuestionsBySurveyId(surveyId: string) {
  await query(`DELETE FROM questions WHERE survey_id = $1`, [surveyId]);
}

export async function getSurveysWithCounts() {
  const result = await query(
    `SELECT s.*,
            COUNT(DISTINCT q.id)::INT AS question_count,
            COUNT(DISTINCT r.id)::INT AS respondent_count
     FROM surveys s
     LEFT JOIN questions q ON q.survey_id = s.id
     LEFT JOIN respondents r ON r.survey_id = s.id
     GROUP BY s.id
     ORDER BY s.created_at DESC`
  );
  return result.rows;
}

export async function getOrCreateStaticSurvey() {
  const result = await query(
    `SELECT * FROM surveys WHERE prompt_source = $1 LIMIT 1`,
    ['static']
  );
  if (result.rows.length > 0) {
    return result.rows[0];
  }
  const insertResult = await query(
    `INSERT INTO surveys (title, description, prompt_source, prompt_text, created_at)
     VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
    [
      'Диагностический опросник (статический)',
      'Оценка готовности бизнеса к ИИ',
      'static',
      'Static survey questions'
    ]
  );
  return insertResult.rows[0];
}

export async function saveSubmissionRecord({
  submissionId,
  surveyId,
  answers,
  segment,
  contact,
  tracking,
  scores,
  total,
  level,
  leadScore,
  weakestBlocks,
  strongestBlock,
  feedback,
}: {
  submissionId: string;
  surveyId?: string;
  answers: any;
  segment: any;
  contact: any;
  tracking: any;
  scores: any;
  total: number;
  level: string;
  leadScore: number;
  weakestBlocks: string[];
  strongestBlock: string;
  feedback?: any;
}) {
  // 1. Check if it already exists (if so, we update feedback and contact info)
  const existing = await query(
    `SELECT id FROM respondents WHERE submission_id = $1 LIMIT 1`,
    [submissionId]
  );

  if (existing.rows.length > 0) {
    const respId = existing.rows[0].id;
    // Update existing respondent feedback
    await query(
      `UPDATE respondents 
       SET feedback = COALESCE($1, feedback),
           contact_info = COALESCE($2, contact_info)
       WHERE id = $3`,
      [feedback ? JSON.stringify(feedback) : null, contact ? JSON.stringify(contact) : null, respId]
    );
    return respId;
  }

  // 2. Resolve surveyId (if not provided, get/create static survey)
  let resolvedSurveyId = surveyId;
  if (!resolvedSurveyId) {
    const staticSurvey = await getOrCreateStaticSurvey();
    resolvedSurveyId = staticSurvey.id;
  }

  // 3. Insert respondent record
  const respondentResult = await query(
    `INSERT INTO respondents (
      survey_id, contact_info, started_at, finished_at, flags,
      segment_info, scores, total_score, level, lead_score,
      strongest_block, weakest_blocks, answers, submission_id, feedback
    ) VALUES ($1, $2, NOW(), NOW(), $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING id`,
    [
      resolvedSurveyId,
      JSON.stringify(contact),
      [tracking?.device || 'unknown'], // flags
      JSON.stringify(segment),
      JSON.stringify(scores),
      total,
      level,
      leadScore,
      strongestBlock,
      weakestBlocks,
      JSON.stringify(answers),
      submissionId,
      feedback ? JSON.stringify(feedback) : null,
    ]
  );

  const respondentId = respondentResult.rows[0].id;

  // 4. If it's an AI survey (not static), save separate answer records in the answers table
  const surveyResult = await query(`SELECT prompt_source FROM surveys WHERE id = $1`, [resolvedSurveyId]);
  const isStatic = surveyResult.rows[0]?.prompt_source === 'static';

  if (!isStatic && answers && typeof answers === 'object') {
    // Loop through answers and insert
    for (const [qId, val] of Object.entries(answers)) {
      // Check if qId is a valid UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(qId);
      if (isUuid) {
        try {
          await query(
            `INSERT INTO answers (respondent_id, question_id, value, time_spent_sec, flags)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT DO NOTHING`,
            [respondentId, qId, String(val), 10, JSON.stringify([])]
          );
        } catch (err) {
          console.error(`Failed to insert answer for question ${qId}:`, err);
        }
      }
    }
  }

  return respondentId;
}

