---
name: tune-voice
description: >
  Extract, define, and enforce a project's writing voice. Reverse-engineers a voice
  profile from real sample copy, or interviews you to build one, then applies it to
  drafts with a voice-constant / tone-flex model and validate-and-explain edits.
  Profiles are per-project artifacts at <project>/ref/tone-guide.md, resolved via
  config/projects.yaml. Use when user says "tone of voice", "voice guide", "brand
  voice", "make this sound like <project>", "extract voice", "apply voice", "does
  this match our tone".
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash]
model: sonnet
argument-hint: "[--project <alias>] extract <files> | apply <file> | interview | show"
context: main
user-invocable: true
---

# Tune Voice — Per-Project Voice Extraction & Enforcement

Give a project a durable, reusable writing voice. The voice is a **project artifact** — it lives at `<project>/ref/tone-guide.md`, not in global memory — so each project keeps its own voice and drafts can be checked against it.

Fork-and-adapt lineage (design borrowed, storage owned): 9-dimension profile + anti-performative guardrails from `entpnomad/tone-of-voice`; voice-constant / tone-flex + validate-and-explain from `brand-voice-enforcement`; extract-from-samples from `affaan-m/brand-voice`.

## Model: voice is constant, tone flexes

- **Voice constant** — identity, beliefs, audience, traits, terminology, banned phrases. Never changes across a project's copy.
- **Tone flexes** on three axes — **formality · energy · technical depth** — per channel (slide vs. Slack recap vs. cold email vs. golden-source doc).

A profile captures both. Enforcement holds the constant and picks the tone-flex for the channel at hand.

## Step 0: Resolve the profile path

