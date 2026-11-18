# load Reference

## Section Mapping

| CONTEXT Section | Report Block | Fallback names |
|----------------|-------------|----------------|
| Header fields (saved/stream/status/focus/goal) | Stream/Saved/Focus/Goal | — |
| `## Session` | 📋 Where you left off | `## Session Progression` |
| `## Next` | ✅ Next tasks | `## Next Tasks`, `## NextTasks` |
| `## Hot Files` | 🔥 Key files | `## Files` |
| `## Project` | 🎯 Project Context | — |
| `## Refs` | 📎 References | `## References` |

**Graceful degradation**: Missing/malformed sections → skip (don't error). Only Header + `## Next` required.

## Status Display

| Status | Emoji |
|--------|-------|
| `building`, `in_progress` | 🔄 |
| `exploring` | 🔍 |
| `decided` | ✅ |
| `parked` | 🅿️ |
| `done`, `completed`, `closed` | ✅ |
| missing/empty | ❓ |

## Human-Friendly Dates

Convert ISO timestamps to relative:
- Same day → "today"
- Yesterday → "yesterday"
- <7 days → "X days ago"
- <30 days → "X weeks ago"
- Otherwise → "X months ago"

## Error Messages

| Condition | Message |
|-----------|---------|
| No context files | `No saved sessions found. Use /switch to select a project, or start working and /save when ready.` |
| Stream not found | `Stream '{name}' not found. Available: {list}` |
| Stream in done/ | Load normally, prefix with `📦 Loaded from done/ — this context is archived ({status})` |
| File read error | `Could not read {filename}. Check file permissions.` |
| Malformed file | Parse what's available, skip unparseable sections |
