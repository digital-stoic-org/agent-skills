# 🧠 Digital Stoic Praxis

> **Praxis** (πρᾶξις) = practice. Knowledge enacted, not just known.

⚠️ Live experiment. My cognitive toolkit — fork it, adapt it to *your* brain.

---

## 🎯 In One Sentence

A cognitive discipline for human-AI collaboration built on **mutual sharpening** — the human sets intent and directs, the AI challenges and reveals blind spots, and both learn from the loop.

---

## 💡 Why This Exists

AI tools are powerful but chaotic. Most people either **micromanage** every prompt or **let AI run wild** and pray. Neither scales to real work.

This toolkit treats **AI collaboration as cognitive discipline** — a set of thinking modes you activate depending on the situation, where the AI also pushes back on your assumptions. The goal is not to make AI do more. It's to **think better together** — and that includes letting AI challenge the human.

Deeper why → [PHILOSOPHY.md](PHILOSOPHY.md)

---

## 🧭 The Flow

```mermaid
flowchart LR
    F["🧭 Frame"] --> T["🧠 Think"]
    T --> B["⚙️ Build"]
    B --> D["🔧 Debug"]
    D --> L["🪞 Learn"]
    L -.->|"compounding loop"| F

    classDef frame fill:#E8EAF6,stroke:#3F51B5,color:#000
    classDef think fill:#E1BEE7,stroke:#7B1FA2,color:#000
    classDef build fill:#C8E6C9,stroke:#388E3C,color:#000
    classDef debug fill:#FFE0B2,stroke:#F57C00,color:#000
    classDef learn fill:#BBDEFB,stroke:#1976D2,color:#000

    class F frame
    class T think
    class B build
    class D debug
    class L learn
```

| Mode | What | Hero Skills |
|------|------|-------------|
| 🧭 **Frame** | Triangulate the problem (3 tests) → route to the right skill chain | `/frame-problem` (Cynefin triangulation), `/pick-model` |
| 🧠 **Think** | Divergent ideation, deep analysis, adversarial review, cross-project bridging | `/brainstorm` (SCAMPER), `/investigate`, `/probe`, `/challenge`, `/bridge` |
| ⚙️ **Build** | Plan → develop → gate → test → sync | `/openspec-*` suite (9 skills, human-gated sections) |
| 🔧 **Debug** | Search-first troubleshooting with learnings DB | `/troubleshoot` (Wolf Fence, 5 Whys, OODA), `/experiment` |
| 🪞 **Learn** | Extract patterns, persist sessions | `/retrospect-*`, `/save-context`, `/load-context` |

Plus: **tool creation** (`/edit-tool`), **conversions** (PDF, EPUB, Google Docs), and domain plugins (GTD, coaching, business analysis, philosopher personas).

---

## 🤝 Human-AI Governance

Not human-drives-AI. Not AI-drives-human. **Mutual sharpening:**

- **Human → AI**: Sets intent, chooses workflow phase, directs execution, verifies at gates
- **AI → Human**: Challenges assumptions, surfaces blind spots, reveals patterns the human can't self-observe
- **Together**: The human thinks more clearly *because* the AI pushes back. The AI produces better work *because* the human sets precise intent.

**Key**: Posture before technique — but posture includes the willingness to be challenged.

