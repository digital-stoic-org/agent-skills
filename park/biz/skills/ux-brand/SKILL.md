---
name: ux-brand
description: Visual identity strategy — derives brand design tokens from audience psychology (Archetype × Tech-Comfort matrix). Produces design-system.yaml + brand-sheet HTML + rationale doc. Consumes /ux-strategize output. Use when "ux brand", "brand identity", "design system", "color palette", "visual identity", "brand strategy".
allowed-tools: ["Read", "Write", "Glob", "Grep", "Bash", "AskUserQuestion", "WebSearch", "WebFetch"]
model: sonnet
context: subagent
user-invocable: true
argument-hint: "[brand|audit|references] <subject> [--tone X] [--tech-comfort N] [--industry X] [--update]"
---

# UX Brand

## Workflow

1. **Parse** `$ARGUMENTS` → `{subcommand}` + `{subject}` + options. Default subcommand = `brand`. Missing subject → AskUserQuestion.

2. **Discover inputs** — Glob in priority order:
   - `biz/{subject}/ux/*-{subject}.md` (empathy-map, persona, forces, jtbd, vpc, journey-map)
   - `biz/PRD-*-llm.md`, `biz/analysis/*{subject}*`
   - `biz/{subject}/ux/design-system.yaml` (existing tokens — required for `audit` and `--update`)
   - Nothing found → AskUserQuestion: audience description, industry, emotional need, tech-comfort (1-10)

3. **Classify audience** — See `references/brand-archetypes.md`:
   - Extract emotional landscape from empathy map `feels` + forces `anxiety`/`push` → select primary archetype (+ optional blend)
   - Extract tech-comfort from persona `tech_comfort` field (or infer from `tools_used`, `age`, `profession`)
   - `--tone` and `--tech-comfort` override artifact-derived values
   - Detect locale/industry from artifact content + `--industry` hint

4. **Research references** — If WebSearch available:
   - Generate queries from archetype × tech-comfort × industry. See `references/benchmark-framework.md`
   - Discover 4-layer references: familiarity anchors, aspiration ceiling, anti-references, cross-industry
   - Fallback: read `scripts/benchmark-defaults.yaml`

5. **Derive tokens** — See `references/brand-archetypes.md` + `references/color-psychology.md` + `references/typography-strategy.md`:
   - Select palette/typography/iconography base from archetype
   - Adjust for tech-comfort level (see matrix)
   - Adjust for cultural context (`references/cultural-context.md`)
   - Test all color pairs for WCAG AA (`references/color-psychology.md` §WCAG)
   - Validate against `references/anti-patterns.md`
   - **Derive visual/imagery strategy** — When tech-comfort ≤ 5 OR early-stage product (no asset budget), default `imagery.strategy` to `zero-asset` and derive:
     - Emoji vocabulary: map each UI concept (statuses, actions, alerts, categories) to one consistent emoji. Semantic only, never decorative.
     - Color blocks: hero gradient (dark → primary), alternating section backgrounds, stat cards as visual anchors (large numbers in 48px+ bold = the "imagery")
     - Typography as design: giant stat numbers replace illustrations for feature explanation
     - Whitespace as design: generous spacing replaces decorative elements
     - Set `imagery.upgrade-path` to guide future investment (e.g., "v2: commission line illustrations")
   - Output schema: `references/design-system-schema.md`

6. **Generate outputs** — Branch by subcommand:

### `brand` (default) — Full identity derivation

Write 3 artifacts:
- `biz/{subject}/ux/design-system.yaml` — tokens (superset of `/ux-wireframe` format, backward compatible). If `--update`: read existing tokens, compute diff, update incrementally (not replace). Include "Design System Diff" section in rationale doc.
- `biz/{subject}/ux/brand-sheet-{subject}.html` — self-contained style tile: palette with hex + contrast ratios, typography scale, component samples (button/card/input/alert/badge), do/don't visual comparisons, reference mood, archetype badge. Inline CSS, no CDN. See `references/rationale-template.md` §Brand Sheet for content spec. **When imagery.strategy = "zero-asset"**, include a visual strategy demo section at the top: hero gradient mock (live CSS), stat card pattern (3 cards with large numbers), and emoji semantic mapping table. This shows downstream skills and stakeholders HOW the zero-asset approach looks in practice, not just what the tokens are.
- `biz/{subject}/ux/brand-rationale-{subject}.md` — decision log per `references/rationale-template.md`

### `audit` — Evaluate alignment

Read existing `biz/{subject}/ux/design-system.yaml` + UX artifacts. Report:
- Archetype alignment score (derived vs actual tokens)
- Tech-comfort mismatches (e.g., icon-only for low-tech)
- Contrast failures, palette coherence, font appropriateness
- Recommendations with rationale

### `references` — Research only

Present 4-layer reference analysis to console (no files written):
- Familiarity anchors + aspiration ceiling + anti-references + cross-industry
- Each with URL, rationale, and relevance to archetype × tech-comfort

7. **Open** — `xdg-open` / `open` the brand sheet (brand subcommand) or print report (audit/references).

8. **Human gate** — Present summary to user: archetype selected, tech-comfort level, key palette colors, font choice, reference sites. AskUserQuestion: "Does this brand identity direction look right? Adjust anything before finalizing?" Wait for approval. Downstream skills (`/ux-wireframe`, `/ux-polish`) consume these tokens — changes after are expensive.

## Archetype → Design Quick Ref

| Archetype | Emotion | Color | Type | Icons |
|---|---|---|---|---|
| Calming Trust | Fear/anxiety | Cool blue, muted green | System sans, 18px, generous | Label-always |
| Urgent Action | Anger/frustration | Amber accent, neutral base | Strong hierarchy, condensed heads | Label+icon |
| Playful Approachable | Curiosity | Bright primary + pastel | Geometric sans, rounded | Flexible |
| Premium Authority | Status | Dark + gold/navy | Serif or tight sans | Contextual |
| Utilitarian Tool | Efficiency | Neutral + one accent | System fonts, compact | Icon-label OK |
| Empowering Guide | Helplessness | Warm neutral + teal | Clear hierarchy, instructional | Label-always |

## Testing

- **Standalone**: Smoke test with `/ux-brand relance-impayes` against existing UX artifacts, then verify downstream chain `/ux-wireframe` → `/ux-polish` reads generated tokens.
