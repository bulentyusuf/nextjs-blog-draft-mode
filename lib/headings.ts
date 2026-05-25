import type { Document, Node, Text } from "@contentful/rich-text-types";
import { BLOCKS } from "@contentful/rich-text-types";

export interface Heading {
  text: string;
  slug: string;
}

// Pure, deterministic slug from heading text.
// Lowercase, strip anything that isn't a word char or space, collapse
// whitespace to single hyphens, trim stray hyphens. Stripping punctuation
// is deliberate — an apostrophe left in an id (e.g. "what's-inside") makes
// a fragile fragment identifier.
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Pull the plain text out of a heading node's inline children.
function nodeText(node: Node): string {
  const anyNode = node as unknown as { content?: Array<Text | Node> };
  if (!anyNode.content) return "";
  return anyNode.content
    .map((child) => {
      if ((child as Text).nodeType === "text") return (child as Text).value;
      // nested inline (e.g. a hyperlink inside a heading) — recurse
      return nodeText(child as Node);
    })
    .join("");
}

// A collision-aware slug factory. Returns a function that, called once per
// heading in document order, yields a unique slug — appending -1, -2, ... on
// repeats. Both the TOC extraction and the renderer's id emission must drive
// their own instance of this in the SAME document order, so the Nth heading
// gets the same slug on both sides.
export function createSlugger() {
  const seen = new Map<string, number>();
  return function nextSlug(text: string): string {
    const base = slugify(text) || "section";
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  };
}

// Walk a rich-text document and return its H2 headings in order, with
// collision-resolved slugs. H2-only by design — the agreed content contract
// is "H2 = section heading, always".
export function extractHeadings(document: Document): Heading[] {
  const slugger = createSlugger();
  const headings: Heading[] = [];
  for (const node of document.content) {
    if (node.nodeType === BLOCKS.HEADING_2) {
      const text = nodeText(node).trim();
      if (!text) continue;
      headings.push({ text, slug: slugger(text) });
    }
  }
  return headings;
}
