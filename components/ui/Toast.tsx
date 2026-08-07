'use client';

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/cn';

type Toast = {
  id: number;
  message: string;
  tone: 'default' | 'positive' | 'error';
};

const ToastContext = createContext<
  (message: string, tone?: Toast['tone']) => void
>(() => {});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const push = useCallback(
    (message: string, tone: Toast['tone'] = 'default') => {
      const id = ++nextId.current;
      setToasts((t) => [...t, { id, message, tone }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
    },
    [],
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'rounded-card border-border-hairline bg-surface-raised text-paper pointer-events-auto max-w-sm border px-4 py-2.5 text-sm shadow-2xl',
              t.tone === 'positive' && 'border-accent-secondary',
              t.tone === 'error' && 'border-accent-urgent',
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
