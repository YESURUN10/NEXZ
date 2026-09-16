import { Router } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { chatCompletion } from '../utils/groq.js';
import { logRequest } from '../utils/logger.js';
import { verifyToken } from '../middleware/auth.js';
import { createQuotaCheck, incrementCounter } from '../middleware/quotaCheck.js';

const router = Router();

/**
 * Module-level prompt cache with 5-minute TTL.
 * Key: feature name, Value: { prompt: string, timestamp: number }
 */
const promptCache = new Map();
const PROMPT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Default system prompts for each feature.
 * Used as fallbacks if Firestore doesn't have the prompt configured.
 */
const DEFAULT_PROMPTS = {
  chat: 'You are a helpful news analysis assistant. Answer based ONLY on the article text provided. Do not make up info.\n\nArticle:\n{articleText}',
  explain_eli5: 'Explain this news as if to a 5-year-old. Simple words, short sentences, analogies. Under 150 words.\n\nArticle:\n{articleText}',
  explain_standard: 'Summarize this news clearly: who, what, when, where, why, how. Under 250 words.\n\nArticle:\n{articleText}',
  explain_expert: 'Expert analysis: context, implications, historical parallels, future developments. Under 400 words.\n\nArticle:\n{articleText}',
  corroboration: 'Extract 3-5 key entities/keywords from this headline. Return ONLY a JSON array of strings.',
  perspectives: 'Compare how different sources frame this story. Describe tone, emphasis, omissions for each. Do NOT say which is right.',
  roadmap: 'Analyze articles for causal connections. Return ONLY JSON: {"nodes":[{"id","label","summary"}],"edges":[{"from","to","relationship"}]}',
};

/**
 * Get system prompt for a feature. Checks cache, then Firestore, then defaults.
 * @param {string} feature - Feature name (e.g., 'chat', 'explain_eli5')
 * @returns {Promise<string>} The system prompt
 */
async function getSystemPrompt(feature) {
  // Check cache first
  const cached = promptCache.get(feature);
  if (cached && Date.now() - cached.timestamp < PROMPT_CACHE_TTL) {
    return cached.prompt;
  }

  // Try Firestore if enabled
  if (global.FIREBASE_FIRESTORE_ENABLED !== false) {
    try {
      const db = getFirestore();
      const doc = await db.collection('config').doc('systemPrompts').collection(feature).doc('prompt').get();

      if (doc.exists) {
        const prompt = doc.data()?.text || DEFAULT_PROMPTS[feature];
        promptCache.set(feature, { prompt, timestamp: Date.now() });
        return prompt;
      }
    } catch (error) {
      console.error(`[LLM] Failed to fetch prompt for ${feature}:`, error.message);
    }
  }

  // Fallback to default
  const defaultPrompt = DEFAULT_PROMPTS[feature] || DEFAULT_PROMPTS.chat;
  promptCache.set(feature, { prompt: defaultPrompt, timestamp: Date.now() });
  return defaultPrompt;
}

/**
 * Seed default prompts to Firestore if they don't already exist.
 * Called once on server startup.
 */
