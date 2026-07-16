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
});
