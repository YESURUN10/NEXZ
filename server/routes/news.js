import { Router } from 'express';
import crypto from 'crypto';
import axios from 'axios';
import { newsCache } from '../utils/cache.js';
import { jsonCompletion } from '../utils/groq.js';
import { logRequest } from '../utils/logger.js';
import { verifyToken } from '../middleware/auth.js';
import { createQuotaCheck, incrementCounter } from '../middleware/quotaCheck.js';

const router = Router();

/**
 * Module-level hash map for resolving article hashes back to full articles.
 * Key: MD5 hash of article URL, Value: full article object
 */
const articleHashMap = new Map();

/**
 * Generate MD5 hash from a URL string.
 * @param {string} url
 * @returns {string}
 */
function hashUrl(url) {
  return crypto.createHash('md5').update(url).digest('hex');
}

/**
 * Enrich articles with hash field and store them in the hash map.
 * @param {Array} articles
 * @returns {Array} Articles with added `hash` field
 */
function enrichArticles(articles) {
  if (!Array.isArray(articles)) return [];

  return articles.map((article) => {
    const url = article.url || article.title || String(Date.now());
    const hash = hashUrl(url);
    const enriched = { ...article, hash };
    articleHashMap.set(hash, enriched);
    return enriched;
  });
}

// ===========================================================
// GET /top - Top headlines (no auth, newsApi quota check)
// ===========================================================
router.get('/top', createQuotaCheck('newsApi'), async (req, res) => {
  const startTime = Date.now();

  try {
    const {
      country = 'in',
      category,
      q,
      pageSize = 20,
    } = req.query;

    // Build cache key from params
    const cacheKey = `news:top:${country}:${category || ''}:${q || ''}:${pageSize}`;

    // Check cache first
    const cached = newsCache.get(cacheKey);
    if (cached) {
      logRequest({
        route: 'GET /api/news/top',
        timestamp: new Date().toISOString(),
        success: true,
      });
      return res.json({ status: 'ok', fromCache: true, ...cached });
    }

    // Build NewsAPI request params
    const params = {
      country,
      pageSize: Math.min(parseInt(pageSize, 10) || 20, 100),
    };
    if (category) params.category = category;
    if (q) params.q = q;

    let response;
    try {
      response = await axios.get('https://newsapi.org/v2/top-headlines', { 
        params, 
        headers: {
          'X-Api-Key': process.env.NEWS_API_KEY,
          'User-Agent': 'Nexz-App/1.0'
        },
        timeout: 2500 
      });
    } catch (error) {
      console.warn(`[News] Primary /top failed (${error.message}), falling back to mock...`);
      const mockCategory = category || 'general';
      const mockCountry = country || 'in';
      response = await axios.get(`https://saurav.tech/NewsAPI/top-headlines/category/${mockCategory}/${mockCountry}.json`, { timeout: 10000 });
    }
    const { totalResults, articles: rawArticles } = response.data;
    const articles = enrichArticles(rawArticles);

    const result = { totalResults, articles };

    // Cache the response
    newsCache.set(cacheKey, result);

    // Increment API counter
    await incrementCounter('newsApi');

    logRequest({
      route: 'GET /api/news/top',
      timestamp: new Date().toISOString(),
      success: true,
    });

    return res.json({ status: 'ok', ...result });
  } catch (error) {
    console.error('[News] Top headlines error:', error.message);

    logRequest({
      route: 'GET /api/news/top',
      timestamp: new Date().toISOString(),
      success: false,
      errorType: error.response?.status === 429 ? 'rate_limit' : 'api_error',
    });

    return res.status(error.response?.status || 500).json({
      status: 'error',
      error: 'news_api_error',
      message: error.response?.data?.message || error.message,
    });
  }
});

