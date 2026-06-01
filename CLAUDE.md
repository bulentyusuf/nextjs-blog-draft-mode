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
