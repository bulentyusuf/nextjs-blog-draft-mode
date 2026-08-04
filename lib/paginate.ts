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
