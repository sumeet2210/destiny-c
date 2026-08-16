'use client';

import { useEffect, useState } from 'react';
import { VegMark } from '@/components/ui/VegMark';
import styles from './restaurant.module.css';

export function ProfileCoverCarousel({
  photos,
  restaurantName,
}: {
  photos: string[];
  restaurantName: string;
}) {
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const slides = photos.length > 1 ? [...photos, photos[0]] : photos;

  useEffect(() => {
    if (
      photos.length < 2 ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;
    const timer = window.setInterval(
      () => setIndex((current) => current + 1),
      4200,
    );
    return () => window.clearInterval(timer);
  }, [photos.length]);

  if (!photos.length) {
    return <div className={styles.coverFallback}>No photo yet</div>;
  }

  return (
    <div
      className={styles.coverCarousel}
      role="region"
      aria-label={`${restaurantName} photos`}
    >
      <div
        className={styles.coverTrack}
        data-animate={animate || undefined}
        style={{ transform: `translateX(-${index * 100}%)` }}
        onTransitionEnd={() => {
          if (index !== photos.length) return;
          setAnimate(false);
          setIndex(0);
          window.requestAnimationFrame(() =>
            window.requestAnimationFrame(() => setAnimate(true)),
          );
        }}
      >
        {slides.map((photo, photoIndex) => (
          // eslint-disable-next-line @next/next/no-img-element -- restaurant storage images are resized on upload.
          <img
            key={`${photo}-${photoIndex}`}
            src={photo}
            alt={photoIndex === 0 ? restaurantName : ''}
            loading={photoIndex === 0 ? 'eager' : 'lazy'}
            className={styles.coverImage}
          />
        ))}
      </div>
      {photos.length > 1 ? (
        <div className={styles.coverDots} aria-label="Choose cover photo">
          {photos.map((_, photoIndex) => (
            <button
              key={photoIndex}
              type="button"
              aria-label={`Show photo ${photoIndex + 1}`}
              aria-current={
                index % photos.length === photoIndex ? 'true' : undefined
              }
              onClick={() => {
                setAnimate(true);
                setIndex(photoIndex);
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

type MenuItem = {
  id: string;
  name: string;
  price: number;
  isVeg: boolean;
  available: boolean;
};

export function ProfileMenu({
  items,
  photos,
  restaurantName,
}: {
  items: MenuItem[];
  photos: string[];
  restaurantName: string;
}) {
  const [view, setView] = useState<'items' | 'photos'>(
    items.length > 0 ? 'items' : 'photos',
  );

  if (items.length === 0 && photos.length === 0) {
    return (
      <div className={styles.emptyState}>
        <MenuIcon />
        <strong>The menu is being plated.</strong>
        <p>No menu has been published yet. Check back soon.</p>
      </div>
    );
  }

  return (
    <div>
      {items.length > 0 && photos.length > 0 ? (
        <div
          className={styles.menuToggle}
          aria-label="Menu display"
          role="group"
        >
          <button
            type="button"
            aria-pressed={view === 'items'}
            onClick={() => setView('items')}
          >
            Text Menu
          </button>
          <button
            type="button"
            aria-pressed={view === 'photos'}
            onClick={() => setView('photos')}
          >
            Photo Menu
          </button>
        </div>
      ) : null}
      {view === 'items' && items.length > 0 ? (
        <div className={styles.menuGrid}>
          {items.map((item) => (
            <article
              key={item.id}
              className={styles.menuItem}
              data-unavailable={!item.available || undefined}
            >
              <div>
                <VegMark isVeg={item.isVeg} />
                <h3>{item.name}</h3>
              </div>
              <strong>₹{item.price}</strong>
              {!item.available ? <small>Not available today</small> : null}
            </article>
          ))}
        </div>
      ) : null}
      {view === 'photos' && photos.length > 0 ? (
        <div className={styles.menuPhotoGrid}>
          {photos.map((photo, index) => (
            // eslint-disable-next-line @next/next/no-img-element -- storage images are resized on upload.
            <img
              key={`${photo}-${index}`}
              src={photo}
              alt={`${restaurantName} menu, page ${index + 1}`}
              loading="lazy"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 48 48">
      <path d="M10 8h28v32H10zM16 17h16M16 24h16M16 31h10" />
    </svg>
  );
}
