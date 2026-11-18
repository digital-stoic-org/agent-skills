---
name: list-contexts
description: List all CONTEXT files across code/, projects/, and vaults/ with status and metadata.
allowed-tools: [Bash, Read, Edit, Glob, AskUserQuestion]
model: haiku
---

# List Contexts

Scan `CONTEXT-*-llm.md` across code/, projects/, vaults/.

1. Resolve repo root + glob for CONTEXT files (parallel)
2. Read first 15 lines per file for metadata (saved, stream, status, focus)
3. Display grouped by area, sorted by saved timestamp
4. Optional: `--sync` updates INDEX.md, `--archive` moves stream to archived
