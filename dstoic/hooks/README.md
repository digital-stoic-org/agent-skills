# 🪝 Hooks — TL;DR

> ⚠️ **Live experiment.** Adapt to your setup.

Session lifecycle automation for Claude Code.

| Hook | Purpose | Why | Trigger | Requires |
|------|---------|-----|---------|----------|
| 🖥️ `notify-tmux.sh` | Visual tmux notifications | Know when the agent needs you vs working autonomously | Multiple | tmux |
| 📝 `retrospect-capture.sh` | Auto-log session events | Reflect on AI-human collab per project — beyond execution-centric Agile retros | Multiple | bash, jq |
| 📤 `dump-output.sh` | Debug artifacts on stop | Review agent output later without scrolling back | Stop | bash, jq |
| 🔄 `list-context-sync.sh` | Daily context sync + git notify | Stop wasting session starts on manual housekeeping | SessionStart | bash, jq, claude CLI |

## 🚀 Quick Setup

Hooks are pre-configured in `hooks.json`. Just ensure dependencies are installed.

---

📚 **Full docs:** [README-full.md](README-full.md)
