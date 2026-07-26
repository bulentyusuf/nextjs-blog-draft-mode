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

`app/search/` mounts Pagefind's web components with a house result template
(`<script type="text/pagefind-template">`). The markup and class names in that
template are ours; the components' keyboard and WAI-ARIA behaviour is upstream's
and is deliberately not reimplemented.

The legacy default UI (`@pagefind/default-ui`) and a bespoke React UI on the JS
API were both tried and abandoned. Do not propose either again.

Because the template is ours, search CSS needs no `!important`. If a rule seems
to require it, the template is the wrong shape — fix the template.

The `pagefind` devDependency must stay at `^1.5.2` or later; the Component UI
does not exist in 1.3.x.

### Ghost search results for near-miss terms are an upstream limitation

A term that matches nothing is truncated and retried by the search core, so
"musk" returns posts containing "music" and "Munich" with no highlighted term.
Search-core behaviour, not a UI fault, and the supported option set holds no
minimum-match threshold. The over-broad case, where "contentful" surfaces pages
containing only "content", is **not** fixed either and can rank above the
literal match: `ranking.termSimilarity` exists on the raw JS API but the
Component UI does not expose it. Do not treat either as a bug.

A client-side filter dropping results whose excerpt contains no `<mark>`
removes the ghosts, but only by owning the result pipeline, the bespoke
approach rejected above. Do not reintroduce it. Filed upstream
(Pagefind/pagefind#1246, https://github.com/Pagefind/pagefind/issues/1246) and
accepted until a supported fix lands. Do not re-flag as a bug.

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

### The search emblem's dark-mode ground

`app/search/search-emblem.tsx` draws knockout artwork over a cream underlay
sliced from the art itself. Two rules.

- Anything rendered on that ground uses literal hex values in dark mode, never
  brand tokens. The ground is a fixed cream island in both schemes and every
  brand token flips. `.search-lens-ground` fills `#FAF5F1` because
  `--color-brand-bg` would otherwise paint a black glass, and the figure forces
  `dark:text-[#A4243B]` because the lifted dark-mode crimson looks washed out on
  cream. This covers anything added later, a border, a caption, a hover state.
- `LENS` is sliced from `PATH1` at render time so it can never drift from the
  art. It is not a tuning knob, do not replace it with a hand-drawn shape.
  `p-8` on the figure may be nudged by eye.

Already tried and rejected, do not revisit. A rounded plate behind the whole
figure (read as a floating card). A hand-tuned tilted ellipse (always a hair of
spill and a muddy handle). Inverting the ink to cream (reads as a photographic
negative). Stripping the face and keeping only the glass (loses the joke).

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

### One divider token, `--color-hairline`

Every rule between list items, cards and panels uses `border-hairline` or
`divide-hairline`. The token is defined in `@theme` as `#e5e7eb` and overridden
in the `prefers-color-scheme: dark` block as `rgb(242 234 228 / 0.15)`, so it
inverts on its own. Do not add a `dark:` variant to any element using it, and do
not reintroduce bare `gray-200` borders — those rendered as bright white lines
through every card list in dark mode, which is the defect this token replaced.

The `border-2` frames around images in `lib/rich-text.tsx` and
`lib/lightbox-image.tsx` are a separate, heavier role and deliberately keep
their own `border-gray-300 dark:border-brand-dark/15` pairing. Leave them.

### One focus indicator, set in `@layer base`

`globals.css` defines a single `:focus-visible` rule: a 2px
`var(--color-brand-crimson)` outline at 2px offset, inverting with the scheme
(`#A4243B` light, `#E0667A` dark). Do not add `focus-visible:ring-*` or
`focus-visible:outline-*` utilities to individual components. Focus looking
wrong usually means a missing `focus-visible:outline-hidden` before a local
override.

Two deliberate exceptions. **The coloured header and footer bands**: crimson on
the header navy `#1E3A8A` is about 1.07:1 and fails WCAG 1.4.11, so the
masthead, nav links, search icon, skip link and footer links set
`focus-visible:outline-hidden` plus a white ring. The `outline-hidden` is
required, not decorative — without it the base outline stacks underneath and
still fails. **Code block scroll regions**: the `role="region"` elements in
`lib/rich-text.tsx` use `focus-visible:outline-offset-[-2px]` to draw inward,
because their `overflow-hidden rounded-lg` parent clips anything outside the
box. A ring is not an alternative — `ring-*` compiles to `box-shadow`, clipped
the same way.

### Back-to-top uses a two-tone ring, and must keep it

`app/back-to-top.tsx` is the only `position: fixed` control on the site, so it
keeps `focus:outline-hidden` plus a white ring on a `surface-dark` offset, not
the base outline. See the in-file comment for the contrast reasoning. Once
"simplified" and reverted; do not propose it again.

### Breadcrumbs are constrained to their page's own measure

`Container` is `max-w-5xl`. Pages whose content is also `max-w-5xl` (posts,
categories, authors, archive) render `<Breadcrumb>` unwrapped. Pages in a
`max-w-2xl` column (about, privacy, search) wrap it in
`<div className="mx-auto max-w-2xl">`, otherwise it starts 176px left of the
heading it labels. Any new narrow page needs the wrapper. This is the same
column-width distinction as the two h1 treatments below.

On `/search` the wrapper must sit **before** the `<section>`, not inside it. The
emblem's visibility depends on
`.pagefind-scope:has(input:not(:placeholder-shown)) + .search-empty`, which needs
`.search-empty` to remain the immediate next sibling of `.pagefind-scope`.

### `/page/[page]` has no breadcrumb on purpose

Breadcrumbs describe section hierarchy. Position is carried separately by
`app/page-context.tsx`, which renders a muted "Page N of M" line and returns
`null` on page 1. That is why paginated category and author chains stop at the
section and never include a page number. A crumb here would be a lone
non-linked "Home" marked `aria-current="page"`. Do not add one, and do not add
page numbers to the existing paginated chains.

Known and accepted: on `/categories/[slug]/page/[page]`, `aria-current="page"`
sits on the section crumb, whose URL differs from the current one.

### Two smaller decisions, recorded

- The skip link's `focus:top-2` is computed, not a nudge: the link is 36px tall
  and the header band 52px, so 8px centres it. Recompute it if the header's
  `py-3` or the masthead's `text-lg` changes. The self-centring alternative was
  considered and rejected.
- Archive rows carry two tab stops each, title and category, because the category
  links to its category page as it does on the home page hero.

### Sidenotes are inline embedded entries, and the numbering has two halves

A sidenote is a Contentful `Sidenote` entry embedded inline in a post's rich
text, pulled through the `... on Sidenote` fragment in `lib/api.ts` and
rendered by `lib/sidenote.tsx`.

`lib/rich-text.tsx` deliberately returns `null` for a missing entry or for any
inline embed that is not a `Sidenote`, so a deleted entry degrades to nothing
rather than throwing. Do not replace that guard with an error.

The visible reference number and the `N. ` prefix on the floated note are two
separate mechanisms, a document-order index computed in `rich-text.tsx` and a
CSS counter in `globals.css`. They agree because both advance once per note in
document order. If either moves, move the other.

Every element in a sidenote must stay phrasing content: `<span>`, `<sup>`,
`<input>`, `<label>`. `<details>`, `<summary>` and `<p>` all implicitly close an
open paragraph in the HTML parser, so any of them inside the note splits the
sentence it sits in and desyncs React's tree from the parsed DOM. That is why
the toggle is not a native disclosure, and why the note's own rich-text
paragraphs are rendered as `.sidenote-para` spans blocked out in CSS. A test in
`lib/rich-text.test.tsx` guards both. Do not reintroduce `<details>`;
`display: inline` cannot undo a parse-time split.

Below 2xl the note opens with **no JavaScript**: a visually hidden checkbox
drives `:checked ~ .sidenote-body` in CSS. `lib/sidenote.tsx` is therefore a
server component and the feature ships zero client JS. Do not convert the toggle
back to a `<button>` with React state — notes are content, and that version left
them unreadable with scripts off and during the window before hydration. The
checkbox must stay visually hidden rather than `display: none`, or it stops
being focusable. A test asserts no `<button>` is emitted.

The accepted cost is that the control announces as a checkbox rather than
carrying `aria-expanded`. Weighed deliberately against a button: below 2xl the
note is `display: none`, so a screen reader cannot read it in DOM order and must
operate the control, which makes the control working without JS worth more than
the better ARIA state.

All responsive display lives in the unlayered `.sidenote-*` rules in
`globals.css`, never as Tailwind utilities in the component. Unlayered author
styles outrank everything in the `utilities` layer, so a `2xl:hidden` on a
`.sidenote-*` element silently loses — that is what once showed both markers at
2xl. If a new responsive rule is needed, add it to `globals.css`.

Both `<sup>`s are `aria-hidden`, and the label takes its accessible name from an
`sr-only` span reading "Note N". Do not "fix" either `sup` by giving it a name,
it would double-announce; and do not drop the `sr-only` span, the control would
then announce as a bare "1".

### Cross-document view transitions are CSS-only, and names must stay unique

`@view-transition { navigation: auto }` in `globals.css` opts into
cross-document transitions. Navigations here are full document loads, which is
exactly what this animates. No JS, no library. Browsers without support
navigate instantly.

The spec requires transition names to be unique on a page. `createCoverNamer()`
in `lib/view-transition-name.ts` hands out `cover-{slug}` at most once per
render pass, because a post appearing twice, hero plus list, would otherwise
name the same cover twice and a duplicate invalidates the entire transition.
Reset per request, do not memoise across requests.

The 0.35s group and 0.2s root durations are tuned, not defaults. The
`prefers-reduced-motion` block disables the animation entirely.

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
- The sitemap only lists CMS `Page` slugs that have a real route. Just `/about`
  and `/privacy` are routed today (both hardcoded), so the sitemap filters
  `Page` entries through `ROUTED_PAGE_SLUGS` in `app/sitemap-xml/route.ts` — a
  newly published Page cannot inject a URL with no route (a 404) into the
  sitemap. If a real route is ever added for another Page slug, add it to that
  set. The alternative, a root catch-all `[slug]` route, still needs collision
  care with `/posts`, `/categories`, `/authors` and was not taken.
- Dependabot ignores major version updates for all packages. Deliberate, to
  avoid breaking-change churn for a solo maintainer. Advisory-driven Dependabot
  security updates are a separate mechanism and still cover security-flagged
  majors, provided security updates are enabled in repo settings. Not a gap.
- CI actions are pinned to major tags (`@v4`), not commit SHAs. Accepted as low
  risk because they are first-party (`actions/checkout`, `github/codeql-action`).
  SHA-pinning is optional belt-and-braces, not adopted.
- `npm audit` flags postcss `<8.5.10` (GHSA-qx2v-qp2m-jg93) via Next's bundled
  copy at `node_modules/next/node_modules/postcss`; the direct dependency is
  already on the patched `^8.5.10`. It needs untrusted CSS through PostCSS's
  stringifier, which this blog never does. The only offered fix downgrades
  `next` to 9.3.3, a non-starter. Do not re-flag.
- `npm audit` flags uuid `<11.1.1` (GHSA-w5hq-g745-h8pq) via the
  `contentful-import` → `contentful-batch-libs` chain. `contentful-import` is a
  devDependency, a one-shot CLI tool that never ships and never runs at build or
  request time, so runtime exposure is zero. The only offered fix downgrades it
  six majors (to 8.2.24), a non-starter. Do not re-flag.

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

The same `max-w-5xl` versus `max-w-2xl` split governs breadcrumb placement — see
"Breadcrumbs are constrained to their page's own measure" above.

### Every rich-text hyperlink goes through `lib/rich-text-link.tsx`

`renderHyperlink` there is the only hyperlink renderer on the site. It allowlists
URL schemes (`http`, `https`, `mailto` — anything else degrades to plain text,
including `javascript:` and the protocol-relative forms) and gives cross-origin
links `target="_blank"`, `rel="noopener noreferrer"` and the screen-reader
new-window hint.

Any new rich-text surface must pass it as the `INLINES.HYPERLINK` override
rather than relying on `documentToReactComponents`' default, which emits
`data.uri` as-is. Sidenote bodies did rely on the default, which let a
`javascript:` href through in a note while the post body rejected the same href.
Do not copy the renderer to a second location — that drift is what caused the
gap.

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

A new content type in the space is not done until it is in `export.json` too.
`lib/api.ts` queries embedded types through `... on X` fragments, and an inline
fragment on a type the schema lacks is a GraphQL error that fails *every* post
query, not just the field it names — so a fork importing an export that is one
type behind gets a site that renders nothing. `Sidenote` shipped that way
between 24 and 26 July. `lib/contentful-fixtures.test.ts` now guards it, along
with editor interfaces, seed entries of unknown types, and dangling embeds.

Both files are exactly `json.dumps(indent=2, ensure_ascii=False)` plus a
trailing newline, so editing them via a JSON round-trip is byte-safe and will
not reformat anything you did not touch.

### Workflow constants

Protected main, squash merges only, one concern per PR, conventional commit
messages, descriptive branch names. The CI gate is `tsc --noEmit` + the vitest
suite. There is no lint script — `next lint` was removed in Next 16 — so do
not add or invoke one.
