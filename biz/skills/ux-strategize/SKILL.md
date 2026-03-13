---
name: ux-strategize
description: Strategic UX artifact generator — empathy maps, JTBD, journey maps, VPC, personas, customer forces from business analysis. Use when "ux strategy", "empathy map", "jtbd", "journey map", "value proposition", "persona", "customer forces", "ux artifact". Outputs ux/{artifact}-{subject}.md.
allowed-tools: ["Read", "Write", "Glob", "Grep", "AskUserQuestion"]
model: sonnet
context: main
user-invocable: true
argument-hint: "<artifact-type> <subject>"
---

# UX Strategize

Generate structured UX artifacts from business analysis. Dual output: markdown (human) + YAML (machine, for `/ux-wireframe`).

## Artifact Types

| Subcommand | Artifact | Framework |
|------------|----------|-----------|
| `empathy-map` | Empathy Map | NNGroup 4-quadrant |
| `jtbd` | Jobs To Be Done | Ulwick ODI |
| `journey-map` | User Journey Map | 4-layer engagement |
| `vpc` | Value Proposition Canvas | Strategyzer |
| `persona` | Proto-Persona | Data-grounded |
| `forces` | Customer Forces Diagram | Switch/Moesta |

## Workflow

1. **Parse** `$ARGUMENTS` → `{artifact-type} {subject}`.
   - If **subject missing** → AskUserQuestion.
   - If **artifact-type missing** → Glob `ux/*.md`, recommend next artifact per build order:

   | What exists in `ux/` | Recommend | Why |
   |---|---|---|
   | Nothing | `empathy-map` | Foundation — understand the user first |
   | empathy-map | `jtbd` | Structure the jobs from empathy data |
   | empathy-map + jtbd | `forces` | Understand switching behavior |
   | + forces | `journey-map` | Map end-to-end experience |
   | + journey-map | `vpc` | Align value prop to known jobs/pains |
   | + vpc | `persona` | Synthesize into coherent archetype |

   Present recommendation + confirm with user before generating.
2. **Load template** — Read `references/{artifact-type}.md` + `references/common.md`.
3. **Discover context** — Glob + Read (priority order):
   - `analysis/*{subject}*` and `analysis/*.md`
   - `PRD-*-llm.md`, `NOTES-*-learnings.md`
   - `ux/*.md` (prior artifacts for cross-referencing)
4. If no relevant input found → AskUserQuestion for target customer + pain context.
5. **Generate** artifact using loaded template (markdown + YAML schema + frontmatter).
6. **Write** to `ux/{artifact}-{subject}.md`.

## Output Contract

Every file must include both elements from the artifact reference:
1. **YAML frontmatter** (artifact, subject, persona, date, source_docs, engagement_layer)
2. **Structured YAML block** at end of file (§ Structured Data for /ux-wireframe)

## Key Rules

- Ground ALL content in source data — no fictional personas or invented verbatims
- Use original language from sources (preserve FR quotes when input is French)
- Cross-reference prior `ux/*.md` artifacts when available
- Tag engagement layer mapping per artifact
- See `references/common.md` for domain adaptations, kill criteria, and engagement layer mapping
