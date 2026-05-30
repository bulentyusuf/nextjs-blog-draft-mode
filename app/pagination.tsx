import Link from "next/link";

// Server component. Renders numbered page links plus prev/next.
// basePath is "/" for the index or "/categories/<slug>" for a category.
// Page 1 lives at basePath itself; pages 2+ live at basePath + "/page/<n>".
export default function Pagination({
  currentPage,
  totalPages,
  basePath,
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const hrefFor = (page: number) => {
    if (page <= 1) {
      return basePath;
    }
    const prefix = basePath === "/" ? "" : basePath;
    return `${prefix}/page/${page}`;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const cell =
    "inline-flex h-10 min-w-10 items-center justify-center rounded-md px-3 text-base transition-colors duration-200";

  return (
    <nav aria-label="Pagination" className="mx-auto max-w-5xl border-t border-gray-200 pt-8 md:pt-8 mb-8 md:mb-8">
      <ul className="flex items-center justify-center gap-2">
        <li>
          {hasPrev ? (
            <Link
              href={hrefFor(currentPage - 1)}
              rel="prev"
              aria-label="Go to previous page"
              className={`${cell} text-gray-500 hover:text-brand-crimson`}
            >
              {"← Prev"}
            </Link>
          ) : (
            <span aria-hidden="true" className={`${cell} text-gray-300`}>
              {"← Prev"}
            </span>
          )}
        </li>

        {pages.map((page) => {
          const isCurrent = page === currentPage;
          return (
            <li key={page}>
              {isCurrent ? (
                <span
                  aria-current="page"
                  className={`${cell} font-bold text-brand-crimson`}
                >
                  {page}
                </span>
              ) : (
                <Link
                  href={hrefFor(page)}
                  aria-label={`Go to page ${page}`}
                  className={`${cell} text-gray-500 hover:text-brand-crimson`}
                >
                  {page}
                </Link>
              )}
            </li>
          );
        })}

        <li>
          {hasNext ? (
            <Link
              href={hrefFor(currentPage + 1)}
              rel="next"
              aria-label="Go to next page"
              className={`${cell} text-gray-500 hover:text-brand-crimson`}
            >
              {"Next →"}
            </Link>
          ) : (
            <span aria-hidden="true" className={`${cell} text-gray-300`}>
              {"Next →"}
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
