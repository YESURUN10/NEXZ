import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { timeAgo } from '../../utils/timeAgo';
import { Newspaper } from 'lucide-react';

import { articleStore } from '../../store/articleStore';

export default function NewsCard({ article }) {
  const cardRef = useRef(null);
  const navigate = useNavigate();

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    
    cardRef.current.querySelector('.tilt-card-inner').style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.querySelector('.tilt-card-inner').style.transform = 'rotateX(0deg) rotateY(0deg)';
  };

  const handleClick = () => {
    if (article.hash) {
      articleStore.set(article.hash, article);
      navigate(`/article/${article.hash}`);
    }
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className="tilt-card card-glow cursor-pointer h-full"
    >
      <div className="tilt-card-inner h-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden flex flex-col hover:border-[var(--color-accent-dim)] transition-colors min-w-0">
        <div className="aspect-[16/9] w-full relative overflow-hidden bg-[var(--color-bg-secondary)] shrink-0">
          {article.urlToImage ? (
            <img 
              src={article.urlToImage} 
              alt={article.title}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
              className="w-full h-full object-cover"
            />
          ) : null}
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--color-bg-secondary)] to-[var(--color-bg-card)]" style={{ display: article.urlToImage ? 'none' : 'flex' }}>
            <Newspaper className="w-12 h-12 text-[var(--color-text-muted)] opacity-50" />
          </div>
        </div>
        
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-3 text-[10px] uppercase tracking-wider font-mono">
            <span className="px-2 py-1 rounded bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] font-medium truncate max-w-[60%] border border-[var(--color-border)]">
              {article.source?.name || 'Unknown Source'}
            </span>
            <span className="text-[var(--color-text-muted)]">
              {timeAgo(article.publishedAt)}
            </span>
          </div>
          
          <h3 className="font-bold font-serif text-xl mb-2 line-clamp-3 break-words text-[var(--color-text-primary)] leading-snug group-hover:text-[var(--color-accent)] transition-colors">
            {article.title}
          </h3>
          
          <p className="text-sm text-[var(--color-text-muted)] line-clamp-2 mt-auto">
            {article.description}
          </p>
        </div>
      </div>
    </div>
  );
}
