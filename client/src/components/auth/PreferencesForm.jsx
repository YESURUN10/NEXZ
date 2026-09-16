import React, { useState } from 'react';
import { CATEGORIES } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

export default function PreferencesForm() {
  const [selected, setSelected] = useState([]);
  const { savePreferences } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const toggleCategory = (cat) => {
    if (selected.includes(cat)) {
      setSelected(selected.filter(c => c !== cat));
    } else {
      setSelected([...selected, cat]);
    }
  };

  const handleSubmit = async () => {
    if (selected.length === 0) return;
    setIsSaving(true);
    try {
      await savePreferences(selected);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-2xl p-8 max-w-md w-full shadow-2xl border border-[var(--color-border)]"
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Personalize Your Feed</h2>
          <p className="text-[var(--color-text-muted)] text-sm">Select topics you're interested in.</p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${
                selected.includes(cat) 
                  ? 'bg-[var(--color-accent)] text-white shadow-lg shadow-[var(--color-accent)]/30 scale-105'
                  : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-accent-dim)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={selected.length === 0 || isSaving}
          className="w-full btn-primary py-3 flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            'Complete Setup'
          )}
        </button>
      </motion.div>
    </div>
  );
}
