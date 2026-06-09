/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== "production";

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
      // 'unsafe-inline' is kept deliberately. Removing it needs a per-request
      // nonce, which on App Router forces dynamic rendering and disables static
      // optimisation, ISR, and CDN HTML caching. Trusted-CMS, single-author
      // threat model makes that trade not worth it. See CLAUDE.md.
      // 'unsafe-eval' is added in development only. Turbopack and React need it
      // for dev debugging features, and React never uses eval in production, so
      // the production policy stays strict.
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://va.vercel-scripts.com`,
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
      {
        // The dupe route. Crawlers only know /sitemap.xml. This marks the bare
        // /sitemap-xml URL noindex without touching /sitemap.xml, because header
        // source matching runs against the requested path, not the rewrite
        // destination.
        source: "/sitemap-xml",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
  async rewrites() {
    // /sitemap.xml is a Next-reserved metadata path whose special route does
    // not honour on-demand tag invalidation. Serve our ordinary /sitemap-xml
    // route handler at the canonical /sitemap.xml instead. This is an
    // afterFiles rewrite, so it only fires because no /sitemap.xml file exists.
    return [{ source: "/sitemap.xml", destination: "/sitemap-xml" }];
  },
};
