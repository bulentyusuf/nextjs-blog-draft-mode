# CLAUDE.md

Standing context for Claude Code working in this repo. Read before audits, so
deliberate decisions are not re-raised as findings.

## Accepted trade-offs and known non-issues

These are intentional. Do not "fix" or re-flag them without a new reason.

### CSP `script-src 'unsafe-inline'` is deliberate

`next.config.js` keeps `'unsafe-inline'` in `script-src`. Removing it requires a
per-request nonce, which on Next.js App Router forces dynamic rendering and
disables static optimisation, ISR, and CDN HTML caching (per the Next.js CSP
docs). This is a single-author blog serving content from a trusted CMS, with URL
scheme allowlisting and escaped JSON-LD already in place, so the XSS surface is
small and `unsafe-inline` is defence-in-depth, not the front line. Trading the
static delivery model, which is the whole point of this codebase and of the
forkable-template story, for that marginal gain is not worth it. Revisit only if
the site begins rendering untrusted user-generated content.

### Other reviewed items, intentionally left as-is

- `data:` in `img-src` stays. It is needed for next/image blur placeholders, and
  the once-suggested `data:image/*` is not valid CSP (scheme-sources cannot be
  MIME-scoped).
- Currently no `X-Frame-Options` header. `frame-ancestors` in the CSP already
  covers every current browser, so this legacy header is low-value, not a gap.
- No rate limiting on the API routes. Secrets are compared with `timingSafeEqual`
  and, provided they are long and random, brute force is infeasible. Confirm the
  configured secrets are high-entropy.
- `dangerouslySetInnerHTML` for Shiki output in `lib/rich-text.tsx`. Input is
  trusted CMS content and the renderer allowlists URL schemes. Known and accepted.
- Sitemap may list CMS `Page` slugs that have no route. Only `/about` and
  `/privacy` exist as routes today, both hardcoded, so this is dormant. If a
  third `Page` entry is ever published, either filter the sitemap to routed
  slugs or add a routing story (a root catch-all `[slug]` needs collision care
  with `/posts`, `/categories`, `/authors`). Triaged and low priority, not
  dismissed.
- Dependabot ignores major version updates for all packages. Deliberate, to
  avoid breaking-change churn for a solo maintainer. Advisory-driven Dependabot
  security updates are a separate mechanism and still cover security-flagged
  majors, provided security updates are enabled in repo settings. Not a gap.
- CI actions are pinned to major tags (`@v4`), not commit SHAs. Accepted as low
  risk because they are first-party (`actions/checkout`, `github/codeql-action`).
  SHA-pinning is optional belt-and-braces, not adopted.
- `npm audit` flags postcss `<8.5.10` (GHSA-qx2v-qp2m-jg93, XSS via unescaped
  `</style>` in CSS stringify output) via Next.js's bundled copy at
  `node_modules/next/node_modules/postcss`. The direct dependency is already
  pinned to the patched `postcss ^8.5.10`; only Next's internal copy lags. The
  advisory requires running untrusted CSS through PostCSS's stringifier, which
  this static blog never does — CSS is first-party Tailwind, build-time only.
  The only offered fix downgrades `next` to 9.3.3, a non-starter. Dormant;
  resolves when Next bumps its bundled postcss. Do not re-flag.
