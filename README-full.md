# 📚 Agent Skills — Full Catalog

> ⚠️ Live experiment. Highly personalized to my working style. Fork it, adapt it to *your* brain.

📖 **Principles & mindset:** [PHILOSOPHY.md](PHILOSOPHY.md) · 📄 **TL;DR:** [README.md](README.md)

---

## 🔄 Cognitive Modes

Everything in this toolkit maps to a cognitive mode — a way of engaging with a problem.

```mermaid
flowchart LR
    F["🧭 Frame"] --> T["🧠 Think"]
    T --> B["⚙️ Build"]
    B --> D["🔧 Debug"]
    D --> L["🪞 Learn"]
    L -.->|"next cycle"| F

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

You don't always go through every mode. A pebble (small fix) skips straight to Build. A crisis starts at Debug. The point is: **know which mode you're in**.

---

## 🧭 Frame — Sense-Making (4 skills)

*Before acting, understand the problem space.*

```mermaid
flowchart TD
    task["❓ Task"] --> frame["🧭 frame<br/>What kind of problem?"]
    task --> pick["🎯 pick-model<br/>Which model?"]
    task --> search["🔍 search-skill<br/>Skill exists already?"]
    task --> edit["🎯 edit-tool<br/>What tool type?"]

    frame -->|"route"| chain["Skill chain"]
    pick -->|"recommend"| model["haiku / sonnet / opus"]
    search -->|"discover"| existing["Existing skills"]
    edit -->|"route"| editor["skill / command / agent"]

    classDef router fill:#E8EAF6,stroke:#3F51B5,color:#000
    classDef output fill:#f9f9f9,stroke:#333,color:#000
    class frame,pick,search,edit router
    class chain,model,existing,editor output
```

| Skill | Purpose |
|-------|---------|
| `frame-problem` | 🧭 Classify problem (Cynefin + Stacey) → route to right skill chain |
| `pick-model` | 🎯 Recommend optimal model (haiku/sonnet/opus) for the task |
| `search-skill` | 🔍 Discover existing skills before building new ones |
| `edit-tool` | 🎯 Decision tree — routes to correct tool editor (skill/command/agent) |

### `/frame-problem` — The Entry Point

```mermaid
quadrantChart
    title Cynefin + Stacey Mapping
    x-axis "Low Certainty (HOW?)" --> "High Certainty (HOW?)"
    y-axis "Low Agreement (WHAT?)" --> "High Agreement (WHAT?)"
    quadrant-1 "Clear"
    quadrant-2 "Complicated HOW"
    quadrant-3 "Complex"
    quadrant-4 "Complicated WHAT"
```

| Domain | Route | OpenSpec? |
|--------|-------|-----------|
| **Clear** | Just code it | No |
| **Complicated (HOW?)** | `/investigate` → `/openspec-plan` | Boulder: yes |
| **Complicated (WHAT?)** | `/brainstorm` → decide → code | Boulder: yes |
| **Complex** | `/brainstorm` → `/investigate` → `/openspec-plan` | Yes |
| **Chaotic** | `/troubleshoot` → stabilize → re-frame | No |

Frame asks 2 questions (situation + scale), maps to a domain, suggests the skill chain, and hands off.

---

## 🧠 Think — Ideation & Analysis (3 skills + 1 agent)

*Diverge before you converge. Analyze before you design. Challenge before you commit.*

```mermaid
flowchart LR
    subgraph THINK["🧠 Think"]
        direction LR
        B["💡 brainstorm<br/>Divergent ideation"]
        I["🔬 investigate<br/>Deep analysis"]
        C["🔴 challenge<br/>Adversarial review"]
    end

    B -->|"options → pick"| I
    I -->|"design → decide"| COMMIT["✅ Commit"]
    C -.->|"wait — is this right?"| COMMIT

    B -.->|"too confident?"| C
    I -.->|"feels off?"| C
    C -->|"deep"| DA["🤖 devil-advocate<br/>(fresh context)"]

    classDef generative fill:#E1BEE7,stroke:#7B1FA2,color:#000
    classDef analytical fill:#C8E6C9,stroke:#388E3C,color:#000
    classDef adversarial fill:#FFCDD2,stroke:#C62828,color:#000
    classDef agent fill:#FFE0B2,stroke:#F57C00,color:#000
    classDef output fill:#f9f9f9,stroke:#333,color:#000

    class B generative
    class I analytical
    class C adversarial
    class DA agent
    class COMMIT output
