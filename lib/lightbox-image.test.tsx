import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import LightboxImage from "./lightbox-image";

// renderToStaticMarkup never runs effects, so `mounted` stays false and this is
// exactly the HTML a reader with JavaScript disabled is left holding.
const serverHtml = () =>
  renderToStaticMarkup(
    <LightboxImage
      src="https://images.ctfassets.net/x/y.jpg"
      alt="A placeholder"
      caption="A placeholder"
    />,
  );

describe("lightbox server output", () => {
  it("emits no trigger before mount", () => {
    // The button is the whole defect: with scripts off it took focus,
    // announced "Enlarge image" and did nothing on click. A control that
    // cannot do what it advertises should not be in the markup at all.
    const html = serverHtml();

    expect(html).not.toContain("<button");
    expect(html).not.toContain("Enlarge image");
    expect(html).not.toContain("cursor-zoom-in");
  });

  it("still renders the image itself", () => {
    // Degrading the affordance must not degrade the content — the image never
    // depended on JavaScript and must survive with the trigger gone.
    const html = serverHtml();

    expect(html).toContain("<img");
    expect(html).toContain('alt="A placeholder"');
  });
});
