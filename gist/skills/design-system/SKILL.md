---
name: design-system
description: 'Digital Stoic visual system v0.4 "Tablette" for every Claude artifact and HTML page: tokens, type, classes, inline-SVG charts, and an assembler that injects the base CSS and base64 fonts so they never pass through context. Overrides artifact-design defaults. Use when: build an artifact, HTML page, report page, dashboard, mini-app, chart, plot, data viz, gallery, standalone page, design tokens, Digital Stoic style.'
user-invocable: true
---

# Digital Stoic design system — index

version: 0.4.2 | palette: tablette | updated: 2026-11-07

Entry point. Read this first, then open ONLY the files the routing table sends you to. Paths are relative to this skill's directory.

This file duplicates the hard facts of `reference.md` on purpose. Their `version:` lines must match — if they differ, this index is stale and `reference.md` wins.

## Route

| task | read | then |
|---|---|---|
| build any artifact / HTML page | `reference.md` | mandatory, full |
| pick a class before inventing one | `templates/gallery.html` | living spec, grep it |
| start a document-shaped page | `templates/identity.html` | copy as skeleton |
| see a full screen of a given type | `demo/0N-<type>.html`, simple to complex: `01-document` `02-landing` `03-charts` · tool mode `04-dashboard` `05-decision` `06-mini-app` | copy the closest one, grep it |
| any chart, plot, dashboard tile | load skill `dataviz` FIRST, then §Data viz of `reference.md` | skill owns form, system owns params |

Never read `fonts/*.css` (base64 blobs) or built output. The assembler injects them; they must not pass through context.

## Build

```
bun <skill-dir>/artifact-build.mjs [--standalone] <src.html> <out.html>
```

Runs from any cwd; src/out are cwd-relative. Default = fragment (artifact engine supplies head). `--standalone` = complete self-hostable document, zero outbound request.

Source markers: `/* @base */` · `/* @font: <slug> */` · `<!-- @title: ... -->` · `<!-- @body: mode-outil -->` (standalone `<body>` class; also set it on the outer wrapper for fragments)
Font slugs: `ebgaramond-400` `ebgaramond-400i` `hanken-400` `hanken-600` `jetbrains-400`
Output goes to the calling project's `build/` folder — never `/tmp/`.

## Non-negotiables (violating any = wrong output)

1. Never hardcode a color. Tokens only. Palette declared 4× so `data-theme` beats the media query both ways.
2. `--accent` (blueprint blue, machine) = actionable · `--voice` (terracotta, human) = first-person conviction ONLY · `--ok`/`--warn` = state only · `--cat-*` = series identity only.
3. Series palette: 6 slots, order frozen. Cap 6 (bar/line/area/stacked), cap 3 (scatter/bubble/small multiples). No 7th hue. Changing a hex means re-running `validate_palette.js` (dataviz skill) in both modes.
4. No component kit (shadcn, Tailwind, Radix), no chart library. CSP blocks external assets, there is no bundler, and their default look is what the guardrails ban. Use native elements.
5. Charts = hand-authored inline SVG, drawn at the container's real width and redrawn on resize (`fit()` in `demo/03-charts.html`), so chart text stays 12 px. Mermaid for flows/schemas only, never quantitative data. Chart marks use `.mk`, never `.bar`.
6. Rules, not cards. Never centered by default. No gradients, shadows, glows. No emoji in the rendered page.
7. Focus never removed — `:focus-visible` is global in the base, do not override per component.
8. Type by role, set by the base, never per component: EB Garamond reads (headings, prose, editorial labels in small caps), `font-size-adjust:.5` on body; Hanken operates and compares (buttons, chips, table headers and cells, inputs, hints, errors, KPI figures, legends, chart text, dashboard rail); JetBrains Mono only for what gets copied verbatim (hex, ids, sources, code, document rail values). Tool pages: `<body class="mode-outil">` (marker `@body`) also switches editorial labels to Hanken. Editorial labels use `--label-*` tokens, never a hardcoded family. Sizes are tokens, never a raw rem or px: reading `--t-sm --t-body --t-lede --t-h2 --t-h1 --t-h1-sm`, interface `--u-xs` (12 px floor) `--u-sm --u-md`; spacing `--s0…--s6`.
9. Real content, never lorem. Project-level brand constraints (the caller's CLAUDE.md) apply on top.
10. `artifact-build.mjs` + `artifact-base.css` + `fonts/` move as one block or not at all.
11. Render it and look at it before claiming it works.
12. Any change to `artifact-base.css`, `fonts/` or the `version:` line → run `bun <skill-dir>/check-demos.mjs` (rebuilds into `demo/build/`) and fix every FAIL before calling the change done. Demos must stay a true picture of the system.

## Settled — do not reopen

Identity v0.2 Tablette (parchment, terracotta voice `#9A3B1A`/`#D9784F`, blueprint accent `#1F3F8F`/`#8FA9E8`) · type by role (Garamond reads, Hanken operates/compares, mono copied), 2026-11-07 · `font-size-adjust:.5` on the serif · `.reg-conv` keeps its full `--voice-weak` background · series palette · inline-SVG chart engine. Rationale in §Settled of `reference.md`.
