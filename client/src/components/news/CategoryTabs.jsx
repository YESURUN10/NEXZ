import React from 'react';
import { 
  Compass, 
  Cpu, 
  Briefcase, 
  Atom, 
  Globe2, 
  HeartPulse, 
  Film, 
  Trophy, 
  Landmark 
} from 'lucide-react';

export const CATEGORY_DEFINITIONS = [
  { id: '', label: 'All Feeds', icon: Compass },
  { id: 'technology', label: 'Technology', icon: Cpu },
  { id: 'business', label: 'Business & Markets', icon: Briefcase },
  { id: 'science', label: 'Science & DeepTech', icon: Atom },
  { id: 'general', label: 'World Brief', icon: Globe2 },
  { id: 'health', label: 'Health & Bio', icon: HeartPulse },
  { id: 'entertainment', label: 'Culture & Media', icon: Film },
  { id: 'sports', label: 'Sports', icon: Trophy },
  { id: 'politics', label: 'Global Affairs', icon: Landmark },
];

export default function CategoryTabs({ selectedCategory = '', onSelectCategory }) {
  return (
    <div className="relative w-full my-4">
      {/* Scrollable Container with Hidden Scrollbar */}
      <div 
        role="tablist" 
        aria-label="News categories" 
        className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {CATEGORY_DEFINITIONS.map((cat) => {
          const Icon = cat.icon;
          const isSelected = (selectedCategory || '').toLowerCase() === cat.id.toLowerCase();

          return (
            <button
              key={cat.id}
              role="tab"
              aria-selected={isSelected}
              id={`tab-${cat.id || 'all'}`}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer border shrink-0 ${
                isSelected
                  ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)] border-[var(--color-accent)] shadow-lg shadow-[var(--color-accent)]/20 font-semibold scale-105'
                  : 'bg-[var(--color-bg-secondary)]/80 text-[var(--color-text-secondary)] border-[var(--color-border)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-card-hover)]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[var(--color-bg-primary)]' : 'text-[var(--color-accent)]'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
