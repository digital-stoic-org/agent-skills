---
name: pick-model
description: Recommend optimal Claude model (haiku/sonnet/opus) for a task. Use when user asks "which model", "pick model", "model for", or before starting costly/complex tasks. Covers tech and non-tech tasks.
model: haiku
context: main
---

# Pick Model

Classify user's task → recommend optimal model with reasoning.

## Instructions

1. Parse task description from `$ARGUMENTS`
2. Classify against decision matrix below
3. Output recommendation using format template

## Decision Matrix

### Technical Tasks

| Model | When to Use |
|---|---|
| 🟢 **Haiku** | Simple transforms, formatting, regex, typo fix, status query, template fill, data extraction, factual lookup (no reasoning), file conversion |
| 🟡 **Sonnet** | Single-file coding, bug fix, code review, moderate debugging, test writing, PR review, standard refactoring, technical docs, API integration (known patterns) |
| 🔴 **Opus** | Multi-file refactor (3+ files), architecture/design decisions, complex debugging (multi-system), framework migration, security audit, novel algorithm design, system design with trade-offs |

### Business & Strategy Tasks

| Model | When to Use |
|---|---|
| 🟢 **Haiku** | Summarization (<2K words), data extraction, status reports, simple translations, template filling, meeting notes formatting |
| 🟡 **Sonnet** | Content creation (blog, email, docs), research summaries, competitive analysis, standard business writing, persuasive proposals, marketing copy, customer communications |
| 🔴 **Opus** | Strategic planning, business model design, M&A analysis, organizational design, change management plans, competitive strategy, market entry decisions, crisis response, stakeholder management (competing interests), long-form reports (>2K words), executive presentations with nuance |

### Creative & Analysis Tasks

| Model | When to Use |
|---|---|
| 🟢 **Haiku** | Basic formatting, simple data viz suggestions, straightforward categorization |
| 🟡 **Sonnet** | Creative writing, brainstorming (single framework), persona development, user research synthesis, A/B test analysis, survey analysis |
| 🔴 **Opus** | Multi-framework brainstorming (SCAMPER + Starbursting + trade-off analysis), cross-session pattern detection, bias identification, retrospective analysis, ethical reasoning, strategic foresight, scenario planning |

### Commands, Skills, Agents

| Model | When to Use |
|---|---|
| 🟢 **Haiku** | Simple conversions (PDF, EPUB), format checks, simple utilities, minimal reasoning |
| 🟡 **Sonnet** | Standard workflows, context management, serialization, most skills/commands (DEFAULT) |
| 🔴 **Opus** | Strategic analysis (brainstorm, retrospectives), multi-framework reasoning, high-stakes decisions, pattern detection across sessions |

## Complexity Escalators

Upgrade one tier if task has ANY of these signals:

### Technical Escalators
- **Ambiguity**: Underspecified requirements, multiple valid interpretations → +1 tier
- **Scope**: Affects 3+ files/systems/components → +1 tier
- **Stakes**: Production system, security, data-loss risk, regulatory compliance → +1 tier
- **Novelty**: No established pattern, novel algorithm, cutting-edge tech → +1 tier

### Business Escalators
- **Multiple stakeholders**: Competing interests, need to balance trade-offs → +1 tier
- **Strategic impact**: Long-term consequences, irreversible decisions, organizational change → +1 tier
- **Political sensitivity**: Layoffs, restructuring, executive communications, crisis → +1 tier
- **Cross-functional**: Requires synthesis across domains (tech + business + legal) → +1 tier

### Cognitive Escalators
- **Pattern detection**: Requires analyzing trends across multiple data points/sessions → +1 tier
- **Bias identification**: Needs to spot blindspots, cognitive biases, assumptions → +1 tier
- **Ethical reasoning**: Moral ambiguity, fairness considerations, unintended consequences → +1 tier
- **Multi-framework**: Applying 2+ analytical frameworks simultaneously → +1 tier

