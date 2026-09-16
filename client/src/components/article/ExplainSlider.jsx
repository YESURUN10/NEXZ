import React, { useState, useRef } from 'react';
import { getExplanation } from '../../services/api';
import { EXPLAIN_LEVELS } from '../../utils/constants';

export default function ExplainSlider({ articleText }) {
  const [activeLevel, setActiveLevel] = useState(null);
  const [loading, setLoading] = useState(false);
  const summariesRef = useRef({ eli5: null, standard: null, expert: null });
  const [displaySummary, setDisplaySummary] = useState(null);

  const handleLevelChange = async (levelId) => {
    if (activeLevel === levelId) {
      setActiveLevel(null);
      setDisplaySummary(null);
      return;
    }
    
    setActiveLevel(levelId);
    
    if (summariesRef.current[levelId]) {
      setDisplaySummary(summariesRef.current[levelId]);
      return;
    }

    setLoading(true);
    setDisplaySummary(null);
    try {
      const res = await getExplanation(articleText, levelId);
      summariesRef.current[levelId] = res.summary;
      setDisplaySummary(res.summary);
    } catch (err) {
      console.error(err);
      setDisplaySummary("Failed to generate explanation. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (!articleText) return null;

  return (
    <div className="my-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg font-serif flex items-center gap-2">
          ✨ AI Summaries
        </h3>
        <div className="flex bg-[var(--color-bg-secondary)] rounded-lg p-1 border border-[var(--color-border)]">
          {EXPLAIN_LEVELS.map((level) => (
            <button
              key={level.id}
              onClick={() => handleLevelChange(level.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1 ${
                activeLevel === level.id 
                  ? 'bg-[var(--color-accent)] text-white shadow-sm' 
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card-hover)]'
              }`}
            >
              <span>{level.icon}</span>
              <span className="hidden sm:inline">{level.label}</span>
            </button>
          ))}
        </div>
      </div>

      {(loading || displaySummary) && (
        <div className="p-5 rounded-xl glass bg-[var(--color-bg-secondary)]/50 border border-[var(--color-accent-dim)]/30 relative overflow-hidden">
          {loading && (
            <div className="space-y-3">
              <div className="h-4 skeleton w-full rounded"></div>
              <div className="h-4 skeleton w-5/6 rounded"></div>
              <div className="h-4 skeleton w-4/6 rounded"></div>
            </div>
          )}
          {displaySummary && !loading && (
            <div className="prose prose-invert max-w-none text-[var(--color-text-primary)] leading-relaxed animate-in fade-in">
              {displaySummary.split('\n').map((para, i) => (
                para ? <p key={i} className="mb-2 last:mb-0">{para}</p> : <br key={i} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
