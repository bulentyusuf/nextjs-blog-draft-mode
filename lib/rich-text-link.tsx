import NewWindowHint from "@/app/new-window-hint";
import type { Block, Inline } from "@contentful/rich-text-types";
import type { ReactNode } from "react";
import { SITE_HOSTNAME } from "./constants";

// A root-relative URI like "/privacy" points at this site. Protocol-relative
// forms ("//evil.example", and the backslash variant some browsers normalise
// to it) also start with a slash but resolve to another origin, so they are
// excluded here and fall through to URL parsing, which rejects them.
function isRootRelative(url: string): boolean {
  return url.startsWith("/") && url[1] !== "/" && url[1] !== "\\";
}

function isExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    return !(
      hostname === SITE_HOSTNAME || hostname.endsWith(`.${SITE_HOSTNAME}`)
    );
  } catch {
    return false;
  }
}

// The one hyperlink renderer for every rich-text field on the site: post bodies
// via lib/rich-text.tsx and sidenote bodies via lib/sidenote.tsx. It lives in
// its own module because a second copy is worse than useless — a sidenote body
// rendered by the bare default renderer emits whatever href the CMS holds,
// including a javascript: URI, which is the gap this closes. Any new rich-text
// surface must render hyperlinks through here rather than defaulting.
export function renderHyperlink(node: Block | Inline, children: ReactNode) {
  const uri: unknown = (node as Inline).data.uri;
  if (typeof uri !== "string") return <>{children}</>;

  // Root-relative paths are internal. They never reach URL parsing, which
  // requires a base and would throw.
  if (isRootRelative(uri)) return <a href={uri}>{children}</a>;

  let parsed: URL;
  try {
    parsed = new URL(uri);
  } catch {
    return <>{children}</>;
  }

  // mailto hands off to a mail client rather than opening a window, so it gets
  // neither target="_blank" nor the new-window hint.
  if (parsed.protocol === "mailto:") return <a href={uri}>{children}</a>;

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return <>{children}</>;
  }

  if (isExternalUrl(uri)) {
    return (
      <a href={uri} target="_blank" rel="noopener noreferrer">
        {children}
        <NewWindowHint />
      </a>
    );
  }
  return <a href={uri}>{children}</a>;
}
