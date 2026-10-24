import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';

let geminiClient = null;
let groqClient = null;

function getGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.startsWith('your_') || key.length < 10) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey: key });
  }
  return geminiClient;
}

function getGroq() {
  const key = process.env.GROQ_API_KEY;
  if (!key || key.startsWith('your_') || key.length < 10) {
    return null;
  }
  if (!groqClient) {
    groqClient = new Groq({ apiKey: key });
  }
  return groqClient;
}

const GEMINI_MODELS = ['gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-3.8-flash'];

/**
 * Categorizes an AI provider error into standard HTTP status, machine code, and user-friendly category.
 * @param {Error|any} err
 * @returns {{status: number, code: string, category: string, message: string}}
 */
export function categorizeAIError(err) {
  const msg = (err?.message || '').toLowerCase();
  const rawStatus = err?.status || err?.code || err?.statusCode;
  let status = typeof rawStatus === 'number' ? rawStatus : 500;

  if (status === 429 || msg.includes('429') || msg.includes('quota') || msg.includes('resource_exhausted') || msg.includes('rate limit')) {
    return {
      status: 429,
      code: 'quota_exceeded',
      category: 'Quota Exceeded',
      message: 'AI request limit reached for this period. Please try again in a few moments.',
    };
  }
  if (status === 401 || status === 403 || msg.includes('api_key') || msg.includes('api key') || msg.includes('unauthorized') || msg.includes('forbidden')) {
    return {
      status: 401,
      code: 'invalid_api_key',
      category: 'Authentication Error',
      message: 'AI provider authentication failed. Please verify API key configuration.',
    };
  }
  if (status === 504 || msg.includes('timeout') || msg.includes('timed out') || msg.includes('econnreset') || msg.includes('econnaborted')) {
    return {
      status: 504,
      code: 'timeout',
      category: 'Network Timeout',
      message: 'The AI provider request timed out. Please retry your request.',
    };
  }
  if (status === 503 || msg.includes('overloaded') || msg.includes('unavailable') || msg.includes('high demand') || msg.includes('503')) {
    return {
      status: 503,
      code: 'provider_unavailable',
      category: 'Provider Unavailable',
      message: 'The AI provider is currently experiencing high demand. Please try again shortly.',
    };
  }
  if (status === 400 || msg.includes('invalid argument') || msg.includes('bad request')) {
    return {
      status: 400,
      code: 'bad_request',
      category: 'Bad Request',
      message: 'The AI request was malformed or exceeded context limits.',
    };
  }
  return {
    status: 500,
    code: 'ai_error',
    category: 'Server Error',
    message: err?.message || 'The AI service encountered an internal error.',
  };
}

/**
 * Standard chat / text completion with Gemini as primary and Groq as alternative.
 * @param {Array<{role: string, content: string}>} messages
 * @param {object} options
 * @returns {Promise<{content: string, usage: {total_tokens: number}, provider: string}>}
 */
export async function chatCompletion(messages, options = {}) {
  const gemini = getGemini();
  const groq = getGroq();

  // Try Gemini first across resilient model candidates
  if (gemini) {
    const systemInstruction = messages.find((m) => m.role === 'system')?.content;
    const conversation = messages
      .filter((m) => m.role !== 'system')
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');

    const prompt = conversation || messages.map((m) => m.content).join('\n\n');

    let lastError = null;
    for (const model of GEMINI_MODELS) {
      const modelStartTime = Date.now();
      console.log(`[AI Engine] Provider request sent: provider=gemini | model=${model} | prompt_length=${prompt.length} chars`);
      try {
        const response = await gemini.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: systemInstruction || undefined,
            temperature: options.temperature ?? 0.7,
            maxOutputTokens: options.max_tokens ?? 1024,
          },
        });

        const elapsed = Date.now() - modelStartTime;
        const text = response.text || '';
        const tokenUsage = Math.ceil((prompt.length + text.length) / 4);
        console.log(`[AI Engine] Provider response received: provider=gemini | model=${model} | status=200 | elapsed=${elapsed}ms | tokens=${tokenUsage}`);

        return {
          content: text,
          usage: {
            total_tokens: tokenUsage,
          },
          provider: `gemini (${model})`,
        };
      } catch (err) {
        const elapsed = Date.now() - modelStartTime;
        const cat = categorizeAIError(err);
        console.warn(`[AI Engine] Model ${model} failed: status=${cat.status} | category=${cat.category} | elapsed=${elapsed}ms: ${err.message?.slice(0, 150)}`);
        lastError = err;
      }
    }

    if (!groq) {
      const finalCat = categorizeAIError(lastError);
      const customErr = new Error(finalCat.message);
      customErr.aiError = finalCat;
      throw customErr;
    }
  }

  // Fallback to Groq if configured
  if (groq) {
    const groqStartTime = Date.now();
    console.log(`[AI Engine] Provider request sent: provider=groq | model=llama-3.3-70b-versatile`);
    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 1024,
      });
      const choice = response.choices[0];
      const elapsed = Date.now() - groqStartTime;
      console.log(`[AI Engine] Provider response received: provider=groq | status=200 | elapsed=${elapsed}ms | tokens=${response.usage?.total_tokens ?? 0}`);

      return {
        content: choice.message.content,
        usage: {
          total_tokens: response.usage?.total_tokens ?? 0,
        },
        provider: 'groq',
      };
    } catch (err) {
      const elapsed = Date.now() - groqStartTime;
      const cat = categorizeAIError(err);
      console.error(`[AI Engine] Groq fallback failed: status=${cat.status} | category=${cat.category} | elapsed=${elapsed}ms: ${err.message?.slice(0, 150)}`);
      const customErr = new Error(cat.message);
      customErr.aiError = cat;
      throw customErr;
    }
  }

  const noKeyCat = {
    status: 401,
    code: 'invalid_api_key',
    category: 'Authentication Error',
    message: 'No valid AI provider API key found (GEMINI_API_KEY is required).',
  };
  const noKeyErr = new Error(noKeyCat.message);
  noKeyErr.aiError = noKeyCat;
  throw noKeyErr;
}

