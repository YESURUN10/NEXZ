import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, X, Trash2 } from 'lucide-react';
import { getBookmarks, toggleBookmark } from '../../services/bookmarkService';
import { timeAgo } from '../../utils/timeAgo';
import { articleStore } from '../../store/articleStore';

export default function BookmarksModal({ isOpen, onClose }) {
  const [bookmarks, setBookmarks] = useState(getBookmarks());
  const navigate = useNavigate();

  useEffect(() => {
    const handleUpdate = () => {
      setBookmarks(getBookmarks());
    };
    window.addEventListener('nexz-bookmarks-updated', handleUpdate);
    return () => window.removeEventListener('nexz-bookmarks-updated', handleUpdate);
  }, []);

  if (!isOpen) return null;

  const handleOpenArticle = (item) => {
    if (item.hash) {
      articleStore.set(item.hash, item);
      navigate(`/article/${item.hash}`);
      onClose();
    }
  };

  const handleRemove = (e, item) => {
    e.stopPropagation();
    toggleBookmark(item);
    setBookmarks(getBookmarks());
  };

  return (
    <div className="fixed inset-0 z-[var(--z-index-modal)] flex justify-end">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="relative z-10 w-full max-w-md bg-[var(--color-bg-secondary)] border-l border-[var(--color-border)] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-[var(--color-accent)]" />
            <h2 className="font-serif font-bold text-xl text-[var(--color-text-primary)]">
              Saved Intelligence
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-accent)] font-mono">
              {bookmarks.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            aria-label="Close bookmarks"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {bookmarks.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Bookmark className="w-12 h-12 text-[var(--color-text-muted)] opacity-40 mx-auto mb-4" />
              <p className="font-serif text-lg text-[var(--color-text-primary)] mb-1">
                No Bookmarked Stories
              </p>
              <p className="text-xs text-[var(--color-text-muted)] max-w-xs mx-auto">
                Click the bookmark icon on any news card to save articles for offline reading and deep analysis.
              </p>
            </div>
          ) : (
            bookmarks.map((item) => (
              <div
                key={item.hash || item.url}
                onClick={() => handleOpenArticle(item)}
                className="group relative p-4 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all cursor-pointer flex gap-3"
              >
                {item.urlToImage && (
                  <img
                    src={item.urlToImage}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover shrink-0 bg-[var(--color-bg-secondary)]"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[var(--color-text-muted)] uppercase mb-1">
                    <span className="truncate max-w-[120px] text-[var(--color-accent)]">
                      {item.source?.name || 'News Source'}
                    </span>
                    <span>{timeAgo(item.publishedAt)}</span>
                  </div>
                  <h3 className="font-serif font-semibold text-sm line-clamp-2 text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors leading-snug">
                    {item.title}
                  </h3>
                </div>
                <button
                  onClick={(e) => handleRemove(e, item)}
                  className="p-1.5 self-start opacity-70 hover:opacity-100 text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors"
                  title="Remove bookmark"
                  aria-label="Remove bookmark"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
