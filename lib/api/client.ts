// The single choke point through which the Next app talks to the Express API.
//
// Works in two contexts:
//   • Server Components — anonymous public reads (no session on the server), so
//     callers pass { cache } / { revalidate } to opt into Next's fetch cache.
//     (Note: in this Next, fetch is UNCACHED by default — see
//     node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md.)
//   • Client Components — authed calls; we attach the Bearer token from the
//     session store and, on a 401, refresh ONCE (single-flight) and retry.
//
// The backend's response envelope is { ok: true, ...data } on success and
// { ok: false, error } on failure (backend/src/middleware/error.js). We surface
// failures as ApiError(status, message) so callers can branch on status.
import {
  getSession,
  setSession,
  clearSession,
} from '@/lib/session/store';

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/** A non-2xx response, or a 2xx body with { ok: false }. `status` is the HTTP
 *  status (0 for network/transport failures). */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type QueryValue = string | number | boolean | null | undefined;

export type ApiFetchOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  /** JSON-serialized automatically; pass a FormData to send multipart. */
  body?: unknown;
  /** Attach the Bearer token and enable refresh-on-401 (client only). */
  auth?: boolean;
  query?: Record<string, QueryValue>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Server Component read-cache opt-in. */
  cache?: RequestCache;
  /** Next fetch revalidation window (seconds), for Server Component reads. */
  revalidate?: number | false;
};

/** The read-only knobs a caller (usually a Server Component) may forward to a
 *  wrapper to control caching/abort without touching method/body/auth. */
export type ReadOptions = Pick<
  ApiFetchOptions,
  'cache' | 'revalidate' | 'signal'
>;

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const base = `${API_BASE}${path}`;
  if (!query) return base;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

// Single-flight refresh: many components can hit a 401 at once; they must share
// one /auth/refresh round-trip, not stampede the endpoint.
let refreshPromise: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  const session = getSession();
  if (!session?.refresh_token) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.ok || !body.access_token) {
      clearSession();
      return false;
    }
    setSession({
      access_token: body.access_token,
      refresh_token: body.refresh_token,
      expires_at: body.expires_at,
      user: body.user ?? session.user,
    });
    return true;
  } catch {
    // A transport failure isn't proof the refresh token is dead, but we can't
    // proceed authed either; drop the session so the UI shows a clean re-login.
    clearSession();
    return false;
  }
}

function refreshOnce(): Promise<boolean> {
  refreshPromise ??= doRefresh().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

async function parse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      // Non-JSON (proxy error page, etc.) — fall through to the status check.
    }
  }
  const envelope = body as { ok?: boolean; error?: string } | null;
  if (!res.ok || (envelope && envelope.ok === false)) {
    const message =
      envelope?.error || res.statusText || `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }
  return body as T;
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: ApiFetchOptions = {},
): Promise<T> {
  const url = buildUrl(path, opts.query);
  const isForm =
    typeof FormData !== 'undefined' && opts.body instanceof FormData;

  const send = (): Promise<Response> => {
    const headers: Record<string, string> = { ...(opts.headers ?? {}) };
    let bodyInit: BodyInit | undefined;
    if (opts.body !== undefined) {
      if (isForm) {
        bodyInit = opts.body as FormData; // let the browser set the boundary
      } else {
        headers['Content-Type'] = 'application/json';
        bodyInit = JSON.stringify(opts.body);
      }
    }
    if (opts.auth) {
      const token = getSession()?.access_token;
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    const init: RequestInit & {
      next?: { revalidate?: number | false };
    } = {
      method: opts.method ?? (opts.body !== undefined ? 'POST' : 'GET'),
      headers,
      signal: opts.signal,
    };
    if (bodyInit !== undefined) init.body = bodyInit;
    if (opts.cache) init.cache = opts.cache;
    if (opts.revalidate !== undefined) init.next = { revalidate: opts.revalidate };

    return fetch(url, init);
  };

  let res: Response;
  try {
    res = await send();
  } catch (err) {
    throw new ApiError(0, err instanceof Error ? err.message : 'Network error');
  }

  // Refresh + retry exactly once, and only in the browser where a session lives.
  if (
    res.status === 401 &&
    opts.auth &&
    typeof window !== 'undefined' &&
    getSession()?.refresh_token
  ) {
    const refreshed = await refreshOnce();
    if (refreshed) {
      try {
        res = await send();
      } catch (err) {
        throw new ApiError(
          0,
          err instanceof Error ? err.message : 'Network error',
        );
      }
    }
  }

  return parse<T>(res);
}
