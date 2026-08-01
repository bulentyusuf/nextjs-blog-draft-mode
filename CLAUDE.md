# CLAUDE.md

Standing context for Claude Code working in this repo. Read before audits, so
deliberate decisions are not re-raised as findings, and before implementation
work, so house conventions are not relearned by accident.

## Accepted trade-offs and known non-issues

These are intentional. Do not "fix" or re-flag them without a new reason.

### Both CSP loosenings in `script-src` are deliberate

**`'unsafe-inline'`.** Removing it requires a per-request nonce, which on the App
Router forces dynamic rendering and kills static optimisation, ISR and CDN HTML
caching (per the Next.js CSP docs). This is a single-author blog serving a
trusted CMS, with URL scheme allowlisting and escaped JSON-LD already in place,
so `unsafe-inline` is defence-in-depth here, not the front line. Trading the
static delivery model — the whole point of this codebase and of the forkable
template — for that marginal gain is not worth it. Revisit only if the site
begins rendering untrusted user-generated content.

**`'wasm-unsafe-eval'`.** Added for Pagefind, whose search core runs WebAssembly
in the browser. It permits wasm compilation only, not JS `eval`, so production
`script-src` is otherwise as strict as before. Removing it silently breaks search
in every Chromium browser. Do not re-flag either as CSP loosening.

### Search runs on Pagefind's Component UI, and its quirks are upstream

`app/search/` mounts Pagefind's web components with a house result template
(`<script type="text/pagefind-template">`). The markup and class names in that
template are ours; the components' keyboard and WAI-ARIA behaviour is upstream's
and is deliberately not reimplemented. Because the template is ours, search CSS
needs no `!important` — if a rule seems to require it, the template is the wrong
shape, so fix the template. The `pagefind` devDependency must stay at `^1.5.2` or
later; the Component UI does not exist in 1.3.x.

The legacy default UI (`@pagefind/default-ui`) and a bespoke React UI on the JS
API were both tried and abandoned. Do not propose either again — which also
settles the ranking quirks below, since every fix for them means owning the
result pipeline.

