# 🧪 experimental

Staging plugin for experimental and utility capabilities — skills, an agent, and staged session hooks. Things land here while they prove themselves; treat anything in this plugin as **subject to change**.

## 🛠️ Skills

| Skill | Purpose |
|-------|---------|
| `/background` | 🔄 Run work as a background task |
| `/create-context` | 🌱 Bootstrap a CONTEXT bundle for a task |
| `/list-contexts` | 📋 List / sync CONTEXT bundles |
| `/pin` | 📌 Pin session state |
| `/deploy-surge` | 🚀 Deploy a static site to Surge |
| `/distill-skill` | ⚗️ Distill a skill from a transcript |
| `/edit-risen-prompt` | ✏️ Edit a RISEN-format prompt |
| `/test-skill` | 🧪 Exercise a skill in isolation |
| `/tldr` | 📝 Summarize long content |

Agent: `summarize-for-context` — condenses material for context bundles.

## 🪝 Hooks

> ⚠️ **Staged & gated OFF by default.** These hooks were relocated from `dstoic` to quarantine them while still keeping them runnable. They do nothing unless explicitly enabled.

| Hook | Purpose | Trigger | Gate |
|------|---------|---------|------|
| 📝 `retrospect-capture.sh` | Auto-log all 10 lifecycle events to `.retro/` for `/retrospect-*` analysis | All events | `EXPERIMENTAL_HOOKS_ENABLED` |
| 🔄 `list-context-sync.sh` | Daily context sync + unpushed-commit warning | SessionStart | `EXPERIMENTAL_HOOKS_ENABLED` |
| 📌 `session-pin.sh` | Maintain a pinned session marker | SessionStart, PreToolUse, PreCompact | `EXPERIMENTAL_HOOKS_ENABLED` |
| 🗒️ `recent-notes.sh` | Surface recently-edited notes | Stop | `EXPERIMENTAL_HOOKS_ENABLED` |
| 🧪 `hack-dummy.sh` | Educational SessionStart-RCE PoC (**not wired** — dormant) | — | `EXPERIMENTAL_HOOKS_ENABLED` + `HACK_DUMMY_ARM` |

### 🔐 Enabling

The wired hooks require **both** of these to do anything:

```bash
export EXPERIMENTAL_HOOKS_ENABLED=1
export PRAXIS_DIR=/praxis        # must be non-empty
```

Without both, every hook silently `exit 0`s. `hack-dummy.sh` is additionally **not referenced** in `hooks.json` (so it never runs from the plugin) and carries its own `HACK_DUMMY_ARM` / `DUMMY_NOOP` gates plus a hard `exit 0` guard.

Hooks live in `hooks/`; the `retrospect-capture.sh` helper library is at `scripts/lib/retrospect-stats.sh` (sourced via the sibling `../scripts/lib/` path).
