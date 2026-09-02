// Refresh the Supabase session before rendering any route so server
// components always receive the latest authentication cookies.
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headers) {
          // Make refreshed cookies visible to the rest of this request.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );

          response = NextResponse.next({ request });

          // Return the refreshed session to the browser.
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );

          // Supabase supplies these headers whenever auth cookies change.
          // They prevent Cloudflare or another CDN from caching a response
          // containing a user's refreshed session.
          Object.entries(headers).forEach(([name, value]) =>
            response.headers.set(name, value),
          );
        },
      },
    },
  );

  // This validates the current JWT and refreshes it when it is near expiry.
  // Keep it before any other response work so a rotated refresh token can be
  // written back to the browser in the same request.
  await supabase.auth.getClaims();

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|seed/|.*\\.(?:svg|png|jpg|webp)$).*)',
  ],
};
