import type { Document, Node, Text } from "@contentful/rich-text-types";

// Average adult reading speed for prose, words per minute. A round 230 sits in
// the middle of the commonly cited 200–250 range.
const WORDS_PER_MINUTE = 230;

// Recursively collect the plain text out of a node's inline children. Mirrors
// the traversal in lib/headings.ts (nodeText), but walks the whole tree so
// nested blocks — lists, quotes — are counted, not just top-level paragraphs.
function collectText(node: Node): string {
  const anyNode = node as unknown as { content?: Array<Text | Node> };
  if (!anyNode.content) return "";
  return anyNode.content
    .map((child) => {
      if ((child as Text).nodeType === "text") return (child as Text).value;
      return collectText(child as Node);
    })
    .join(" ");
}

// Estimated reading time in whole minutes, floored at 1. Walks the rich-text
// document, concatenates every text node's value, and counts
// whitespace-separated words at WORDS_PER_MINUTE.
export function readingTimeMinutes(json: Document): number {
  const text = collectText(json);
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
