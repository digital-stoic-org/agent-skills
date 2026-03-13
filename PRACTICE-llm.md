# Digital Stoic Praxis — LLM Reference

> Praxis (πρᾶξις): Greek for "practice" — knowledge enacted, not just known. This document encodes a living discipline of human-AI collaboration, not a methodology to copy-paste.

⚠️ **This file is for LLM consumption** (benchmarking, comparison). Self-contained by design — duplication with other docs is intentional.

👤 **Human?** Start here instead: [README](README.md) → [PHILOSOPHY](PHILOSOPHY.md) → [PRACTICE](PRACTICE.md) → [README-full](README-full.md)

---

## Core Position

AI sharpens thinking, not replaces it. Sharpening without structure = noise. Working with AI = cognitive discipline. The relationship is bidirectional: human directs execution, AI challenges thinking.

---

## Cognitive ROI (Return on Tokens)

Three-axis model for measuring value per token spent:

### Axis 1: Augmentation Depth

Tracks WHERE tokens go across 3 tiers:

```yaml
tiers:
  automation:
    description: Rote tasks delegated to AI (formatting, conversion, boilerplate)
    value_per_token: low
    examples: [convert-pdf, convert-docx, deploy-surge, install-dependency]
  assisted_thinking:
    description: AI structures/accelerates human thinking
    value_per_token: medium
    examples: [troubleshoot, brainstorm, search-skill, frame-problem]
  amplified_judgment:
    description: AI challenges, deepens, or transforms human reasoning
    value_per_token: high
    examples: [challenge, investigate, devil-advocate, probe, retrospect-domain]

maturity_model:
  beginner:  { automation: 70%, assisted: 20%, amplified: 10% }
  evolving:  { automation: 40%, assisted: 30%, amplified: 30% }
  advanced:  { automation: 20%, assisted: 20%, amplified: 60% }
  measure: shift budget toward amplified_judgment over time
```

### Axis 2: Context Efficiency

Less waste = more value from same token budget:

```yaml
mechanisms:
  session_persistence: save-context/load-context eliminates re-explanation across sessions
  context_compression: summarize-for-context (haiku) reduces large files to token-budgeted summaries
  token_proxy: RTK (Rust Token Killer) — 60-90% savings on dev operations via hook-based filtering
  llm_optimized_docs: SKILL.md files are directive-dense, prose-minimal
  3_layer_docs: README (scan) → README-full (deep) → SKILL.md (LLM) — right content to right reader
```

### Axis 3: Compounding

Learnings feed back, reducing future token spend:

```yaml
loops:
  retrospect_domain: extracts WHAT/WHY patterns from sessions → reusable knowledge
  retrospect_collab: analyzes HOW human-AI worked → improves collaboration quality
  troubleshoot_learnings: debugging patterns saved to learnings.yaml → checked first next time
  skill_evolution: skills themselves evolve based on usage patterns (edit-tool, edit-plugin)
  gate_commits: micro-commits at verification points → audit trail + crash recovery
```

---

## Principles (7)

```yaml
principles:
  1_frame_before_act:
    rule: Classify problem (Cynefin) before choosing approach
    mechanism: /frame-problem routes to skill chain based on domain type
    domains: { clear: execute, complicated: analyze, complex: probe, chaotic: act }

  2_think_before_build:
    rule: Research and ideate before coding
    mechanism: /brainstorm (SCAMPER) + /investigate (Issue Trees, Pre-mortem)
    why: cheap thinking prevents expensive building

  3_human_controls_execution_ai_challenges_thinking:
    rule: "Execution: AI implements → gate → human reviews. Thinking: bidirectional — AI challenges human assumptions."
    mechanism: "Gates for execution (OpenSpec). Challenge/devil-advocate/retrospect for thinking."
    anti_pattern: "Execution: runaway AI. Thinking: directing without listening."

  4_micro_commits_at_gates:
    rule: Every verified gate = git commit
    benefits: [rollback granularity, readable history, gate evidence, crash safety]

  5_boulder_to_pebbles:
    rule: Scale process to problem size
    mapping:
      boulder: Full OpenSpec (plan → design → develop → gate → test → sync)
      pebble: Just code it
    note: iterative zoom, not binary

  6_sessions_persist:
    rule: Multi-day work needs continuity
    mechanism: save-context → CONTEXT-llm.md → load-context

  7_learn_from_patterns:
    rule: Compound learning across sessions
    mechanism: retrospect-* extracts signal; troubleshoot saves patterns
```