1. Read `$PRAXIS_DIR/config/projects.yaml`. Match `--project <alias>` against project keys (case-insensitive); if a name is given instead, fuzzy-match `name` fields. If no `--project`, infer from the working directory (which project's `praxis:` path is an ancestor of `cwd`), else ask.
2. Profile path = `<project praxis root>/ref/tone-guide.md`, where the praxis root is the `praxis:` value for that alias (resolve `/praxis/...`, `/repos/...` aliases via `.claude/paths.md`).
3. **Leaf projects** (a `praxis:` path with sub-projects, e.g. Slasheo's guide lives under `ai-school-tech/ref/`): accept an explicit `--path <dir>` override, or Glob for an existing `**/ref/tone-guide.md` under the project root and reuse it.
4. Guards: if `$PRAXIS_DIR` unset → `⚠️ $PRAXIS_DIR not set. export PRAXIS_DIR="$HOME/dev/praxis"`. If config missing → `⚠️ No project config at $PRAXIS_DIR/config/projects.yaml`.

## Modes

| Mode | Command | Purpose |
|---|---|---|
| **extract** | `extract <files/globs>` | Reverse-engineer a profile FROM real copy → write `ref/tone-guide.md` |
| **interview** | `interview` | Build a profile from a 9-question interview (fallback when no samples exist) |
| **apply** | `apply <file>` | Rewrite/check a draft against the profile; validate and explain edits |
| **show** | `show` | Print the current profile (or a named section) |

Default when args are just file paths: **extract** if the profile is missing, **apply** if it exists.

---

## Extract — `extract <files>`

Read real sample copy and reverse-engineer the voice. Prefer the project's own artifacts (slides, docs, recaps, posts, READMEs). **Reject generic exemplars** as input — extract from what the project actually shipped.

Analyze across these signal dimensions (report only what's actually present):

- Sentence rhythm & length; compression vs. explanation balance
- Capitalization conventions; parenthetical frequency & function
- Question usage (frequency, rhetorical purpose)
- Claim sharpness; presence of numbers / mechanisms / "receipts"
- Transition mechanics; signature rhetorical patterns (e.g. `X >> Y`)
- Recurring metaphor families
- Stylistic prohibitions (what never appears)

Then write `ref/tone-guide.md` using the **profile schema** below. In the response, note which sample files fed the extraction and any low-confidence dimensions (too few samples).

## Interview — `interview`

Fallback when no representative copy exists. Ask, one at a time, and write answers into the same schema:

1. **Identity** — background, stance (peer? authority? builder?)
2. **Core belief** — the unifying, slightly provocative principle ("the billboard")
3. **Audience** — the real person you write for, their motivation, address form (tu/vous, first-name)
4. **Voice traits** — 3–5 descriptors (direct, contrarian, technical…)
5. **Topics** — 3–5 recurring subject areas
6. **Vocabulary** — preferred vs. avoided, as **pairs**
7. **Banned phrases** — cringe reflexes to eliminate
8. **Channels** — per-channel tone-flex (formality/energy/technical depth) + format rules
9. **Examples** — 3–4 reference lines that hit the voice exactly

## Apply — `apply <file>`

1. Load the profile (Step 0). If missing → suggest `extract` or `interview` first.
2. Determine the **channel** (from the file, the request, or ask) → select its tone-flex.
3. Rewrite/check the draft: hold the **voice constant**, flex tone for the channel.
4. **Honor guardrail-override sections first** — a profile may carry a `Garde-fous` / guardrails block that overrides imported rules; those always win (see Guardrails below).
5. **Validate and explain**: for each material change, name the rule that drove it (one line each) — never a silent black-box rewrite. Also surface **drift**: places the draft violates the profile you did *not* auto-fix, flagged for the user.
6. Respect **strictness** (see Settings): `strict` blocks/flags every violation; `advisory` fixes the clear ones and lists the rest.

## Show — `show [section]`

Print the profile, or a named section (e.g. `show vocabulary`). If missing → offer to extract/interview.

---

## Profile schema (`ref/tone-guide.md`)

```markdown
---
title: Tone Guide — <Project>
source: <files the profile was extracted from, or "interview">
method: <extract | interview>
status: ref stable
---

# Tone Guide — <Project>

> One-line purpose: what prose this governs.

## Voice constant

1. **Identité** — stance, who's speaking.
2. **Croyance-socle** — the billboard principle.
3. **Audience** — who, motivation, address form.
4. **Traits de voix** — 3–5, each with a one-line tell.
5. **Sujets récurrents** — recurring themes.
6. **Vocabulaire** — **Utilise:** … / **Évite:** … (pairs) + signature rhetorical patterns.
7. **Phrases / réflexes bannis** — hard bans.
8. **We Are / We Are Not** — contrastive identity pairs (sharper than a flat ban list).

## Tone flex (per channel)

| Canal | Formalité | Énergie | Profondeur tech | Format |
|---|---|---|---|---|
| <slides> | … | … | … | one idea/slide, visual emphasis |
| <slack recap> | … | … | … | 2–3 sentences, catalytic |
| … | … | … | … | … |

## Exemples-étalon
- "<line 1>"
- "<line 2>"

---

## Garde-fous (override imported rules — prime TOUJOURS)
<Project- or language-specific hard rules that beat any borrowed guidance.
 E.g. FR prose: emphasis via visual not markdown; verbe conjugué > nominal;
 no FR+EN doublon; métaphore filée ≤ 2 occurrences.>

⚠️ **Dérives repérées** — known drift to watch (not auto-corrected).
```

## Anti-performative guardrails (steal verbatim into every profile)

Bake these into the `Garde-fous` block unless the project overrides them:

- **No definition by negation** — don't lead with "this isn't X, isn't Y".
- **Never punch down / strawman** — write peer-to-peer.
- **No manifesto rhetoric or bumper-sticker closings.**
- **Show, don't tell** — experience-first, not prescriptive.
- **Don't parrot** the source when responding — add, don't restate.
- **Open with impact** — first line is a number, a claim, or a contrarian take.

## Settings (optional)

Read `<project>/ref/tone-voice.local.md` if present:

```yaml
strictness: advisory   # advisory (fix clear, list rest) | strict (flag all)
explain_edits: true    # narrate which rule drove each change
```

Absent → `advisory`, `explain_edits: true`.

## Key behaviors

- **Per-project, not global.** Never write voice profiles to Claude memory — always to `<project>/ref/tone-guide.md`.
- **Guardrails override imports.** The `Garde-fous` block beats any borrowed rule, always.
- **Explain, don't black-box.** Every material edit names its rule; unfixed violations are surfaced as drift.
- **Extract from real copy.** Reject generic exemplars; profile what the project shipped.
- **Voice constant, tone flexes.** Hold personality/terminology fixed; adapt formality/energy/depth per channel.
- **Config-driven paths.** All resolution goes through `$PRAXIS_DIR/config/projects.yaml`; unknown project → warn and suggest adding it.
