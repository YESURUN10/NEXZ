import { Router } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import { clearPromptCache } from '../routes/llm.js';

const router = Router();

// All admin routes require authentication + admin role
router.use(verifyToken, isAdmin);

// In-memory prompt storage for local dev when Firestore is disabled
const localPrompts = {
  chat: { text: 'You are a helpful news analysis assistant. Answer based ONLY on the article text provided. Do not make up info.\n\nArticle:\n{articleText}' },
  explain_eli5: { text: 'Explain this news as if to a 5-year-old. Simple words, short sentences, analogies. Under 150 words.\n\nArticle:\n{articleText}' },
  explain_standard: { text: 'Summarize this news clearly: who, what, when, where, why, how. Under 250 words.\n\nArticle:\n{articleText}' },
  explain_expert: { text: 'Expert analysis: context, implications, historical parallels, future developments. Under 400 words.\n\nArticle:\n{articleText}' },
  corroboration: { text: 'Extract 3-5 key entities/keywords from this headline. Return ONLY a JSON array of strings.' },
  perspectives: { text: 'Compare how different sources frame this story. Describe tone, emphasis, omissions for each. Do NOT say which is right.' },
  roadmap: { text: 'Analyze articles for causal connections. Return ONLY JSON: {"nodes":[{"id","label","summary"}],"edges":[{"from","to","relationship"}]}' },
};

// ===========================================================
// GET /usage - API usage stats for last 7 days
// ===========================================================
router.get('/usage', async (req, res) => {
  try {
    const days = [];

    // Get last 7 days of usage data
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      days.push(dateStr);
    }

    if (global.FIREBASE_FIRESTORE_ENABLED === false) {
      return res.json({
        status: 'ok',
        usage: days.map((day) => ({
          date: day,
          newsApiCalls: 0,
          groqTokensUsed: 0,
          groqCallCount: 0,
          lastUpdated: null,
        })),
        limits: {
          newsApiDaily: parseInt(process.env.NEWS_API_DAILY_LIMIT, 10) || 90,
          groqTokensDaily: parseInt(process.env.GROQ_TOKEN_DAILY_LIMIT, 10) || 100000,
        },
      });
    }

    const db = getFirestore();
    const usageData = [];

    for (const day of days) {
      const doc = await db.collection('apiUsage').doc(day).get();
      const data = doc.exists ? doc.data() : {};

      usageData.push({
        date: day,
        newsApiCalls: data.newsApiCalls || 0,
        groqTokensUsed: data.groqTokensUsed || 0,
        groqCallCount: data.groqCallCount || 0,
        lastUpdated: data.lastUpdated || null,
      });
    }

    return res.json({
      status: 'ok',
      usage: usageData,
      limits: {
        newsApiDaily: parseInt(process.env.NEWS_API_DAILY_LIMIT, 10) || 90,
        groqTokensDaily: parseInt(process.env.GROQ_TOKEN_DAILY_LIMIT, 10) || 100000,
      },
    });
  } catch (error) {
    console.error('[Admin] Usage fetch error:', error.message);
    return res.status(500).json({
      status: 'error',
      error: 'usage_fetch_failed',
      message: error.message,
    });
  }
});

// ===========================================================
// GET /logs - Paginated request logs with optional filters
// ===========================================================
router.get('/logs', async (req, res) => {
  try {
    const {
      limit: queryLimit = 50,
      offset = 0,
      route: routeFilter,
      success: successFilter,
    } = req.query;

    const pageSize = Math.min(parseInt(queryLimit, 10) || 50, 200);
    const skip = parseInt(offset, 10) || 0;

    if (global.FIREBASE_FIRESTORE_ENABLED === false) {
      return res.json({
        status: 'ok',
        logs: [],
        pagination: {
          offset: skip,
          limit: pageSize,
          returned: 0,
        },
      });
    }

    const db = getFirestore();

    let query = db
      .collection('logs')
      .doc('requests')
      .collection('entries')
      .orderBy('createdAt', 'desc');

    // Apply filters
    if (routeFilter) {
      query = query.where('route', '==', routeFilter);
    }
    if (successFilter !== undefined) {
      const isSuccess = successFilter === 'true' || successFilter === true;
      query = query.where('success', '==', isSuccess);
    }

    // Pagination
    query = query.offset(skip).limit(pageSize);

    const snapshot = await query.get();
    const logs = [];

    snapshot.forEach((doc) => {
      logs.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return res.json({
      status: 'ok',
      logs,
      pagination: {
        offset: skip,
        limit: pageSize,
        returned: logs.length,
      },
    });
  } catch (error) {
    console.error('[Admin] Logs fetch error:', error.message);
    return res.status(500).json({
      status: 'error',
      error: 'logs_fetch_failed',
      message: error.message,
    });
  }
});

// ===========================================================
// GET /prompts - Get all system prompts
// ===========================================================
router.get('/prompts', async (req, res) => {
  try {
    if (global.FIREBASE_FIRESTORE_ENABLED === false) {
      return res.json({
        status: 'ok',
        prompts: localPrompts,
      });
    }

    const db = getFirestore();
    const promptsRef = db.collection('config').doc('systemPrompts');

    // List all subcollections (each feature is a subcollection)
    const features = [
      'chat',
      'explain_eli5',
      'explain_standard',
      'explain_expert',
      'corroboration',
      'perspectives',
      'roadmap',
    ];

    const prompts = {};

    for (const feature of features) {
      const doc = await promptsRef.collection(feature).doc('prompt').get();
      if (doc.exists) {
        prompts[feature] = doc.data();
      }
    }

    return res.json({
      status: 'ok',
      prompts,
    });
  } catch (error) {
    console.error('[Admin] Prompts fetch error:', error.message);
    return res.status(500).json({
      status: 'error',
      error: 'prompts_fetch_failed',
      message: error.message,
    });
  }
});

// ===========================================================
// PUT /prompts/:feature - Update a system prompt
// ===========================================================
router.put('/prompts/:feature', async (req, res) => {
  try {
    const { feature } = req.params;
    const { text } = req.body;

    // Validate feature name
    const validFeatures = [
      'chat',
      'explain_eli5',
      'explain_standard',
      'explain_expert',
      'corroboration',
      'perspectives',
      'roadmap',
    ];

    if (!validFeatures.includes(feature)) {
      return res.status(400).json({
        status: 'error',
        error: 'invalid_feature',
        message: `Invalid feature name. Valid features: ${validFeatures.join(', ')}`,
      });
    }

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        status: 'error',
        error: 'missing_text',
        message: 'Request body must include "text" as a non-empty string.',
      });
    }

    if (global.FIREBASE_FIRESTORE_ENABLED === false) {
      localPrompts[feature] = { text };
      clearPromptCache(feature);
      return res.json({
        status: 'ok',
        message: `Prompt for "${feature}" updated in local memory.`,
        feature,
      });
    }

    const db = getFirestore();
    const ref = db.collection('config').doc('systemPrompts').collection(feature).doc('prompt');

    await ref.set(
      {
        text,
        feature,
        updatedAt: new Date(),
        updatedBy: req.user?.uid || 'unknown',
      },
      { merge: true }
    );

    // Clear the prompt cache for this feature
    clearPromptCache(feature);

    return res.json({
      status: 'ok',
      message: `Prompt for "${feature}" updated successfully.`,
      feature,
    });
  } catch (error) {
    console.error('[Admin] Prompt update error:', error.message);
    return res.status(500).json({
      status: 'error',
      error: 'prompt_update_failed',
      message: error.message,
    });
  }
});

export default router;
