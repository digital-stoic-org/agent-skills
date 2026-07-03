# Skill Editor Reference Guide

Detailed templates, examples, and best practices for creating and modifying Claude Code skills.

## Table of Contents

- [Unified Frontmatter Specification](#unified-frontmatter-specification)
- [SKILL.md Templates](#skillmd-templates)
- [Naming Rules](#naming-rules)
- [Description Best Practices](#description-best-practices)
- [Model Selection Guide](#model-selection-guide)
- [Common Mistakes](#common-mistakes)
- [Modification Best Practices](#modification-best-practices)
- [Example Skills](#example-skills)
- [Supporting Files](#supporting-files)
- [Progressive Disclosure Patterns](#progressive-disclosure-patterns)
- [Token Efficiency Techniques](#token-efficiency-techniques)
- [Anthropic Best Practices](#anthropic-best-practices)
- [Anthropic Workflows & Patterns](#anthropic-workflows--patterns)
- [Script Wrapper Pattern](#script-wrapper-pattern)
- [Instruction Ordering](#instruction-ordering-attention-mechanism-optimization)

---

## Unified Frontmatter Specification

Single source of truth for all skill frontmatter fields.

> Upstream: the portable cross-agent core (`name` + `description` + folder layout) is the open Agent Skills standard at [agentskills.io/specification](https://agentskills.io/specification). The fields below extend it with Claude-Code-specific conventions (`context`, `model`, `hooks`, token budgets) — author to the table here; consult the spec for the portable baseline or fields not covered.

| Field | Required | Values | Description |
|-------|----------|--------|-------------|
| `name` | ✅ | lowercase-hyphens | Skill identifier |
| `description` | ✅ | string (max 1024 chars) | Triggers and use cases |
| `disable-model-invocation` | No | `true`/`false` (default: false) | Opt-out from model auto-invoke; rarely needed since dual-invocable is the default |
| `user-invocable` | No | `true`/`false` (default: true) | Shows in `/` menu |
| `context` | No | `main`/`fork`/`subagent` (default: main) | Execution context mode |
| `agent` | No | agent-type string | Only with `context: subagent` — which agent type to spawn |
| `hooks` | No | `[hook-spec, ...]` | Skill-scoped hooks |
| `allowed-tools` | No | `[Tool1, Tool2, ...]` | Tool restrictions |
| `argument-hint` | No | pattern string | Argument pattern hint |
| `model` | No | `opus`/`sonnet`/`haiku` | Model override (use short names). Almost always set explicitly — 90%+ of skills do |
| `effort` | No | `low`/`medium`/`high`/`xhigh`/`max` (model-dependent) | Reasoning effort while this skill runs; overrides session effort. Precedence: env var > frontmatter > session > model default. **Defer the value choice to `/pick-model`** |

### Frontmatter Patterns

**Auto-invoked capability** (frequent, lightweight):
```yaml
name: detect-conflicts
description: Detects git conflicts and suggests resolution. Use when merge conflicts detected.
```

**Workflow tool** (verbose, progressive disclosure):
```yaml
name: deploy-vercel
description: Deploy to Vercel. Use when "deploy to vercel", "vercel deploy".
argument-hint: [environment]
# Dual-invocable by default: both /deploy-vercel and model auto-invoke work
```

**Isolated heavy analysis**:
```yaml
name: security-audit
description: Deep security analysis across codebase. Use for security audit, vulnerability scan.
context: subagent   # isolated; was `fork` pre-2026-04-23 taxonomy change
model: opus
```

**Parallel fan-out w/ inherited parent context** (v2.1.117+):
```yaml
name: challenge-deep
description: 9-pattern debiasing fan-out.
context: fork   # inherits parent context; N parallel forks (full project ctx, no parent reasoning bias)
model: opus
```

---

## SKILL.md Templates

### Standard Template

```markdown
---
name: skill-name
description: What it does and when to use it. Include file types, keywords, triggers (max 1024 chars)
allowed-tools: [Read, Edit, Bash]  # Optional
model: sonnet  # Optional: haiku|sonnet|opus
context: main  # Optional: main|fork|subagent
---

# Skill Name

Brief overview (1-2 sentences).

## When to Use

- Trigger scenario 1
- Trigger scenario 2
- File types: .ext

## Instructions

1. Step with inline example: `code here`
2. Sub-steps:
   - Detail A
   - Detail B
3. Reference patterns below

## Best Practices

- Key point 1
- Key point 2
- Avoid: common pitfall

## Common Patterns

```bash
# Pattern example
command --flag value
```

### Minimal Template

```markdown
---
name: simple-skill
description: What it does and when to use it
---

# Simple Skill

## Instructions

1. Step one
2. Step two
3. Step three
```

---

## Naming Rules

**Requirements:** lowercase, numbers, hyphens only (max 64 chars), descriptive

| Good ✅ | Bad ❌ | Why |
|---------|--------|-----|
| `api-tester` | `API_Tester` | Uppercase, underscore |
| `pdf-filler` | `pdf filler` | Space |
| `db-migrator` | `general-helper` | Too vague |
| `git-commits` | `document-processor-and-analyzer-tool` | Too long |

---

## Description Best Practices

**Formula:** `[What it does] + [Capabilities] + [When to use] + [File types/keywords]`

| Example | Quality |
|---------|---------|
| "Fill PDF forms, extract text, merge PDFs. Use when working with .pdf files" | ✅ Specific, has triggers |
| "Generate REST API clients from OpenAPI specs. Use for swagger.json, openapi.yaml" | ✅ Clear triggers |
| "Helps with documents" | ❌ Too generic, no triggers |
| "Performs database migrations" | ❌ Missing when/what triggers |

**Requirements:**
- Max 1024 characters
- Include WHAT + WHEN
- Mention file types/keywords
- Specific, not generic

### The description is written for the model, not for a human

The description is the *only* thing Claude sees when deciding whether to consult the skill — it is the entire triggering mechanism. Write it to be matched, not to read nicely.

**Counteract undertriggering.** Claude's default failure mode is to *not* reach for a skill when it would help — it undertriggers far more than it overtriggers. So descriptions should lean slightly **pushy**: spell out the situations, including ones where the user won't name the skill or file type but clearly needs it.

| Timid (undertriggers) | Pushy (triggers reliably) |
|---|---|
| "Builds a dashboard to display internal data." | "Builds a dashboard to display internal data. Use whenever the user mentions dashboards, data visualization, internal metrics, or wants to display any kind of company data — even if they don't say 'dashboard'." |

**Know what won't trigger, no matter how good the description.** Claude only consults a skill for tasks it *can't* already handle in one step. A one-shot request like "read this PDF" won't trigger a skill even on a perfect keyword match, because Claude just does it. So aim the triggers at the *substantive, multi-step* cases where consulting the skill actually changes the outcome — don't burn description budget trying to catch trivial queries.

*(Sources: Anthropic, ["how we use skills"](https://claude.com/blog/lessons-from-building-claude-code-how-we-use-skills); the official `skill-creator` skill, which also ships a script that auto-optimizes a description against ~20 should/shouldn't-trigger queries — reach for it when triggering accuracy really matters.)*

---

See [Token Efficiency Techniques](#token-efficiency-techniques) below for detailed patterns (tables vs prose, inline examples, bullets, Mermaid).

---

## Model & Effort Selection

**Single source of truth: the `/pick-model` skill.** It owns the model+effort doctrine — tiers (Haiku/Sonnet/Opus/Fable), the effort axis (`low`–`max`), the switch-vs-cache cost model, escalators, and the verified roster. Run it for any non-trivial model or effort decision instead of re-deriving here.

### Authoring quick-pick (defaults only — defer to `/pick-model` for the call)

| Set `model:` to… | When |
|---|---|
| `haiku` | You can write exact, deterministic instructions (convert, format, extract, regex, lookup) |
| `sonnet` (default) | Claude must reason — analysis, single-file code, review, content, plumbing |
| `opus` | Strategy, multi-file refactor, architecture, audit — sonnet isn't enough |
| `fable` | Long-running / >200K context / sustained ambiguity (boulder tier) |

- **`effort:`** is a separate lever from `model:` — it tunes reasoning depth and survives prompt cache (cheap to change). Set it when a skill is reliably deeper or shallower than the session default; otherwise omit and inherit. Values are model-dependent — **`/pick-model` picks the value.**
- For agents, prefer `model: inherit` unless the agent needs a fixed tier (e.g. a haiku qualifier inside a council).

### Effort-aware skill bodies — `${CLAUDE_EFFORT}`

Skills can read the dynamic context var **`${CLAUDE_EFFORT}`** (current level: `low`/`medium`/`high`/`xhigh`/`max`) to adapt their instructions to the active effort — e.g. a fuller checklist at `high`, a fast path at `low`. Use it when a single skill should scale its own thoroughness rather than ship two variants.

---

## Common Mistakes

| Issue | Fix |
|-------|-----|
| Skill never activates | Add trigger keywords to description |
| Too broad scope | Split into focused skills |
| Verbose instructions | Use tables, bullets, code blocks |
| Missing frontmatter | Add `---` YAML delimiters |
| Generic description | Specify what + when + file types |
| Wrong tool type | Use triage decision framework |
| Context overload (>1000 tokens) | Refactor to reference.md or change tool type |

---

## Gotchas — the highest-signal section of any skill

Anthropic's own finding from shipping skills: *"The highest-signal content in any skill is the Gotchas section."* The reason is leverage — Claude already knows how to code and can read the codebase, so restating the obvious adds context without adding value. What moves the needle is the specific, non-obvious thing that trips Claude up: a field named `qty` not `quantity`, an API that 200s on failure, a step that must run twice. Those can't be guessed; they're *learned* from watching the skill fail.

**When authoring a skill, budget for a Gotchas section and treat it as the payload, not an afterthought:**

- **Seed it from real failures, not imagination.** Most good skills start as a few lines and *one* gotcha, then grow as Claude hits new edge cases. Don't try to write it all upfront — capture each surprise as it happens.
- **Prefer the surprising over the sensible.** If a reader would guess it, cut it. Keep what would make them say "oh, I wouldn't have known that."
- **Explain the mechanism, not just the rule.** "Batch size must be ≤100 — the API silently drops the rest past that, it doesn't error" beats "use batch size 100". The *why* lets Claude generalize to sibling cases.

This is the counterpart to "don't state the obvious": a skill's value is concentrated in what Claude *wouldn't* do by default. (Source: Anthropic, ["how we use skills"](https://claude.com/blog/lessons-from-building-claude-code-how-we-use-skills).)

---

## Modification Best Practices

### Types

| Type | Action |
|------|--------|
| Add Feature | Add instructions, update description triggers |
| Fix/Improve | Refine instructions, clarify, optimize tokens |
| Refactor | Restructure, update to best practices |
| Scope Change | Update allowed-tools, modify triggers |

### Workflow

1. Locate and read existing SKILL.md
2. Analyze: frontmatter, instructions
3. Make surgical edits (Edit tool, not rewrites)
4. Update description if adding triggers
5. Validate: YAML valid, triggers clear, under token budget

### When NOT to Modify

Ask user first if:
- Breaking changes (v2.0.0)
- Scope changes significantly
- Unsure about impact

Suggest new skill if:
- Purpose fundamentally changes
- New capability is distinct
- Violates single-responsibility

---

## Example Skills

### Good Examples ✅

```yaml
name: xlsx-analyzer
description: Analyze Excel files, extract to CSV, pivot tables, charts. Use for .xlsx, .xls files or spreadsheet analysis.
```

```yaml
name: api-client-gen
description: Generate REST API clients from OpenAPI/Swagger specs. Use for swagger.json, openapi.yaml, or API client requests.
```

```yaml
name: git-workflow
description: Git commits following Conventional Commits (feat, fix, chore, docs). Use when committing or formatting messages.
```

### Bad Examples ❌

```yaml
name: document-helper
description: Helps with documents
# Problem: What documents? What operations? No triggers
```

```yaml
name: code-tools
description: Various code utilities
# Problem: Too vague, multiple capabilities, no triggers
```

```yaml
name: general-assistant
description: Assists with tasks
# Problem: Not specific, violates single-responsibility
```

---

## Supporting Files

For complex skills:
- **reference.md**: Detailed docs, API references
- **examples.md**: Usage examples, patterns
- **templates/**: File templates
- **scripts/**: Utility scripts

Keeps SKILL.md concise while providing depth.

---

## Progressive Disclosure Patterns

Based on Anthropic's official skill-creator guidelines. Skills use a **three-level loading system**:

1. **Metadata (name + description)** - Always in context (~100 words)
2. **SKILL.md body** - When skill triggers (<500 tokens ideal, <1000 max)
3. **Bundled resources** - As needed by Claude (scripts = 0 tokens)

### Pattern 1: High-Level Guide with References

Keep core workflow in SKILL.md, link to detailed resources:

```markdown
# PDF Processing

## Quick start
Extract text with pdfplumber: [code example]

## Advanced features
- **Form filling**: See [forms.md](forms.md) for complete guide
- **API reference**: See [reference.md](reference.md) for all methods
- **Examples**: See [examples.md](examples.md) for patterns
```

Claude loads forms.md, reference.md, or examples.md **only when needed**.

### Pattern 2: Domain-Specific Organization

For skills with multiple domains, organize by domain to avoid loading irrelevant context:

```
bigquery-skill/
├── SKILL.md (overview + navigation)
└── references/
    ├── finance.md (revenue, billing)
    ├── sales.md (pipeline, opportunities)
    ├── product.md (usage, features)
    └── marketing.md (campaigns, attribution)
```

When user asks about sales, Claude only reads `references/sales.md`.

### Pattern 3: Conditional Details

Show basic content, link to advanced:

```markdown
# DOCX Processing

## Creating documents
Use docx-js for new documents. See [docx-js.md](docx-js.md).

## Editing documents
For simple edits, modify XML directly.

**For tracked changes**: See [redlining.md](redlining.md)
**For OOXML details**: See [ooxml.md](ooxml.md)
```

### Important Guidelines

**Avoid deeply nested references**: Keep references one level deep from SKILL.md. All reference files should link directly from SKILL.md.

**Structure longer reference files**: For files >100 lines, include table of contents at top so Claude can see full scope when previewing.

---

## Token Efficiency Techniques

From Anthropic best practices: **"Concise is key. Only add context Claude doesn't already have."**

### Tables vs Prose

❌ **Verbose** (150 tokens):
```markdown
The workflow type can be sequential, which means tasks run one after another in a specific order, or parallel, which means multiple tasks can execute simultaneously without waiting for each other to complete.
```

✅ **Efficient** (30 tokens):
```markdown
| Type | Behavior |
|------|----------|
| Sequential | Run one after another |
| Parallel | Run simultaneously |
```

**Savings: 80%**

### Inline Examples

❌ **Verbose**:
```markdown
Step 1: Create config file

Example:
```yaml
config:
  enabled: true
  timeout: 30
```\
```

✅ **Efficient**:
```markdown
1. Create config: `{enabled: true, timeout: 30}`
```

### Bullets Over Paragraphs

❌ **Prose**:
```markdown
When you encounter an error during processing, you should first check the logs to understand what went wrong, then attempt to fix the issue based on what you find, and if you still cannot resolve it, report the problem to the user.
```

✅ **Bullets**:
```markdown
On error: Check logs → Attempt fix → Report if unfixable
```

### Mermaid for Complex Flows

❌ **Text** (~200 tokens):
```markdown
First check if deterministic. If yes, check if AI needed to decide when/how. If not, use bash script. If yes, check token budget. If less than 500, use skill wrapper...
```

✅ **Mermaid** (~100 tokens):
```mermaid
graph TD
    A[Check] --> B{Deterministic?}
    B -->|Yes| C{AI needed?}
    C -->|No| BASH[Bash Script]
    C -->|Yes| SKILL[Skill Wrapper]
```

**Savings: 50%**

### Front-Load Critical Info

Structure: **Instructions → Best Practices → Background**

Claude reads top-to-bottom. Put essential info first, background/theory last or in reference.md.

---

## Anthropic Best Practices

### Core Principles

1. **Concise is key**: Context window is public good. Default assumption: Claude is already smart.

2. **Set appropriate degrees of freedom**:
   - **High freedom** (text instructions): Multiple valid approaches
   - **Medium freedom** (pseudocode/scripts with params): Preferred pattern exists
   - **Low freedom** (specific scripts): Operations fragile, consistency critical

3. **Progressive disclosure**: Keep SKILL.md <500 lines, split content when approaching limit

### Skill Anatomy

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description - required)
│   └── Markdown instructions (required)
└── Bundled Resources (optional)
    ├── scripts/ - Executable code (0 tokens when executed)
    ├── references/ - Documentation (loaded as needed)
    └── assets/ - Output files (not loaded into context)
```

### What NOT to Include

Do NOT create extraneous documentation:
- ❌ README.md
- ❌ INSTALLATION_GUIDE.md
- ❌ QUICK_REFERENCE.md
- ❌ CHANGELOG.md

Skills are for AI agents, not human documentation.

### Scripts Directory Usage

**When to include scripts/**:
- Same code rewritten repeatedly
- Deterministic reliability needed
- Token efficiency (scripts executed, not loaded)

**Example**: `scripts/rotate_pdf.py` for PDF rotation tasks

**Benefits**:
- 0 token cost (executed, not in context)
- Deterministic behavior
- Reusable across sessions

**Note**: Scripts may still need to be read by Claude for patching or adjustments

### References Directory Usage

**When to include references/**:
- Documentation Claude should reference while working
- Database schemas, API docs, domain knowledge
- Company policies, workflow guides

**Examples**: `references/finance.md`, `references/api_docs.md`

**Best practice**: If files >10k words, include grep search patterns in SKILL.md

**Avoid duplication**: Info should live in SKILL.md OR references/, not both

### Assets Directory Usage

**When to include assets/**:
- Files used in final output (not loaded into context)
- Templates, images, icons, boilerplate code

**Examples**: `assets/logo.png`, `assets/slides.pptx`, `assets/frontend-template/`

**Benefits**: Separates output resources from documentation

---

## Anthropic Workflows & Patterns

### Sequential Workflow Pattern

For complex tasks, give Claude overview of process:

```markdown
Filling a PDF form involves these steps:

1. Analyze the form (run analyze_form.py)
2. Create field mapping (edit fields.json)
3. Validate mapping (run validate_fields.py)
4. Fill the form (run fill_form.py)
5. Verify output (run verify_output.py)
```

### Conditional Workflow Pattern

For branching logic, guide through decision points:

```markdown
1. Determine the modification type:
   **Creating new content?** → Follow "Creation workflow" below
   **Editing existing content?** → Follow "Editing workflow" below

2. Creation workflow: [steps]
3. Editing workflow: [steps]
```

### Template Pattern

**For strict requirements** (API responses, data formats):

```markdown
## Report structure

ALWAYS use this exact template structure:

# [Analysis Title]

## Executive summary
[One-paragraph overview]

## Key findings
- Finding 1 with data
- Finding 2 with data
```

**For flexible guidance** (adaptation useful):

```markdown
## Report structure

Here is a sensible default format, but use your best judgment:

# [Analysis Title]

## Executive summary
[Overview]

## Key findings
[Adapt based on what you discover]

Adjust sections as needed for the specific analysis type.
```

### Examples Pattern

For output quality, provide input/output pairs:

```markdown
## Commit message format

Generate commit messages following these examples:

**Example 1:**
Input: Added user authentication with JWT tokens
Output:
```
feat(auth): implement JWT-based authentication

Add login endpoint and token validation middleware
```

Follow this style: type(scope): brief description, then detailed explanation.
```

---

## Script Wrapper Pattern

When deterministic operations need AI decision-making:

### When to Use

- Scripts exist but AI decides when/how to invoke
- AI needs to generate parameters for scripts
- Part of larger capability that needs context

### Structure

```
skill-name/
├── SKILL.md (when to use scripts, how to interpret output)
└── scripts/
    ├── operation1.py
    ├── operation2.sh
    └── validate.py
```

### Example: PDF Rotator

```markdown
# SKILL.md
---
name: pdf-rotator
description: Rotates PDF pages. Use for .pdf files or rotation requests.
---

# PDF Rotator

## Usage
Determine rotation angle based on user request:
- "rotate clockwise" → 90
- "flip upside down" → 180
- "rotate counterclockwise" → 270

Then run:
```bash
python scripts/rotate.py input.pdf output.pdf --angle [ANGLE]
```

## Output
Script returns success/error. Check output.pdf was created.
```

**Why not bash script alone?**
- AI interprets user intent ("make it upright" → calculate angle)
- AI validates input/output
- Provides user feedback in natural language

---
## Instruction Ordering: Attention Mechanism Optimization

### Problem: The "Validation-First" Anti-Pattern

Most skills bury high-frequency workflows under validation gates:

```
❌ Current pattern (problematic):
1. MANDATORY Validation gate (25-35% of file)
2. Learn what you can do (2-5%)
3. How to do rare action (40% of file)
4. How to do common action (buried at 50-60%)
```

This creates:
- ❌ Only 5-10% of first 30% is actionable
- ❌ Most common task (UPDATE/MODIFY) buried
- ❌ 75-95% longer to reach relevant section

### Solution: Frequency-Ordered Structure

Order sections by **frequency of use**, not by gatekeeping:

```
✅ Recommended pattern:
1. Determine Action Type (100% frequency - everyone sees this)
2. Most Frequent Workflow (MODIFY/UPDATE) (60-80% use)
3. Medium Frequency Workflow (OPTIMIZE) (15-30% use)
4. Least Frequent Workflow (CREATE) (10-25% use)
5. Key Principles (applies to all)
6. Validation Rules (gates, but after action clarity)
7. Advanced Patterns (reference)
8. Checklist (final safety)
```

### Why This Works

| Principle | Benefit |
|-----------|---------|
| **Action Type First** | User understands immediately what's possible (100% frequency) |
| **Frequency Ordering** | Most common path is shortest/fastest to reach |
| **Validation Late** | Gates remain present but don't block understanding |
| **Key Principles Early** | Shared mindset before detailed instructions |
| **Reference Last** | Advanced content doesn't interfere with critical path |
| **Checklist Last** | Final safety net, not gatekeeping |

### Impact

| Metric | Before | After | Gain |
|--------|--------|-------|------|
| First 30% actionable lines | ~5% | ~85% | +1700% |
| Time to UPDATE section (frequent path) | Line 93+ | Line 20 | 75% faster |
| Attention retention in critical path | ~40% | ~80% | +100% |

### Implementation Checklist

When creating skill instructions:

- [ ] **First section**: Determine Action Type (100% users)
- [ ] **Second section**: Most frequent workflow (60%+ users)
- [ ] **Third section**: Medium frequency (30%+ users)
- [ ] **Fourth section**: Least frequent (10%+ users)
- [ ] **Fifth section**: Key Principles (applies to all)
- [ ] **Sixth section**: Validation gates (if needed, after clarity)
- [ ] **Seventh section**: Advanced patterns/reference
- [ ] **Last section**: Validation checklist

### Universal Application

This pattern applies to **ALL instruction sets**, not just skills:

1. "What can you do?" (Action types)
2. "How to do the most common action" (Fastest path)
3. "How to do medium action" (Secondary)
4. "How to do rare action" (Tertiary)
5. "Principles that apply everywhere" (Context)
6. "Guards/validation" (Safety, but not gatekeeping)
7. "Advanced patterns" (Reference)
8. "Safety checklist" (Final)

### Why Anthropic LLMs Benefit

Claude's attention mechanisms show:
- **Recency bias**: Information at end gets 20-30% attention
- **Frequency sensitivity**: Repeated patterns are weighted by frequency
- **Position decay**: Every 20-30 lines loses ~20% attention
- **Purpose clarity**: Understanding purpose early improves instruction following

Reordering by frequency optimizes for how Claude actually processes context.
