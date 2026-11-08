# Digital Stoic artifact design system — agent reference

version: 0.6.1 | palette: tablette | updated: 2026-11-08

Load when building a Claude artifact or any HTML page. Overrides the artifact-design skill defaults; user's explicit words still win. Paths below are relative to this skill's directory.

`SKILL.md` duplicates this file's hard facts — font slugs, series caps, token families, class vocabulary, the Settled list — so the common case never has to open this one. Touching any of them means revising the index in the same pass and bumping `version:` in **both** files to the same value. Mismatched versions = the index is stale, trust this file.

## Build

```
bun <skill-dir>/artifact-build.mjs [--standalone] <src.html> <out.html>
```

Resolves its assets from its own directory, so it runs from any cwd. `<src.html>` / `<out.html>` are cwd-relative.

Two modes, one source. Default emits a **fragment** — the artifact engine supplies doctype, `<head>` and its minimal reset. `--standalone` emits a **complete document** (doctype, charset, viewport, `color-scheme`, `<title>`) for self-hosting on any static host; faces are already data-URI so the page makes zero outbound requests. Body bytes are identical in both modes.

The standalone doctype also removes the quirks-mode hazard below — keep the explicit `color` on `table` anyway, fragments still lack a doctype on disk.

Markers replaced in src:

| marker | injects |
|---|---|
| `@base` (CSS comment) | `artifact-base.css` |
| `@font: <slug>` (CSS comment) | `fonts/<slug>.css` |
| `@title: <text>` (HTML comment) | `<title>` in standalone mode; falls back to first `<h1>`, then out filename |
| `@body: <classes>` (HTML comment) | `<body class="<classes>">` in standalone mode (e.g. `mode-outil`). Fragment mode has no `<body>`: put the class on the outer wrapper too |

Required font slugs: `ebgaramond-400` (variable, weight 400-600), `ebgaramond-400i`, `hanken-400`, `hanken-600`, `jetbrains-400`.
Licences: all three families are SIL Open Font License 1.1; the texts ship in `fonts/OFL-ebgaramond.txt`, `fonts/OFL-hanken.txt`, `fonts/OFL-jetbrainsmono.txt` (from google/fonts). OFL allows embedding in pages and subsetting; the licence text must travel with the font files, so these files move with `fonts/`.

Unknown slug aborts the build. Never link a font CDN — artifact CSP blocks it, produces silent fallback.

Layout of this skill:

| where | what |
|---|---|
| `SKILL.md` | index and non-negotiables |
| `reference.md` | this file |
| `artifact-build.mjs` + `artifact-base.css` + `fonts/` | the assembler and what it injects. It resolves its assets from its own directory, so these three move as one block or not at all. |
| `templates/` | `gallery.html` (living spec, every class rendered) and `identity.html` (document skeleton) |
| `demo/` + `check-demos.mjs` | six full screens on one fictional domain, numbered from simple to complex: `01-document` `02-landing` `03-charts` (document mode), then `04-dashboard` `05-decision` `06-mini-app` (tool mode). The checker fails a demo that hardcodes a colour, a font or a font size (only `var(--t-*)`, `var(--u-*)`, `var(--label-size)`), uses an undefined class, carries a stale `@ds:` version stamp or does not assemble; it also fails when the palette table of `templates/gallery.html` drifts from `artifact-base.css`. It rebuilds the gallery as `00-gallery.html` and every demo into `demo/build/` (git-ignored, regenerable). |

Output goes to the calling project's `build/` folder: regenerable, but somewhere the user can open or host without hunting. Never `/tmp/`.

## Tokens

Never hardcode a color. Style only through tokens. Palette is defined four times in the base CSS: `:root`, `@media (prefers-color-scheme: dark)`, `:root[data-theme="dark"]`, `:root[data-theme="light"]`. The viewer's toggle stamps `data-theme` and must win over the media query in both directions.