Those quirks are search-core behaviour, not UI faults. A term matching nothing is
truncated and retried, so "musk" returns posts containing "music" and "Munich"
with no highlighted term. The over-broad case is **not** fixed either and can
outrank the literal match — "contentful" surfacing pages containing only
"content" — because `ranking.termSimilarity` exists on the raw JS API but the
Component UI does not expose it. A client-side filter dropping results whose
excerpt contains no `<mark>` removes the ghosts, but only by owning that
pipeline; do not reintroduce it. Filed upstream (Pagefind/pagefind#1246,
https://github.com/Pagefind/pagefind/issues/1246) and accepted until a supported
fix lands. Do not re-flag either as a bug.

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
sliced from the art itself. That ground is a fixed cream island in both schemes
while every brand token flips, so **anything rendered on it uses literal hex
values in dark mode, never brand tokens** — including a border, caption or hover
state added later. `.search-lens-ground` fills `#FAF5F1` because
`--color-brand-bg` would paint a black glass, and the figure forces
`dark:text-[#A4243B]` because the lifted dark-mode crimson washes out on cream.

`LENS` is sliced from `PATH1` at render time so it can never drift from the art.
It is not a tuning knob, do not replace it with a hand-drawn shape. `p-8` on the
figure may be nudged by eye.

Tried and rejected, do not revisit: a rounded plate behind the whole figure
(reads as a floating card), a hand-tuned tilted ellipse (always a hair of spill
and a muddy handle), inverting the ink to cream (reads as a photographic
negative), stripping the face to keep only the glass (loses the joke).

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

### The lightbox trigger is gated on `mounted`, deliberately

`lib/lightbox-image.tsx` renders the image bare until mount, and only then wraps
it in the enlarge button. Rendered unconditionally, that button was focusable,
announced "Enlarge image" and did nothing with scripts off — a control that lies.
`mounted` gates the affordance, not the content, and a test asserts the server
HTML carries no `<button>`. Do not "simplify" the conditional away.

### Breadcrumbs are constrained to their page's own measure

`Container` is `max-w-5xl`. Pages whose content is also `max-w-5xl` render
`<Breadcrumb>` unwrapped; pages in a `max-w-2xl` column wrap it in
`<div className="mx-auto max-w-2xl">`, or it starts 176px left of the heading it
labels. Any new narrow page needs the wrapper. Same split as "Two h1
treatments" below, which lists which pages fall on each side.

On `/search` the wrapper must sit **before** the `<section>`, not inside it. The
emblem's visibility depends on
`.pagefind-scope:has(input:not(:placeholder-shown)) + .search-empty`, which needs
`.search-empty` to remain the immediate next sibling of `.pagefind-scope`.

### `/page/[page]` has no breadcrumb on purpose

Breadcrumbs describe section hierarchy; position is carried separately by
`app/page-context.tsx`, which renders a muted "Page N of M" and returns `null` on
page 1. That is why paginated category and author chains stop at the section and
never include a page number, and a crumb here would be a lone non-linked "Home"
marked `aria-current="page"`. Do not add one, or page numbers to those chains.

Known and accepted: on `/categories/[slug]/page/[page]`, `aria-current="page"`
sits on the section crumb, whose URL differs from the current one.

### Two smaller decisions, recorded

- The skip link's `focus:top-2` is computed, not a nudge: the link is 36px tall
  and the header band 52px, so 8px centres it. Recompute it if the header's
  `py-3` or the masthead's `text-lg` changes. The self-centring alternative was
  considered and rejected.
- Archive rows carry two tab stops each, title and category, because the category
  links to its category page as it does on the home page hero.

### Sidenotes carry several load-bearing constraints

A sidenote is a Contentful `Sidenote` entry embedded inline in a post's rich
text, pulled through the `... on Sidenote` fragment in `lib/api.ts` and rendered
by `lib/sidenote.tsx`. `lib/rich-text.tsx` returns `null` for a missing entry or
any inline embed that is not a `Sidenote`, so a deleted entry degrades to
nothing rather than throwing. Do not replace that guard with an error.

**Every element stays phrasing content** — `<span>`, `<sup>`, `<input>`,
`<label>`. `<details>`, `<summary>` and `<p>` each implicitly close an open
paragraph in the HTML parser, splitting the sentence the note sits in and
desyncing React's tree from the parsed DOM. That is why the toggle is not a
native disclosure, and why the note's own rich-text paragraphs render as
`.sidenote-para` spans blocked out in CSS. `display: inline` cannot undo a
parse-time split.

**The toggle needs no JavaScript.** Below 2xl a visually hidden checkbox drives
`:checked ~ .sidenote-body`, so `lib/sidenote.tsx` is a server component and the
feature ships zero client JS. Do not restore a `<button>` with React state:
notes are content, and that version left them unreadable with scripts off and
before hydration. The checkbox stays visually hidden rather than `display: none`
or it stops being focusable. `app/sidenote-enter-key.tsx` exists only because
checkboxes ignore Enter — an enhancement, never a dependency. The accepted cost
is that the control announces as a checkbox instead of carrying `aria-expanded`:
below 2xl the note is `display: none`, so a screen reader cannot read it in DOM
order and must operate the control, which makes a control that works without JS
worth more than the better ARIA state.

**All responsive display lives in the unlayered `.sidenote-*` rules** in
`globals.css`, never as Tailwind utilities in the component. Unlayered author
styles outrank everything in the `utilities` layer, so a `2xl:hidden` on a
`.sidenote-*` element silently loses — that is what once showed both markers at
2xl.

Numbering has two halves that must move together: a document-order index in
`rich-text.tsx` and a CSS counter in `globals.css`, both advancing once per note.
Both `<sup>`s are `aria-hidden` and the label takes its name from an `sr-only`
"Note N" — do not name a `sup` (it would double-announce) or drop the span (the
control would announce as a bare "1"). Tests in `lib/rich-text.test.tsx` guard
the phrasing-content rule, the absent `<button>`, and the numbering.

### Cross-document view transitions are CSS-only, and names must stay unique

`@view-transition { navigation: auto }` in `globals.css` opts into cross-document
transitions. Navigations here are full document loads, which is exactly what this
animates — no JS, no library, and browsers without support navigate instantly.

The spec requires transition names to be unique on a page, so
`createCoverNamer()` in `lib/view-transition-name.ts` hands out `cover-{slug}` at
most once per render pass: a post appearing twice, hero plus list, would
otherwise name the same cover twice, and a duplicate invalidates the entire
transition. Reset per request, do not memoise across requests. The 0.35s group
and 0.2s root durations are tuned, not defaults, and the `prefers-reduced-motion`
block disables the animation entirely.

### Tags are one glossary page, not a page per tag

`/tags` lists every tag with its posts grouped beneath it. There are no
`/tags/[slug]` routes, and that is **an editorial decision, not a technical
limit** — do not repeat the earlier version of this note, which had it the wrong
way round.

The editorial reason: a dozen pages carrying two to four posts each, differing
only in which links they hold, is thin content and a disappointing click. A
glossary puts the posts in front of the reader, which also lets the vocabulary be
finer-grained, because a two-post tag costs a heading rather than a whole page.
The sitemap carries one `/tags` URL accordingly.

Per-tag routes remain perfectly buildable if that ever changes. `getAllPosts` is
already grouped in memory here, so a `/tags/[slug]` route would use the same data
with `generateStaticParams`.

Separately true, and the reason the grouping is in memory rather than queried:
**Contentful's GraphQL cannot filter a collection on an `Array<Link>` field.**
There is no `where` for a multi-reference field, and the documented `linkedFrom`
workaround has no ordering, so neither can reproduce `date_DESC`. The REST CDA
does support the filter. This constrains _how_ you fetch posts for a tag; it does
not stop you rendering a page for one.

**A tag needs two posts to render anywhere.** `MIN_POSTS_PER_TAG` in
`lib/tags.ts` is read by both the glossary and the pills on a post page through
the same `visibleTagSlugs` helper, and they must stay on one helper: a pill for
a tag the glossary has hidden links to `/tags#slug`, an anchor that is not on
the page. A test asserts the two agree.

The glossary is `data-pagefind-ignore`. It repeats every post title once per
tag it carries, and Pagefind would weight those repeats above the posts
themselves — the same reasoning as the table of contents.

Pills sit below the article body rather than in the sidebar, which is `xl` and
up only; tags placed there would vanish on the viewports most people read on.

### Browse-page copy is editable, site identity is not

The standfirst and meta description on `/tags`, `/categories`, `/authors` and
`/archive` come from a `browseIntro` entry keyed by route slug. All four pages
therefore use `generateMetadata()` rather than a static `metadata` object, and
`lib/page-metadata.ts` holds the one copy of what were four byte-identical
metadata blocks.

**`getBrowseIntro` must be called with the same slug in `generateMetadata` and
in the component**, for the reason set out under "Post, category and author
fetchers are `cache()`-wrapped on purpose" below. Four pages, so getting it
wrong costs four extra requests rather than one.

A missing entry degrades: the standfirst is omitted, the meta description falls
back to `SITE_DESCRIPTION`. A fork with an empty space renders a heading, not a 500.

**`/archive` is deliberately different.** Its standfirst is generated from the
data — the post count and earliest month — and stays current on its own. The
`browseIntro` field there is an _override_, not a replacement: leave it empty
and the counter renders. That is why `standfirst` is optional on the content
type and the seeded Archive entry has none. Note the override is all-or-nothing
and the field is not trimmed, so whitespace in it would suppress the counter and
render an empty paragraph.

Site-level constants stay in code. `SITE_TITLE` alone is read by sixteen files
including `robots.txt`, the web manifest, JSON-LD and the feed — static routes
that never touch Contentful. Moving those behind a network fetch is a different
and much larger change than editing a standfirst; do not treat it as the obvious
next step.

### Other reviewed items, intentionally left as-is

- `data:` in `img-src` stays. It is needed for next/image blur placeholders, and
  the once-suggested `data:image/*` is not valid CSP (scheme-sources cannot be
  MIME-scoped).
- Currently no `X-Frame-Options` header. `frame-ancestors` in the CSP already
  covers every current browser, so this legacy header is low-value, not a gap.
- No rate limiting on the API routes. Secrets are compared with `timingSafeEqual`,
  so brute force is infeasible provided they are long and random — confirm the
  configured secrets are high-entropy.
- `dangerouslySetInnerHTML` for Shiki output in `lib/rich-text.tsx`. Input is
  trusted CMS content and the renderer allowlists URL schemes. Known and accepted.
- The sitemap filters CMS `Page` entries through `ROUTED_PAGE_SLUGS` in
  `app/sitemap-xml/route.ts`, so a newly published Page cannot inject a URL with
  no route into it. Only `/about` and `/privacy` are routed today, both
  hardcoded; add any new routed slug to that set. A root catch-all `[slug]`
  route was the alternative and needs collision care with `/posts`,
  `/categories` and `/authors`, so it was not taken.
- Dependabot ignores major version updates, deliberately, to avoid
  breaking-change churn for a solo maintainer. Advisory-driven security updates
  are a separate mechanism and still cover security-flagged majors, provided
  they are enabled in repo settings. Not a gap.
- CI actions are pinned to major tags (`@v4`), not commit SHAs. Accepted as low
  risk because they are first-party (`actions/checkout`, `github/codeql-action`).
  SHA-pinning is optional belt-and-braces, not adopted.
- `package.json` pins **postcss** `^8.5.23`, **sharp** `^0.35.3` and **uuid**
  `^11.1.1` through
  `overrides`, clearing advisories in copies `next` bundles and does not update
  (16.2.12 ships postcss 8.4.31 and pins `sharp ^0.34.5`; no release fixes
  either). They are the only reason `npm audit` has no high findings — do not
  remove them to "let next manage its own deps", and re-check them on every
  `next` bump, since an override silently pins a dependency the parent may have
  moved past. Forcing sharp is safe here because `next.config.js` sets
  `images.loader: "custom"`, so Next's optimiser never invokes sharp at all,
  which is also why the image optimisation advisories never applied.
- **uuid is held at `^11.1.1` by an override** (GHSA-w5hq-g745-h8pq), because
  `contentful-import` pins `contentful-batch-libs ^9.7.0` and never picks up the
  11.x line that already declares a safe uuid. Do not remove it, and do not
  reach for `contentful-cli` instead: it depends on `contentful-import` and
  drags the same 9.x chain in nested. Safe across the majors because
  `contentful-batch-libs` touches uuid in one place — `const { v4 } =
require("uuid")` in `add-sequence-header.js` — so re-check that call site if
  the override is ever bumped.

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

### Post, category and author fetchers are `cache()`-wrapped on purpose

`getPost`, `getPostAndMorePosts`, `getCategoryBySlug` and `getAuthorBySlug` are
wrapped in React's `cache()` in `lib/api.ts`. Next only memoises `GET`, and
`fetchGraphQL` issues `POST`, so without this every route that reads the same
entity in both `generateMetadata` and its page component fetched it twice.

**`generateMetadata` must call the same function the page calls, with the same
arguments.** `cache()` dedupes identical calls, not equivalent ones. On
`/posts/[slug]` both now call `getPostAndMorePosts`; switching the metadata pass
back to the slimmer `getPost` looks like an optimisation and is the exact change
that reintroduces the second request — it was made once, in #256, and the
duplication survived it because a smaller second query is still a second query.
`getPost` remains correct where nothing else fetches the post in the same pass,
as in `opengraph-image.tsx`, which renders in its own request.

Do not re-flag the duplicate fetch as a finding; it is fixed. Do not "simplify"
the metadata call back to a narrower helper.

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
fragment on a type the schema lacks is a GraphQL error that fails _every_ post
query, not just the field it names — so a fork importing an export that is one
type behind gets a site that renders nothing. `Sidenote` shipped that way
between 24 and 26 July. `lib/contentful-fixtures.test.ts` now guards it, along
with editor interfaces, seed entries of unknown types, and dangling embeds.

Both files are exactly `json.dumps(indent=2, ensure_ascii=False)` plus a
trailing newline, so editing them via a JSON round-trip is byte-safe and will
not reformat anything you did not touch.

### One Node version pin, in `engines.node`

`engines.node` in `package.json` is the only place the Node major is written,
and three consumers read it. Vercel selects the deployed runtime from it,
**overriding** the Node.js Version in Project Settings. npm checks it on
install. Both workflows resolve it through `actions/setup-node`'s
`node-version-file: package.json`, which reads `volta.node`, then
`devEngines.runtime`, then `engines.node`.

Do not add a second copy. A `.nvmrc` existed and was deleted for exactly that
reason, and hardcoding `node-version:` back into a workflow is the drift that
once left CI on Node 20 while local development ran 23, with neither on a
supported release. The cost of having one pin is that nvm cannot read
`package.json`, so local switching is manual — `nvm use 24`. That is the trade
that was chosen; do not reintroduce `.nvmrc` to undo it.

Keep it an exact major (`24.x`), never a range. A range resolves to the newest
available major and upgrades production silently, which Vercel warns about in
the build log. `.npmrc` sets no `engine-strict`, so a mismatch warns and never
blocks an install.

Two things sit outside the pin and move by hand:

- **`@types/node`** follows the **runtime** major, not latest. Its majors track
  Node's and latest runs ahead — 26.x while the runtime is 24 — so taking latest
  would typecheck code against APIs that do not exist at runtime. Same category
  of coupled-version trap as the `postcss` and `sharp` overrides above.
- **Vercel Project Settings** still holds a version, but `engines` overrides it,
  so it is a dormant fallback rather than a live setting. Keep it current
  regardless: deleting `engines` would silently drop the build back to it.

History, so the pin is not read as arbitrary: Node 20 reached end-of-life on
30 April 2026, and Vercel was erroring that deployments created on or after
2026-10-01 would fail to build.

### The content model lives in two spaces, and a schema change must reach both

`rczsnwq9z69e` is the live space. `18c3oqmr28q0` is **Demo Site**, which the
`demo-site` Vercel project builds from this same repo. A field or type added to
the live space and queried in `lib/api.ts` but absent from Demo Site fails that
build with `Cannot query field "x"`, and because a GraphQL error rejects the
whole query rather than the one selection, every page dies. Adding
`tagsCollection` took the demo down exactly this way.

So the order for any schema change is: **both spaces first, then merge.** The
repo's fixtures are a third copy — see the export/seed section above — which
makes three places to keep in step.

**Content type IDs are immutable.** The display name can be changed by an
editor at any time; the ID cannot, ever. Renaming means deleting and recreating
the type, which is trivial while nothing is published and a content migration
afterwards. Get the ID right before the first publish. `pageIntro` became
`browseIntro` on exactly this deadline.

The Contentful MCP connector can read, create and update, but **cannot publish,
unpublish or delete** in either space. Activating a type, publishing entries and
deleting anything are manual steps in the web UI. Entries also cannot be created
against a type that has not been activated, so a new type is always two trips:
activate, then populate.

### `demo-site` builds from this repo, off the `demo` branch

One repo, two Vercel projects. `demo-site` and the live site run **identical
code**, differing only in environment variables — a different Contentful space,
different tokens, a different `NEXT_PUBLIC_SITE_URL`. There is no source
divergence to manage, so do not fork the repo to separate them. Vercel allows 25
projects per repository, and one repo feeding several is the designed path, not
a workaround.

Two settings keep `demo-site` off `main`'s critical path:

- **Production Branch is `demo`**, not `main`, so merging a PR no longer
  triggers a demo production build
- **Ignored Build Step is "Only build production"**, so PR pushes skip it and
  the check reports as cancelled rather than building

Refresh the demo deliberately, when the template has changed in a way worth
showing:

```
git push origin main:demo
```

A fast-forward inside one repo, so it cannot conflict. **Do not automate this on
push to `main`** — that reinstates the per-merge build the two settings above
exist to remove. A scheduled workflow is the middle ground if the demo starts
looking stale.

Both settings date from 2026-08-01, after the account hit Vercel's deployment
cap. The caps are scoped to the **account**, not the project, so every project
draws on one allowance; and the hourly cap on Hobby (100) equals the daily one,
so a burst of merges can exhaust a day's worth inside an hour.

### What the fixtures guards do and do not catch

`lib/contentful-fixtures.test.ts` checks that the export ships every content
type the queries reference through `... on X`, that every field a fragment
selects exists on that type, that each type carries `publishedVersion` and an
editor interface, that seed entries only use types the export ships, that no
embed dangles, and that `seed.json` still deep-equals what the generator emits.

It **cannot** compare a field's _validations_ against the live space, because CI
has no Contentful credentials. `yml` was added to the live Code Block's language
list on 2026-07-14 and the export did not follow for a fortnight, so a fork
importing it got a Code Block that rejected YAML — and every test passed
throughout.

Keeping the export in step after a schema edit is therefore manual. The guards
will not remind you.

### Workflow constants

Protected main, squash merges only, one concern per PR, conventional commit
messages, descriptive branch names. The CI gate is `tsc --noEmit` + the vitest
suite + `npm run format:check`. There is no lint script — `next lint` was
removed in Next 16 — so do not add or invoke one. Prettier is formatting only,
not linting: run `npm run format` before pushing. `contentful/export.json` and
`seed.json` are in `.prettierignore` on purpose, because the generator writes
`seed.json` with `JSON.stringify(payload, null, 2)` and a formatter reflowing it
would put the committed file permanently at odds with `npm run build:seed`.
