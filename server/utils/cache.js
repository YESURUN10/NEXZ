/**
 * In-memory cache with configurable TTL.
 * Used for caching news API responses and LLM completions.
 */
class MemoryCache {
  /**
   * @param {number} ttlMs - Time-to-live in milliseconds (default 20 minutes)
   */
  constructor(ttlMs = 20 * 60 * 1000) {
    this.ttlMs = ttlMs;
    this.store = new Map();
  }

  /**
   * Get cached data by key. Returns null if expired or missing.
   * @param {string} key
   * @returns {*|null}
   */
  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.store.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Store data with current timestamp.
   * @param {string} key
   * @param {*} data
   */
  set(key, data) {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Check if key exists and is not expired.
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    const entry = this.store.get(key);
    if (!entry) return false;

    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear all cached entries.
   */
  clear() {
    this.store.clear();
  }

  /**
   * Find the first non-expired entry whose key includes partialKey.
   * Useful for quota fallback - returns any cached data that partially matches.
   * @param {string} partialKey
   * @returns {*|null}
   */
  getAnyMatch(partialKey) {
    for (const [key, entry] of this.store.entries()) {
      if (key.includes(partialKey)) {
        if (Date.now() - entry.timestamp <= this.ttlMs) {
          return entry.data;
        }
        this.store.delete(key);
      }
    }
    return null;
  }
}

/** Cache for news API responses (20-min TTL) */
export const newsCache = new MemoryCache(20 * 60 * 1000);

/** Cache for LLM completions (20-min TTL) */
export const llmCache = new MemoryCache(20 * 60 * 1000);

export { MemoryCache };
export default MemoryCache;
