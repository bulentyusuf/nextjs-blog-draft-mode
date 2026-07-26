"use client";

import { useId, useState } from "react";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS } from "@contentful/rich-text-types";
import type { ReactNode } from "react";
import type { Content } from "./types";

// The note's own body is rich text, whose paragraphs would render as <p> — and a
// <p> start tag closes an open paragraph in the parser exactly as <details> did,
// so the default renderer would reintroduce the bug from inside the note. Render
// them as spans blocked out in CSS instead. The content type enables only bold,
// italic and hyperlink, so paragraphs are the only block node a note can carry.
const bodyOptions = {
  renderNode: {
    [BLOCKS.PARAGRAPH]: (_node: unknown, children: ReactNode) => (
      <span className="sidenote-para">{children}</span>
    ),
  },
} as Parameters<typeof documentToReactComponents>[1];

// A Tufte-style sidenote, rendered inline at its reference point. Every element
// here is phrasing content, so the note never terminates its parent <p>. An
// earlier <details>-based version did: the HTML parser implicitly closes an open
// paragraph on a <details> start tag, which split sentences mid-line and caused
// a hydration mismatch. Keep this markup to <span>, <sup> and <button>.
//
// The note is DOM-adjacent to its reference, so a screen reader reads it where
// it is referenced at every viewport; CSS float never reorders the tree.
//
// Responsive behaviour lives entirely in the .sidenote-* rules in globals.css.
// Do not add Tailwind display utilities to these elements. Those rules are
// unlayered and outrank anything in the utilities layer, so a `2xl:hidden` here
// silently loses — that is what previously left both markers visible at 2xl.
//
// The visible reference number here (`number`, a document-order index computed
// in rich-text.tsx) and the "N. " prefix on the floated note (a CSS counter in
// globals.css) are two views of the same count. Both advance once per sidenote
// in document order, so they always agree; keep them in step if either moves.
export default function Sidenote({
  content,
  number,
}: {
  content: Content;
  number: number;
}) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();
  const body = documentToReactComponents(content.json, bodyOptions);

  return (
    <span className="sidenote-wrap">
      {/* In-text marker, shown at 2xl+ where the note floats into the margin.
          Decorative: the note text itself is the accessible content, read here
          in DOM order. */}
      <sup className="sidenote-ref" aria-hidden="true">
        {number}
      </sup>
      {/* Tap target, shown below 2xl. The <sup> inside is decorative, so the
          control carries its accessible name via aria-label. */}
      <button
        type="button"
        className="sidenote-toggle"
        aria-expanded={open}
        aria-controls={bodyId}
        aria-label={`Note ${number}`}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
      >
        <sup aria-hidden="true">{number}</sup>
      </button>
      {/* not-prose: the note sits inside the post's .prose container, but its
          compact type, spacing and link colour are owned by .sidenote-body. */}
      <span
        id={bodyId}
        className="sidenote-body not-prose"
        data-open={open || undefined}
      >
        {body}
      </span>
    </span>
  );
}
