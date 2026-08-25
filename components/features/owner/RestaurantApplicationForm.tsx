'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  submitRestaurantApplication,
  type ApplicationActionResult,
} from '@/lib/onboarding/actions';
import type { RestaurantApplicationInput } from '@/lib/onboarding/domain';
import styles from '@/app/(owner)/owner/application.module.css';

const empty: RestaurantApplicationInput = {
  restaurantName: '',
  ownerName: '',
  phone: '',
  email: '',
  restaurantAddress: '',
};

export function RestaurantApplicationForm() {
  const router = useRouter();
  const [values, setValues] = useState(empty);
  const [result, setResult] = useState<ApplicationActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const set = (key: keyof RestaurantApplicationInput, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));
  const errors = result && !result.ok ? result.errors : undefined;

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const next = await submitRestaurantApplication(values);
          setResult(next);
          if (next.ok) {
            router.push(
              `/owner/application/${encodeURIComponent(next.applicationId)}?token=${encodeURIComponent(next.token)}`,
            );
          }
        });
      }}
    >
      <Field label="Restaurant Name" error={errors?.restaurantName}>
        <input
          required
          autoFocus
          value={values.restaurantName}
          onChange={(event) => set('restaurantName', event.target.value)}
        />
      </Field>
      <Field label="Owner Name" error={errors?.ownerName}>
        <input
          required
          autoComplete="name"
          value={values.ownerName}
          onChange={(event) => set('ownerName', event.target.value)}
        />
      </Field>
      <Field
        label="Phone Number"
        error={errors?.phone}
        hint="10-digit Indian number"
      >
        <div className={styles.phoneField}>
          <span>+91</span>
          <input
            required
            inputMode="numeric"
            autoComplete="tel"
            maxLength={10}
            value={values.phone.replace(/^\+91/, '')}
            onChange={(event) =>
              set('phone', event.target.value.replace(/\D/g, '').slice(0, 10))
            }
          />
        </div>
      </Field>
      <Field label="Email Address" error={errors?.email}>
        <input
          required
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(event) => set('email', event.target.value)}
        />
      </Field>
      <Field label="Restaurant Address" error={errors?.restaurantAddress} wide>
        <textarea
          required
          rows={3}
          value={values.restaurantAddress}
          onChange={(event) => set('restaurantAddress', event.target.value)}
        />
      </Field>
      {result && !result.ok ? (
        <p className={styles.formError} role="alert">
          {result.message}
        </p>
      ) : null}

      <button className={styles.submit} type="submit" disabled={pending}>
        {pending ? 'Submitting application…' : 'Submit Application'}
        {!pending ? <span aria-hidden="true">→</span> : null}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  hint,
  wide,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={wide ? styles.wideField : styles.field}>
      <span>{label}</span>
      {children}
      {error ? <small className={styles.fieldError}>{error}</small> : null}
      {!error && hint ? <small>{hint}</small> : null}
    </label>
  );
}
