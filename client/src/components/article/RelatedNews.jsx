import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRelatedArticles, getTopHeadlines } from '../../services/newsService';
import { articleStore } from '../../store/articleStore';
import { timeAgo } from '../../utils/timeAgo';
import { Sparkles, ArrowRight, Newspaper } from 'lucide-react';

export default function RelatedNews({ currentArticle }) {
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentArticle) return;
    let isMounted = true;

    async function loadRelated() {
      setLoading(true);
      try {
        // Fetch candidate articles matching the category or country
        const res = await getTopHeadlines({
          category: currentArticle.category || '',
          limit: 12,
        });

        if (isMounted) {
          const matched = getRelatedArticles(currentArticle, res.articles || [], 3);
          setRelated(matched);
        }
      } catch (err) {
        console.warn('Failed to load related stories:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadRelated();
    return () => { isMounted = false; };
  }, [currentArticle]);

  if (!loading && related.length === 0) return null;

  const handleSelect = (item) => {
    if (item.hash) {
      articleStore.set(item.hash, item);
      navigate(`/article/${item.hash}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section className="my-12 pt-8 border-t border-[var(--color-border)]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-serif font-bold text-2xl text-[var(--color-text-primary)] flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[var(--color-accent)]" />
          Related Intelligence
        </h3>
        <span className="text-xs font-mono text-[var(--color-text-muted)] uppercase">
          Contextually Linked
        </span>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-xl skeleton" />
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
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-[var(--color-text-muted)] uppercase mb-1.5">
                  <span className="text-[var(--color-accent)] truncate max-w-[65%]">
                    {item.source?.name}
                  </span>
                  <span>{timeAgo(item.publishedAt)}</span>
                </div>

                <h4 className="font-serif font-semibold text-sm line-clamp-2 text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors leading-snug">
                  {item.title}
                </h4>
              </div>

              <div className="mt-3 pt-2 border-t border-[var(--color-border)]/50 flex items-center justify-end text-xs font-medium text-[var(--color-accent)] opacity-80 group-hover:opacity-100">
                <span>Explore</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