---

## Human-AI Collaboration Model

### Conscious Cognitive Activation

Before engaging AI, the practitioner activates a deliberate thinking mode:

```yaml
protocol:
  step_1: "Clarify: Role → Objective → Cognitive Mode"
  step_2: "Use AI to sharpen thinking — both amplify AND challenge"
  step_3: "Measure: quality of questions, clarity of reasoning, blind spots surfaced — NOT time saved"

posture: "Posture before technique. Posture includes willingness to be challenged."
```

### 5 Cognitive Modes (Pre-AI Patterns, AI-Amplified)

```yaml
modes:
  analyze: { icon: 🔍, pattern: "sense-making, questioning assumptions", skills: [investigate, challenge, frame-problem] }
  design:  { icon: 🏗️, pattern: "structuring with coherence and foresight", skills: [openspec-design, openspec-plan] }
  decide:  { icon: ⚖️, pattern: "weighing trade-offs, committing", skills: [brainstorm, devil-advocate, pick-model] }
  create:  { icon: ✨, pattern: "generating ideas, reframing, prototyping", skills: [brainstorm, edit-tool, infographize] }
  improve: { icon: 🔧, pattern: "iterating, refining, learning", skills: [retrospect-domain, retrospect-collab, troubleshoot] }
```

### Autonomy Spectrum

```yaml
levels:
  human_drives:
    direction: "human → AI"
    description: AI assists, human decides everything
    examples: [brainstorm, investigate]
  mutual_sharpening:
    direction: "human ↔ AI"
    description: AI actively challenges human reasoning, surfaces blind spots
    examples: [challenge, devil-advocate, retrospect-collab]
    note: "default for THINKING — highest cognitive ROI"
  gated_delegation:
    direction: "human → AI → human"
    description: AI executes sections, stops for human verification
    examples: [openspec-develop, openspec-test]
    note: "default for EXECUTION"
  supervised_automation:
    direction: "AI → human (notify)"
    description: AI runs autonomously with human monitoring
    examples: [background tasks, hook-driven capture]
  fire_and_forget:
    direction: "AI only"
    description: Fully autonomous, no human in loop
    examples: [retrospect-capture hook, notify-tmux hook, RTK proxy]
```

### Orchestrated Agency

```yaml
principle: "Agency amplified by agentic systems, NOT replaced by automation"
agent_definition: "Role + Objective + Cognitive Mode + Context + Autonomy Level"
anti_patterns:
  - "Agentic without agency = automation. Pure delegation without conscious direction."
  - "Directing without listening = wasted potential. Most valuable agents are the ones that tell you you're wrong."
highest_value_agents: "devil-advocate, challenge, retrospect-collab — AI corrects the human"

agent_types:
  analyst: { purpose: "examine assumptions, identify blind spots", model: opus }
  designer: { purpose: "structure plans, organize workflows", model: sonnet }
  decision: { purpose: "simulate scenarios, evaluate trade-offs", model: opus }
  creative: { purpose: "reframe problems, generate perspectives", model: opus }
  improvement: { purpose: "refine processes, optimize", model: sonnet }

implementation:
  devil_advocate: { type: analyst, fresh_context: true, patterns: 9, families: [anchor, verify, framing] }
  summarize_for_context: { type: improvement, model: haiku, purpose: "compress large files" }
```

---

## Skill Inventory

### By Cognitive Flow

