# Digital Stoic Praxis — Practice

> **Praxis** (πρᾶξις): Greek for "practice" — the act of engaging, applying, and realizing ideas. Not theory. Not methodology. A living discipline where knowledge is enacted through doing.

## 📖 How to Read This Documentation

Each document has a distinct job. Read in order, stop when you have what you need:

| # | Document | Job | Time |
|---|----------|-----|------|
| 1 | [README.md](README.md) | **"What + How (TL;DR)"** — GitHub landing page, overview, quick model | 2 min |
| 2 | [PHILOSOPHY.md](PHILOSOPHY.md) | **"Why these choices?"** — Beliefs, 7 principles, execution modes, toothbrush principle | 5 min |
| 3 | **This file** | **"Deep How"** — Cognitive ROI, autonomy model, benchmarking | 10 min |
| 4 | [README-full.md](README-full.md) | **"What's in the toolkit?"** — Every skill, every detail | Reference |

🤖 For LLM consumption (benchmarking, comparison): [PRACTICE-llm.md](PRACTICE-llm.md) — self-contained, token-optimized.

**This file is about the HOW** — how the human-AI collaboration actually works, how to measure its value, and how to benchmark it against other approaches. For the WHY (beliefs, principles), see [PHILOSOPHY.md](PHILOSOPHY.md). For the WHAT (skill catalog), see [README-full.md](README-full.md).

---

## 🎯 Core Position

AI doesn't replace thinking — it **sharpens** it. But sharpening without structure is noise. Working with AI is a **cognitive discipline**, not a productivity hack.

The goal is not to make AI do more. It's to **think better together** — and that means the AI challenges the human as much as the human directs the AI.

---

## 💰 Cognitive ROI: Return on Tokens

Most people measure AI value by time saved. That's the wrong metric. The real question is: **what kind of thinking are your tokens buying?**

### The Three Tiers

```mermaid
graph LR
    A["⚙️ Automation<br/>Rote tasks delegated<br/><i>Low value/token</i>"] --> B["🤝 Assisted Thinking<br/>AI structures human thought<br/><i>Medium value/token</i>"]
    B --> C["🧠 Amplified Judgment<br/>AI challenges & deepens reasoning<br/><i>High value/token</i>"]

    classDef low fill:#FFB3B3,stroke:#333,color:#000
    classDef med fill:#FFE0B3,stroke:#333,color:#000
    classDef high fill:#90EE90,stroke:#333,color:#000

    class A low
    class B med
    class C high
```

| Tier | Description | Examples |
|------|-------------|----------|
| ⚙️ **Automation** | AI handles rote tasks you'd do anyway | File conversions, dependency installs, deployments |
| 🤝 **Assisted Thinking** | AI structures and accelerates your thought process | Troubleshooting with frameworks, brainstorming with SCAMPER, problem framing |
| 🧠 **Amplified Judgment** | AI challenges assumptions, deepens analysis, reveals blind spots | Devil's advocate debiasing, deep investigation, retrospective pattern extraction |

**Maturity means shifting your token budget from ⚙️ toward 🧠 over time.**

A beginner spends 70% of tokens on automation. An advanced practitioner spends 60% on amplified judgment — not because they stopped automating, but because they learned to use tokens where they matter most.

### The Multipliers

Raw tier allocation is only part of the picture. Two multipliers compound the value:

**Context Efficiency** — Don't waste tokens re-explaining. Session persistence (`save-context` / `load-context`) eliminates repeated setup. Token proxying (RTK) filters noise from dev operations. Three-layer documentation (scan → deep → LLM) ensures the right content reaches the right reader.

**Compounding** — Every session generates signal. Retrospectives extract what you learned (WHAT/WHY) and how you worked (HOW). Troubleshooting patterns get saved to a learnings database that's checked first next time. Skills themselves evolve based on usage. The result: **future sessions start smarter**.

```mermaid
graph TD
    S["🔄 Session"] --> R["🪞 Retrospect"]
    R --> L["📚 Learnings DB"]
    L --> N["🔄 Next Session"]
    N --> R2["🪞 Retrospect"]
    R2 --> L

    S --> C["💾 Context"]
    C --> N

    classDef session fill:#B3D9FF,stroke:#333,color:#000
    classDef learn fill:#90EE90,stroke:#333,color:#000
    classDef ctx fill:#FFE0B3,stroke:#333,color:#000

    class S,N session
    class R,R2,L learn
    class C ctx
```

---

## 🤝 Human-AI Governance

