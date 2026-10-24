import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';

let geminiClient = null;
let groqClient = null;

function isValidKey(key) {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (trimmed.length < 10) return false;
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('your_') || lower.includes('placeholder') || lower.startsWith('mock_')) {
    return false;
  }
  return true;
}

function getGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!isValidKey(key)) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: key.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

function getGroq() {
  const key = process.env.GROQ_API_KEY;
  if (!isValidKey(key)) return null;
  if (!groqClient) {
    groqClient = new Groq({ apiKey: key.trim() });
  }
  return groqClient;
}

const GEMINI_MODELS = ['gemini-3.1-flash-lite', 'gemini-flash-latest'];
const GROQ_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];

/**
 * Resolves the active AI provider strategy based on AI_PROVIDER environment variable
 * and available credentials.
 */
export function getAIProviderStrategy() {
  const requested = (process.env.AI_PROVIDER || 'auto').trim().toLowerCase();
  const hasGemini = isValidKey(process.env.GEMINI_API_KEY);
  const hasGroq = isValidKey(process.env.GROQ_API_KEY);

  if (requested === 'gemini') {
    if (!hasGemini) {
      const err = new Error('Gemini API key is required when AI_PROVIDER is set to "gemini". Please set GEMINI_API_KEY in your server environment variables.');
      err.aiError = {
        status: 401,
        code: 'invalid_api_key',
        category: 'Authentication Error',
        message: err.message,
      };
      throw err;
    }
    return { primary: 'gemini', fallback: null };
  }

  if (requested === 'groq') {
    if (!hasGroq) {
      const err = new Error('Groq API key is required when AI_PROVIDER is set to "groq". Please set GROQ_API_KEY in your server environment variables.');
      err.aiError = {
        status: 401,
        code: 'invalid_api_key',
        category: 'Authentication Error',
        message: err.message,
      };
      throw err;
    }
    return { primary: 'groq', fallback: null };
  }

  // Auto mode
  if (hasGemini) {
    return { primary: 'gemini', fallback: hasGroq ? 'groq' : null };
  }
  if (hasGroq) {
    return { primary: 'groq', fallback: null };
  }

  const err = new Error('No AI provider API key found on the server. Please configure GEMINI_API_KEY (recommended) or GROQ_API_KEY in your server environment variables.');
  err.aiError = {
    status: 401,
    code: 'invalid_api_key',
    category: 'Authentication Error',
    message: err.message,
  };
  throw err;
}

/**
 * Categorizes an AI provider error into standard HTTP status, machine code, and user-friendly category.
 * Sanitizes messages to prevent leaking credential fragments.
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
    message: err?.message ? err.message.slice(0, 200) : 'The AI service encountered an internal error.',
  };
}

/**
 * Executes a completion with Gemini.
 */
async function callGeminiChat(messages, options = {}) {
  const gemini = getGemini();
  if (!gemini) throw new Error('Gemini client unavailable');

  const systemInstruction = messages.find((m) => m.role === 'system')?.content;
  const conversation = messages
    .filter((m) => m.role !== 'system')
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n\n');

  const prompt = conversation || messages.map((m) => m.content).join('\n\n');

  let lastErr = null;
  for (const model of GEMINI_MODELS) {
    const startTime = Date.now();
    try {
      const response = await gemini.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || undefined,
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.max_tokens ?? 1500,
        },
      });

      const elapsed = Date.now() - startTime;
      const text = response.text || '';
      const tokens = Math.ceil((prompt.length + text.length) / 4);
      console.log(`[AI Engine] Gemini success: model=${model} | elapsed=${elapsed}ms | tokens=${tokens}`);

      return {
        content: text,
        usage: { total_tokens: tokens },
        provider: `gemini (${model})`,
      };
    } catch (err) {
      console.warn(`[AI Engine] Gemini model ${model} failed: ${err.message?.slice(0, 120)}`);
      lastErr = err;
    }
  }

  throw lastErr;
}

/**
 * Executes a completion with Groq.
 */
