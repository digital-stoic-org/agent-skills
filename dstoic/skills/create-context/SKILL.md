---
name: create-context
description: Create baseline context from .in/ folder with manifest-driven organization (run once per project). Use when bootstrapping project context, setting up .ctx/ snapshot. Triggers include "create context", "bootstrap context", "setup context", "init context".
argument-hint: "[--force to overwrite existing .ctx/]"
allowed-tools: [Read, Write, Glob, Bash, AskUserQuestion, Task]
context: main
user-invocable: true
---

# Create Context

Bootstrap project context from `.in/` folder → `.ctx/` snapshot + baseline + RISEN INPUT table.

## Folder Architecture

- **`.in/`**: Immutable bootstrap (user dumps raw docs, never modified by commands)
- **`.ctx/`**: Actionable snapshot (generated: manifest + summaries + copied files)

## Steps

### 1. Prerequisites

```bash
[ -d .in/ ] || error "No .in/ folder found. Create it and add source files first."
[ -d .ctx/ ] && [ "$1" != "--force" ] && error ".ctx/ exists. Use --force to recreate."
```

Skip security-sensitive files: `.env*`, `*credentials*`, `*secrets*`, `*token*`, `*.key`, `*.pem`, `*.crt`

### 2. Scan & Prioritize

1. Glob: `.in/**/*.{md,txt,csv,yaml,json}`
2. AskUserQuestion per file: HIGH / MEDIUM / LOW + brief description

### 3. Create .ctx/ and Generate Manifest

Write `.ctx/manifest.yaml` — see `reference.md` for schema.

### 4. Context Sizing & Copy

Token estimation: `tokens ≈ words / 0.75` (via `wc -w`)

| Priority | ≤ threshold | > threshold, ≤25K | > 25K |
|----------|-------------|-------------------|-------|
| HIGH | ≤1500 → inline | summarize directly | summarize via sub-agent |
| MEDIUM | ≤2500 → inline | summarize directly | summarize via sub-agent |
| LOW | reference only | — | — |

Copy HIGH/MEDIUM files to `.ctx/`, preserving subdirectory structure.

### 5. Summarize (if needed)

- Direct: Read + generate ~500 token summary → `.ctx/{nn}-{basename}-summary-llm.md`
- Sub-agent: Task(`summarize-for-context`) for files >25K tokens

### 6. Write Baseline

Create `CONTEXT-baseline-llm.md` with inline content + summary refs + LOW references.
Target: ≤2000 tokens.

### 7. Output

Report: file counts, RISEN INPUT table, suggest `/save-context baseline`.

See `reference.md` for manifest schema, baseline template, and validation rules.
