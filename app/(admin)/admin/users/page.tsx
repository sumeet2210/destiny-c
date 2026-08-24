import { UserControls } from '@/components/features/admin/AdminControls';
import {
  Empty,
  FilterLink,
  NotConfigured,
} from '@/components/features/admin/AdminUi';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { isSupabaseConfigured } from '@/lib/supabase/server';
import { listAdminUsers, type UserRole } from '@/lib/queries/admin';

export const metadata = { title: 'Users · Admin' };

const ROLES = ['student', 'owner', 'admin'] as const;

const isRole = (v: unknown): v is UserRole =>
  ROLES.includes(v as (typeof ROLES)[number]);
const str = (v: string | string[] | undefined) =>
  typeof v === 'string' && v !== '' ? v : undefined;

export default async function AdminUsersPage(props: PageProps<'/admin/users'>) {
  const searchParams = await props.searchParams;
  const role = isRole(searchParams.role) ? searchParams.role : undefined;
  const q = str(searchParams.q);

  if (!isSupabaseConfigured()) {
    return (
      <>
        <Heading />
        <NotConfigured />
      </>
    );
  }

  const users = await listAdminUsers({ role, q });

  return (
    <>
      <Heading />

      {/* A plain GET form: the filter state belongs in the URL, and this way the
          search works before any JavaScript loads. */}
      <form action="/admin/users" className="mb-3 flex gap-2">
        {role ? <input type="hidden" name="role" value={role} /> : null}
        <Input
          name="q"
          type="search"
          defaultValue={q ?? ''}
          placeholder="Search name or email"
          aria-label="Search users"
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        {ROLES.map((r) => (
          <FilterLink
            key={r}
            href={`/admin/users?role=${r}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
            active={role === r}
          >
            {r}
          </FilterLink>
        ))}
        <FilterLink
          href={`/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`}
          active={!role}
        >
          All
        </FilterLink>
      </div>

      {users.length === 0 ? (
        <Empty>No users match this filter.</Empty>
      ) : (
        <ul className="flex flex-col gap-3">
          {users.map((u) => (
            <li key={u.id}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-paper font-semibold">
                      {u.full_name ?? 'No name'}
                    </h2>
                    <p className="text-text-muted text-sm break-all">
                      {u.email}
                    </p>
                    <p className="text-text-muted text-xs">
                      {u.role}
                      {u.hostel ? ` · ${u.hostel}` : ''}
                      {u.nitw_verified ? ' · verified' : ' · unverified'}
                      {u.no_show_count > 0
                        ? ` · ${u.no_show_count} no-shows`
                        : ''}
                    </p>
                  </div>
                  <UserControls
                    id={u.id}
                    role={u.role}
                    verified={u.nitw_verified}
                  />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {users.length === 200 ? (
        <p className="text-text-muted mt-3 text-xs">
          Showing the 200 most recent matches. Narrow the search to see more.
        </p>
      ) : null}
    </>
  );
}

function Heading() {
  return (
    <h1 className="font-display text-paper mb-4 text-xl font-extrabold">
      Users
    </h1>
  );
}