Three ingredients make the collaboration work: a **conscious activation protocol** (posture before technique), an **autonomy spectrum** (five levels from human-drives to fire-and-forget), and **orchestrated agency** (systems that both extend and *correct* reasoning). Together they produce the governance observable scored in [Set 1 #6](#set-1--external-benchmarking-8-observables).

### Conscious Activation Protocol

Before engaging AI, activate a deliberate thinking mode. Not "use AI to do X" but "activate my analytical sense, then use AI to both amplify and challenge it."

1. **Clarify**: What's my role? What's my objective? Which workflow phase am I in (Frame/Think/Build/Debug/Learn)?
2. **Engage**: Use AI to sharpen thinking, not outsource it — and **invite it to push back**
3. **Measure**: Quality of questions asked, clarity of reasoning developed, blind spots surfaced — not time saved

> **Posture before technique.** And posture includes the willingness to be challenged.

Skills organize into a development lifecycle — **Frame → Think → Build → Debug → Learn**. The practitioner identifies which phase they're in before engaging AI. See [README-full.md](README-full.md) for which skills map to which phase.

### Autonomy Spectrum

Not everything needs the same level of human involvement — and the direction of influence flows both ways:

| Level | Direction | Description | Examples |
|-------|-----------|-------------|----------|
| 🧑 **Human drives** | Human → AI | AI assists, human decides everything | Brainstorming, investigation |
| 🔄 **Mutual sharpening** | Human ↔ AI | AI actively challenges human reasoning | `/challenge`, devil's advocate, retrospect-collab |
| 🚧 **Gated delegation** | Human → AI → Human | AI executes sections, stops for verification | OpenSpec development, testing |
| 👁️ **Supervised automation** | AI → Human (notify) | AI runs autonomously, human monitors | Background tasks, hook-driven capture |
| 🔥 **Fire & forget** | AI only | Fully autonomous, no human in loop | Tmux notifications, session logging, RTK proxy |

The default for execution is **gated delegation**. The default for thinking is **mutual sharpening** — the human sets direction, but the AI pushes back on assumptions, surfaces blind spots, and reveals patterns the human can't self-observe. See [PHILOSOPHY.md](PHILOSOPHY.md#-p2--p3-human-controls-execution-ai-challenges-thinking).

### Orchestrated Agency

**Agency amplified by systems, not replaced by automation.** An agent isn't magic — it's a structured expression of a thinking posture: Role + Objective + Context + Autonomy Level. The anti-pattern is delegating without directing; the equal-and-opposite anti-pattern is **directing without listening** — orchestrating agents that only execute, never challenge. The most valuable agents are the ones that tell you you're wrong: devil's advocate running 9 debiasing patterns in fresh context, `/challenge` demanding proof for your assumptions, `/retrospect-collab` revealing collaboration patterns you couldn't see from inside the session.

---

## 📊 Domain Applicability

The toolkit spans from universal to personal:

| Scope | Description | Count | Examples |
|-------|-------------|-------|----------|
| 🌍 **Domain-agnostic** | Any professional, any field | 27 skills | frame-problem, brainstorm, challenge, retrospect-*, scratch |
| 💻 **Tech (stack-agnostic)** | Any software project | 13 skills | OpenSpec suite, troubleshoot, install-dependency |
| 🔧 **Tech (stack-specific)** | Tied to specific tooling | 6 skills | edit-tool, deploy-surge, dump-output |
| 🏠 **Personal** | Practitioner's life domains | 1+ skills | toshl, GTD plugin, coach plugin |

The core cognitive skills (Frame, Think, Learn) are domain-agnostic. The Build and Debug skills are tech-agnostic. Only a handful are stack-specific or personal.

For the complete skill-by-skill breakdown, see [README-full.md](README-full.md). For how these skills form an agent harness (guides, sensors, maturity model), see [HARNESS-ENGINEERING.md](HARNESS-ENGINEERING.md).

---

## 📐 Benchmarking Dimensions

Two sets of observables serve two different questions. **Set 1** compares Praxis against other frameworks in the ecosystem. **Set 2** compares Praxis against the holy grail of what AI-augmented cognition could be.

These observables sit at Layer 4 of the [Beliefs → Principles → Practices → Observables taxonomy](PHILOSOPHY.md#-taxonomy-beliefs--principles--practices--observables). The old 11-dimension list (through April 2026) mixed layers — beliefs, principles, practices, and observables scored side-by-side — producing noisy, overlapping signal. The 8 + 4 split below keeps benchmarking at the observable layer only.

### Set 1 — External Benchmarking (8 observables)

*"Where does Praxis stand in the ecosystem?"* Used by `/benchmark-praxis` full and quick modes.

| # | Observable | Measures | Scoring |
|---|------------|----------|---------|
| 1 | 💰 **Cognitive ROI** | Token allocation: % to automation vs assisted vs amplified thinking | 🟢🟢🟢 60%+ amplified · 🟡 balanced · 🔴 automation-heavy |
| 2 | 🔇 **Context efficiency** | Token waste reduction: session persistence, compression, filtering, doc layering | 🟢🟢🟢 <1500/session + reuse · 🟡 ~2000 · 🔴 unbounded |
| 3 | 🪞 **Compounding** | Session-over-session improvement: learnings DB, retrospect coverage, pattern reuse | 🟢🟢🟢 structured retrospect + learnings DB · 🟡 basic logs · 🔴 none |
| 4 | 🛠️ **Skill coverage** | Workflow phases automated/augmented (Frame/Think/Build/Debug/Learn) + boulder/pebble scale | 🟢🟢🟢 all 5 phases + scale sensitivity · 🟡 3–4 phases · 🔴 1–2 phases |
| 5 | 🌍 **Domain breadth** | Universal → personal tier count: domain-agnostic, tech-agnostic, stack-specific, personal | 🟢🟢🟢 all 4 tiers · 🟡 2–3 · 🔴 single tier |
| 6 | 🤝 **Human-AI governance** | Autonomy spectrum (5 levels) + gate strength + learning-loop closure | 🟢🟢🟢 all 5 levels + hard gates + human closure · 🟡 3 levels + soft gates · 🔴 1 level + no gates |
| 7 | 🔒 **Safety & containment** | Permission architecture + blast radius controls + secret exfiltration prevention | 🟢🟢🟢 multi-layer (deny lists, hooks, sandboxing) · 🟡 single layer · 🔴 none/advisory |
| 8 | 🪥 **Adaptability** | Fork-ability + customization depth + toothbrush principle | 🟢🟢🟢 modular + swap frameworks + tune without code · 🟡 basic config · 🔴 rigid |

**Governance sub-dimensions (#6):**
- *Autonomy spectrum coverage* — does it offer human-drives, mutual sharpening, gated, supervised, fire-and-forget?
- *Gate strength* — hard (deny-first) vs advisory (warn-first) vs none
- *Learning autonomy* — who closes feedback loops (human-triggered, hybrid, autonomous)?

### Set 2 — Self-Assessment vs Holy Grail (4 aspirational dimensions)

*"How far am I from where I want to be?"* Used by `/benchmark-praxis gap` mode. Most frameworks aren't even attempting these.

| # | Dimension | Measures | Current State |
|---|-----------|----------|---------------|
| 1 | 🚀 **Frontier autonomy** | How far toward full agentic loops? Scheduling, self-healing, autonomous decisions | Mostly gated delegation. Some fire-and-forget (hooks, RTK). No autonomous scheduling |
| 2 | 🧘 **Meta-cognitive depth** | Does the system think about its own thinking? Self-assessment, calibration, self-improvement | Retrospect suite exists but human-triggered. No autonomous calibration |
| 3 | 🔬 **Epistemic rigor** | Knowledge quality: debiasing, falsifiability, source verification, knowledge decay | Devil's advocate + challenge exist. No decay detection or source verification |
| 4 | ✨ **Emergence capacity** | Cross-session insights, unexpected connections, bridge captures between domains | Bridge captures manual. No autonomous cross-domain discovery |

**Scoring (Set 2)**: 🟢🟢🟢 = full aspiration achieved · 🟡 = partial / human-triggered version exists · 🔴 = no mechanism. Current Praxis state sits at 🟡 for all four — the gap is the point.

---

## 🏆 Benchmark Results (April 2026)

Systematically compared against 7 frameworks across the AI coding agent ecosystem. Full details → [benchmarks/](benchmarks/)

| Framework | Focus | Verdict |
|-----------|-------|---------|
| [ECC](benchmarks/2026-04-07-ecc.md) (144K⭐) | Automated learning, instincts, cross-harness | Praxis leads context quality & cognitive depth. ECC leads automation & scale |
| [SuperClaude](benchmarks/2026-04-07-context-format.md) (22K⭐) | Progressive loading, ReflexionMemory | Mostly prompt engineering as framework. Progressive loading worth studying |
| [ACP](benchmarks/2026-04-02-acp.md) (45 patterns) | Pattern language for AI-augmented dev | ~70% coverage. Praxis exceeds on debiasing & compounding |
| [BMAD v6](benchmarks/2026-03-13-bmad.md) (36K⭐) | Role-based agent methodology | **Only framework that edges ahead** — for greenfield teams |
| [Harness Engineering](benchmarks/2026-04-08-harness-engineering.md) | Fowler model + Horthy principles + maturity | **Solid L2, aspiring L3** — all layers covered, feedback loops human-triggered |
| [HumanLayer](benchmarks/2026-03-18-humanlayer-harness.md) | Foundational taxonomy (superseded) | All 7 principles natively covered |
| [Ralph Loop](benchmarks/2026-03-15-ralph-loop.md) | Fully autonomous coding agent | Deliberately rejected. Building controlled equivalent |
| [ICM + QMD](benchmarks/2026-03-19-icm-qmd-memory.md) | Memory architecture (episodic + semantic) | Complementary. Watching — manual discipline reduces urgency |

**Key insight**: Depth > breadth. Manual phase-transition discipline produces higher-quality context than automated capture. The "automation gap" is a philosophical choice, not a missing feature.

---

📄 **TL;DR**: [README.md](README.md) · 🤖 **LLM reference**: [PRACTICE-llm.md](PRACTICE-llm.md) · 🧭 **Philosophy**: [PHILOSOPHY.md](PHILOSOPHY.md) · 📖 **Skill catalog**: [README-full.md](README-full.md)
