'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useId, useState, useTransition } from 'react';
import {
  AuthShell,
  SubmitArrow,
  authStyles as styles,
} from '@/components/features/AuthShell';
import { PasswordInput } from '@/components/features/PasswordInput';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { ownerLogin } from '@/lib/auth/actions';

export default function OwnerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const aboutPanelId = useId();

  return (
    <AuthShell
      audience="owner"
      title="Restaurant Portal"
      variant="portal"
      titleNowrap
    >
      <div className={styles.ownerOptions}>
        <section
          className={styles.ownerLoginBox}
          aria-labelledby="owner-login-title"
        >
          <header className={styles.ownerLoginHeading}>
            <h2 id="owner-login-title">Log in to your account</h2>
          </header>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(async () => {
                setError(null);
                const res = await ownerLogin(email.trim(), password);
                if (!res.ok) setError(res.message ?? 'Login failed.');
                else router.replace('/owner/profile');
              });
            }}
            className={styles.form}
          >
            <div className={styles.fieldGroup}>
              <Label htmlFor="email" className={styles.label}>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                autoFocus
                className={styles.field}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className={styles.fieldGroup}>
              <Label htmlFor="password" className={styles.label}>
                Password
              </Label>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                required
                className={styles.field}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            {error ? (
              <p role="alert" className={styles.error}>
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              className={styles.primaryButton}
              disabled={pending}
            >
              {pending ? 'Logging in...' : 'Log in'}
              {!pending ? <SubmitArrow /> : null}
            </Button>
          </form>
        </section>

        <Link href="/owner/signup" className={styles.ownerJoinCard}>
          <span className={styles.ownerOptionEyebrow}>New to Destiny</span>
          <strong>List your restaurant</strong>
          <span className={styles.ownerOptionArrow} aria-hidden="true">
            <SubmitArrow />
          </span>
        </Link>

        <div
          className={styles.ownerAboutDisclosure}
          data-open={aboutOpen || undefined}
        >
          <button
            type="button"
            className={styles.ownerAboutTrigger}
            aria-expanded={aboutOpen}
            aria-controls={aboutPanelId}
            onClick={() => setAboutOpen((current) => !current)}
          >
            <span>Know More About Destiny</span>
            <DisclosureChevron />
          </button>

          <div
            className={styles.ownerAboutViewport}
            aria-hidden={!aboutOpen}
            inert={aboutOpen ? undefined : true}
          >
            <div className={styles.ownerAboutViewportInner}>
              <section
                id={aboutPanelId}
                className={styles.ownerAboutContent}
                aria-label="About Destiny for restaurant partners"
              >
                <h2>Connecting Restaurants with the Student Community</h2>
                <p className={styles.ownerAboutIntro}>
                  <strong>
                    Destiny is a student-first discovery platform designed to
                    connect students with restaurants, cafés, and experiences
                    around their campus.
                  </strong>
                </p>
                <p>
                  We bring{' '}
                  <strong>
                    restaurant discovery, offers, events, recommendations, and
                    bookings
                  </strong>{' '}
                  together on a single platform, making it easier for students
                  to discover and choose places that suit their preferences.
                </p>
                <p>
                  Destiny provides a{' '}
                  <strong>
                    focused digital platform to reach the student audience
                  </strong>
                  , strengthen their online presence, promote offers and events,
                  and drive customer engagement and bookings.
                </p>

                <h3>Why Partner with Destiny?</h3>
                <div className={styles.ownerPartnerReasons}>
                  <div>
                    <strong>Reach the Right Audience</strong>
                    <p>Connect directly with students in your local area.</p>
                  </div>
                  <div>
                    <strong>Increase Visibility</strong>
                    <p>
                      Showcase your restaurant, menu, offers, and events to an
                      active student audience.
                    </p>
                  </div>
                  <div>
                    <strong>Drive Engagement</strong>
                    <p>
                      Turn discovery into visits, bookings, and repeat
                      customers.
                    </p>
                  </div>
                  <div>
                    <strong>Build Your Presence</strong>
                    <p>
                      Establish a strong digital presence within the student
                      community.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}

function DisclosureChevron() {
  return (
    <svg
      className={styles.ownerAboutChevron}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m7 10 5 5 5-5" />
    </svg>
  );
}
