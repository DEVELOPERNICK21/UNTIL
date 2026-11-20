/** @type {import('next').NextConfig} */

// Response headers that tighten the browser's defaults without touching how the pages work. There is
// deliberately no script-src: a Content-Security-Policy that lists scripts has to match Next's inline
// scripts and the JSON-LD blocks exactly, and is worth its own change. These directives only forbid
// plugins, framing and <base> tricks.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  {
    key: 'Content-Security-Policy',
    value: "object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
  },
];

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

module.exports = nextConfig;
