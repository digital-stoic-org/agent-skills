#!/usr/bin/env bun
// Assemble an artifact: inject the design-system CSS and the base64 font faces
// into a source HTML file, so those blobs never have to pass through the model
// context at generation time.
//
//   bun <skill-dir>/artifact-build.mjs [--standalone] src.html out.html
//
// Markers understood inside the source (anywhere, typically in <style>):
//   /* @base */              -> ./artifact-base.css
//   /* @font: <slug> */      -> ./fonts/<slug>.css
//   <!-- @title: ... -->     -> titre du document (mode standalone uniquement)
//   <!-- @body: <classes> --> -> <body class="..."> (mode standalone uniquement ;
//                               en fragment, poser la classe sur l'enveloppe)
//
// Deux modes, une seule source. Par défaut on émet un fragment : le moteur
// d'artefacts fournit lui-même doctype, <head> et réinitialisation minimale.
// Avec --standalone on émet le document complet, prêt à déposer sur un
// hébergeur statique — les faces étant déjà en data-URI, la page ne fait
// aucune requête sortante. Le doctype ainsi ajouté écarte au passage le mode
// quirks, où un tableau n'hérite pas de la couleur de ses ancêtres.
//
// Socle, faces et assembleur vivent ensemble : ce qu'on injecte est une
// décision d'identité, pas un outillage générique. Les ressources se
// résolvent depuis l'emplacement du script, jamais depuis le répertoire
// courant — l'appel marche donc depuis n'importe où.
//
// Unknown slugs abort the build rather than emitting a page that silently
// falls back to a system font.

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DESIGN = dirname(fileURLToPath(import.meta.url));
const FONTS = join(DESIGN, "fonts");

const argv = process.argv.slice(2);
const standalone = argv.includes("--standalone");
const [src, out] = argv.filter((a) => !a.startsWith("--"));
if (!src || !out) {
  console.error("usage: artifact-build.mjs [--standalone] <src.html> <out.html>");
  process.exit(1);
}

const read = (path, what) => {
  if (!existsSync(path)) {
    const known = existsSync(FONTS)
      ? readdirSync(FONTS).map((f) => f.replace(/\.css$/, "")).join(", ")
      : "(aucune)";
    console.error(`${what} introuvable: ${path}\npolices disponibles: ${known}`);
    process.exit(1);
  }
  return readFileSync(path, "utf8").trim();
};

let html = readFileSync(src, "utf8");
const injected = [];

html = html.replace(/\/\*\s*@base\s*\*\//g, () => {
  injected.push("artifact-base.css");
  return read(join(DESIGN, "artifact-base.css"), "CSS de base");
});

html = html.replace(/\/\*\s*@font:\s*([\w.-]+)\s*\*\//g, (_, slug) => {
  injected.push(`font:${slug}`);
  return read(join(FONTS, `${slug}.css`), `police "${slug}"`);
});

if (injected.length === 0) {
  console.error(`aucun marqueur /* @base */ ou /* @font: ... */ dans ${src}`);
  process.exit(1);
}

// ── Mode standalone : envelopper le fragment dans un document complet ──────
// Le titre se prend au marqueur "@title" s'il existe, sinon au premier <h1>,
// sinon au nom du fichier de sortie. On n'enveloppe jamais deux fois.
const escape = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const title = () => {
  const marked = html.match(/<!--\s*@title:\s*([^]*?)\s*-->/);
  if (marked) return marked[1].trim();
  const h1 = html.match(/<h1[^>]*>([^]*?)<\/h1>/i);
  if (h1) return h1[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  return out.split("/").pop().replace(/\.html?$/i, "");
};

// Classes du <body> : mode-outil doit vivre sur <body> pour couvrir aussi ce
// qui sort de l'enveloppe (<dialog>, éléments ajoutés par script).
const bodyClass = () => {
  const marked = html.match(/<!--\s*@body:\s*([\w\s-]+?)\s*-->/);
  return marked ? ` class="${escape(marked[1].replace(/\s+/g, " "))}"` : "";
};

// theme-color : la barre du navigateur suit le --bg de chaque versant, lu dans
// le socle au moment de l'assemblage — aucune valeur recopiée ici.
const baseCss = readFileSync(join(DESIGN, "artifact-base.css"), "utf8");
const bgOf = (sel) => baseCss.match(new RegExp(sel + "\\{[^}]*?--bg:(#[0-9A-Fa-f]{6})"))?.[1];
const bgLight = bgOf(":root\\[data-theme=\"light\"\\]"), bgDark = bgOf(":root\\[data-theme=\"dark\"\\]");
if (standalone && (!bgLight || !bgDark)) {
  console.error("theme-color: --bg introuvable dans artifact-base.css (blocs data-theme)");
  process.exit(1);
}

if (standalone && !/^\s*<!doctype/i.test(html)) {
  html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="${bgLight}">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="${bgDark}">
<title>${escape(title())}</title>
</head>
<body${bodyClass()}>
${html.trim()}
</body>
</html>
`;
  injected.push("standalone");
}

writeFileSync(out, html);
const kb = (n) => `${(n / 1024).toFixed(0)} Ko`;
console.log(`${out} <- ${injected.join(" + ")} (${kb(html.length)})`);
