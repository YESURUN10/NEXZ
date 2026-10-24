import React, { useState, useRef, useEffect } from 'react';
import { NEWSAPI_COUNTRIES } from '../../utils/constants';
import { ChevronDown, Check } from 'lucide-react';

export default function CountrySelector({ selectedCountry = 'us', onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeCountryObj = NEWSAPI_COUNTRIES.find((c) => c.code === selectedCountry) || {
    code: 'us',
    name: 'United States',
    flag: '🇺🇸',
  };

  const filteredCountries = NEWSAPI_COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(filterText.toLowerCase()) ||
    c.code.toLowerCase().includes(filterText.toLowerCase())
  );

  const handleSelect = (code) => {
    onChange(code);
    setIsOpen(false);
    setFilterText('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-[var(--color-accent)] rounded-xl py-1.5 px-3 text-xs font-mono font-medium hover:bg-[var(--color-bg-card-hover)] transition-all cursor-pointer shadow-xs"
        aria-label="Select Global Region"
        title="Change international news region"
      >
        <span className="text-base">{activeCountryObj.flag}</span>
        <span className="text-[var(--color-text-primary)] font-semibold truncate max-w-[110px]">
          {activeCountryObj.name}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-[var(--color-text-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 max-h-80 overflow-y-auto bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl shadow-2xl z-50 p-2 text-xs">
          <div className="p-1.5 mb-1.5 border-b border-[var(--color-border)]">
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter country..."
              autoFocus
              className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg py-1 px-2.5 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          <div className="space-y-0.5">
            {filteredCountries.map((c) => {
              const isSelected = c.code === selectedCountry;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleSelect(c.code)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)] font-semibold'
                      : 'hover:bg-[var(--color-bg-card-hover)] text-[var(--color-text-primary)]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-base">{c.flag}</span>
                    <span className="truncate">{c.name}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
