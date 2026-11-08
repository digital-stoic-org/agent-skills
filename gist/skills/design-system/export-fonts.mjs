#!/usr/bin/env bun
// Export the design-system faces as plain woff2 files for a static site that
// has no build step (the assembler only inlines base64 data URIs).
//
//   bun <skill-dir>/export-fonts.mjs <outdir> [slug ...]
//
// Writes <outdir>/<slug>.woff2 for each face (all faces when no slug is given),
// <outdir>/fonts.css with the same @font-face rules pointing at those files,
// and copies the OFL licence texts. Families, weights, styles and the
// OpenType features (smcp c2sc tnum pnum on ebgaramond-400) are those of the
// base64 faces, byte for byte: the woff2 is decoded, never re-encoded.
// Link fonts.css before base.css. Version the file names on your side if the
// host caches fonts as immutable.

import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FONTS = join(dirname(fileURLToPath(import.meta.url)), "fonts");
const [outdir, ...wanted] = process.argv.slice(2);
if (!outdir) {
  console.error("usage: export-fonts.mjs <outdir> [slug ...]");
  process.exit(1);
}
const all = readdirSync(FONTS).filter((f) => f.endsWith(".css")).map((f) => f.slice(0, -4)).sort();
const slugs = wanted.length ? wanted : all;
const unknown = slugs.filter((s) => !all.includes(s));
if (unknown.length) {
  console.error(`slug inconnu: ${unknown.join(", ")}\npolices disponibles: ${all.join(", ")}`);
  process.exit(1);
}
mkdirSync(outdir, { recursive: true });
const rules = [];
for (const slug of slugs) {
  const css = readFileSync(join(FONTS, `${slug}.css`), "utf8").trim();
  const m = css.match(/url\(data:font\/woff2;base64,([A-Za-z0-9+/=]+)\)/);
  if (!m) {
    console.error(`${slug}: pas de data URI woff2`);
    process.exit(1);
  }
  writeFileSync(join(outdir, `${slug}.woff2`), Buffer.from(m[1], "base64"));
  rules.push(css.replace(m[0], `url(${slug}.woff2)`));
}
writeFileSync(join(outdir, "fonts.css"), rules.join("\n") + "\n");
for (const f of readdirSync(FONTS).filter((f) => f.startsWith("OFL-"))) copyFileSync(join(FONTS, f), join(outdir, f));
console.log(`${outdir} <- ${slugs.map((s) => s + ".woff2").join(" ")} + fonts.css + OFL`);
