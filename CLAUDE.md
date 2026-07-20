# CLAUDE.md

Standing context for Claude Code working in this repo. Read before audits, so
deliberate decisions are not re-raised as findings, and before implementation
work, so house conventions are not relearned by accident.

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

### CSP `'wasm-unsafe-eval'` in `script-src` is deliberate

Added for Pagefind, whose search core runs WebAssembly in the browser. The
directive permits wasm compilation only, not JS `eval` — production
`script-src` remains otherwise as strict as before. Removing it silently
breaks search in every Chromium browser. Do not re-flag as CSP loosening.

### The search UI runs on Pagefind's Component UI

`/search` uses Pagefind's Component UI — upstream web components
(`<pagefind-input>`, `<pagefind-results>`, `<pagefind-config>`) emitted into
`public/pagefind/` by the same `postbuild` step and loaded at runtime from
`/pagefind/pagefind-component-ui.js`. Accessibility and keyboard navigation are
upstream code, not ours. Result markup comes from our own
`text/pagefind-template` in `app/search/search-client.tsx`, so it carries house
Tailwind classes directly; the input and chrome are themed through Pagefind's
documented `--pf-*` CSS custom properties, so there is no `!important` and no
specificity war. Excerpts render the template's `{{+ excerpt +}}` (raw) because
they carry the `<mark>` highlights — trusted build-time index HTML, the same
precedent as the Shiki output in `lib/rich-text.tsx`.

Two result-quality quirks are knowingly accepted as the price of staying on
upstream-maintained code:

- Trimmed-term "ghost" results (e.g. "musk" matching "music"/"Munich"): Pagefind
  trims a term that finds nothing and retries. There is no config to disable it
  at any layer; an upstream issue requests a threshold option. Do not
  reintroduce client-side result filtering to hide these.
- Over-broad prefix matches (e.g. "contentful" ranking a "content"-only page
  above the literal match). `ranking.termSimilarity` exists on the raw JS API
  but is **not** exposed by the Component UI (the string `ranking` appears
  nowhere in its bundle), so it cannot be configured here.

The result URL is taken from `data-pagefind-meta="url"` on the post `<article>`,
not Pagefind's file-path-derived url, because the index is built over the
prerendered `<slug>.html` files and that derived url carries a `.html` that
404s on Next's extensionless routes. The template reads `meta.url` first for
this reason — do not remove the meta.

### Search index staleness between deploys is accepted

The Pagefind index is built by the `postbuild` script, so it only updates on
deploy. A post published via the Contentful webhook goes live through ISR but
is absent from search until the next deployment. Known v1 trade-off. The fix,
if it ever grates, is a Vercel deploy hook on the Contentful publish webhook —
a workflow decision for Bulent, not a code change to make unprompted. Related:
`postbuild` writing to `public/` after `next build` works because Vercel
packages the deployment after the entire build command finishes; do not
re-flag as a broken pattern.

### `/search` is `noindex` by design

It is linked from the nav yet excluded from search engines. A search page is
thin content; crawlers should reach posts directly. Not an SEO gap.

### Brand colour exists in two places on purpose

The header colour lives as a CSS token in `globals.css` AND as
`BRAND_HEADER_COLOR` / `BRAND_HEADER_COLOR_DARK` in `lib/constants.ts`. Not a
DRY violation: the viewport `themeColor` and the web manifest are generated in
JS and cannot read CSS custom properties. Any header colour change must touch
both files. Do not "deduplicate" by deleting either.

### Image loader passes only `w`, `q`, `fm=webp` by design

All cropping is CSS-side (`object-cover`). The absence of Contentful's
crop/focus/height params is a decision, not an omission — do not add them
without a new reason.

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

## House conventions

### Two h1 treatments, chosen by column width

Full-width browsing and content pages (home, posts, archive, categories,
authors, pagination) use the full ramp:
`text-4xl leading-tight md:text-5xl lg:text-6xl`.

Narrow document pages in a `max-w-2xl` column (about, privacy, search) cap at
`mb-6 text-4xl md:text-5xl`, no `leading-tight`. A 6xl heading in a 42rem
measure looks enormous despite identical classes — that mismatch is the tell.
Any new page must pick the treatment matching its column, not copy the
nearest existing h1.

### The site's locale is en-GB, everywhere

The Contentful default locale is `en-GB`, dates format via date-fns `enGB`,
and the html `lang`, OG locale, and feed metadata follow. Any `en-US`,
`en_US`, or American date formatting appearing in code or metadata is a
regression, not a style choice — a previous PR existed solely to purge these.
German (`de-DE`) localisation is in progress; until it lands, do not add
locale plumbing speculatively.

### Contentful export/seed files are load-bearing and brittle

`contentful/export.json` and `seed.json` back the forkable-template story.
Hard-won rules: content types and seed entries must carry
`sys.publishedVersion` or they import as inactive drafts that GraphQL cannot
see; seed assets must use `file.url`, never `file.upload` (upload aborts the
entire import); a failed or partial import must be retried into a brand-new
empty space, never re-run over a partially-activated one. Do not "tidy" these
files.

### Workflow constants

Protected main, squash merges only, one concern per PR, conventional commit
messages, descriptive branch names. The CI gate is `tsc --noEmit` + the vitest
suite. There is no lint script — `next lint` was removed in Next 16 — so do
not add or invoke one.