```

Three cognitive stances — **generative** (create options), **analytical** (decompose + decide), **adversarial** (challenge before committing). `/challenge` is reactive: invoke it when output feels too confident, too fast, or too convenient.

### `/challenge` (skill, opus)

Structured adversarial review — forces reconsideration of current AI output using provocation patterns.

| Subcommand | Error Type | Technique |
|---|---|---|
| `anchor` | Premature commitment / anchoring bias | Counterfactual reframe, Steelman opposite |
| `verify` | Factual errors / hallucination | Claim decomposition, source audit |
| `framing` | Wrong problem / framing errors | Problem restatement, scope challenge |
| `deep` | High-stakes — all 9 patterns in fresh context | Spawns `devil-advocate` sub-agent (all 3 families: anchor → verify → framing → alignment check → verdict) |

**Triggers:** "challenge this", "are you sure", "push back", "prove it", "devil's advocate", "poke holes", "sanity check"

> 🤖 **Agent: `devil-advocate`** (Opus)
> Fresh context · All 9 debiasing patterns (Gatekeeper, Reset, Alt Approaches, Pre-mortem, Proof Demand, CoVe, Fact Check List, Socratic, Steelman) · Read/Glob/Grep only
> Returns: comprehensive Challenge Report with explicit technique rationale, reasoning traces, and confidence levels

### `/brainstorm` (skill, opus)

Structured ideation: research → divergent → convergent → recommendation.

| Phase | What |
|-------|------|
| **Research** | WebSearch for existing solutions (2-3 searches) |
| **Divergent** | SCAMPER + Starbursting → 5-10 distinct options |
| **Convergent** | Auto-select method (Weighted Scoring / Six Thinking Hats / Constraint-Based) |
| **Recommendation** | Top choice + assumptions + boulder/pebble detection |

### `/investigate` (skill, opus)

Deep proactive analysis for complex technical problems.

```mermaid
flowchart LR
    S["🎯 Scope"] --> D["🧩 Decompose"]
    D --> R["🔍 Research"]
    R --> G["🎨 Design"]
    G --> C["⚖️ Decide"]
    C --> BR["🌉 Bridge"]

    BR -->|"boulder"| OS["📋 OpenSpec"]
    BR -->|"pebble"| IMPL["⚙️ Implement"]

    classDef default fill:#f9f9f9,stroke:#333,color:#000
    classDef bridge fill:#E8EAF6,stroke:#3F51B5,color:#000
    class BR bridge
