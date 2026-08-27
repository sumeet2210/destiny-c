'use client';

import { useId, useState } from 'react';
import { cn } from '@/lib/cn';
import styles from './others.module.css';

export function ToolboxDisclosure({ kind }: { kind: 'about' | 'contact' }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const isAbout = kind === 'about';

  return (
    <div className={cn(styles.dropdownCard, open && styles.dropdownCardOpen)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className={cn(styles.menuCard, styles.dropdownTrigger)}
      >
        <span className={styles.iconWrap}>
          <DisclosureIcon kind={kind} />
        </span>
        <span className={styles.cardCopy}>
          <strong>{isAbout ? 'About' : 'Contact Us'}</strong>
        </span>
        <DisclosureArrow />
      </button>

      <div
        className={styles.dropdownViewport}
        aria-hidden={!open}
        inert={open ? undefined : true}
      >
        <div className={styles.dropdownViewportInner}>
          <section id={panelId} className={styles.dropdownPanel}>
            <span className={styles.dropdownAccent} aria-hidden />
            {isAbout ? (
              <>
                <small className={styles.panelKicker}>Built for NITW</small>
                <p>
                  <strong>Destiny</strong> brings restaurants, live offers, and
                  events into one quick answer for the whole squad.
                </p>
              </>
            ) : (
              <>
                <small className={styles.panelKicker}>Official inbox</small>
                <a
                  className={styles.contactLink}
                  href="mailto:thedestinyconnects@gmail.com"
                >
                  <MailIcon />
                  <span>
                    <strong>thedestinyconnects@gmail.com</strong>
                    <small>Tap to write to us</small>
                  </span>
                </a>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function DisclosureIcon({ kind }: { kind: 'about' | 'contact' }) {
  return kind === 'about' ? (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10.5V17M12 7h.01" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M4 5.5h16v11H9l-5 4v-15Z" />
      <path d="M8 10h8M8 13h5" />
    </svg>
  );
}

function DisclosureArrow() {
  return (
    <svg className={styles.arrow} viewBox="0 0 24 24" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m5 8 7 5 7-5" />
    </svg>
  );
}