// ===========================================================
// GET /search - Search news articles (no auth, newsApi quota)
// ===========================================================
router.get('/search', createQuotaCheck('newsApi'), async (req, res) => {
  try {
    const {
      q,
      from,
      to,
      sortBy = 'publishedAt',
      language = 'en',
      pageSize = 20,
    } = req.query;

    if (!q) {
      return res.status(400).json({
        status: 'error',
        error: 'missing_query',
        message: 'Query parameter "q" is required.',
      });
    }

    // Build cache key
    const cacheKey = `news:search:${q}:${from || ''}:${to || ''}:${sortBy}:${language}:${pageSize}`;

    // Check cache first
    const cached = newsCache.get(cacheKey);
    if (cached) {
      logRequest({
        route: 'GET /api/news/search',
        timestamp: new Date().toISOString(),
        success: true,
      });
      return res.json({ status: 'ok', fromCache: true, ...cached });
    }

    // Build NewsAPI request params
    const params = {
      q,
      sortBy,
      language,
      pageSize: Math.min(parseInt(pageSize, 10) || 20, 100),
    };
    if (from) params.from = from;
    if (to) params.to = to;

    let response;
    try {
      response = await axios.get('https://newsapi.org/v2/everything', { 
        params, 
        headers: {
          'X-Api-Key': process.env.NEWS_API_KEY,
          'User-Agent': 'Nexz-App/1.0'
        },
        timeout: 2500 
      });
    } catch (error) {
      console.warn(`[News] Primary /search failed (${error.message}), falling back to mock...`);
      // Use the generic /top as a fallback for search since saurav doesn't support /everything properly
      const mockCategory = 'general';
      const mockCountry = 'in';
      response = await axios.get(`https://saurav.tech/NewsAPI/top-headlines/category/${mockCategory}/${mockCountry}.json`, { timeout: 10000 });
    }
    const { totalResults, articles: rawArticles } = response.data;
    const articles = enrichArticles(rawArticles);

    const result = { totalResults, articles };

    // Cache the response
    newsCache.set(cacheKey, result);

    // Increment API counter
    await incrementCounter('newsApi');

    logRequest({
      route: 'GET /api/news/search',
      timestamp: new Date().toISOString(),
      success: true,
    });

    return res.json({ status: 'ok', ...result });
  } catch (error) {
    console.error('[News] Search error:', error.message);

    logRequest({
      route: 'GET /api/news/search',
      timestamp: new Date().toISOString(),
      success: false,
      errorType: error.response?.status === 429 ? 'rate_limit' : 'api_error',
    });

    return res.status(error.response?.status || 500).json({
      status: 'error',
      error: 'news_api_error',
      message: error.response?.data?.message || error.message,
    });
  }
});

// ===========================================================
// GET /resolve/:hash - Resolve article hash (no auth, no quota)
// ===========================================================
router.get('/resolve/:hash', (req, res) => {
  const { hash } = req.params;
  const article = articleHashMap.get(hash);

  if (!article) {
    return res.status(404).json({
      status: 'error',
      error: 'article_not_found',
      message: 'Article not found. It may have expired from the cache.',
    });
  }

  return res.json({ status: 'ok', article });
});

// ===========================================================
// POST /corroboration - Cross-reference headline (auth + quotas)
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

      // Step 1: Extract keywords from headline using Groq
      const keywordResult = await jsonCompletion([
        {
          role: 'system',
          content: 'Extract 3-5 key entities/keywords from this headline. Return ONLY a JSON object with a "keywords" array of strings.',
        },
        {
          role: 'user',
          content: headline,
        },
      ], { temperature: 0.2, max_tokens: 256 });

      const keywords = keywordResult.data?.keywords || [];
      const searchQuery = keywords.join(' OR ');

      // Step 2: Search NewsAPI with extracted keywords
      let sources = [];
      let matchCount = 0;

      if (searchQuery) {
        try {
          const response = await axios.get('https://newsapi.org/v2/everything', {
            params: {
              q: searchQuery,
              sortBy: 'relevancy',
              language: 'en',
              pageSize: 10,
            },
            headers: {
              'X-Api-Key': process.env.NEWS_API_KEY,
              'User-Agent': 'Nexz-App/1.0'
            },
            timeout: 10000,
          });

          matchCount = response.data.totalResults || 0;
          sources = (response.data.articles || []).map((a) => ({
            title: a.title,
            source: a.source?.name,
            url: a.url,
            publishedAt: a.publishedAt,
          }));

          // Increment news API counter
          await incrementCounter('newsApi');
        } catch (searchError) {
          console.error('[News] Corroboration search error:', searchError.message);
        }
      }

      // Increment Groq counter
      await incrementCounter('groq', keywordResult.usage.total_tokens);

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