```
--bg --surface --sunk          grounds
--fg --muted --faint           ink
--line --line-strong           rules
--accent --accent-weak --accent-ink
--voice --voice-weak
--ok --warn --ok-weak --warn-weak
--no --no-weak                 refusal state (verdict pages)
--crit-bg --crit-fg
--cat-1 … --cat-6              series identity (fixed order, never cycled)
--seq-1 … --seq-5              continuous magnitude (one hue, light→dark)
--dv-mid                       diverging midpoint (neutral gray)
```

Spacing: `--s0:.25rem --s1:.45rem --s2:.8rem --s3:1.2rem --s4:2rem --s5:3.2rem --s6:5rem` · `--r:6px`. `--s0` is the inner padding of small components (buttons, chips, inputs, marks).
Reading sizes (Garamond, appear 1.25× larger through `font-size-adjust`): `--t-sm:1rem --t-body:1.1rem --t-lede:1.3rem --t-h2 --t-h1`, and `--t-h1-sm` for a compact tool-page title.
Interface sizes (Hanken and mono, no adjustment): `--u-xs:.75rem` (12 px, the floor) `--u-sm:.88rem` `--u-md:1rem`. No HTML text below `--u-xs`. The only raw size left in the base is `.kpis .n` (2.1rem).
Type: `--serif` (EB Garamond, what is read) `--sans` (Hanken, what is operated or compared) `--mono` (JetBrains Mono, what is copied verbatim)
Label tokens (editorial labels only): `--label-font --label-caps --label-tt --label-ls --label-size --label-w --label-adjust`. Edito (default) = Garamond `all-small-caps`; `.mode-outil` on `<body>` = Hanken uppercase 600.

Palette tablette (light / dark). Dark versant = "Ardoise" since v0.5 (cool slate, not brown):

```
bg #F2E9D8 / #161A1F        surface #FAF4E8 / #1E232A     sunk #E9DCC3 / #101317
fg #2B1F16 / #E4E2DC        muted #6E5A47 / #A0A5AD       faint #8C7862 / #7A808A
line #D9C7A6 / #2F3640      line-strong #C4AE88 / #434B57
accent (machine, blueprint) #1F3F8F / #94B0F0   accent-weak #E1E5EE / #1C2740   accent-ink #FAF4E8 / #161A1F
voice (human, terracotta)   #9A3B1A / #E28D65   voice-weak #EFD9C9 / #3A2620
ok #3A6B47 / #7FBA95        warn #8A6412 / #D9AE55         crit = fg/bg inversion
ok-weak #E3E9DA / #1F2E28   warn-weak #F5EBD5 / #352E1C
no #A3243B / #EC7E8E        no-weak #F3D9DC / #3B2229       (since v0.6)
```

## Color rules

1. `--accent` = actionable / what depends on the reader. Links, sources, active states, the "up to you" column.
2. `--voice` (terracotta) = human voice, assumed conviction ONLY. Nowhere else. A purely factual page is monochrome. `--accent` (blueprint blue) = machine and actionable.
3. `--ok` / `--warn` are semantic, separate from accent. Never reuse accent as a state color.
4. Critical state = inversion (`--crit-bg` / `--crit-fg`), not a hue.
5. No gradients, no shadows, no glows.
6. `--cat-*` = series identity, and nothing else. It is not a decorative palette: never use it for headings, rules, chips or backgrounds. Conversely never colour a series with `--accent` or `--voice` — those already mean something.
7. Colour follows the entity, never its rank. A filter that changes the series count must not repaint the survivors.
8. `--ok` / `--warn` stay status-only. They are never "series 7".
9. `--no` / `--no-weak` = refusal or deviation (a verdict says no, a test diverged, a deleted line). State only, like `--ok` / `--warn`. It is crimson (hue 349°), apart from the voice (15°) and the brick series (0°): a refusal is never written in the voice colour. Added 2026-11-08 (v0.6) for verdict pages.
10. The `-weak` grounds carry state text in the matching colour: `--ok` on `--ok-weak`, `--warn` on `--warn-weak`, `--no` on `--no-weak`, all ≥ 4.5:1 in both versants; `--fg` on any of them ≥ 10:1.

