# Digital Stoic artifact design system — agent reference

version: 0.3.1 | palette: tablette | updated: 2026-11-07

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

Unknown slug aborts the build. Never link a font CDN — artifact CSP blocks it, produces silent fallback.

Layout of this skill:

| where | what |
|---|---|
| `SKILL.md` | index and non-negotiables |
| `reference.md` | this file |
| `artifact-build.mjs` + `artifact-base.css` + `fonts/` | the assembler and what it injects. It resolves its assets from its own directory, so these three move as one block or not at all. |
| `templates/` | `gallery.html` (living spec, every class rendered) and `identity.html` (document skeleton) |
| `demo/` + `check-demos.mjs` | six full screens on one fictional domain, numbered from simple to complex: `01-document` `02-landing` `03-charts` (document mode), then `04-dashboard` `05-decision` `06-mini-app` (tool mode). The checker fails a demo that hardcodes a colour or font, uses an undefined class, carries a stale `@ds:` version stamp or does not assemble; it also fails when the palette table of `templates/gallery.html` drifts from `artifact-base.css`. It rebuilds the gallery as `00-gallery.html` and every demo into `demo/build/` (git-ignored, regenerable). |

Output goes to the calling project's `build/` folder: regenerable, but somewhere the user can open or host without hunting. Never `/tmp/`.

## Tokens

Never hardcode a color. Style only through tokens. Palette is defined four times in the base CSS: `:root`, `@media (prefers-color-scheme: dark)`, `:root[data-theme="dark"]`, `:root[data-theme="light"]`. The viewer's toggle stamps `data-theme` and must win over the media query in both directions.

```
--bg --surface --sunk          grounds
--fg --muted --faint           ink
--line --line-strong           rules
--accent --accent-weak --accent-ink
--voice --voice-weak
--ok --warn
--crit-bg --crit-fg
--cat-1 … --cat-6              series identity (fixed order, never cycled)
--seq-1 … --seq-5              continuous magnitude (one hue, light→dark)
--dv-mid                       diverging midpoint (neutral gray)
```

Scale: `--s1:.45rem --s2:.8rem --s3:1.2rem --s4:2rem --s5:3.2rem --s6:5rem` · `--r:6px`
Type: `--serif` (EB Garamond, what is read) `--sans` (Hanken, what is operated or compared) `--mono` (JetBrains Mono, what is copied verbatim)
Label tokens (editorial labels only): `--label-font --label-caps --label-tt --label-ls --label-size --label-w --label-adjust`. Edito (default) = Garamond `all-small-caps`; `.mode-outil` on `<body>` = Hanken uppercase 600.

Palette tablette (light / dark):

