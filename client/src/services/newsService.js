import { fetchTopNews, searchNews, resolveArticle } from './api';
import { articleStore } from '../store/articleStore';

export const DEFAULT_NEWS_LIMIT = 12;
export const FEATURED_NEWS_LIMIT = 6;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// In-memory cache with timestamp
const cache = new Map();

// In-flight request deduplication to prevent duplicate concurrent network calls
const inFlightRequests = new Map();

/**
 * Deduplicate articles by hash or URL.
 */
export function deduplicateArticles(articles) {
  if (!Array.isArray(articles)) return [];
  const seen = new Set();
  return articles.filter((item) => {
    if (!item) return false;
    const key = item.hash || item.url || item.title;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Estimate reading time based on content length.
 */
export function estimateReadingTime(contentOrDescription) {
  if (!contentOrDescription) return '2 min read';
  const words = contentOrDescription.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 60));
  return `${minutes} min read`;
}

/**
 * Build a stable cache key.
 */
function getCacheKey(type, params) {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k] ?? ''}`)
    .join('&');
  return `${type}:${sorted}`;
}

/**
 * Execute request with caching and deduplication.
 */
async function executeWithCache(cacheKey, fetchFn, { forceRefresh = false } = {}) {
  const now = Date.now();

  // 1. Check valid cache
  if (!forceRefresh && cache.has(cacheKey)) {
    const entry = cache.get(cacheKey);
    if (now - entry.timestamp < CACHE_TTL_MS) {
      return entry.data;
    }
    cache.delete(cacheKey);
  }

  // 2. Check in-flight duplicate request
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  // 3. Initiate request
  const requestPromise = (async () => {
    try {
      const data = await fetchFn();
      // Store in memory cache
      cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

/**
 * Fetch top headlines with configurable limits, pagination, and caching.
 */
export async function getTopHeadlines({
  country = 'in',
  category = '',
  page = 1,
  limit = DEFAULT_NEWS_LIMIT,
  forceRefresh = false,
} = {}) {
  const params = {
    country,
    category: category || undefined,
    page,
    pageSize: limit,
  };
  const cacheKey = getCacheKey('top', params);

  const raw = await executeWithCache(
    cacheKey,
    () => fetchTopNews(params),
    { forceRefresh }
  );

  const articles = deduplicateArticles(raw.articles || []);
  
  // Also seed articleStore so instant navigation works without network latency
  articles.forEach((a) => {
    if (a.hash) {
      articleStore.set(a.hash, a);
    }
  });

  return {
    status: raw.status || 'ok',
    totalResults: raw.totalResults || articles.length,
    articles,
    page,
    limit,
    hasMore: articles.length >= limit,
  };
}

/**
 * Search articles with query, pagination, and caching.
 */
export async function searchArticles({
  query,
  category = '',
  page = 1,
  limit = DEFAULT_NEWS_LIMIT,
  sortBy = 'publishedAt',
  forceRefresh = false,
} = {}) {
  if (!query || !query.trim()) {
    return { status: 'ok', totalResults: 0, articles: [], hasMore: false };
  }

  const cleanQuery = query.trim();
  const params = {
    q: category ? `${cleanQuery} AND ${category}` : cleanQuery,
    page,
    pageSize: limit,
    sortBy,
  };
  const cacheKey = getCacheKey('search', params);

  const raw = await executeWithCache(
    cacheKey,
    () => searchNews(params),
    { forceRefresh }
  );

  const articles = deduplicateArticles(raw.articles || []);
  articles.forEach((a) => {
    if (a.hash) {
      articleStore.set(a.hash, a);
    }
  });

  return {
    status: raw.status || 'ok',
    totalResults: raw.totalResults || articles.length,
    articles,
    page,
    limit,
    hasMore: articles.length >= limit,
  };
}

/**
 * Resolve an individual article by hash.
 */
export async function getArticleByHash(hash) {
  // Check store first
  if (articleStore.has(hash)) {
    return articleStore.get(hash);
  }

  const cacheKey = `article:${hash}`;
  const res = await executeWithCache(cacheKey, () => resolveArticle(hash));
  if (res?.article) {
    articleStore.set(hash, res.article);
    return res.article;
  }
  throw new Error('Article could not be resolved');
}

/**
 * Find meaningful related articles based on category, source, or keywords.
 */
export function getRelatedArticles(currentArticle, candidateArticles = [], limit = 4) {
  if (!currentArticle || !Array.isArray(candidateArticles)) return [];

  const currentId = currentArticle.hash || currentArticle.url;
  const currentCategory = (currentArticle.category || '').toLowerCase();
  const currentSource = (currentArticle.source?.name || '').toLowerCase();

  // Extract keywords (words > 4 letters)
  const titleWords = new Set(
    (currentArticle.title || '')
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 4)
  );

  const scored = candidateArticles
    .filter((a) => (a.hash || a.url) !== currentId)
    .map((a) => {
      let score = 0;
      if (currentCategory && (a.category || '').toLowerCase() === currentCategory) {
        score += 3;
      }
      if (currentSource && (a.source?.name || '').toLowerCase() === currentSource) {
        score += 2;
      }
      const otherWords = (a.title || '')
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/);

      for (const w of otherWords) {
        if (titleWords.has(w)) score += 1.5;
      }

      return { article: a, score };
    });

  scored.sort((a, b) => b.score - a.score);

  const best = scored.slice(0, limit).map((s) => s.article);
  if (best.length < limit) {
    // Fill remaining with unselected candidates
    for (const a of candidateArticles) {
      if ((a.hash || a.url) !== currentId && !best.some((b) => (b.hash || b.url) === (a.hash || a.url))) {
        best.push(a);
        if (best.length >= limit) break;
      }
    }
  }

  return best;
}

/**
 * Extract trending keywords from active articles for interactive tags.
 */
export function extractTrendingKeywords(articles = []) {
  const frequency = new Map();
  const stopWords = new Set([
    'about', 'after', 'again', 'against', 'their', 'there', 'these', 'could',
    'which', 'would', 'where', 'world', 'first', 'state', 'report', 'watch',
    'today', 'latest', 'claims', 'years', 'times', 'under', 'over', 'ahead',
  ]);

  for (const a of articles) {
    const words = (a.title || '')
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !stopWords.has(w));

    for (const w of words) {
      frequency.set(w, (frequency.get(w) || 0) + 1);
    }
  }

  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
}

/**
 * Clear the in-memory cache.
 */
export function clearNewsCache() {
  cache.clear();
  inFlightRequests.clear();
}