```yaml
# 🧭 Frame — Sense-Making (route to right approach)
frame:
  - { skill: frame-problem, model: sonnet, domain: agnostic, purpose: "Cynefin classify → skill chain" }
  - { skill: probe, model: sonnet, domain: agnostic, purpose: "safe-to-fail experiment (complex domain)" }
  - { skill: experiment, model: sonnet, domain: agnostic, purpose: "act-sense loop (chaotic domain)" }
  - { skill: pick-model, model: haiku, domain: agnostic, purpose: "recommend haiku/sonnet/opus" }
  - { skill: search-skill, model: sonnet, domain: agnostic, purpose: "discover existing skills" }

# 🧠 Think — Ideation & Analysis
think:
  - { skill: brainstorm, model: opus, domain: agnostic, purpose: "SCAMPER divergence → weighted scoring" }
  - { skill: investigate, model: opus, domain: agnostic, purpose: "deep analysis (Issue Trees, Pre-mortem)" }
  - { skill: challenge, model: opus, domain: agnostic, purpose: "adversarial review (3 families)" }
  - { agent: devil-advocate, model: opus, domain: agnostic, purpose: "fresh-context 9-pattern debiasing" }

# ⚙️ Build — Structured Development
build:
  - { skill: openspec-init, model: sonnet, domain: tech_agnostic, purpose: "setup project (garage/scale/maintenance)" }
  - { skill: openspec-design, model: opus, domain: tech_agnostic, purpose: "BC-first structural design" }
  - { skill: openspec-plan, model: opus, domain: tech_agnostic, purpose: "proposal + test strategy" }
  - { skill: openspec-review, model: opus, domain: tech_agnostic, purpose: "pre-implementation tech lead gate" }
  - { skill: openspec-develop, model: sonnet, domain: tech_agnostic, purpose: "implement sections, stop at gates" }
  - { skill: openspec-test, model: sonnet, domain: tech_agnostic, purpose: "execute test.md, log results" }
  - { skill: openspec-reflect, model: sonnet, domain: tech_agnostic, purpose: "pre-gate drift check" }
  - { skill: openspec-replan, model: sonnet, domain: tech_agnostic, purpose: "pivot when blocked" }
  - { skill: openspec-sync, model: sonnet, domain: tech_agnostic, purpose: "save session state" }
  - { skill: edit-risen-prompt, model: sonnet, domain: agnostic, purpose: "create/audit RISEN prompts" }

# 🔧 Debug — Troubleshooting
debug:
  - { skill: troubleshoot, model: sonnet, domain: tech_agnostic, purpose: "Wolf Fence, 5 Whys, Fishbone, OODA" }

# 🪞 Learn — Retrospectives & Memory
learn:
  - { skill: tldr, model: sonnet, domain: agnostic, purpose: "concise session recap" }
  - { skill: retrospect-domain, model: opus, domain: agnostic, purpose: "extract WHAT/WHY learnings" }
  - { skill: retrospect-collab, model: opus, domain: agnostic, purpose: "analyze HOW collaboration" }
  - { skill: retrospect-report, model: opus, domain: agnostic, purpose: "aggregate trends + visualizations" }
  - { skill: save-context, model: sonnet, domain: agnostic, purpose: "serialize session → CONTEXT-llm.md" }
  - { skill: load-context, model: sonnet, domain: agnostic, purpose: "resume from CONTEXT-llm.md" }
  - { skill: create-context, model: sonnet, domain: agnostic, purpose: "bootstrap from .in/ folder" }
  - { skill: list-contexts, model: sonnet, domain: agnostic, purpose: "registry across projects" }
  - { agent: summarize-for-context, model: haiku, domain: agnostic, purpose: "compress >25K files" }

# 🔨 Create — Tool Orchestration
create:
  - { skill: edit-tool, model: sonnet, domain: tech_specific, purpose: "unified skill/agent/script editor" }
  - { skill: edit-claude, model: sonnet, domain: tech_specific, purpose: "CLAUDE.md creation/optimization" }
  - { skill: edit-plugin, model: sonnet, domain: tech_specific, purpose: "version bumps + plugin metadata" }
  - { skill: test-skill, model: sonnet, domain: tech_specific, purpose: "behavioral tests for skills" }
  - { skill: literatize, model: sonnet, domain: tech_agnostic, purpose: "add intent comments to code" }

# 🔧 Utilities
utilities:
  - { skill: anonymize-doc, model: sonnet, domain: agnostic, purpose: "PII detection + 5 anonymization strategies" }
  - { skill: install-dependency, model: sonnet, domain: tech_agnostic, purpose: "monorepo-aware package install" }
  - { skill: convert-md-to-pdf, model: sonnet, domain: agnostic, purpose: "markdown + Mermaid → PDF" }
  - { skill: infographize, model: sonnet, domain: agnostic, purpose: "markdown → AntV infographic SVG" }
  - { skill: dump-output, model: sonnet, domain: tech_specific, purpose: "toggle debug artifact dumps" }
  - { skill: scratch, model: sonnet, domain: agnostic, purpose: "session scratchpad" }
  - { skill: background, model: sonnet, domain: agnostic, purpose: "async task execution" }
  - { skill: toshl, model: sonnet, domain: personal, purpose: "financial data sync + reports" }

# 📥 Conversions & Imports
conversions:
  - { skill: convert-pdf, model: sonnet, domain: agnostic, purpose: "PDF → markdown (Docling)" }
  - { skill: convert-docx, model: sonnet, domain: agnostic, purpose: "Word → markdown (markitdown)" }
  - { skill: convert-pptx, model: sonnet, domain: agnostic, purpose: "PowerPoint → markdown" }
  - { skill: convert-epub, model: sonnet, domain: agnostic, purpose: "EPUB → markdown" }
  - { skill: import-gdoc, model: sonnet, domain: agnostic, purpose: "Google Docs → local with manifest" }
  - { skill: deploy-surge, model: sonnet, domain: tech_specific, purpose: "static site deploy + inventory" }
```

