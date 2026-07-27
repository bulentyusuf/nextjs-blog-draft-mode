import { describe, it, expect, vi, afterEach } from "vitest";

// SITE_URL is resolved at module load, so each case needs a fresh module
// registry rather than a re-read of the export.
async function loadSiteUrl(
  env: Partial<Record<string, string>>,
): Promise<string> {
  vi.resetModules();
  // An empty string is how the resolver sees "unset", since it trims first.
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", env.NEXT_PUBLIC_SITE_URL ?? "");
  vi.stubEnv(
    "VERCEL_PROJECT_PRODUCTION_URL",
    env.VERCEL_PROJECT_PRODUCTION_URL ?? "",
  );
  if (env.NODE_ENV) vi.stubEnv("NODE_ENV", env.NODE_ENV);
  const mod = await import("@/lib/constants");
  return mod.SITE_URL;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("SITE_URL", () => {
  it("prefers the configured site URL", async () => {
    await expect(
      loadSiteUrl({
        NEXT_PUBLIC_SITE_URL: "https://example.com",
        VERCEL_PROJECT_PRODUCTION_URL: "ignored.vercel.app",
      }),
    ).resolves.toBe("https://example.com");
  });

  it("strips a trailing slash from the configured value", async () => {
    await expect(
      loadSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://example.com/" }),
    ).resolves.toBe("https://example.com");
  });

  it("treats a whitespace-only value as unset", async () => {
    await expect(
      loadSiteUrl({
        NEXT_PUBLIC_SITE_URL: "   ",
        VERCEL_PROJECT_PRODUCTION_URL: "demo.vercel.app",
      }),
    ).resolves.toBe("https://demo.vercel.app");
  });

  it("falls back to the Vercel production domain with a scheme added", async () => {
    await expect(
      loadSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "demo.vercel.app" }),
    ).resolves.toBe("https://demo.vercel.app");
  });

  it("does not double up the scheme if one is already present", async () => {
    await expect(
      loadSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "https://demo.vercel.app/" }),
    ).resolves.toBe("https://demo.vercel.app");
  });

  it("falls back to localhost when neither is set", async () => {
    await expect(loadSiteUrl({})).resolves.toBe("http://localhost:3000");
  });

  it("warns on the localhost fallback in a production build", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await loadSiteUrl({ NODE_ENV: "production" });
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toMatch(/NEXT_PUBLIC_SITE_URL/);
  });

  it("stays quiet on the localhost fallback outside production", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await loadSiteUrl({});
    expect(warn).not.toHaveBeenCalled();
  });
});

describe("SITE_HOSTNAME", () => {
  it("tracks the resolved site URL", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const mod = await import("@/lib/constants");
    // AUTHOR_EMAIL is derived from this, so a regression here changes the
    // address in every RSS <author> element.
    expect(mod.SITE_HOSTNAME).toBe("example.com");
  });
});
