# 🧠 Digital Stoic Praxis

> **Praxis** (πρᾶξις) = practice. Knowledge enacted, not just known.

---

## 🎯 In One Sentence

A cognitive discipline for human-AI collaboration built on **mutual sharpening** — the human sets intent and directs, the AI challenges and reveals blind spots, and both learn from the loop.

⚠️ Live experiment. My cognitive toolkit — fork it, adapt it to *your* brain.

> **This is v2, and it's smaller than v1.** I built 105 skills, a 5-phase
> workflow, and a 9-skill gate system to force structure out of an AI that
> couldn't yet plan its own work. Then the models got dramatically better at
> deciding and self-planning — and most of that scaffold became dead weight.
> Months of real practice wore it down to its handle. What survived isn't a
> lighter version of the same thing; it's what stays **irreducibly human** once
> the model can plan for itself: **persist** intent, **guide** at the big
> boundaries, **challenge** the confident answer. The arc — build it, practice
> it, shed it — *is* the praxis.

---

## 💡 Why This Exists

AI tools are powerful but chaotic. Most people either **micromanage** every prompt or **let AI run wild** and pray. Neither scales to real work.

This toolkit treats **AI collaboration as cognitive discipline** — a set of thinking modes you activate depending on the situation, where the AI also pushes back on your assumptions. The goal is not to make AI do more. It's to **think better together** — and that includes letting AI challenge the human.

Deeper why → [PHILOSOPHY.md](PHILOSOPHY.md)

---

## 🧭 The Flow

The practice no longer fans out into phases. As the model got better at planning
its own work, what's left for the human collapsed to **three things the model
doesn't do for itself**:

```mermaid
flowchart TD
  M["🚀 Model self-plans<br/>(handles what scaffold used to force)"]
  subgraph CORE["what stays the human's job"]
    P1["💾 PERSIST<br/>carry intent across sessions"]
    P2["🧭 GUIDE<br/>propose, don't act ·<br/>gate at the big boundaries"]
    P3["😈 CHALLENGE<br/>hold the tension ·<br/>counter the confident model"]
  end
  M --> CORE
  CORE -->|"daily spine still runs underneath"| S["save/load-context · capture · commit · edit-toolkit"]
  classDef mod fill:#B3D9FF,stroke:#333,color:#000
  classDef pillar fill:#90EE90,stroke:#333,color:#000
  classDef spine fill:#E0E0E0,stroke:#333,color:#000
  class M mod
  class P1,P2,P3 pillar
  class S spine
```

| Pillar | What the human does | Live skills |
|------|------|-------------|
| 💾 **Persist** | Carry the single source of *what we're doing and why* across resets; the model re-derives its plan from it | `/save-context`, `/load-context` |
| 🧭 **Guide** | Propose-don't-act + fewer, better-placed checkpoints at the big boundaries — not every section | `/commit-repo` gates, `/pick-model` |
| 😈 **Challenge** | Hold the tension against a confident, agreeable model — proportional, cheap-first | devil's-advocate agent (auto-triggered), `/challenge` |

> You still **frame, think, build, debug** as needed — but they're *moves you
> reach for*, not a lifecycle you march through. A model that self-plans doesn't
> need the phases enforced. (`/brainstorm`, `/troubleshoot`, `/frame-problem`
> are still here when a problem is genuinely hard — see the [full catalog](README-full.md).)

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

- **~105 skills** across 14 plugins — but only ~12 run daily; the rest are parachutes (rare by design) or an archive of exploration. Lead with the spine, not the count.
- **14 plugins**: core (dstoic), cognitive, openspec, content, convert, toolsmith, experimental, retrospect, GTD, coaching, business analysis, philosopher personas, cowork, lazy
- **2 agents**: devil's advocate, context summarizer
- **Hooks**: 4 live (notify-tmux, dump-output, retrospect-capture, check-praxis-dir) + experimental staging
- **3 execution modes**: garage (default), scale, maintenance
- **🪥 Toothbrush principle**: This is one practitioner's discipline. Don't copy — adapt. [Why?](PHILOSOPHY.md#-the-toothbrush-principle)
- **📊 Benchmarked** against 7 frameworks including [ECC](https://github.com/affaan-m/everything-claude-code) (144K⭐), [ACP](https://lexler.github.io/augmented-coding-patterns/), [BMAD](https://github.com/bmad-sim/BMAD-METHOD) (36K⭐) — leads on context quality, cognitive depth, adversarial thinking. Only BMAD edges ahead (for teams). Details → [PRACTICE.md](PRACTICE.md#-benchmark-results-april-2026) · `/benchmark-praxis` skill

---

## 🏪 Plugins

| Plugin | Skills | Description |
|--------|--------|-------------|
| [dstoic](dstoic/) | 11 | Core infrastructure: git commits, model selection, scratch pad, kaizen, context save/load, post-mortem, hooks |
| [cognitive](cognitive/) | 8 | Cynefin-routed problem-solving: frame, troubleshoot, investigate, brainstorm, probe, experiment, challenge, benchmark |
| [openspec](openspec/) | 9 | Structured development: plan, design, develop, review, test, reflect, replan, sync |
| [toolsmith](toolsmith/) | 5 | Tool creation: edit-tool, edit-claude, edit-plugin, search-skill, install-dependency |
| [content](content/) | 5 | Content transformation: anonymize, infographize, literatize, bridge, RISEN prompts |
| [convert](convert/) | 6 | Format conversion: PDF, EPUB, DOCX, PPTX → markdown, markdown → PDF, Google Docs import |
| [retrospect](retrospect/) | 3 | Session analysis: domain learnings, collaboration patterns, trend reports |
| [experimental](experimental/) | 9 | Experimental: deployment, background tasks, distill-skill, context bootstrap, summarization |
| [philosopher](philosopher/) | 24 | 20 philosopher personas, dialogue, encounter, council, create |
| [biz](biz/) | 7 | Business analysis: competitive analysis, UX strategy/wireframes/evaluation, market sizing, canvas, personas |
| [coach](coach/) | 1 | Personal coaching: CLEAR + GROW protocols |
| [gtd](gtd/) | 4 | GTD workflow automation for Obsidian vaults |
| [cowork](cowork/) | 4 | Multi-project context management: switch projects, save/load sessions, ref/wip sync |
| [lazy](lazy/) | 1 | Lazy skill demand capture: placeholder skills that measure real demand before building |

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
