import { Router } from 'express';
import crypto from 'crypto';
import axios from 'axios';
import { newsCache } from '../utils/cache.js';
import { jsonCompletion } from '../utils/aiEngine.js';
import { logRequest } from '../utils/logger.js';
import { verifyToken } from '../middleware/auth.js';
import { createQuotaCheck, incrementCounter } from '../middleware/quotaCheck.js';
import { isNewsApiKeyValid, fetchLiveWireNews } from '../utils/wireService.js';

const router = Router();

/**
 * Module-level hash map for resolving article hashes back to full articles.
 * Key: MD5 hash of article URL, Value: full article object
 */
const articleHashMap = new Map();

/**
 * Generate MD5 hash from a URL or unique title string.
 */
function hashUrl(url) {
  return crypto.createHash('md5').update(String(url || Date.now())).digest('hex');
}

/**
 * Enrich articles with hash field and store them in the in-memory lookup map.
 */
function enrichArticles(articles) {
  if (!Array.isArray(articles)) return [];

  return articles
    .filter((article) => article && typeof article === 'object')
    .map((article, idx) => {
      const url = String(article.url || article.title || `news-${Date.now()}-${idx}`);
      const hash = hashUrl(url);
      const enriched = { ...article, hash };
      articleHashMap.set(hash, enriched);
      return enriched;
    });
}

// ===========================================================
// GET / and /top - Top headlines (with NewsAPI or Live Wire fallback)
// ===========================================================
router.get(['/', '/top'], createQuotaCheck('newsApi'), async (req, res) => {
  const startTime = Date.now();

  try {
    const {
      country = 'in',
      category,
      q,
      pageSize = 20,
    } = req.query;

    const limit = Math.min(parseInt(pageSize, 10) || 20, 100);
    const cacheKey = `news:top:${country}:${category || ''}:${q || ''}:${limit}`;

    // 1. Check cache first
    const cached = newsCache.get(cacheKey);
    if (cached) {
      logRequest({
        route: 'GET /api/news/top',
        timestamp: new Date().toISOString(),
        success: true,
      });
      return res.json({ status: 'ok', fromCache: true, ...cached });
    }

    let rawArticles = [];
    let totalResults = 0;
    let usedSource = 'none';

    // 2. Try primary NewsAPI if key is valid
    if (isNewsApiKeyValid(process.env.NEWS_API_KEY)) {
      try {
        const params = { country, pageSize: limit };
        if (category) params.category = category;
        if (q) params.q = q;

        const response = await axios.get('https://newsapi.org/v2/top-headlines', {
          params,
          headers: {
            'X-Api-Key': process.env.NEWS_API_KEY,
            'User-Agent': 'Nexz-App/1.0',
          },
          timeout: 2500,
        });

        if (response.data && Array.isArray(response.data.articles) && response.data.articles.length > 0) {
          rawArticles = response.data.articles;
          totalResults = response.data.totalResults || rawArticles.length;
          usedSource = 'newsapi';
          await incrementCounter('newsApi');
        }
      } catch (newsApiErr) {
        console.warn(`[News] Primary NewsAPI error: ${newsApiErr.response?.data?.message || newsApiErr.message}. Falling back to live wire.`);
      }
    }

    // 3. Fall back to Real Live Syndicated RSS Wire if NewsAPI not configured, rate-limited, or failed
    if (rawArticles.length === 0) {
      try {
        const wireArticles = await fetchLiveWireNews({
          country,
          category,
          query: q,
          limit,
        });

        if (wireArticles && wireArticles.length > 0) {
          rawArticles = wireArticles;
          totalResults = wireArticles.length;
          usedSource = 'live_wire';
        }
      } catch (wireErr) {
        console.error('[News] Live wire fetch failed:', wireErr.message);
      }
    }

    // 4. If no real news could be retrieved from any source, return clean error state (NO FAKE NEWS)
    if (!rawArticles || rawArticles.length === 0) {
      return res.status(503).json({
        status: 'error',
        error: 'stream_unreachable',
        message: 'The intelligence feed could not be reached.',
        details: 'No live dispatches could be retrieved from real-time news sources. Please check network connectivity and retry.',
      });
    }

    const articles = enrichArticles(rawArticles);
    const result = { totalResults, articles, source: usedSource };

    // Cache successful result
    newsCache.set(cacheKey, result);

    logRequest({
      route: 'GET /api/news/top',
      timestamp: new Date().toISOString(),
      success: true,
      durationMs: Date.now() - startTime,
    });

    return res.json({ status: 'ok', ...result });
  } catch (error) {
    console.error('[News] Top headlines error:', error.message);

    logRequest({
      route: 'GET /api/news/top',
      timestamp: new Date().toISOString(),
      success: false,
      errorType: 'api_error',
    });

    const isNetworkErr = error?.code === 'ENOTFOUND' || error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT';
    const status = isNetworkErr ? 503 : 500;

    return res.status(status).json({
      status: 'error',
      error: isNetworkErr ? 'upstream_unreachable' : 'news_api_error',
      message: 'The intelligence feed could not be reached.',
      details: process.env.NODE_ENV === 'production' 
        ? 'Real-time intelligence feed is temporarily unavailable. Please retry.' 
        : error.message,
    });
  }
});

