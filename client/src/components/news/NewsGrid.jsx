import React, { useState } from 'react';
import NewsCard from './NewsCard';
import NewsSkeleton from './NewsSkeleton';
import { RefreshCcw, Zap, Layers, ChevronDown, Radio, ChevronRight } from 'lucide-react';

export default function NewsGrid({
  articles = [],
  loading = false,
  loadingMore = false,
  error = null,
  hasMore = false,
  onLoadMore,
  onRetry,
  showFeatured = false,
  limit = 12,
  onLimitChange,
  emptyTitle = 'No stories discovered',
  emptyDescription = 'Try adjusting your search terms or filter category to discover breaking events.',
  onCategoryClick,
}) {
  const [showDetails, setShowDetails] = useState(false);

  if (loading && articles.length === 0) {
    return (
      <div className="space-y-6">
        {showFeatured && <NewsSkeleton count={1} variant="featured" />}
        <NewsSkeleton count={Math.min(limit, 8)} variant="card" />
      </div>
    );
  }

  if (error && articles.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-8 sm:p-12 text-center max-w-xl mx-auto my-8 relative overflow-hidden shadow-2xl">
        {/* Subtle animated lightning / signal aura */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Intelligence Feed Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 text-[var(--color-accent)] text-xs font-mono tracking-widest uppercase mb-6">
          <Radio className="w-3.5 h-3.5 animate-pulse text-[var(--color-energy)]" />
          <span>INTELLIGENCE FEED</span>
        </div>

        {/* Animated Network / Lightning Icon */}
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1E0E38] to-[#120820] border border-[var(--color-border)] text-[var(--color-accent)] flex items-center justify-center mx-auto mb-5 shadow-lg group">
          <div className="absolute inset-0 rounded-2xl bg-[var(--color-accent)]/10 animate-ping opacity-25" />
          <Zap className="w-8 h-8 text-[var(--color-accent)] drop-shadow-[0_0_10px_rgba(139,92,246,0.6)]" />
        </div>

        <h3 className="font-serif font-bold text-2xl text-[var(--color-text-primary)] mb-2">
          Unable to establish connection
        </h3>
        <p className="text-sm text-[var(--color-text-muted)] mb-6 leading-relaxed max-w-md mx-auto">
          The intelligence feed could not be reached. The real-time intelligence stream is momentarily unavailable.
        </p>

        {onRetry && (
          <div className="mb-6">
            <button
              onClick={onRetry}
              disabled={loading}
              className="btn-primary inline-flex items-center justify-center gap-2.5 px-7 py-3 rounded-xl text-sm font-semibold tracking-wide cursor-pointer disabled:opacity-60 transition-all"
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin text-[var(--color-energy)]' : ''}`} />
              <span>{loading ? 'Reconnecting to Wire...' : 'Reconnect Feed'}</span>
            </button>
          </div>
        )}

        {/* Technical Error Details Accordion */}
        <div className="border-t border-[var(--color-border)] pt-4 text-left">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full text-xs font-mono text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors py-1 cursor-pointer"
          >
            <span>Technical Diagnostics</span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
          </button>

          {showDetails && (
            <div className="mt-2.5 p-3.5 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] font-mono text-xs text-[var(--color-text-muted)] space-y-1.5 overflow-x-auto">
              <div className="flex items-center justify-between text-[11px] text-[var(--color-text-secondary)]">
                <span>SIGNAL: OFFLINE</span>
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
              <p className="text-rose-400 break-words">{typeof error === 'string' ? error : JSON.stringify(error)}</p>
              <p className="text-[11px] text-[var(--color-text-muted)] opacity-75">
                Target endpoint: /api/news/top • Re-synchronization available upon connection restore.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!loading && articles.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50 p-12 text-center max-w-lg mx-auto my-8">
        <Layers className="w-12 h-12 text-[var(--color-text-muted)] opacity-40 mx-auto mb-3" />
        <h3 className="font-serif font-bold text-lg text-[var(--color-text-primary)] mb-1">
          {emptyTitle}
        </h3>
        <p className="text-sm text-[var(--color-text-muted)] max-w-sm mx-auto mb-5">
          {emptyDescription}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider border border-[var(--color-border)] hover:border-[var(--color-accent)] text-[var(--color-text-primary)] transition-colors"
          >
            Reset Filters
          </button>
        )}
      </div>
    );
  }

  const featuredArticle = showFeatured && articles.length > 0 ? articles[0] : null;
  const gridArticles = showFeatured && articles.length > 0 ? articles.slice(1) : articles;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Featured Lead Card */}
      {featuredArticle && (
        <div className="mb-6 animate-fade-up">
          <NewsCard
            article={featuredArticle}
            featured={true}
            onCategoryClick={onCategoryClick}
          />
        </div>
      )}

      {/* Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
        {gridArticles.map((article, index) => (
          <div
            key={article.hash || article.url || index}
            className="h-full min-w-0 animate-fade-up"
            style={{ animationDelay: `${(index % 8) * 40}ms` }}
          >
            <NewsCard
              article={article}
              onCategoryClick={onCategoryClick}
            />
          </div>
        ))}
      </div>

      {/* Grid Footer Controls: Load More & Article Limit */}
      <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[var(--color-border)]">
        {/* Limit Selector */}
        {onLimitChange && (
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-text-muted)]">
            <span>Display per batch:</span>
            <div className="flex items-center bg-[var(--color-bg-secondary)] rounded-lg p-0.5 border border-[var(--color-border)]">
              {[8, 12, 24].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => onLimitChange(num)}
                  className={`px-2.5 py-1 rounded-md transition-all font-mono text-xs ${
                    limit === num
                      ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)] font-bold shadow-xs'
                      : 'hover:text-[var(--color-text-primary)] text-[var(--color-text-muted)]'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="flex items-center">
            <button
              onClick={onLoadMore}
              disabled={loadingMore}
              className="group px-6 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-accent)] text-[var(--color-text-primary)] hover:text-[var(--color-accent)] text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loadingMore ? (
                <>
                  <RefreshCcw className="w-4 h-4 animate-spin text-[var(--color-accent)]" />
                  <span>Synthesizing next feed...</span>
                </>
              ) : (
                <>
                  <span>Load More Intelligence</span>
                  <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
