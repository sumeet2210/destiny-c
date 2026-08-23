'use client';

import { useEffect, useState, useTransition } from 'react';
import { ErrorBlock, LoadingBlock } from '@/components/features/AsyncStates';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Input, Select } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { listUsers, updateUser } from '@/lib/api/admin';
import type { AdminUser } from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { useApi } from '@/lib/hooks/useApi';

type UserRole = 'student' | 'owner' | 'admin';
type RoleFilter = UserRole | 'all';

const FILTERS: { key: RoleFilter; label: string }[] = [
  { key: 'all', label: 'Everyone' },
  { key: 'student', label: 'Students' },
  { key: 'owner', label: 'Owners' },
  { key: 'admin', label: 'Admins' },
];

export function UsersView() {
  const [role, setRole] = useState<RoleFilter>('all');
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');

  // Debounce the search box so we don't fire a request on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data, loading, error, reload } = useApi(
    () =>
      listUsers({
        role: role === 'all' ? undefined : role,
        q: debouncedQ || undefined,
      }),
    [role, debouncedQ],
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-paper text-2xl font-extrabold">
          Users
        </h1>
        <p className="text-text-muted mt-1 text-[13px]">
          Change roles and flip NITW verification. Search by name or email.
        </p>
      </div>

      <Input
        type="search"
        placeholder="Search name or email…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Chip
            key={f.key}
            active={role === f.key}
            onClick={() => setRole(f.key)}
          >
            {f.label}
          </Chip>
        ))}
      </div>

      {error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : !data ? (
        <LoadingBlock label="Loading users…" />
      ) : data.length === 0 ? (
        <p className="text-text-muted text-sm">No users match.</p>
      ) : (
        <div className={cn('space-y-3', loading && 'opacity-60')}>
          {data.map((u) => (
            <UserRow key={u.id} user={u} onChanged={reload} />
          ))}
        </div>
      )}
    </div>
  );
}

function UserRow({
  user,
  onChanged,
}: {
  user: AdminUser;
  onChanged: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const changeRole = (nextRole: UserRole) => {
    if (nextRole === user.role) return;
    startTransition(async () => {
      try {
        await updateUser(user.id, { role: nextRole });
        toast(`Role set to ${nextRole}`, 'positive');
        onChanged();
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Could not update', 'error');
      }
    });
  };

  const toggleVerified = () =>
    startTransition(async () => {
      try {
        await updateUser(user.id, { nitw_verified: !user.nitw_verified });
        toast(
          user.nitw_verified ? 'Verification removed' : 'Marked verified',
          'positive',
        );
        onChanged();
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Could not update', 'error');
      }
    });

  return (
    <Card className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-paper text-sm font-semibold">
          {user.full_name ?? 'Unnamed'}
        </p>
        <span className="text-text-muted shrink-0 font-mono text-[12px]">
          {user.role}
        </span>
      </div>
      <p className="text-text-muted text-[12px]">{user.email}</p>
      <p className="text-text-muted text-[12px]">
        {user.nitw_verified ? 'NITW verified' : 'Not verified'}
        {user.hostel ? ` · ${user.hostel}` : ''} · {user.no_show_count} no-shows
      </p>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Select
          className="w-auto"
          value={user.role}
          disabled={pending}
          onChange={(e) => changeRole(e.target.value as UserRole)}
          aria-label="Role"
        >
          <option value="student">student</option>
          <option value="owner">owner</option>
          <option value="admin">admin</option>
        </Select>
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={toggleVerified}
        >
          {user.nitw_verified ? 'Unverify' : 'Mark verified'}
        </Button>
      </div>
    </Card>
  );
}
