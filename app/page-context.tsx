// A muted "Page N of M" line for paginated listings. Renders nothing on page 1
// so the common case stays uncluttered; sits directly under the heading.
export default function PageContext({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  if (currentPage <= 1) return null;
  return (
    <p className="mt-2 text-sm text-brand-muted">
      Page {currentPage} of {totalPages}
    </p>
  );
}
