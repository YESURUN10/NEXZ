import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { timeAgo } from '../../utils/timeAgo';
import { estimateReadingTime } from '../../services/newsService';
import { isBookmarked, toggleBookmark } from '../../services/bookmarkService';
import { showToast } from '../layout/Toast';
import { articleStore } from '../../store/articleStore';
import { Newspaper, Bookmark, Share2, ArrowUpRight, Clock } from 'lucide-react';

export default function NewsCard({ article, featured = false, onCategoryClick }) {
  const cardRef = useRef(null);
  const navigate = useNavigate();
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    if (article) {
      setBookmarked(isBookmarked(article.hash || article.url));
    }
  }, [article]);

  const handleMouseMove = (e) => {
    if (!cardRef.current || featured) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;

    const inner = cardRef.current.querySelector('.tilt-card-inner');
    if (inner) {
      inner.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
    }
  };

  const handleMouseLeave = () => {
    if (!cardRef.current || featured) return;
    const inner = cardRef.current.querySelector('.tilt-card-inner');
    if (inner) {
      inner.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    }
  };

  const handleCardClick = () => {
    if (article?.hash) {
      articleStore.set(article.hash, article);
      navigate(`/article/${article.hash}`);
    }
  };

  const handleBookmarkToggle = (e) => {
    e.stopPropagation();
    const added = toggleBookmark(article);
    setBookmarked(added);
    showToast(added ? 'Article saved to bookmarks' : 'Article removed from bookmarks', 'info');
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    const url = article?.hash 
      ? `${window.location.origin}/article/${article.hash}`
      : article?.url || window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.description,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      showToast('Article link copied to clipboard', 'info');
    } catch {
      showToast('Unable to copy link', 'error');
    }
  };

  const categoryName = article.category || 'Intelligence';
  const readingTime = estimateReadingTime(article.content || article.description);

  if (featured) {
    return (
      <article
        onClick={handleCardClick}
        className="group relative w-full rounded-2xl overflow-hidden bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all duration-300 shadow-xl cursor-pointer"
      >
        <div className="grid lg:grid-cols-12 gap-0">
          {/* Image side */}
          <div className="lg:col-span-7 relative aspect-[16/10] lg:aspect-auto overflow-hidden bg-[var(--color-bg-card)]">
            {article.urlToImage ? (
              <img
                src={article.urlToImage}
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--color-bg-secondary)] to-[var(--color-bg-card)]"
              style={{ display: article.urlToImage ? 'none' : 'flex' }}
            >
              <Newspaper className="w-16 h-16 text-[var(--color-text-muted)] opacity-30" />
            </div>

            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider bg-[var(--color-accent)] text-[var(--color-bg-primary)] shadow-md">
                Featured Lead
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-black/60 backdrop-blur-md text-[var(--color-text-primary)] border border-white/10">
                {article.source?.name || 'Global'}
              </span>
            </div>
          </div>

          {/* Content side */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-[var(--color-text-muted)] uppercase mb-3">
                <span className="text-[var(--color-accent)] font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-ping" />
                  {categoryName}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {timeAgo(article.publishedAt)} • {readingTime}
                </span>
              </div>

              <h2 className="font-display font-black text-2xl sm:text-3xl text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors leading-tight mb-4">
                {article.title}
              </h2>

              <p className="text-sm sm:text-base text-[var(--color-text-secondary)] line-clamp-3 leading-relaxed font-sans mb-6">
                {article.description}
              </p>
            </div>

            <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBookmarkToggle}
                  className={`p-2 rounded-xl border transition-all ${
                    bookmarked
                      ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] border-[var(--color-accent)]'
                      : 'bg-[var(--color-bg-card)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)]'
                  }`}
                  aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark story'}
                >
                  <Bookmark className="w-4 h-4" fill={bookmarked ? 'currentColor' : 'none'} />
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="p-2 rounded-xl border bg-[var(--color-bg-card)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] transition-all"
                  aria-label="Share story"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-accent)] group-hover:translate-x-1 transition-transform">
                Read Intelligence <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
      className="tilt-card card-glow cursor-pointer h-full select-none"
    >
      <div className="tilt-card-inner h-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden flex flex-col hover:border-[var(--color-accent-dim)] transition-all duration-200 min-w-0 shadow-sm hover:shadow-xl">
        {/* Media Box */}
        <div className="aspect-[16/10] w-full relative overflow-hidden bg-[var(--color-bg-secondary)] shrink-0">
          {article.urlToImage ? (
            <img
              src={article.urlToImage}
              alt={article.title}
              loading="lazy"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : null}
          <div
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--color-bg-secondary)] to-[var(--color-bg-card)]"
            style={{ display: article.urlToImage ? 'none' : 'flex' }}
          >
            <Newspaper className="w-10 h-10 text-[var(--color-text-muted)] opacity-30" />
          </div>

          {/* Category Pill Tag */}
          <div className="absolute top-3 left-3 z-10">
            <span
              onClick={(e) => {
                if (onCategoryClick) {
                  e.stopPropagation();
                  onCategoryClick(categoryName);
                }
              }}
              className="px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold uppercase tracking-wider bg-black/60 backdrop-blur-md text-[var(--color-accent)] border border-white/10 hover:bg-[var(--color-accent)] hover:text-[var(--color-bg-primary)] transition-colors"
            >
              {categoryName}
            </span>
          </div>

          {/* Bookmark & Share float buttons */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 opacity-90 hover:opacity-100">
            <button
              type="button"
              onClick={handleBookmarkToggle}
              className={`p-1.5 rounded-md backdrop-blur-md transition-all ${
                bookmarked
                  ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)] shadow-sm'
                  : 'bg-black/60 text-white/80 hover:text-white hover:bg-black/80'
              }`}
              title={bookmarked ? 'Bookmarked' : 'Save bookmark'}
              aria-label={bookmarked ? 'Bookmarked' : 'Save bookmark'}
            >
              <Bookmark className="w-3.5 h-3.5" fill={bookmarked ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="p-1.5 rounded-md bg-black/60 backdrop-blur-md text-white/80 hover:text-white hover:bg-black/80 transition-all"
              title="Share"
              aria-label="Share article"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono text-[var(--color-text-muted)] uppercase mb-2">
              <span className="truncate max-w-[55%] text-[var(--color-text-secondary)] font-medium">
                {article.source?.name || 'Unknown Source'}
              </span>
              <span>{timeAgo(article.publishedAt)}</span>
            </div>

            <h3 className="font-display font-bold text-lg sm:text-xl line-clamp-2 text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors leading-snug mb-2">
              {article.title}
            </h3>

            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] line-clamp-2 font-sans leading-relaxed">
              {article.description}
            </p>
          </div>

          <div className="pt-3 mt-4 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3" />
              {readingTime}
            </span>
            <span className="text-[var(--color-accent)] font-semibold flex items-center gap-1 opacity-80 hover:opacity-100">
              Analyze <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
