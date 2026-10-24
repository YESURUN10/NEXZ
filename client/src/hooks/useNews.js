import { useState, useEffect, useCallback, useRef } from 'react';
import { getTopHeadlines, searchArticles, DEFAULT_NEWS_LIMIT, deduplicateArticles } from '../services/newsService';

export function useNews({
  query = '',
  category = '',
  country = 'in',
  initialLimit = DEFAULT_NEWS_LIMIT,
  autoFetch = true,
} = {}) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(autoFetch);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [hasMore, setHasMore] = useState(true);
  const [totalResults, setTotalResults] = useState(0);

  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchBatch = useCallback(
    async ({ targetPage = 1, append = false, forceRefresh = false } = {}) => {
      // Abort prior in-flight request if starting a fresh batch
      if (!append && abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const currentReqId = ++requestIdRef.current;

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        // Clear stale articles on fresh mode/category/country switch
        setArticles([]);
      }
      setError(null);

      try {
        let result;
        if (query && query.trim()) {
          result = await searchArticles({
            query: query.trim(),
            category,
            page: targetPage,
            limit,
            forceRefresh,
          });
        } else {
          result = await getTopHeadlines({
            country: country || 'in',
            category,
            page: targetPage,
            limit,
            forceRefresh,
          });
        }

        // Drop if component unmounted or superseded by a newer request
        if (!isMountedRef.current || currentReqId !== requestIdRef.current) {
          return;
        }

        const newArticles = result.articles || [];
        setTotalResults(result.totalResults || 0);
        setHasMore(newArticles.length >= limit);
        setPage(targetPage);

        setArticles((prev) => {
          if (append) {
            return deduplicateArticles([...prev, ...newArticles]);
          }
          return deduplicateArticles(newArticles);
        });
      } catch (err) {
        if (!isMountedRef.current || currentReqId !== requestIdRef.current) {
          return;
        }
        if (err.name === 'CanceledError' || err.name === 'AbortError') {
          return;
        }
        const msg = err.response?.data?.message || err.message || 'Failed to load news';
        setError(msg);
      } finally {
        if (isMountedRef.current && currentReqId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [query, category, country, limit]
  );

  // Trigger when query, category, country, or limit changes
  useEffect(() => {
    if (autoFetch) {
      setPage(1);
      fetchBatch({ targetPage: 1, append: false });
    }
  }, [fetchBatch, autoFetch]);

  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      fetchBatch({ targetPage: page + 1, append: true });
    }
  }, [fetchBatch, loading, loadingMore, hasMore, page]);

  const refresh = useCallback(() => {
    setPage(1);
    fetchBatch({ targetPage: 1, append: false, forceRefresh: true });
  }, [fetchBatch]);

  return {
    articles,
    loading,
    loadingMore,
    error,
    page,
    limit,
    setLimit,
    hasMore,
    totalResults,
    loadMore,
    refresh,
  };
}
