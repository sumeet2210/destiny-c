'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  AuthShell,
  SubmitArrow,
  authStyles as styles,
} from '@/components/features/AuthShell';
import { PasswordInput } from '@/components/features/PasswordInput';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { ownerSignup } from '@/lib/auth/actions';

export default function OwnerSignupPage() {
  const router = useRouter();
  const [restaurantName, setRestaurantName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <AuthShell audience="owner" title="List your restaurant" variant="portal">
      <section
        className={`${styles.ownerLoginBox} ${styles.ownerSignupBox}`}
        aria-label="Restaurant details"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () => {
              setError(null);
              setNotice(null);
              const res = await ownerSignup({
                email: email.trim(),
                password,
                restaurantName,
                ownerName,
                phone,
                address,
                area: address,
              });
              if (!res.ok) setError(res.message ?? 'Signup failed.');
              else if (res.message) setNotice(res.message);
              else router.replace('/owner/dashboard');
            });
          }}
          className={`${styles.form} ${styles.ownerSignupForm}`}
        >
          <div className={styles.fieldGroup}>
            <Label htmlFor="restaurant-name" className={styles.label}>
              Restaurant name
            </Label>
            <Input
              id="restaurant-name"
              autoComplete="organization"
              required
              autoFocus
              className={styles.field}
              value={restaurantName}
              onChange={(event) => setRestaurantName(event.target.value)}
            />
          </div>

          <div className={styles.fieldGroup}>
            <Label htmlFor="owner-name" className={styles.label}>
              Owner name
            </Label>
            <Input
              id="owner-name"
              autoComplete="name"
              required
              className={styles.field}
              value={ownerName}
              onChange={(event) => setOwnerName(event.target.value)}
            />
          </div>

          <div className={styles.fieldGroup}>
            <Label htmlFor="phone" className={styles.label}>
              Phone number
            </Label>
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              required
              minLength={10}
              maxLength={10}
              pattern="[0-9]{10}"
              className={styles.field}
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))
              }
            />
          </div>

          <div className={styles.fieldGroup}>
            <Label htmlFor="address" className={styles.label}>
              Address
            </Label>
            <Input
              id="address"
              autoComplete="street-address"
              required
              className={styles.field}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
          </div>

          <div className={`${styles.fieldGroup} ${styles.signupFullRow}`}>
            <Label htmlFor="email" className={styles.label}>
              Business email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              className={styles.field}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className={`${styles.fieldGroup} ${styles.signupFullRow}`}>
            <Label htmlFor="password" className={styles.label}>
              Password
            </Label>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              required
              minLength={8}
              aria-describedby="password-hint"
              className={styles.field}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <p id="password-hint" className={styles.fieldHint}>
              At least 8 characters
            </p>
          </div>

          {error ? (
            <p
              role="alert"
              className={`${styles.error} ${styles.signupFullRow}`}
            >
              {error}
            </p>
          ) : null}

          {notice ? (
            <p
              role="status"
              className={`${styles.notice} ${styles.signupFullRow}`}
            >
              {notice}
            </p>
          ) : null}

          <div className={`${styles.signupFullRow} ${styles.signupSubmitRow}`}>
            <Button
              type="submit"
              className={styles.primaryButton}
              disabled={pending}
            >
              {pending ? 'Creating listing...' : 'Proceed to list'}
              {!pending ? <SubmitArrow /> : null}
            </Button>
            <a
              href="https://docs.google.com/document/d/1E3zXDVcLHXXsER45O7DKqvg_2dw7WD-H1cs1-vsp5r0/edit?usp=drivesdk"
              className={styles.termsLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms and Conditions
            </a>
          </div>
        </form>
      </section>
    </AuthShell>
  );
}
