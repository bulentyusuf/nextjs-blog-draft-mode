"use client";

// Replaces the root layout when the layout itself throws, so it must render its
// own <html> and <body>. Kept standalone on purpose, with no dependency on the
// header, footer or app chrome, since the component that renders those is the
// exact thing that failed. Only runs in production.
//
// globals.css is imported so Tailwind utilities and the brand tokens resolve.
// The Inter font variable lives on the root layout, which is bypassed here, so
// type falls back to the system sans stack. Fine for a last-resort page.
// Copy is yours to tweak.

import "./globals.css";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-white px-5">
        <main className="mx-auto max-w-xl text-center">
          <p className="text-lg font-bold uppercase tracking-wide text-brand-crimson">
            Whoops
          </p>
          <h1 className="mt-4 text-4xl font-bold text-brand-dark">
            The site hit a wall.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-brand-dark">
            A critical error stopped the page from rendering. Reloading usually
            clears it.
          </p>
          {error.digest && (
            <p className="mt-4 text-sm text-brand-muted">Reference {error.digest}</p>
          )}
          <button
            type="button"
            onClick={reset}
            className="mt-8 text-base font-bold text-brand-crimson hover:opacity-80 transition-opacity duration-200"
          >
            Reload
          </button>
        </main>
      </body>
    </html>
  );
}