## Type roles

Font follows the element's role, not the page mode (decided 2026-11-07, DS 0.3). The base sets every family; a component never does.

- Read = `--serif` (EB Garamond): h1, h2, h3, `.lede`, body, lists, `.reg-conv p`, `.rail .marg` (italic), `.fig-t .fig-s`, `summary`, editorial labels. h1/h2 weight 400. Sizes come from the reading scale tokens `--t-body` 1.1rem, `--t-lede` 1.3rem, `--t-h2` `clamp(1.6rem,2.8vw,2rem)`, `--t-h1` `clamp(2.4rem,5.5vw,3.8rem)`; `font-size-adjust:.5` makes them appear 1.25× larger (body ≈ 22 px). `summary` = `--t-body` weight 600, with `--s2` below it when open. Hanken tables and inputs are 1rem.
- Operate and compare = `--sans` (Hanken): `button .chip th td input select textarea .hint .err .lgd`, `.kpis .n` (400, 2.1rem), `.num`, `.viz text`, the dashboard rail `.dash`. Command, state and column labels (`button .chip th .ctl label span legend .kpis .l .gauge .l .dash dt`) are Hanken uppercase, `.1em`, 600, `.7rem`, in every mode.
- Copy = `--mono`: hex values, ids, token names (`td.hex td.name`), sources (`.reg-fact .src`), dates of consequences (`.reg-cons .when`), values of the document rail (`.rail dd`), code, overlay. Never for a label.
- Editorial labels (`.mark .who .eyebrow .rail dt .dicho h3 .reg .tag`) go through `--label-*` tokens only. Edito mode (default): Garamond `font-variant-caps:all-small-caps`, `letter-spacing:.07em`, 1rem. Tool mode: `<body class="mode-outil">` for dashboards, mini-apps, review pages switches them to Hanken uppercase. In the source, write `<!-- @body: mode-outil -->` and also put `mode-outil` on the outer wrapper so fragment mode keeps it.
- `font-size-adjust:.5` on `body` (Garamond x-height measured .40 em). Hanken (x-height .49 em) and mono elements reset it to `none` in the base. Do not set it per component.
- Figures: the embedded Garamond and Hanken both draw lining, tabular digits by default; `tabular-nums` is a no-op kept for fallbacks.
- Small caps: `ebgaramond-400` is the full EB Garamond variable font from google/fonts (OFL, `fonts/OFL-ebgaramond.txt`), subset to the same 236 code points with `smcp` and `c2sc` kept, so editorial small caps are drawn, not synthesized (60 KB woff2, was 44 KB). Re-subsetting must keep `smcp c2sc tnum pnum`.

Body measure ≤ 68ch. Lede ≤ 44ch.

## Structural signature

- Metadata rail left (`11rem`): labels in the label font, values in mono: statut, version, établi le, revoir avant. Collapses to one column below 760px.
- Rules, not cards. No floating rounded boxes. `--r` on top-level containers only.
- `font-variant-numeric: tabular-nums` wherever digits align.
- Footer states validity: `valide au YYYY-MM-DD`, `revoir avant YYYY-MM-DD`.
- Set `color:var(--fg)` on `table` explicitly — local files lack a doctype, and a table in quirks mode does not inherit color.

## Class vocabulary

`.wrap .bar .mark .who .tgl` · `.doc .rail .marg` · `.eyebrow .lede .sec` · `.regs .reg .reg-fact .reg-cons .reg-conv .glyph .tag .src .when` · `.dicho .up .not` · `.kpis .n .l` · `.states .chip .chip-ok .chip-warn .chip-crit` · `.tw table th td .hex .name .sw` · `.strip`