```
bg #F2E9D8 / #1A140F        surface #FAF4E8 / #241C15     sunk #E9DCC3 / #120E0A
fg #2B1F16 / #EADFC8        muted #6E5A47 / #A8957D       faint #8C7862 / #7D6C58
line #D9C7A6 / #3D3125      line-strong #C4AE88 / #54453A
accent (machine, blueprint) #1F3F8F / #8FA9E8   accent-weak #E1E5EE / #1E2638   accent-ink #FAF4E8 / #1A140F
voice (human, terracotta)   #9A3B1A / #D9784F   voice-weak #EFD9C9 / #3A2219
ok #3A6B47 / #7DB38E        warn #8A6412 / #D6A84C         crit = fg/bg inversion
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

## Type roles

Font follows the element's role, not the page mode (decided 2026-11-07, DS 0.3). The base sets every family; a component never does.

- Read = `--serif` (EB Garamond): h1, h2, h3, `.lede`, body, lists, `.reg-conv p`, `.rail .marg` (italic), `.fig-t .fig-s`, `summary`, editorial labels. h1/h2 weight 400. Sizes come from the reading scale tokens `--t-body` 1.1rem, `--t-lede` 1.3rem, `--t-h2` `clamp(1.6rem,2.8vw,2rem)`, `--t-h1` `clamp(2.4rem,5.5vw,3.8rem)`; `font-size-adjust:.5` makes them appear 1.25× larger (body ≈ 22 px). `summary` = `--t-body` weight 600, with `--s2` below it when open. Hanken tables and inputs are 1rem.
- Operate and compare = `--sans` (Hanken): `button .chip th td input select textarea .hint .err .lgd`, `.kpis .n` (400, 2.1rem), `.viz text`, the dashboard rail `.dash`. Command, state and column labels (`button .chip th .ctl label span legend .kpis .l .gauge .l .dash dt`) are Hanken uppercase, `.1em`, 600, `.7rem`, in every mode.
- Copy = `--mono`: hex values, ids, token names (`td.hex td.name`), sources (`.reg-fact .src`), dates of consequences (`.reg-cons .when`), values of the document rail (`.rail dd`), code, overlay. Never for a label.
- Editorial labels (`.mark .who .eyebrow .rail dt .dicho h3 .reg .tag`) go through `--label-*` tokens only. Edito mode (default): Garamond `font-variant-caps:all-small-caps`, `letter-spacing:.07em`, 1rem. Tool mode: `<body class="mode-outil">` for dashboards, mini-apps, review pages switches them to Hanken uppercase. In the source, write `<!-- @body: mode-outil -->` and also put `mode-outil` on the outer wrapper so fragment mode keeps it.
- `font-size-adjust:.5` on `body` (Garamond x-height measured .40 em). Hanken (x-height .49 em) and mono elements reset it to `none` in the base. Do not set it per component.
- Figures: the embedded Garamond and Hanken both draw lining, tabular digits by default; `tabular-nums` is a no-op kept for fallbacks. The embedded Garamond has no `smcp`/`c2sc`: small caps are synthesized by the browser.

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

Palette parameters, validated against both surfaces (`#FAF4E8` light, `#241C15` dark; re-validated 2026-11-03 for v0.2, all checks pass in both modes):

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
node scripts/validate_palette.js "#5B8FE0,#D2685F,#2E9E8E,#8F7AD0,#B4842F,#CE6E9B" --mode dark  --surface "#241C15"
```

Rendering rules:

- Hand-authored inline SVG. No chart library, no CDN — the CSP forbids external assets and there is no bundler. Mermaid stays for flows and schemas, never for quantitative data.
- One colour mechanism: `.se-N` sets `color` on the element or its `<g>`, and marks inherit through `currentColor`.
- Text wears text tokens, never the series colour — the swatch beside it carries identity.
- One axis. Never a dual-axis chart; two measures of different scale become two charts or an indexed common base.
- Legend present for ≥ 2 series, absent for one (the title names it). At ≤ 4 series add direct labels. Never a number on every point.
- Every chart has a table view, or the figure carries visible labels — three light-versant slots sit near the 3:1 contrast line.
- Author the `viewBox` at roughly the intended render width — 480 to 720 units for a full reading column. `.viz` stretches to 100%, and SVG text scales with the viewBox, so a 300-unit box in a 900px column renders a 9px label at 27px. Cap with `max-width` when the figure is meant to stay small.
- Grid and axes recede. `font-variant-numeric:tabular-nums` wherever digits align.
- Render it and look at it. The validator checks colour, not layout — collisions and overflow are found by opening the page.

## Guardrails

- No emoji as section markers in artifacts. (Emoji stay in CLI replies and structured YAML, not in the rendered page.)
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
- **Type.** By role, decided 2026-11-07 (DS 0.3), replacing "one family" and "3B": EB Garamond reads, Hanken operates and compares, JetBrains Mono holds what is copied verbatim. `body.mode-outil` only switches editorial labels to Hanken.
- **x-height.** `font-size-adjust:.5` on the serif, none on Hanken and mono.
- **Voice surface.** `.reg-conv` keeps its full `--voice-weak` background.
- **Series palette.** Six slots, order frozen, values unchanged from v0.1, re-validated on the Tablette surfaces. Changing any hex means re-running the validator in both modes and accepting the new caps. Do not add a seventh slot.
- **Chart engine.** Inline SVG written by hand. Chart libraries excluded: CSP, no bundler, and a default look the guardrails ban.
