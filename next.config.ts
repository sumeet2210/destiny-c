import type { NextConfig } from 'next';

// Testing on a phone or a friend's laptop means the browser reaches the dev
// server as something other than `localhost`, and Next blocks that by default.
// Two independent guards have to be opened, or login fails in different ways:
//
//   allowedDevOrigins            — dev-only assets and the HMR endpoints.
//                                  Without it the page loads but the dev
//                                  client is refused.
//   serverActions.allowedOrigins — the Origin/Host CSRF check. Login submits
//                                  through Server Actions (lib/auth/actions.ts),
//                                  so a mismatch here rejects the form itself.
//
// The IP globs cover a LAN address; the tunnel wildcards survive quick-tunnel
// hostnames rotating on every run. Anything else goes in DEV_ORIGINS in
// .env.local rather than being hardcoded here.
const devOrigins = [
  '127.0.0.1',
  '10.*.*.*',
  '172.16.*.*',
  '192.168.*.*',
  '*.trycloudflare.com',
  '*.ngrok-free.app',
  ...(process.env.DEV_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? []),
];

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  allowedDevOrigins: devOrigins,
  // Deliberately dev-only. Unlike allowedDevOrigins this option is NOT ignored
  // in a production build, and shipping a tunnel wildcard would let any
  // *.trycloudflare.com page invoke Server Actions against the real site.
  ...(isDev
    ? { experimental: { serverActions: { allowedOrigins: devOrigins } } }
    : {}),
};

export default nextConfig;