Data viz & controls: `.se-1…6` · `.fig .fig-t .fig-s figcaption` · `.viz .mk .ln .dot .area .stk .grid .axis .val` · `.lgd` · `.hm .q1…q5` · `.spark` · `.ctl .hint .err .gauge` · `button.ghost` · `.dash .grid2`

Chart marks use `.mk`, not `.bar` — `.bar` is the header bar and its unscoped rule would hit a `<rect>` inside the SVG.

## Archetypes

- **document** — rail + reading column. Default. `templates/identity.html`.
- **gallery** — living spec: every token, scale and component family rendered with its usage rule. `templates/gallery.html`. Read it before inventing a class.
- **dashboard** — summary before detail, state encoded in form (chip, rule) not only number. Rail becomes a horizontal `.dash` bar; panels sit in `.grid2`. CSS written.
- **mini-app** — interactive controls look interactive; visible focus state. CSS written — native elements styled through the tokens.
- **slides** — one idea per view, must read as workbench output not as a deck. OUT OF SCOPE.

## Component contract — dashboard & mini-app

Every row below is now styled in the base through the tokens. Never rebuild a native control out of `<div>` — the wheel worth reusing is the browser. Extend a row only when a real artifact needs more.

Do NOT import a component kit (shadcn/ui, Tailwind, Radix, any CSS framework). Blocked three ways: artifact CSP forbids external assets so the whole stack would inline into every page; there is no bundler here, only marker substitution; and their default look — neutral grays, rounded cards, shadows — is what the guardrails below already ban. The wheel worth reusing is the browser.

| need | native element | notes |
|---|---|---|
| text / number input | `<input>` | `font-variant-numeric:tabular-nums` on numeric |
| choice among few | `<select>` | no custom dropdown |
| binary | `<input type=checkbox>` | style via `:checked`, keep the real box focusable |
| exclusive set | `<input type=radio>` | |
| range | `<input type=range>` | |
| action | `<button>` | two levels only: `--accent` filled (`--accent-ink` on top), and outlined |
| disclosure | `<details><summary>` | zero JS |
| modal | `<dialog>` | focus trap + `Esc` included |
| progress / gauge | `<meter>` `<progress>` | styled; wrap in `.gauge` for its label. A gauge is one number — no legend, no axis |
| grouped fields | `<fieldset><legend>` | |
| validation message | `aria-describedby` + `.hint` / `.err` | never color alone |

Dashboard shape: rail transposed to a horizontal metadata bar under `.bar`; summary tiles reuse `.kpis`; state reuses `.chip`. No new color semantics.

Focus is never removed. `:focus-visible` is already defined globally in the base — do not override it per component.

## Data viz

Load the `dataviz` skill before building any chart — it owns form choice, mark specs, interaction and the anti-pattern catalog. This system supplies only the parameters below. Do not restate the skill's rules here, and do not re-derive the palette.

Palette parameters, validated against both surfaces (`#FAF4E8` light, `#1E232A` dark "Ardoise"; light re-validated 2026-11-03 for v0.2, dark 2026-11-07 for v0.5, all checks pass in both modes, worst dark CVD ΔE 8.3):

| slot | hue | light | dark |
|---|---|---|---|
| `--cat-1` | blue | `#2447A8` | `#5B8FE0` |
| `--cat-2` | brick | `#A02F2F` | `#D2685F` |
| `--cat-3` | teal | `#0A8A6C` | `#2E9E8E` |
| `--cat-4` | violet | `#6A4C93` | `#8F7AD0` |
| `--cat-5` | amber | `#B4761A` | `#B4842F` |
| `--cat-6` | magenta | `#B84A7E` | `#CE6E9B` |

Sequential = `--seq-1…5`, blue, light→dark. Diverging = `--cat-1` ↔ `--cat-2` with `--dv-mid`; never a hue at the midpoint, never a rainbow.

