import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// blur.ts imports "server-only", which throws when evaluated outside a React
// Server Component. Stub it to an empty module so the unit under test loads.
vi.mock("server-only", () => ({}));

import { getBlurDataURL } from "./blur";

describe("getBlurDataURL", () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => vi.unstubAllGlobals());

  it("normalises a protocol-relative URL and returns a webp data URL", async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => bytes.buffer,
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await getBlurDataURL("//images.ctfassets.net/space/asset.jpg");

    expect(result).toBe(
      `data:image/webp;base64,${Buffer.from(bytes).toString("base64")}`,
    );

    // The "//"-relative src is fetched over https with the LQIP transform params.
    const requested = new URL(fetchMock.mock.calls[0][0] as string);
    expect(requested.protocol).toBe("https:");
    expect(requested.searchParams.get("w")).toBe("10");
    expect(requested.searchParams.get("q")).toBe("30");
    expect(requested.searchParams.get("fm")).toBe("webp");
  });

  it("returns undefined when the response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    expect(
      await getBlurDataURL("https://images.ctfassets.net/space/asset.jpg"),
    ).toBeUndefined();
  });

  it("returns undefined when the fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    expect(
      await getBlurDataURL("https://images.ctfassets.net/space/asset.jpg"),
    ).toBeUndefined();
  });
});
