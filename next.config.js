/** @type {import('next').NextConfig} */

// Contentful's Live Preview embeds this site in an iframe at app.contentful.com,
// so frame-ancestors must allow that origin. X-Frame-Options can't list multiple
// origins, so it's intentionally omitted — modern browsers honour CSP's
// frame-ancestors which fully supersedes it.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js App Router requires 'unsafe-inline' for hydration scripts.
      "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https://images.ctfassets.net data: blob:",
      "font-src 'self'",
      "connect-src 'self' https://vitals.vercel-insights.com https://va.vercel-scripts.com",
      "frame-ancestors 'self' https://app.contentful.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

module.exports = {
  images: {
    loader: "custom",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};
