# 🧠 Agent Skills Marketplace — TL;DR

> ⚠️ **Live experiment.** My personal cognitive toolkit—not a universal solution. Beyond dev: writing, analysis, learning, any knowledge work. Unix-geek approach applied to AI collaboration.

## 🏪 Plugins

| Plugin | Description | Status |
|--------|-------------|--------|
| [dstoic](dstoic/) | Core toolkit: OpenSpec, context, retrospectives | ✅ v0.1.58 |
| ... | More planned | 🔜 |

## 📖 Why TL;DR?

GenAI makes it too easy to generate walls of text → **cognitive overload** for humans.

| Doc Type | For | Example |
|----------|-----|---------|
| 📄 `README.md` | Humans (30 sec scan) | This file |
| 📚 `README-full.md` | Humans (deep dive) | [Full docs](README-full.md) |
| 🤖 `SKILL.md` | LLMs (token-optimized) | Not for human reading |

Respect your attention. Start here, dive deeper only when needed.

---

## 🎯 Core Idea

AI collaboration as **cognitive discipline**, not automation.

## 💡 Why OpenSpec?

OpenSpec is a **sweet spot** between:
- ❌ Over-engineered specs (too opinionated, heavy process)
- ❌ No structure at all (chaos, context loss)

**Current focus:** Individual augmentation—one human + AI working together.

Not (yet) designed for team collaboration workflows (à la BMAD or multi-agent orchestration).

## ✨ 3 Things This Does

1. 📋 **OpenSpec** → Plan before code (`init` → `plan` → `develop` → `test` → `sync`)
2. 💾 **Context** → Save/restore sessions (`/save-context`, `/load-context`)
3. 🔍 **Retrospect** → Learn from patterns (`/retrospect-domain`, `/retrospect-collab`)

## 📦 Install

```bash
git clone https://github.com/digital-stoic-org/agent-skills.git
```

Add specific plugin to `.claude/settings.json`:
```json
{"plugins": ["/path/to/agent-skills/dstoic"]}
```

Or install all plugins via marketplace:
```json
{"plugins": ["/path/to/agent-skills"]}
```

## 🚀 Quick Start

```bash
/dstoic:openspec-init    # Setup project
/dstoic:openspec-plan    # Plan a change
/save-context            # Save before leaving
```

## ⚠️ Warning

🪥 CLAUDE.md = toothbrush. See [CLAUDE.md.example](CLAUDE.md.example) for inspiration, don't copy.

The example uses [`rtk`](https://github.com/pszymkowiak/rtk) for token-optimized command output. Install it separately if you want to use the rtk instructions.

---

📚 **Full docs:** [README-full.md](README-full.md)
