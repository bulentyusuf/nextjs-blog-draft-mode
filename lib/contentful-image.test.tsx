import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ContentfulImage from "./contentful-image";

describe("ContentfulImage", () => {
  it("starts transparent with a fade set up, and keeps the incoming className", () => {
    const html = renderToStaticMarkup(
      <ContentfulImage
        src="https://images.ctfassets.net/space/asset.jpg"
        alt=""
        width={100}
        height={100}
        className="object-cover"
      />,
    );

    // Before the load event the image is invisible with a fade primed, so the
    // blur underlay shows through rather than a white frame.
    expect(html).toContain("opacity-0");
    expect(html).toContain("transition-opacity");
    expect(html).not.toContain("opacity-100");
    // The caller's className is preserved through the merge.
    expect(html).toContain("object-cover");
  });
});
