---
name: focus
description: Daily focus list — scan all projects, rank tasks by priority, return top 3-5 for today
context: fork
allowed-tools: [Glob, Read]
model: sonnet
---

# GTD Focus

Scan all project files, rank unchecked tasks, return today's top 3-5. Read-only — no writes to vault.

## Instructions

1. Get today's date (ISO format YYYY-MM-DD)
2. Read today's coaching pulse (optional): skip if missing
3. Glob all project task files: `03-projects/*/01-*.md` under the vault path
4. Read ALL matched files in parallel (single message, multiple Read calls), then parse unchecked tasks
5. Score each task: project_priority × section_weight × tag_weight
6. Sort descending by score, take top 3-5
7. Output focus list with source project paths and scores
