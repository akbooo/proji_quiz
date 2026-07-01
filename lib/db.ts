import { Pool, QueryResultRow } from 'pg';

const globalForPg = global as unknown as { pgPool: Pool };

export const pool =
  globalForPg.pgPool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== 'production') globalForPg.pgPool = pool;

// Auto-apply schema migrations on first use
let migrated = false;
export async function ensureMigrated() {
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

    // Add view_count column to surveys for funnel tracking
    await client.query(
      `ALTER TABLE surveys ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0`
    );

    // Add categories column to surveys for custom survey blocks mapping
    await client.query(
      `ALTER TABLE surveys ADD COLUMN IF NOT EXISTS categories JSONB`
    );

    // Add is_featured column to surveys for landing page
    await client.query(
      `ALTER TABLE surveys ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false`
    );
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

export async function createSurveyRecord({ title, description, promptSource, promptText, categories }: { title: string; description: string; promptSource: string; promptText: string | null; categories?: string[] }) {
  console.log({ title, description, promptSource, promptText, categories });
  const result = await query(
    `INSERT INTO surveys (title, description, prompt_source, prompt_text, categories, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
    [title, description, promptSource, promptText, categories ? JSON.stringify(categories) : null],
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

export async function getFeaturedSurveys(limit: number = 4) {
  const result = await query(
    `SELECT s.*,
            COUNT(DISTINCT q.id)::INT AS question_count,
            COUNT(DISTINCT r.id)::INT AS respondent_count
     FROM surveys s
     LEFT JOIN questions q ON q.survey_id = s.id
     LEFT JOIN respondents r ON r.survey_id = s.id
     WHERE s.is_featured = true
     GROUP BY s.id
     ORDER BY s.created_at DESC LIMIT $1`,
    [limit]
  );
  return result.rows;
}

export async function toggleSurveyFeatured(surveyId: string, isFeatured: boolean) {
  const result = await query(
    `UPDATE surveys SET is_featured = $1 WHERE id = $2 RETURNING *`,
    [isFeatured, surveyId]
  );
  return result.rows[0];
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

export async function updateRespondentContactRecord(respondentId: string, contactInfo: unknown) {
  const result = await query(
    `UPDATE respondents SET contact_info = $1 WHERE id = $2 RETURNING *`,
    [JSON.stringify(contactInfo), respondentId],
  );
  return result.rows[0];
}

export async function updateRespondentScoresAndContact({
  respondentId,
  contactInfo,
  segmentInfo,
  scores,
  totalScore,
  level,
  leadScore,
  strongestBlock,
  weakestBlocks,
  answersJson
}: {
  respondentId: string;
  contactInfo: any;
  segmentInfo: any;
  scores: any;
  totalScore: number;
  level: string;
  leadScore: number;
  strongestBlock: string;
  weakestBlocks: string[];
  answersJson: any;
}) {
  const result = await query(
    `UPDATE respondents 
     SET contact_info = $1,
         segment_info = $2,
         scores = $3,
         total_score = $4,
         level = $5,
         lead_score = $6,
         strongest_block = $7,
         weakest_blocks = $8,
         answers = $9,
         finished_at = NOW()
     WHERE id = $10
     RETURNING *`,
    [
      JSON.stringify(contactInfo),
      JSON.stringify(segmentInfo),
      JSON.stringify(scores),
      totalScore,
      level,
      leadScore,
      strongestBlock,
      weakestBlocks,
      JSON.stringify(answersJson),
      respondentId
    ]
  );
  return result.rows[0];
}

export async function updateRespondentFeedback(respondentId: string, feedback: any) {
  const result = await query(
    `UPDATE respondents SET feedback = $1 WHERE id = $2 RETURNING *`,
    [JSON.stringify(feedback), respondentId]
  );
  return result.rows[0];
}

export async function createAnswerRecord({ respondentId, questionId, value, timeSpentSec, flags }: { respondentId: string; questionId: string; value: string; timeSpentSec: number; flags?: string[]; }) {
  const result = await query(
    `INSERT INTO answers (respondent_id, question_id, value, time_spent_sec, flags)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [respondentId, questionId, value, timeSpentSec, JSON.stringify(flags || [])],
  );
  return result.rows[0];
}

export async function getRespondentById(respondentId: string) {
  const result = await query(
    `SELECT r.*, s.categories AS survey_categories, s.title AS survey_title
     FROM respondents r
     LEFT JOIN surveys s ON s.id = r.survey_id
     WHERE r.id = $1`,
    [respondentId],
  );
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


// ─── Analytics & funnel helpers ───────────────────────────────────────────────

export async function incrementSurveyViewCount(surveyId: string) {
  await query(
    `UPDATE surveys SET view_count = COALESCE(view_count, 0) + 1 WHERE id = $1`,
    [surveyId],
  );
}

export async function getSurveyStats(surveyId: string) {
  // Funnel: view → start → complete → contact
  const surveyRes = await query(`SELECT view_count FROM surveys WHERE id = $1`, [surveyId]);
  const views = surveyRes.rows[0]?.view_count ?? 0;

  const funnelRes = await query(
    `SELECT
       COUNT(*)::INT                                                      AS started,
       COUNT(finished_at)::INT                                            AS completed,
       COUNT(CASE WHEN contact_info IS NOT NULL
                   AND contact_info::TEXT != '{}'
                   AND contact_info::TEXT != 'null'
                   THEN 1 END)::INT                                       AS with_contact
     FROM respondents
     WHERE survey_id = $1`,
    [surveyId],
  );
  const { started, completed, with_contact } = funnelRes.rows[0];

  // Score aggregation
  const scoreRes = await query(
    `SELECT
       AVG(total_score)::REAL                                             AS avg_score,
       COUNT(CASE WHEN total_score < 50 THEN 1 END)::INT                 AS low,
       COUNT(CASE WHEN total_score >= 50 AND total_score < 80 THEN 1 END)::INT AS medium,
       COUNT(CASE WHEN total_score >= 80 THEN 1 END)::INT                AS high
     FROM respondents
     WHERE survey_id = $1 AND total_score IS NOT NULL`,
    [surveyId],
  );
  const { avg_score, low, medium, high } = scoreRes.rows[0];

  // Block aggregation (from respondents.scores)
  const respondentsRes = await query(
    `SELECT scores FROM respondents WHERE survey_id = $1 AND scores IS NOT NULL`,
    [surveyId]
  );
  
  const blockStats: Record<string, { sum: number; count: number }> = {};
  
  for (const row of respondentsRes.rows) {
    let scoresObj: Record<string, any> = {};
    if (typeof row.scores === 'string') {
      try {
        scoresObj = JSON.parse(row.scores);
      } catch (e) {}
    } else if (row.scores && typeof row.scores === 'object') {
      scoresObj = row.scores;
    }
    
    for (const [block, data] of Object.entries(scoresObj)) {
      if (data && typeof data.percentage === 'number') {
        if (!blockStats[block]) {
          blockStats[block] = { sum: 0, count: 0 };
        }
        blockStats[block].sum += data.percentage;
        blockStats[block].count += 1;
      }
    }
  }

  const blockAggregations = Object.entries(blockStats).map(([block, stat]) => ({
    block,
    answer_count: stat.count,
    avg_value: stat.count > 0 ? stat.sum / stat.count : 0
  })).sort((a, b) => a.block.localeCompare(b.block));

  return {
    views,
    started,
    completed,
    withContact: with_contact,
    avgScore: avg_score ? Math.round(avg_score) : 0,
    scoreDistribution: { low: low ?? 0, medium: medium ?? 0, high: high ?? 0 },
    blockAggregations,
  };
}

export async function getSurveyRespondentsDetailed(surveyId: string) {
  const result = await query(
    `SELECT
       r.id,
       r.contact_info,
       r.started_at,
       r.finished_at,
       r.total_score,
       r.level,
       r.flags,
       COUNT(a.id)::INT AS answer_count
     FROM respondents r
     LEFT JOIN answers a ON a.respondent_id = r.id
     WHERE r.survey_id = $1
     GROUP BY r.id
     ORDER BY r.started_at DESC NULLS LAST, r.id DESC`,
    [surveyId],
  );
  return result.rows;
}

export async function getRespondentDrilldown(respondentId: string) {
  const respRes = await query(
    `SELECT r.*, s.title AS survey_title, s.id AS survey_id
     FROM respondents r
     LEFT JOIN surveys s ON s.id = r.survey_id
     WHERE r.id = $1`,
    [respondentId],
  );
  const respondent = respRes.rows[0];
  if (!respondent) return null;

  const answersRes = await query(
    `SELECT
       a.id,
       a.value,
       a.time_spent_sec,
       a.flags,
       q.text        AS question_text,
       q.icon        AS question_icon,
       q.block       AS question_block,
       q.options     AS question_options,
       q."order"     AS question_order
     FROM answers a
     JOIN questions q ON q.id = a.question_id
     WHERE a.respondent_id = $1
     ORDER BY q."order" ASC`,
    [respondentId],
  );

  return { respondent, answers: answersRes.rows };
}
