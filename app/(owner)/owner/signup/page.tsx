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
import { Input, Label, Select } from '@/components/ui/Input';
import { AREAS } from '@/config/areas';
import { ownerSignup } from '@/lib/auth/actions';
import { PHONE_HELP } from '@/lib/domain/owner-profile';

export default function OwnerSignupPage() {
  const router = useRouter();
  const [restaurantName, setRestaurantName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState<(typeof AREAS)[number]>(AREAS[0]);
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
                area,
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
              inputMode="tel"
              autoComplete="tel"
              required
              aria-describedby="phone-hint"
              className={styles.field}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
            <p id="phone-hint" className={styles.fieldHint}>
              {PHONE_HELP}
            </p>
          </div>

          <div className={styles.fieldGroup}>
            <Label htmlFor="area" className={styles.label}>
              Area
            </Label>
            <Select
              id="area"
              required
              className={styles.field}
              value={area}
              onChange={(event) =>
                setArea(event.target.value as (typeof AREAS)[number])
              }
            >
              {AREAS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </Select>
          </div>

          <div className={`${styles.fieldGroup} ${styles.signupFullRow}`}>
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
              Account email
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

          <Button
            type="submit"
            className={`${styles.primaryButton} ${styles.signupSubmit}`}
            disabled={pending}
          >
            {pending ? 'Creating listing...' : 'Proceed to list'}
            {!pending ? <SubmitArrow /> : null}
          </Button>
        </form>
      </section>
    </AuthShell>
  );
}
