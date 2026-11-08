---
name: verdict
description: Verdict page (ex review-html). Build a self-contained HTML review page for Mat (minimal cards typed by the action Mat takes, silence has a meaning per type, JSON of deviations pasted back in chat). Use when Mat must validate a deliverable (doc, plan, spec, code change, research brief) or settle 3+ decisions, or asks for a "revue HTML" / "page de revue".
---

# verdict (ex review-html)

Goal: Mat validates in a browser (Windows PC or phone) in ~3 minutes; only his deviations come back as JSON pasted in chat.

Kit dir `/repos/agent-skills/gist/skills/verdict/` (source of truth, gist plugin): src/template.src.html (the source: verdict CSS layer, chrome, runtime), template.html (assembled from it, the file you copy), check-page.py, grammaires/vignettes.html (visual markup per grammar id, generated), grammaires/grammaires.md (full catalog, generated; phase finir or debrief only). Regenerate the generated two with `python3 /repos/agent-skills/gist/skills/verdict/grammaires/src/make-grammaires.py` (sources: the three BRIEF-*.md next to it; it also injects the thumbnail CSS into the source and reassembles template.html); never hand-edit them or template.html.

## When
- deliverable to validate, or >= 3 decisions -> page
- < 3 decisions and no deliverable -> A/B/C questions in text, no page

## Phase (set by Mat in the request: "revue explorer|construire|finir"; unsaid -> explorer, shown in the hero tag)
| phase | cards shown | budget (cards / first-level words) | the rest |
|---|---|---|---|
| explorer | critical + medium only | 7 / 250 | count in the hero details "N détails reportés dans <plan file>"; write them there |
| construire | + important minor points | 10 / 400 | grouped in one tri card |
| finir | everything, exhaustive | no cap | nothing hidden; grammaires.md usable |

80/20 rule: never spend Mat's time on the 20% details outside phase finir. Dropped points are counted in the hero and written to the work's plan, never lost.

## Card types (by the action Mat takes; `data-type` on every `data-block`)
| type | Mat does | silence means | markup |
|---|---|---|---|
| constat | nothing unless he disagrees | agreed | title = the claim + at most 1 visual; no sentence at first level: the proof goes in `<details><summary>détail</summary>` |
| decision | chooses | medium: reco applied; critical: blocked | `data-level`, `.opts > .opt2[data-opt]`, `.recline` |
| question | gives info only he has | blocked | title = the question; what it blocks goes in `<details><summary>détail</summary>` |
| relecture | reads the text itself (the deliverable) | not validated | verbatim text by script; `del`/`ins`/`mark` for changes |
| tri | sets each item's state | each item's default | card `data-choices="garder|reformuler|jeter"` (first = default; omitted = garder|plus-tard|jeter); `ul.tri-l > li[data-item="<id>"]`, `data-default="<choice>"` when the proposal differs |
| essai | does a gesture outside the page, reports | not done | `<b>Geste :</b> … <b>Attendu :</b> …` |

Decision levels:
- minor (reversible, cheap): agent decides; becomes a constat "j'ai choisi X car Y". Never a decision card.
- medium (reversible, costly to undo): `data-level="moyenne" data-default="<opt>"`, reco preselected, options without pros/cons (those go in `<details>`), recline `<b>★ X</b> · <reason>` ending "Sans réponse : X."
- critical (irreversible, outward-facing: public, sending, money; or changes scope): `data-level="critique"`, no default, `<span class="crit">🛑 CRITIQUE · <why> · réponse obligatoire</span>` first, recline `<b>★ X</b> · <reason>`, consequence in `<details>`.

## Card minimalism
Wording: eli42 — plain words, complete sentences that say what is at stake ("Sur quelle partie tester ?", "★ A · lisible sur téléphone."); never telegraphic or implicit labels, never internal jargon. Fill the caps below with clear words; the full text goes in `<details>`.
Caps per element (first level; check-page.py warns past them): title <= 6 words (noun phrase or short claim, never a sentence) · body <= 1 line, 15 words · option <= 5 words · reco reason <= 12 words · tri line <= 6 words · hero <= 30 words.
- cuts Vabc (Mat, 08/11): (a) emoji markers on section headings, counts and buttons, the word kept beside them; (b) no grey line (`.cap`) at first level, the reco is `★ X · reason`; (c) a constat is its title plus at most one visual. Everything else goes in `<details><summary>détail</summary>`, which every card may carry. check-page.py warns on (b) and (c).
- one visual per card at most; the visual replaces the text, never adds to it; its caption goes in `<details>`.
- no method at first level: provenance, how it was checked, counting rules, internal ids (R62, S01…) go in `<details>` or nowhere.
- a passed check is not a card: one item in the hero details ("26 citations vérifiées"); only a failed check becomes a constat.
- states are shown, not written: proposals are preselected (`data-default`), doubts are a glyph `<span class="flag" title="<why>">⚠️</span>`; never "proposé : X" or "voix incertaine" in text.
- no tags in cards, no provenance strip, no badges; the only color accent is the verdict state (runtime).
- detail goes second level: `<details><summary>détail</summary>…</details>` in the card, or a separate debrief page only when Mat asks.
- hero: phase tag + project tag, h1 = the question Mat answers (short), one bold line of counts per type, each with its emoji (🎯 décisions · ❓ questions · 🔍 constats · 📖 relectures · 🗂️ tris · 🧪 essais), then `<details><summary>source et contrôles</summary>` (source · date, passed checks, dropped details + plan file).
- order and headings: "🎯 À trancher" (critical decisions, then medium, then questions), then "🔍 Constats", "📖 Relecture", "🗂️ Tri", "🧪 Essais". Omit empty sections. Response buttons carry their emoji from the runtime (✋ ✅ ✏️ ❌ ⏳ ❓ 💬, tri 👍 🗑️).

