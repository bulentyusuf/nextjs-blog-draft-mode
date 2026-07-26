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
    ?.code || "en-GB";

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

  it("ships every content type the post query asks for", () => {
    // The export backs the forkable-template story, so a type added to the
    // space but not to the export leaves a fork with a schema the query cannot
    // run against — an inline fragment on an absent type is a GraphQL error,
    // which fails every post query rather than just the affected field. Sidenote
    // shipped that way and this is the guard that would have caught it.
    const query = readFileSync(path.join(root, "lib/api.ts"), "utf8");
    const referenced = [
      ...new Set(
        [...query.matchAll(/\.\.\. on ([A-Z]\w*)/g)].map((m) => m[1]),
      ),
    ];
    expect(referenced.length).toBeGreaterThan(0);

    const ids = new Set(
      exportData.contentTypes.map((ct: { sys: { id: string } }) => ct.sys.id),
    );
    for (const name of referenced) {
      // GraphQL type names are PascalCase; content type ids are camelCase.
      const id = name[0].toLowerCase() + name.slice(1);
      expect(
        ids.has(id),
        `lib/api.ts queries "... on ${name}" but export.json has no "${id}" content type`,
      ).toBe(true);
    }
  });

  it("gives every content type an editor interface", () => {
    const ids = exportData.contentTypes.map(
      (ct: { sys: { id: string } }) => ct.sys.id,
    );
    const withInterface = new Set(
      (exportData.editorInterfaces || []).map(
        (ei: { sys: { contentType: { sys: { id: string } } } }) =>
          ei.sys.contentType.sys.id,
      ),
    );
    for (const id of ids) {
      expect(
        withInterface.has(id),
        `content type "${id}" has no editor interface`,
      ).toBe(true);
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

  it("only seeds entries whose content type the export ships", () => {
    const ids = new Set(
      exportData.contentTypes.map((ct: { sys: { id: string } }) => ct.sys.id),
    );
    for (const entry of seedData.entries) {
      const type = entry.sys?.contentType?.sys?.id;
      expect(
        ids.has(type),
        `entry "${entry.sys.id}" has content type "${type}", which export.json does not ship`,
      ).toBe(true);
    }
  });

  it("resolves every entry and asset embedded in seed rich text", () => {
    // A dangling link imports without complaint and then renders as nothing,
    // so the template looks broken in a way no import error explains.
    const entryIds = new Set(
      seedData.entries.map((e: { sys: { id: string } }) => e.sys.id),
    );
    const assetIds = new Set(
      seedData.assets.map((a: { sys: { id: string } }) => a.sys.id),
    );

    const dangling: string[] = [];
    const walk = (node: unknown, from: string) => {
      if (Array.isArray(node)) {
        for (const child of node) walk(child, from);
        return;
      }
      if (!node || typeof node !== "object") return;
      const record = node as Record<string, unknown>;
      const nodeType = record.nodeType;
      if (typeof nodeType === "string" && nodeType.includes("embedded-")) {
        const target = (
          record.data as { target?: { sys?: { id?: string; linkType?: string } } }
        )?.target?.sys;
        const pool = target?.linkType === "Asset" ? assetIds : entryIds;
        if (!target?.id || !pool.has(target.id)) {
          dangling.push(`${from} -> ${target?.linkType} ${target?.id}`);
        }
      }
      for (const value of Object.values(record)) walk(value, from);
    };

    for (const entry of seedData.entries) {
      walk(entry.fields, `entry "${entry.sys.id}"`);
    }
    expect(dangling, `dangling embeds: ${dangling.join(", ")}`).toEqual([]);
  });
});
