---
name: ux-wireframe
description: Generate interactive HTML wireframe prototypes grounded in UX research artifacts. Translates empathy maps, JTBD, forces, journey maps, VPC, personas into nuanced interaction design — not just labels, but information hierarchy, trust patterns, friction reduction, emotional pacing. Consumes /ux-strategize output. Use when "wireframe", "prototype", "mockup", "ux wireframe", "html prototype", "interaction design".
allowed-tools: ["Read", "Write", "Glob", "Grep", "Bash", "AskUserQuestion"]
model: sonnet
context: fork
user-invocable: true
argument-hint: "<subject> [--screens N] [--fidelity bw|clean|polished] [--flow]"
---

# UX Wireframe

## Workflow

1. **Parse** `$ARGUMENTS` → `{subject}` + options (`--fidelity bw|clean|polished`, `--screens N`, `--flow`). Missing subject → AskUserQuestion.

2. **Discover inputs** — Glob in priority order:
   - `ux/*-{subject}.md` (from `/ux-strategize`)
   - `PRD-*{subject}*-llm.md`, `analysis/*{subject}*`
   - `dev/ux/design-conventions.md` (optional overrides)
   - Nothing found → AskUserQuestion for: target user, core job, key anxiety.

3. **Design brief** — See `references/design-translation.md`:
   - Extract YAML blocks, cross-reference artifacts, build interaction design decisions
   - Identify contradictions (says vs thinks), force imbalances, emotional peaks, opportunity gaps
   - Determine language from artifact content (don't assume locale)

4. **Map screens** — See `references/screen-mapping.md`:
   - **Engagement**: `references/patterns.md` (entry, result, dashboard, alerts)
   - **Functional**: `references/functional-patterns.md` (lists, forms, detail, workflows, settings)
   - Derive from: journey stages → JTBD core job arc → VPC → ask user

5. **Design system** — Glob `dev/ux/design-system.yaml`. Missing → create from `scripts/design-system-defaults.yaml`.

6. **Generate HTML** per screen — See `references/html-template.md` + `references/ux-principles.md` + `references/interaction-states.md`:
   - Use `scripts/boilerplate.html` as base skeleton
   - Apply design brief (infer design from insights, don't paste copy)
   - Calibrate complexity to persona tech comfort
   - UX laws: Fitts (CTA size), Hick (limit choices), Jakob (familiar patterns)
   - Trust signals where anxiety forces are strongest; emotional arc pacing
   - All states: loading, success, error, empty — never just happy path
   - Annotations ①②③ with rationale (WHY not WHAT) traceable to artifact source
   - Copy from artifacts in detected language (not lorem ipsum) — promptframe principle

7. **Write dual output** to `dev/ux/wireframes/{subject}/` — See `references/output-format.md`:
   - **Human**: `index.html` (navigator) + `NN-{screen-name}.html` (wireframes). `--flow` → linked navigation.
   - **LLM**: `screen-specs-llm.md` (component trees, states, transitions) + `design-brief.md` (rationale)
   - Self-contained HTML: inline CSS/JS, no CDN, mobile-first 375px, CSS custom properties

8. **Open** — `xdg-open` / `open` the index file.

## Artifact → Design Translation

| Artifact | Drives | NOT just |
|---|---|---|
| Empathy map | Tone, friction-reducers, says/thinks → reassurance patterns | Label text |
| JTBD | Information hierarchy, opportunity scores → feature prominence | Feature list |
| Forces | Trust signals, anxiety mitigators, habit-breaking flows | Onboarding copy |
| Journey map | Screen sequence, emotional pacing, moment-of-truth design | Linear funnel |
| VPC | Pain/gain asymmetry → lead with relief or aspiration | Headlines |
| Persona | Tech comfort → complexity calibration, day-in-life → entry points | User name |
