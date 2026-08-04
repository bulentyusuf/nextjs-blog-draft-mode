import type { ReactNode } from "react";
import Container from "./container";
import MoreStories from "./more-stories";
import Pagination from "./pagination";
import Breadcrumb, { type Crumb } from "./breadcrumb";
import { jsonLdHtml } from "@/lib/json-ld";
import type { CardPost } from "@/lib/types";

/**
 * The shell every taxonomy listing shares — a category, tag or author page, in
 * either its paginated or its unpaginated form.
 *
 * Those six routes rendered the same tree with the same props and differed only
 * in their `<header>`: a plain heading for a category or tag, a heading beside a
 * portrait for an author, with the position line and the standfirst arranged
 * differently on page 1 than on later pages. So the header is `children` rather
 * than a set of props. Passing `name`, `description`, `avatar` and `pageNumber`
 * and reassembling them here would mean a conditional per difference, which is
 * how a shared component becomes harder to read than the six copies it replaced.
 *
 * What is genuinely uniform lives here: the container, the breadcrumb, the
 * listing itself, the pager, and the empty state.
 */
export default function TaxonomyListing({
  crumbs,
  children,
  posts,
  currentPage,
  totalPages,
  visibleTags,
  basePath,
  emptyMessage,
  jsonLd,
}: {
  crumbs: Crumb[];
  /** The `<header>`'s contents: the heading, and whatever belongs beside it. */
  children: ReactNode;
  /** This page's slice, not the whole listing. */
  posts: CardPost[];
  currentPage: number;
  totalPages: number;
  /** Tag slugs with a live page, so no pill can link to a 404. */
  visibleTags: Set<string>;
  /** Page 1's URL. Pagination appends `/page/N` for the rest. */
  basePath: string;
  /**
   * Shown instead of the listing when there is nothing to show. Omitted by the
   * routes where empty is unreachable — a tag page 404s below its post
   * threshold, and a paginated page 404s past its last page — so leaving it out
   * asserts that, rather than quietly rendering an empty list.
   */
  emptyMessage?: string;
  /** Serialised into a ld+json script when present. Only the author page has one. */
  jsonLd?: unknown;
}) {
  return (
    <Container>
      {jsonLd !== undefined && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }}
        />
      )}
      <Breadcrumb items={crumbs} />
      <header className="mx-auto max-w-5xl mb-6 md:mb-8">{children}</header>

      {emptyMessage !== undefined && posts.length === 0 ? (
        <p className="mx-auto max-w-5xl text-lg text-brand-muted">
          {emptyMessage}
        </p>
      ) : (
        <>
          <MoreStories
            morePosts={posts}
            variant="list"
            heading={null}
            priorityFirst
            visibleTags={visibleTags}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath={basePath}
          />
        </>
      )}
    </Container>
  );
}
