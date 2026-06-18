import { SurveyDraft } from './types';

const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';

export function buildSurveyPrompt(title: string, description: string, questionCount = 7) {
  return `
Ты — генератор структурированных данных.

Верни ТОЛЬКО валидный JSON без пояснений и текста.

Формат:
{
  "title": string,
  "description": string,
  "questions": [
    { "text": string, "icon": string, "type": "text" }
  ]
}

Правила:
- ${questionCount} вопросов
- минимум 1 вопрос про контакт
- вопросы про пользу, внедрение AI, интерес
- язык: русский
- без markdown, без комментариев

Событие:
${title}

Описание:
${description}
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
      .map((item: any) => ({
        text: item.text,
        icon: typeof item.icon === 'string' ? item.icon : '📝',
        type: typeof item.type === 'string' ? item.type : 'text',
      }));
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
      { text: 'Насколько полезной для вас была информация о полной автоматизации бизнес-процессов?', icon: '💡', type: 'text' },
      { text: 'Насколько понятной была структура доклада?', icon: '🧭', type: 'text' },
      { text: 'Какие примеры внедрения AI вы считаете наиболее актуальными для вашего бизнеса?', icon: '🤖', type: 'text' },
      { text: 'Оцените вашу готовность обсудить внедрение AI-решений в ближайшие 3 месяца.', icon: '📈', type: 'text' },
      { text: 'Хотели бы вы получить персональную консультацию после мероприятия?', icon: '✉️', type: 'text' },
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

export async function generateSurveyFromPrompt(prompt: string): Promise<SurveyDraft> {
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
      max_tokens: 700,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Groq API error: ${response.status} ${body}`);
  }

  const data = await response.json();
  const text = typeof data.text === 'string' ? data.text : typeof data.output === 'string' ? data.output : JSON.stringify(data);
  const parsed = parseSurveyDraft(text);
  if (parsed && parsed.questions.length > 0) {
    return parsed;
  }

  return fallbackDraft(prompt, prompt);
}
