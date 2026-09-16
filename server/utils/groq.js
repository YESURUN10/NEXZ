import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Standard chat completion using Groq's Llama 3 70B model.
 * @param {Array<{role: string, content: string}>} messages
 * @param {object} options - Additional options (temperature, max_tokens, etc.)
 * @returns {Promise<{content: string, usage: {total_tokens: number}}>}
 */
export async function chatCompletion(messages, options = {}) {
  const response = await groq.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 1024,
    ...options,
  });

  const choice = response.choices[0];
  return {
    content: choice.message.content,
    usage: {
      total_tokens: response.usage?.total_tokens ?? 0,
    },
  };
}

/**
 * JSON-mode chat completion. Parses the response as JSON automatically.
 * @param {Array<{role: string, content: string}>} messages
 * @param {object} options
 * @returns {Promise<{data: any, usage: {total_tokens: number}}>}
 */
export async function jsonCompletion(messages, options = {}) {
  const response = await groq.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.max_tokens ?? 1024,
    response_format: { type: 'json_object' },
    ...options,
  });

  const choice = response.choices[0];
  let data;
  try {
    data = JSON.parse(choice.message.content);
  } catch {
    data = { raw: choice.message.content };
  }

  return {
    data,
    usage: {
      total_tokens: response.usage?.total_tokens ?? 0,
    },
  };
}
