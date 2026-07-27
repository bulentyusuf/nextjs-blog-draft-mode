import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import CopyButton from "./copy-button";

describe("CopyButton before hydration", () => {
  it("renders nothing on the server", () => {
    // The button is the whole defect: copying needs navigator.clipboard, so
    // with scripts off it took focus, announced "Copy code", and did nothing.
    // Same shape as the lightbox trigger fixed in #285 — the affordance is
    // gated on mount, the content is not.
    const html = renderToStaticMarkup(<CopyButton code="const a = 1;" />);
    expect(html).toBe("");
  });

  it("renders no button for either variant or label", () => {
    for (const props of [
      { code: "x", label: "prompt", variant: "dark" as const },
      { code: "x", variant: "light" as const },
    ]) {
      const html = renderToStaticMarkup(<CopyButton {...props} />);
      expect(html).not.toContain("<button");
      expect(html).not.toContain("aria-label");
    }
  });
});