// ===========================================================
// GET /search - Search news articles
// ===========================================================
router.get('/search', createQuotaCheck('newsApi'), async (req, res) => {
  const startTime = Date.now();

  try {
    const {
      q,
      from,
      to,
      sortBy = 'publishedAt',
      language = 'en',
      pageSize = 20,
    } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({
        status: 'error',
        error: 'missing_query',
        message: 'Query parameter "q" is required.',
      });
    }

    const limit = Math.min(parseInt(pageSize, 10) || 20, 100);
    const cacheKey = `news:search:${q.trim()}:${from || ''}:${to || ''}:${sortBy}:${language}:${limit}`;

    // 1. Check cache first
    const cached = newsCache.get(cacheKey);
    if (cached) {
      logRequest({
        route: 'GET /api/news/search',
        timestamp: new Date().toISOString(),
        success: true,
      });
      return res.json({ status: 'ok', fromCache: true, ...cached });
    }

    let rawArticles = [];
    let totalResults = 0;
    let usedSource = 'none';

    // 2. Try primary NewsAPI if key is valid
    if (isNewsApiKeyValid(process.env.NEWS_API_KEY)) {
      try {
        const params = {
          q: q.trim(),
          sortBy,
          language,
          pageSize: limit,
        };
        if (from) params.from = from;
        if (to) params.to = to;

        const response = await axios.get('https://newsapi.org/v2/everything', {
          params,
          headers: {
            'X-Api-Key': process.env.NEWS_API_KEY,
            'User-Agent': 'Nexz-App/1.0',
          },
          timeout: 2500,
        });

        if (response.data && Array.isArray(response.data.articles) && response.data.articles.length > 0) {
          rawArticles = response.data.articles;
          totalResults = response.data.totalResults || rawArticles.length;
          usedSource = 'newsapi';
          await incrementCounter('newsApi');
        }
      } catch (newsApiErr) {
        console.warn(`[News] Primary NewsAPI search error: ${newsApiErr.response?.data?.message || newsApiErr.message}. Falling back to live wire.`);
      }
    }

    // 3. Fall back to Real Live Syndicated RSS Wire
    if (rawArticles.length === 0) {
      try {
        const wireArticles = await fetchLiveWireNews({
          query: q.trim(),
          limit,
        });

        if (wireArticles && wireArticles.length > 0) {
          rawArticles = wireArticles;
          totalResults = wireArticles.length;
          usedSource = 'live_wire';
        }
      } catch (wireErr) {
        console.error('[News] Live wire search fetch failed:', wireErr.message);
      }
    }

    // 4. Return error if unable to retrieve real articles
    if (!rawArticles || rawArticles.length === 0) {
      return res.status(404).json({
        status: 'error',
        error: 'not_found',
        message: `No live intelligence signals found for "${q}".`,
        totalResults: 0,
        articles: [],
      });
    }

    const articles = enrichArticles(rawArticles);
    const result = { totalResults, articles, source: usedSource };

    // Cache successful search
    newsCache.set(cacheKey, result);

    logRequest({
      route: 'GET /api/news/search',
      timestamp: new Date().toISOString(),
      success: true,
      durationMs: Date.now() - startTime,
    });

    return res.json({ status: 'ok', ...result });
  } catch (error) {
    console.error('[News] Search error:', error.message);

    logRequest({
      route: 'GET /api/news/search',
      timestamp: new Date().toISOString(),
      success: false,
      errorType: 'api_error',
    });

    const isNetworkErr = error?.code === 'ENOTFOUND' || error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT';
    const status = isNetworkErr ? 503 : 500;

    return res.status(status).json({
      status: 'error',
      error: isNetworkErr ? 'upstream_unreachable' : 'news_api_error',
      message: 'The intelligence feed could not be reached.',
      details: process.env.NODE_ENV === 'production'
        ? 'Real-time intelligence feed is temporarily unavailable. Please retry.'
        : error.message,
    });
  }
});

