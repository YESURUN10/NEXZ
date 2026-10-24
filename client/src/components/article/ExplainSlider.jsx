import React, { useState, useRef } from 'react';
import { getExplanation } from '../../services/api';
import { EXPLAIN_LEVELS } from '../../utils/constants';
import { Radio, RefreshCw, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ExplainSlider({ articleText }) {
  const [activeLevel, setActiveLevel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const summariesRef = useRef({ eli5: null, standard: null, expert: null });
  const [displaySummary, setDisplaySummary] = useState(null);

  const fetchSummary = async (levelId) => {
    setLoading(true);
    setError(null);
    setDisplaySummary(null);
    try {
      const res = await getExplanation(articleText, levelId);
      summariesRef.current[levelId] = res.summary;
      setDisplaySummary(res.summary);
    } catch (err) {
      console.error('[Explain] Generation failed:', err);
      let category = 'Server Error';
      let message = 'The AI service could not complete the request.';

      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        category = 'Network Timeout';
        message = 'The AI request timed out. Please retry.';
      } else if (err.response?.data?.category) {
        category = err.response.data.category;
        message = err.response.data.message || message;
      } else if (err.response?.status === 429) {
        category = 'Quota Exceeded';
        message = err.response.data?.message || 'Daily AI rate limit reached. Please try again later.';
      } else if (err.response?.status === 401) {
        category = 'Authentication Error';
        message = err.response.data?.message || 'Authentication required. Please sign in.';
      } else if (err.response?.status === 503) {
        category = 'Provider Unavailable';
        message = 'The AI provider is experiencing high demand. Please try again shortly.';
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      }

      setError({
        title: 'INTELLIGENCE LINK INTERRUPTED',
        message,
        category,
        levelId,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLevelChange = async (levelId) => {
    if (activeLevel === levelId) {
      setActiveLevel(null);
      setDisplaySummary(null);
      setError(null);
      return;
    }
    
    setActiveLevel(levelId);
    
    if (summariesRef.current[levelId]) {
      setError(null);
      setDisplaySummary(summariesRef.current[levelId]);
      return;
    }

    await fetchSummary(levelId);
  };

  if (!articleText) return null;

  return (
    <div className="my-8">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="font-semibold text-lg font-serif flex items-center gap-2 text-[var(--color-text-primary)]">
          <Sparkles className="w-4 h-4 text-[var(--color-accent)] animate-pulse" />
          <span>Multi-Level Synthesis</span>
        </h3>
        <div className="flex bg-[var(--color-bg-secondary)] rounded-xl p-1 border border-[var(--color-border)]">
          {EXPLAIN_LEVELS.map((level) => (
            <button
              key={level.id}
              onClick={() => handleLevelChange(level.id)}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeLevel === level.id 
                  ? 'bg-[var(--color-accent)] text-white shadow-md shadow-purple-900/40 font-semibold' 
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card-hover)]'
              }`}
            >
              <span>{level.icon}</span>
              <span className="hidden sm:inline">{level.label}</span>
            </button>
          ))}
        </div>
      </div>

      {(loading || displaySummary || error) && (
        <div className="p-5 rounded-2xl glass bg-[var(--color-bg-secondary)]/80 border border-[var(--color-border)] relative overflow-hidden shadow-xl">
          {/* Subtle electric indicator line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent" />

          {/* Loading: ANALYZING SIGNALS... */}
          {loading && (
            <div className="py-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-[var(--color-accent)] animate-ping" />
                <div className="font-mono text-xs font-bold text-[var(--color-energy-purple)] tracking-wider flex items-center gap-2">
                  <span>ANALYZING SIGNALS...</span>
                  <span className="text-[10px] font-normal text-cyan-400">
                    [{activeLevel?.toUpperCase() || 'SYNTHESIS'}]
                  </span>
                </div>
              </div>
              <div className="w-full bg-[var(--color-bg-primary)] h-1.5 rounded-full overflow-hidden relative">
                <motion.div 
                  className="h-full bg-gradient-to-r from-purple-600 via-cyan-400 to-purple-600 rounded-full"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                  style={{ width: '50%' }}
                />
              </div>
            </div>
          )}

          {/* Error: INTELLIGENCE LINK INTERRUPTED */}
          {error && !loading && (
            <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/40 text-left">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-300">
                <Radio className="w-4 h-4 text-red-400 animate-pulse" />
                <span>{error.title}</span>
              </div>
              <p className="text-xs text-red-200 mt-1 leading-relaxed">
                {error.message}
              </p>
              {error.category && (
                <div className="text-[10px] font-mono text-red-400/80 mt-1.5 uppercase">
                  Status: {error.category}
                </div>
              )}
              <button
                onClick={() => fetchSummary(error.levelId)}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>RETRY</span>
              </button>
            </div>
          )}

          {/* Success: Display Result */}
          {displaySummary && !loading && !error && (
            <div className="prose prose-invert max-w-none text-[var(--color-text-primary)] leading-relaxed animate-in fade-in text-sm font-sans">
              {displaySummary.split('\n').map((para, i) => (
                para ? <p key={i} className="mb-2 last:mb-0 text-[var(--color-text-primary)]">{para}</p> : <br key={i} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