**Cap at Opus.** If multiple escalators apply, still cap at Opus (don't "double upgrade").

## Decision Guidance

**When uncertain between two models:**
- **Haiku vs Sonnet**: Does it require *any* reasoning/judgment? → Sonnet
- **Sonnet vs Opus**: Are there trade-offs to balance or multiple valid approaches? → Opus
- **Default rule**: When in doubt, go one tier up (better quality > cost savings)

**Quality vs Cost trade-offs:**
- **Cost-sensitive**: Batch processing, exploratory work, drafts → prefer lower tier
- **Quality-critical**: Customer-facing, executive, production, irreversible → prefer higher tier
- **Iteration-friendly**: Can easily retry with higher tier if insufficient → start lower

**Speed considerations:**
- Haiku is ~3-5x faster than Sonnet, ~10x faster than Opus
- For latency-sensitive workflows (UI feedback, real-time), prefer Haiku/Sonnet
- For batch/async work, speed matters less than quality

## Output Format

```
[emoji] **[Model]** — [1-line reason]

💰 Cost: [lowest/medium/highest] | ⚡ Speed: [fastest/medium/slowest]

💡 [Optional: "Consider [other model] if [condition]"]
```

**Example output:**
```
🔴 **Opus** — Multi-stakeholder strategic decision with trade-offs

💰 Cost: highest | ⚡ Speed: slowest

💡 Consider Sonnet if this is exploratory (draft) rather than final recommendation
```

## Examples

### Technical Tasks

| Task | Recommendation | Rationale |
|---|---|---|
| "fix typo in README" | 🟢 **Haiku** | Trivial single edit, no reasoning |
| "convert PDF to markdown" | 🟢 **Haiku** | Simple conversion, no decisions |
| "debug flaky integration test" | 🟡 **Sonnet** | Single-system debugging, moderate reasoning |
| "refactor auth across 15 files" | 🔴 **Opus** | Multi-file (3+ escalator) + architectural decisions |
| "design database schema for e-commerce" | 🔴 **Opus** | Architectural decision with trade-offs, long-term impact |
| "plan microservices migration strategy" | 🔴 **Opus** | Complex architectural planning + strategic impact escalator |

### Business & Strategy

| Task | Recommendation | Rationale |
|---|---|---|
| "summarize this meeting transcript" | 🟢 **Haiku** | Simple text transformation, <2K words |
| "extract action items from notes" | 🟢 **Haiku** | Data extraction, no reasoning |
| "write blog post about AI trends" | 🟡 **Sonnet** | Creative writing, moderate reasoning |
| "draft sales proposal for enterprise client" | 🟡 **Sonnet** | Persuasive writing, moderate reasoning |
| "analyze competitor pricing strategy" | 🟡 **Sonnet** | Research/analysis, single framework |
| "plan market entry strategy for Europe" | 🔴 **Opus** | Strategic impact + cross-functional + ambiguity escalators |
| "design organizational restructuring plan" | 🔴 **Opus** | Political sensitivity + multiple stakeholders + strategic impact |
| "M&A due diligence analysis" | 🔴 **Opus** | Strategic stakes + cross-functional synthesis required |
| "crisis communication plan for data breach" | 🔴 **Opus** | Political sensitivity + stakes + multiple stakeholders |

### Creative & Analysis

| Task | Recommendation | Rationale |
|---|---|---|
| "translate paragraph to French" | 🟢 **Haiku** | Simple language transform, no reasoning |
| "brainstorm product names (single session)" | 🟡 **Sonnet** | Creative generation, moderate reasoning |
| "brainstorm with SCAMPER + trade-off analysis" | 🔴 **Opus** | Multi-framework escalator (SCAMPER + weighted scoring) |
| "retrospect: analyze collaboration patterns" | 🔴 **Opus** | Pattern detection + bias identification escalators |
| "identify blindspots in strategy" | 🔴 **Opus** | Bias identification + ethical reasoning escalators |
| "plan 3-day conference with speakers" | 🔴 **Opus** | Complex scheduling + multiple stakeholders + constraints |

### Commands, Skills, Agents

| Task | Recommendation | Rationale |
|---|---|---|
| "command: convert EPUB to markdown" | 🟢 **Haiku** | Simple workflow, minimal reasoning |
| "command: save session context" | 🟡 **Sonnet** | Context management, serialization logic |
| "command: brainstorm with research + SCAMPER" | 🔴 **Opus** | Multi-framework escalator + strategic analysis |
| "command: retrospect domain learnings" | 🔴 **Opus** | Pattern detection across sessions + bias identification |
| "skill: format code with prettier" | 🟢 **Haiku** | Simple deterministic task |
| "skill: OpenSpec section implementation" | 🟡 **Sonnet** | Standard workflow, moderate reasoning |
| "agent: explore codebase architecture" | 🔴 **Opus** | Complex exploration + architectural synthesis |
