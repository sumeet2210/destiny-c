'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MATCH_QUESTIONS, type MatchAnswers } from '@/config/quiz';
import { rankRestaurantMatches } from '@/lib/domain/restaurant-match';
import type { RestaurantSummary } from '@/lib/queries/catalog';
import styles from './quiz.module.css';

type MatchFinderProps = {
  restaurants: RestaurantSummary[];
};

export function MatchFinder({ restaurants }: MatchFinderProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<MatchAnswers>>({});
  const [showResults, setShowResults] = useState(false);
  const question = MATCH_QUESTIONS[step];

  const choose = (value: string) => {
    const nextAnswers = {
      ...answers,
      [question.id]: value,
    } as Partial<MatchAnswers>;
    setAnswers(nextAnswers);

    if (step === MATCH_QUESTIONS.length - 1) {
      setShowResults(true);
      return;
    }

    setStep((current) => current + 1);
  };

  const goBack = () => {
    if (step === 0) return;
    const previousQuestion = MATCH_QUESTIONS[step - 1];
    setAnswers((current) => {
      const next = { ...current };
      delete next[previousQuestion.id];
      return next;
    });
    setStep((current) => current - 1);
  };

  const editAnswers = () => {
    setShowResults(false);
    setStep(MATCH_QUESTIONS.length - 1);
  };

  const startAgain = () => {
    setAnswers({});
    setStep(0);
    setShowResults(false);
  };

  if (showResults) {
    const matches = rankRestaurantMatches(
      restaurants,
      answers as MatchAnswers,
    ).slice(0, 3);

    return (
      <div className={styles.resultsShell}>
        <header className={styles.resultsHeader}>
          <Link href="/" className={styles.brand} aria-label="Destiny home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/destiny-wordmark.png" alt="Destiny" />
          </Link>
          <div>
            <h1>These fit the plan.</h1>
            <p>
              Ranked from the current restaurant list using your group, spend,
              craving, vibe, and practical priority.
            </p>
          </div>
        </header>

        {matches.length > 0 ? (
          <ol className={styles.resultsList} aria-label="Restaurant matches">
            {matches.map(({ restaurant, reasons }, index) => (
              <li key={restaurant.id} className={styles.resultCard}>
                <div className={styles.resultMedia}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={restaurant.photos[0] ?? '/home/hero-campus-feast.webp'}
                    alt={`Food and atmosphere at ${restaurant.name}`}
                  />
                  <span>
                    {index === 0 ? 'Best match' : `Match ${index + 1}`}
                  </span>
                </div>
                <div className={styles.resultCopy}>
                  <div className={styles.resultTitleRow}>
                    <div>
                      <h2>{restaurant.name}</h2>
                      <p>
                        {restaurant.area}
                        {restaurant.price_per_head
                          ? ` · about ₹${restaurant.price_per_head} per person`
                          : ''}
                      </p>
                    </div>
                    <span
                      className={
                        restaurant.isOpen ? styles.open : styles.closed
                      }
                    >
                      {restaurant.isOpen ? 'Open now' : 'Closed now'}
                    </span>
                  </div>

                  <ul className={styles.reasons} aria-label="Why it matches">
                    {reasons.map((reason) => (
                      <li key={reason}>
                        <CheckIcon /> {reason}
                      </li>
                    ))}
                  </ul>

                  {restaurant.liveOffer && (
                    <p className={styles.offer}>
                      {restaurant.liveOffer.discount_text ??
                        restaurant.liveOffer.title}
                    </p>
                  )}

                  <Link
                    href={`/restaurant/${restaurant.id}?from=quiz`}
                    className={styles.viewAction}
                  >
                    View restaurant <ArrowIcon />
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className={styles.emptyState}>
            <h2>No restaurants are available yet.</h2>
            <p>
              Browse the full directory or try again when the catalog updates.
            </p>
            <Link href="/search">Browse restaurants</Link>
          </div>
        )}

        <div className={styles.resultActions}>
          <button type="button" onClick={editAnswers}>
            Change last answer
          </button>
          <button type="button" onClick={startAgain}>
            Start again
          </button>
          <Link href="/search">Browse all restaurants</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.questionShell}>
      <header className={styles.questionHeader}>
        <Link href="/" className={styles.brand} aria-label="Destiny home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/destiny-wordmark.png" alt="Destiny" />
        </Link>
        <Link href="/search" className={styles.skipLink}>
          Skip to all places
        </Link>
      </header>

      <div className={styles.progressCopy} aria-live="polite">
        <span>
          Question {step + 1} of {MATCH_QUESTIONS.length}
        </span>
        <span>{Math.round(((step + 1) / MATCH_QUESTIONS.length) * 100)}%</span>
      </div>
      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={MATCH_QUESTIONS.length}
        aria-valuenow={step + 1}
        aria-label="Restaurant finder progress"
      >
        <span
          style={{ width: `${((step + 1) / MATCH_QUESTIONS.length) * 100}%` }}
        />
      </div>

      <section className={styles.questionPanel} key={question.id}>
        <div className={styles.questionCopy}>
          <h1>{question.question}</h1>
          <p>{question.help}</p>
        </div>
        <div className={styles.optionGrid}>
          {question.options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => choose(option.value)}
              className={styles.option}
            >
              <span>
                <strong>{option.label}</strong>
                <small>{option.detail}</small>
              </span>
              <ArrowIcon />
            </button>
          ))}
        </div>
      </section>

      <footer className={styles.questionFooter}>
        <button type="button" onClick={goBack} disabled={step === 0}>
          <BackIcon /> Back
        </button>
        <p>Your answers stay on this device and are not saved.</p>
      </footer>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}
