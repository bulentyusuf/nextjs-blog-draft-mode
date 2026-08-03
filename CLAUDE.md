# CLAUDE.md

Standing context for Claude Code working in this repo. Read before audits, so
deliberate decisions are not re-raised as findings, and before implementation
work, so house conventions are not relearned by accident.

Entries are the short form. Where one names a file, that file's comment carries
the full argument — read it before changing what it explains.

## Accepted trade-offs and known non-issues

Intentional. Do not "fix" or re-flag without a new reason.

### Both CSP loosenings in `script-src` are deliberate

- **`'unsafe-inline'`** — removing it needs a per-request nonce, which on the App
  Router forces dynamic rendering and kills static optimisation, ISR and CDN HTML
  caching. Single-author blog, trusted CMS, URL schemes allowlisted and JSON-LD
  escaped already, so this is defence-in-depth, not the front line. Revisit only
  if the site starts rendering untrusted user-generated content.
- **`'wasm-unsafe-eval'`** — Pagefind's search core is WebAssembly. It permits
  wasm compilation only, not JS `eval`. Removing it silently breaks search in
  every Chromium browser.

### Search runs on Pagefind's Component UI, and its quirks are upstream

`app/search/` mounts Pagefind's web components with a house result template
(`<script type="text/pagefind-template">`). The markup and class names are ours;
the keyboard and WAI-ARIA behaviour is upstream's and is deliberately not
reimplemented. Because the template is ours, search CSS needs no `!important` —
if a rule seems to need it, the template is the wrong shape, so fix the
template. Keep the `pagefind` devDependency at `^1.5.2` or later; the Component
UI does not exist in 1.3.x.

