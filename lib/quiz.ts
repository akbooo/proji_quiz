// ============================================================================
// 1. ТИПЫ И ИНТЕРФЕЙСЫ
// ============================================================================

export type Block = 'sales_support' | 'automation' | 'data_knowledge' | 'predictive_ops' | 'culture_ready';

export type Level = 'analog' | 'point_potential' | 'transformation' | 'ai_leader';

export interface Option {
  label: string;
  value: number;
}

export interface Question {
  id: string;
  block: Block;
  text: string;
  options: Option[];
}

export interface FeedbackQuestion {
  id: string;
  text: string;
  options: Option[];
}

export interface SegmentOption {
  label: string;
  value: string;
}

export interface SegmentField {
  id: keyof Segment;
  label: string;
  placeholder?: string;
  type: 'select' | 'text';
  options?: SegmentOption[];
}

export interface Segment {
  industry: string;
  companySize: string;
  businessModel: string;
  city: string;
  revenueStage: string;
}

export interface Contact {
  name: string;
  phone: string;
  email: string;
  company: string;
}

export interface TrackingData {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  referrer: string;
  landingPath: string;
  device: string;
  language: string;
}

export interface ScoreResult {
  total: number;
  byBlock: Record<Block, number>;
  level: Level;
  levelLabel: string;
  levelColor: string;
  strongestBlock: Block;
  weakestBlocks: Block[];
  summary: string;
  comparison: string;
  leadScore: number;
}

// ============================================================================
// 2. КОНСТАНТЫ И ДАННЫЕ
// ============================================================================

export const BLOCKS: Record<Block, { label: string; emoji: string; color: string }> = {
  sales_support: { label: 'Продажи и Клиентский сервис', emoji: '🤖', color: '#d6a0ff' },
  automation: { label: 'Рутинные процессы', emoji: '⚙️', color: '#b6e8e3' },
  data_knowledge: { label: 'Данные и База знаний', emoji: '📊', color: '#82d5cc' },
  predictive_ops: { label: 'Операционка и Прогнозы', emoji: '📈', color: '#a8d5ba' },
  culture_ready: { label: 'Культура и Готовность команды', emoji: '👥', color: '#ffd966' },
};

export const SEGMENT_FIELDS: SegmentField[] = [
  {
    id: 'industry',
    label: 'Сфера бизнеса',
    type: 'select',
    options: [
      { label: 'Услуги для бизнеса', value: 'b2b_services' },
      { label: 'Розница / e-commerce', value: 'retail' },
      { label: 'Образование', value: 'education' },
      { label: 'Медицина / wellness', value: 'health' },
      { label: 'Производство / логистика', value: 'operations' },
      { label: 'Другое', value: 'other' },
    ],
  },
  {
    id: 'companySize',
    label: 'Размер команды',
    type: 'select',
    options: [
      { label: '1-2 человека', value: '1-2' },
      { label: '3-10 человек', value: '3-10' },
      { label: '11-30 человек', value: '11-30' },
      { label: '31-100 человек', value: '31-100' },
      { label: '100+ человек', value: '100+' },
    ],
  },
  {
    id: 'businessModel',
    label: 'Модель продаж',
    type: 'select',
    options: [
      { label: 'B2B', value: 'b2b' },
      { label: 'B2C', value: 'b2c' },
      { label: 'B2B + B2C', value: 'mixed' },
      { label: 'Маркетплейсы / партнеры', value: 'partners' },
    ],
  },
  {
    id: 'revenueStage',
    label: 'Текущая стадия',
    type: 'select',
    options: [
      { label: 'Первые продажи', value: 'early' },
      { label: 'Стабильная выручка', value: 'stable' },
      { label: 'Растем и нанимаем', value: 'scaling' },
      { label: 'Нужна систематизация', value: 'systemize' },
    ],
  }
];

export const EMPTY_SEGMENT: Segment = {
  industry: '',
  companySize: '',
  businessModel: '',
  city: '',
  revenueStage: '',
};

export const EMPTY_CONTACT: Contact = {
  name: '',
  phone: '',
  email: '',
  company: '',
};



export const FEEDBACK_QUESTIONS: FeedbackQuestion[] = [
  {
    id: 'f1',
    text: 'Ваш главный вывод после теста:',
    options: [
      { label: 'У нас хаос в процессах, ИИ пока рано', value: 1 },
      { label: 'Увидел, какой именно блок тормозит развитие', value: 2 },
      { label: 'Понял, что мы готовы к AI-трансформации', value: 3 },
      { label: 'Ничего нового для себя не узнал', value: 4 },
    ],
  },
  {
    id: 'f2',
    text: 'Что планируете делать в ближайший месяц?',
    options: [
      { label: 'Ничего, сейчас нет приоритета на ИИ', value: 1 },
      { label: 'Наведу порядок в регламентах и данных', value: 2 },
      { label: 'Внедрю точечные решения (боты, шаблоны)', value: 3 },
      { label: 'Закажу разработку комплексной AI-стратегии', value: 4 },
    ],
  },
  {
    id: 'f3',
    text: 'Какая помощь от Proji вам интересна?',
    options: [
      { label: 'Никакая, разберусь сам', value: 1 },
      { label: 'Разбор теста и план действий', value: 2 },
      { label: 'Демонстрация кейсов под мою нишу', value: 3 },
      { label: 'Полный ИТ-аудит инфраструктуры', value: 4 },
    ],
  },
];


export function cleanOptionText(text: string): string {
  if (typeof text !== 'string') return '';
  return text
    .replace(/\s*[\(\[]\s*\d+(?:\.\d+)?\s*(?:баллов|балла|балл|points|point)?\s*[\)\]]/gi, '')
    .trim();
}