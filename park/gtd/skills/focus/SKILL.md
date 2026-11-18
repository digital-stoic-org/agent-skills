---
name: focus
description: Daily focus list — scan all projects, rank tasks by priority, return top 3-5 for today. Use when user says "focus", "what should I work on", "today's tasks", "daily priorities".
context: subagent
allowed-tools: [Glob, Read]
model: sonnet
user-invocable: true
---

# GTD Focus

Scan all project files, rank unchecked tasks, return today's top 3-5. Read-only — no writes to vault.

## Instructions

1. Get today's date (ISO format YYYY-MM-DD)
2. Read today's coaching pulse (optional): `/home/mat/dev/gtd-pcm/06-coaching/daily/YYYY-MM-DD.md`
   - Extract `energy:` field (1-10). If file missing or field absent, skip energy filter.
3. Glob all project task files: `03-projects/*/01-*.md` under `/home/mat/dev/gtd-pcm/`
4. Read ALL matched files in parallel (single message, multiple Read calls). Parse unchecked tasks (`- [ ] ...`) with section + tags.
5. Score each task (see Ranking Algorithm)
6. If pulse available: apply energy filter
7. Sort descending, take top 3-5
8. Output focus list with staleness flags

## Ranking Algorithm

**Score = project_priority × section_weight × tag_weight**

| Factor | Key | Weight |
|--------|-----|--------|
| **project_priority** (folder NN) | 01–09 | 1.0 |
| | 10–19 | 0.8 |
| | 20–29 | 0.6 |
| | 30–39 | 0.4 |
| | 50–59 | 0.2 |
| **section_weight** (header) | `## Top` / `## Today` / `## Frog` | 1.0 |
| | `## Next Actions` / `## Next` | 0.8 |
| | `## Soon` / `## This Week` | 0.5 |
| | `## Backlog` / other | 0.2 |
| **tag_weight** (task tags) | `#frog` | 1.5 |
| | `#next` | 1.2 |
| | `#deep` | 1.0 (energy-filtered) |
| | `#braindead` | 0.8 |
| | `#waiting` | 0.3 |
| | no tag | 1.0 |

**Staleness**: `[created:: YYYY-MM-DD]` age ≥ 14d → append ⚠️. Missing date → skip (no error).

**Energy filter**: Pulse `energy ≤ 3` → exclude `#deep` tasks.

## Output Format

```
## 🎯 Focus for YYYY-MM-DD

1. Task description ⚠️ (if stale)
   📁 03-projects/NN-name/01-name.md | score: X.XX | #tags

2. Task description
   📁 03-projects/NN-name/01-name.md | score: X.XX | #tags

...
```

Show source project path for every task. Include score for transparency.
If pulse read: show `Energy: N/10` header line.
If no tasks found: report "No unchecked tasks found in projects."

## Constraints

- **Read-only**: Never write, edit, or create any file
- Top 3 minimum, top 5 maximum
- Skip completed tasks (`- [x]`)
- Skip waiting tasks (`#waiting`) unless no other tasks available
