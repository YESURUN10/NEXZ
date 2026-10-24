import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { articleStore } from '../../store/articleStore';

export default function TrendingTicker({ articles = [] }) {
  const navigate = useNavigate();

  if (!articles || articles.length === 0) return null;

  const topItems = articles.slice(0, 6);

  const handleClick = (item) => {
    if (item.hash) {
      articleStore.set(item.hash, item);
      navigate(`/article/${item.hash}`);
    }
  };

  return (
    <div className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl py-2 px-3 sm:px-4 mb-6 flex items-center gap-3 overflow-hidden shadow-xs">
      {/* Pulse badge */}
      <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-md bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/30 text-[var(--color-accent)] text-[11px] font-mono font-bold tracking-wider uppercase">
        <Zap className="w-3 h-3 text-[var(--color-accent)] fill-[var(--color-accent)] animate-pulse" />
        <span className="hidden sm:inline">DISPATCH</span>
      </div>

      {/* Ticker items */}
      <div className="flex-1 overflow-x-auto scrollbar-none no-scrollbar flex items-center gap-4 text-xs font-sans">
        {topItems.map((item, index) => (
          <button
            key={item.hash || item.url || index}
            onClick={() => handleClick(item)}
            className="flex items-center gap-2 shrink-0 group text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer text-left"
          >
            <span className="font-mono text-[10px] text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)]">
              #{index + 1}
            </span>
            <span className="truncate max-w-[220px] sm:max-w-[320px] font-medium group-hover:underline decoration-[var(--color-accent)]">
              {item.title}
            </span>
            <span className="text-[var(--color-border)]">/</span>
          </button>
        ))}
      </div>
    </div>
  );
}
