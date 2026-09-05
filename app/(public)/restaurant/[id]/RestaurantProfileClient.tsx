'use client';

import { useEffect, useId, useState } from 'react';
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

export function ProfileGalleryButton({
  photos,
  restaurantName,
  labels,
}: {
  photos: string[];
  restaurantName: string;
  labels: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dialogId = useId();
  const titleId = `${dialogId}-title`;

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!photos.length) return null;

  return (
    <>
      <button
        type="button"
        className={styles.coverActionButton}
        aria-expanded={isOpen}
        aria-controls={dialogId}
        aria-label="Open gallery"
        onClick={() => setIsOpen(true)}
      >
        <GalleryIcon />
      </button>
      {isOpen ? (
        <div
          id={dialogId}
          className={styles.galleryOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <div className={styles.galleryOverlaySheet}>
            <div className={styles.galleryOverlayHeader}>
              <button
                type="button"
                className={styles.galleryBackButton}
                onClick={() => setIsOpen(false)}
              >
                <BackIcon />
                <span>Back</span>
              </button>
              <div className={styles.galleryHeading}>
                <p>Gallery</p>
                <h2 id={titleId}>{restaurantName}</h2>
              </div>
              <span className={styles.galleryCount}>
                {photos.length} photos
              </span>
            </div>
            <div className={styles.galleryOverlayGrid}>
              {photos.map((photo, index) => (
                <figure
                  key={`${photo}-${index}`}
                  className={styles.galleryTile}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- restaurant storage images are resized on upload. */}
                  <img src={photo} alt="" loading="lazy" />
                  <figcaption>
                    {labels[index] ?? `Photo ${index + 1}`}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

type WeeklyHoursRow = {
  day: string;
  hours: string;
  isToday: boolean;
};

export function ProfileHoursButton({
  restaurantName,
  todayHours,
  weeklyHours,
}: {
  restaurantName: string;
  todayHours: string;
  weeklyHours: WeeklyHoursRow[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dialogId = useId();
  const titleId = `${dialogId}-title`;

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        className={styles.openingTime}
        aria-expanded={isOpen}
        aria-controls={dialogId}
        aria-label={`View opening hours. Today: ${todayHours}`}
        onClick={() => setIsOpen(true)}
      >
        <HoursClockIcon />
        <span>Today</span>
        <strong>{todayHours}</strong>
        <ChevronDownIcon />
      </button>

      {isOpen ? (
        <div
          id={dialogId}
          className={styles.hoursOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <div className={styles.hoursDialog}>
            <div className={styles.hoursHeader}>
              <div>
                <p>Opening hours</p>
                <h2 id={titleId}>{restaurantName}</h2>
              </div>
              <button
                type="button"
                aria-label="Close opening hours"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </div>
            <ul className={styles.hoursList}>
              {weeklyHours.map((row) => (
                <li
                  key={row.day}
                  data-today={row.isToday || undefined}
                  data-closed={row.hours === 'Closed' || undefined}
                >
                  <span>{row.day}</span>
                  <strong>{row.hours}</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}

type MenuItem = {
  id: string;
  name: string;
  price: number;
  is_veg: boolean;
  is_available: boolean;
  section_name: string;
};

export function ProfileMenuButton({
  items,
  menuPhotos,
  restaurantName,
}: {
  items: MenuItem[];
  menuPhotos: string[];
  restaurantName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dialogId = useId();
  const titleId = `${dialogId}-title`;

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        className={styles.menuButton}
        aria-expanded={isOpen}
        aria-controls={dialogId}
        onClick={() => setIsOpen(true)}
      >
        <MenuIcon />
        <span>Menu</span>
      </button>
      {isOpen ? (
        <div
          id={dialogId}
          className={styles.menuOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <div className={styles.menuOverlaySheet}>
            <div className={styles.menuOverlayHeader}>
              <div>
                <p>Explore the menu</p>
                <h2 id={titleId}>{restaurantName}</h2>
              </div>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </div>
            <ProfileMenu items={items} menuPhotos={menuPhotos} />
          </div>
        </div>
      ) : null}
    </>
  );
}

export function ProfileMenu({
  items,
  menuPhotos,
}: {
  items: MenuItem[];
  menuPhotos: string[];
}) {
  const [query, setQuery] = useState('');
  const [showPhotos, setShowPhotos] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();

  if (items.length === 0) {
    return (
      <div className={styles.menuEmptyState}>
        <p>Menu not published yet — check back soon.</p>
      </div>
    );
  }

  const filteredItems = normalizedQuery
    ? items.filter((item) => item.name.toLowerCase().includes(normalizedQuery))
    : items;
  const previewItems = showAllItems ? filteredItems : filteredItems.slice(0, 2);
  const groupedPreview = previewItems.reduce<Record<string, MenuItem[]>>(
    (groups, item) => {
      (groups[item.section_name] ??= []).push(item);
      return groups;
    },
    {},
  );
  const photoSources = menuPhotos.length ? menuPhotos : MENU_PLACEHOLDER_IMAGES;

  return (
    <div className={styles.menuPanel}>
      <div className={styles.menuHeader}>
        <div className={styles.menuHeadingCopy}>
          <h2>Menu</h2>
        </div>
        <div className={styles.menuToolbar}>
          <label className={styles.menuSearch}>
            <SearchIcon />
            <input
              type="search"
              value={query}
              placeholder="Search dish"
              aria-label="Search dish"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <button
            type="button"
            className={styles.menuToggle}
            aria-pressed={showPhotos}
            onClick={() => setShowPhotos((current) => !current)}
          >
            {showPhotos ? 'Hide Menu' : 'View Menu'}
          </button>
        </div>
      </div>
      {showPhotos ? (
        <div className={styles.menuPhotoShell}>
          <div className={styles.menuPhotoGrid}>
            {filteredItems.length ? (
              filteredItems.map((item, index) => (
                <DishPhotoCard
                  key={item.id}
                  name={item.name}
                  imageSrc={photoSources[index % photoSources.length]}
                  altIndex={index}
                  isVeg={item.is_veg}
                  available={item.is_available}
                />
              ))
            ) : (
              <p className={styles.menuEmptyState}>
                No dishes match “{query.trim()}”.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.menuListWrap}>
          <div className={styles.menuSectionList}>
            {previewItems.length ? (
              Object.entries(groupedPreview).map(([section, sectionItems]) => (
                <section key={section}>
                  <h3 className={styles.menuSectionTitle}>{section}</h3>
                  <div className={styles.menuGrid}>
                    {sectionItems.map((item) => (
                      <article
                        key={item.id}
                        className={styles.menuCard}
                        data-unavailable={!item.is_available || undefined}
                      >
                        <div className={styles.menuDishName}>
                          <VegMark isVeg={item.is_veg} />
                          <div>
                            <strong>{item.name}</strong>
                            {!item.is_available ? (
                              <small>Not available</small>
                            ) : null}
                          </div>
                        </div>
                        <span className={styles.menuPrice}>₹{item.price}</span>
                      </article>
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <p className={styles.menuEmptyState}>
                No dishes match “{query.trim()}”.
              </p>
            )}
          </div>
          {filteredItems.length > 2 ? (
            <button
              type="button"
              className={styles.menuMoreButton}
              aria-expanded={showAllItems}
              onClick={() => setShowAllItems((current) => !current)}
            >
              {showAllItems ? 'Show Less' : 'View More'}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

function DishPhotoCard({
  name,
  imageSrc,
  altIndex,
  isVeg,
  available,
}: {
  name: string;
  imageSrc: string;
  altIndex: number;
  isVeg: boolean;
  available: boolean;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <article
      className={styles.menuPhotoCard}
      data-unavailable={!available || undefined}
    >
      <div className={styles.menuPhotoMedia} data-failed={failed || undefined}>
        {failed ? (
          <div className={styles.menuPhotoFallback}>
            <span>{name.slice(0, 1)}</span>
            <small>Photo unavailable</small>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- restaurant menu images are uploaded or remote placeholders.
          <img
            src={imageSrc}
            alt={name}
            loading="lazy"
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <div className={styles.menuPhotoTitle}>
        <VegMark isVeg={isVeg} />
        <strong>{name}</strong>
      </div>
      <small className={!available ? styles.menuUnavailable : undefined}>
        {available ? `Photo #${altIndex + 1}` : 'Not available'}
      </small>
    </article>
  );
}

const MENU_PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1432139509613-5c4255815697?auto=format&fit=crop&w=1200&q=80',
];

function GalleryIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="4" y="5" width="16" height="14" rx="2.5" />
      <path d="M8 13l2.5-2.5L15 15" />
      <circle cx="10" cy="9" r="1.4" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M5 6h14M5 12h14M5 18h9" />
    </svg>
  );
}

function HoursClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="m7 9.5 5 5 5-5" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="m10 6-6 6 6 6" />
      <path d="M5 12h14" />
    </svg>
  );
}
