'use client';

import { useEffect, useId, useRef, useState } from 'react';
import styles from './home.module.css';

export function HeroRotatingCta() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const actionRef = useRef<HTMLButtonElement>(null);
  const dialogId = useId();
  const titleId = `${dialogId}-title`;
  const descriptionId = `${dialogId}-description`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    if (!dialog.open) dialog.showModal();
    const focusFrame = window.requestAnimationFrame(() =>
      actionRef.current?.focus(),
    );

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
      if (dialog.open) dialog.close();
    };
  }, [open]);

  const closeDialog = () => {
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    else setOpen(false);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={styles.primaryAction}
        aria-label="Something’s Cooking"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        onClick={() => setOpen(true)}
      >
        <span className={styles.comingSoonCopy}>Something’s Cooking</span>
      </button>

      <dialog
        ref={dialogRef}
        id={dialogId}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-modal="true"
        className={styles.comingSoonDialog}
        onClick={(event) => {
          if (event.target === dialogRef.current) closeDialog();
        }}
        onClose={() => {
          setOpen(false);
          window.requestAnimationFrame(() => triggerRef.current?.focus());
        }}
      >
        <div className={styles.comingSoonDialogContent}>
          <h2 id={titleId} className={styles.comingSoonDialogTitle}>
            Something exciting is coming
          </h2>
          <p id={descriptionId} className={styles.comingSoonDialogDescription}>
            We&apos;re cooking up a smarter way to help you find your perfect
            spot.
          </p>
          <button
            ref={actionRef}
            type="button"
            className={styles.comingSoonDialogAction}
            onClick={closeDialog}
          >
            Got it
          </button>
        </div>
      </dialog>
    </>
  );
}
