export interface Survey {
  id: number;
  title: string;
  description: string;
  prompt_source: string;
  prompt_text: string | null;
  created_at: string;
}

export interface Question {
  id: number;
  survey_id: number;
  text: string;
  icon: string | null;
  order: number;
  type: string;
  block: string | null;
  options?: string[] | null;
}

export interface RespondentContact {
  name: string;
  email: string;
  phone: string;
}

export interface Respondent {
  id: number;
  survey_id: number;
  contact_info: RespondentContact;
  started_at: string | null;
  finished_at: string | null;
  flags: string[];
}

export interface Answer {
  id: number;
  respondent_id: number;
  question_id: number;
  value: string;
  time_spent_sec: number;
  flags: string[];
  question_text: string;
  question_icon: string | null;
}

export interface SurveyDraft {
  title: string;
  description: string;
  questions: Array<{
    text: string;
    icon: string;
    type: string;
    block: string;
    options?: string[];
  }>;
}
