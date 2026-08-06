import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ContentfulImage from "./contentful-image";

describe("ContentfulImage", () => {
  it("starts transparent in the pending state, with no fade class and the incoming className kept", () => {
    const html = renderToStaticMarkup(
      <ContentfulImage
        src="https://images.ctfassets.net/space/asset.jpg"
        alt=""
        width={100}
        height={100}
        className="object-cover"
      />,
    );

    // The initial 'pending' render is invisible so the blur underlay shows
    // through rather than a white frame.
    expect(html).toContain("opacity-0");
    expect(html).not.toContain("opacity-100");
    // The fade is applied only on the network reveal path (reveal === "fade"),
    // never in the pending baseline — so cached images never fade.
    expect(html).not.toContain("transition-opacity");
    // The caller's className is preserved through the merge.
    expect(html).toContain("object-cover");
  });

  // The LCP guard. A priority image is the LCP candidate on every page that has
  // one, and Chromium's LCP algorithm skips fully transparent elements — so
  // shipping opacity-0 and waiting for hydration to flip it moved the measured
  // paint from "the preloaded bitmap arrived" to "React committed". This
  // asserts the server HTML is already opaque, which is the whole fix; if it
  // ever regresses, the symptom is a slower LCP with no visible change.
  it("ships a priority image opaque, with no dependence on hydration", () => {
    const html = renderToStaticMarkup(
      <ContentfulImage
        src="https://images.ctfassets.net/space/asset.jpg"
        alt=""
        width={100}
        height={100}
        priority
      />,
    );

    expect(html).toContain("opacity-100");
    expect(html).not.toContain("opacity-0");
    // Straight to opaque, not a fade the LCP element would have to sit out.
    expect(html).not.toContain("transition-opacity");
  });
});
