import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchNews, fetchTopNews } from '../../services/api';
import { articleStore } from '../../store/articleStore';
import { timeAgo } from '../../utils/timeAgo';
import { Sparkles, ArrowRight, Newspaper, ExternalLink, Link2, AlertCircle } from 'lucide-react';

const STOP_WORDS = new Set([
  'about', 'after', 'again', 'against', 'their', 'there', 'these', 'could',
  'which', 'would', 'where', 'world', 'first', 'state', 'report', 'watch',
  'today', 'latest', 'claims', 'years', 'times', 'under', 'over', 'ahead',
  'video', 'photos', 'live', 'news', 'update', 'updates', 'with', 'from',
  'into', 'more', 'some', 'than', 'them', 'they', 'what', 'when', 'will',
]);

function extractSearchEntities(title = '') {
  return title
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w.toLowerCase()))
    .slice(0, 3)
    .join(' ');
}

export default function RelatedNews({ currentArticle }) {
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCategoryFallback, setIsCategoryFallback] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentArticle) return;
    let isMounted = true;

    async function discoverRelatedCoverage() {
      setLoading(true);
      setIsCategoryFallback(false);

      const currentId = currentArticle.hash || currentArticle.url;
      const entitiesQuery = extractSearchEntities(currentArticle.title);

      try {
        let matchedArticles = [];

        // 1. Try real entity/keyword search across the live intelligence wire
        if (entitiesQuery && entitiesQuery.trim()) {
          try {
            const searchRes = await searchNews({ q: entitiesQuery, pageSize: 6 });
            if (searchRes?.articles && Array.isArray(searchRes.articles)) {
              matchedArticles = searchRes.articles.filter(
                (a) => (a.hash || a.url) !== currentId && a.title !== currentArticle.title
              );
            }
          } catch (searchErr) {
            console.warn('[RelatedNews] Entity search returned no results, trying category feed:', searchErr.message);
          }
        }

        // 2. Fall back to same-category headlines if specific entity search had no separate stories
        if (matchedArticles.length === 0) {
          setIsCategoryFallback(true);
          const topRes = await fetchTopNews({
            category: currentArticle.category || 'general',
            pageSize: 6,
          });
          if (topRes?.articles && Array.isArray(topRes.articles)) {
            matchedArticles = topRes.articles
              .filter((a) => (a.hash || a.url) !== currentId && a.title !== currentArticle.title)
              .slice(0, 3);
          }
        }

        if (isMounted) {
          setRelated(matchedArticles.slice(0, 3));
        }
      } catch (err) {
        console.warn('[RelatedNews] Discovery error:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    discoverRelatedCoverage();
    return () => { isMounted = false; };
  }, [currentArticle]);

  if (!loading && related.length === 0) {
    return (
      <section className="my-10 pt-6 border-t border-[var(--color-border)]">
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-text-muted)] bg-[var(--color-bg-secondary)] p-3 rounded-xl border border-[var(--color-border)]">
          <AlertCircle className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
          <span>No external corroborated dispatches found on the live wire for this specific story yet.</span>
        </div>
      </section>
    );
  }

  const handleSelect = (item) => {
    if (item.hash) {
      articleStore.set(item.hash, item);
      navigate(`/article/${item.hash}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section className="my-12 pt-8 border-t border-[var(--color-border)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="font-serif font-bold text-2xl text-[var(--color-text-primary)] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--color-accent)]" />
            {isCategoryFallback ? 'Related Topic Dispatches' : 'Corroborating Dispatches & Context'}
          </h3>
          <p className="text-xs font-mono text-[var(--color-text-muted)] mt-1">
            {isCategoryFallback 
              ? `General coverage across ${currentArticle.category || 'current'} intelligence` 
              : 'Automatically discovered from real-time news sources'}
          </p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-muted)] self-start sm:self-auto">
          {isCategoryFallback ? 'Topic Wire' : 'Cross-Source Matched'}
        </span>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-xl skeleton" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
          {related.map((item) => (
            <article
              key={item.hash || item.url}
              onClick={() => handleSelect(item)}
              className="group p-4 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="aspect-[16/9] w-full rounded-lg overflow-hidden bg-[var(--color-bg-secondary)] mb-3 relative">
                  {item.urlToImage ? (
                    <img
                      src={item.urlToImage}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Newspaper className="w-8 h-8 text-[var(--color-text-muted)] opacity-30" />
                    </div>
                  )}
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-[10px] font-mono text-white flex items-center gap-1">
                    <Link2 className="w-3 h-3 text-[var(--color-accent)]" /> Live Source
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-[var(--color-text-muted)] uppercase mb-1.5">
                  <span className="text-[var(--color-accent)] font-semibold truncate max-w-[65%]">
                    {item.source?.name}
                  </span>
                  <span>{timeAgo(item.publishedAt)}</span>
                </div>

                <h4 className="font-serif font-semibold text-sm line-clamp-2 text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors leading-snug">
                  {item.title}
                </h4>
              </div>

              <div className="mt-3 pt-2 border-t border-[var(--color-border)]/50 flex items-center justify-between text-xs font-medium text-[var(--color-accent)] opacity-80 group-hover:opacity-100">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="hover:underline flex items-center gap-1 text-[11px] font-mono text-[var(--color-text-muted)] hover:text-[var(--color-accent)]"
                  title="Open original report"
                >
                  Source <ExternalLink className="w-3 h-3" />
                </a>
                <span className="flex items-center">
                  Analyze <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
