"use client";

import { useEffect, useState } from "react";
import type { Heading } from "@/lib/headings";
import { pickActiveHeading, type HeadingPosition } from "@/lib/toc-active";
import { widont } from "@/lib/typography";

// Used only if the heading's own scroll-margin-top cannot be read. Keep in step
// with the h2's scroll-mt-* utility in lib/rich-text.tsx.
const FALLBACK_BAND_TOP_PX = 96;

// Sub-pixel slack. A ToC click parks the heading at exactly its scroll-margin,
// and fractional layout values would otherwise leave it a hair below the line
// and hand the highlight to the previous section.
const BAND_TOLERANCE_PX = 4;

export default function TableOfContents({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (headings.length === 0) return;

    const elements = headings
      .map((h) => document.getElementById(h.slug))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    // The line a heading must cross to become active. Read from the heading's
    // own scroll-margin-top rather than hardcoded, because a ToC click parks
    // the target at exactly that offset. If the two disagreed, clicking entry
    // 7 would highlight entry 6.
    const scrollMargin = Number.parseFloat(
      window.getComputedStyle(elements[0]).scrollMarginTop,
    );
    const bandTop =
      (Number.isFinite(scrollMargin) && scrollMargin > 0
        ? scrollMargin
        : FALLBACK_BAND_TOP_PX) + BAND_TOLERANCE_PX;

    const recompute = () => {
      const positions: HeadingPosition[] = elements.map((el) => ({
        id: el.id,
        top: el.getBoundingClientRect().top,
      }));
      setActiveId(pickActiveHeading(positions, bandTop));
    };

    // Track scroll directly rather than through an IntersectionObserver. The
    // decision turns on a heading's TOP crossing bandTop, but an observer with
    // this rootMargin transitions on the heading's BOTTOM edge, so it fires a
    // heading-height late (~90px on the two-line H2s in a listicle) and the
    // highlight visibly lags the sticky header. A scroll listener recomputes at
    // the actual boundary; recompute reads live geometry, so the value was
    // never wrong, only late.
    let frame = 0;
    const onScroll = () => {
      // Coalesce a scroll burst into one recompute per frame.
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        recompute();
      });
    };

    // Prime the highlight on mount (covers first paint and a load-time fragment
    // jump), then follow scroll and resize — both move heading tops relative to
    // the line. passive: the handler never preventDefault()s.
    recompute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [headings]);

  if (headings.length < 3) return null;

  return (
    <details className="toc-details group">
      {/*
        summary is the mobile tap target. xl+ CSS hides it and forces the
        panel open regardless of the [open] attribute (see globals.css
        .toc-details rule), so one scroll listener serves both viewports.
      */}
      <summary className="xl:hidden list-none flex items-center justify-between gap-3 cursor-pointer select-none rounded-lg border border-brand-dark/10 bg-brand-dark/5 px-4 py-3 text-sm font-bold uppercase tracking-wide text-brand-dark">
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
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-brand-muted hidden xl:block">
          On this page
        </p>
        <ul className="space-y-2 border-l border-brand-dark/10">
          {headings.map((h) => (
            <li key={h.slug}>
              <a
                href={`#${h.slug}`}
                // The active entry is otherwise signalled by colour, weight and
                // border alone. aria-current gives assistive tech the same
                // position information sighted readers get.
                aria-current={activeId === h.slug ? "location" : undefined}
                className={`block border-l -ml-px pl-3 leading-snug transition-colors duration-200 ${
                  activeId === h.slug
                    ? "border-brand-crimson text-brand-crimson font-medium"
                    : "border-transparent text-brand-muted hover:text-brand-crimson"
                }`}
              >
                {/* h.text is always a plain string; widont de-widows the
                    entry in the narrow TOC column. The link target is h.slug,
                    computed separately, so the NBSP never reaches the anchor. */}
                {widont(h.text)}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </details>
  );
}
