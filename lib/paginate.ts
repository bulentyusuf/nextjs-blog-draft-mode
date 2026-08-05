// Listing pagination arithmetic, in one place.
//
// Six taxonomy routes (category, tag and author, each paginated and not) plus
// the home index all did this by hand. Three expressions repeated that many
// times is three chances to get an off-by-one wrong in one copy only, and the
// symptom — a post missing from exactly one page of one taxonomy — is invisible
// until someone scrolls to it.
//
// Deliberately free of next/navigation: a route's 404 and redirect decisions
// are control flow and belong visible in the route. These are the sums.

import { POSTS_PER_PAGE } from "./constants";

/**
 * A `[page]` route segment as a page number, or null when it is not one.
 *
 * The four paginated routes each parsed this inline in their component and then
 * did not parse it at all in `generateMetadata`, which built a title and a
 * canonical out of the raw segment: `/page/abc` advertised
 * `<link rel="canonical" href=".../page/abc">` on a URL the component was about
 * to 404. Eight call sites, one predicate — the same argument the arithmetic
 * below is here for.
 *
 * Deliberately the exact test those components already made, so metadata and
 * render agree and nothing else changes. It is looser than the canonical form:
 * `/page/2.0` and `/page/%202` still parse as 2 and still emit their own
 * spelling as the canonical. Tightening that is a duplicate-URL decision, not
 * this one.
 */
export function parsePageParam(page: string): number | null {
  const pageNumber = Number(page);
  return Number.isInteger(pageNumber) && pageNumber >= 1 ? pageNumber : null;
}

/**
 * How many pages a listing of `count` items spans.
 *
 * Never returns 0. An empty listing still has a page 1 to render its empty
 * state on, and a totalPages of 0 would make every page number out of range.
 */
export function totalPagesFor(count: number): number {
  return Math.max(1, Math.ceil(count / POSTS_PER_PAGE));
}

/**
 * The slice of `items` belonging on `currentPage`, 1-indexed.
 *
 * Page 1 is items 0..N-1, so the unpaginated route and page 1 of the paginated
 * one produce the same slice — which is what makes the page-1 redirect in the
 * paginated routes a canonicalisation rather than a behaviour change.
 */
export function pageItems<T>(items: T[], currentPage: number): T[] {
  const start = (currentPage - 1) * POSTS_PER_PAGE;
  return items.slice(start, start + POSTS_PER_PAGE);
}

/**
 * Static params for pages 2..totalPages of one listing.
 *
 * Starts at 2 because page 1 lives at the unpaginated route and the paginated
 * one redirects there; generating it would pre-render a permanent redirect.
 */
export function pageRangeParams<T>(
  count: number,
  make: (page: string) => T,
): T[] {
  const params: T[] = [];
  for (let page = 2; page <= totalPagesFor(count); page++) {
    params.push(make(String(page)));
  }
  return params;
}
