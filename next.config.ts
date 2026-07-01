import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * A static (non-nonce) Content-Security-Policy. This intentionally avoids
 * the nonce + proxy pattern: this app renders both static and dynamic
 * pages, and per-request nonces require every page in scope to be
 * dynamically rendered, which is a bigger architectural commitment than
 * this pass is trying to make. 'unsafe-inline' is kept for scripts and
 * styles because Next.js itself relies on inline styles/scripts in
 * various cases; this is a meaningfully weaker policy than a nonce-based
 * one, but still meaningfully stronger than no policy at all.
 */
const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
];

const securityHeaders = [
  // Forces HTTPS for future requests. Harmless to set in development
  // since it only takes effect over an actual HTTPS response.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Prevents MIME-type sniffing, which can turn a non-executable upload
  // into an executed script in some legacy browser behaviors.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Legacy clickjacking protection; CSP's frame-ancestors above is the
  // modern equivalent and takes precedence in browsers that support it.
  { key: "X-Frame-Options", value: "DENY" },
  // Limits how much of the referring URL is sent to other origins.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disables browser features this app has no use for.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "Content-Security-Policy", value: cspDirectives.join("; ") },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Applies to every route, including API routes. This app is
        // same-origin only (no public cross-origin API consumers), so
        // no Access-Control-Allow-Origin header is set here; Next.js's
        // same-origin default is the correct posture for an internal tool.
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
