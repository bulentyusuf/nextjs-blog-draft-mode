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
  });
});

describe("lightbox accessible naming", () => {
  // A caption is rendered immediately after the image by the caller, so
  // repeating it as alt made the same sentence announce twice (three times
  // once the trigger's "Enlarge image: <desc>" label is counted).
  it("leaves the image decorative when a caption describes it", () => {
    const html = renderToStaticMarkup(
      <LightboxImage
        src="https://images.ctfassets.net/x/y.jpg"
        alt="A placeholder"
        caption="A placeholder"
      />,
    );

    expect(html).toContain('alt=""');
    expect(html).not.toContain('alt="A placeholder"');
  });

  it("keeps alt when there is no caption to carry the description", () => {
    // Nothing else names the image in this shape, so dropping alt here would
    // lose the description rather than de-duplicate it.
    const html = renderToStaticMarkup(
      <LightboxImage
        src="https://images.ctfassets.net/x/y.jpg"
        alt="A placeholder"
      />,
    );

    expect(html).toContain('alt="A placeholder"');
  });
});