```

| Phase | Techniques |
|-------|------------|
| **Decompose** | Issue Trees (MECE), Constraint Mapping, unknowns inventory |
| **Research** | WebSearch, Kepner-Tregoe IS/IS NOT, codebase analysis |
| **Design** | Morphological Analysis (Zwicky), trade-off matrix, Mermaid diagrams |
| **Decide** | Weighted Decision Matrix, Pre-mortem, assumptions list |
| **Bridge** | Handoff → OpenSpec (boulder) or direct implementation (pebble) |

**Key distinction:** Troubleshoot = reactive (error → fix). Brainstorm = divergent (options → pick). Investigate = proactive (complex problem → decompose → design → decide).

---

## ⚙️ Build — Structured Development (9 skills)

*Plan → implement → gate → test → sync. Human-in-the-loop iteration.*

```mermaid
flowchart LR
    plan["📝 Think<br/>Design sections"] --> design["🏗️ Design<br/>BC check + design.md"]
    design --> dev["⚙️ Build<br/>Implement"]
    dev --> gate["🚧 Gate<br/>Human verifies"]
    gate -->|"continue"| dev
    gate --> test["🧪 Test<br/>Layered checks"]
    test --> reflect["🪞 Reflect<br/>Drift check"]
    reflect -->|"blocked?"| replan["🔀 Replan<br/>Adapt"]
    reflect --> save["💾 Save<br/>Session state"]
    replan --> dev

    classDef think fill:#E1BEE7,stroke:#7B1FA2,color:#000
    classDef build fill:#C8E6C9,stroke:#388E3C,color:#000
    classDef gate fill:#FFE0B2,stroke:#F57C00,color:#000
    classDef meta fill:#BBDEFB,stroke:#1976D2,color:#000

    class plan think
    class dev build
    class gate,replan gate
    class test,reflect,save meta
```

| Skill | Purpose |
|-------|---------|
| `openspec-init` | 🎬 Setup project (set mode: garage/scale/maintenance) |
| `openspec-design` | 🏗️ BC-first structural design — produces `design.md` between proposal and tasks |
| `openspec-plan` | 📝 Design proposal + test.md strategy (human reviews test plan upfront) |
| `openspec-develop` | ⚙️ Implement sections, stop at gates for human review |
| `openspec-test` | 🧪 Execute test.md verification, log to test-logs/ (no improvisation) |
| `openspec-reflect` | 🪞 Pre-gate drift check (flags missing test.md in scale/maintenance) |
| `openspec-replan` | 🔀 Pivot when blocked (adapt, don't force) |
| `openspec-sync` | 💾 Save session state (resume tomorrow without context loss) |
| `edit-risen-prompt` | ✍️ Create/audit RISEN prompts with structure validation |

**Core innovation:** Gates = human checkpoints between implementation sections. AI stops → you verify → mark pass → AI continues. Enables crash recovery (checkboxes persist), prevents scope drift (section-by-section review), maintains human control (you set the pace).

**Transparent testing:** test.md documents verification strategy at plan time. Human reviews test approach before any execution. Checkpoint reads test.md literally (no improvisation). Logs written to test-logs/ for audit trail.

**Execution modes:**
- **Garage** → Working > perfect. test.md recommended, smoke tests sufficient.
- **Scale** → Production rigor. test.md required, full verification at gates.
- **Maintenance** → Conservative changes, careful refactoring.

---

## 🔧 Debug — Troubleshooting (1 skill)

*Search first. Diagnose second. Learn always.*

```mermaid
flowchart LR
    L["📖 Load"] --> S["🔍 Search"]
    S --> Q["❓ Qualify"]
    Q --> D["🧠 Diagnose"]
    D --> I["🔄 OODA"]
    I --> R["💾 Learn"]

    S -->|"found"| R
    D -->|"pattern"| R

    classDef default fill:#f9f9f9,stroke:#333,color:#000
