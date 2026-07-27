import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// The page pulls in a client component that loads Pagefind's bundle from
// /pagefind at mount. Nothing here runs that effect — renderToStaticMarkup only
// produces the server HTML, which is exactly the markup a scripts-off visitor
// receives — but next/link and the emblem are stubbed to keep this a unit test
// of the page's own structure.
vi.mock("../app/search/search-emblem", () => ({
  default: () => <svg data-testid="emblem" />,
}));

import SearchPage from "../app/search/page";

const html = renderToStaticMarkup(<SearchPage />);

describe("search page without JavaScript", () => {
  it("explains why search is unavailable", () => {
    // Pagefind mounts its input in the browser, so with scripts off the page
    // would otherwise show a heading, no search box, and no reason why.
    expect(html).toContain("<noscript>");
    expect(html).toMatch(/Search needs JavaScript/);
  });

  it("offers the two routes that browse posts without scripts", () => {
    const noscript = html.slice(
      html.indexOf("<noscript>"),
      html.indexOf("</noscript>"),
    );
    expect(noscript).toContain('href="/archive"');
    expect(noscript).toContain('href="/categories"');
  });

  it("keeps .search-empty as the immediate next sibling of .pagefind-scope", () => {
    // globals.css hides the empty-state emblem with
    // `.pagefind-scope:has(input:not(:placeholder-shown)) + .search-empty`.
    // Anything rendered between the two breaks that adjacency and strands the
    // emblem on screen while results are showing, which is why the noscript
    // block sits above the search component rather than below it.
    const scopeEnd = html.indexOf('class="pagefind-scope"');
    expect(scopeEnd).toBeGreaterThan(-1);

    const between = html.slice(scopeEnd, html.indexOf("search-empty"));
    // Exactly one element closes between the scope div opening and the figure:
    // the scope div itself. A stray sibling would add another top-level close.
    expect(between).not.toContain("<noscript>");
    expect(between.indexOf("</div>")).toBeGreaterThan(-1);
  });

  it("puts the noscript message before the search component", () => {
    expect(html.indexOf("<noscript>")).toBeLessThan(
      html.indexOf('class="pagefind-scope"'),
    );
  });
});
