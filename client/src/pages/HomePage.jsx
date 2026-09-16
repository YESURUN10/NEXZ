import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchTopNews, searchNews } from '../services/api';
import NewsCard from '../components/news/NewsCard';
import StateSelector from '../components/news/StateSelector';
import CountrySelector from '../components/news/CountrySelector';
import { RefreshCcw, LayoutGrid, Globe, WifiOff, AlertCircle } from 'lucide-react';
import { showToast } from '../components/layout/Toast';

const NewsCardMemo = React.memo(NewsCard);

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');

  const [indiaNews, setIndiaNews] = useState([]);
  const [worldNews, setWorldNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedState, setSelectedState] = useState('');
  const [selectedCountries, setSelectedCountries] = useState(['us', 'gb']);

  const loadNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (query) {
        const results = await searchNews({ q: query, pageSize: 30 });
        setIndiaNews(results.articles || []);
        setWorldNews([]);
      } else {
        let indiaResult;
        if (selectedState) {
          indiaResult = await searchNews({ q: selectedState, pageSize: 12 });
        } else {
          indiaResult = await fetchTopNews({ country: 'in', pageSize: 12 });
        }
        setIndiaNews(indiaResult.articles || []);

        try {
          const promises = selectedCountries.map(c => fetchTopNews({ country: c, pageSize: 6 }));
          const results = await Promise.all(promises);
          const combinedWorld = results
            .flatMap(r => r.articles || [])
            .sort(() => 0.5 - Math.random());
          setWorldNews(combinedWorld.slice(0, 12));
        } catch {
          // World news failure shouldn't block India news
          setWorldNews([]);
        }
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to load news';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [query, selectedState, selectedCountries]);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const renderSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-80 rounded-2xl skeleton" />
      ))}
    </div>
  );

  const renderError = () => (
    <div className="text-center py-20">
      <div className="w-16 h-16 rounded-full bg-[var(--color-error)]/10 flex items-center justify-center mx-auto mb-6">
        {error?.toLowerCase().includes('network')
          ? <WifiOff className="w-8 h-8 text-[var(--color-error)]" />
          : <AlertCircle className="w-8 h-8 text-[var(--color-error)]" />
        }
      </div>
      <h3 className="text-lg font-semibold mb-2">Failed to load news</h3>
      <p className="text-[var(--color-text-muted)] mb-6 max-w-md mx-auto">{error}</p>
      <button onClick={loadNews} className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl">
        <RefreshCcw className="w-4 h-4" /> Try Again
      </button>
    </div>
  );

  const renderGrid = (articles) => {
    if (loading) return renderSkeleton();
    if (error) return renderError();
    if (articles.length === 0) return (
      <div className="text-center py-20 text-[var(--color-text-muted)]">
        <p className="text-lg mb-2">No articles found</p>
        <p className="text-sm">Try a different search or check back later.</p>
      </div>
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {articles.map((article, i) => (
          <div key={`${article.url}-${i}`} className="min-w-0 h-full animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
            <NewsCardMemo article={article} />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {query ? (
        <div className="mb-12">
          <h1 className="text-2xl sm:text-3xl font-bold font-serif mb-6 flex items-center gap-3">
            <LayoutGrid className="w-7 h-7 sm:w-8 sm:h-8 text-[var(--color-accent)]" />
            Search Results for "{query}"
          </h1>
          {renderGrid(indiaNews)}
        </div>
      ) : (
        <>
          <section className="mb-12 sm:mb-16">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold font-serif flex items-center gap-3">
                <span className="text-2xl">🇮🇳</span> India Briefing
              </h1>
              <div className="flex items-center gap-3">
                <StateSelector value={selectedState} onChange={setSelectedState} />
                <button
                  onClick={loadNews}
                  disabled={loading}
                  className="p-2 rounded-full glass hover:bg-[var(--color-bg-card-hover)] transition-colors disabled:opacity-50"
                  aria-label="Refresh news"
                >
                  <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            {renderGrid(indiaNews)}
          </section>

          {!error && (
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 border-t border-[var(--color-border)] pt-8 sm:pt-12">
                <h1 className="text-2xl sm:text-3xl font-bold font-serif flex items-center gap-3">
                  <Globe className="w-7 h-7 sm:w-8 sm:h-8 text-[var(--color-accent)]" />
                  World Perspective
                </h1>
                <div className="flex items-center gap-3">
                  <CountrySelector selected={selectedCountries} onChange={setSelectedCountries} />
                </div>
              </div>
              {loading ? renderSkeleton() : (
                worldNews.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {worldNews.map((article, i) => (
                      <div key={`world-${article.url}-${i}`} className="min-w-0 h-full animate-fade-up" style={{ animationDelay: `${(i * 50) + 200}ms` }}>
                        <NewsCardMemo article={article} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-[var(--color-text-muted)]">
                    No world news available.
                  </div>
                )
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
