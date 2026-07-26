---
name: pick-harness
description: "Diagnose an agent FAILURE and prescribe the cheapest/earliest guardrail to add NEXT — then scaffold it ready to paste. Craft-on-the-fly, friction-driven, minimal: grow a harness to fit the real failure mode instead of designing one upfront. Sibling of /pick-model (picks the model) and /pick-workflow (picks the topology); this picks the GUARDRAIL. Domain-general — any agentic task, not just code. Use when 'agent keeps failing at X', 'it hallucinated/broke the contract/wasted tokens', 'what guardrail do I add', 'harness for X', 'how do I stop it doing Y', or when starting a new agentic task and you want a minimal starter harness. Recommends + scaffolds; does NOT run the task."
argument-hint: "<task 'starting X' | friction 'X keeps failing'>"
allowed-tools: [Read, Glob, Grep, Bash, AskUserQuestion, Skill]
model: opus
effort: high
context: main
user-invocable: true
---

# Pick Harness

Friction-driven judge for **which guardrail to add next** — then scaffolds it. Sibling of `/pick-model` (the model) and `/pick-workflow` (the topology). Grows a harness one guardrail at a time to fit the *real* failure; never designs a full harness upfront. **When**: an agent keeps failing at X · you want to stop it doing Y · you're starting a task and want a minimal starter set.

> Extends the repo's `HARNESS-ENGINEERING.md` (Böckeler/Fowler guides⏩ vs sensors⏪, computational⚙️ vs inferential🧠) with 2 axes (latency, timing) + `🧱 containment`. Single source of truth for the *which-guardrail* call — don't re-derive the grid elsewhere. Worked examples, sandbox detail, drive-templates → `reference.md`.

## Decision grid — 4 axes + 1 orthogonal

| Axis | Ask | Values |
|---|---|---|
| **Role** | Orient or inspect? | 🪧 **guide** (persuades, bypassable) · 🚨 **sensor** (observes, returns a verdict) |
| **Nature** | Deterministic or judgment? | ⚙️ **computational** (code/regex/exit code) · 🧠 **inferential** (an LLM judges) |
| **Timing** | Before or after damage? | ⏩ **feedforward** (preventive) · ⏪ **feedback** (corrective) |
| **Latency** | Tokens burned before the catch? | ⚡ **immediate** (before generation) · 🐌 **deferred** (after the fact) |
| 🧱 **Containment** *(orthogonal)* | — | Makes the action **impossible**. Neither guides nor inspects — the 4 questions don't apply. |

**Feedback ladder (by latency):** self-correction⚡ (test/lint, pre-commit) → human-review🧑 (at the PR) → pipeline🐌 (E2E agent-browser / LLM-judge, post-integration).

> **CORE PRINCIPLE — classify by LATENCY, not sophistication.** Prescribe the **earliest catch that fits**, not the fanciest. The best sensor makes the bug **unrepresentable** (`newtype Seconds ≠ Millis` → a whole bug class becomes a compile error, free forever). A cheap ⚡ guard beats a clever 🐌 one.

## Flow — diagnose → prescribe → scaffold

1. **Classify input.** Friction ("X keeps failing") → the **ONE** next guardrail *(default)*. Task ("starting X") → a **minimal starter set** (≈1 feedforward guide + 1 containment), not a full harness.
2. **Diagnose** — reason across all 4 axes *at once* (they interact): preventable before the act → ⏩guide, else ⏪sensor · a rule/regex/exit-code decides → ⚙️computational, else semantic → 🧠inferential · can it be made **impossible/unrepresentable**? → 🧱 containment (type/schema/sandbox/permission-deny), the earliest catch there is — prefer it when available.
3. **Prescribe** one grid point + **honest latency/cost rationale**: why this catch-point, not an earlier (impossible?) or later (wastes tokens?) one.
4. **Scaffold** the artifact, then **self-check**: dry-run it in `claude -p --safe-mode` (rule below), report whether it fires on the failing case.

| Prescribed | Scaffold |
|---|---|
| 🪧 feedforward guide | **rule text block** (`.claude/rules/*.md` / CLAUDE.md stanza / SKILL directive) |
| 🚨⚙️ computational sensor | **hook script** / check command (exit-code = verdict) |
| 🚨🧠 inferential sensor | **`/goal <condition>`** (built-in, v2.1.139+) when the condition is **verifiable from the transcript** — judge AND retry loop, zero scaffolding. Hand-rolled **LLM-judge prompt** graded vs a reference (e.g. `ref/tone-guide.md`) only when the verdict must be **cited/graded** or fired **outside a turn boundary**. |
| 🧱 containment (unrepresentable) | **newtype / schema** — bad state won't compile / won't validate |
| 🧱 containment (sandbox) | **`claude -p --safe-mode` wrapper** + explicit `--allowedTools` (rule below) |
| 🚨🐌 E2E sensor *(on the render)* | **`agent-browser` drive-script** — headless-Chrome CLI freezing what the app *shows*, not what it computes; asserts on the live render *(Vercel `agent-browser`; fallback `claude-in-chrome` or Playwright)* |

## 🚨 Sandbox rule — `--safe-mode`, NEVER `--bare`

Every sandbox this skill spins up — to dry-run a scaffold, or as a prescribed 🧱 containment — MUST use `claude -p --safe-mode`. **Never `--bare`.**

- ❌ `--bare` **ignores OAuth/keychain** → **requires `ANTHROPIC_API_KEY`** → fails to auth, or **silently bills a Console workspace, not the Max sub**. Only buys faster startup.
- ✅ `--safe-mode` = **same isolation** (cuts custom CLAUDE.md/skills/plugins/hooks/MCP/auto-memory) **+ keeps the Max login**, zero setup.
- ⚠️ It still **merges `settings.json` permissions** (allow-list leaks) — for a deterministic drive pass explicit **`--allowedTools`**, don't rely on default prompts.
- Full mode (neither flag) only to **discover hooks** — both flags cut hook discovery.

_Verified 2026-07-20, Claude Code v2.1.215._

## Output

**Diagnosis** (which axis fails, why) → **Prescription** (the ONE component / starter set + latency-cost rationale) → **Scaffold** (ready to paste) → **Self-check** (`--safe-mode` dry-run: did it catch the failing case?).

## Anti-patterns

- ❌ The **fanciest** sensor (LLM-judge) when a ⚡ computational check or 🧱 type catches it earlier and free — latency, not sophistication.
- ❌ A **full harness upfront** — grow it one guardrail at a time from real friction.
- ❌ **`--bare`** for any sandbox — auth/billing trap. Always `--safe-mode` + `--allowedTools`.
- ❌ **Fanning out** the diagnosis — it's ONE indivisible cross-axis judgment; a sharded worker sees a slice of a global call. Runs **linear, single-context, Opus** (scaffolding >1 artifact is the only fan-out-able step, and minimal thesis ⇒ usually one).
- ❌ A **feedback🐌** guard where **feedforward⏩** was available — catching after the tokens are spent.
- ❌ Scaffolding but **not dry-running** — an untested guard is a guess.
