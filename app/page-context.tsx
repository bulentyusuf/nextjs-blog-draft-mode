// A muted "Page N of M" caption for paginated listings.
//
// It sits directly above the list, not inside the header, because position
// describes the *list* rather than the subject. In the header it split the
// heading from its standfirst — an editorial pair — with a piece of navigational
// chrome, and on author pages it landed under the portrait rather than under the
// heading it referred to, because it was a block sibling of the flex row holding
// both. Below the header it lines up with the posts it counts and reads as their
// caption, the opening counterpart to the pager that closes the list.
//
// Renders nothing on page 1, so the common case stays uncluttered and callers
// can render it unconditionally rather than each deciding when a page counts as
// paginated. That is what lets app/taxonomy-listing.tsx own it for all six
// taxonomy routes.
export default function PageContext({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  if (currentPage <= 1) return null;
  return (
    <p className="mx-auto max-w-5xl mb-4 text-sm text-brand-muted">
      Page {currentPage} of {totalPages}
    </p>
  );
}
