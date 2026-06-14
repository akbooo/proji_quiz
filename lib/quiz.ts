export type Block = 'sales' | 'automation' | 'data' | 'team' | 'ai';

export type Level = 'start' | 'growth' | 'mature' | 'leader';

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

export const BLOCKS: Record<Block, { label: string; emoji: string; color: string }> = {
  sales: { label: 'Продажи', emoji: '💰', color: '#4f46e5' },
  automation: { label: 'Автоматизация', emoji: '⚙️', color: '#0f766e' },
  data: { label: 'Данные', emoji: '📊', color: '#0284c7' },
  team: { label: 'Команда', emoji: '👥', color: '#16a34a' },
  ai: { label: 'AI-готовность', emoji: '🤖', color: '#d97706' },
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
  },
  {
    id: 'city',
    label: 'Город',
    type: 'text',
    placeholder: 'Например, Алматы',
  },
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

export const QUESTIONS: Question[] = [
  {
    id: 'q1',
    block: 'sales',
    text: 'Как вы обычно получаете новых клиентов?',
    options: [
      { label: 'Только сарафанное радио', value: 0 },
      { label: 'Иногда реклама, в основном рекомендации', value: 3 },
      { label: 'Несколько работающих каналов привлечения', value: 7 },
      { label: 'Выстроенная система с понятной стоимостью клиента', value: 10 },
    ],
  },
  {
    id: 'q2',
    block: 'sales',
    text: 'Насколько прозрачно у вас устроена воронка от заявки до оплаты?',
    options: [
      { label: 'Заявки живут в чатах и памяти менеджеров', value: 0 },
      { label: 'Есть список лидов, но статусы обновляются нерегулярно', value: 4 },
      { label: 'Воронка есть, видим этапы и конверсию', value: 7 },
      { label: 'Управляем конверсией, скоростью сделки и повторными продажами', value: 10 },
    ],
  },
  {
    id: 'q3',
    block: 'sales',
    text: 'Знаете ли вы, сколько зарабатываете с одного клиента за все время?',
    options: [
      { label: 'Нет, не считали', value: 0 },
      { label: 'Примерно, на глаз', value: 3 },
      { label: 'Да, считаем регулярно', value: 7 },
      { label: 'Да, и используем это для решений по рекламе и продажам', value: 10 },
    ],
  },
  {
    id: 'q4',
    block: 'automation',
    text: 'Сколько рутинных задач в вашей команде выполняется вручную каждый день?',
    options: [
      { label: 'Почти все делается руками', value: 0 },
      { label: 'Часть автоматизирована', value: 3 },
      { label: 'Большинство процессов настроены', value: 7 },
      { label: 'Рутина почти полностью автоматизирована', value: 10 },
    ],
  },
  {
    id: 'q5',
    block: 'automation',
    text: 'Есть ли у вас CRM или система для работы с клиентами?',
    options: [
      { label: 'Нет, все в мессенджерах / таблицах', value: 0 },
      { label: 'Есть таблица или простой трекер', value: 4 },
      { label: 'Есть CRM, но используем частично', value: 7 },
      { label: 'CRM настроена, команда работает в ней каждый день', value: 10 },
    ],
  },
  {
    id: 'q6',
    block: 'automation',
    text: 'Как быстро новый лид попадает к ответственному человеку?',
    options: [
      { label: 'Когда кто-то заметит сообщение', value: 0 },
      { label: 'Обычно в течение дня', value: 4 },
      { label: 'В течение часа, есть уведомления и ответственный', value: 7 },
      { label: 'Автоматически, с задачей, статусом и источником заявки', value: 10 },
    ],
  },
  {
    id: 'q7',
    block: 'data',
    text: 'Как вы принимаете важные бизнес-решения?',
    options: [
      { label: 'По интуиции и опыту', value: 0 },
      { label: 'Смотрим на выручку и продажи', value: 3 },
      { label: 'Смотрим на несколько ключевых метрик', value: 7 },
      { label: 'У нас дашборд с актуальными данными', value: 10 },
    ],
  },
  {
    id: 'q8',
    block: 'data',
    text: 'Знаете ли вы, какой продукт или услуга приносит больше всего прибыли?',
    options: [
      { label: 'Нет точных данных', value: 0 },
      { label: 'Примерно понимаем', value: 4 },
      { label: 'Считаем, но не всегда актуально', value: 7 },
      { label: 'Да, знаем точно и управляем этим', value: 10 },
    ],
  },
  {
    id: 'q9',
    block: 'team',
    text: 'Есть ли у сотрудников понятные задачи и зоны ответственности?',
    options: [
      { label: 'Все на словах, никто не записывал', value: 0 },
      { label: 'Частично описано', value: 3 },
      { label: 'Есть должностные обязанности', value: 7 },
      { label: 'Четкие роли, KPI и регулярные встречи', value: 10 },
    ],
  },
  {
    id: 'q10',
    block: 'team',
    text: 'Что происходит, если ключевой сотрудник уходит в отпуск?',
    options: [
      { label: 'Работа встает', value: 0 },
      { label: 'Проблемы, но справляемся', value: 4 },
      { label: 'Есть замена, но с потерями', value: 7 },
      { label: 'Процессы описаны, замена работает без потерь', value: 10 },
    ],
  },
  {
    id: 'q11',
    block: 'ai',
    text: 'Использует ли ваша команда AI-инструменты в работе?',
    options: [
      { label: 'Нет, не пробовали', value: 0 },
      { label: 'Иногда, для личных задач', value: 3 },
      { label: 'Да, несколько человек регулярно', value: 7 },
      { label: 'AI встроен в рабочие процессы команды', value: 10 },
    ],
  },
  {
    id: 'q12',
    block: 'ai',
    text: 'Готовы ли ваши данные и процессы к AI-автоматизации?',
    options: [
      { label: 'Пока нет: данные разрознены, процессы не описаны', value: 0 },
      { label: 'Есть интерес, но нужно навести порядок', value: 3 },
      { label: 'Есть база: CRM, таблицы, понятные процессы', value: 7 },
      { label: 'Данные структурированы, можно запускать AI-сценарии', value: 10 },
    ],
  },
];

