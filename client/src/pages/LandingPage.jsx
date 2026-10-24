import React, { Suspense, lazy, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Shield, Radio, Activity, Palette, RotateCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeModal from '../components/layout/ThemeModal';

const KnowledgeNetwork = lazy(() => import('../components/layout/KnowledgeNetwork'));

export default function LandingPage() {
  const { user } = useAuth();
  const { theme, isAutoCycling } = useTheme();
  const navigate = useNavigate();
  const [themeModalOpen, setThemeModalOpen] = useState(false);

  const handleExplore = () => {
    if (user) {
      navigate('/home');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col justify-between bg-[var(--color-bg-primary)]">
      {/* Knowledge Network Canvas */}
      <Suspense fallback={<div className="absolute inset-0 bg-[#05030A]" />}>
        <KnowledgeNetwork />
      </Suspense>

      {/* Top Header Bar */}
      <header className="relative z-20 max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[var(--color-accent)] to-[var(--color-accent-hover)] flex items-center justify-center font-black text-black font-mono shadow-sm">
            N
          </div>
          <span className="text-xl font-black text-[var(--color-text-primary)] tracking-tight font-display">
            NEXZ
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Switcher Button */}
          <button
            type="button"
            onClick={() => setThemeModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-card)] border border-[var(--color-border)] hover:border-[var(--color-accent)] text-xs font-mono text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer shadow-sm group"
            title={`Active Theme: ${theme.name} (Click to customize)`}
          >
            <Palette className="w-4 h-4 text-[var(--color-accent)] transition-transform group-hover:rotate-12" />
            <span className="hidden sm:inline font-semibold">{theme.name}</span>
            <span 
              className="w-2.5 h-2.5 rounded-full border border-black/40 shadow-sm"
              style={{ backgroundColor: theme.accent }}
            />
            {isAutoCycling && <RotateCw className="w-2.5 h-2.5 text-[var(--color-accent)] animate-spin" />}
          </button>

          <Link
            to={user ? "/home" : "/auth"}
            className="px-4 py-1.5 rounded-xl bg-[var(--color-accent)] text-white text-xs font-mono font-bold hover:brightness-110 transition-all shadow-sm"
          >
            {user ? "Open Feed" : "Sign In"}
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 sm:py-16 flex flex-col items-center text-center my-auto">
        {/* Intelligence Signal Pill */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-xs font-mono text-[var(--color-text-secondary)] mb-8 shadow-sm"
        >
          <Radio className="w-3.5 h-3.5 text-[var(--color-energy)] animate-pulse" />
          <span className="tracking-widest uppercase text-[11px] font-semibold">SYNCHRONIZED GLOBAL WIRE</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-ping" />
        </motion.div>

        {/* Hero Title */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="mb-4"
        >
          <h1 className="text-7xl sm:text-8xl md:text-9xl font-black font-display tracking-tight mb-4 select-none">
            <span className="gradient-text drop-shadow-[0_0_35px_rgba(139,92,246,0.35)]">NEXZ</span>
          </h1>

          <div className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-[var(--color-text-primary)] mb-3">
            Knowledge is connected
          </div>

          <p className="font-mono text-xs sm:text-sm tracking-widest text-[var(--color-text-secondary)] uppercase">
            Follow the signals. Understand the world.
          </p>
        </motion.div>

        {/* Narrative / Pitch */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="max-w-2xl text-sm sm:text-base text-[var(--color-text-muted)] font-sans leading-relaxed mb-10"
        >
          An intelligence terminal aggregating verified wire dispatches, multi-perspective cognitive synthesis, and relational network graph visualizations for analysts and researchers.
        </motion.p>

        {/* CTA Group */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <button
            onClick={handleExplore}
            className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 group text-sm"
          >
            <span>{user ? 'Enter Terminal' : 'Initialize Access'}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>

          <a
            href="#features"
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-accent)] bg-[var(--color-bg-secondary)]/50 backdrop-blur-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-mono text-xs uppercase tracking-wider transition-all text-center"
          >
            System Specs
          </a>
        </motion.div>
      </div>

      {/* Feature Grid */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        id="features"
        className="relative z-10 bg-[var(--color-bg-primary)]/80 backdrop-blur-xl border-t border-[var(--color-border)] py-16"
      >
        <div className="max-w-7xl mx-auto px-6 grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="glass p-7 rounded-2xl card-glow border border-[var(--color-border)] hover:border-[var(--color-accent)]/50 transition-all">
            <div className="w-11 h-11 bg-purple-500/15 border border-purple-500/30 rounded-xl flex items-center justify-center mb-5 text-[var(--color-accent)]">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold font-display mb-2 text-[var(--color-text-primary)]">Global Synthesis</h3>
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed font-sans">
              Aggregates perspectives from verified international wire dispatches to present an unadulterated intelligence view.
            </p>
          </div>

          <div className="glass p-7 rounded-2xl card-glow border border-[var(--color-border)] hover:border-[var(--color-accent)]/50 transition-all">
            <div className="w-11 h-11 bg-sky-500/15 border border-sky-500/30 rounded-xl flex items-center justify-center mb-5 text-[var(--color-energy)]">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold font-display mb-2 text-[var(--color-text-primary)]">Corroboration Matrix</h3>
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed font-sans">
              Cross-references claims against concurrent reporting across independent nodes to detect discrepancies.
            </p>
          </div>

          <div className="glass p-7 rounded-2xl card-glow border border-[var(--color-border)] hover:border-[var(--color-accent)]/50 transition-all sm:col-span-2 md:col-span-1">
            <div className="w-11 h-11 bg-violet-500/15 border border-violet-500/30 rounded-xl flex items-center justify-center mb-5 text-[var(--color-accent)]">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold font-display mb-2 text-[var(--color-text-primary)]">Neural Explainers</h3>
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed font-sans">
              Deconstruct complex geopolitical and scientific developments into lucid, multi-perspective executive briefs.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Theme Modal */}
      <ThemeModal isOpen={themeModalOpen} onClose={() => setThemeModalOpen(false)} />
    </div>
  );
}
