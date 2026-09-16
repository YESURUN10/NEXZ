import React from 'react';
import { INDIAN_STATES } from '../../utils/constants';

export default function StateSelector({ value, onChange }) {
  return (
    <div className="relative">
      <select 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-full py-1.5 pl-4 pr-8 text-sm font-medium focus:outline-none focus:border-[var(--color-accent)] cursor-pointer hover:bg-[var(--color-bg-card-hover)] transition-colors"
      >
        <option value="">National News</option>
        {INDIAN_STATES.filter(s => s !== 'National').map(state => (
          <option key={state} value={state}>{state}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[var(--color-text-muted)]">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
      </div>
    </div>
  );
}