async function callGroqChat(messages, options = {}) {
  const groq = getGroq();
  if (!groq) throw new Error('Groq client unavailable');

  let lastErr = null;
  for (const model of GROQ_MODELS) {
    const startTime = Date.now();
    try {
      const response = await groq.chat.completions.create({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 1500,
      });

      const choice = response.choices?.[0];
      const elapsed = Date.now() - startTime;
      const tokens = response.usage?.total_tokens ?? 0;
      console.log(`[AI Engine] Groq success: model=${model} | elapsed=${elapsed}ms | tokens=${tokens}`);

      return {
        content: choice?.message?.content || '',
        usage: { total_tokens: tokens },
        provider: `groq (${model})`,
      };
    } catch (err) {
      console.warn(`[AI Engine] Groq model ${model} failed: ${err.message?.slice(0, 120)}`);
      lastErr = err;
    }
  }

  throw lastErr;
}

/**
 * Standard chat / text completion honoring the configured provider strategy.
 */
export async function chatCompletion(messages, options = {}) {
  const strategy = getAIProviderStrategy();

  if (strategy.primary === 'gemini') {
    try {
      return await callGeminiChat(messages, options);
    } catch (err) {
      if (strategy.fallback === 'groq') {
        console.warn('[AI Engine] Primary Gemini failed, attempting Groq fallback...');
        try {
          return await callGroqChat(messages, options);
        } catch (groqErr) {
          const cat = categorizeAIError(groqErr);
          const error = new Error(cat.message);
          error.aiError = cat;
          throw error;
        }
      }
      const cat = categorizeAIError(err);
      const error = new Error(cat.message);
      error.aiError = cat;
      throw error;
    }
  }

  if (strategy.primary === 'groq') {
    try {
      return await callGroqChat(messages, options);
    } catch (err) {
      const cat = categorizeAIError(err);
      const error = new Error(cat.message);
      error.aiError = cat;
      throw error;
    }
  }

  throw new Error('Unknown AI strategy');
}

/**
 * JSON-mode structured completion with schema parsing and error resilience.
 */
export async function jsonCompletion(messages, options = {}) {
  const strategy = getAIProviderStrategy();

  const tryGeminiJson = async () => {
    const gemini = getGemini();
    if (!gemini) throw new Error('Gemini client unavailable');

    const systemInstruction = messages.find((m) => m.role === 'system')?.content;
    const conversation = messages
      .filter((m) => m.role !== 'system')
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');

    const prompt = `${conversation}\n\nPlease output strict JSON without Markdown fences.`;

    let lastErr = null;
    for (const model of GEMINI_MODELS) {
      try {
        const response = await gemini.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: systemInstruction || undefined,
            temperature: options.temperature ?? 0.2,
            responseMimeType: 'application/json',
          },
        });

        const text = (response.text || '{}').trim();
        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch {
          const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          parsed = JSON.parse(cleaned);
        }

        const tokens = Math.ceil((prompt.length + text.length) / 4);
        return {
          data: parsed,
          usage: { total_tokens: tokens },
          provider: `gemini (${model})`,
        };
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr;
  };

  const tryGroqJson = async () => {
    const groq = getGroq();
    if (!groq) throw new Error('Groq client unavailable');

    let lastErr = null;
    for (const model of GROQ_MODELS) {
      try {
        const response = await groq.chat.completions.create({
          model,
          messages,
          temperature: options.temperature ?? 0.2,
          response_format: { type: 'json_object' },
        });

        const content = response.choices?.[0]?.message?.content || '{}';
        return {
          data: JSON.parse(content),
          usage: { total_tokens: response.usage?.total_tokens ?? 0 },
          provider: `groq (${model})`,
        };
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr;
  };

  if (strategy.primary === 'gemini') {
    try {
      return await tryGeminiJson();
    } catch (err) {
      if (strategy.fallback === 'groq') {
        try {
          return await tryGroqJson();
        } catch (groqErr) {
          const cat = categorizeAIError(groqErr);
          const error = new Error(cat.message);
          error.aiError = cat;
          throw error;
        }
      }
      const cat = categorizeAIError(err);
      const error = new Error(cat.message);
      error.aiError = cat;
      throw error;
    }
  }

  if (strategy.primary === 'groq') {
    try {
      return await tryGroqJson();
    } catch (err) {
      const cat = categorizeAIError(err);
      const error = new Error(cat.message);
      error.aiError = cat;
      throw error;
    }
  }

  throw new Error('Unknown AI strategy');
}
