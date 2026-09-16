import React, { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, ArrowRight, Zap, Shield, Sparkles } from 'lucide-react';

const HeroGlobe = lazy(() => import('../components/layout/HeroGlobe'));

export default function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col justify-center">
      <Suspense fallback={null}>
        <HeroGlobe />
      </Suspense>
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mb-8"
        >
          <h1 className="text-7xl md:text-9xl font-black font-serif tracking-tighter mb-4">
            <span className="gradient-text drop-shadow-2xl">NEXZ</span>
          </h1>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="flex items-center justify-center gap-2 text-xl md:text-2xl font-medium text-[var(--color-text-secondary)]"
          >
            <Sparkles className="w-6 h-6 text-[var(--color-accent)]" />
            <span className="font-mono text-sm tracking-widest uppercase">The Future of News Intelligence</span>
            <Sparkles className="w-6 h-6 text-[var(--color-accent)]" />
          </motion.div>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="max-w-2xl text-lg md:text-xl font-serif text-[var(--color-text-muted)] mb-12 leading-relaxed"
        >
          Break free from echo chambers. Nexz uses advanced AI to synthesize, cross-reference, and explain global events in real-time, delivering pure intelligence without the noise.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link to="/auth" aria-label="Get started with Nexz" className="btn-primary flex items-center justify-center gap-2 text-lg py-4 px-8 group">
            Get Started <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a href="#features" aria-label="Learn how Nexz works" className="glass flex items-center justify-center gap-2 text-lg py-4 px-8 rounded-xl font-semibold hover:bg-[var(--color-bg-card-hover)] transition-colors">
            See How It Works
          </a>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        id="features"
        className="relative z-10 bg-black/40 backdrop-blur-xl border-t border-[var(--color-border)] py-20 mt-20"
      >
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          <div className="glass p-8 rounded-2xl card-glow border border-[var(--color-border)]">
            <div className="w-12 h-12 bg-[var(--color-accent)]/20 rounded-xl flex items-center justify-center mb-6">
              <Globe className="w-6 h-6 text-[var(--color-accent)]" />
            </div>
            <h3 className="text-xl font-bold mb-3">Global Synthesis</h3>
            <p className="text-[var(--color-text-muted)] leading-relaxed">Aggregates perspectives from thousands of sources worldwide to give you a complete, unbiased picture.</p>
          </div>
          <div className="glass p-8 rounded-2xl card-glow border border-[var(--color-border)]">
            <div className="w-12 h-12 bg-[var(--color-success)]/20 rounded-xl flex items-center justify-center mb-6">
              <Shield className="w-6 h-6 text-[var(--color-success)]" />
            </div>
            <h3 className="text-xl font-bold mb-3">Credibility Scoring</h3>
            <p className="text-[var(--color-text-muted)] leading-relaxed">Automatically cross-references claims against established sources to combat misinformation.</p>
          </div>
          <div className="glass p-8 rounded-2xl card-glow border border-[var(--color-border)]">
            <div className="w-12 h-12 bg-[var(--color-warning)]/20 rounded-xl flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-[var(--color-warning)]" />
            </div>
            <h3 className="text-xl font-bold mb-3">Instant Explainers</h3>
            <p className="text-[var(--color-text-muted)] leading-relaxed">Ask questions or simplify complex geopolitical events down to an ELI5 level instantly with LLaMA 3.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
