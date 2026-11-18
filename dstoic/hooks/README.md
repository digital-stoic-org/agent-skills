# 🪝 Hooks — TL;DR

> ⚠️ **Live experiment.** Adapt to your setup.

Session lifecycle automation for Claude Code.

| Hook | Purpose | Why | Trigger | Requires |
|------|---------|-----|---------|----------|
| 🖥️ `notify-tmux.sh` | Visual tmux notifications | Know when the agent needs you vs working autonomously | Multiple | tmux |
| 📤 `dump-output.sh` | Debug artifacts on stop | Review agent output later without scrolling back | Stop | bash, jq |

> 📦 `retrospect-capture` now lives in [park/retrospect/hooks/](../../park/retrospect/hooks/); `list-context-sync`, `session-pin` & `recent-notes` in [park/experimental/](../../park/experimental/).

## 🚀 Quick Setup

Hooks are pre-configured in `hooks.json`. Just ensure dependencies are installed.

---

📚 **Full docs:** [README-full.md](README-full.md)