export async function seedDefaultPrompts() {
  if (global.FIREBASE_FIRESTORE_ENABLED === false) return;
  try {
    const db = getFirestore();

    for (const [feature, promptText] of Object.entries(DEFAULT_PROMPTS)) {
      const ref = db.collection('config').doc('systemPrompts').collection(feature).doc('prompt');
      const doc = await ref.get();

      if (!doc.exists) {
        await ref.set({
          text: promptText,
          feature,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`[LLM] Seeded default prompt for: ${feature}`);
      }
    }

    console.log('[LLM] Default prompts verified/seeded.');
  } catch (error) {
    console.error('[LLM] Failed to seed default prompts:', error.message);
  }
}

/**
 * Clear cached prompt for a feature (or all features if none specified).
 * @param {string} [feature] - Optional feature name to clear
 */
export function clearPromptCache(feature) {
  if (feature) {
    promptCache.delete(feature);
  } else {
    promptCache.clear();
  }
}

// ===========================================================
// POST /chat - Chat with article context (auth + groq quota)
// ===========================================================
router.post('/chat', verifyToken, createQuotaCheck('groq'), async (req, res) => {
  try {
    const { articleText, question } = req.body;

    if (!question) {
      return res.status(400).json({
        status: 'error',
        error: 'missing_fields',
        message: '"question" is required.',
      });
    }

    let systemPrompt = await getSystemPrompt('chat');
    let filledPrompt;
    if (articleText) {
      filledPrompt = systemPrompt.replace('{articleText}', articleText);
    } else {
      filledPrompt = systemPrompt.replace(
        'Answer based ONLY on the article text provided. Do not make up info.\n\nArticle:\n{articleText}',
        'You are a helpful AI news assistant. Answer the user\'s questions about current events and news topics generally.'
      ).replace('{articleText}', '');
    }

    const result = await chatCompletion([
      { role: 'system', content: filledPrompt },
      { role: 'user', content: question },
    ]);

    // Increment Groq counter
    await incrementCounter('groq', result.usage.total_tokens);

    logRequest({
      route: 'POST /api/llm/chat',
      userId: req.user?.uid,
      timestamp: new Date().toISOString(),
      success: true,
    });

    return res.json({
      status: 'ok',
      answer: result.content,
    });
  } catch (error) {
    console.error('[LLM] Chat error:', error.message);

    logRequest({
      route: 'POST /api/llm/chat',
      userId: req.user?.uid,
      timestamp: new Date().toISOString(),
      success: false,
      errorType: 'llm_error',
    });

    return res.status(500).json({
      status: 'error',
      error: 'chat_failed',
      message: error.message,
    });
  }
});

// ===========================================================
// POST /explain - Explain article at different levels (auth + groq quota)
// ===========================================================
router.post('/explain', verifyToken, createQuotaCheck('groq'), async (req, res) => {
  try {
    const { articleText, level = 'standard' } = req.body;

    if (!articleText) {
      return res.status(400).json({
        status: 'error',
        error: 'missing_fields',
        message: '"articleText" is required.',
      });
    }

    // Map level to prompt feature name
    const validLevels = ['eli5', 'standard', 'expert'];
    const normalizedLevel = validLevels.includes(level) ? level : 'standard';
    const promptKey = `explain_${normalizedLevel}`;

    const systemPrompt = await getSystemPrompt(promptKey);
    const filledPrompt = systemPrompt.replace('{articleText}', articleText);

    const result = await chatCompletion([
      { role: 'system', content: filledPrompt },
      { role: 'user', content: 'Please provide the explanation.' },
    ]);

    // Increment Groq counter
    await incrementCounter('groq', result.usage.total_tokens);

    logRequest({
      route: 'POST /api/llm/explain',
      userId: req.user?.uid,
      timestamp: new Date().toISOString(),
      success: true,
    });

    return res.json({
      status: 'ok',
      summary: result.content,
      level: normalizedLevel,
    });
  } catch (error) {
    console.error('[LLM] Explain error:', error.message);

    logRequest({
      route: 'POST /api/llm/explain',
      userId: req.user?.uid,
      timestamp: new Date().toISOString(),
      success: false,
      errorType: 'llm_error',
    });

    return res.status(500).json({
      status: 'error',
      error: 'explain_failed',
      message: error.message,
    });
  }
});

// ===========================================================
// POST /perspectives - Multi-source perspective analysis (stub)
// ===========================================================
router.post('/perspectives', verifyToken, createQuotaCheck('groq'), async (req, res) => {
  return res.status(501).json({
    status: 'error',
    error: 'not_implemented',
    message: 'Perspectives analysis is coming soon. This feature is under development.',
  });
});

// ===========================================================
// POST /roadmap - Causal roadmap generation (stub)
// ===========================================================
router.post('/roadmap', verifyToken, createQuotaCheck('groq'), async (req, res) => {
  return res.status(501).json({
    status: 'error',
    error: 'not_implemented',
    message: 'Roadmap generation is coming soon. This feature is under development.',
  });
});

export default router;
