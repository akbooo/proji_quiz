import { SurveyDraft } from '@/lib/types';

const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';

const TONE_INSTRUCTION: Record<string, string> = {
  neutral: 'Тон вопросов: нейтральный и деловой.',
  friendly: 'Тон вопросов: дружелюбный, тёплый и неформальный.',
  professional: 'Тон вопросов: строго профессиональный и экспертный.',
};

const FOCUS_INSTRUCTION: Record<string, string> = {
  feedback: 'Фокус: сбор развёрнутой обратной связи от участников.',
  satisfaction: 'Фокус: оценка удовлетворённости участников от мероприятия или продукта.',
  knowledge: 'Фокус: проверка знаний и понимания темы.',
  nps: 'Фокус: готовность участников рекомендовать мероприятие или продукт другим.',
};

const BLOCKS_DESCRIPTION = `
Вопросы должны равномерно охватывать 5 блоков готовности бизнеса к ИИ:
- Блок 1 «Продажи и Клиентский сервис»: применение ИИ в продажах, лидогенерации, поддержке клиентов.
- Блок 2 «Рутинные процессы»: автоматизация повторяющихся задач, использование нейросетей.
- Блок 3 «Данные и База знаний»: зрелость данных, регламентов и базы знаний для ИИ.
- Блок 4 «Операционка и Прогнозы»: управление процессами, планирование, предиктивная аналитика.
- Блок 5 «Культура и Готовность команды»: отношение руководства и команды к ИИ-трансформации.`;

const VALID_BLOCKS = ['sales_support', 'automation', 'data_knowledge', 'predictive_ops', 'culture_ready'] as const;

export function buildSurveyPrompt(
  title: string,
  description: string,
  questionCount = 7,
  tone?: string,
  focus?: string,
  extraContext?: string,
) {
  const toneNote = tone && TONE_INSTRUCTION[tone] ? TONE_INSTRUCTION[tone] : '';
  const focusNote = focus && FOCUS_INSTRUCTION[focus] ? FOCUS_INSTRUCTION[focus] : '';
  const extra = extraContext?.trim() ? `Дополнительные уточнения: ${extraContext.trim()}` : '';
  const perBlock = Math.ceil(questionCount / 5);

  return `
Ты — профессиональный составитель опросов. Составь опросник для оценки готовности бизнеса к ИИ.

Тема: ${title}
Описание: ${description}

КАТЕГОРИИ (блоки). Каждый вопрос ОБЯЗАТЕЛЬНО должен иметь поле "block" — один из 5 ID:
- "sales_support"   — продажи, лидогенерация, CRM, поддержка клиентов (${perBlock} вопр.)
- "automation"      — рутинные задачи, нейросети в операциях (${perBlock} вопр.)
- "data_knowledge"  — данные, регламенты, база знаний (${perBlock} вопр.)
- "predictive_ops"  — управление, планирование, прогнозирование (${perBlock} вопр.)
- "culture_ready"   — culture ready, культура и готовность команды к ИИ (${perBlock} вопр.)

Правила:
1. РОВНО ${questionCount} вопросов — не больше, не меньше.
2. РОВНО 4 варианта ответа на каждый вопрос, упорядоченных ОТ наиболее AI-готового (10 баллов) ДО наименее готового (0 баллов).
3. Каждый вопрос строго по теме своего блока (block).
4. Не спрашивай контактные данные (имя, email, телефон).
5. Один emoji на вопрос.
6. ОБЯЗАТЕЛЬНО обращайся к респонденту уважительно на «вы» / «Вы» / «ваш» / «ваша» / «вашем» (например: «Какой тип данных вы храните...», «Как вы используете...», «Внедрены ли у вас...»).
7. КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО писать от первого лица «мы» / «наш» / «наша» / «мы храним» / «мы собираем».
8. Пиши на чистом, естественном и грамотном русском языке. НЕ смешивай английские и русские слова (никаких "мы.collect", "вы.collect", английских терминов посреди русского предложения без перевода). Все термины должны быть переведены или написаны общепринятым образом на русском языке.
${toneNote ? `9. ${toneNote}` : ''}
${focusNote ? `10. ${focusNote}` : ''}
${extra ? `11. ${extra}` : ''}

Верни ТОЛЬКО JSON без markdown и лишнего текста:
{
  "title": "${title}",
  "description": "${description}",
  "questions": [
    {
      "text": "Текст вопроса?",
      "icon": "🤖",
      "type": "choice",
      "block": "sales_support",
      "options": ["Активно используем AI в продажах", "Пробовали точечно", "Планируем, но не начали", "Не используем вообще"]
    }
  ]
}
`;
}