```

| Phase | What |
|-------|------|
| **Load** | Read learnings.yaml for known patterns |
| **Search** | WebSearch SO, GitHub, Docs, Reddit (80% of bugs solved online) |
| **Qualify** | 2-3 questions (stack, env, what changed?) |
| **Diagnose** | Mental models → Isolation → 5 Whys |
| **OODA** | Observe → Orient → Decide → Act |
| **Learn** | Save pattern to learnings.yaml for next time |

**Techniques:** Wolf Fence (binary search), 5 Whys, Fishbone 6 M's, Rubber Duck, OODA loops.

---

## 🪞 Learn — Retrospectives & Session Memory (8 skills)

*Extract patterns from sessions. Persist context across conversations.*

### Session Recap

| Skill | Purpose | Model |
|-------|---------|-------|
| `tldr` | 📝 Concise recap of previous response (summary + action items) | haiku |

### Session Analysis

| Skill | Purpose | Model |
|-------|---------|-------|
| `retrospect-domain` | 🎓 Extract learnings (WHAT/WHY) from captured sessions | opus |
| `retrospect-collab` | 🤝 Analyze collaboration patterns (HOW) + compute metrics | opus |
| `retrospect-report` | 📊 Aggregate trends and visualizations across sessions | opus |

### Context Management

| Skill | Purpose | Model |
|-------|---------|-------|
| `create-context` | 🎬 Create baseline from `.in/` folder (run once per project) | sonnet |
| `save-context` | 💾 Serialize session → CONTEXT-llm.md (before leaving) | sonnet |
| `load-context` | 📥 Resume session from CONTEXT-llm.md (optional `--full`) | sonnet |
| `list-contexts` | 📋 List all contexts across code/ and projects/ with status | haiku |

> 🤖 **Agent: `summarize-for-context`** (Haiku)
> Chunked reading for files >25K tokens · Read + python3 + wc only
> Returns: token-budgeted markdown summary preserving key facts, decisions, and actionable items

### 🧬 Context Engineering Workflow

This plugin implements **context engineering** — the discipline of designing what task-relevant information the model has access to, not just how you prompt it.

🎤 **Accessible intro:** [Context Engineering FTW — Making Claude actually work in real codebases](https://link.excalidraw.com/p/readonly/cz2KRei6ueIPyvbXaThj) by [Mehdi Mehlah](https://www.linkedin.com/in/mehlah/) (Lyon.rb) — visual walkthrough of micro-agents in DAGs, context window mechanics, and why traditional large agents break after 10-20 turns.

📖 **Deep dive:** [Advanced Context Engineering for Agents](https://www.youtube.com/watch?v=VvkhYWFWaKI) ([paper](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents)) by Dexter Horthy — the original framework: *"The contents of your context window are the ONLY lever you have to affect the quality of your output."*

**Core principle: Frequent Intentional Compaction** — pause before context saturation, distill progress into structured artifacts (CONTEXT-llm.md, research docs, specs), restart fresh with compressed knowledge. Target 40-60% context utilization.

#### 🗺️ High-level lifecycle (stable)

The session lifecycle pattern itself is generic — it applies to any AI-assisted workflow, regardless of tooling.

```mermaid
flowchart LR
    START["🟢 Start<br/>Load context"] --> RESEARCH["🔍 Research<br/>Understand problem"]
    RESEARCH -->|"compressed<br/>research doc"| PLAN["📝 Plan<br/>Design solution"]
    PLAN -->|"detailed spec"| IMPLEMENT["⚙️ Implement<br/>Build + verify"]
    IMPLEMENT -->|"compaction<br/>trigger"| COMPACT["📦 Compact<br/>Distill progress"]
    COMPACT --> END["🔴 End<br/>Save context"]

    COMPACT -.->|"🔄 fresh window"| START

    classDef session fill:#BBDEFB,stroke:#1976D2,color:#000
    classDef research fill:#E8EAF6,stroke:#3F51B5,color:#000
    classDef plan fill:#E1BEE7,stroke:#7B1FA2,color:#000
    classDef implement fill:#C8E6C9,stroke:#388E3C,color:#000
    classDef compact fill:#FFE0B2,stroke:#F57C00,color:#000

    class START,END session
    class RESEARCH research
    class PLAN plan
    class IMPLEMENT implement
    class COMPACT compact
