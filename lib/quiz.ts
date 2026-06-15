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
  recommendations: string[];
  leadScore: number;
}

export const BLOCKS: Record<Block, { label: string; emoji: string; color: string }> = {
  sales: { label: 'Продажи', emoji: '💰', color: '#d6a0ff' },
  automation: { label: 'Автоматизация', emoji: '⚙️', color: '#b6e8e3' },
  data: { label: 'Данные', emoji: '📊', color: '#82d5cc' },
  team: { label: 'Команда', emoji: '👥', color: '#ffd966' },
  ai: { label: 'AI-готовность', emoji: '🤖', color: '#ffd966' },
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
text: 'Как выстроена работа с новыми заявками?',
options: [
{ label: 'Заявки приходят в личный WhatsApp, менеджеры разбирают их вручную.', value: 0 },
{ label: 'Есть Инстаграм/сайт, но лиды часто теряются в переписках или забываются.', value: 4 },
{ label: 'Все заявки падают в одно место, но нет четкого регламента, кто и когда звонит.', value: 7 },
{ label: 'Налажен стабильный поток, каждый лид фиксируется автоматически в системе.', value: 10 },
],
},
{
id: 'q2',
block: 'sales',
text: 'Что происходит после первого контакта с клиентом?',
options: [
{ label: 'Всё держится на памяти менеджеров, фиксации этапов нет.', value: 0 },
{ label: 'Ведем статус сделок в Excel/блокноте, но общую картину по воронке не видим.', value: 4 },
{ label: 'Этапы воронки есть в CRM, но менеджеры забывают вовремя двигать сделки.', value: 7 },
{ label: 'Четко видим конверсию каждого этапа, управляем циклом сделки.', value: 10 },
],
},
{
id: 'q3',
block: 'sales',
text: 'Как вы работаете с текущей базой клиентов?',
options: [
{ label: 'Никак, работаем только на входящий поток.', value: 0 },
{ label: 'Вспоминаем о клиентах только во время акций или праздников.', value: 3 },
{ label: 'База есть в таблице/CRM, иногда делаем по ней рассылки вручную.', value: 7 },
{ label: 'Настроена система повторных касаний, боты или менеджеры автоматически прогревают базу.', value: 10 },
],
},

{
id: 'q4',
block: 'automation',
text: 'Сколько времени уходит на подготовку документов (договоры, счета, КП)?',
options: [
{ label: 'Каждый документ менеджеры или бухгалтер заполняют вручную в Word/Excel.', value: 0 },
{ label: 'Есть шаблоны, но отправка и контроль оплат отнимают много времени.', value: 4 },
{ label: 'Частично автоматизировано через 1С или облачные сервисы.', value: 7 },
{ label: 'Документы генерируются и отправляются клиенту в 1 клик, статус оплаты виден сразу.', value: 10 },
],
},
{
id: 'q5',
block: 'automation',
text: 'Как команда использует CRM-систему?',
options: [
{ label: 'CRM нет, работаем в мессенджерах и блокнотах.', value: 0 },
{ label: 'Система есть, но для менеджеров это «лишняя отчетность», ведут из-под палки.', value: 3 },
{ label: 'CRM внедрена, но не интегрирована с телефонией, мессенджерами и сайтом.', value: 7 },
{ label: 'Это главный рабочий инструмент, все интеграции (WhatsApp, звонки) настроены.', value: 10 },
],
},
{
id: 'q6',
block: 'automation',
text: 'Как быстро клиент получает ответ на первую заявку?',
options: [
{ label: 'Может ждать часами или до следующего дня (особенно в выходные).', value: 0 },
{ label: 'В течение пары часов в рабочее время, ночью — тишина.', value: 4 },
{ label: 'Быстро (до 15 минут), но это требует постоянного дежурства людей.', value: 7 },
{ label: 'Мгновенно — автоответ или чат-бот сразу подхватывают клиента 24/7.', value: 10 },
],
},

{
id: 'q7',
block: 'data',
text: 'Как вы оцениваете эффективность бизнеса за месяц?',
options: [
{ label: 'Смотрим только на остаток денег на счету или Kaspi Pay.', value: 0 },
{ label: 'Бухгалтер собирает отчет по выручке, но реальную чистую прибыль посчитать сложно.', value: 3 },
{ label: 'Сводим данные из разных таблиц вручную, отчетность занимает несколько дней.', value: 7 },
{ label: 'Все ключевые метрики (ROI, чистая прибыль, маржа) видны на дашборде в реальном времени.', value: 10 },
],
},
{
id: 'q8',
block: 'data',
text: 'Знаете ли вы точную рентабельность каждого направления/продукта?',
options: [
{ label: 'Нет, считаем общую выручку.', value: 0 },
{ label: 'Понимаем примерно, какой продукт самый маржинальный, но без учета скрытых расходов.', value: 4 },
{ label: 'Считаем себестоимость и прибыль, но аналитика запаздывает.', value: 7 },
{ label: 'Точно знаем маржинальность каждой позиции и сразу отсекаем убыточные направления.', value: 10 },
],
},

