import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { newsCache, llmCache } from '../utils/cache.js';

/**
 * Factory function that creates a quota-checking middleware.
 * Checks daily API usage against configured limits in Firestore.
 *
 * @param {'newsApi'|'groq'} type - The quota type to check
 * @returns {Function} Express middleware
 */
export function createQuotaCheck(type) {
  return async (req, res, next) => {
    try {
      if (global.FIREBASE_FIRESTORE_ENABLED === false) {
        return next();
      }
      const db = getFirestore();
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const usageRef = db.collection('apiUsage').doc(today);
      const usageDoc = await usageRef.get();
      const usage = usageDoc.exists ? usageDoc.data() : {};

      let currentUsage = 0;
      let limit = 0;

      if (type === 'newsApi') {
        currentUsage = usage.newsApiCalls || 0;
        limit = parseInt(process.env.NEWS_API_DAILY_LIMIT, 10) || 90;
      } else if (type === 'groq') {
        currentUsage = usage.groqTokensUsed || 0;
        limit = parseInt(process.env.GROQ_TOKEN_DAILY_LIMIT, 10) || 100000;
      }

      const percentUsed = limit > 0 ? (currentUsage / limit) * 100 : 0;

      // At or over 100%: try cache fallback, else 429
      if (percentUsed >= 100) {
        const cache = type === 'newsApi' ? newsCache : llmCache;
        const fallbackKey = type === 'newsApi' ? 'news' : 'llm';
        const cachedData = cache.getAnyMatch(fallbackKey);

        if (cachedData) {
          return res.json({
            status: 'ok',
            fromCache: true,
            quotaExceeded: true,
            ...cachedData,
          });
        }

        return res.status(429).json({
          status: 'error',
          error: 'quota_exceeded',
          message: `Daily ${type === 'newsApi' ? 'News API' : 'Groq AI'} quota has been reached. Please try again tomorrow.`,
          usage: {
            current: currentUsage,
            limit,
            percentUsed: Math.round(percentUsed),
          },
        });
      }

      // 80-100%: set warning header but proceed
      if (percentUsed >= 80) {
        res.set('X-Quota-Warning', JSON.stringify({
          type,
          percentUsed: Math.round(percentUsed),
          current: currentUsage,
          limit,
        }));
      }

      // Store usage info on request for potential later use
      req.quotaInfo = req.quotaInfo || {};
      req.quotaInfo[type] = { currentUsage, limit, percentUsed };

      next();
    } catch (error) {
      console.error(`[Quota] Check failed for ${type}:`, error.message);
      // On quota check failure, proceed anyway (fail open)
      next();
    }
  };
}

/**
 * Increment a usage counter in Firestore for today's date.
 *
 * @param {'newsApi'|'groq'} type - The counter type to increment
 * @param {number} amount - Amount to increment by (default 1)
 */
export async function incrementCounter(type, amount = 1) {
  if (global.FIREBASE_FIRESTORE_ENABLED === false) return;
  try {
    const db = getFirestore();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const usageRef = db.collection('apiUsage').doc(today);

    let updateData = {};

    if (type === 'newsApi') {
      updateData = {
        newsApiCalls: FieldValue.increment(amount),
        lastUpdated: new Date(),
      };
    } else if (type === 'groq') {
      updateData = {
        groqTokensUsed: FieldValue.increment(amount),
        groqCallCount: FieldValue.increment(1),
        lastUpdated: new Date(),
      };
    }

    await usageRef.set(updateData, { merge: true });
  } catch (error) {
    console.error(`[Quota] Increment failed for ${type}:`, error.message);
  }
}
