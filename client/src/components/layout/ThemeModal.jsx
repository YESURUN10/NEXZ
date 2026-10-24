import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Palette, 
  Sparkles, 
  RotateCw, 
  Play, 
  Pause, 
  Check, 
  Type, 
  Sliders, 
  Zap 
} from 'lucide-react';
import { useTheme, THEMES } from '../../contexts/ThemeContext';

const QUICK_COLORS = [
  '#8B5CF6', // Violet
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#EF4444', // Red
  '#EC4899', // Pink
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#14B8A6'  // Teal
];

export default function ThemeModal({ isOpen, onClose }) {
  const {
    theme,
    currentThemeId,
    setTheme,
    customColor,
    setCustomColor,
    cycleNextTheme,
    isAutoCycling,
    toggleAutoCycle,
    fontVibe,
    setFontVibe
  } = useTheme();

  const [inputHex, setInputHex] = useState(customColor);
  const [activeTab, setActiveTab] = useState('presets'); // 'presets' | 'custom' | 'typography'

  if (!isOpen) return null;

  const handleHexSubmit = (e) => {
    e.preventDefault();
    let clean = inputHex.trim();
    if (!clean.startsWith('#')) clean = '#' + clean;
    if (/^#[0-9A-F]{6}$/i.test(clean) || /^#[0-9A-F]{3}$/i.test(clean)) {
      setCustomColor(clean);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[var(--z-index-modal)] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-primary)]/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/30">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)] font-display tracking-tight flex items-center gap-2">
                  Appearance & Theme Terminal
                  {isAutoCycling && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/40 animate-pulse">
                      <RotateCw className="w-2.5 h-2.5 animate-spin" /> CYCLING
                    </span>
                  )}
                </h3>
                <p className="text-xs text-[var(--color-text-muted)] font-mono">
                  Personalize aesthetic palettes, custom hues, and typography vibes
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
              aria-label="Close theme modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Actions Bar: Cycle & Auto-Cycle */}
          <div className="px-6 py-3 bg-[var(--color-bg-card)] border-b border-[var(--color-border)] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-text-muted)]">
              <span className="text-[var(--color-accent)] font-semibold uppercase">ACTIVE THEME:</span>
              <span className="text-[var(--color-text-primary)] font-medium">
                {theme.name}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Next in Cycle Button */}
              <button
                type="button"
                onClick={cycleNextTheme}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-card-hover)] border border-[var(--color-border)] hover:border-[var(--color-accent)] text-xs font-mono text-[var(--color-text-primary)] transition-all cursor-pointer shadow-sm active:scale-95"
                title="Hop to next theme"
              >
                <Zap className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                <span>Next in Cycle</span>
              </button>

              {/* Auto Cycle Toggle */}
              <button
                type="button"
                onClick={toggleAutoCycle}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-medium transition-all cursor-pointer shadow-sm ${
                  isAutoCycling
                    ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-[0_0_15px_rgba(var(--color-accent),0.3)]'
                    : 'bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-card-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] border-[var(--color-border)]'
                }`}
                title="Auto-cycle through all themes every 7s"
              >
                {isAutoCycling ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Auto-Cycle: ON</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Auto-Cycle: OFF</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex border-b border-[var(--color-border)] px-6 pt-2 bg-[var(--color-bg-primary)]/30">
            <button
              onClick={() => setActiveTab('presets')}
              className={`pb-2.5 px-3 text-xs font-mono font-semibold transition-colors relative ${
                activeTab === 'presets'
                  ? 'text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Curated Palettes ({THEMES.length})
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`pb-2.5 px-3 text-xs font-mono font-semibold transition-colors relative ${
                activeTab === 'custom'
                  ? 'text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Single Custom Color
            </button>
            <button
              onClick={() => setActiveTab('typography')}
              className={`pb-2.5 px-3 text-xs font-mono font-semibold transition-colors relative ${
                activeTab === 'typography'
                  ? 'text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Typography & Vibes
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* 1. Presets Tab */}
            {activeTab === 'presets' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {THEMES.map((item) => {
                  const isSelected = currentThemeId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTheme(item.id)}
                      className={`relative p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 group cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--color-bg-card)] border-[var(--color-accent)] shadow-[0_0_15px_rgba(0,0,0,0.5)] ring-1 ring-[var(--color-accent)]'
                          : 'bg-[var(--color-bg-card)]/50 border-[var(--color-border)] hover:border-[var(--color-text-muted)] hover:bg-[var(--color-bg-card)]'
                      }`}
                    >
                      {/* Swatch Circle */}
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-white/10 shadow-inner"
                        style={{ backgroundColor: item.accent }}
                      >
                        {isSelected && <Check className="w-5 h-5 text-black drop-shadow" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-[var(--color-text-primary)] font-display truncate">
                            {item.name}
                          </span>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
                          )}
                        </div>
                        <p className="text-xs text-[var(--color-text-muted)] font-mono truncate mt-0.5">
                          {item.tagline}
                        </p>

                        {/* Color pill strip */}
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="w-3.5 h-3.5 rounded-full border border-black/30" style={{ backgroundColor: item.bgPrimary }} />
                          <span className="w-3.5 h-3.5 rounded-full border border-black/30" style={{ backgroundColor: item.bgCard }} />
                          <span className="w-3.5 h-3.5 rounded-full border border-black/30" style={{ backgroundColor: item.accent }} />
                          <span className="w-3.5 h-3.5 rounded-full border border-black/30" style={{ backgroundColor: item.textSecondary }} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 2. Custom Color Tab */}
            {activeTab === 'custom' && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] space-y-4">
                  <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-accent)] uppercase">
                    <Sliders className="w-4 h-4" />
                    <span>Single Color Engine</span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                    Pick any custom accent color from the spectrum. NEXZ dynamically computes harmonious hover states, border highlights, glows, and dark-tinted backgrounds.
                  </p>

                  <div className="flex flex-wrap items-center gap-4">
                    {/* Native Color Input */}
                    <div className="relative flex items-center gap-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-2 rounded-xl">
                      <input
                        type="color"
                        value={customColor}
                        onChange={(e) => {
                          setInputHex(e.target.value);
                          setCustomColor(e.target.value);
                        }}
                        className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                        title="Open native color picker"
                      />
                      <div className="font-mono text-xs text-[var(--color-text-primary)]">
                        <div className="text-[10px] text-[var(--color-text-muted)]">PICKER</div>
                        <span className="font-bold uppercase">{customColor}</span>
                      </div>
                    </div>

                    {/* Text Hex Form */}
                    <form onSubmit={handleHexSubmit} className="flex items-center gap-2 flex-1 min-w-[200px]">
                      <input
                        type="text"
                        value={inputHex}
                        onChange={(e) => setInputHex(e.target.value)}
                        placeholder="#8B5CF6"
                        maxLength={7}
                        className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] rounded-xl py-2.5 px-3 text-xs font-mono text-[var(--color-text-primary)] focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-xs font-mono font-bold hover:brightness-110 transition-all cursor-pointer shadow-sm"
                      >
                        Apply
                      </button>
                    </form>
                  </div>
                </div>

                {/* Quick Swatches */}
                <div>
                  <h4 className="text-xs font-mono uppercase text-[var(--color-text-muted)] mb-2.5">
                    Express Spectrum Swatches
                  </h4>
                  <div className="flex flex-wrap gap-2.5">
                    {QUICK_COLORS.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => {
                          setInputHex(hex);
                          setCustomColor(hex);
                        }}
                        className="w-9 h-9 rounded-xl border border-white/20 transition-transform hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer shadow-md"
                        style={{ backgroundColor: hex }}
                        title={`Select ${hex}`}
                      >
                        {customColor.toLowerCase() === hex.toLowerCase() && (
                          <Check className="w-4 h-4 text-black drop-shadow" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. Typography & Vibes Tab */}
            {activeTab === 'typography' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-accent)] uppercase">
                    <Type className="w-4 h-4" />
                    <span>Curated Typography Vibes</span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                    NEXZ uses hand-selected typography designed to eliminate generic AI defaults. Headings use <strong>Outfit</strong> and UI copy uses <strong>Plus Jakarta Sans</strong>, paired with <strong>JetBrains Mono</strong> for tabular telemetry.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => setFontVibe('neo-tech')}
                    className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      fontVibe === 'neo-tech'
                        ? 'bg-[var(--color-bg-card)] border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]'
                        : 'bg-[var(--color-bg-card)]/50 border-[var(--color-border)] hover:bg-[var(--color-bg-card)]'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold text-[var(--color-text-primary)] font-display">
                        Neo-Tech Intelligence (Default)
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)] font-sans mt-0.5">
                        Outfit Display + Plus Jakarta Sans Body · High-vibe, modern geometric precision
                      </div>
                    </div>
                    {fontVibe === 'neo-tech' && <Check className="w-5 h-5 text-[var(--color-accent)]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFontVibe('executive')}
                    className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      fontVibe === 'executive'
                        ? 'bg-[var(--color-bg-card)] border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]'
                        : 'bg-[var(--color-bg-card)]/50 border-[var(--color-border)] hover:bg-[var(--color-bg-card)]'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold text-[var(--color-text-primary)] font-sans">
                        Executive Grotesque
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)] font-sans mt-0.5">
                        Plus Jakarta Sans across all tiers · Clean, ultra-readable corporate intelligence
                      </div>
                    </div>
                    {fontVibe === 'executive' && <Check className="w-5 h-5 text-[var(--color-accent)]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFontVibe('telemetry')}
                    className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      fontVibe === 'telemetry'
                        ? 'bg-[var(--color-bg-card)] border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]'
                        : 'bg-[var(--color-bg-card)]/50 border-[var(--color-border)] hover:bg-[var(--color-bg-card)]'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold text-[var(--color-text-primary)] font-mono">
                        Cyber Terminal Monospace
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)] font-mono mt-0.5">
                        JetBrains Mono Headers + Plus Jakarta Sans · High-density code terminal aesthetic
                      </div>
                    </div>
                    {fontVibe === 'telemetry' && <Check className="w-5 h-5 text-[var(--color-accent)]" />}
                  </button>
                </div>
              </div>
            )}

            {/* Live Interactive Preview Card */}
            <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-[var(--color-text-muted)] uppercase">
                <span className="flex items-center gap-1.5 text-[var(--color-accent)]">
                  <Sparkles className="w-3.5 h-3.5" />
                  Live Component Preview
                </span>
                <span>{theme.accent}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all hover:brightness-110 font-mono"
                  style={{ backgroundColor: theme.accent }}
                >
                  Primary Action
                </button>
                <div 
                  className="px-3 py-1 rounded-full text-xs font-mono font-medium border"
                  style={{ 
                    backgroundColor: `${theme.accent}15`, 
                    color: theme.accent,
                    borderColor: `${theme.accent}40`
                  }}
                >
                  Status Indicator
                </div>
                <span className="text-sm font-bold font-display" style={{ color: theme.textSecondary }}>
                  Signal Verified
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-[var(--color-border)] bg-[var(--color-bg-primary)]/50 flex items-center justify-between">
            <span className="text-xs font-mono text-[var(--color-text-muted)]">
              Changes persist instantly in local terminal memory
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-card-hover)] text-xs font-mono text-[var(--color-text-primary)] border border-[var(--color-border)] transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
