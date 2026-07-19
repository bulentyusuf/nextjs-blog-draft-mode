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
