"use client";

import { useEffect, useState } from "react";
import type { Heading } from "@/lib/headings";

export default function TableOfContents({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (headings.length === 0) return;

    const elements = headings
      .map((h) => document.getElementById(h.slug))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the topmost heading currently intersecting the trigger zone.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        // Trigger band near the top of the viewport so the "active" heading
        // is the one just under the sticky header, not whatever's centered.
        rootMargin: "-80px 0px -70% 0px",
        threshold: 0,
      },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 3) return null;

  return (
    <details className="toc-details group">
      {/*
        summary is the mobile tap target. xl+ CSS hides it and forces the
        panel open regardless of the [open] attribute (see globals.css
        .toc-details rule), so one observer serves both viewports.
      */}
      <summary className="xl:hidden list-none flex items-center justify-between gap-3 cursor-pointer select-none rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold uppercase tracking-wide text-brand-dark">
        <span className="flex items-center gap-2">
          <svg
            className="h-4 w-4 text-brand-crimson"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M3 4.75A.75.75 0 0 1 3.75 4h12.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 4.75Zm0 5A.75.75 0 0 1 3.75 9h12.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 9.75Zm0 5a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z" />
          </svg>
          On this page
        </span>
        <svg
          className="h-4 w-4 text-brand-muted motion-safe:transition-transform motion-safe:duration-200 group-open:rotate-180"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </summary>
      <nav aria-label="Table of contents" className="text-sm pt-3 xl:pt-0">
        <p className="mb-3 font-bold uppercase tracking-wide text-brand-muted hidden xl:block">
          On this page
        </p>
        <ul className="space-y-2 border-l border-gray-200">
          {headings.map((h) => (
            <li key={h.slug}>
              <a
                href={`#${h.slug}`}
                className={`block border-l -ml-px pl-3 leading-snug transition-colors duration-200 ${
                  activeId === h.slug
                    ? "border-brand-crimson text-brand-crimson font-medium"
                    : "border-transparent text-brand-muted hover:text-brand-crimson"
                }`}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </details>
  );
}
