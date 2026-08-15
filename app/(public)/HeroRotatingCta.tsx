'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './home.module.css';

const CTA_COPY = [
  'Find My Perfect Spot',
  'Pet puja plan karein?',
  'Yenti scene ra?',
  'Broke but hungry?',
] as const;

const ROTATION_MS = 3200;

export function HeroRotatingCta() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % CTA_COPY.length),
      ROTATION_MS,
    );
    return () => window.clearInterval(timer);
  }, []);

  return (
    <Link
      href="/quiz"
      className={styles.primaryAction}
      aria-label="Find my perfect restaurant spot"
    >
      <span key={index} className={styles.rotatingCtaCopy} aria-hidden="true">
        {CTA_COPY[index]}
      </span>
    </Link>
  );
}