## Visual by content shape (copy the `div.sk` from grammaires/vignettes.html `id="<ID>"`, write it `<div class="sk full">`, put real data in)
| content shape | visual |
|---|---|
| before / after figures | V05 slopegraph |
| share or state of a whole | V01 segmented bar |
| compared quantities | V07 dot plot, V35 unit chart |
| options side by side | V10 option cards (V09 Pugh table in details) |
| steps, order | `.flow > .st/.ar`, V29 timeline |
| argument structure | V16 claim tree |
| architecture, impact | V18 C4 boxes, V24 blast rings |
| risks | V12 risk matrix |
| code diff | V38 diff-stat bar (`pre` diff in details) |
| positioning, prioritising (tri > 8 items) | V11 2x2 |
| items x criteria (coverage, conformity) | `table.grille`, cells `td.y/.n/.p` (V26, V27 for reference) |
| annotated text, prose diff | `mark`, `del`, `ins` inline (P07, P05) |
| visual specimens (renders, swatches, fonts) | `.planche > figure > … + figcaption` |
| durations on a calendar | `.gantt`: label span + `span.tr > i[style="left:x%;width:y%"]`, `i.no` late, `b[style="left:x%"]` deadline |
| links between items | inline `<svg class="svg">`: rect + text nodes, line arrows; <= 8 nodes |

No shape -> title only, the text in `<details>`. Default per type: relecture = annotated text, tri = list (2x2 beyond 8), essai = V34 step table, decision = V10.

## Steps
1. `cp /repos/agent-skills/gist/skills/verdict/template.html <project>/build/review-<slug>.html` (`<project>` = folder of the deliverable; create `build/` if missing). Never read template.html beyond the content zone (fonts are 150 KB of base64 lines).
2. Set `meta review-id` = `<slug>-YYYYMMDD`, `meta review-phase`, `<title>`, top-bar title (`TITRE_COURT` in `.top strong`).
3. Sort the points: type each one, grade decisions, apply the phase filter; write dropped points to the plan.
4. Replace everything between `REVIEW-HTML:CONTENT:BEGIN` and `CONTENT:END` (the template's content is a one-card-per-type example). Never edit the style, top bar, global block, dialog or runtime.
5. `python3 /repos/agent-skills/gist/skills/verdict/check-page.py <page>` -> must print OK (`-` lines = errors, fix); `~` lines = budget or cap warnings: shorten, move to details, or drop; rerun until no `~` line remains (template example aside).
6. Give Mat the URL `http://100.64.0.1:8000/<path relative to /praxis>` (his `python3 -m http.server 8000` runs from /praxis; check with `curl -s -o /dev/null -w '%{http_code}' <url>`; page outside /praxis or server down -> SendUserFile `display: render` + absolute path). Stop. Wait for the pasted JSON or "traite le feedback".
7. On JSON (below): act on `reponses`; record `defauts_appliques` as decided; `sans_reponse.bloquants` -> ask again, do not proceed on them; `relecture` / `essai` left -> not validated / not done, say so. Next round: first block "ce que j'ai fait de tes retours" as constats (one per response).

## Feedback JSON (deviations only)
`{review_id, phase, envoye_le, global:{verdict, commentaire}, reponses:[{id, type, verdict, commentaire?, items?}], defauts_appliques:{<decision id>: <opt>}, sans_reponse:{bloquants:[ids], relecture:[ids], essai:[ids]}}`
Verdicts: constat `non`; decision `<opt>` or `question`; relecture `ok|corriger`; essai `ok|ecart|pasfait`; question = `commentaire`; tri `items:{<item id>: <choice>}` only where it differs from the item's default. "Envoyer" = Mat attests he went through the page.

## Contract kept
- block id kebab-case, unique, stable across rounds (feedback is keyed by id).
- every internal id or label shown carries a short plain description; never a bare code.
- verbatim content (diff, quotes, code, figures read from files) is inserted by a script (python reads the source, `html.escape`), never retyped.
- UI text in French; no external resource (no CDN, font or image URL); the page stays standalone.
- registers: serif = what Mat reads; blueprint accent (`code`, `pre`, base `.kpis .n`) = code-produced facts. Emoji: meaningful markers only (state, section type, count), never decorative, the word kept beside them (DS 0.6.1).
- no render or screenshot: Mat validates the visual.

## Style source
The page is the Digital Stoic design system, tool mode (`/repos/agent-skills/gist/skills/design-system/`, DS >= 0.6.0): base CSS and fonts are injected by the DS assembler, never copied by hand. Edit `src/template.src.html`, never `template.html`, then reassemble: `python3 /repos/agent-skills/gist/skills/verdict/grammaires/src/make-grammaires.py` (or `bun /repos/agent-skills/gist/skills/design-system/artifact-build.mjs src/template.src.html template.html` from the kit dir when the grammar sources did not change).
- source layout: `@font` + `@base` markers, then `GRAMMAR-CSS` (generated), then the `VERDICT` layer (chrome, blocks, options, pills, tri, visuals), body `mode-outil`, then the content zone and `RUNTIME`.
- tokens and type roles come from the base; the VERDICT layer uses tokens only (no hex, no raw font size). State colours: `--ok` / `--warn` / `--no` with their `-weak` grounds; `--no` = refusal, never `--voice`; critical = inversion `--crit-bg` / `--crit-fg`; the active choice = `--accent`.
- rules, not cards: a block is a left rule coloured by its state (runtime class `s-*`); no shadow, no gradient, radius `--r`.
- a colour change goes in the DS base first (`artifact-base.css`, its gallery table, check-demos), then reassemble here.
History and examples: `/praxis/projects/_archive/viz-review/build/` (pre-v1 pages: dense, older look, do not imitate).
