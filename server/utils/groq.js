import Groq from 'groq-sdk';

let groqClient = null;

function getGroq() {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return null;
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

/**
 * Standard chat completion using Groq's Llama 3 70B model.
 * @param {Array<{role: string, content: string}>} messages
 * @param {object} options - Additional options (temperature, max_tokens, etc.)
 * @returns {Promise<{content: string, usage: {total_tokens: number}}>}
 */
export async function chatCompletion(messages, options = {}) {
  const groq = getGroq();
  if (!groq) {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    return {
      content: `[Nexz AI Insight] This article highlights key updates and context regarding the reported events. To enable live neural completions with Groq, please provide a valid GROQ_API_KEY in the application settings.\n\nSummary context: ${lastUserMessage.slice(0, 150)}...`,
      usage: {
        total_tokens: 35,
      },
    };
  }

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
  const groq = getGroq();
  if (!groq) {
    const userMsg = messages.find(m => m.role === 'user')?.content || '';
    const words = userMsg.split(/\s+/).filter(w => w.length > 4).slice(0, 4);
    return {
      data: {
        keywords: words.length > 0 ? words : ['global', 'markets', 'technology', 'intelligence']
      },
      usage: {
        total_tokens: 20,
      },
    };
  }

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