### By Domain Scope

```yaml
domain_classification:
  agnostic:
    description: Any professional, any domain
    count: 27
    examples: [frame-problem, brainstorm, challenge, investigate, retrospect-*, save/load-context, anonymize-doc, scratch]

  tech_agnostic:
    description: Any software project, any stack
    count: 13
    examples: [openspec-*, troubleshoot, install-dependency, literatize]

  tech_specific:
    description: Tied to specific tooling (Claude Code, Surge, etc.)
    count: 6
    examples: [edit-tool, edit-claude, edit-plugin, deploy-surge, dump-output, test-skill]

  personal:
    description: Domain-specific to practitioner's life
    count: 1
    examples: [toshl]
```

### Namespace Plugins (Beyond Core)

```yaml
plugins:
  gtd:
    version: 0.3.1
    domain: personal_productivity
    skills: [capture, triage, route, focus]
    scope: "Obsidian vault GTD automation"

  coach:
    version: 0.3.0
    domain: personal_development
    skills: [coach]
    subcommands: [personal (CLEAR), signal (GROW)]
    scope: "Coaching sessions with protocol routing"

  biz:
    version: 0.2.0
    domain: business_analysis
    skills: [analyze-competition]
    scope: "Competitive analysis, feature matrix, go/no-go"
```

---

## Hooks (Ambient Infrastructure)

```yaml
hooks:
  notify-tmux:
    purpose: Context-aware tmux window notifications
    autonomy: fire_and_forget
    events: [SessionStart, PreToolUse, PermissionRequest, Stop, SessionEnd]

  retrospect-capture:
    purpose: Auto-log all lifecycle events to JSONL
    autonomy: fire_and_forget
    events: ALL_10
    feeds: [retrospect-domain, retrospect-collab, retrospect-report]

  dump-output:
    purpose: Debug artifact capture on Stop
    autonomy: supervised (toggle via /dump-output)
    events: [Stop]

  list-context-sync:
    purpose: Daily context registry maintenance
    autonomy: fire_and_forget
    events: [SessionStart]
    constraint: praxis-only, once-per-day
```

---

## Execution Modes

```yaml
modes:
  garage:
    when: MVP, prototype, exploration
    philosophy: "Working > perfect. Ship small, iterate fast."
    verification: smoke tests sufficient
    default: true

  scale:
    when: production, team code, high stakes
    philosophy: "Full verification. Document decisions."
    verification: test.md required, gates enforced

  maintenance:
    when: existing system, careful changes
    philosophy: "Don't break what works."
    verification: conservative, regression-focused
```

---

## Toothbrush Principle

```yaml
core: "Skills and CLAUDE.md are personal — like toothbrushes. Fork, adapt, make yours."
applies_to:
  - CLAUDE.md (cognitive fingerprint: how YOU think, communicate, organize)
  - Skills (thinking workflows: frameworks that match YOUR brain)
anti_pattern: "Copying someone else's setup verbatim"
implication: "This practice document describes ONE practitioner's discipline. Benchmark it, learn from it, but don't clone it."
```

---

## Benchmarking Dimensions

For comparing this practice against other approaches:

```yaml
dimensions:
  1_philosophy: What beliefs drive the approach?
  2_skill_coverage: What tasks are automated/augmented, by cognitive mode?
  3_human_ai_blend: Mutual sharpening or one-way? Does AI challenge the human?
  4_conscious_activation: Deliberate mode selection + willingness to be challenged?
  5_orchestrated_agency: Human-directed AND AI-challenges-human, or just automation?
  6_cognitive_roi: Where do tokens go? (automation vs assisted vs amplified)
  7_context_efficiency: Session persistence, compression, token savings?
  8_compounding: Do learnings feed back into future sessions?
  9_goal_types: What scope of problems? Boulder vs pebble? Domain coverage?
  10_domain_applicability: Generic vs tech-specific vs personal?
  11_personalization: Toothbrush principle? Adaptable to different practitioners?
```
