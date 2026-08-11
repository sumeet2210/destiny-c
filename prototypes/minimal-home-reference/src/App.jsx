import { useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  BookmarkSimple,
  CalendarBlank,
  Check,
  Clock,
  Compass,
  House,
  Lightning,
  MapPin,
  MagnifyingGlass,
  SlidersHorizontal,
  UserCircle,
} from '@phosphor-icons/react';

const cravings = ['Biryani', 'Momos', 'Chai', 'Dosa', 'Ice cream'];

const restaurants = [
  {
    name: 'Biryani Adda',
    detail: 'Kakatiya · ₹180 per head',
    highlight: 'Free Chicken 65 on handi biryani',
    image: '/assets/card-smoky-biryani.png',
    tag: 'Group comfort',
    meta: 'Student discount · Built for sharing',
    craving: 'Biryani',
  },
  {
    name: 'Momo Nation',
    detail: 'Kakatiya · ₹100 per head',
    highlight: 'Buy 2, get 1 steamed plates',
    image: '/assets/card-momos-chai.png',
    tag: 'Quick bite',
    meta: 'Student discount · Quick counter',
    craving: 'Momos',
  },
  {
    name: 'Chai Theory',
    detail: 'Vidyaranyapuri · ₹70 per head',
    highlight: 'Midnight maggi + chai combo ₹79',
    image: '/assets/card-chai-theory.png',
    tag: 'Study spot',
    meta: 'Open late · Pure veg',
    craving: 'Chai',
  },
  {
    name: 'Southern Spice Tiffins',
    detail: 'Vidyaranyapuri · ₹90 per head',
    highlight: 'Filter coffee free with any dosa',
    image: '/assets/card-southern-spice.png',
    tag: 'Quick comfort',
    meta: 'Pure veg · Student discount',
    craving: 'Dosa',
  },
  {
    name: 'Scoops & Stories',
    detail: 'Hunter Road · ₹150 per head',
    highlight: 'Brownie sizzler and campus sundaes',
    image: '/assets/card-scoops-stories.png',
    tag: 'Chill stop',
    meta: 'Pure veg · Board games',
    craving: 'Ice cream',
  },
];

const quizMatches = {
  Quick: 'Momos',
  Chill: 'Chai',
  Group: 'Biryani',
};

