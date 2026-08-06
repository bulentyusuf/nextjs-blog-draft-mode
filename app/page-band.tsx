import Breadcrumb, { type Crumb } from "./breadcrumb";

/**
 * The masthead band on browsing pages — the four section fronts and every
 * category, tag and author listing.
 *
 * Full-bleed on purpose, so it must sit OUTSIDE Container rather than inside
 * it, and it carries its own `max-w-5xl px-5` inner column so the h1's left
 * edge lines up with the cards that follow. The band is a sibling of the
 * sticky header, never part of it: on scroll the band leaves while the 52px
 * bar stays pinned. The band is a step darker than the bar, not the same
 * colour, so the seam where they meet is deliberate — 1.60:1 in light, 1.55:1
 * in dark. Both blues move between schemes to hold that step; globals.css
 * carries why.
 *
 * The axis is what the reader is doing, not how deep they have clicked: every
 * browsing surface bands, every reading surface stays on cream, so a
 * navy-to-cream step never happens without also crossing from a list into an
 * article.
 *
 * Every text colour inside is solid white, inherited from the root rather than
 * named per element — see the comment on the wrapper. No `text-white/N` — on brand-band
 * white is 16.60:1 light and 12.61:1 dark, whereas white/85 on the old header
 * navy was 7.93 light and 6.38 dark, and the second of those missed the AAA
 * floor that lib/palette-contrast.test.ts already enforces sitewide. Hierarchy
 * comes from size and face instead of tint, which the two-face system supports
 * better than an opacity ladder anyway. Decorative marks — the crumb
 * separators, the author portrait's ring — may still be translucent: they are
 * aria-hidden or non-textual and exempt under 1.4.3.
 *
 * No crimson anywhere inside. brand-crimson on brand-header is 1.35:1 in
 * light, so the accent that carries links everywhere else cannot come in here.
 */
export default function PageBand({
  crumbs,
  children,
}: {
  crumbs: Crumb[];
  /** The band's editorial contents — an h1, a standfirst, whatever sits beside them. */
  children: React.ReactNode;
}) {
  return (
    // text-white sits on the ROOT so the whole subtree inherits it. That is
    // load-bearing, not belt-and-braces: <body> carries text-brand-dark, so
    // anything placed in here without a colour class of its own inherits body
    // ink instead. The h1 shipped exactly that way and rendered at 1.01:1 on
    // the light band — invisible — while looking perfect in dark, where
    // brand-dark IS the off-white ink at 10.61:1. Children may still name
    // text-white for clarity; none of them may rely on doing so.
    <div className="bg-brand-band text-white">
      {/* The band adds ONE thing to the page: this inset. Everything between
          the breadcrumb and the standfirst is the spacing the unbanded pages
          already had — the nav's own mb-4, then the h1's mb-3 — and it stays
          that way. There is no `mt` on the header: adding one here sat on top
          of the breadcrumb's margin and pushed the heading 36px down a page
          that has always used 16.

          Symmetric, because the band is a block and an uneven inset reads as a
          mistake. Kept tight deliberately: the band is a masthead, not a hero,
          and every pixel here pushes the first post further down. What sits
          below the bottom edge is budgeted separately in app/browse-page.tsx,
          because it depends on whether the content brings its own. */}
      <div className="max-w-5xl mx-auto px-5 py-5 md:py-6">
        <Breadcrumb items={crumbs} tone="dark" />
        <header>{children}</header>
      </div>
    </div>
  );
}