// ===========================================================
// GET /resolve/:hash - Resolve article hash
// ===========================================================
router.get('/resolve/:hash', async (req, res) => {
  const { hash } = req.params;
  let article = articleHashMap.get(hash);

  if (!article) {
    return res.status(404).json({
      status: 'error',
      error: 'article_not_found',
      message: 'Article session expired or not found.',
    });
  }

  return res.json({ status: 'ok', article });
});

// ===========================================================
// POST /corroboration - Cross-reference headline
// ===========================================================
router.post(
  '/corroboration',
  verifyToken,
  createQuotaCheck('newsApi'),
  createQuotaCheck('groq'),
  async (req, res) => {
    try {
      const { headline } = req.body;

      if (!headline) {
        return res.status(400).json({
          status: 'error',
          error: 'missing_headline',
          message: 'Request body must include "headline".',
        });
      }

      // Step 1: Extract keywords from headline
      let keywords = [];
      try {
        const keywordResult = await jsonCompletion(
          [
            {
              role: 'system',
              content:
                'Extract 3-5 key entities/keywords from this headline. Return ONLY a JSON object with a "keywords" array of strings.',
            },
            {
              role: 'user',
              content: headline,
            },
          ],
          { temperature: 0.2, max_tokens: 256 }
        );
        keywords = keywordResult.data?.keywords || [];
        if (keywordResult.usage?.total_tokens) {
          await incrementCounter('groq', keywordResult.usage.total_tokens);
        }
      } catch (llmErr) {
        // Fallback simple keyword extraction
        keywords = headline
          .split(' ')
          .filter((w) => w.length > 4)
          .slice(0, 4);
      }

      const searchQuery = keywords.slice(0, 3).join(' ');

      // Step 2: Search real news wire
      let sources = [];
      let matchCount = 0;

      if (searchQuery) {
        try {
          const wireArticles = await fetchLiveWireNews({
            query: searchQuery,
            limit: 6,
          });

          matchCount = wireArticles.length;
          sources = wireArticles.map((a) => ({
            title: a.title,
            source: a.source?.name,
            url: a.url,
            publishedAt: a.publishedAt,
          }));
        } catch (searchError) {
          console.error('[News] Corroboration wire search error:', searchError.message);
        }
      }

      logRequest({
        route: 'POST /api/news/corroboration',
        userId: req.user?.uid,
        timestamp: new Date().toISOString(),
        success: true,
      });

      return res.json({
        status: 'ok',
        matchCount,
        sources,
        keywords,
      });
    } catch (error) {
      console.error('[News] Corroboration error:', error.message);

      logRequest({
        route: 'POST /api/news/corroboration',
        userId: req.user?.uid,
        timestamp: new Date().toISOString(),
        success: false,
        errorType: 'corroboration_error',
      });

      return res.status(500).json({
        status: 'error',
        error: 'corroboration_failed',
        message: error.message,
      });
    }
  }
);

export default router;
