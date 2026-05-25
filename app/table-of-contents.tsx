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
    <nav aria-label="Table of contents" className="text-sm">
      <p className="mb-3 font-bold uppercase tracking-wide text-gray-500">
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
                  : "border-transparent text-gray-600 hover:text-brand-crimson"
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
