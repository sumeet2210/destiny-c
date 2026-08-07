'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

/**
 * Bottom sheet / modal. The one surface allowed a shadow, and it gets a scrim
 * rather than a fourth surface colour (design.md §1, §3).
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        // Click on the backdrop closes.
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        'rounded-card border-border-hairline bg-surface-raised text-paper m-auto w-full max-w-md border p-0 shadow-2xl backdrop:bg-black/60',
        'max-sm:mb-0 max-sm:max-w-full max-sm:rounded-b-none',
        className,
      )}
    >
      <div className="p-5">
        {title && (
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="font-display text-lg font-bold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-control text-text-muted hover:bg-surface-muted px-2 py-1"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </dialog>
  );
}
