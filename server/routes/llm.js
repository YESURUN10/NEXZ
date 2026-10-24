import { Router } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { chatCompletion, categorizeAIError } from '../utils/aiEngine.js';
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
  chat: `You are NEXZ Neural Intelligence Assistant, a specialized news and global affairs analyst.
Article Context:
{articleText}

Instructions:
1. Answer factually, accurately, and analytically based on the article and verifiable global events.
2. Differentiate established facts from speculation, inferences, and official claims.
3. Identify direct causes versus contributing factors when asked why something happened.
4. If the provided dispatch does not contain enough evidence to answer fully, explicitly note the information gap.
5. Provide concise, clear, and direct responses with clear formatting.`,

  explain_eli5: `You are NEXZ's junior intelligence analyst. Explain this news story for a beginner or non-expert using simple, engaging language and clear analogies.

Article:
{articleText}

Provide an explanation structured as follows:
• What Happened: The core event in 1-2 simple sentences.
• Why It Matters: Real-world impact in plain everyday terms.
• Background: Necessary context and words you need to know.
• What Happens Next: What to look out for next.

Keep it under 180 words. Avoid complex jargon.`,

  explain_standard: `You are NEXZ's Senior News Intelligence Analyst. Provide an evidence-grounded news intelligence briefing based on this dispatch:

Article:
{articleText}

Structure your analysis with these clear section headings:
1. What Happened: Concise, verifiable factual summary of the core development.
2. Why It Matters: Real-world significance and practical impact.
3. Background & Terminology: Essential historical context and key concepts.
4. How It Happened (Evidence-based): Direct causes vs. contributing factors, stating clearly if causal evidence is incomplete.
5. Who Is Affected: Key people, organizations, regions, and sectors impacted.
6. What Happens Next: Concrete upcoming milestones, distinguishing facts from projections.
7. Uncertainties & Gaps: What remains unverified, missing, or disputed across reports.

Maintain high journalistic integrity and avoid speculation.`,

  explain_expert: `You are NEXZ's Chief Geopolitical & Macro Intelligence Strategist. Provide an expert-level, rigorous intelligence briefing analyzing the structural drivers, second-order effects, and strategic risks of this dispatch:

Article:
{articleText}

Structure your briefing into:
1. Signal Identification & Executive Summary
2. Causal Architecture & Systemic Drivers (distinguish proximate triggers from underlying structural conditions)
3. Cross-Domain Impacts (macroeconomic, geopolitical, supply chain, market, and regulatory)
4. Strategic Scenario Matrix (Base Case, Bull Case, Tail Risk)
5. Epistemic Limitations & Intelligence Gaps (unverified assertions, corroboration disparities, and missing data points)

Maintain rigorous evidence discipline, objectivity, and professional precision.`,

  corroboration: 'Extract 3-5 key entities/keywords from this headline. Return ONLY a JSON object with a "keywords" array of strings.',
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
  const reqStart = Date.now();
  const userId = req.user?.uid || 'anonymous';
  const questionLength = req.body.question?.length || 0;
  const articleLength = req.body.articleText?.length || 0;
  console.log(`[LLM] Request started: POST /api/llm/chat | user=${userId} | hasArticle=${articleLength > 0} | questionLength=${questionLength}`);

  try {
    const { articleText, question } = req.body;

    if (!question) {
      return res.status(400).json({
        status: 'error',
        error: 'missing_fields',
        category: 'Bad Request',
        message: '"question" is required.',
      });
    }

    let systemPrompt = await getSystemPrompt('chat');
    let filledPrompt = systemPrompt.includes('{articleText}')
      ? systemPrompt.replace('{articleText}', articleText || 'No specific article selected. Answer general current affairs and intelligence inquiries factually.')
      : `${systemPrompt}\n\nArticle Context:\n${articleText || 'General news inquiry'}`;

    const result = await chatCompletion([
      { role: 'system', content: filledPrompt },
      { role: 'user', content: question },
    ]);

    const elapsed = Date.now() - reqStart;
    console.log(`[LLM] Chat completed: status=200 | elapsed=${elapsed}ms | tokens=${result.usage?.total_tokens || 0} | provider=${result.provider}`);

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
      provider: result.provider,
    });
  } catch (error) {
    const elapsed = Date.now() - reqStart;
    const details = error.aiError || categorizeAIError(error);
    console.error(`[LLM] Chat failed after ${elapsed}ms | status=${details.status} | category=${details.category}:`, error.message);

    logRequest({
      route: 'POST /api/llm/chat',
      userId: req.user?.uid,
      timestamp: new Date().toISOString(),
      success: false,
      errorType: details.code,
    });

    return res.status(details.status).json({
      status: 'error',
      error: details.code,
      category: details.category,
      message: details.message,
    });
  }
});

// ===========================================================
// POST /explain - Explain article at different levels (auth + groq quota)
// ===========================================================
router.post('/explain', verifyToken, createQuotaCheck('groq'), async (req, res) => {
  const reqStart = Date.now();
  const userId = req.user?.uid || 'anonymous';
  const level = req.body.level || 'standard';
  const articleLength = req.body.articleText?.length || 0;
  console.log(`[LLM] Request started: POST /api/llm/explain | user=${userId} | level=${level} | articleLength=${articleLength}`);

  try {
    const { articleText } = req.body;

    if (!articleText) {
      return res.status(400).json({
        status: 'error',
        error: 'missing_fields',
        category: 'Bad Request',
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

    const elapsed = Date.now() - reqStart;
    console.log(`[LLM] Explain completed: status=200 | elapsed=${elapsed}ms | tokens=${result.usage?.total_tokens || 0} | provider=${result.provider}`);

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
      provider: result.provider,
    });
  } catch (error) {
    const elapsed = Date.now() - reqStart;
    const details = error.aiError || categorizeAIError(error);
    console.error(`[LLM] Explain failed after ${elapsed}ms | status=${details.status} | category=${details.category}:`, error.message);

    logRequest({
      route: 'POST /api/llm/explain',
      userId: req.user?.uid,
      timestamp: new Date().toISOString(),
      success: false,
      errorType: details.code,
    });

    return res.status(details.status).json({
      status: 'error',
      error: details.code,
      category: details.category,
      message: details.message,
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
