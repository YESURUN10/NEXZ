import React, { useState, useRef, useEffect } from 'react';
import { NEWSAPI_COUNTRIES } from '../../utils/constants';

export default function CountrySelector({ selected, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
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

  const toggleCountry = (code) => {
    if (selected.includes(code)) {
      if (selected.length > 1) {
        onChange(selected.filter(c => c !== code));
      }
    } else {
      onChange([...selected, code]);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-full py-1.5 pl-4 pr-3 text-sm font-medium hover:bg-[var(--color-bg-card-hover)] transition-colors"
      >
        <span>Select Countries</span>
        <span className="bg-[var(--color-accent)] text-white text-xs px-2 py-0.5 rounded-full">
          {selected.length}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 max-h-96 overflow-y-auto bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-xl z-10 p-2">
          {NEWSAPI_COUNTRIES.map(country => (
            <label key={country.code} className="flex items-center p-2 rounded hover:bg-[var(--color-bg-secondary)] cursor-pointer transition-colors">
              <input 
                type="checkbox" 
                checked={selected.includes(country.code)}
                onChange={() => toggleCountry(country.code)}
                className="mr-3 accent-[var(--color-accent)] w-4 h-4 cursor-pointer"
              />
              <span className="text-xl mr-2">{country.flag}</span>
              <span className="text-sm">{country.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
