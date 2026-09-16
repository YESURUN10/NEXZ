import React, { useState, useEffect } from 'react';
import { getCorroboration } from '../../services/api';
import { CheckCircle, AlertTriangle, ChevronDown, ChevronUp, Search } from 'lucide-react';

export default function CredibilityMeter({ headline }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!headline) return;
    let isMounted = true;
    
    getCorroboration(headline)
      .then(res => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error("Corroboration error", err);
        if (isMounted) setLoading(false);
      });
      
    return () => { isMounted = false; };
  }, [headline]);

  if (loading) {
    return <div className="h-10 w-48 skeleton rounded-full mb-6"></div>;
  }

  if (!data) return null;

  const count = data.matchCount;
  const isConfirmed = count >= 2;
  const isSingleSource = count === 1;

  let colorClass = "bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-muted)]";
  let Icon = Search;
  let text = "No corroboration data";

  if (isConfirmed) {
    colorClass = "bg-[var(--color-success)]/10 border-[var(--color-success)]/30 text-[var(--color-success)]";
    Icon = CheckCircle;
    text = `Confirmed by ${count} sources`;
  } else if (isSingleSource) {
    colorClass = "bg-[var(--color-warning)]/10 border-[var(--color-warning)]/30 text-[var(--color-warning)]";
    Icon = AlertTriangle;
    text = "Single source — unconfirmed";
  }

  return (
    <div className="mb-6">
      <button 
        onClick={() => setExpanded(!expanded)}
        disabled={count === 0}
        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${colorClass} ${count > 0 ? 'hover:brightness-110 cursor-pointer' : 'cursor-default'}`}
      >
        <Icon className="w-4 h-4" />
        {text}
        {count > 0 && (
          expanded ? <ChevronUp className="w-4 h-4 ml-1 opacity-70" /> : <ChevronDown className="w-4 h-4 ml-1 opacity-70" />
        )}
      </button>

      {expanded && count > 0 && (
        <div className="mt-3 p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-sm animate-in fade-in slide-in-from-top-2">
          <p className="text-[var(--color-text-muted)] mb-2">Sources covering this story:</p>
          <ul className="list-disc list-inside space-y-1">
              {data.sources.slice(0, 5).map((src, i) => (
                <li key={i} className="text-[var(--color-text-primary)]">
                  {typeof src === 'string' ? (
                    <span>{src}</span>
                  ) : src.url ? (
                    <a href={src.url} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-accent)] transition-colors">
                      {src.title || src.source || 'Unknown source'}
                    </a>
                  ) : (
                    <span>{src.title || src.source || 'Unknown source'}</span>
                  )}
                  {typeof src === 'object' && src.source && <span className="text-[var(--color-text-muted)] ml-1">— {src.source}</span>}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
