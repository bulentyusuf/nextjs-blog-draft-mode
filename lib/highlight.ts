import "server-only";
import { createHighlighter, type Highlighter } from "shiki";
import type { CodeBlock, Content } from "./types";

const THEME = "min-dark"; // themes
const LANGS = [
  "typescript",
  "tsx",
  "javascript",
  "jsx",
  "json",
  "bash",
  "css",
  "html",
  "markdown",
  "text",
] as const;

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [THEME],
      langs: [...LANGS],
    });
  }
  return highlighterPromise;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function highlightCodeBlocks(
  content: Content,
): Promise<Map<string, string>> {
  const blocks = (content.links.entries?.block ?? []).filter(
    (b): b is CodeBlock => b.__typename === "CodeBlock",
  );
  if (blocks.length === 0) return new Map();

  const hl = await getHighlighter();
  const map = new Map<string, string>();

  for (const b of blocks) {
    const lang = (LANGS as readonly string[]).includes(b.language ?? "")
      ? (b.language as string)
      : "text";
    try {
      map.set(b.sys.id, hl.codeToHtml(b.code, { lang, theme: THEME }));
    } catch {
      map.set(
        b.sys.id,
        `<pre class="shiki"><code>${escapeHtml(b.code)}</code></pre>`,
      );
    }
  }

  return map;
}
