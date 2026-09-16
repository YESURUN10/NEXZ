import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resolveArticle } from '../services/api';
import { articleStore } from '../store/articleStore';
import { timeAgo } from '../utils/timeAgo';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import CredibilityMeter from '../components/article/CredibilityMeter';
import ExplainSlider from '../components/article/ExplainSlider';
import { showToast } from '../components/layout/Toast';
import { useChatContext } from '../contexts/ChatContext';

const HeroGlobe = lazy(() => import('../components/layout/HeroGlobe'));

export default function ArticlePage() {
  const { hash } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setArticleContext } = useChatContext();
  const imageRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    imageRef.current.style.setProperty('--mouse-x', `${x}px`);
    imageRef.current.style.setProperty('--mouse-y', `${y}px`);

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;
    
    const inner = imageRef.current.querySelector('.tilt-card-inner');
    if (inner) inner.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = () => {
    if (!imageRef.current) return;
    const inner = imageRef.current.querySelector('.tilt-card-inner');
    if (inner) inner.style.transform = 'rotateX(0deg) rotateY(0deg)';
  };

  useEffect(() => {
    // 1. Check local memory cache first
    const cached = articleStore.get(hash);
    if (cached) {
      setArticle(cached);
      setLoading(false);
      return;
    }

    // 2. Fallback to API resolution
    resolveArticle(hash)
      .then(res => {
        setArticle(res.article);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        showToast('Article session expired. Please return home.', 'error');
        navigate('/home');
      });
  }, [hash, navigate]);

  const articleText = article ? `${article.title}\n\n${article.description || ''}\n\n${article.content || ''}` : '';

  useEffect(() => {
    if (articleText) {
      setArticleContext(articleText);
      return () => setArticleContext('');
    }
  }, [articleText, setArticleContext]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="w-32 h-6 skeleton rounded mb-8"></div>
        <div className="w-full h-12 skeleton rounded mb-6"></div>
        <div className="w-2/3 h-12 skeleton rounded mb-12"></div>
        <div className="w-full h-96 skeleton rounded-2xl"></div>
      </div>
    );
  }

  if (!article) return null;

  return (
    <div className="relative min-h-screen">
      <Suspense fallback={null}>
        <HeroGlobe />
      </Suspense>
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-8 md:py-12">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors mb-8 font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to News
        </button>

        <CredibilityMeter headline={article.title} />

        <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-wider text-[var(--color-text-muted)] mb-6">
          <span className="bg-[var(--color-bg-secondary)] px-3 py-1 rounded-full border border-[var(--color-border)]">
            {article.source?.name}
          </span>
          <span>{timeAgo(article.publishedAt)}</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-black font-serif leading-tight mb-8 text-[var(--color-text-primary)]">
          {article.title}
        </h1>

        {article.urlToImage && (
          <div 
            ref={imageRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="w-full h-64 md:h-96 rounded-3xl mb-12 tilt-card card-glow"
          >
            <div className="tilt-card-inner w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-[var(--color-border)]">
              <img src={article.urlToImage} alt={article.title} className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        <div className="prose prose-invert max-w-none text-lg leading-relaxed text-[var(--color-text-primary)] font-serif">
          <p>{article.description}</p>
          <p>{article.content?.replace(/\[\+\d+ chars\]/, '')}</p>
        </div>

        <div className="mt-8 pt-8 border-t border-[var(--color-border)]">
          <a 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] font-medium transition-colors"
          >
            Read full article on {article.source?.name} <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <ExplainSlider articleText={articleText} />
      </div>
    </div>
  );
}
