import { describe, it, expect } from "vitest";
import { createCoverNamer } from "./view-transition-name";

describe("createCoverNamer", () => {
  it("names the same slug only on its first occurrence", () => {
    const coverName = createCoverNamer();
    expect(coverName("hello-world")).toBe("cover-hello-world");
    expect(coverName("hello-world")).toBeUndefined();
  });

  it("gives each distinct slug its own name", () => {
    const coverName = createCoverNamer();
    expect(coverName("first")).toBe("cover-first");
    expect(coverName("second")).toBe("cover-second");
  });

  it("isolates state between namers so names do not leak across renders", () => {
    const a = createCoverNamer();
    const b = createCoverNamer();
    expect(a("shared")).toBe("cover-shared");
    // A fresh namer (next request/render) starts empty and names again.
    expect(b("shared")).toBe("cover-shared");
  });
});
