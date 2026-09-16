/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

let toastTimeout;
let setToastState;

export const showToast = (message, type = 'success') => {
  if (setToastState) {
    setToastState({ message, type, visible: true });
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      setToastState(prev => ({ ...prev, visible: false }));
    }, 3000);
  }
};

export default function Toast() {
  const [toast, setToast] = useState({ message: '', type: 'success', visible: false });

  useEffect(() => {
    setToastState = setToast;
    return () => { setToastState = null; };
  }, []);

  if (!toast.visible) return null;

  const bgColors = {
    success: 'bg-[var(--color-success)] text-[#0e0b16]',
    error: 'bg-[var(--color-error)] text-white',
    warning: 'bg-[var(--color-warning)] text-[#0e0b16]'
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />
  };

  return (
    <div className={`fixed top-20 right-6 z-[var(--z-index-toast)] px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 font-medium font-mono text-sm transition-all animate-[slideInRight_0.3s_ease-out] ${bgColors[toast.type]}`}>
      {icons[toast.type]}
      {toast.message}
    </div>
  );
}
