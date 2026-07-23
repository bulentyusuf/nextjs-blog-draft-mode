// U+00A0 non-breaking space, built by code point so no invisible character
// lives in the source and there is no escaping ambiguity.
const NBSP = String.fromCharCode(0x00a0);

/**
 * widont — glue the final two words of a string with a non-breaking space so a
 * wrapped title never ends on a lone last word (the "2-word overhang").
 *
 * Unlike `text-wrap: pretty` — which only Chromium and recent Safari honour, so
 * Firefox and older Safari still orphan the last word — this is deterministic
 * and works in every browser. A no-op on single-word strings.
 *
 * Use on short display strings (titles and headings), not on body prose: it
 * only protects the very last line, and gluing two long words can force a wide
 * last line in a narrow column.
 */
export function widont(text: string): string {
  // If the title ends in a parenthesised year, glue the last THREE tokens,
  // since the year behaves as an extra trailing word and would otherwise
  // wrap as a two-word widow. Both internal gaps become non-breaking so the
  // year cannot wrap onto its own line — a single NBSP would only bind the
  // first two of the three and leave the year still breakable. Otherwise
  // glue the final two.
  if (/\(\d{4}\)\s*$/u.test(text)) {
    return text.replace(/\s+(\S+)\s+(\S+)\s*$/u, `${NBSP}$1${NBSP}$2`);
  }
  return text.replace(/\s+(\S+)\s*$/u, `${NBSP}$1`);
}
