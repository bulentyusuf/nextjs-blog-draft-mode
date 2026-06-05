import { readFileSync, writeFileSync } from "node:fs";

const path = process.argv[2] || "contentful/export.json";
const data = JSON.parse(readFileSync(path, "utf8"));

const STRIP_SYS = [
  "space",
  "environment",
  "createdBy",
  "updatedBy",
  "publishedBy",
  "createdAt",
  "updatedAt",
  "firstPublishedAt",
  "publishedAt",
  "publishedCounter",
  "urn",
];

function clean(item) {
  if (item && item.sys) {
    for (const key of STRIP_SYS) delete item.sys[key];
  }
}

for (const key of ["contentTypes", "editorInterfaces", "locales", "tags"]) {
  if (Array.isArray(data[key])) data[key].forEach(clean);
}

delete data.roles;
delete data.webhooks;
delete data.entries;
delete data.assets;

writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
console.log(`Sanitized ${path}`);
