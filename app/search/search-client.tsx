"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// Pagefind ships no TypeScript types, so we describe only the surface we use.
// The module is the static /pagefind/pagefind.js produced by the build.
type PagefindSubResult = {
  title: string;
  url: string;
  excerpt: string;
};
type PagefindData = {
  url: string;
  excerpt: string;
  meta?: { title?: string };
  sub_results?: PagefindSubResult[];
};
type PagefindResult = { data: () => Promise<PagefindData> };
type PagefindResponse = { results: PagefindResult[] } | null;
type PagefindApi = {
  options: (opts: Record<string, unknown>) => Promise<void>;
  init: () => Promise<void>;
  debouncedSearch: (
    term: string,
    options: unknown,
    debounceMs: number,
  ) => Promise<PagefindResponse>;
};

// A real match after filtering: the post plus any heading sections that
// themselves carry a highlight.
type SearchHit = {
  url: string;
  title: string;
  excerpt: string;
  subResults: PagefindSubResult[];
};

// Pagefind wraps genuine matches in <mark>. A trimmed-term ghost — "musk"
// degrading to "music"/"Munich" as Pagefind shaves characters off a term that
// finds nothing — comes back with no <mark>, so that is the signal we filter
// on. A substring test is enough; no need to parse HTML.
function hasMark(html: string): boolean {
  return html.includes("<mark");
}

// The index is keyed off the prerendered file paths under .next/server/app,
// which are flat `<route>.html` files, so URLs arrive as `/posts/slug.html`
// (and `.html#heading` for sub-results). Next serves those routes
// extensionless, so strip the extension — keeping any #anchor — or every link
// 404s.
function stripHtmlExtension(url: string): string {
  return url.replace(/\.html(?=#|$)/, "");
}

export default function SearchClient() {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  // null = no search has run (empty input); [] = searched, nothing matched.
  const [hits, setHits] = useState<SearchHit[] | null>(null);

  const pagefindRef = useRef<PagefindApi | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Monotonic request id. Results resolve asynchronously through per-result
  // data() calls, so a slow earlier query could otherwise overwrite a faster
  // later one; every stage checks it still owns the latest id.
  const requestIdRef = useRef(0);

  // Load the Pagefind module once. It is a build-time static file, not an npm
  // package, so it is imported at runtime from an absolute path.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Assigning the path to a variable keeps the bundler from statically
        // resolving it; the ignore comments cover both Turbopack (Next 16) and
        // webpack (older forks).
        const modulePath = "/pagefind/pagefind.js";
        const pagefind: PagefindApi = await import(
          /* webpackIgnore: true */ /* turbopackIgnore: true */ modulePath
        );
        await pagefind.options({ excerptLength: 30 });
        await pagefind.init();
        if (cancelled) return;
        pagefindRef.current = pagefind;
        setReady(true);
      } catch {
        // The index only exists after a production build, so the import throws
        // on `next dev`. Show the friendly fallback, not an error boundary.
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Search on every query change once the module is ready. Pagefind's own
  // debouncedSearch handles the timing, so no hand-rolled timer.
  useEffect(() => {
    const pagefind = pagefindRef.current;
    if (!ready || !pagefind) return;

    const trimmed = query.trim();
    if (!trimmed) {
      // Empty input: invalidate any in-flight search and clear results so the
      // emblem returns. Do not search for an empty string.
      requestIdRef.current += 1;
      setHits(null);
      return;
    }

    const id = ++requestIdRef.current;
    (async () => {
      const response = await pagefind.debouncedSearch(trimmed, undefined, 300);
      // null means a newer search superseded this one.
      if (response === null || id !== requestIdRef.current) return;

      const resolved = await Promise.all(response.results.map((r) => r.data()));
      // A later query may have landed while we awaited data(); bail if so.
      if (id !== requestIdRef.current) return;

      const filtered: SearchHit[] = [];
      for (const data of resolved) {
        // Drop ghosts: no <mark> in the excerpt means no genuine match.
        if (!hasMark(data.excerpt)) continue;
        const subResults = (data.sub_results ?? [])
          .filter((sub) => hasMark(sub.excerpt))
          .map((sub) => ({ ...sub, url: stripHtmlExtension(sub.url) }));
        filtered.push({
          url: stripHtmlExtension(data.url),
          title: data.meta?.title ?? data.url,
          excerpt: data.excerpt,
          subResults,
        });
      }
      setHits(filtered);
    })();
  }, [query, ready]);

  if (failed) {
    return (
      <p className="text-brand-muted">
        Search is unavailable. The index is generated at build time, so it does
        not exist on the dev server until a production build has run.
      </p>
    );
  }

  const trimmedQuery = query.trim();
  const countMessage =
    hits === null
      ? ""
      : hits.length === 0
        ? `No results for “${trimmedQuery}”`
        : `${hits.length} ${hits.length === 1 ? "result" : "results"}`;

  return (
    <div className="pagefind-scope">
      <form role="search" onSubmit={(event) => event.preventDefault()}>
        <label htmlFor="search-input" className="sr-only">
          Search every post on the site
        </label>
        <div className="relative">
          <input
            id="search-input"
            ref={inputRef}
            type="search"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            // Placeholder must stay non-empty: the .search-empty rule in
            // globals.css keys off :placeholder-shown to toggle the emblem.
            placeholder="What are you looking for?"
            className="w-full rounded-md border border-gray-200 bg-transparent px-4 py-3 pr-12 text-lg font-normal text-brand-dark placeholder:text-brand-muted focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-crimson"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm p-1 text-brand-muted transition-colors duration-200 hover:text-brand-crimson focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-crimson"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                className="h-5 w-5"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* Count line only. aria-live announces "14 results" as it changes;
          announcing every result on each keystroke would be hostile, so the
          results list below is deliberately not a live region. */}
      <p className="mt-6 text-sm text-brand-muted" aria-live="polite">
        {countMessage}
      </p>

      {hits && hits.length > 0 && (
        <ul className="divide-y divide-gray-200">
          {hits.map((hit) => (
            <li key={hit.url} className="py-6">
              <h2 className="font-display text-2xl font-semibold leading-tight">
                <Link
                  href={hit.url}
                  className="text-brand-dark transition-colors duration-200 hover:text-brand-crimson"
                >
                  {hit.title}
                </Link>
              </h2>
              {/* Excerpt HTML comes from our own build-time index over our own
                  CMS content — not user input — and carries the <mark> tags
                  that are the whole point of the highlight, so
                  dangerouslySetInnerHTML is appropriate here. Same trusted
                  build-time-content precedent as the Shiki output in
                  lib/rich-text.tsx (see CLAUDE.md). */}
              <p
                className="mt-2 leading-relaxed text-brand-dark"
                dangerouslySetInnerHTML={{ __html: hit.excerpt }}
              />
              {hit.subResults.length > 0 && (
                <ul className="mt-3 space-y-3">
                  {hit.subResults.map((sub) => (
                    <li key={sub.url}>
                      <h3 className="font-display text-lg font-semibold leading-tight">
                        <Link
                          href={sub.url}
                          className="text-brand-dark transition-colors duration-200 hover:text-brand-crimson"
                        >
                          {sub.title}
                        </Link>
                      </h3>
                      <p
                        className="mt-1 leading-relaxed text-brand-dark"
                        dangerouslySetInnerHTML={{ __html: sub.excerpt }}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