export function App() {
  const [activeCraving, setActiveCraving] = useState('Biryani');
  const [query, setQuery] = useState('');
  const [searchMessage, setSearchMessage] = useState('');
  const [saved, setSaved] = useState(false);
  const [savedRestaurants, setSavedRestaurants] = useState([]);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizChoice, setQuizChoice] = useState('Chill');
  const [activeSection, setActiveSection] = useState('home');

  const visibleRestaurants = restaurants.filter(
    (restaurant) => restaurant.craving === activeCraving,
  );

  const scrollToSection = (selector, section) => {
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    document.querySelector(selector)?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
    setActiveSection(section);
  };

  const jumpToSpots = () => {
    scrollToSection('#spots', 'discover');
  };

  const submitSearch = (event) => {
    event.preventDefault();
    const cleanQuery = query.trim();
    setSearchMessage(
      cleanQuery
        ? `Showing the closest matches for “${cleanQuery}”.`
        : `Showing places for ${activeCraving.toLowerCase()}.`,
    );
    jumpToSpots();
  };

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Destiny home">
          <img
            src="/brand/destiny-wordmark.png"
            alt=""
            width="1254"
            height="1254"
          />
        </a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <a href="#spots">Discover</a>
          <a href="#offers">Live offers</a>
          <a href="#events">Events</a>
        </nav>
        <div className="header-actions">
          <button
            className="header-search"
            type="button"
            onClick={() => document.querySelector('#search')?.focus()}
          >
            <MagnifyingGlass size={18} weight="bold" aria-hidden="true" />
            <span>Search</span>
          </button>
          <button
            className="icon-button light"
            type="button"
            aria-label="Open account"
          >
            <UserCircle size={24} weight="fill" aria-hidden="true" />
          </button>
        </div>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <h1 id="hero-title">
              Dinner,
              <br />
              minus the
              <br />
              group chat.
            </h1>
            <p className="hero-summary">
              Fresh offers, real menus, and the campus spots worth leaving the
              hostel for.
            </p>

            <form className="search-form" onSubmit={submitSearch}>
              <label className="sr-only" htmlFor="search">
                Search restaurants or dishes
              </label>
              <MagnifyingGlass size={22} weight="bold" aria-hidden="true" />
              <input
                id="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search a dish or place"
                autoComplete="off"
              />
              <button type="submit" aria-label="Search">
                <ArrowRight size={22} weight="bold" aria-hidden="true" />
              </button>
            </form>

            <div className="craving-picker" aria-label="Choose a craving">
              {cravings.map((craving) => (
                <button
                  key={craving}
                  type="button"
                  className={activeCraving === craving ? 'active' : ''}
                  aria-pressed={activeCraving === craving}
                  onClick={() => {
                    setActiveCraving(craving);
                    setSearchMessage(
                      `A short list for ${craving.toLowerCase()}.`,
                    );
                  }}
                >
                  {craving}
                </button>
              ))}
            </div>

            <div className="hero-utility">
              <button
                className="primary-action"
                type="button"
                onClick={jumpToSpots}
              >
                Find dinner
                <ArrowDown size={18} weight="bold" aria-hidden="true" />
              </button>
              <button
                className="text-action"
                type="button"
                onClick={() => setQuizOpen((value) => !value)}
              >
                <SlidersHorizontal size={18} weight="bold" aria-hidden="true" />
                Quick match
              </button>
            </div>

            {quizOpen && (
              <div className="quiz-panel" aria-live="polite">
                <p>What kind of evening is this?</p>
                <div>
                  {['Quick', 'Chill', 'Group'].map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      aria-pressed={quizChoice === choice}
                      className={quizChoice === choice ? 'selected' : ''}
                      onClick={() => {
                        const match = quizMatches[choice];
                        setQuizChoice(choice);
                        setActiveCraving(match);
                        setSearchMessage(
                          `${choice} plan selected — showing ${match.toLowerCase()} first.`,
                        );
                      }}
                    >
                      {quizChoice === choice && (
                        <Check size={14} weight="bold" aria-hidden="true" />
                      )}
                      {choice}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="hero-media">
            <img
              src="/assets/hero-campus-feast.png"
              alt="Biryani, momos and chai shared across a dark table"
              fetchPriority="high"
            />
            <div className="hero-topline">
              <span>
                <MapPin size={16} weight="fill" aria-hidden="true" /> Around NIT
                Warangal
              </span>
              <button
                type="button"
                aria-label="Save this dinner idea"
                aria-pressed={saved}
                onClick={() => setSaved((value) => !value)}
              >
                <BookmarkSimple
                  size={21}
                  weight={saved ? 'fill' : 'bold'}
                  aria-hidden="true"
                />
              </button>
            </div>
            <div className="hero-card">
              <div>
                <p>Tonight’s fast pick</p>
                <h2>{activeCraving} around campus</h2>
                <span>Owner-updated offers · menus included</span>
              </div>
              <button
                type="button"
                onClick={jumpToSpots}
                aria-label={`Browse ${activeCraving} places`}
              >
                <ArrowRight size={24} weight="bold" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>

        <section className="discovery" id="spots" aria-labelledby="spots-title">
          <div className="section-heading">
            <h2 id="spots-title">A short list, not an endless feed.</h2>
            <p>
              One production-shaped match from Destiny’s sample catalog, based
              on what you picked.
            </p>
          </div>

          <div className="status-line" aria-live="polite">
            <span>
              {searchMessage ||
                `Showing the strongest ${activeCraving.toLowerCase()} match.`}
            </span>
            <button
              type="button"
              onClick={() => {
                setQuizOpen(true);
                scrollToSection('#top', 'home');
              }}
            >
              <SlidersHorizontal size={17} weight="bold" aria-hidden="true" />{' '}
              Refine
            </button>
          </div>

          <div className="discovery-grid">
            {visibleRestaurants.map((restaurant) => {
              const isSaved = savedRestaurants.includes(restaurant.name);
              return (
                <article className="restaurant-card" key={restaurant.name}>
                  <img
                    src={restaurant.image}
                    alt={`${restaurant.name} featured food`}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="card-topline">
                    <span>{restaurant.tag}</span>
                    <button
                      type="button"
                      aria-label={`Save ${restaurant.name}`}
                      aria-pressed={isSaved}
                      onClick={() =>
                        setSavedRestaurants((current) =>
                          current.includes(restaurant.name)
                            ? current.filter((name) => name !== restaurant.name)
                            : [...current, restaurant.name],
                        )
                      }
                    >
                      <BookmarkSimple
                        size={20}
                        weight={isSaved ? 'fill' : 'bold'}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                  <div className="card-copy">
                    <span>{restaurant.meta}</span>
                    <h3>{restaurant.name}</h3>
                    <p>{restaurant.highlight}</p>
                    <strong>{restaurant.detail}</strong>
                  </div>
                  <button
                    className="card-open"
                    type="button"
                    aria-label={`Open ${restaurant.name}`}
                    onClick={() =>
                      setSearchMessage(
                        `${restaurant.name} selected — profile view is outside this one-page prototype.`,
                      )
                    }
                  >
                    <ArrowRight size={22} weight="bold" aria-hidden="true" />
                  </button>
                </article>
              );
            })}

            <aside
              className="live-panel"
              id="offers"
              aria-labelledby="live-title"
            >
              <div className="live-panel-head">
                <h3 id="live-title">Fresh from the kitchens</h3>
                <Clock size={23} weight="bold" aria-hidden="true" />
              </div>
              <p>A preview of time-bound updates owners can publish.</p>
              <div className="offer-list">
                <button
                  type="button"
                  onClick={() =>
                    setSearchMessage(
                      'Chai Theory’s current sample offer selected.',
                    )
                  }
                >
                  <span>Chai Theory</span>
                  <strong>Midnight maggi + chai combo ₹79</strong>
                  <ArrowRight size={17} weight="bold" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSearchMessage(
                      'Southern Spice Tiffins’ current sample offer selected.',
                    )
                  }
                >
                  <span>Southern Spice Tiffins</span>
                  <strong>Filter coffee free with any dosa</strong>
                  <ArrowRight size={17} weight="bold" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSearchMessage(
                      'Hunter Road Grill’s current sample offer selected.',
                    )
                  }
                >
                  <span>Hunter Road Grill</span>
                  <strong>Shawarma happy hour 5–7pm</strong>
                  <ArrowRight size={17} weight="bold" aria-hidden="true" />
                </button>
              </div>
            </aside>
          </div>
        </section>

        <section
          className="event-strip"
          id="events"
          aria-labelledby="events-title"
        >
          <div className="event-icon">
            <CalendarBlank size={29} weight="bold" aria-hidden="true" />
          </div>
          <div>
            <h2 id="events-title">The night can be the plan.</h2>
            <p>
              Open mics, screenings, and campus-adjacent events live beside the
              menu—not in another app.
            </p>
          </div>
          <button type="button">
            Explore events
            <ArrowRight size={19} weight="bold" aria-hidden="true" />
          </button>
        </section>
      </main>

      <footer>
        <a className="wordmark" href="#top" aria-label="Destiny home">
          <img
            src="/brand/destiny-wordmark.png"
            alt=""
            width="1254"
            height="1254"
          />
        </a>
        <p>Decide where to eat around campus.</p>
        <a href="#top">
          Back to top <ArrowRight size={16} weight="bold" aria-hidden="true" />
        </a>
      </footer>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <a
          className={activeSection === 'home' ? 'active' : ''}
          href="#top"
          aria-current={activeSection === 'home' ? 'location' : undefined}
          onClick={() => setActiveSection('home')}
        >
          <House size={21} weight="fill" aria-hidden="true" />
          <span>Home</span>
        </a>
        <a
          className={activeSection === 'discover' ? 'active' : ''}
          href="#spots"
          aria-current={activeSection === 'discover' ? 'location' : undefined}
          onClick={() => setActiveSection('discover')}
        >
          <Compass size={21} weight="bold" aria-hidden="true" />
          <span>Discover</span>
        </a>
        <a
          className={activeSection === 'offers' ? 'active' : ''}
          href="#offers"
          aria-current={activeSection === 'offers' ? 'location' : undefined}
          onClick={() => setActiveSection('offers')}
        >
          <Lightning size={21} weight="bold" aria-hidden="true" />
          <span>Offers</span>
        </a>
        <a
          className={activeSection === 'events' ? 'active' : ''}
          href="#events"
          aria-current={activeSection === 'events' ? 'location' : undefined}
          onClick={() => setActiveSection('events')}
        >
          <CalendarBlank size={21} weight="bold" aria-hidden="true" />
          <span>Events</span>
        </a>
      </nav>
    </div>
  );
}
