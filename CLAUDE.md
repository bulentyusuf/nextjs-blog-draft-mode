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

### Search runs on Pagefind's Component UI, not the legacy default UI

`app/search/` mounts Pagefind's web components (`<pagefind-input>`,
`<pagefind-results>`) with a house result template supplied via
`<script type="text/pagefind-template">`. The markup and class names in that
template are ours; keyboard navigation, WAI-ARIA behaviour and assistive-text
translation come from upstream and are deliberately not reimplemented.

Two earlier approaches were tried and abandoned, so do not propose either
again. The legacy default UI (`@pagefind/default-ui`) needed a wall of
`!important` overrides to fight its runtime-injected stylesheet and its hashed
selectors. A fully bespoke React UI on the JS API removed that problem but made
us the maintainer of the entire search interface, including its accessibility.
The Component UI gives template-level control without either cost.

Because the template is ours, search CSS needs no `!important`. If a rule seems
to require it, the template is the wrong shape — fix the template.

The `pagefind` devDependency must stay at `^1.5.2` or later. The Component UI
does not exist in 1.3.x.

### Ghost search results for near-miss terms are an upstream limitation

Searching a term that matches nothing causes Pagefind to truncate it and retry,
so "musk" returns posts containing "music" and "Munich", with no highlighted
term in the excerpt. This is search-core behaviour, not a UI fault, and it
cannot be configured away: the complete browser-side option set is `baseUrl`,
`bundlePath`/`basePath`, `excerptLength`, `highlightParam`, `exactDiacritics`,
`metaCacheTag`, `ranking`, index weight, merge filter and `noWorker`. None of
them is a minimum-match threshold.

The related over-broad case, where "contentful" surfaces pages containing only
"content", is **not** fixed either. `ranking.termSimilarity` (documented as
suppressing pages that rank on long extensions of a search term) exists on the
raw JS API, but the Component UI does not expose it: the string `ranking`
appears nowhere in its bundle, and `<pagefind-config>` forwards only
`excerpt-length`, `base-url`, `highlight-param`, `exact-diacritics` and
`no-worker`. It is accepted on the same terms as the ghosts above — the price
of staying on upstream-maintained components. A "content"-only page can even
rank above the literal "contentful" match; do not treat that as a bug.

A client-side filter dropping results whose excerpt contains no `<mark>` does
remove the ghosts, but only by owning the result pipeline, which is the bespoke
approach rejected above. Do not reintroduce it. An issue requesting an opt-in
threshold has been drafted but not filed; the behaviour is accepted until
upstream offers a supported fix. Do not re-flag as a bug.

### The search empty state is coupled to the input's placeholder

The `.search-empty` rule in `globals.css` hides the emblem using
`:placeholder-shown` on the search input. Two things therefore matter: the
placeholder must stay non-empty, and if the component's internal input ever
moves into a shadow root the selector will stop matching and the emblem will
never hide. If that happens, drive the toggle from the instance's `results`
event instead. Check this after any Pagefind version bump.

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

### The search emblem sits on a light plate in dark mode, and must use literal hex values

The emblem in `app/search/` is knockout artwork: the hat, face and eye are not
drawn, they are gaps where the ground shows through the ink. That only reads on
a light ground, so in dark mode the emblem sits on a cream plate.

The complete figure className:

```
search-empty mx-auto mt-10 max-w-[16rem] text-brand-crimson
dark:rounded-3xl dark:bg-[#FAF5F1] dark:p-8 dark:text-[#A4243B]
```

**The rule that matters: anything rendered on that plate must use literal hex
values in dark mode, never brand tokens.** The plate is a fixed cream island
that does not change between colour schemes, but every brand token does. Both
hexes above exist for that reason:

- `dark:bg-[#FAF5F1]` — the page-background token flips to the dark value and
  would render a black plate.
- `dark:text-[#A4243B]` — `--color-brand-crimson` is deliberately lifted to
  `#E0667A` in dark mode so links stay vivid and pass AA against near-black
  (see globals.css). On the cream plate that lifted value looks washed out.
  Forcing the light-mode crimson back is correct: the artwork is on cream in
  both schemes, so it should be the same colour in both.

Anything added to this figure later — a border, a caption, a hover state —
falls under the same rule.

`rounded-3xl` and `p-8` are tuned by eye and may be nudged. The two hex values
are not tuning knobs.

Two alternatives were tried and rejected. Inverting the ink to cream so the
knockouts become page-dark is legible but reads as a photographic negative,
because a face made of holes is absence rather than marks. Stripping the face
and showing only the magnifying glass loses the joke and damages the linocut
line where the interior was cut away. Do not revisit either.

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