```

---

#### 🔧 Detailed implementation (permanent WIP)

How this plugin maps each phase to concrete skills and commands — evolves as new tools are added.

```mermaid
flowchart LR
    subgraph START["🟢 Start"]
        load["📥 /load-context"]
        claude["📄 CLAUDE.md"]
        hooks_start["🪝 Hooks"]
    end

    subgraph SENSE["🔍 Sense-Make"]
        frame["🧭 /frame-problem"]
        search["🔍 /search-skill"]
        frame --> brainstorm["🧠 /brainstorm"]
        frame --> investigate["🔬 /investigate"]
    end

    subgraph BUILD["⚙️ Plan + Build"]
        plan["📋 /openspec-plan"]
        risen["✍️ /edit-risen-prompt"]
        plan --> design["🏗️ /openspec-design"]
        design --> dev["⚙️ /openspec-develop"]
        dev --> test["🧪 /openspec-test"]
        dev --> reflect["🪞 /openspec-reflect"]
        reflect -->|"blocked"| replan["🔀 /openspec-replan"]
        replan --> dev
    end

    subgraph PERSIST["📦 Persist"]
        sync["💾 /openspec-sync"]
        save["💾 /save-context"]
        retro["🪞 /retrospect-*"]
        hooks_stop["🪝 Hooks"]
    end

    START --> SENSE
    brainstorm --> plan
    investigate --> plan
    BUILD --> PERSIST
    PERSIST -->|"🔄 next session"| NEXT["🟢 /load-context"]

    classDef start fill:#BBDEFB,stroke:#1976D2,color:#000
    classDef sense fill:#E8EAF6,stroke:#3F51B5,color:#000
    classDef build fill:#C8E6C9,stroke:#388E3C,color:#000
    classDef persist fill:#FFE0B2,stroke:#F57C00,color:#000
    classDef loop fill:#E8F5E9,stroke:#2E7D32,color:#000,stroke-dasharray:5

    class START start
    class SENSE sense
    class BUILD build
    class PERSIST persist
    class NEXT loop
```

**How it maps to Horthy's principles:**

| Principle | Plugin Implementation |
|-----------|----------------------|
| **Research phase** | `/frame-problem` → `/brainstorm` or `/investigate` — map the problem space before coding |
| **Plan phase** | `/openspec-plan` — precise spec with test strategy, human reviews before execution |
| **Implement phase** | `/openspec-develop` — gate-driven, section-by-section with human checkpoints |
| **Frequent compaction** | `/save-context` + `/openspec-sync` — serialize state to markdown artifacts |
| **Session continuity** | `/load-context` resumes from CONTEXT-llm.md — no context loss between sessions |
| **Human leverage** | Gates shift human review upstream (research → plan) where impact compounds |
| **Subagent isolation** | Skills run as isolated context windows, return compressed summaries to parent |

---

## 🔨 Create — Tool Orchestration (6 skills)

*Build your own skills and agents.*

```mermaid
flowchart LR
    search["🔍 search-skill"] -.->|"exists?"| edit["🎯 edit-tool"]
    edit -->|"<500 tokens"| skill["✨ edit-skill"]
    edit -->|"isolated context"| agent["🤖 edit-agent"]
    edit -->|"project context"| claude["📄 edit-claude"]

    pick["🎯 pick-model"] -.->|"which model?"| skill & agent

    skill & agent -->|"added/removed?"| plugin["📦 edit-plugin"]

    classDef router fill:#FFE4B5,stroke:#333,color:#000
    classDef editor fill:#f9f9f9,stroke:#333,color:#000
    classDef support fill:#E0E7FF,stroke:#333,color:#000
    classDef post fill:#C8E6C9,stroke:#333,color:#000
    class edit router
    class skill,agent,claude editor
    class search,pick support
    class plugin post