{
id: 'q9',
block: 'team',
text: 'Насколько бизнес может функционировать без вашего участия?',
options: [
{ label: 'Всё замкнуто на мне. Если я отключу телефон на день — операционка встанет.', value: 0 },
{ label: 'Могу уехать на пару дней, но крупные сделки и проблемы решаю лично.', value: 3 },
{ label: 'Команда автономна в рутине, но стратегические и операционные отчеты собираю сам.', value: 7 },
{ label: 'Процессы регламентированы, команда работает по KPI, бизнес растет без моего микроменеджмента.', value: 10 },
],
},
{
id: 'q10',
block: 'team',
text: 'Как вы оцениваете эффективность работы менеджеров?',
options: [
{ label: 'Субъективно («хорошо работает» / «ленится»), твердых цифр нет.', value: 0 },
{ label: 'Видим только финальные продажи за месяц, но не понимаем, почему упали промежуточные метрики.', value: 4 },
{ label: 'Считаем количество звонков/заявок, но не анализируем качество переписок и разговоров.', value: 7 },
{ label: 'Прозрачная система KPI: оцифрованы и результаты, и действия.', value: 10 },
],
},

{
id: 'q11',
block: 'ai',
text: 'Применяет ли команда нейросети в ежедневных задачах?',
options: [
{ label: 'Нет, считаем это хайпом или не знаем, как применить.', value: 0 },
{ label: 'Сотрудники точечно используют ChatGPT.', value: 3 },
{ label: 'AI помогает в контенте и базовом анализе.', value: 7 },
{ label: 'AI встроен в бизнес-процессы.', value: 10 },
],
},
{
id: 'q12',
block: 'ai',
text: 'Ведется ли фиксация коммуникаций с клиентами?',
options: [
{ label: 'Все в личных телефонах и чатах.', value: 0 },
{ label: 'Есть чаты, но звонки не записываются.', value: 3 },
{ label: 'Есть телефония и база диалогов.', value: 7 },
{ label: 'Все оцифровано и готово для AI-аналитики.', value: 10 },
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
    recommendations: getRecommendations(total, weakestBlocks[0], strongestBlock, segment),
  };
}

function getLevelInfo(total: number): Pick<ScoreResult, 'level' | 'levelLabel' | 'levelColor'> {
  if (total < 30) return { level: 'start', levelLabel: 'Старт', levelColor: '#e74c3c' };
  if (total < 55) return { level: 'growth', levelLabel: 'Рост', levelColor: '#f39c12' };
  if (total < 75) return { level: 'mature', levelLabel: 'Зрелость', levelColor: '#e1f2ab' };
  return { level: 'leader', levelLabel: 'Лидер', levelColor: '#b6e8e3' };
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

function getRecommendations(
  total: number,
  weakest: Block,
  strongest: Block,
  segment: Partial<Segment>,
): string[] {
  const weakLabel = BLOCKS[weakest].label.toLowerCase();
  const strongLabel = BLOCKS[strongest].label.toLowerCase();
  const base: string[] = [];

  if (total < 30) {
    base.push(`Сосредоточьтесь на быстром выводе блока "${weakLabel}" из ручного режима: настройте одну понятную систему для привлечения, учета или коммуникаций.`);
    base.push(`Используйте вашу сильную зону "${strongLabel}" как опору: делайте изменения малыми, но регулярными.`);
    base.push('Простые процессы и прозрачная фиксация результата помогут собрать реальные данные для следующего шага роста.');
  } else if (total < 55) {
    base.push(`Систематизируйте блок "${weakLabel}" через один понятный рабочий процесс и минимальный контроль качества.`);
    base.push(`Опирайтесь на сильную зону "${strongLabel}" для поддержки роста: это позволит не терять эффективность при изменениях.`);
    base.push('Начните собирать одну-две ключевые метрики, чтобы быстрее видеть эффект от изменений.');
  } else if (total < 75) {
    base.push(`Усиление блока "${weakLabel}" даст вам заметный прирост, даже если текущие процессы уже работают.`);
    base.push(`Сильная зона "${strongLabel}" можно использовать для масштабирования: автоматизируйте повторяющиеся задачи и освободите команду.`);
    base.push('Тестируйте небольшие улучшения и фиксируйте результат через метрики, чтобы выбрать оптимальный сценарий роста.');
  } else {
    base.push(`Следующий уровень — масштабирование и AI: усилите блок "${weakLabel}" за счет данных, процессов и автоматизации.`);
    base.push(`Сейчас ваша сильная зона "${strongLabel}" может стать центром коммерциализации и расширения.`);
    base.push('Работайте на рост через точную аналитику, автоматические воронки и поддержку команды.');
  }

  if (segment.revenueStage === 'systemize') {
    base.push('Ваша компания готова к систематизации: зафиксируйте процессы и выберите самый слабый узел для быстрой оптимизации.');
  } else if (segment.revenueStage === 'scaling') {
    base.push('Для стадии роста важно перевести ключевые процессы в управляемую систему, чтобы команды не росли в хаосе.');
  }

  if (segment.companySize === '1-2' || segment.companySize === '3-10') {
    base.push('Сфокусируйтесь на инструментах и правилах, которые легко внедрить без больших затрат времени.');
  } else if (segment.companySize === '31-100' || segment.companySize === '100+') {
    base.push('Сделайте акцент на управлении и коммуникациях, чтобы масштаб не ухудшил качество работы.');
  }

  return base;
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
