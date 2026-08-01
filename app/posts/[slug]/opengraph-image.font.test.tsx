import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ImageResponse } from "next/og";

// next/og vendors an older Satori than the standalone package, and it rejects
// some OpenType layout tables that bare satori parses fine — a font can pass a
// manual check with `satori` and still 500 every OG card in production. So this
// renders through the real path rather than pinning the file's bytes: a hash
// would catch a swapped file without saying whether the new one works.
//
// The sample string is chosen, not arbitrary. `fi` and `ffl` exercise the liga
// feature, which is where the unparseable lookup sat in the face this replaced,
// and the umlaut covers the diacritics a German title needs.
describe("OG card font", () => {
  it("renders through next/og without a parser error", async () => {
    const data = readFileSync(
      join(process.cwd(), "app/posts/[slug]/Bricolage-Bold.woff"),
    );
    const res = new ImageResponse(
      <div style={{ display: "flex", fontFamily: "T", fontSize: 60 }}>
        Grüße fi ffl Static site search
      </div>,
      {
        width: 1200,
        height: 630,
        fonts: [{ name: "T", data, weight: 700, style: "normal" }],
      },
    );
    expect(Buffer.from(await res.arrayBuffer()).byteLength).toBeGreaterThan(
      1000,
    );
  }, 20000);
});
