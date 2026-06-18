import fetch from 'node-fetch';

const GROQ_API_URL = 'https://api.groq.com/v1/generate';

export async function generateSurveyFromPrompt(prompt: string) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ prompt, max_tokens: 800 }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq API error: ${text}`);
  }

  const data = await response.json();
  return data;
}