export function calculateScore(
  answers: Record<string, number>,
  segment: Partial<Segment> = {},
  contact: Partial<Contact> = {},
): ScoreResult {
  const byBlock: Record<Block, { sum: number; count: number }> = {
    sales: { sum: 0, count: 0 },
    automation: { sum: 0, count: 0 },
    data: { sum: 0, count: 0 },
    team: { sum: 0, count: 0 },
    ai: { sum: 0, count: 0 },
  };

  for (const q of QUESTIONS) {
    if (answers[q.id] !== undefined) {
      byBlock[q.block].sum += answers[q.id];
      byBlock[q.block].count += 1;
    }
  }

  const blockScores = {} as Record<Block, number>;
  let totalSum = 0;
  let totalCount = 0;

  for (const block of Object.keys(byBlock) as Block[]) {
    const { sum, count } = byBlock[block];
    blockScores[block] = count > 0 ? Math.round((sum / (count * 10)) * 100) : 0;
    totalSum += sum;
    totalCount += count;
  }

  const total = totalCount > 0 ? Math.round((totalSum / (totalCount * 10)) * 100) : 0;
  const levelInfo = getLevelInfo(total);
  const sorted = (Object.keys(blockScores) as Block[]).sort((a, b) => blockScores[a] - blockScores[b]);
  const weakestBlocks = sorted.slice(0, 3);
  const strongestBlock = [...sorted].reverse()[0];
  const leadScore = calculateLeadScore(total, blockScores, segment, contact);

  return {
    total,
    byBlock: blockScores,
    strongestBlock,
    weakestBlocks,
    leadScore,
    ...levelInfo,
    summary: getSummary(total, weakestBlocks[0], strongestBlock),
    comparison: getComparison(segment, weakestBlocks[0], total),
  };
}

function getLevelInfo(total: number): Pick<ScoreResult, 'level' | 'levelLabel' | 'levelColor'> {
  if (total < 30) return { level: 'start', levelLabel: 'Старт', levelColor: '#dc2626' };
  if (total < 55) return { level: 'growth', levelLabel: 'Рост', levelColor: '#d97706' };
  if (total < 75) return { level: 'mature', levelLabel: 'Зрелость', levelColor: '#0284c7' };
  return { level: 'leader', levelLabel: 'Лидер', levelColor: '#16a34a' };
}

function getSummary(total: number, weakest: Block, strongest: Block): string {
  const weakLabel = BLOCKS[weakest].label.toLowerCase();
  const strongLabel = BLOCKS[strongest].label.toLowerCase();

  if (total < 30) {
    return `Сейчас бизнес держится на ручном управлении. Самый быстрый рост даст наведение порядка в блоке "${weakLabel}", при этом у вас уже есть точка опоры: ${strongLabel}.`;
  }

  if (total < 55) {
    return `База уже есть, но рост тормозит несистемность. Главный ограничитель сейчас: ${weakLabel}; сильная зона, на которую можно опереться: ${strongLabel}.`;
  }

  if (total < 75) {
    return `Бизнес выглядит зрелым, но часть процессов еще зависит от людей и ручных решений. Усиление блока "${weakLabel}" может дать заметный скачок без увеличения хаоса.`;
  }

  return `У вас сильная управленческая база. Следующий уровень - масштабирование, AI-сценарии и точная аналитика вокруг зоны "${weakLabel}".`;
}

function getComparison(segment: Partial<Segment>, weakest: Block, total: number): string {
  const size = segment.companySize ? `компаний размера ${segment.companySize}` : 'похожих компаний';
  const model = segment.businessModel === 'b2b' ? 'B2B-бизнесов' : 'компаний вашего типа';
  const weakLabel = BLOCKS[weakest].label.toLowerCase();

  if (total >= 75) {
    return `Ваш результат выше типичного раннего MVP-бенчмарка для ${model}: чаще всего ${size} проседают именно в зоне "${weakLabel}".`;
  }

  return `Для ${model} это нормальная точка роста: у ${size} чаще всего первым ограничителем становится "${weakLabel}".`;
}

function calculateLeadScore(
  total: number,
  blockScores: Record<Block, number>,
  segment: Partial<Segment>,
  contact: Partial<Contact>,
): number {
  let score = 0;

  if (contact.phone || contact.email) score += 25;
  if (contact.company) score += 10;
  if (['11-30', '31-100', '100+'].includes(segment.companySize || '')) score += 20;
  if (['b2b', 'mixed'].includes(segment.businessModel || '')) score += 10;
  if (['scaling', 'systemize'].includes(segment.revenueStage || '')) score += 10;
  if (blockScores.automation < 60) score += 10;
  if (blockScores.sales < 60) score += 7;
  if (blockScores.data < 60) score += 5;
  if (total >= 35 && total <= 75) score += 3;

  return Math.min(score, 100);
}
