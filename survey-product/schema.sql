-- schema.sql

CREATE TABLE IF NOT EXISTS surveys (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  prompt_source TEXT NOT NULL,
  prompt_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  survey_id INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  icon TEXT,
  "order" INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'text'
);

CREATE TABLE IF NOT EXISTS respondents (
  id SERIAL PRIMARY KEY,
  survey_id INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  contact_info JSONB,
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  flags TEXT[] DEFAULT ARRAY[]::TEXT[]
);

CREATE TABLE IF NOT EXISTS answers (
  id SERIAL PRIMARY KEY,
  respondent_id INTEGER NOT NULL REFERENCES respondents(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  time_spent_sec INTEGER NOT NULL DEFAULT 0,
  flags TEXT[] DEFAULT ARRAY[]::TEXT[]
);

CREATE TABLE IF NOT EXISTS weight_rules (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  condition TEXT NOT NULL,
  weight INT DEFAULT 0,
  flag_label TEXT
);
