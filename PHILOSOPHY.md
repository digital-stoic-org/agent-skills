# 🧭 Philosophy & Principles

> Human+AI collaboration as metacognitive practice.

---

## 🎯 Core Belief

AI doesn't replace thinking — it **amplifies** it. But amplification without structure is noise.

This toolkit is built on the idea that working with AI is a **cognitive discipline**, not a productivity hack. The skills encode thinking patterns — frameworks for knowing *when* to brainstorm, *when* to investigate, *when* to just build, and *when* to stop and reflect.

It's not about making AI do more. It's about **thinking better together**.

---

## 📐 Principles

### 🧭 Frame before act

Don't jump into the first approach that comes to mind. Classify the problem first. Is it clear? Complicated? Complex? Chaotic? The answer determines everything — which tools to use, how much planning is needed, whether to think divergently or converge fast.

`/frame-problem` uses Cynefin + Stacey frameworks to map your situation and route you to the right skill chain.

### 🧠 Think before build

Research exists. Patterns exist. Don't reinvent. Before writing code: brainstorm options, investigate constraints, design alternatives. Cheap thinking prevents expensive building.

`/brainstorm` and `/investigate` encode structured thinking methods — SCAMPER, Issue Trees, Morphological Analysis, Pre-mortem — so you don't skip them under time pressure.

### 🚧 Human controls the pace

AI is fast. Humans need to verify. The **gate pattern** solves this: AI implements a section, stops, human reviews, marks pass, AI continues. No runaway AI building the wrong thing for 20 minutes.

Gates also enable crash recovery — checkboxes persist, so you can resume where you left off.

### 📌 Micro-commits at every gate

Gates and git commits are natural partners. Every time AI completes a section and the human verifies — **commit**. This gives you:

- 🔄 **Rollback granularity** — undo one section without losing others
- 📖 **Readable history** — each commit = one verified unit of work, not a blob of "implemented feature X"
- 🚧 **Gate evidence** — the commit log becomes a record of what was verified and when
- 💾 **Crash safety** — if the session dies, your last verified state is always in git

The pattern: `AI builds section → human reviews at gate → git commit → next section`. Conventional commits (`feat`, `fix`, `refactor`) with scope give you a clean narrative. The commit history tells the story of the build, not just the end result.

### 🪨 Boulder → Pebbles

Not every task needs a plan. Scale your process to the problem:

| Scale | Approach | Example |
|-------|----------|---------|
| 🪨 **Boulder** | Full OpenSpec workflow (plan → develop → gate → test → sync) | New auth system, database migration |
| 🪶 **Pebble** | Just code it | Fix a typo, add a log line |

This isn't a binary — it's **iterative zoom**. Like Epics → User Stories in agile roadmapping: boulders break into pebbles over time. You start at the boulder level to see the whole landscape, then zoom into pebbles for execution. And you can zoom back out when you need to reassess direction.

`/frame-problem` helps you gauge the scale. `/openspec-plan` breaks boulders into gated sections (the pebbles).

### 💾 Sessions persist

Multi-day work needs continuity. `/save-context` serializes your session to a token-optimized markdown file. `/load-context` resumes it. No re-explaining what you were doing yesterday.

### 🪞 Learn from patterns

Every session generates signal. `/retrospect-domain` extracts what you learned (WHAT/WHY). `/retrospect-collab` analyzes how you worked (HOW). `/troubleshoot` saves debugging patterns to a learnings database that gets checked first next time.

The goal: **compound learning across sessions**, not just within them.

---

## 🏗️ Garage vs Scale

Three execution modes for different contexts:

| Mode | When | Philosophy |
|------|------|-----------|
| 🏗️ **Garage** | MVP, prototype, exploration | Working > perfect. Smoke tests sufficient. Ship small, iterate fast. |
| 📏 **Scale** | Production, team code, high stakes | Full verification at gates. test.md required. Document decisions. |
| 🔧 **Maintenance** | Existing system, careful changes | Conservative refactoring. Don't break what works. |

Garage is the default. Not waterfall, not chaos. **Structure without ceremony** — a workbench, not AutoCAD.

---

## 📖 Documentation Philosophy

GenAI makes it too easy to generate walls of text → **cognitive overload** for humans.

This toolkit uses three layers of documentation, each optimized for its reader:

| Layer | Reader | Optimization | Example |
|-------|--------|-------------|---------|
| 📄 `README.md` | Human (1 min scan) | Cognitive ease — scan, orient, decide if you care | [README.md](README.md) |
| 📚 `README-full.md` | Human (deep dive) | Comprehensive — find any skill, understand any workflow | [README-full.md](README-full.md) |
| 🤖 `SKILL.md` | LLM | Token-optimized — minimal prose, maximum directive density | Internal to each skill |

**Rule:** Respect the reader's attention. Don't make them scroll through 500 lines to find the one thing they need.

---

## 🪥 The Toothbrush Principle

> **CLAUDE.md and skills are like toothbrushes — personal, not shared.**

This applies at two levels:

**CLAUDE.md** reflects YOUR cognitive fingerprint:
- 🧠 **Cognitive patterns** — how you think through problems
- 💬 **Communication preferences** — emojis? structured data? diagrams?
- 📐 **Project conventions** — commit style, file organization, naming
- ⚠️ **Error handling style** — cautious? move-fast-and-fix?

**Skills** encode YOUR thinking workflows. The skills in this repo reflect how *I* brainstorm, investigate, troubleshoot, and build. They use frameworks that match *my* brain (Cynefin, MECE, SCAMPER, OODA). Your brain might work differently — and that's the point. Fork them, swap the frameworks, change the flow, make them yours.

Copying someone else's CLAUDE.md or skills is like using their toothbrush. See [CLAUDE.md.example](CLAUDE.md.example) for structure and inspiration, then **build your own**.

---

## 🤝 Contributing

This is a personal toolkit shared openly. It may not fit your brain — and that's fine.

1. 🍴 Fork
2. 🌿 Branch
3. 🚀 PR

Issues & ideas: [github.com/digital-stoic-org/agent-skills/issues](https://github.com/digital-stoic-org/agent-skills/issues)

---

📄 **TL;DR:** [README.md](README.md) · 📚 **Full catalog:** [README-full.md](README-full.md)
