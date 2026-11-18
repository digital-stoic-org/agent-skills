# cowork

Multi-project context management for non-CLI interfaces (Cowork desktop, Telegram, CC CLI). Menu-driven UX — no typed arguments, no flags.

## Skills

| Skill | Trigger | What it does |
|-------|---------|--------------|
| `/switch` | "switch project", "work on X" | Menu-driven project switcher. Loads CLAUDE.md chain + CONTEXT files |
| `/save-work` | "save", "checkpoint", "I'm done" | Menu-driven session save. 3-choice status (checkpoint/done/parking) + stream picker + drift detection |
| `/load-work` | "load", "resume", "continue" | Menu-driven session resume. Shows available sessions with focus preview |
| `/sync-ref-wip` | "sync ref", "promote to ref", "align" | Bidirectional ref/wip sync. Auto-detects direction from timestamps + content maturity |

## Design Principles

- **Menu-first** — numbered choices, not typed arguments
- **3 choices max** per menu — don't overwhelm
- **Auto-detect over ask** — project name, stream name, status inferred when possible
- **Zero shell scripts** — pure Claude Code tools (Glob, Read, Write, Edit, AskUserQuestion). Fully portable across Linux, macOS, Windows
- **Same CONTEXT file format** as `retrospect:save-context` / `retrospect:load-context` — files are interchangeable
- **Client-agnostic output** — works in terminal, Cowork, Telegram. Simple lists + emoji, no tables or Mermaid
- **File Zones** — projects use `ref/` (or `reference/`) for read-only stable docs and `wip/` (or `work-in-progress/`) for active work

## Sync Script

`Sync-CoworkSkills.ps1` — standalone PowerShell script that downloads skills from GitHub and packages them as ZIPs for Cowork Desktop import. No CC CLI, no git, no Syncthing needed.

```powershell
# One-time download
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/digital-stoic-org/agent-skills/main/cowork/Sync-CoworkSkills.ps1" -OutFile "$HOME\Sync-CoworkSkills.ps1"

# Package all skills, open output folder
.\Sync-CoworkSkills.ps1 -Force -Open

# List available plugins and skills
.\Sync-CoworkSkills.ps1 -ListPlugins

# Package specific skills only
.\Sync-CoworkSkills.ps1 -Skills switch,save-work,load-work
```

See [WINDOWS-SETUP.md](../../code/cowork/WINDOWS-SETUP.md) in praxis for full setup guide.

## Compatibility

CONTEXT files written by cowork `/save-work` are readable by dstoic `/load-context` and vice versa. Same format, different UX.
