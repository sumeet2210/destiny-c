import styles from './home.module.css';

export function HeroRotatingCta() {
  return (
    <button
      type="button"
      disabled
      className={styles.primaryAction}
      aria-label="Something’s cooking"
    >
      <span className={styles.comingSoonCopy}>Something&apos;s cooking</span>
    </button>
  );
}
