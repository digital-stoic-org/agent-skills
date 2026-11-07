#!/usr/bin/env bun
// Keep demo/*.html in sync with the design system, then rebuild them.
//
//   bun <skill-dir>/check-demos.mjs [outdir]   (default: demo/build/, git-ignored)
//
// Run after any change to artifact-base.css, fonts/ or SKILL.md, and after
// editing a demo. Fails (exit 1) when a demo:
//   1. lacks <!-- @ds: X --> or X differs from the version: line of SKILL.md
//   2. hardcodes a colour in CSS, an inline style, a script or an SVG paint
//      attribute (hex, rgb/hsl/oklch functions, named paint) instead of a token
//   3. hardcodes a font-family instead of var(--serif|--sans|--mono|--label-font)
//   4. uses a class that neither artifact-base.css nor the demo's own <style>
//      defines (local classes are allowed, listed so drift stays visible)
//   5. does not assemble (artifact-build.mjs --standalone)
//   6. hardcodes a font size instead of var(--t-*|--u-*|--label-size), in CSS,
//      an inline style, a script or an SVG font-size attribute
// Visible text is not scanned: a hex printed as content is not a colour.
//
// Also builds templates/gallery.html as 00-gallery.html (it holds hex on
// purpose, so lint rules 1-4 skip it) and fails when its TOKENS table drifts
// from the light (:root) or dark (:root[data-theme="dark"]) values of the base.
// Demo file names carry their review order: foundations first, then document
// mode, then tool mode (01-document … 06-mini-app).

import { readFileSync, readdirSync, mkdirSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const SKILL = dirname(fileURLToPath(import.meta.url));
const DEMO = join(SKILL, "demo");
const out = process.argv[2] ?? join(DEMO, "build");
mkdirSync(out, { recursive: true });

const version = readFileSync(join(SKILL, "SKILL.md"), "utf8").match(/^version:\s*([\w.]+)/m)?.[1];
const classesIn = (css) =>
  new Set([...css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/\.(-?[a-zA-Z_][\w-]*)/g)].map((m) => m[1]));
const baseClasses = classesIn(readFileSync(join(SKILL, "artifact-base.css"), "utf8"));

const COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(/;
const PAINT = /\b(?:fill|stroke|stop-color|flood-color|color)\s*=\s*["']([^"']*)["']/g;
const PAINT_OK = /^(?:none|currentColor|transparent|inherit|var\(--[\w-]+\))$/;
const FONT = /font-family\s*:\s*([^;}"]+)/g;

let failed = 0;

{
  const errs = [];
  const base = readFileSync(join(SKILL, "artifact-base.css"), "utf8");
  const block = (sel) => {
    const body = base.match(new RegExp(`(?:^|\\n)${sel}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
    return Object.fromEntries([...body.matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]+)/g)].map((m) => [m[1], m[2].toUpperCase()]));
  };
  const light = block(":root");
  const dark = block(':root\\[data-theme="dark"\\]');
  const gsrc = join(SKILL, "templates", "gallery.html");
  const g = readFileSync(gsrc, "utf8");
  for (const [, name, l, d] of g.matchAll(/\["(--[\w-]+)",\s*"(#\w+)",\s*"(#\w+)"/g)) {
    if (light[name] !== l.toUpperCase()) errs.push(`palette drift ${name} light: gallery ${l} != base ${light[name]}`);
    if (dark[name] !== d.toUpperCase()) errs.push(`palette drift ${name} dark: gallery ${d} != base ${dark[name]}`);
  }
  const build = Bun.spawnSync(["bun", join(SKILL, "artifact-build.mjs"), "--standalone", gsrc, join(out, "00-gallery.html")]);
  if (build.exitCode !== 0) errs.push(`build failed: ${build.stderr.toString().trim()}`);
  if (errs.length) failed++;
  console.log(`${errs.length ? "FAIL" : "ok  "} 00-gallery.html  (templates/gallery.html, palette table checked)`);
  for (const e of errs) console.log(`     ${e}`);
}

const SIZE = /font-size\s*:\s*([^;"}\n]+)/g;
const SIZE_OK = /^var\(--(?:t-[\w-]+|u-[\w-]+|label-size)\)$/;
const SIZE_ATTR = /\sfont-size\s*=\s*"[^"]*"|["']font-size["']\s*[:,]\s*[^,})]+/g;

const files = readdirSync(DEMO).filter((f) => f.endsWith(".html")).sort();
for (const f of files) {
  const src = readFileSync(join(DEMO, f), "utf8");
  const errs = [];

  const stamp = src.match(/<!--\s*@ds:\s*([\w.]+)\s*-->/)?.[1];
  if (stamp !== version) errs.push(`version stamp ${stamp ?? "missing"} != SKILL.md ${version}`);

  const styles = [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n");
  const scripts = [...src.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join("\n");
  const inline = [...src.matchAll(/\sstyle\s*=\s*"([^"]*)"/g)].map((m) => m[1]).join("\n");
  const code = [styles, scripts, inline].join("\n").replace(/\/\*[\s\S]*?\*\//g, "");

  code.split("\n").forEach((line) => {
    if (COLOR.test(line)) errs.push(`hardcoded colour: ${line.trim().slice(0, 90)}`);
  });
  for (const m of src.matchAll(PAINT)) if (!PAINT_OK.test(m[1].trim())) errs.push(`hardcoded paint: ${m[0]}`);
  for (const m of code.matchAll(SIZE))
    if (!SIZE_OK.test(m[1].trim())) errs.push(`hardcoded font size: ${m[0].trim()}`);
  for (const m of src.matchAll(SIZE_ATTR)) errs.push(`hardcoded font size: ${m[0].trim()}`);
  for (const m of code.matchAll(FONT))
    if (!/^var\(--(?:serif|sans|mono|label-font)\)/.test(m[1].trim())) errs.push(`hardcoded font: ${m[0].trim()}`);

  const local = classesIn(styles);
  const used = new Set(
    [...src.matchAll(/\sclass\s*=\s*"([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/).filter(Boolean))
  );
  const unknown = [...used].filter((c) => !baseClasses.has(c) && !local.has(c));
  if (unknown.length) errs.push(`unknown class: ${unknown.join(" ")}`);
  const localUsed = [...used].filter((c) => !baseClasses.has(c) && local.has(c));

  const build = Bun.spawnSync(["bun", join(SKILL, "artifact-build.mjs"), "--standalone", join(DEMO, f), join(out, f)]);
  if (build.exitCode !== 0) errs.push(`build failed: ${build.stderr.toString().trim()}`);

  if (errs.length) failed++;
  console.log(`${errs.length ? "FAIL" : "ok  "} ${f}${localUsed.length ? `  (local: ${localUsed.join(" ")})` : ""}`);
  for (const e of errs) console.log(`     ${e}`);
}

console.log(`\n${files.length + 1 - failed}/${files.length + 1} pages (gallery + demos) in sync with design system ${version} -> ${out}`);
process.exit(failed ? 1 : 0);