```

| Skill | When to Use |
|-------|-------------|
| `edit-tool` | 🎯 Decision tree — routes to correct editor |
| `edit-skill` | ✨ Auto-invoked capabilities (<500 tokens) |
| `edit-agent` | 🤖 Isolated context, complex tasks |
| `edit-claude` | 📄 Project CLAUDE.md files |
| `edit-plugin` | 📦 Version bumps and plugin metadata sync |
| `search-skill` | 🔍 Discover & evaluate skills from curated sources |
| `pick-model` | 🎯 Recommend haiku/sonnet/opus for the task |

---

## 🔧 Utilities (5 skills)

| Skill | Purpose |
|-------|---------|
| `anonymize-doc` | 🔒 Detect/anonymize PII + business data (GDPR/HIPAA aware) |
| `install-dependency` | 📦 Monorepo-aware package installation (pip/bun/apt) |
| `convert-md-to-pdf` | 📄 Convert markdown with Mermaid to styled PDF |
| `infographize` | 🎨 Convert markdown to AntV infographic SVG (visual storytelling) |
| `dump-output` | 📤 Toggle auto-dump to `.dump/` |

## 📥 Conversions & Imports (6 skills)

| Skill | Purpose | Model |
|-------|---------|-------|
| `convert-pdf` | 📄 PDF → markdown (Docling) | haiku |
| `convert-docx` | 📝 Word → markdown (markitdown) | haiku |
| `convert-pptx` | 📊 PowerPoint → markdown (markitdown) | haiku |
| `convert-epub` | 📖 EPUB → markdown | haiku |
| `import-gdoc` | 📥 Import Google Docs with manifest tracking | haiku |
| `background` | 🔄 Run tasks in background | sonnet |

## 🚀 Deployment (1 skill)

| Skill | Purpose | Model |
|-------|---------|-------|
| `deploy-surge` | 🌐 Deploy static sites to Surge.sh with inventory tracking | sonnet |

---

## 🪝 Hooks (3)

| Hook | Purpose |
|------|---------|
| `notify-tmux.sh` | 🖥️ Visual feedback in tmux status bar |
| `retrospect-capture.sh` | 📝 Auto-log session events for retrospective analysis |
| `dump-output.sh` | 📤 Debug artifacts to `.dump/` directory |

Configure in `hooks.json`. See [hooks/README.md](dstoic/hooks/README.md) for details.

---

## 📦 Dependencies

### Required

| Feature | Requires | Install |
|---------|----------|---------|
| `openspec-*` skills | [OpenSpec CLI](https://github.com/digital-stoic-org/openspec) | `pip install openspec` (TBD) |
| `anonymize-doc` | scrubadub, faker, spacy | `pip install scrubadub faker spacy && python -m spacy download en_core_web_sm` |
| `/convert-pdf` | [Docling](https://github.com/DS4SD/docling) | `pip install docling` |
| `/convert-docx` | [markitdown](https://github.com/microsoft/markitdown) | `pip install markitdown` |
| `/convert-pptx` | [markitdown](https://github.com/microsoft/markitdown) | `pip install markitdown` |
| `/convert-epub` | [epub-to-markdown](https://github.com/nickvdyck/epub-to-markdown) | `pip install epub-to-markdown` |
| `infographize` | [@antv/infographic](https://github.com/antvis/infographic) | `bun add @antv/infographic` |

### Recommended

| Feature | Requires | Install |
|---------|----------|---------|
| Token-optimized output | [rtk](https://github.com/pszymkowiak/rtk) | See repo for install |
| Node.js packages | [bun](https://bun.sh) | `curl -fsSL https://bun.sh/install \| bash` |

### Optional

| Feature | Requires | Notes |
|---------|----------|-------|
| `notify-tmux.sh` | [tmux](https://github.com/tmux/tmux) | 🖥️ Visual notifications |
| Hooks | bash | 🐚 All hooks require bash |

---

## 📦 Installation

Install from the Claude Code marketplace:

```
/install-plugin https://github.com/digital-stoic-org/agent-skills
```

This installs all plugins (dstoic, gtd). To install a specific plugin only, add it to `.claude/settings.json`:
```json
{"plugins": ["digital-stoic-org/agent-skills/dstoic"]}
```

---

📄 **License:** MIT — Fork it, adapt it, make it yours.

🧭 **Philosophy:** [PHILOSOPHY.md](PHILOSOPHY.md) · 📄 **TL;DR:** [README.md](README.md)
