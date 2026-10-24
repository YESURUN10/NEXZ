import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resolveArticle } from '../services/api';
import { articleStore } from '../store/articleStore';
import { timeAgo } from '../utils/timeAgo';
import { estimateReadingTime } from '../services/newsService';
import { isBookmarked, toggleBookmark } from '../services/bookmarkService';
import { 
  ArrowLeft, 
  ExternalLink, 
  Bookmark, 
  Share2, 
  Clock, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import CredibilityMeter from '../components/article/CredibilityMeter';
import ExplainSlider from '../components/article/ExplainSlider';
import RelatedNews from '../components/article/RelatedNews';
import { showToast } from '../components/layout/Toast';
import { useChatContext } from '../contexts/ChatContext';

const HeroGlobe = lazy(() => import('../components/layout/HeroGlobe'));

export default function ArticlePage() {
  const { hash } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const { setArticleContext } = useChatContext();
  const imageRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;

    const inner = imageRef.current.querySelector('.tilt-card-inner');
    if (inner) {
      inner.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }
  };

  const handleMouseLeave = () => {
    if (!imageRef.current) return;
    const inner = imageRef.current.querySelector('.tilt-card-inner');
    if (inner) {
      inner.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });

    // 1. Check local memory cache first
    const cached = articleStore.get(hash);
    if (cached) {
      setArticle(cached);
      setBookmarked(isBookmarked(cached.hash || cached.url));
      setLoading(false);
      return;
    }

    // 2. Fallback to API resolution
    setLoading(true);
    resolveArticle(hash)
      .then((res) => {
        if (res?.article) {
          articleStore.set(hash, res.article);
          setArticle(res.article);
          setBookmarked(isBookmarked(res.article.hash || res.article.url));
        } else {
          showToast('Article not found. Returning to feed.', 'error');
          navigate('/home');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Resolve error:', err);
        showToast('Article session expired. Returning home.', 'error');
        navigate('/home');
      });
  }, [hash, navigate]);

  const articleText = article
    ? `${article.title}\n\n${article.description || ''}\n\n${article.content || ''}`
    : '';

  useEffect(() => {
    if (articleText) {
      setArticleContext(articleText);
      return () => setArticleContext('');
    }
  }, [articleText, setArticleContext]);

  const handleBookmarkToggle = () => {
    if (!article) return;
    const added = toggleBookmark(article);
    setBookmarked(added);
    showToast(added ? 'Article saved to bookmarks' : 'Article removed from bookmarks', 'info');
  };

  const handleShare = async () => {
    if (!article) return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.description,
          url,
        });
        return;
      } catch {
        // Fallback
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast('Article link copied to clipboard', 'info');
    } catch {
      showToast('Unable to copy link', 'error');
    }
  };

  // Find previous / next article in store if available
  const allStored = Array.from(articleStore.values());
  const currentIndex = allStored.findIndex((a) => a.hash === hash);
  const prevArticle = currentIndex > 0 ? allStored[currentIndex - 1] : null;
  const nextArticle = currentIndex >= 0 && currentIndex < allStored.length - 1 ? allStored[currentIndex + 1] : null;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        <div className="w-32 h-6 skeleton rounded" />
        <div className="w-48 h-8 skeleton rounded" />
        <div className="w-full h-14 skeleton rounded" />
        <div className="w-3/4 h-10 skeleton rounded" />
        <div className="w-full h-96 skeleton rounded-2xl" />
      </div>
    );
  }

  if (!article) return null;

  const readingTime = estimateReadingTime(article.content || article.description);
  const categoryName = article.category || 'Intelligence';

  return (
    <div className="relative min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
      <Suspense fallback={null}>
        <HeroGlobe />
      </Suspense>

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Top Breadcrumb & Actions Bar */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-mono text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dispatch Feed
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBookmarkToggle}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                bookmarked
                  ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] border-[var(--color-accent)]'
                  : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)]'
              }`}
              title={bookmarked ? 'Remove Bookmark' : 'Save Bookmark'}
              aria-label={bookmarked ? 'Remove Bookmark' : 'Save Bookmark'}
            >
              <Bookmark className="w-4 h-4" fill={bookmarked ? 'currentColor' : 'none'} />
            </button>

            <button
              onClick={handleShare}
              className="p-2.5 rounded-xl border bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] transition-all cursor-pointer"
              title="Share Story"
              aria-label="Share Story"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Credibility Verification Meter */}
        <div className="mb-6">
          <CredibilityMeter headline={article.title} />
        </div>

        {/* Metadata Chips Bar */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono uppercase tracking-wider text-[var(--color-text-muted)] mb-4">
          <span className="bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/30 px-3 py-1 rounded-full font-semibold">
            {categoryName}
          </span>
          <span className="bg-[var(--color-bg-secondary)] px-3 py-1 rounded-full border border-[var(--color-border)] text-[var(--color-text-primary)]">
            {article.source?.name || 'Verified Wire'}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {timeAgo(article.publishedAt)}
          </span>
          <span>•</span>
          <span>{readingTime}</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-display leading-tight text-[var(--color-text-primary)] mb-8">
          {article.title}
        </h1>

        {/* Hero Media Box */}
        {article.urlToImage && (
          <div
            ref={imageRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="w-full aspect-[16/10] sm:h-96 rounded-2xl mb-10 overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-xl"
          >
            <div className="tilt-card-inner w-full h-full relative">
              <img
                src={article.urlToImage}
                alt={article.title}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          </div>
        )}

        {/* AI Explanation Multi-Level Slider */}
        <div className="mb-10">
          <ExplainSlider articleText={articleText} />
        </div>

        {/* Article Body */}
        <article className="prose prose-invert max-w-none text-base sm:text-lg leading-relaxed text-[var(--color-text-primary)] font-serif space-y-4">
          {article.description && (
            <p className="text-xl font-sans font-medium text-[var(--color-text-secondary)] leading-relaxed border-l-2 border-[var(--color-accent)] pl-4 my-6">
              {article.description}
            </p>
          )}

          {article.content ? (
            <p className="whitespace-pre-line">
              {article.content.replace(/\[\+\d+ chars\]/, '')}
            </p>
          ) : (
            <p className="text-[var(--color-text-muted)] italic">
              Full dispatch report is syndicated from primary wire sources. Access the original publication below for the unabridged coverage.
            </p>
          )}
        </article>

        {/* External Link to Original Source */}
        <div className="mt-10 pt-6 border-t border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] text-sm font-semibold transition-colors"
          >
            Read Original Coverage on {article.source?.name || 'Publisher'} <ExternalLink className="w-4 h-4" />
          </a>

          <span className="text-xs font-mono text-[var(--color-text-muted)]">
            Article Ref: {hash ? hash.slice(0, 12) : 'local'}
          </span>
        </div>

        {/* Prev / Next Navigation */}
        {(prevArticle || nextArticle) && (
          <nav aria-label="Story Navigation" className="my-10 pt-8 border-t border-[var(--color-border)] grid sm:grid-cols-2 gap-4">
            {prevArticle ? (
              <button
                onClick={() => navigate(`/article/${prevArticle.hash}`)}
                className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-[var(--color-accent)] text-left transition-all cursor-pointer group"
              >
                <span className="text-[10px] font-mono uppercase text-[var(--color-text-muted)] flex items-center gap-1 mb-1">
                  <ChevronLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" /> Previous Story
                </span>
                <p className="font-serif font-semibold text-sm text-[var(--color-text-primary)] line-clamp-1 group-hover:text-[var(--color-accent)]">
                  {prevArticle.title}
                </p>
              </button>
            ) : <div />}

            {nextArticle && (
              <button
                onClick={() => navigate(`/article/${nextArticle.hash}`)}
                className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-[var(--color-accent)] text-right transition-all cursor-pointer group"
              >
                <span className="text-[10px] font-mono uppercase text-[var(--color-text-muted)] flex items-center justify-end gap-1 mb-1">
                  Next Story <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
                <p className="font-serif font-semibold text-sm text-[var(--color-text-primary)] line-clamp-1 group-hover:text-[var(--color-accent)]">
                  {nextArticle.title}
                </p>
              </button>
            )}
          </nav>
        )}

        {/* Related Stories */}
        <RelatedNews currentArticle={article} />
      </main>
    </div>
  );
}
