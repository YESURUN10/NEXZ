import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function QuotaWarning() {
  const [warning, setWarning] = useState(null); // 'warning' | 'exhausted' | null

  useEffect(() => {
    const onWarning = () => setWarning('warning');
    const onExhausted = () => setWarning('exhausted');

    window.addEventListener('quota-warning', onWarning);
    window.addEventListener('quota-exhausted', onExhausted);

    return () => {
      window.removeEventListener('quota-warning', onWarning);
      window.removeEventListener('quota-exhausted', onExhausted);
    };
  }, []);

  if (!warning) return null;

  const isExhausted = warning === 'exhausted';

  return (
    <div className={`w-full py-2 px-4 flex items-center justify-between text-sm font-medium z-40 ${isExhausted ? 'bg-[var(--color-error)] text-white' : 'bg-[var(--color-warning)] text-[#0e0b16]'}`}>
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        <span>
          {isExhausted 
            ? "Daily API limit reached. Showing cached results where possible." 
            : "Approaching daily API limit. Some features may become unavailable soon."}
        </span>
      </div>
      <button onClick={() => setWarning(null)} className="opacity-70 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
