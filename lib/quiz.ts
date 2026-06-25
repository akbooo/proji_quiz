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

export const QUESTIONS: Question[] = [
  {
    id: 'q1',
    block: 'culture_ready',
    text: 'Что нового вы узнали на сегодняшней лекции и как изменилось ваше понимание ИИ?',
    options: [
      { label: 'А) Узнал(а) много нового: раньше ИИ казался хайпом, а теперь я вижу конкретные точки применения в процессах.', value: 10 },
      { label: 'Б) Лекция подтвердила мои мысли: я укрепился в понимании трендов и получил готовые кейсы.', value: 7 },
      { label: 'В) Понял(а) главное: нам сначала нужно навести порядок в процессах, иначе ИИ только усилит хаос.', value: 4 },
      { label: 'Г) Ничего нового, я и так глубоко погружен в тему автоматизации.', value: 0 },
    ],
  },
  {
    id: 'q2',
    block: 'culture_ready',
    text: 'Появилось ли у вас желание внедрять ИИ-технологии в свой бизнес?',
    options: [
      { label: 'А) Да, появилось огромное желание, хочу начать тестировать инструменты уже на этой неделе.', value: 10 },
      { label: 'Б) Это желание у меня было и до лекции, а сейчас я окончательно убедился(лась), что двигаюсь в правильном направлении.', value: 7 },
      { label: 'В) Желание есть, но пока присутствует страх перед сложностью интеграции и безопасностью данных.', value: 4 },
      { label: 'Г) Особого желания нет: пока считаю, что для моей ниши классические процессы надежнее.', value: 0 },
    ],
  },
  {
    id: 'q3',
    block: 'sales_support',
    text: 'Как часто в компании случаются мелкие ошибки из-за «человеческого фактора» (забыли перезвонить, перепутали счет, потеряли задачу)?',
    options: [
      { label: 'А) Постоянно, это наша главная операционная боль.', value: 0 },
      { label: 'Б) Периодически бывают, но не критично для прибыли.', value: 4 },
      { label: 'В) Очень редко, у нас жесткий ручной контроль.', value: 7 },
      { label: 'Г) Никогда, наши текущие ИТ-системы полностью исключают такие ошибки.', value: 10 },
    ],
  },
  {
    id: 'q4',
    block: 'automation',
    text: 'Пробовали ли вы применять популярные нейросети (ChatGPT, Midjourney) для рабочих задач?',
    options: [
      { label: 'А) Да, использую регулярно как личного ассистента или инструмента для команды.', value: 10 },
      { label: 'Б) Пробовал(а) пару раз ради любопытства, но в систему и бизнес-процессы это не вошло.', value: 7 },
      { label: 'В) Слышал(а) много, но сам(а) или моя команда еще ни разу не открывали.', value: 4 },
      { label: 'Г) Нет и не планирую, в нашей сфере это неприменимо.', value: 0 },
    ],
  },
  {
    id: 'q5',
    block: 'data_knowledge',
    text: 'Насколько процессы в вашей компании готовы к автоматизации прямо сейчас?',
    options: [
      { label: 'А) Полностью готовы: всё описано в виде схем, алгоритмов, регламентов и чек-листов.', value: 10 },
      { label: 'Б) Готовы частично: регламенты есть только в ключевых отделах (например, продажи или поддержка).', value: 7 },
      { label: 'В) Не готовы: у нас «творческий хаос», каждый раз менеджеры действуют по-разному.', value: 4 },
      { label: 'Г) Затрудняюсь ответить, нужно сначала провести аудит и посмотреть со стороны.', value: 0 },
    ],
  },
  {
    id: 'q6',
    block: 'culture_ready',
    text: 'Что лично вас больше всего пугает в концепции «автоматизации процессов до 100%»?',
    options: [
      { label: 'А) Ошибки ИИ (вдруг он начнет «галлюцинировать», путать данные и сольет клиентов).', value: 0 },
      { label: 'Б) Безопасность данных (боюсь утечки коммерческой тайны и баз клиентов в облачные сервисы).', value: 4 },
      { label: 'В) Потеря контроля (сложно управлять и доверять тому, чего не понимаешь изнутри).', value: 7 },
      { label: 'Г) Меня ничего не пугает, я доверяю технологиям и готов рисковать ради роста.', value: 10 },
    ],
  },
  {
    id: 'q7',
    block: 'predictive_ops',
    text: 'Какую главную бизнес-цель вы хотите закрыть с помощью ИИ и автоматизации?',
    options: [
      { label: 'А) Радикально сократить расходы на персонал, операционку и ФОТ.', value: 10 },
      { label: 'Б) Увеличить скорость работы в разы и масштабироваться без раздувания штата.', value: 7 },
      { label: 'В) Полностью исключить ошибки и поднять качество сервиса до идеала.', value: 4 },
      { label: 'Г) Сделать бренд более технологичным, чтобы не проиграть конкурентам в будущем.', value: 0 },
    ],
  },
  {
    id: 'q8',
    block: 'sales_support',
    text: 'В каком отделе автоматизация прямо сейчас принесла бы вам самый быстрый и ощутимый доход?',
    options: [
      { label: 'А) Отдел продаж, маркетинг, лидогенерация и квалификация клиентов.', value: 10 },
      { label: 'Б) Клиентский сервис, техподдержка, аккаунтинг и работа с текущей базой.', value: 7 },
      { label: 'В) Производство, логистика, управление закупками или склад.', value: 4 },
      { label: 'Г) Административный блок: бухгалтерия, кадры, юридический отдел.', value: 0 },
    ],
  },
  {
    id: 'q9',
    block: 'predictive_ops',
    text: 'Если автоматизация освободит вашей команде 30% рабочего времени, куда вы его перенаправите?',
    options: [
      { label: 'А) На стратегию, генерацию идей, маркетинг и захват новых рынков.', value: 10 },
      { label: 'Б) На более глубокое, персональное и качественное общение с клиентами.', value: 7 },
      { label: 'В) Оптимизирую штат или фонд оплаты труда (ФОТ) для чистой экономии.', value: 4 },
      { label: 'Г) Не знаю, боюсь, сотрудники просто будут больше бездельничать в освободившееся время.', value: 0 },
    ],
  },
  {
    id: 'q10',
    block: 'culture_ready',
    text: 'Когда вы планируете запустить свой первый проект по автоматизации с ИИ?',
    options: [
      { label: 'А) Прямо сейчас, активно ищем подрядчика, решение или готовы зайти в пилот.', value: 10 },
      { label: 'Б) В течение ближайшего месяца-двух, формируем запрос.', value: 7 },
      { label: 'В) До конца этого года, пока собираем информацию и закладываем бюджет.', value: 4 },
      { label: 'Г) В обозримом будущем не планируем, пришли расширить кругозор.', value: 0 },
    ],
  },
  {
    id: 'q11',
    block: 'culture_ready',
    text: 'Какой следующий шаг после сегодняшней лекции выглядит для вас самым логичным?',
    options: [
      { label: 'А) Провести аудит компании и составить карту процессов для будущей автоматизации.', value: 10 },
      { label: 'Б) Прийти на индивидуальный разбор/консультацию к спикеру со своим бизнес-кейсом.', value: 7 },
      { label: 'В) Отправить ключевых сотрудников или руководителей отделов на обучение работе с ИИ.', value: 4 },
      { label: 'Г) Ничего не делать, продолжить работать в прежнем привычном режиме.', value: 0 },
    ],
  },
];

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
// ============================================================================
// 3. ОСНОВНАЯ ЛОГИКА РАСЧЕТА СКОРИНГА
// ============================================================================

