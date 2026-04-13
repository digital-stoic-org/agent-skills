# 🧭 Digital Stoic Praxis — Philosophy & Principles

> Human+AI collaboration as metacognitive practice.

📖 **Reading order**: [README](README.md) (what + how?) → **this file** (why?) → [PRACTICE](PRACTICE.md) (deep how) → [README-full](README-full.md) (every skill)

---

## 🎯 Core Beliefs

Working with AI is a **cognitive discipline**, not a productivity hack. Four beliefs anchor the practice:

1. 🤝 **AI and human sharpen each other** — mutual augmentation, bidirectional. AI doesn't replace thinking, and it isn't a one-way amplifier either. The human directs; the AI pushes back.
2. 🧠 **Cognitive depth and breadth > automation speed** — quality of thinking beats velocity of execution. Tokens spent on deeper reasoning outperform tokens spent on faster rote work.
3. 🪥 **Meta-cognition is personal discipline** — built through habits shaped to your cognitive fingerprint. Not a shared methodology. See [toothbrush principle](#-the-toothbrush-principle).
4. 🔄 **Prior knowledge must be re-examined, not preserved** — adapt to new context rather than fossilize past decisions. Retrospect, challenge, decay.

It's not about making AI do more. It's about **thinking better together**.

---

## 🏛️ Taxonomy: Beliefs → Principles → Practices → Observables

Four layers connect conviction to measurement. Beliefs justify principles; principles drive practices; practices produce observable properties you can benchmark.

```mermaid
graph TD
    subgraph B["🎯 Beliefs (Why)"]
        B1["B1: AI + human<br/>sharpen each other"]
        B2["B2: Depth > speed"]
        B3["B3: Meta-cognition<br/>is personal"]
        B4["B4: Re-examine<br/>prior knowledge"]
    end

    subgraph P["📐 Principles (Rules)"]
        P1["P1: Frame before act"]
        P2["P2: Human gates execution"]
        P3["P3: AI challenges thinking"]
        P4["P4: Think big, start small,<br/>move fast"]
        P5["P5: Persist across sessions"]
        P6["P6: Compound learnings"]
        P7["P7: Fit to cognitive capacity"]
    end

    subgraph Pr["🔧 Practices (How)"]
        Pr1["Cynefin routing,<br/>brainstorm, investigate"]
        Pr2["Gate pattern,<br/>micro-commits, OpenSpec"]
        Pr3["Challenge, devil's advocate,<br/>retrospect-collab"]
        Pr4["Boulder→Pebbles,<br/>Garage/Scale/Maintenance"]
        Pr5["save/load-context,<br/>thinking/, memory"]
        Pr6["retrospect-domain,<br/>learnings DB"]
        Pr7["3-layer docs, RTK,<br/>scratch, cowork:switch"]
    end

    subgraph O["📊 Observables (What you measure)"]
        O1["Set 1 (external): 8 dims<br/>Cognitive ROI, Context eff,<br/>Compounding, Skill coverage,<br/>Domain breadth, Governance,<br/>Safety, Adaptability"]
        O2["Set 2 (aspirational): 4 dims<br/>Frontier autonomy,<br/>Meta-cognitive depth,<br/>Epistemic rigor,<br/>Emergence capacity"]
    end

    B3 & B2 --> P1
    B1 --> P2 & P3
    B2 --> P4 & P5
    B4 --> P6
    B3 --> P7

    P1 --> Pr1
    P2 --> Pr2
    P3 --> Pr3
    P4 --> Pr4
    P5 --> Pr5
    P6 --> Pr6
    P7 --> Pr7

    Pr --> O

    classDef belief fill:#FFE0B3,stroke:#333,color:#000
    classDef principle fill:#B3D9FF,stroke:#333,color:#000
    classDef practice fill:#D9B3FF,stroke:#333,color:#000
    classDef obs fill:#90EE90,stroke:#333,color:#000

    class B1,B2,B3,B4 belief
    class P1,P2,P3,P4,P5,P6,P7 principle
    class Pr1,Pr2,Pr3,Pr4,Pr5,Pr6,Pr7 practice
    class O1,O2 obs
```

For scoring rubrics on the 8 + 4 observables, see [PRACTICE.md](PRACTICE.md#-benchmarking-dimensions).

---

## 📐 Principles

Each principle is tagged with the belief(s) it derives from.

### 🧭 P1. Frame before act

*(from B3 + B2)* — Don't jump into the first approach that comes to mind. Classify the problem first. Is it clear? Complicated? Complex? Chaotic? The answer determines everything — which tools to use, how much planning is needed, whether to think divergently or converge fast.

`/frame-problem` uses the Cynefin framework to classify constraint type and route you to the right skill chain. Domain classification doesn't just select a skill — it determines the agent pattern: whether to probe safe-to-fail experiments (Complex), apply expertise (Complicated), execute a known process (Clear), or act and sense (Chaotic). The response verbs — `probe`, `analyze`, `execute`, `act`, `decompose` — are agent verbs, not just labels. They encode *how* the agent behaves, not just *what* it does.

### 🧠 P1 (cont.) Think before build

*(from B3 + B2)* — Research exists. Patterns exist. Don't reinvent. Before writing code: brainstorm options, investigate constraints, design alternatives. Cheap thinking prevents expensive building.

`/brainstorm` and `/investigate` encode structured thinking methods — SCAMPER, Issue Trees, Morphological Analysis, Pre-mortem — so you don't skip them under time pressure.

### 🚧 P2 + P3. Human controls execution, AI challenges thinking

*(both derived from B1 — AI and human sharpen each other)* — For *execution*, the human controls the pace. The **gate pattern** ensures this: AI implements a section, stops, human reviews, marks pass, AI continues. No runaway AI building the wrong thing for 20 minutes. Gates also enable crash recovery — checkboxes persist, so you can resume where you left off.

For *thinking*, the relationship is **bidirectional**. The human sets intent and direction — but the AI pushes back on assumptions, surfaces blind spots, and reveals patterns the human can't self-observe. `/challenge` and the devil's advocate agent exist specifically so AI can correct-check the human. Controlling execution while inviting challenge on thinking — that's the balance.

### 📌 P2 (cont.) Micro-commits at every gate

*(from B1)* — Gates and git commits are natural partners. Every time AI completes a section and the human verifies — **commit**. This gives you:

- 🔄 **Rollback granularity** — undo one section without losing others
- 📖 **Readable history** — each commit = one verified unit of work, not a blob of "implemented feature X"
- 🚧 **Gate evidence** — the commit log becomes a record of what was verified and when
- 💾 **Crash safety** — if the session dies, your last verified state is always in git

The pattern: `AI builds section → human reviews at gate → git commit → next section`. Conventional commits (`feat`, `fix`, `refactor`) with scope give you a clean narrative. The commit history tells the story of the build, not just the end result.

### 🪨 P4. Think big, start small, move fast — Boulder → Pebbles

*(from B2 — depth over speed, but iterate fast once framed)* — Not every task needs a plan. Scale your process to the problem:

| Scale | Approach | Example |
|-------|----------|---------|
| 🪨 **Boulder** | Full OpenSpec workflow (plan → develop → gate → test → sync) | New auth system, database migration |
| 🪶 **Pebble** | Just code it | Fix a typo, add a log line |

This isn't a binary — it's **iterative zoom**. Like Epics → User Stories in agile roadmapping: boulders break into pebbles over time. You start at the boulder level to see the whole landscape, then zoom into pebbles for execution. And you can zoom back out when you need to reassess direction.

`/frame-problem` helps you gauge the scale. `/openspec-plan` breaks boulders into gated sections (the pebbles).

### 💾 P5. Persist across sessions

*(from B2 — protect cognitive investment)* — Multi-day work needs continuity. `/save-context` serializes your session to a token-optimized markdown file. `/load-context` resumes it. No re-explaining what you were doing yesterday. Long-term knowledge lives in `thinking/` (investigations, bridges, benchmarks); cross-conversation user/project state lives in `MEMORY.md`.

### 🪞 P6. Compound learnings

*(from B4 — re-examine, don't fossilize)* — Every session generates signal. `/retrospect-domain` extracts what you learned (WHAT/WHY). `/retrospect-collab` analyzes how you worked (HOW). `/troubleshoot` saves debugging patterns to a learnings database that gets checked first next time.

The goal: **compound learning across sessions**, not just within them.

### 🎚️ P7. Fit to cognitive capacity

*(from B3 — meta-cognition is personal, attention is finite)* — Attention fluctuates. Design for context-switching, interruption, fatigue, and variable depth. Right content, right effort, right moment.

- 📄 **3-layer documentation** (scan → deep → LLM) — match reader energy to content density
- 🔇 **RTK token proxying** — filter noise from dev operations so the signal fits in budget
- 🗒️ **`/scratch`** — park side-thoughts to free working memory without losing them
- 🔀 **`/cowork:switch`** — structured project context-switching, not ad-hoc tab-flipping

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

📄 **TL;DR:** [README.md](README.md) · 📚 **Full catalog:** [README-full.md](README-full.md) · 🎯 **Practice:** [PRACTICE.md](PRACTICE.md) · 📊 **Benchmarks:** [benchmarks/](benchmarks/)
