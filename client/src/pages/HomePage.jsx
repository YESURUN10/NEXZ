import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNews } from '../hooks/useNews';
import { extractTrendingKeywords } from '../services/newsService';
import NewsGrid from '../components/news/NewsGrid';
import CategoryTabs from '../components/news/CategoryTabs';
import TrendingTicker from '../components/news/TrendingTicker';
import StateSelector from '../components/news/StateSelector';
import CountrySelector from '../components/news/CountrySelector';
import { 
  RefreshCcw, 
  Search, 
  X, 
  Sparkles
} from 'lucide-react';

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  const perspectiveParam = searchParams.get('perspective') || 'india'; // 'india' | 'world'

  const [activePerspective, setActivePerspective] = useState(perspectiveParam);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCountries, setSelectedCountries] = useState(['us', 'gb']);
  const [articleLimit, setArticleLimit] = useState(12);

  // Determine effective query and country based on perspective and state
  const countryCode = activePerspective === 'india' ? 'in' : (selectedCountries[0] || 'us');
  const effectiveQuery = queryParam || (selectedState ? selectedState : '');

  const {
    articles,
    loading,
    loadingMore,
    error,
    hasMore,
    totalResults,
    loadMore,
    refresh,
  } = useNews({
    query: effectiveQuery,
    category: categoryParam,
    country: countryCode,
    initialLimit: articleLimit,
  });

  // Extract trending tags dynamically from articles
  const trendingTags = useMemo(() => {
    return extractTrendingKeywords(articles);
  }, [articles]);

  // Sync category selection with URL params
  const handleSelectCategory = (catId) => {
    const nextParams = new URLSearchParams(searchParams);
    if (catId) {
      nextParams.set('category', catId);
    } else {
      nextParams.delete('category');
    }
    setSearchParams(nextParams);
  };

  // Handle trending tag click
  const handleTagClick = (tag) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('q', tag);
    setSearchParams(nextParams);
  };

  // Clear search filter
  const handleClearSearch = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('q');
    setSelectedState('');
    setSearchParams(nextParams);
  };

  // Change perspective (India vs World)
  const handlePerspectiveChange = (mode) => {
    setActivePerspective(mode);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('perspective', mode);
    setSearchParams(nextParams);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
      {/* Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        
        {/* Breaking Dispatch Strip */}
        {articles.length > 0 && (
          <TrendingTicker articles={articles} />
        )}

        {/* Perspective & Regional Header Controls */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--color-border)]">
          {/* Feed Title / Search Title */}
          <div>
            {queryParam ? (
              <div className="flex items-center gap-3">
                <h1 className="font-serif font-black text-2xl sm:text-3xl text-[var(--color-text-primary)] flex items-center gap-2">
                  <Search className="w-6 h-6 text-[var(--color-accent)]" />
                  Search: "{queryParam}"
                </h1>
                <button
                  onClick={handleClearSearch}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-[var(--color-accent)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Clear
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="font-serif font-black text-2xl sm:text-3xl tracking-tight text-[var(--color-text-primary)]">
                  {activePerspective === 'india' ? '🇮🇳 India Intelligence' : '🌐 World Perspective'}
                </h1>
                <span className="hidden sm:inline-block text-xs font-mono text-[var(--color-text-muted)] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                  {totalResults > 0 ? `${totalResults} stories` : 'Live Dispatch'}
                </span>
              </div>
            )}
          </div>

          {/* Perspective Selector & Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Perspective Switcher */}
            <div className="flex items-center bg-[var(--color-bg-secondary)] rounded-xl p-1 border border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => handlePerspectiveChange('india')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
                  activePerspective === 'india'
                    ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)] shadow-xs'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                🇮🇳 India
              </button>
              <button
                type="button"
                onClick={() => handlePerspectiveChange('world')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
                  activePerspective === 'world'
                    ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)] shadow-xs'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                🌐 Global
              </button>
            </div>

            {/* Regional Dropdown */}
            {activePerspective === 'india' ? (
              <StateSelector value={selectedState} onChange={setSelectedState} />
            ) : (
              <CountrySelector selected={selectedCountries} onChange={setSelectedCountries} />
            )}

            {/* Manual Refresh Button */}
            <button
              onClick={refresh}
              disabled={loading}
              title="Refresh feed"
              className="p-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-[var(--color-accent)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-all cursor-pointer disabled:opacity-50"
              aria-label="Refresh intelligence feed"
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin text-[var(--color-accent)]' : ''}`} />
            </button>
          </div>
        </section>

        {/* Category Filter Tabs */}
        <section aria-label="Category Filters">
          <CategoryTabs
            selectedCategory={categoryParam}
            onSelectCategory={handleSelectCategory}
          />
        </section>

        {/* Trending Keywords Strip */}
        {trendingTags.length > 0 && (
          <section className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1 shrink-0 text-[var(--color-accent)] font-semibold uppercase text-[10px]">
              <Sparkles className="w-3 h-3" /> Trending Topics:
            </span>
            {trendingTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                className="px-2.5 py-1 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors shrink-0 cursor-pointer text-[11px]"
              >
                #{tag}
              </button>
            ))}
          </section>
        )}

        {/* News Grid (with Featured Story Hero Lead when no search query) */}
        <section className="pt-2">
          <NewsGrid
            articles={articles}
            loading={loading}
            loadingMore={loadingMore}
            error={error}
            hasMore={hasMore}
            onLoadMore={loadMore}
            onRetry={refresh}
            showFeatured={!queryParam && !selectedState}
            limit={articleLimit}
            onLimitChange={(newLimit) => setArticleLimit(newLimit)}
            onCategoryClick={handleSelectCategory}
            emptyTitle={queryParam ? `No intelligence found for "${queryParam}"` : 'No stories found'}
            emptyDescription={
              queryParam
                ? 'Try exploring a different keyword or reset to view the live global briefing.'
                : 'No dispatches recorded for this topic right now. Check back shortly.'
            }
          />
        </section>
      </main>
    </div>
  );
}
