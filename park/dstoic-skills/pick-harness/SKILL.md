---
name: pick-harness
description: "Diagnose an agent FAILURE and prescribe the cheapest/earliest guardrail to add NEXT — then scaffold it ready to paste. Craft-on-the-fly, friction-driven, minimal: grow a harness to fit the real failure mode instead of designing one upfront. Sibling of /pick-model (picks the model) and /pick-workflow (picks the topology); this picks the GUARDRAIL. Domain-general — any agentic task, not just code. Use when 'agent keeps failing at X', 'it hallucinated/broke the contract/wasted tokens', 'what guardrail do I add', 'harness for X', 'how do I stop it doing Y', or when starting a new agentic task and you want a minimal starter harness. Also has a gated 'pipeline harness' tier for multi-stage agent pipelines (logs+verdicts+clean-room). Recommends + scaffolds; does NOT run the task."
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
4. **Scaffold** the artifact, then **self-check**: dry-run it in the sandbox mode the rule below selects (`--safe-mode` unless a carve-out applies), report whether it fires on the failing case. A deterministic artifact (script/filter) dry-runs against a **synthetic fixture** — no model call, no auth needed.

| Prescribed | Scaffold |
|---|---|
| 🪧 feedforward guide | **rule text block** (`.claude/rules/*.md` / CLAUDE.md stanza / SKILL directive) |
| 🚨⚙️ computational sensor | **hook script** / check command (exit-code = verdict) |
| 🚨🧠 inferential sensor | **`/goal <condition>`** (built-in, v2.1.139+) when the condition is **verifiable from the transcript** — judge AND retry loop, zero scaffolding. Hand-rolled **LLM-judge prompt** graded vs a reference (e.g. `ref/tone-guide.md`) only when the verdict must be **cited/graded** or fired **outside a turn boundary**. |
| 🧱 containment (unrepresentable) | **newtype / schema** — bad state won't compile / won't validate |
| 🧱 containment (sandbox) | **`claude -p` wrapper** + explicit `--allowedTools` — `--safe-mode` by default, `--bare` in the two carve-out cases (rule below) |
| 🚨🐌 E2E sensor *(on the render)* | **`agent-browser` drive-script** — headless-Chrome CLI freezing what the app *shows*, not what it computes; asserts on the live render *(Vercel `agent-browser`; fallback `claude-in-chrome` or Playwright)* |
| 🔗 **pipeline harness** *(gated — see below)* | a **bundle** of the above arranged along a sequenced pipeline: persisted stream-json logs + jq viewer (🚨🐌⚙️) · clean-room + auth re-inject (🧱) · injected protocol (🪧) + `STAGE_FAIL` exit verdict (🚨⚙️). Templates → `reference.md` |

> **Pipeline-tier gate — all three must hold**, else fall back to the one-guardrail default: ① **≥2 ordered stages** · ② each stage an **isolated agent invocation** (own context/process, not a turn in one session) · ③ a **machine-readable verdict** must cross each seam. It is a *bundle of existing grid points laid along a pipeline* — **not a new axis**, and not a fan-out of the diagnosis.
> **Boundary:** `/pick-workflow` decides **that** the work is N ordered stages; `/pick-harness` decides **what guards each seam**. "Should this be a pipeline?" → wrong skill.

## 🚨 Sandbox rule — `--safe-mode` by default, `--bare` where it's the ONLY thing that works

Every sandbox this skill spins up — to dry-run a scaffold, or as a prescribed 🧱 containment — is a **deliberate choice** between two isolation modes. Not a prohibition.

| Situation | Mode |
|---|---|
| **Default** — dry-run a scaffold · containment around a risky task | ✅ `--safe-mode` + explicit `--allowedTools` |
| The run must keep a **`--plugin-dir` plugin/skill ACTIVE** (you're testing it) | ⚠️ **`--bare` required** — `--safe-mode` disables plugins/skills, i.e. the thing under test |
| Auth is **Bedrock/Vertex/Foundry**, not OAuth | ⚠️ **`--bare` safe** — 3P providers use their own credentials |

- ❌ `--bare` on an **OAuth/Max login**: keychain is never read → needs `ANTHROPIC_API_KEY` → fails to auth, or **silently bills a Console workspace, not the Max sub**. The original warning stands — **for this case only**.
- 🔑 **Isolation and auth are coupled.** `--setting-sources ""` strips `~/.claude/settings.json`, often where the 3P auth env lives → the clean room silently kills its own auth (`apiKeySource:"none"` → "Not logged in"). **Re-inject it: source a `.env` inside the run** (`CLAUDE_CODE_USE_BEDROCK`/`AWS_REGION`/`AWS_PROFILE`). Sourcing ≠ exposing — use a **profile name** (SSO), never a raw key. *Isolate, then hand back exactly what you need.*
- ⚠️ `--safe-mode` still **merges `settings.json` permissions** (allow-list leaks) — for a deterministic drive pass explicit **`--allowedTools`**, don't rely on default prompts.
- Full mode (neither flag) only to **discover hooks** — both flags cut hook discovery.

_Verified 2026-07-20, v2.1.215 · carve-out verified 2026-07-29, v2.1.220 (`claude --help`: "3P providers (Bedrock/Vertex/Foundry) use their own credentials" · "Skills still resolve via /skill-name … Explicitly provide context via: … `--plugin-dir`")._

## Output

**Diagnosis** (which axis fails, why) → **Prescription** (the ONE component / starter set + latency-cost rationale) → **Scaffold** (ready to paste) → **Self-check** (dry-run in the selected sandbox mode, or against a fixture: did it catch the failing case?).

## Anti-patterns

- ❌ The **fanciest** sensor (LLM-judge) when a ⚡ computational check or 🧱 type catches it earlier and free — latency, not sophistication.
- ❌ A **full harness upfront** — grow it one guardrail at a time from real friction.
- ❌ **`--bare` on an OAuth/Max login** — auth/billing trap. Default to `--safe-mode` + `--allowedTools`; reach for `--bare` only in the two carve-out cases (plugin-under-test, 3P auth) — and then **restore the stripped auth**.
- ❌ **`--safe-mode` to test a plugin/skill** — it disables plugins, so it disables the thing under test; the run proves nothing.
- ❌ **Fanning out** the diagnosis — it's ONE indivisible cross-axis judgment; a sharded worker sees a slice of a global call. Runs **linear, single-context, Opus** (scaffolding >1 artifact is the only fan-out-able step, and minimal thesis ⇒ usually one).
- ❌ A **feedback🐌** guard where **feedforward⏩** was available — catching after the tokens are spent.
- ❌ Scaffolding but **not dry-running** — an untested guard is a guess.
