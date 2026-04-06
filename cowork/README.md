# cowork

Multi-project context management for non-CLI interfaces (Cowork desktop, Telegram, CC CLI). Menu-driven UX — no typed arguments, no flags.

## Skills

| Skill | Trigger | What it does |
|-------|---------|--------------|
| `/switch` | "switch project", "work on X" | Menu-driven project switcher. Loads CLAUDE.md chain + CONTEXT files |
| `/save-work` | "save", "checkpoint", "I'm done" | Menu-driven session save. 3-choice status (checkpoint/done/parking) + stream picker + drift detection |
| `/load-work` | "load", "resume", "continue" | Menu-driven session resume. Shows available sessions with focus preview |

## Agents

| Agent | What it does |
|-------|--------------|
| `sync-ref-wip` | Bidirectional ref/wip alignment. Auto-detects direction from timestamps + content maturity. Proposes minimal edits to the stale side. |

## Design Principles

- **Menu-first** — numbered choices, not typed arguments
- **3 choices max** per menu — don't overwhelm
- **Auto-detect over ask** — project name, stream name, status inferred when possible
- **Zero shell scripts** — pure Claude Code tools (Glob, Read, Write, Edit, AskUserQuestion). Fully portable across Linux, macOS, Windows
- **Same CONTEXT file format** as `dstoic:save-context` / `dstoic:load-context` — files are interchangeable
- **Client-agnostic output** — works in terminal, Cowork, Telegram. Simple lists + emoji, no tables or Mermaid
- **File Zones** — projects use `ref/` (or `reference/`) for read-only stable docs and `wip/` (or `work-in-progress/`) for active work

## Compatibility

CONTEXT files written by cowork `/save-work` are readable by dstoic `/load-context` and vice versa. Same format, different UX.
