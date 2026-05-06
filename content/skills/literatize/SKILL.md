---
name: literatize
description: On-demand code annotator for LLM context preservation. Adds section-level comments capturing intent, rationale, and gotchas. Use when "literatize", "add literate comments", "annotate this file", "add section comments".
argument-hint: <file-path> [--dry-run] [--context <path>]
allowed-tools: [Read, Edit, Write, Glob, Grep]
model: sonnet
context: main
user-invocable: true
---

# Literatize — Code Annotation for LLM Context

Add section-level comments to code files that capture intent, rationale, and gotchas — optimized for LLM re-entry across ephemeral sessions.

Not literate programming (Knuth). Documentation embedded in code, following code structure. See [references/guide.md](references/guide.md) for theory and examples.

## Steps

1. **Parse arguments**: file path (required), `--dry-run` (show diff only), `--context <path>` (design docs, ADRs)
2. **Read target file** and any `--context` files
3. **Identify logical sections**: imports, config, classes, functions, routes, main, etc.
4. **Generate file header block**:
   - Purpose (1 line)
   - Architecture sketch (1 line — data/control flow)
   - Key invariants (1 line)
5. **For each section**, add a comment block (2-6 lines):
   - **What**: what this section does (1 line)
   - **Why**: design rationale (1-2 lines) — only if non-obvious
   - **Gotchas**: pitfalls, key decisions — only if relevant
   - **Flow**: data/control flow — only for routes/pipelines
6. **Use native comment syntax** (`#` Python, `//` JS/TS, `--` SQL, etc.)
7. **Section dividers**: `# ── N. Section Name` (no trailing padding, adjust prefix to language)
8. **Write file** (or show proposed comments if `--dry-run`)

## Rules

| Do | Don't |
|----|-------|
| Explain intent and decisions | Describe what code literally does |
| Assume cold-start reader | Assume prior context |
| Keep blocks 2-6 lines | Write essays |
| Reference external docs when they exist | Duplicate info from variable/function names |
| Preserve ALL existing code | Reformat, refactor, add docstrings/types |

## Comment Style

```
# ════════════════════════════════════════
# Purpose: [what this file does]
# Architecture: [data/control flow sketch]
# Invariants: [key guarantees]
# ════════════════════════════════════════

# ── N. Section Name
# [What + Why + Gotchas as relevant, 2-6 lines]
```

## Dual Audience

- **LLMs** (primary): Capture decisions not in code (why X not Y, constraints, framework gotchas). Enable re-entry without external docs.
- **Humans** (secondary): Section headers as navigation, architecture sketch, gotcha prevention.