Slots 1 and 2 take the hues of `--accent` and `--voice` but are their own steps, not aliases — the v0.1 dark `--accent` (`#7EA6F0`, OKLCH L 0.726) sits above the dark series band and fails as a mark. Slot 3 drifts hue slightly between versants (`#0A8A6C` / `#2E9E8E`); hue-matching the dark step drops CVD ΔE to 6.8. Both were decided by the validator, not by eye.

**Series cap.** Adjacent pairlist (bar, stacked, line, area): **6**. `--pairs all` (scatter, bubble, small multiples, choropleth): **3** — at slot 4, violet against blue falls to normal-vision ΔE 10.8, under the 15 floor. Past the cap, fold into "Other" or facet. Never generate a 7th hue.

Re-run before changing any value:

```
node scripts/validate_palette.js "#2447A8,#A02F2F,#0A8A6C,#6A4C93,#B4761A,#B84A7E" --mode light --surface "#FAF4E8"
node scripts/validate_palette.js "#5B8FE0,#D2685F,#2E9E8E,#8F7AD0,#B4842F,#CE6E9B" --mode dark  --surface "#1E232A"
```

Rendering rules:

- Hand-authored inline SVG. No chart library, no CDN — the CSP forbids external assets and there is no bundler. Mermaid stays for flows and schemas, never for quantitative data.
- One colour mechanism: `.se-N` sets `color` on the element or its `<g>`, and marks inherit through `currentColor`.
- Text wears text tokens, never the series colour — the swatch beside it carries identity.
- One axis. Never a dual-axis chart; two measures of different scale become two charts or an indexed common base.
- Legend present for ≥ 2 series, absent for one (the title names it). At ≤ 4 series add direct labels. Never a number on every point.
- Every chart has a table view, or the figure carries visible labels — three light-versant slots sit near the 3:1 contrast line.
- Script-drawn charts are drawn at the real width of their container: `viewBox` width = `plot.clientWidth`, so one unit is one pixel and `.viz text` (`--u-xs`, 12 px) stays 12 px on every screen. Redraw when the width changes (ResizeObserver; a hidden pane has width 0, wait for it). Copy `fit(svg, draw, o)` from `demo/03-charts.html`.
- A static SVG (no script) cannot redraw: author its `viewBox` at the intended render width (480 to 720 units for a reading column) and accept that its text scales with it — on a 375 px phone a 480-unit box shows 12 px text at about 9 px. Prefer a script-drawn chart when the page targets phones.
- Grid and axes recede. `font-variant-numeric:tabular-nums` wherever digits align.
- Render it and look at it. The validator checks colour, not layout — collisions and overflow are found by opening the page.

## Consumers — static sites and other pages

- **Static site, no build.** Copy `artifact-base.css` verbatim as the site's `base.css` and never edit it; site rules go in the site's own CSS, loaded after it. Re-copy on every DS release and prove it with `md5sum` against the source. Faces: `bun <skill-dir>/export-fonts.mjs <site>/fonts` writes the same woff2 bytes plus a `fonts.css` and the OFL texts; link `fonts.css` before `base.css`. First consumer: `/repos/www/public/` (digitalstoic.net, 2026-11-08).
- **theme-color.** Standalone builds emit one `<meta name="theme-color">` per versant, read from the base `--bg` at build time. A hand-written page copies the same two values: light `--bg`, dark `--bg`.
- **Reserved class names.** Every class of `artifact-base.css` is global. A consumer never reuses one of these names for another meaning; grep the base before naming a class. Names already hit by a consumer: `.mark` `.strip` `.num` `.fig` (www renamed its own to `.brand` `.chain` `.secnum` `.fig-n`).
- **Landing call to action.** A landing CTA is a link that invites to read, not a form control: EB Garamond 600 at `--t-lede`, background `--accent`, ink `--accent-ink`, radius `--r`, padding from `--s*`, no shadow, one per screen. Form buttons stay Hanken (rule 8). Settled with Mat on www, 2026-11-08.
- **Text inside an image.** The 12 px floor holds for HTML text. Text that belongs to an image (labels on an illustration, a HUD on a plate) is drawn as SVG text in the image's own coordinates and scales with it, like a static chart: author it at 12 units for the intended width and accept about 9 px on a phone. Never lay HTML text under 12 px over an image; move it into the SVG.
- **SVG filters.** Filter primitives (`feFlood`, `feColorMatrix`…) take literal colours and cannot follow tokens, like Mermaid. Use the light-versant hexes and write the exception in a comment at the top of the consumer's CSS.
- **Font coverage.** `ebgaramond-400` has no Greek (0 of 24 capitals) and no `onum` (fontTools, 2026-11-08). A page that needs Greek declares its own face with a `unicode-range`; never set `font-variant-numeric: oldstyle-nums`, it does nothing.