export function calculateScore(
  answers: Record<string, number>,
  segment: Partial<Segment> = {},
  contact: Partial<Contact> = {},
): ScoreResult {
  const byBlock: Record<Block, { sum: number; count: number }> = {
    sales_support: { sum: 0, count: 0 },
    automation: { sum: 0, count: 0 },
    data_knowledge: { sum: 0, count: 0 },
    predictive_ops: { sum: 0, count: 0 },
    culture_ready: { sum: 0, count: 0 },
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

// ============================================================================
// 4. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (ХЕЛПЕРЫ)
// ============================================================================

function getLevelInfo(total: number): Pick<ScoreResult, 'level' | 'levelLabel' | 'levelColor'> {
  if (total < 30) return { level: 'analog', levelLabel: 'Аналоговый бизнес', levelColor: '#e74c3c' };
  if (total < 55) return { level: 'point_potential', levelLabel: 'Точечный потенциал', levelColor: '#f39c12' };
  if (total < 75) return { level: 'transformation', levelLabel: 'AI-Трансформация', levelColor: '#e1f2ab' };
  return { level: 'ai_leader', levelLabel: 'AI-Лидер', levelColor: '#b6e8e3' };
}

function getSummary(total: number, weakest: Block, strongest: Block): string {
  const weakLabel = BLOCKS[weakest].label.toLowerCase();
  const strongLabel = BLOCKS[strongest].label.toLowerCase();

  if (total < 30) {
    return `Внедрять ИИ пока рано. У вас высокий уровень хаоса в процессах и разрозненные данные. Если подключить нейросети сейчас, вы получите «автоматизированный хаос». Ваша первая точка роста — базовая оцифровка и наведение порядка в блоке "${weakLabel}" с помощью инструментов Proji, опираясь на текущие успехи в "${strongLabel}".`;
  }

  if (total < 55) {
    return `У вас хорошая база, но системности не хватает. ИИ не перестроит ваш бизнес целиком прямо сейчас, но точечно может закрыть сильные боли. Самый быстрый экономический эффект даст внедрение AI-сценариев в блоке "${weakLabel}". При этом сильной зоной остается "${strongLabel}".`;
  }

  if (total < 75) {
    return `Отличная готовность к AI-трансформации. Ваши процессы оцифрованы, данные собираются. Вы готовы к развертыванию полноценных AI-агентов, умных баз знаний и автоматизации контента. Фокус на блоке "${weakLabel}" позволит вам сделать качественный рывок вперед.`;
  }

  return `Вы — технологический лидер рынка. Ваш бизнес полностью готов к развертыванию предиктивных ML-моделей, кастомных AI-ассистентов и сквозной умной аналитики. Следующий шаг — максимизация ценности вокруг блока "${weakLabel}".`;
}

function getComparison(segment: Partial<Segment>, weakest: Block, total: number): string {
  const size = segment.companySize ? `компаний размера ${segment.companySize}` : 'похожих компаний';
  const model = segment.businessModel === 'b2b' ? 'B2B-сегмента' : 'вашего рынка';
  const weakLabel = BLOCKS[weakest].label.toLowerCase();

  if (total >= 75) {
    return `Ваш показатель AI-готовности значительно выше бенчмарков для ${model}: в то время как большинство конкурентов ${size} только пытаются разобраться с хаосом в "${weakLabel}", вы уже готовы к масштабированию нейросетей.`;
  }

  return `Для ${model} это стандартная картина: у большинства ${size} ключевым барьером на пути к ИИ становится именно незрелость блока "${weakLabel}". Вы идете в общем темпе рынка, но можете обогнать конкурентов за счет решений Proji.`;
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
  
  if (total >= 35 && total <= 75) score += 15;
  if (blockScores.automation < 50) score += 10;

  return Math.min(score, 100);
}

// ============================================================================
// 5. РАСЧЁТ СКОРА ИЗ ГОТОВЫХ БЛОЧНЫХ ПРОЦЕНТОВ (для AI-вопросов)
// ============================================================================

export const BLOCK_ORDER: Block[] = [
  'sales_support',
  'automation',
  'data_knowledge',
  'predictive_ops',
  'culture_ready',
];

/**
 * Принимает уже вычисленные проценты (0-100) по каждому блоку
 * и строит полноценный ScoreResult (аналогично calculateScore).
 */
export function calculateScoreFromRawBlocks(
  byBlock: Record<Block, number>,
  segment: Partial<Segment> = {},
  contact: Partial<Contact> = {},
): ScoreResult {
  const blocks = Object.keys(byBlock) as Block[];
  const total =
    blocks.length > 0
      ? Math.round(blocks.reduce((sum, b) => sum + byBlock[b], 0) / blocks.length)
      : 0;

  const sorted = [...blocks].sort((a, b) => byBlock[a] - byBlock[b]);
  const weakestBlocks = sorted.slice(0, 3);
  const strongestBlock = [...sorted].reverse()[0];
  const levelInfo = getLevelInfo(total);
  const leadScore = calculateLeadScore(total, byBlock, segment, contact);

  return {
    total,
    byBlock,
    strongestBlock,
    weakestBlocks,
    leadScore,
    ...levelInfo,
    summary: getSummary(total, weakestBlocks[0], strongestBlock),
    comparison: getComparison(segment, weakestBlocks[0], total),
  };
}