Full autonomy spectrum + orchestrated agency → [PRACTICE.md](PRACTICE.md#-human-ai-governance)

---

## 💰 Cognitive ROI (Return on Tokens)

Not "how fast" — **how deep**:

| Tier | What | Value/Token |
|------|------|-------------|
| ⚙️ Automation | Rote tasks (convert, deploy, format) | Low |
| 🤝 Assisted Thinking | AI structures human thought | Medium |
| 🧠 Amplified Judgment | AI challenges/deepens reasoning | **High** |

**Maturity = shifting tokens from ⚙️ toward 🧠.**

Multiplied by **context efficiency** (don't waste tokens re-explaining) and **compounding** (learnings reduce future spend). Full model → [PRACTICE.md](PRACTICE.md#-cognitive-roi-return-on-tokens)

---

## 📊 By the Numbers

- **93 skills** across 14 plugins and 5 workflow phases + utilities
- **14 plugins**: core (dstoic), cognitive, openspec, content, convert, toolsmith, experimental, retrospect, GTD, coaching, business analysis, philosopher personas, cowork, lazy
- **2 agents**: devil's advocate, context summarizer
- **7 hooks**: notifications, session capture, debug dumps, context sync, session pins
- **3 execution modes**: garage (default), scale, maintenance
- **🪥 Toothbrush principle**: This is one practitioner's discipline. Don't copy — adapt. [Why?](PHILOSOPHY.md#-the-toothbrush-principle)
- **📊 Benchmarked** against 7 frameworks including [ECC](https://github.com/affaan-m/everything-claude-code) (144K⭐), [ACP](https://lexler.github.io/augmented-coding-patterns/), [BMAD](https://github.com/bmad-sim/BMAD-METHOD) (36K⭐) — leads on context quality, cognitive depth, adversarial thinking. Only BMAD edges ahead (for teams). Details → [PRACTICE.md](PRACTICE.md#-benchmark-results-april-2026) · `/benchmark-praxis` skill

---

## 🏪 Plugins

| Plugin | Skills | Description | Status |
|--------|--------|-------------|--------|
| [dstoic](dstoic/) | 7 | Core infrastructure: git commits, model selection, scratch pad, kaizen, context save/load, 7 hooks | ✅ v0.38.0 |
| [cognitive](cognitive/) | 8 | Cynefin-routed problem-solving: frame, troubleshoot, investigate, brainstorm, probe, experiment, challenge, benchmark | ✅ v0.37.0 |
| [openspec](openspec/) | 9 | Structured development: plan, design, develop, review, test, reflect, replan, sync | ✅ v0.37.0 |
| [toolsmith](toolsmith/) | 5 | Tool creation: edit-tool, edit-claude, edit-plugin, search-skill, install-dependency | ✅ v0.37.0 |
| [content](content/) | 5 | Content transformation: anonymize, infographize, literatize, bridge, RISEN prompts | ✅ v0.37.0 |
| [convert](convert/) | 6 | Format conversion: PDF, EPUB, DOCX, PPTX → markdown, markdown → PDF, Google Docs import | ✅ v0.37.0 |
| [retrospect](retrospect/) | 3 | Session analysis: domain learnings, collaboration patterns, trend reports | ✅ v0.38.0 |
| [experimental](experimental/) | 9 | Experimental: deployment, background tasks, distill-skill, context bootstrap, summarization | ✅ v0.38.0 |
| [philosopher](philosopher/) | 24 | 20 philosopher personas, dialogue, encounter, council, create | ✅ v0.10.0 |
| [biz](biz/) | 7 | Business analysis: competitive analysis, UX strategy/wireframes/evaluation, market sizing, canvas, personas | ✅ v0.8.0 |
| [coach](coach/) | 1 | Personal coaching: CLEAR + GROW protocols | ✅ v0.3.0 |
| [gtd](gtd/) | 4 | GTD workflow automation for Obsidian vaults | ✅ v0.3.2 |
| [cowork](cowork/) | 4 | Multi-project context management: switch projects, save/load sessions, ref/wip sync | ✅ v0.4.0 |
| [lazy](lazy/) | 1 | Lazy skill demand capture: placeholder skills that measure real demand before building | ✅ v0.1.1 |

## 📦 Install

```
/install-plugin https://github.com/digital-stoic-org/agent-skills
```

To install a specific plugin only, add it to `.claude/settings.json`:
```json
{"plugins": ["digital-stoic-org/agent-skills/dstoic"]}
```

## 🚀 Quick Start

```bash
/frame-problem how should I approach building a new auth system
# → Triangulates: Keogh=2 (team expertise), Predictable=yes, Disassemble=yes
# → Complicated (3/3 agree) + Boulder → /investigate → /openspec-plan

/brainstorm product naming ideas for my CLI tool
# → Research → SCAMPER divergence → weighted scoring → recommendation

/troubleshoot "TypeError: Cannot read property 'map' of undefined"
# → WebSearch → qualify → diagnose → OODA → save learning
```

---

## 📖 Documentation — Two Cognitions, One Practice

This toolkit serves **two kinds of readers** with fundamentally different needs:

**👤 Human cognition** — scans, skims, needs cognitive ease. Overwhelmed by walls of text. Seeks the "aha" moment, then dives deeper only when motivated. Diagrams and structure reduce cognitive load.

**🤖 LLM cognition** — parses tokens. Needs directive density, structured data, zero filler. Diagrams are nice but YAML is better. Self-contained is better than linked.

The practice itself is about **combining both**: a human who thinks consciously and an AI that both amplifies and challenges that thinking. The documentation mirrors this — each layer optimized for its reader:

| # | Document | Reader | Job |
|---|----------|--------|-----|
| 1 | 📄 **README.md** | 👤 Human | **"What + How (TL;DR)"** — This file. The GitHub landing page. |
| 2 | 🧭 [PHILOSOPHY.md](PHILOSOPHY.md) | 👤 Human | **"Why"** — 4 beliefs, 7 principles (with belief origins), 4-layer taxonomy, execution modes |
| 3 | 🎯 [PRACTICE.md](PRACTICE.md) | 👤 Human | **"Deep How"** — Cognitive ROI, autonomy spectrum, 8 external + 4 aspirational benchmarking dims |
| 3b | 🔧 [HARNESS-ENGINEERING.md](HARNESS-ENGINEERING.md) | 👤 Human | **"The Harness"** — Guides/sensors model, session lifecycle, maturity levels |
| 4 | 📚 [README-full.md](README-full.md) | 👤 Human | **"Every Skill"** — Complete catalog, reference |
| 5 | 🤖 [PRACTICE-llm.md](PRACTICE-llm.md) | 🤖 LLM | **Self-contained benchmark** — Token-optimized, YAML-heavy, all-in-one |
| — | 🤖 `SKILL.md` (per skill) | 🤖 LLM | **Execution directives** — What the LLM actually runs |

Human docs link to each other (progressive depth). LLM docs are **self-contained** (no navigation, everything in one shot). The practice works because both cognitions play to their strengths.

---

⚠️ 🪥 CLAUDE.md = toothbrush. See [CLAUDE.md.example](CLAUDE.md.example) for inspiration, don't copy. ([Why?](PHILOSOPHY.md#-the-toothbrush-principle))

The example uses [`rtk`](https://github.com/pszymkowiak/rtk) for token-optimized command output. Install it separately if you want to use the rtk instructions.

💡 [IDEAS.md](IDEAS.md) — Future ideas & what I'm deliberately *not* building yet.