## Guardrails

- Emoji are allowed in every page (document, landing, tool) as markers that carry meaning: a state, a section type, a count, an action. Never decorative, never a row of them, never one alone where the word is needed: a button or a state keeps its word next to the emoji. In SVG text, add VS-16 (U+FE0F) and a colour emoji face in the font stack, or the glyph renders black. Decided by Mat 2026-11-08, replacing the v0.1 ban.
- Mermaid renders only in `<pre class="mermaid">`, never `<div>`. `%%{init:…}%%` takes literal hex only, so diagrams cannot follow token swaps — set diagram colors to the light-versant hexes and accept they do not invert.
- Colored `classDef` fills must include `color:#000`.
- Never centered by default. Never `rounded-lg` everywhere. Never an accent rail on a rounded card.
- Warm cream + serif + terracotta is the settled identity (Tablette), no longer a ban. Still banned: near-black + lone acid pop. No purple-to-blue gradient hero. No Inter, no Space Grotesk. No second serif next to EB Garamond.
- `prefers-reduced-motion` respected. Wide content in its own `overflow-x:auto` container.

## Content rules

- Real content, never lorem.
- Three assertion registers are a semantic device: use `.reg-fact` only with a real source, `.reg-cons` only with a date, `.reg-conv` only for a first-person position.
- Structural devices (numbering, eyebrows, dividers) must encode something true. Do not number what is not a sequence.

## Settled — do not reopen

No fork is open. The system is what `templates/gallery.html` renders. v0.1 "Guède vive" is retired.

- **Identity.** v0.2 "Tablette" (moodboard variant V4): parchment grounds, terracotta = human voice, blueprint blue = machine. Decided 2026-11-03.
- **Dark versant.** "Ardoise" (v0.5): cool slate grounds `#161A1F`/`#1E232A`, cream-grey ink, accent and voice lifted for the cooler ground; series unchanged. Chosen 2026-11-07 over warm brown, near-black and blueprint-paper variants (moodboard in the gist workshop, `wip/PALETTE-SOMBRE.md`).
- **Type.** By role, decided 2026-11-07 (DS 0.3), replacing "one family" and "3B": EB Garamond reads, Hanken operates and compares, JetBrains Mono holds what is copied verbatim. `body.mode-outil` only switches editorial labels to Hanken.
- **x-height.** `font-size-adjust:.5` on the serif, none on Hanken and mono.
- **Voice surface.** `.reg-conv` keeps its full `--voice-weak` background.
- **Series palette.** Six slots, order frozen, values unchanged from v0.1, re-validated on the Tablette surfaces. Changing any hex means re-running the validator in both modes and accepting the new caps. Do not add a seventh slot.
- **Emoji.** Allowed as meaningful markers on every page, never decorative (2026-11-08).
- **Chart engine.** Inline SVG written by hand. Chart libraries excluded: CSP, no bundler, and a default look the guardrails ban.