The legacy `@pagefind/default-ui` and a bespoke React UI on the JS API were both
tried and abandoned. Do not propose either again — which also settles the
ranking quirks, since every fix for them means owning the result pipeline. Both
are search-core behaviour, not UI faults, and both are accepted until a
supported fix lands (Pagefind/pagefind#1246):

- A term matching nothing is truncated and retried, so "musk" returns posts
  containing "music" and "Munich" with no highlighted term.
- The over-broad case can outrank the literal match — "contentful" surfacing
  pages containing only "content" — because `ranking.termSimilarity` exists on
  the raw JS API and the Component UI does not expose it.
- A client-side filter dropping results whose excerpt has no `<mark>` removes
  the ghosts only by owning that pipeline. Do not reintroduce it.

Three more accepted properties:

- **The empty state is coupled to the input's placeholder.** `.search-empty` in
  `app/globals.css` hides the emblem via `:placeholder-shown`, so the
  placeholder must stay non-empty, and if the component's input ever moves into
  a shadow root the selector stops matching and the emblem never hides — drive
  the toggle from the instance's `results` event if that happens. Check after
  any Pagefind bump.
- **Index staleness between deploys.** The index is built by `postbuild`, so a
  post published through the webhook is live via ISR but absent from search
  until the next deploy. v1 trade-off; the fix is a Vercel deploy hook on the
  publish webhook, a workflow decision for Bulent, not an unprompted code
  change. `postbuild` writing to `public/` after `next build` works because
  Vercel packages the deployment once the build command finishes — not a broken
  pattern.
- **`/search` is `noindex`.** A search page is thin content and crawlers should
  reach posts directly. Not an SEO gap.

### The search emblem's dark-mode ground

`app/search/search-emblem.tsx` draws knockout artwork over a cream underlay
sliced from the art. That ground stays cream in both schemes while every brand
token flips, so **anything rendered on it uses literal hex in dark mode, never
brand tokens** — including a border, caption or hover state added later. Hence
`.search-lens-ground` at `#FAF5F1` and the figure's `dark:text-[#A4243B]`; the
tokens would paint a black glass and a washed-out ink respectively.

`LENS` is sliced from `PATH1` at render time so it cannot drift from the art —
not a tuning knob, do not replace it with a hand-drawn shape. `p-8` may be
nudged by eye. Tried and rejected: a rounded plate behind the figure, a
hand-tuned tilted ellipse, inverting the ink to cream, stripping the face to
keep only the glass.

### Brand colour exists in two places on purpose

The header colour is a CSS token in `app/globals.css` **and**
`BRAND_HEADER_COLOR` / `BRAND_HEADER_COLOR_DARK` in `lib/constants.ts`. Not a
DRY violation: the viewport `themeColor` and the web manifest are generated in
JS and cannot read CSS custom properties. Any change touches both files.

### Image loader passes only `w`, `q`, `fm=webp` by design

Cropping is CSS-side (`object-cover`). The absence of Contentful's
crop/focus/height params is a decision, not an omission.

### Three border roles, and they are not interchangeable

- **`--color-hairline`** — every rule between list items, cards and panels, via
  `border-hairline` / `divide-hairline`. It inverts on its own, so never add a
  `dark:` variant to an element using it, and never reintroduce bare `gray-200`
  borders: those drew bright white lines through every card list in dark mode,
  the defect this token replaced.
- **`--color-control-edge`** — `app/tag-pill.tsx` only, the one closed boundary
  around an interactive control, and **not** a divider despite having borrowed
  the divider token for a long time. That decides a contrast floor: a rule
  _between_ items is decorative and exempt, whereas this edge is the only thing
  identifying the control, whose text is `text-brand-muted` like the meta beside
  it. On the hairline token it sat at 1.14:1 light and 1.47:1 dark; at 70% of
  the muted ink it reads 3.15:1 and 4.37:1, clearing WCAG 1.4.11's 3:1. Two
  literal values with a dark override, deliberately **not** `color-mix()` over
  `var(--color-brand-muted)`: Tailwind flattens a `var()` inside `color-mix()`
  into an `@supports` block and leaves a literal light-mode fallback outside it,
  so an engine without `color-mix` paints the light edge on the dark page. The
  cost is that retuning the muted ink does not carry here.
  `lib/tag-pill.test.ts` recomputes both ratios from the stylesheet and asserts
  the tokens stay distinct, so "deduplicating" them fails loudly.
- **The `border-2` image frames** in `lib/rich-text.tsx` and
  `lib/lightbox-image.tsx` are a heavier role and keep their own
  `border-gray-300 dark:border-brand-dark/15` pairing. Leave them.

### One focus indicator, set in `@layer base`

`app/globals.css` defines a single `:focus-visible` rule: 2px
`var(--color-brand-crimson)` at 2px offset, inverting with the scheme. Do not
add `focus-visible:ring-*` or `focus-visible:outline-*` to components — focus
looking wrong usually means a missing `focus-visible:outline-hidden` before a
local override. Three exceptions, each with contrast reasoning in the file:

- **The coloured header and footer bands.** Crimson on the header navy `#1E3A8A`
  is about 1.07:1 and fails WCAG 1.4.11, so the masthead, nav links, search
  icon, skip link and footer links use `focus-visible:outline-hidden` plus a
  white ring. The `outline-hidden` is required: without it the base outline
  stacks underneath and still fails.
- **Code block scroll regions.** The `role="region"` elements in
  `lib/rich-text.tsx` draw inward with `focus-visible:outline-offset-[-2px]`,
  because their `overflow-hidden rounded-lg` parent clips anything outside. A
  ring is not an alternative: `ring-*` compiles to `box-shadow`, clipped the
  same way.
- **The two fixed controls.** `app/back-to-top.tsx` and
  `app/exit-preview-button.tsx` (draft mode only) use `focus:outline-hidden`
  plus a white ring on a `surface-dark` offset, because a `position: fixed`
  control floats over unknown ground. Once "simplified" and reverted; do not
  propose it again.

### One scroll offset, `scroll-padding-top` on `html`

`app/globals.css` sets `scroll-padding-top: 5rem` on the scroll container. It
replaced the per-heading `scroll-mt-*` utilities and is not additional to them.

**The container, not the target**, because `scroll-margin` is consulted only
when something scrolls _to_ a heading, while `scroll-padding` also covers the
browser scrolling a _focused_ element into view — tabbing to a link below the
fold used to land it under the 52px sticky header, WCAG 2.2's 2.4.11. Nothing
can opt out, which is the point.

**They are additive, so they cannot coexist.** A `scroll-mt-24` alongside would
park a heading at 176px rather than 80px, and `app/table-of-contents.tsx` reads
this offset to place its activation line, so a clicked entry would highlight the
section above it. `lib/toc-active.test.ts` fails on any `className` carrying
that utility, and asserts `FALLBACK_BAND_TOP_PX` in `lib/toc-active.ts` still
equals the stylesheet's `5rem` — `activationBandTop()` parses the computed
`scrollPaddingTop` off `document.documentElement` rather than hardcoding it, and
that constant covers only a computed `auto`.

5rem leaves 28px under the 52px band. Recompute it — and the skip link's
`focus:top-2`, which centres a 36px link in that band rather than being a nudge
— if the header's `py-3` or the masthead's `text-lg` changes.

### The skip link's target is focusable

`<main id="main" tabIndex={-1}>` in `app/layout.tsx`. Following a fragment moves
the sequential-focus starting point in current Chrome and Firefox but never
moves focus itself, and Safari has historically not moved it at all — leaving a
reader who had just skipped tabbing from the top again. `-1` is reachable
programmatically and never sequentially, so it adds no tab stop. Not redundant;
it is the half the browsers disagree on.

### The lightbox trigger is gated on `mounted`, deliberately

`lib/lightbox-image.tsx` renders the image bare until mount, then wraps it in
the enlarge button. Rendered unconditionally that button was focusable,
announced "Enlarge image" and did nothing with scripts off — a control that
lies. `mounted` gates the affordance, not the content, and a test asserts the
server HTML carries no `<button>`. Do not "simplify" the conditional away.

### One announced link per card, and one description per figure

Three doubled labels that each look like a missing one. All came out of the
accessibility audit; do not restore any.

- **A linked cover is hidden from assistive tech.** `app/cover-image.tsx` gives
  its `<Link>` `aria-hidden="true"` and `tabIndex={-1}`, which move together —
  `aria-hidden` on a focusable element is its own violation. Every call site
  passing `slug` or `href` renders a heading link to the same destination beside
  it, so naming the cover meant two adjacent links per card with identical
  accessible names. The component therefore has **no `title` prop**; the
  post-page cover passes neither prop, renders no link, and is unaffected. Focus
  can no longer land inside the cover, so the focus-within zoom went with it;
  the hover zoom stays.
- **Footer column labels are `<p>`, not `<h4>`.** As headings they skipped a
  level on every page whose deepest heading is an `h2`, which axe reports as
  `heading-order`. Promoting them to `h2` instead would flip them to the display
  face, since `app/globals.css` gives it to `h1`–`h3`. Both navs already carry
  `aria-label="Browse"` / `"Colophon"`, so the landmarks stay named.
- **An embedded figure's `alt` is empty whenever a caption renders.**
  Contentful's `description` is one field doing two jobs, so emitting it as both
  made every figure announce the same sentence twice — three times through the
  lightbox, whose trigger also read "Enlarge image: <desc>".
  `lib/lightbox-image.tsx` derives this from `caption` being present and falls
  back to `alt` when there is none. The build-time warning for a missing
  description still fires.

### Breadcrumbs, and the one page without them

- **Constrained to their page's own measure.** `Container` is `max-w-5xl`. Pages
  whose content is also `max-w-5xl` render `<Breadcrumb>` unwrapped; pages in a
  `max-w-2xl` column wrap it in `<div className="mx-auto max-w-2xl">`, or it
  starts 176px left of the heading it labels. Any new narrow page needs the
  wrapper — same split as "Two h1 treatments" below.
- **On `/search` the wrapper sits before the `<section>`**, not inside it:
  `.search-empty` must stay the immediate next sibling of `.pagefind-scope` for
  the emblem's `:has()` rule to fire.
- **`/page/[page]` has none on purpose: there is nothing to link to.** The
  pagination sets `basePath="/"`, so page 1 of this listing _is_ the home page.
  "Latest Posts" is a component of Home, not a level beneath it — which is why
  it renders as a section `h2` on `/` and becomes the `h1` only from page 2. A
  `Home / Latest Posts` trail would either point both crumbs at `/`, or claim
  page 2 is the section while page 1 sits at a different URL. By contrast
  `/about`, `/privacy`, `/search` and `/archive` carry two crumbs, a parent and
  the current page, which is the minimum rather than a shallow special case.
- **Position is carried separately** by `app/page-context.tsx`, a muted "Page N
  of M" that returns `null` on page 1 — which is why paginated category and
  author chains stop at the section. Do not add page numbers to those chains.
- Known and accepted: on `/categories/[slug]/page/[page]`, `aria-current="page"`
  sits on the section crumb, whose URL differs from the current one.
- Archive rows carry two tab stops each, title and category, because the
  category links to its category page as it does on the home hero.

### Sidenotes carry several load-bearing constraints

A `Sidenote` entry embedded inline in a post's rich text, pulled through the
`... on Sidenote` fragment in `lib/api.ts` and rendered by `lib/sidenote.tsx`.
`lib/rich-text.tsx` returns `null` for a missing entry or any inline embed that
is not a `Sidenote`, so a deleted entry degrades to nothing. Do not replace that
guard with an error.

**Every element stays phrasing content** — `<span>`, `<sup>`, `<input>`,
`<label>`. `<details>`, `<summary>` and `<p>` each implicitly close an open
paragraph in the HTML parser, splitting the sentence the note sits in and
desyncing React's tree from the parsed DOM. That is why the toggle is not a
native disclosure, and why the note's own paragraphs render as `.sidenote-para`
spans blocked out in CSS. `display: inline` cannot undo a parse-time split.

**The toggle needs no JavaScript.** Below 2xl a visually hidden checkbox drives
`:checked ~ .sidenote-body`, so `lib/sidenote.tsx` is a server component and the
feature ships zero client JS. Do not restore a `<button>` with React state:
notes are content, and that version left them unreadable with scripts off and
before hydration. The checkbox stays visually hidden rather than `display: none`
or it stops being focusable. `app/sidenote-enter-key.tsx` exists only because
checkboxes ignore Enter — an enhancement, never a dependency. Accepted cost: the
control announces as a checkbox rather than carrying `aria-expanded`, but below
2xl the note is `display: none`, so a screen reader must operate the control to
read it at all — working without JS is worth more than the better ARIA state.

**All responsive display lives in the unlayered `.sidenote-*` rules** in
`app/globals.css`, never as Tailwind utilities in the component: unlayered
author styles outrank the `utilities` layer, so a `2xl:hidden` on a
`.sidenote-*` element silently loses — that is what once showed both markers at
2xl.

Numbering has two halves that must move together: a document-order index in
`lib/rich-text.tsx` and a CSS counter in `app/globals.css`, both advancing once
per note. Both `<sup>`s are `aria-hidden` and the label takes its name from an
`sr-only` "Note N" — do not name a `sup` (double announcement) or drop the span
(the control announces as a bare "1"). `lib/rich-text.test.tsx` guards the
phrasing-content rule, the absent `<button>` and the numbering.

### Cross-document view transitions are CSS-only, and names must stay unique

`@view-transition { navigation: auto }` in `app/globals.css` opts in.
Navigations here are full document loads, which is exactly what this animates —
no JS, no library, and browsers without support navigate instantly.

The spec requires unique names per page, so `createCoverNamer()` in
`lib/view-transition-name.ts` hands out `cover-{slug}` at most once per render
pass: a post appearing twice, hero plus list, would otherwise name the same
cover twice, and a duplicate invalidates the entire transition. Reset per
request, do not memoise across requests. The 0.35s group and 0.2s root durations
are tuned, and the `prefers-reduced-motion` block disables the animation.

### Tags have their own pages, and `/tags` is the index

`/tags` lists every tag with its posts grouped beneath it; each tag name links
to `/tags/[slug]`, a landing page with a breadcrumb, an `h1`, the tag
description as standfirst and the paginated post list — the same relationship
`/categories` has with a category page.

**Do not propose going back** to pills linking to `#slug` anchors on `/tags`.
Thin content and SEO risk were both raised and settled: a tag page is no more
guilty than a category page, and Google consolidates duplicate listings rather
than penalising them. What decided it was orientation — an anchor drops the
reader past the breadcrumb, the `h1` and the standfirst with nothing saying what
page they are on. Section `id`s survive on the glossary so old anchors still
land, but nothing generates them.

- **Contentful's GraphQL cannot filter a collection on an `Array<Link>` field.**
  There is no `where` for a multi-reference field, and the documented
  `linkedFrom` workaround has no ordering, so neither reproduces `date_DESC`
  (the REST CDA does support the filter). That constrains _how_ you fetch posts
  for a tag, not whether a tag can have a page: `postsWithTag` in `lib/tags.ts`
  filters the `getAllPosts` result in memory, and `generateStaticParams`
  enumerates visible slugs from that same list.
- **It takes the posts, it does not fetch them.** The routes need the sitewide
  list anyway to test the slug against `MIN_POSTS_PER_TAG`, so a per-tag fetcher
  wrapping `getAllPosts` — the removed `getPostsByTag` — issued a second
  identical request per render, and `getAllPosts` is not `cache()`-wrapped, so
  nothing collapsed them. Do not reintroduce one.
- **A tag needs two posts to render anywhere.** `MIN_POSTS_PER_TAG` in
  `lib/tags.ts` is read through the one `visibleTagSlugs` helper by every
  surface, and they must stay on one helper. It gates three: the glossary, the
  sitemap, and `/tags/[slug]`, which **404s** below the threshold. A test
  asserts the surfaces agree.
- **`MoreStories` takes `visibleTags?: Set<string>`, not a boolean**, so pills
  cannot be switched on without answering which tags have a live page — an
  unfiltered pill can link to a 404. Compute the set from **all** posts:
  category and author pages fetch only their own slice, and counting across a
  slice hides tags the glossary shows. `getVisibleTagSlugs` in `lib/api.ts` does
  that fetch for those pages; the home pages already hold `getAllPosts` and pass
  `visibleTagSlugs(allPosts)` directly, since calling it twice is two requests.
  A tag page passes the set **minus its own slug**, because a pill repeating the
  tag every post on the page carries says nothing.
- The glossary is `data-pagefind-ignore`: it repeats every post title once per
  tag, and Pagefind would weight the repeats above the posts themselves — same
  reasoning as the table of contents.
- Pills sit below the article body, not in the `xl`-and-up sidebar where they
  would vanish on the viewports most people read on. They also appear on listing
  cards on the home index and its pages and on category, author and tag pages —
  not on the "Latest Posts" block at the foot of a post, which sits directly
  under that post's own tags and would say the same thing twice in one viewport.
  `/search` never had the option; it renders Pagefind's client-side templates
  and holds no tag data.
- **Tag a post as part of publishing it.** Every published post carries at least
  one today, so no card renders a gap. The first untagged publish is the first
  ragged card.

### Browse-page copy is editable, site identity is not

The standfirst and meta description on `/tags`, `/categories`, `/authors` and
`/archive` come from a `browseIntro` entry keyed by route slug. All four pages
therefore use `generateMetadata()` rather than a static `metadata` object, and
`lib/page-metadata.ts` holds the one copy of what were four byte-identical
metadata blocks. `getBrowseIntro` must be called with the same slug in
`generateMetadata` and in the component — see the `cache()` section below. A
missing entry degrades: the standfirst is omitted and the meta description falls
back to `SITE_DESCRIPTION`, so a fork with an empty space renders a heading, not
a 500.

**`/archive` is deliberately different.** Its standfirst is generated from the
data — post count and earliest month — and stays current on its own. The
`browseIntro` field there is an _override_: leave it empty and the counter
renders, which is why `standfirst` is optional on the content type and the
seeded Archive entry has none. The override is all-or-nothing and untrimmed, so
whitespace would suppress the counter and render an empty paragraph.

Site-level constants stay in code. `SITE_TITLE` alone is read by fourteen files
— the web manifest, the feed, and page metadata throughout — routes that never
touch Contentful. Moving those behind a network fetch is a much larger change
than editing a standfirst; not the obvious next step.

### The OG card's font is guarded by a real render, not a hash

`app/posts/[slug]/opengraph-image.font.test.tsx` renders the committed WOFF
through `next/og` and asserts a PNG comes out. `next/og` vendors an **older
Satori than the standalone `satori` package**, and that copy rejects OpenType
layout tables the standalone one parses fine — a font can pass a hand check
against `satori` and still throw `lookupType: 6 - substFormat: 2 is not yet
supported` on every card in production, which is what sank an earlier display
face whose `liga` feature carried a contextual lookup. **Any font check must
import from `next/og`, never from `satori`.** A hash pin is weaker: it catches a
swapped file without saying whether the new one renders. The sample string's
`fi` and `ffl` pairs are deliberate, since `liga` is where that lookup lived.

### Other reviewed items, intentionally left as-is

- `data:` in `img-src` stays — needed for next/image blur placeholders, and the
  once-suggested `data:image/*` is not valid CSP (scheme-sources cannot be
  MIME-scoped).
- No `X-Frame-Options`. `frame-ancestors` covers every current browser, so the
  legacy header is low-value, not a gap.
- No rate limiting on the API routes. Secrets are compared with
  `timingSafeEqual`, so brute force is infeasible provided they are long and
  random — confirm the configured secrets are high-entropy.
- `dangerouslySetInnerHTML` for Shiki output in `lib/rich-text.tsx`: trusted CMS
  input, and the renderer allowlists URL schemes.
- The sitemap filters CMS `Page` entries through `ROUTED_PAGE_SLUGS` in
  `app/sitemap-xml/route.ts`, so a newly published Page cannot inject a URL with
  no route. Only `/about` and `/privacy` are routed today, both hardcoded; add
  any new routed slug to that set. A root catch-all `[slug]` route was the
  alternative and needs collision care with `/posts`, `/categories` and
  `/authors`, so it was not taken.
- Dependabot ignores major version updates, to avoid breaking-change churn for a
  solo maintainer. Advisory-driven security updates are a separate mechanism and
  still cover security-flagged majors. Not a gap.
- CI actions are pinned to major tags (`@v4`), not commit SHAs — accepted as low
  risk because they are first-party.
- `package.json` pins **postcss** `^8.5.23` and **sharp** `^0.35.3` through
  `overrides`, clearing advisories in copies `next` bundles and does not update
  (16.2.12 ships postcss 8.4.31 and pins `sharp ^0.34.5`; no release fixes
  either). With the uuid override below they are the only reason `npm audit` has no high
  findings — do not remove them to "let next manage its own deps", and re-check
  them on every `next` bump, since an override silently pins a dependency the
  parent may have moved past. Forcing sharp is safe because `next.config.js`
  sets `images.loader: "custom"`, so Next's optimiser never invokes sharp —
  which is also why the image optimisation advisories never applied.
- **uuid is held at `^11.1.1` by an override** (GHSA-w5hq-g745-h8pq), because
  `contentful-import` pins `contentful-batch-libs ^9.7.0` and never picks up the
  11.x line that already declares a safe uuid. Do not remove it, and do not
  reach for `contentful-cli` instead — it depends on `contentful-import` and
  drags the same 9.x chain in nested. Safe across the majors because
  `contentful-batch-libs` touches uuid in one place, `add-sequence-header.js`,
  so re-check that call site if the override is ever bumped.

## House conventions

### Two faces, three roles, and no family named directly

`app/globals.css` defines `--font-display` (Bricolage Grotesque), `--font-body`
(Literata) and `--font-ui`, and points `--default-font-family` at the body face
so Preflight puts it on `<body>`; Tailwind generates the three utilities from
those tokens. **Nothing in a component names a family** — that is what kept the
last three swaps to a handful of lines. `--font-ui` resolves to the same family
as `--font-display` by choice, and keeps its own token so handing UI back to a
face of its own stays one line; do not deduplicate them. There is no `font-sans`
utility any more — that class now silently does nothing.

- **Display** — headings and the two mastheads, applied by the base-layer rule.
  Do not add `font-display` to an h1, h2 or h3.
- **Body** — the default: prose and all the meta around it, dates, bylines,
  breadcrumbs, excerpts, captions, figure text. Meta in the reading face is
  ordinary editorial practice and is what makes a page cohere; a stray `font-ui`
  on a date is a regression, not a tidy.
- **UI** — chrome that must not compete with prose, and this is the whole list:
  the two header nav links and the header tagline; the footer column labels,
  links and legal line; the two table-of-contents labels; the "Explore with AI"
  label; the tag pill; the count spans in `app/archive/page.tsx` and
  `app/tags/page.tsx`; and every small uppercase letterspaced label — the error
  eyebrows in `app/error.tsx` and `app/not-found.tsx`, the one in
  `app/author-bio-card.tsx`, the "read more" links on the category and author
  indexes, and the category links on archive rows. **Uppercase plus
  letterspacing is the tell**, and those surfaces were missed when the roles
  first split because the list was written from the header, footer and sidebar.
  If a new surface seems to want UI, leave it on the body face and raise it
  rather than extending the list quietly.

`app/global-error.tsx` is deliberately excluded: it replaces the root layout and
renders its own `<html>` without the font variables, so `font-ui` there would
resolve to an undefined custom property and style nothing. The two sidebar
labels, table of contents and "Explore with AI", must stay identical in face,
size and tracking — they sit one above the other in the same column, so any
difference reads as an accident.

A replacement display face has to clear three bars. It must hold the
**grotesque-against-serif contrast**: the face before this one was a
transitional serif like Literata, so at heading sizes an h2 dissolved into the
paragraph under it. Its **`opsz` axis must reach roughly 45pt**, what headings
hit at `lg:text-6xl`, or it clamps and the browser scales a text master, which
reads flat — Bricolage runs 12–96, Literata 7–72. And the body face must keep a
**true italic**, which is why the `italic` classes on `<em>` and the figure
captions in `lib/rich-text.tsx` and `lib/lightbox-image.tsx` stay; Bricolage is
roman only. Bricolage's `wdth` axis (75–100) is deliberately not requested — it
costs bytes and nothing reaches for it, but it is why this face suits the de-DE
work, where a long compound can narrow instead of dropping a size step.

### The prose column is never measured in `ch`

`@utility prose` in `app/globals.css` neutralises the typography plugin's
`max-width`; the measure lives on the `max-w-2xl` parents instead. The plugin
measures in `ch`, keyed to the current font's zero glyph, so the column silently
resizes on any body-face swap — Inter's zero is 0.6309em against Literata's
0.5790em, an 8% narrowing with no width anywhere in the diff.
`app/globals.measure.test.ts` guards the override and the absence of any
`ch`-measured column.

### Two h1 treatments, chosen by column width

Full-width browsing and content pages (home, posts, archive, categories,
authors, pagination) use the full ramp:
`text-4xl leading-tight md:text-5xl lg:text-6xl`. Narrow document pages in a
`max-w-2xl` column (about, privacy, search) cap at `mb-6 text-4xl md:text-5xl`,
no `leading-tight` — a 6xl heading in a 42rem measure looks enormous despite
identical classes, and that mismatch is the tell. Any new page picks the
treatment matching its column, not the nearest existing h1. The same
`max-w-5xl` versus `max-w-2xl` split governs breadcrumb placement.

### Every rich-text hyperlink goes through `lib/rich-text-link.tsx`

`renderHyperlink` is the only hyperlink renderer on the site. It allowlists URL
schemes (`http`, `https`, `mailto` — anything else degrades to plain text,
including `javascript:` and the protocol-relative forms) and gives cross-origin
links `target="_blank"`, `rel="noopener noreferrer"` and the screen-reader
new-window hint.

Any new rich-text surface must pass it as the `INLINES.HYPERLINK` override
rather than relying on `documentToReactComponents`' default, which emits
`data.uri` as-is. Sidenote bodies did rely on the default, which let a
`javascript:` href through in a note while the post body rejected the same href.
Do not copy the renderer to a second location — that drift caused the gap.

### The site's locale is en-GB, everywhere

The Contentful default locale is `en-GB`, dates format via date-fns `enGB`, and
the html `lang`, OG locale and feed metadata follow. Any `en-US`, `en_US` or
American date formatting in code or metadata is a regression, not a style choice
— a previous PR existed solely to purge these. German (`de-DE`) localisation is
in progress; until it lands, do not add locale plumbing speculatively.

`contentful/export.json` is the deliberate exception and ships `en-US` as its
default locale. It is the **template's** content model, imported by people
forking this repo into their own space, not a mirror of the live space. Do not
"correct" it.

### Single-entry fetchers are `cache()`-wrapped on purpose

Six fetchers in `lib/api.ts` are wrapped in React's `cache()`: `getPost`,
`getPostAndMorePosts`, `getBrowseIntro`, `getTagBySlug`, `getCategoryBySlug` and
`getAuthorBySlug`. Next only memoises `GET` and `fetchGraphQL` issues `POST`, so
without this every route reading the same entity in both `generateMetadata` and
its page component fetched it twice.

**`generateMetadata` must call the same function the page calls, with the same
arguments** — `cache()` dedupes identical calls, not equivalent ones. On
`/posts/[slug]` both call `getPostAndMorePosts`; switching the metadata pass
back to the slimmer `getPost` looks like an optimisation and is the exact change
that reintroduces the second request, because a smaller second query is still a
second query. The four browse pages carry the same requirement for
`getBrowseIntro`, so getting it wrong there costs four extra requests rather
than one. Do not re-flag the duplicate fetch as a finding; it is fixed. Do not
"simplify" a metadata call back to a narrower helper.

`getPost` stays correct where nothing else fetches the post in the same pass, as
in `app/posts/[slug]/opengraph-image.tsx`, which renders in its own request and
carries its own `generateStaticParams` — colocated metadata routes do not
inherit the page's, and without one the card route was the only dynamic non-API
route on the site, paying for a query, a Satori render and a cover fetch per
scrape. The duplicate `getAllPosts` across the two files is the accepted cost,
one listing query per build. Leave `dynamicParams` at its default `true`, so a
post published through the webhook still gets a card on demand.

### Every unbounded collection query pages, and must keep selecting `total`

Contentful returns at most 100 items and puts the real count only in `total`. A
query asking for neither took the first 100 and said nothing — the worst shape a
limit can have, because the 101st post would drop out of the sitemap, the feed,
the archive, the tag glossary, the home pagination and `generateStaticParams`
simultaneously, with no error and no missing page in the build log.

`fetchAllCollectionItems` in `lib/api.ts` pages through instead, and the seven
unbounded fetchers go through it: `getAllPosts`, `getAllPages`, `getAllTags`,
`getAllCategories`, `getAllAuthors`, `getPostsByCategory`, `getPostsByAuthor`.
Below 100 items it is exactly one request — the loop exits on the first pass.

**A query handed to it must accept `$limit: Int!` and `$skip: Int!`, pass both
to the collection, and select `total` beside `items`.** Drop `total` and there
is nothing to page against: the first response silently becomes the whole
result, the bug this replaced. A new list query belongs here too.

The page size stays at Contentful's own 100 rather than the documented 1000
maximum: a bigger page means fewer round-trips but a higher per-query complexity
score, and CI has no credentials to check the complexity budget — the same
reason the fixtures guard cannot compare field validations. Raise it only
against a real measurement. Deliberately **not** paged:
`getRecentPostsByCategory`, capped on purpose to tease a few posts, and every
single-entry fetcher on `limit: 1`.

### Contentful export/seed files are load-bearing and brittle

`contentful/export.json` and `contentful/seed.json` back the forkable-template
story. Hard-won rules: content types and seed entries must carry
`sys.publishedVersion` or they import as inactive drafts GraphQL cannot see;
seed assets must use `file.url`, never `file.upload` (upload aborts the entire
import); a failed or partial import must be retried into a brand-new empty
space, never re-run over a partially-activated one. Do not "tidy" these files.

A new content type in the space is not done until it is in `export.json` too.
`lib/api.ts` queries embedded types through `... on X` fragments, and an inline
fragment on a type the schema lacks is a GraphQL error that fails _every_ post
query, not just the field it names — so a fork importing an export one type
behind gets a site that renders nothing. `Sidenote` shipped that way for two
days; `lib/contentful-fixtures.test.ts` now guards it.

Both files are exactly `JSON.stringify(value, null, 2)` plus a trailing newline
(equivalently Python's `json.dumps(indent=2, ensure_ascii=False)`), so editing
them via a JSON round-trip is byte-safe and reformats nothing you did not touch.

### One Node version pin, in `engines.node`

`engines.node` in `package.json` is the only place the Node major is written,
and three consumers read it: Vercel selects the deployed runtime from it,
**overriding** the Node.js Version in Project Settings; npm checks it on
install; both workflows resolve it through `actions/setup-node`'s
`node-version-file: package.json`, which reads `volta.node`, then
`devEngines.runtime`, then `engines.node` — so adding either of the first two
silently takes precedence.

Do not add a second copy. A `.nvmrc` existed and was deleted for exactly that
reason, and hardcoding `node-version:` back into a workflow is the drift that
once left CI on Node 20 while local development ran 23. The cost is that nvm
cannot read `package.json`, so local switching is manual — `nvm use 24`. Keep it
an exact major (`24.x`), never a range: a range resolves to the newest available
major and upgrades production silently. `.npmrc` sets no `engine-strict`, so a
mismatch warns and never blocks an install.

Two things sit outside the pin and move by hand:

- **`@types/node`** follows the **runtime** major, not latest. Its majors track
  Node's and latest runs ahead — 26.x while the runtime is 24 — so taking latest
  would typecheck against APIs that do not exist at runtime. Same
  coupled-version trap as the postcss and sharp overrides.
- **Vercel Project Settings** still holds a version, but `engines` overrides it,
  so it is a dormant fallback. Keep it current regardless: deleting `engines`
  would silently drop the build back to it.

The major is not arbitrary: Node 20 reached end-of-life on 30 April 2026, and
Vercel was warning that deployments created on or after 2026-10-01 would fail to
build on it.

### The content model lives in two spaces, and a schema change must reach both

`rczsnwq9z69e` is the live space. `18c3oqmr28q0` is **Demo Site**, which the
`demo-site` Vercel project builds from this same repo. A field or type added to
the live space and queried in `lib/api.ts` but absent from Demo Site fails that
build with `Cannot query field "x"`, and because a GraphQL error rejects the
whole query rather than the one selection, every page dies — adding
`tagsCollection` took the demo down exactly this way.

So the order for any schema change is: **both spaces first, then merge, then
sync `demo`.** The repo's fixtures are a third copy, making three places to keep
in step. That last step matters more than it looks: `demo-site` no longer builds
on merges to `main`, so nothing checks the demo space against the queries until
`demo` moves. `.github/workflows/sync-demo.yml` runs the same push weekly, so a
forgotten step surfaces within seven days rather than on an unrelated future
sync.

**Content type IDs are immutable.** The display name can be changed by an editor
at any time; the ID cannot. Renaming means deleting and recreating the type —
trivial while nothing is published, a content migration afterwards. Get the ID
right before the first publish; `pageIntro` became `browseIntro` on exactly this
deadline.

**Treat the Contentful MCP connector as read-only until proved otherwise.** Its
write permissions come from the MCP app installation in each space, not from
this repo, so what it can do is a property of that space's configuration and can
be narrower than the tool list suggests — `update_asset` on `rczsnwq9z69e:master`
is refused outright, so adding a description to an existing asset is a web-UI
job. Publishing, unpublishing and deleting are unavailable regardless;
activating a type, publishing entries and deleting anything are manual steps in
the web UI. Entries cannot be created against a type that has not been
activated, so a new type is always two trips: activate, then populate.

### `demo-site` builds from this repo, off the `demo` branch

One repo, two Vercel projects running **identical code**, differing only in
environment variables — a different Contentful space, tokens and
`NEXT_PUBLIC_SITE_URL`. There is no source divergence to manage, so do not fork
the repo to separate them; one repo feeding several projects is the designed
path (Vercel allows 25 per repository).

Three dashboard settings keep `demo-site` off `main`'s critical path. None is
expressible in this repo and all are easy to lose, since a dashboard setting
leaves no trace in the codebase and survives no project rebuild:

- **Production Branch is `demo`**, not `main`, so merging a PR no longer
  triggers a demo production build. Settings → **Environments** →
  **Production** → **Branch Tracking**, not Settings → Git.
- **Ignored Build Step is "Only build production"** (Settings → **Build and
  Deployment**), so PR pushes report as cancelled rather than building. Leave
  it: with no preview deployments being created it has nothing to catch, but it
  still guards the production path and costs nothing.
- **Preview → Branch Tracking is disabled** (Settings → **Environments** →
  **Preview**). Off rather than narrowed, because Preview is a catch-all that
  cannot be scoped to a branch: with `demo` taken by Production its selector is
  greyed out at "All unassigned branches", so the toggle is the only lever. Left
  enabled it created a `demo-site` deployment for every push to `main` and every
  PR branch, which the Ignored Build Step then cancelled — those burn no build
  minutes but are real deployment objects, and the cap is on deployments.
  Nothing was lost: no such preview was ever usable, the environment has no
  domains, and a one-off preview is still reachable with `vercel deploy`. **A
  missing `Preview – demo-site` check is the expected state.**

`demo` is protected by its own GitHub ruleset, `demo branch protection`
(id 20204826), with exactly two rules: `deletion` and `non_fast_forward`.
**Deliberately not `pull_request`** — both routes onto this branch push directly
(the manual push below and `.github/workflows/sync-demo.yml` with
`GITHUB_TOKEN`), so requiring a PR would protect the branch by making it
unmaintainable. Copying `main`'s ruleset across is the obvious wrong move. The
two rules that are there close the two ways it can actually be damaged: deleting
it breaks demo-site's Production branch tracking, and `non_fast_forward` moves
an invariant the sync workflow can only assert in a shell script onto the
server. A genuine fast-forward is unaffected.

Refresh the demo deliberately, when the template has changed in a way worth
showing:

```
git push origin main:demo
```

A fast-forward inside one repo, so it cannot conflict. **Do not automate this on
push to `main`** — that reinstates the per-merge build these settings exist to
remove; a scheduled workflow is the middle ground if the demo goes stale.
Vercel's deployment caps are scoped to the **account**, not the project, and the
hourly cap on Hobby (100) equals the daily one, so a burst of merges can exhaust
a day's worth inside an hour.

### What the guards catch, and what they cannot

Three suites carry the invariants above. Every check in them has already caught
a real defect: do not weaken one to make a change pass.

**`lib/contentful-fixtures.test.ts`** — the export ships every content type the
queries reference through `... on X`; every field a fragment selects exists on
that type; each type carries `publishedVersion` and an editor interface; seed
entries only use types the export ships; no embed dangles; and
`contentful/seed.json` still deep-equals what the generator emits. It **cannot**
compare a field's _validations_ against the live space, because CI has no
Contentful credentials — a language added to the live Code Block took a
fortnight to reach the export, with every test passing throughout. Keeping the
export in step after a schema edit is manual; the guards will not remind you.

**`app/a11y.test.tsx`** runs axe-core over the real components composed inside
the real `RootLayout` — the shipped header, footer, skip link and landmarks, not
a fixture approximating them. It uses `renderToReadableStream`, since
`renderToStaticMarkup` resolves neither the async layout nor the `CoverImage`
nested in it. Beyond axe's own rules (chiefly `heading-order`) it checks
contiguous heading levels, a captioned figure describing itself once, and
**duplicate announcements** — two links inside `<main>` sharing both a
destination and an accessible name, which axe does not implement and which was
every listing card announcing one post twice. Scoped to `<main>` on purpose: the
header and footer both link to `/categories` as "Categories", ordinary chrome.
`color-contrast` and `target-size` are disabled and cannot be otherwise here —
both need a layout engine, and jsdom computes no boxes and applies no
stylesheet, so axe would report a false pass; contrast is covered better by
`lib/tag-pill.test.ts` recomputing the ratios from the tokens. A finding that
needs real layout needs a browser. The mocks (`next/font/google`,
`next/headers`, the Vercel analytics pair, `lib/blur`) exist because each
reaches the network or the request scope at module load.

**`lib/docs-consistency.test.ts`** is the prose analogue — documentation is
otherwise the only artefact here with no verification path — and it checks the
**names** of things: every `npm run <script>` named in CLAUDE.md or README.md
exists in `package.json`; every repo-relative path either doc backticks exists
on disk; the CI-gate sentence below names every command
`.github/workflows/ci.yml` runs; and `SITE_REPO_URL`, README.md and
`public/llms.txt` agree on the repository URL, with no pre-rename
`nextjs-blog-draft-mode` left on `github.com`. That last one exists because
GitHub **redirects** the old URL, so a missed reference keeps working and stays
wrong indefinitely; README.md line 5 is the deliberate exception, linking
Vercel's upstream _template_ at their own URL, which is why the check is scoped
to `github.com`. It **cannot verify a claim** — a sentence can name a real file
and describe it wrongly, and only a reader catches that.

### Documentation is excluded from Tailwind's source scanning

`app/globals.css` carries `@source not "../CLAUDE.md"` and the same for
`README.md`. Tailwind v4 detects sources automatically — every file `.gitignore`
does not exclude is scanned for class-name candidates, markdown included — so a
utility merely **named** in prose is generated as though a component used it.
Not hypothetical: this file's own sentence about `scroll-mt-*` was emitting that
rule into production after every component using it had been removed.

The exclusions work and do not solve the whole problem. Two categories remain,
and only one is worth acting on:

- **A literal class name in a source comment.** `app/` and `lib/` are scanned
  and cannot be excluded, so a comment naming a real utility regenerates it.
  That is why the notes in `app/globals.css` and `lib/toc-active.test.ts` say
  "the utility" instead of spelling it, and why a test there asserts the literal
  appears nowhere under `app/` or `lib/`, assembling its needle at runtime so
  the assertion is not itself the offence. Worth fixing: a class name is not
  prose.
- **Ordinary English that happens to be a utility name.** `.collapse`,
  `.invisible`, `.static` and `.text-wrap` ship because comments contain those
  words; `.resize` ships because `app/table-of-contents.tsx` calls
  `addEventListener("resize", …)`, which is real code. **Do not chase these** —
  contorting comments or code to avoid English is a far worse trade than a few
  dozen bytes, and the scanner cannot be taught the difference.

So: exclude pure-prose files, because it is free; never name a literal utility
in a source comment; leave the incidental matches alone.

**A caution on verifying this.** Compiling `app/globals.css` locally through
`@tailwindcss/postcss` reports every one of these as absent, including the two
that demonstrably ship — its scan root is narrower than `next build`'s. That
false negative is how an incomplete fix was once reported as complete. The only
trustworthy check is the deployed bundle:

```
curl -s https://beuseful.net | grep -oE '/_next/static/chunks/[a-z0-9]+\.css'
```

### Workflow constants

Protected main, squash merges only, one concern per PR, conventional commit
messages, descriptive branch names.

The CI gate is exactly three steps, in this order: `npm run format:check`,
`npm test`, `npm run build` — see `.github/workflows/ci.yml`, which
`lib/docs-consistency.test.ts` holds this sentence against. Note what that means
locally: **there is no separate typecheck step in CI**, so typechecking happens
inside `npm run build`, and a change that satisfies `tsc --noEmit` and the
vitest suite has still not met the gate. Running `tsc --noEmit` is a fast local
proxy, not the thing itself.

There is no lint script — `next lint` was removed in Next 16 — so do not add or
invoke one. Prettier is formatting only, not linting: run `npm run format`
before pushing. `contentful/export.json` and `contentful/seed.json` are in
`.prettierignore` on purpose, because the generator writes the seed with
`JSON.stringify(payload, null, 2)` and a formatter reflowing it would put the
committed file permanently at odds with `npm run build:seed`.