function extractJsonBlock(text: string) {
  const open = text.indexOf('{');
  const close = text.lastIndexOf('}');
  if (open !== -1 && close !== -1 && close > open) {
    return text.slice(open, close + 1);
  }
  return text;
}

function parseSurveyDraft(rawText: string): SurveyDraft | null {
  try {
    const cleaned = extractJsonBlock(rawText).replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.title || !parsed.description || !Array.isArray(parsed.questions)) return null;
    const questions = parsed.questions
      .filter((item: any) => item && typeof item.text === 'string')
      .map((item: any) => {
        // Validate and normalise block
        const rawBlock = typeof item.block === 'string' ? item.block.trim() : '';
        const block = (VALID_BLOCKS as readonly string[]).includes(rawBlock)
          ? rawBlock
          : 'culture_ready'; // safe fallback
        return {
          text: item.text,
          icon: typeof item.icon === 'string' ? item.icon : '📝',
          type: 'choice',
          block,
          options: Array.isArray(item.options) ? item.options.map((o: any) => String(o)) : [],
        };
      });
    return {
      title: parsed.title,
      description: parsed.description,
      questions,
    };
  } catch {
    return null;
  }
}

function fallbackDraft(title: string, description: string): SurveyDraft {
  return {
    title: title || 'Опрос после мероприятия по AI',
    description: description || 'Краткий опрос для участников события об автоматизации бизнес-процессов с AI.',
    questions: [
      { text: 'Используете ли вы AI-инструменты в продажах или работе с клиентами?', icon: '💡', type: 'choice', block: 'sales_support', options: ['Да, активно', 'Пробовали точечно', 'Планируем', 'Нет'] },
      { text: 'Автоматизированы ли у вас рутинные задачи с помощью нейросетей?', icon: '🤖', type: 'choice', block: 'automation', options: ['Да, системно', 'Частично', 'Делаем вручную', 'Нет планов'] },
      { text: 'Насколько структурированы ваши данные и база знаний?', icon: '📊', type: 'choice', block: 'data_knowledge', options: ['Полностью оцифрованы', 'В основном да', 'Разрозненно', 'Не оцифрованы'] },
      { text: 'Используете ли аналитику для планирования и прогнозов?', icon: '📈', type: 'choice', block: 'predictive_ops', options: ['Да, регулярно', 'Иногда', 'Редко', 'Нет'] },
      { text: 'Насколько команда готова к внедрению AI?', icon: '👥', type: 'choice', block: 'culture_ready', options: ['Полностью готова', 'В целом да', 'Скептически', 'Не готова'] },
    ],
  };
}


export function auditSurveyDraft(draft: SurveyDraft) {
  const warnings: string[] = [];
  const questionCount = draft.questions.length;

  if (questionCount < 4) {
    warnings.push('Слишком мало вопросов. Для MVP лучше 5–7 вопросов.');
  }

  if (questionCount > 9) {
    warnings.push('Слишком много вопросов. Лучше оставить только ключевые темы, чтобы респонденты завершили опрос.');
  }

  const normalizedQuestions = draft.questions.map((question) => question.text.trim().toLowerCase());
  const duplicates = normalizedQuestions.filter((text, index) => text && normalizedQuestions.indexOf(text) !== index);
  if (duplicates.length) {
    warnings.push('Найдены похожие или одинаковые вопросы. Упростите формулировки или объедините дубли.');
  }

  draft.questions.forEach((question, index) => {
    if (!question.text || question.text.trim().length < 10) {
      warnings.push(`Вопрос ${index + 1} слишком короткий или неясный.`);
    }
  });

  const contactQuestion = draft.questions.some((question) => /email|почт|контакт|телефон|phone/i.test(question.text));
  if (!contactQuestion) {
    warnings.push('Нет явного вопроса про контактную информацию. Добавьте email или телефон.');
  }

  return warnings;
}

export async function generateSurveyFromPrompt(
  prompt: string,
  title?: string,
  description?: string,
  maxCount?: number,
): Promise<SurveyDraft> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const response = await fetch(groqUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Groq API error: ${response.status} ${body}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || 
               (typeof data.text === 'string' ? data.text : 
                typeof data.output === 'string' ? data.output : 
                JSON.stringify(data));
  const parsed = parseSurveyDraft(text);
  if (parsed && parsed.questions.length > 0) {
    // Enforce exact question count — model sometimes generates one extra
    if (maxCount && parsed.questions.length > maxCount) {
      parsed.questions = parsed.questions.slice(0, maxCount);
    }
    return parsed;
  }

  // Fallback: use the original title/description, NOT the full prompt string
  return fallbackDraft(title || 'Опрос', description || '');
}
