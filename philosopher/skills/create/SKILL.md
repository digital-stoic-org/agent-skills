---
name: create
description: "Create a new philosopher persona from a historical thinker or figure. Use when: /create <name>, add philosopher, new persona, create thinker skill, historical figure dialogue."
allowed-tools: [Read, Write, Bash, AskUserQuestion]
argument-hint: "<name> [--lang XX] [--focus area]"
model: opus
context: main
user-invocable: true
---

# Create — Philosopher Persona Generator

Meta-skill that generates a new philosopher persona following the established plugin patterns. Creates `SKILL.md` + `reference.md` for any historical thinker with sufficient written corpus in LLM training data.

## Arguments

| Arg | Required | Description | Example |
|-----|----------|-------------|---------|
| `<name>` | ✅ | Thinker's common name → becomes skill name + directory | `montaigne` |
| `--lang` | ❌ | Primary language for key concepts (auto-detected from origin) | `--lang el` |
| `--focus` | ❌ | Emphasis area if thinker is multi-domain | `--focus ethics` |

## Procedure

### Step 1 — Corpus Assessment

Evaluate LLM training data coverage for the requested thinker. Use embedded knowledge — do NOT web search.

Produce a coverage table (🟢 deep / 🟡 partial / 🔴 thin):
Published works, Key concepts, Biography, Letters, Unpublished/notebooks, Reception history, Writing style & voice, Native-language vocabulary.

**Gate**: >2 🔴 → warn user, suggest alternative. Wait for confirmation.

### Step 2 — Generate Persona

Load templates, then generate both files. See `reference.md` for full section checklist and quality criteria.

- Read `../../framework.md` + `../nietzsche/reference.md` + `../nietzsche/SKILL.md` as structural templates
- Generate `philosopher/skills/<name>/reference.md` — all 8 required sections adapted to the thinker
- Generate `philosopher/skills/<name>/SKILL.md` — following nietzsche SKILL.md pattern with thinker-specific voice and cutoff date

### Step 3 — Review Gate

Present both files to user. Ask: voice authentic? periods correct? concepts complete? opening lines land? challenges sharp? Iterate if needed.

### Step 4 — Write Files

Create directory with `mkdir -p`, then write both files. Remind user to test with `/<name>` and run `/edit-plugin` for version bump.
