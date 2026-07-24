"use client";

import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import type { Content } from "./types";

// A Tufte-style sidenote. It renders inline at its reference point in the body
// text and is DOM-adjacent to that point, so a screen reader reads it exactly
// where it is referenced at every viewport — CSS float never reorders the tree.
//
// Below 2xl there is no room outside the prose column, so the note is a native
// <details> disclosure: the crimson superscript is the tap target, and the note
// expands inline beneath it. At 2xl+ there is room in the right margin, so CSS
// floats the note there, forces the <details> open and hides the summary (the
// same "open on desktop via CSS, not the [open] attribute" trick the TOC uses).
// All the responsive behaviour lives in .sidenote-* rules in globals.css.
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
  const body = documentToReactComponents(content.json);

  return (
    <span className="sidenote-wrap">
      {/* In-text marker at 2xl+, where the summary is hidden and the note
          floats. Decorative: the note text itself is the accessible content,
          read in DOM order at this point. Below 2xl the summary is the marker. */}
      <sup className="sidenote-ref hidden 2xl:inline" aria-hidden="true">
        {number}
      </sup>
      <details className="sidenote-details group">
        {/* Mobile tap target; hidden at 2xl+. The <sup> is decorative, so the
            control carries a real name via aria-label. */}
        <summary className="sidenote-toggle 2xl:hidden" aria-label={`Note ${number}`}>
          <sup aria-hidden="true">{number}</sup>
        </summary>
        {/* not-prose: the note lives inside the post's .prose container, but its
            compact type, spacing and link colour are owned by .sidenote-body in
            globals.css — keep the prose plugin out of it at every viewport. */}
        <span className="sidenote-body not-prose">{body}</span>
      </details>
    </span>
  );
}
