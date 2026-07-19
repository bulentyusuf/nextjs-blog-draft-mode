"use client";

import { useEffect, useRef, useState } from "react";

// Pagefind's default UI ships as a plain script + stylesheet inside the
// build-time index at /pagefind/. It is not an npm module the bundler can
// see, so we attach it with real <script>/<link> tags and initialise the
// global it exposes. The index only exists after a production build, so on
// `next dev` the script 404s and we show a friendly fallback instead.
declare global {
  interface Window {
    PagefindUI?: new (opts: Record<string, unknown>) => unknown;
  }
}

// The shape of a Pagefind result we touch in processResult. Pagefind returns
// more fields; we only rewrite the URLs, so the rest is left opaque.
type PagefindResult = {
  url: string;
  sub_results?: { url: string }[];
  [key: string]: unknown;
};

// Pagefind derives result URLs from the prerendered file paths under
// .next/server/app, which are flat `<route>.html` files — so it emits
// `/posts/slug.html` (and `/posts/slug.html#heading` for sub-results). Next
// serves those routes extensionless, so the `.html` form 404s. Strip the
// extension, keeping any #anchor, so both the headline and its deep links
// resolve.
function stripHtmlExtension(url: string): string {
  return url.replace(/\.html(?=#|$)/, "");
}

export default function SearchClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/pagefind/pagefind-ui.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "/pagefind/pagefind-ui.js";
    script.onload = () => {
      if (cancelled || !window.PagefindUI || !containerRef.current) return;
      // React strict mode runs effects twice in dev; empty the container
      // before init so the UI never mounts twice.
      containerRef.current.replaceChildren();
      new window.PagefindUI({
        element: containerRef.current,
        showSubResults: true,
        showImages: false,
        // Rewrite the .html paths Pagefind derives from the build directory so
        // the links match Next's extensionless routes instead of 404ing.
        processResult: (result: PagefindResult) => {
          result.url = stripHtmlExtension(result.url);
          result.sub_results = result.sub_results?.map((sub) => ({
            ...sub,
            url: stripHtmlExtension(sub.url),
          }));
          return result;
        },
      });
    };
    script.onerror = () => {
      if (!cancelled) setFailed(true);
    };
    document.body.appendChild(script);

    return () => {
      cancelled = true;
      link.remove();
      script.remove();
    };
  }, []);

  if (failed) {
    return (
      <p className="text-brand-muted">
        Search is unavailable. The index is generated at build time, so it does
        not exist on the dev server until a production build has run.
      </p>
    );
  }

  return <div ref={containerRef} className="pagefind-scope" />;
}
