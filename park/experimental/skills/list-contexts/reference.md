# list-contexts Reference

## Output Template

```
# 📋 Context Registry

## code/ (N contexts)
| Project | Context | Status | Focus | Saved |
|---|---|---|---|---|

## projects/ (N contexts)
| Project | Context | Status | Focus | Saved |
|---|---|---|---|---|

## repos/ (N contexts)
| Project | Context | Status | Focus | Saved |
|---|---|---|---|---|
| agent-skills | merge-command-skills | 🏗️ building | S3+S4 complete, Batch 2 ready | 2026-02-24 |

## vaults/ (N contexts)
| Project | Context | Status | Focus | Saved |
|---|---|---|---|---|

### 📦 Done (per area)
| Area | Project | Context | Status | Focus | Saved |
|---|---|---|---|---|---|
| code | skills | migration-commands | ✅ done | Command migration complete | 2026-02-08 |
| repos | agent-skills | static-hosting | ✅ done | Surge deployment skill complete | 2026-02-10 |

---
📊 Total: {N} active + {N} archived ({N} code, {N} projects, {N} repos, {N} vaults)
🔍 exploring: {N} | 🏗️ building: {N} | ✅ decided: {N} | ⏸️ parked: {N} | ✅ done: {N}
⚠️ Stale (>30d): {N} active contexts need triage
```

## Status Mapping

| Raw Value | Display |
|-----------|---------|
| `exploring` | 🔍 exploring |
| `decided` | ✅ decided |
| `building`, `in_progress` | 🏗️ building |
| `parked` | ⏸️ parked |
| `operational`, `verified` | ✅ operational |
| `done`, `completed`, `closed` | ✅ done |
| missing/empty/`n/a` | ❓ unknown |

## INDEX.md Sync Format (`--sync`)

Regenerate Active Contexts table. Sort by Area (alphabetical), then Saved (descending).

```
## Active Contexts

| Area | Project | Context | Status | Focus | Saved |
|---|---|---|---|---|---|
| {area} | {project} | {stream} | {status emoji} | {focus ≤80 chars} | {YYYY-MM-DD} |
```

Preserve Parked/Done/Archived sections unchanged. Update summary counts.
**Exclude** files in `done/` subfolders from Active table — they are archived.

## Archive Format (`--archive <stream>`)

1. Find row in Active/Parked/Done by Context column
2. AskUserQuestion for reason: "No content" | "Work completed" | "Superseded" | "Not developing"
3. Move to Archived table:

```
## Archived

| Area | Folder | Contents | Why Archived |
|---|---|---|---|
| {area} | {project} | {brief description from focus} | {user reason} |
```

## Error Messages

| Condition | Message |
|-----------|---------|
| No CONTEXT files found | "No context files found under `$ROOT`. Run `/save-context` in a project to create one." |
| Not in a git repo | "⚠️ Not in a git repo. Scanning from CWD: `{cwd}`" |
| File unreadable | Skip with warning, don't abort |
| No frontmatter | Extract available data, mark status ❓ unknown |
| Nested projects | Show full relative path as project name |
| Gitignored folder | Silently exclude |
| INDEX.md malformed | "⚠️ INDEX.md appears malformed. Regenerating Active section only, preserving other content." |
| `--sync` + `--archive` | "⚠️ Cannot use --sync and --archive together. Run them separately." |
| `--archive` not found | "⚠️ Stream '{stream}' not found in INDEX.md" |