/**
 * JSON-mode structured completion.
 * @param {Array<{role: string, content: string}>} messages
 * @param {object} options
 * @returns {Promise<{data: any, usage: {total_tokens: number}, provider: string}>}
 */
export async function jsonCompletion(messages, options = {}) {
  const gemini = getGemini();
  const groq = getGroq();

  if (gemini) {
    const systemInstruction = messages.find((m) => m.role === 'system')?.content;
    const conversation = messages
      .filter((m) => m.role !== 'system')
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');

    const prompt = `${conversation}\n\nPlease output strict JSON without Markdown fences.`;

    let lastError = null;
    for (const model of GEMINI_MODELS) {
      const modelStartTime = Date.now();
      console.log(`[AI Engine JSON] Provider request sent: provider=gemini | model=${model} | prompt_length=${prompt.length} chars`);
      try {
        const response = await gemini.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: systemInstruction || undefined,
            temperature: options.temperature ?? 0.3,
            responseMimeType: 'application/json',
          },
        });

        const elapsed = Date.now() - modelStartTime;
        const text = (response.text || '{}').trim();
        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch {
          const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          parsed = JSON.parse(cleaned);
        }

        const tokenUsage = Math.ceil((prompt.length + text.length) / 4);
        console.log(`[AI Engine JSON] Provider response received: provider=gemini | model=${model} | status=200 | elapsed=${elapsed}ms | tokens=${tokenUsage}`);

        return {
          data: parsed,
          usage: {
            total_tokens: tokenUsage,
          },
          provider: `gemini (${model})`,
        };
      } catch (err) {
        const elapsed = Date.now() - modelStartTime;
        const cat = categorizeAIError(err);
        console.warn(`[AI Engine JSON] Model ${model} failed: status=${cat.status} | category=${cat.category} | elapsed=${elapsed}ms: ${err.message?.slice(0, 150)}`);
        lastError = err;
      }
    }

    if (!groq) {
      const finalCat = categorizeAIError(lastError);
      const customErr = new Error(finalCat.message);
      customErr.aiError = finalCat;
      throw customErr;
    }
  }

  if (groq) {
    const groqStartTime = Date.now();
    console.log(`[AI Engine JSON] Provider request sent: provider=groq | model=llama-3.3-70b-versatile`);
    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: options.temperature ?? 0.3,
        response_format: { type: 'json_object' },
      });
      const content = response.choices[0]?.message?.content || '{}';
      const elapsed = Date.now() - groqStartTime;
      console.log(`[AI Engine JSON] Provider response received: provider=groq | status=200 | elapsed=${elapsed}ms | tokens=${response.usage?.total_tokens ?? 0}`);
      return {
        data: JSON.parse(content),
        usage: {
          total_tokens: response.usage?.total_tokens ?? 0,
        },
        provider: 'groq',
      };
    } catch (err) {
      const elapsed = Date.now() - groqStartTime;
      const cat = categorizeAIError(err);
      console.error(`[AI Engine JSON] Groq fallback failed: status=${cat.status} | category=${cat.category} | elapsed=${elapsed}ms: ${err.message?.slice(0, 150)}`);
      const customErr = new Error(cat.message);
      customErr.aiError = cat;
      throw customErr;
    }
  }

  const noKeyCat = {
    status: 401,
    code: 'invalid_api_key',
    category: 'Authentication Error',
    message: 'No valid AI provider API key found.',
  };
  const noKeyErr = new Error(noKeyCat.message);
  noKeyErr.aiError = noKeyCat;
  throw noKeyErr;
}
