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
  // Блок: Sales & Support
  {
    id: 'q1',
    block: 'sales_support',
    text: 'Каким способом обрабатывается ПОДОВЛЯЮЩЕЕ БОЛЬШИНСТВО (80%+) типовых вопросов от клиентов?',
    options: [
      { label: 'Исключительно вручную: менеджеры каждый раз пишут ответы с нуля', value: 0 },
      { label: 'Вручную, но с ускорением: менеджеры копируют готовые шаблоны или скрипты', value: 3 },
      { label: 'Автоматически в простых случаях: настроен кнопочный бот, переводы на людей частые', value: 7 },
      { label: 'Полностью автоматически: умный ИИ-бот сам закрывает диалоги на основе базы знаний', value: 10 },
    ],
  },
  {
    id: 'q2',
    block: 'sales_support',
    text: 'Какой из подходов точнее всего описывает ваш текущий контроль качества переписок/звонков?',
    options: [
      { label: 'Работа менеджеров строится исключительно на доверии', value: 0 },
      { label: 'РОП проверяет малую часть диалогов раз в неделю', value: 4 },
      { label: 'Проверяем по чек-листам, но физически не успеваем охватить всё', value: 7 },
      { label: 'Абсолютно каждый диалог автоматически оцифрован и оценен ИИ', value: 10 },
    ],
  },

  // Блок: Automation & Routines
  {
    id: 'q3',
    block: 'automation',
    text: 'На каком этапе автоматизации находится обработка входящих документов (договоры, акты, счета)?',
    options: [
      { label: 'Ручной ввод: данные из документов перебиваются в CRM/1С полностью руками', value: 0 },
      { label: 'Полуручной ввод: бланки стандартные, но перенос и сверка данных все еще ручные', value: 4 },
      { label: 'Гибридный формат: настроено распознавание (OCR), но человек обязательно всё перепроверяет', value: 7 },
      { label: 'Бесшовная автоматизация: документооборот цифровой, данные влетают в системы без участия людей', value: 10 },
    ],
  },
  {
    id: 'q4',
    block: 'automation',
    text: 'Как в компании решаются задачи по генерации текстов, отчетов, итоги встреч или ТЗ?',
    options: [
      { label: 'Каждый раз пишем с нуля', value: 0 },
      { label: 'Используем внутренние текстовые шаблоны и регламенты для ускорения процесса', value: 3 },
      { label: 'Сотрудники по личной инициативе используют внешние ИИ (ChatGPT/Claude) на рабочих местах', value: 7 },
      { label: 'Внедрены корпоративные ИИ-инструменты: итоги, отчеты и задачи создаются автоматически', value: 10 },
    ],
  },

  // Блок: Data & Knowledge
  {
    id: 'q5',
    block: 'data_knowledge',
    text: 'Где зафиксирована цифровая история взаимоотношений с клиентами и их покупок?',
    options: [
      { label: 'Данные разбросаны по личным блокнотам, Excel и WhatsApp-аккаунтам', value: 0 },
      { label: 'Есть общие таблицы (Excel/Sheets) без детальных логов и истории', value: 4 },
      { label: 'В классической CRM: система есть, данные собираются, но требуют регулярной чистки', value: 7 },
      { label: 'В единой CDP/CRM: база данных идеально чистая, структурированная и готова к аналитике', value: 10 },
    ],
  },
  {
    id: 'q6',
    block: 'data_knowledge',
    text: 'Каков статус корпоративной базы знаний (регламенты, частые вопросы, стандарты)?',
    options: [
      { label: 'Устная традиция: базы знаний нет, всё держится на опыте «старожилов»', value: 0 },
      { label: 'Есть папка на Google Диске, но там сложно что-то найти', value: 3 },
      { label: 'Активная база знаний: регламенты описаны и структурированы (Notion, Wiki), но поиск ручной', value: 7 },
      { label: 'Умная база знаний: интерактивная система с ИИ-поиском, которая сама выдает нужный ответ', value: 10 },
    ],
  },

  // Блок: Operations & Predictability
  {
    id: 'q7',
    block: 'predictive_ops',
    text: 'Каков ГЛАВНЫЙ инструмент прогнозирования спроса, закупок или загрузки на будущие периоды?',
    options: [
      { label: 'Интуиция: планируем «на глаз» или просто копируем показатели прошлого месяца', value: 0 },
      { label: 'Поверхностный анализ: смотрим на прошлые отчеты продаж и прикидываем тренд вручную', value: 4 },
      { label: 'Математические модели: строим сложные формулы и сводные таблицы в Excel', value: 7 },
      { label: 'Предиктивный софт: алгоритмы/ИИ сами рассчитывают прогноз с учетом сезонности и аномалий', value: 10 },
    ],
  },
  {
    id: 'q8',
    block: 'predictive_ops',
    text: 'Как быстро руководство узнает о критическом падении метрик или проблемах в процессах?',
    options: [
      { label: 'Постфактум: узнаем только в конце месяца при сведении финансового баланса', value: 0 },
      { label: 'С задержкой: замечаем через 1-2 недели, когда просадка долетает до операционных отчетов', value: 4 },
      { label: 'Быстро, но вручную: видим проблему за 1-2 дня, так как руководители мониторят отчеты руками', value: 7 },
      { label: 'В реальном времени: система мгновенно присылает алерты при любых аномальных отклонениях', value: 10 },
    ],
  },

  // Блок: AI Readiness & Culture
  {
    id: 'q9',
    block: 'culture_ready',
    text: 'Каков текущий уровень технической интеграции ИИ в вашу ИТ-инфраструктуру?',
    options: [
      { label: 'Нулевой: ИИ никак не связан с нашими рабочими инструментами', value: 0 },
      { label: 'Стадия обсуждения: планируем внедрение, но пока не выбрали сценарии и подрядчиков', value: 3 },
      { label: 'Точечные интеграции: ИИ подключен к отдельным элементам (например, к одному чат-боту)', value: 7 },
      { label: 'Глубокая интеграция: ИИ встроен в сквозные процессы (CRM, телефония, ERP) на уровне API', value: 10 },
    ],
  },
  {
    id: 'q10',
    block: 'culture_ready',
    text: 'Как выглядит преобладающее отношение сотрудников к ИИ на практике?',
    options: [
      { label: 'Отрицание/саботаж: избегают ИИ или считают его бесполезным', value: 0 },
      { label: 'Пассивное выполнение: используют ИИ-инструменты исключительно по жесткому приказу сверху', value: 4 },
      { label: 'Партизанский ИИ: сотрудники сами, тайно или неофициально, ускоряют свою работу через ИИ', value: 7 },
      { label: 'AI-культура: в компании внедрено официальное обучение, использование ИИ поощряется', value: 10 },
    ],
  },
  {
    id: 'q11',
    block: 'culture_ready',
    text: 'Определена ли в компании ключевая бизнес-цель внедрения ИИ на ближайшие полгода?',
    options: [
      { label: 'Цели нет: хотим внедрить «просто чтобы было»', value: 0 },
      { label: 'Линейная экономия: цель — сократить косты и урезать ФОТ за счет автоматизации задач', value: 4 },
      { label: 'Оптимизация времени: цель — разгрузить сильную команду от рутины, подняв их скорость', value: 7 },
      { label: 'Стратегический рост: цель — перестроить юнит-экономику, LTV и масштабировать бизнес', value: 10 },
    ],
  },
  {
    id: 'q12',
    block: 'culture_ready',
    text: 'В каком виде зафиксированы ваши регулярные бизнес-процессы?',
    options: [
      { label: 'Процессы хаотичны: всё меняется каждый день, регламентов нет даже на словах', value: 0 },
      { label: 'Процессы в головах: ключевая команда понимает логику, но жесткой фиксации нет', value: 4 },
      { label: 'Частично оцифрованы: основные воронки (например, движение лида) жестко зашиты в CRM', value: 7 },
      { label: 'Полная оцифровка: все ключевые процессы задокументированы в виде понятных блок-схем', value: 10 },
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