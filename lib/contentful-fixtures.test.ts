import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const readJson = (rel: string) =>
  JSON.parse(readFileSync(path.join(root, rel), "utf8"));

const exportData = readJson("contentful/export.json");
const seedData = readJson("contentful/seed.json");

const defaultLocale =
  (exportData.locales || []).find((l: { default?: boolean }) => l.default)
    ?.code || "en-US";

describe("contentful export.json", () => {
  it("has content types", () => {
    expect(Array.isArray(exportData.contentTypes)).toBe(true);
    expect(exportData.contentTypes.length).toBeGreaterThan(0);
  });

  it("marks every content type for activation with publishedVersion", () => {
    // Without this, contentful-import leaves the types as drafts and the
    // GraphQL schema never exposes them. Regression guard.
    for (const ct of exportData.contentTypes) {
      expect(
        ct.sys.publishedVersion,
        `content type "${ct.sys.id}" is missing sys.publishedVersion`,
      ).toBeTypeOf("number");
    }
  });
});

describe("contentful seed.json", () => {
  it("has at least one asset and some entries", () => {
    expect(Array.isArray(seedData.assets)).toBe(true);
    expect(seedData.assets.length).toBeGreaterThan(0);
    expect(Array.isArray(seedData.entries)).toBe(true);
    expect(seedData.entries.length).toBeGreaterThan(0);
  });

  it("uses url and never upload for asset files", () => {
    // contentful-import validates asset files against url. An upload key
    // aborts the whole import. Regression guard.
    for (const asset of seedData.assets) {
      const file = asset.fields?.file?.[defaultLocale];
      expect(
        file,
        `asset "${asset.sys.id}" has no file for ${defaultLocale}`,
      ).toBeTruthy();
      expect(
        file.url,
        `asset "${asset.sys.id}" file is missing url`,
      ).toBeTypeOf("string");
      expect(
        "upload" in file,
        `asset "${asset.sys.id}" still uses upload`,
      ).toBe(false);
    }
  });

  it("marks assets and entries for publishing with publishedVersion", () => {
    // Otherwise seed content imports as drafts and the public site is empty.
    for (const asset of seedData.assets) {
      expect(
        asset.sys.publishedVersion,
        `asset "${asset.sys.id}" is missing sys.publishedVersion`,
      ).toBeTypeOf("number");
    }
    for (const entry of seedData.entries) {
      expect(
        entry.sys.publishedVersion,
        `entry "${entry.sys.id}" is missing sys.publishedVersion`,
      ).toBeTypeOf("number");
    }
  });
});
