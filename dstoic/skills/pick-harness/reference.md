# Pick Harness — reference

Detail behind `SKILL.md`. Load when running a real diagnosis, scaffolding an artifact, or driving a sandbox.

## The grid, in full

Each guardrail is a **point** in a 4-dimensional space (+ the orthogonal containment escape). You are not
choosing a category — you are locating the failure, then picking the earliest-catching point that fits it.

```
Role      🪧 guide  ─────────────  🚨 sensor
Nature    ⚙️ computational ──────  🧠 inferential
Timing    ⏩ feedforward ────────  ⏪ feedback
Latency   ⚡ immediate ──────────  🐌 deferred
                    🧱 containment  (off-grid: makes it impossible)
```

**Latency ladder** — the order to *reach for* catches, earliest first:

| Rank | Catch | Cost of a miss | Example |
|---|---|---|---|
| 1 | 🧱 **unrepresentable** (type/schema) | zero — it can't be written | `newtype Seconds ≠ Millis` |
| 2 | ⏩⚡ **feedforward guide** | cheap — steers before acting | a rule the agent reads first |
| 3 | 🧱 **containment (sandbox/deny)** | zero damage — action blocked | `--safe-mode` + `--allowedTools`; PreToolUse deny |
| 4 | 🚨⚙️⚡ **computational sensor, early** | one wasted attempt | pre-commit lint/test, link-check |
| 5 | 🚨🧠 **inferential sensor** | tokens + a judge pass | LLM-judge vs a reference |
| 6 | 🧑 **human review** | your attention | PR review |
| 7 | 🚨🐌 **pipeline / E2E, late** | full run wasted | `agent-browser` on the render, post-integration judge |

> Prescribe the **lowest rank that actually fits** the failure. Don't reach for rank 5 when rank 1 is available;
> don't pretend rank 1 fits when the failure is genuinely semantic (then rank 4–5 is honest).

## Diagnosis — the four questions, in order

1. **Can it be made unrepresentable?** If the bad state simply can't exist (a distinct type, a schema that
   rejects it, a permission that isn't granted) → 🧱 containment. Earliest catch there is. Stop here if yes.
2. **Preventable before the agent acts?** A rule/context that changes the first attempt → ⏩ feedforward 🪧 guide.
   Only observable after output exists → ⏪ feedback 🚨 sensor.
3. **Deterministic or semantic?** A rule/regex/exit-code can decide → ⚙️ computational. Needs judgment
   ("is this on-voice?", "is this argument sound?") → 🧠 inferential (an LLM judges).
4. **How early can the sensor fire?** Prefer ⚡ (pre-commit / pre-tool) over 🐌 (post-integration). Same verdict,
   fewer tokens burned before the catch.

The axes **interact** — that's why this is one indivisible judgment, not four independent lookups. A voice
drift is feedback + inferential + late; a wrong-unit bug is best erased at rank 1, not sensed at rank 4.

## Worked examples — one per failure class

### 1. "Research agent cites dead links" → 🚨⚙️⏪ computational sensor (early)
Deterministic (a URL either resolves or doesn't — no judgment), only detectable after the draft exists
(feedback), but catchable ⚡ before you ship. Rank 4.

```bash
#!/usr/bin/env bash
# link-check.sh — exit 1 if any cited URL is dead. Wire as pre-publish / hook.
set -euo pipefail
fail=0
grep -oE 'https?://[^ )"]+' "$1" | sort -u | while read -r url; do
  code=$(curl -s -o /dev/null -w '%{http_code}' -m 10 -L "$url" || echo 000)
  [[ "$code" =~ ^(2|3) ]] || { echo "DEAD $code  $url"; fail=1; }
done
exit $fail
```

### 2. "Draft drifts off the brand voice" → 🚨🧠⏪ inferential sensor
Semantic — no regex decides "on-voice"; a judge does. Feedback (needs output to grade). Rank 5. Grade
against the project's own reference so the verdict is grounded, not vibes.

```
You are a voice sensor. Reference = <project>/ref/tone-guide.md (voice-constant rules).
Grade the DRAFT below. Output JSON only:
{ "verdict": "pass" | "fail",
  "violations": [{ "quote": "...", "rule_broken": "...", "fix": "..." }] }
Fail if any voice-constant rule is broken. Do not rewrite; only judge + cite.
DRAFT: """<paste>"""
```

### 3. "Wrong timestamp unit (Seconds vs Millis)" → 🧱 containment via unrepresentability
The gold case. Don't *sense* the bug — make it **not compile**. Rank 1, free forever.

```rust
// Before: both are i64 → interchangeable → the bug is writable.
// After: two distinct types → mixing them is a compile error.
struct Seconds(i64);
struct Millis(i64);
// fn expires_at(now: Seconds, ttl: Millis) -> Seconds { ... }  // ← won't compile: units can't mix
```
(Non-Rust: a branded type / Zod-schema / value object does the same — the point is *distinctness*.)

### 4. "Agent runs a destructive/irreversible op" → 🧱 containment via sandbox or deny
Two routes; both rank 3.
- **Sandbox the whole run** — `claude -p --safe-mode` + an explicit allow-list (below). The op simply isn't reachable.
- **Deny the specific op** — a `PreToolUse` hook that blocks the tool call before it fires.

```json
// settings.json — PreToolUse deny for an irreversible shell op
{ "hooks": { "PreToolUse": [ {
  "matcher": "Bash",
  "hooks": [ { "type": "command",
    "command": "grep -qE '\\brm -rf\\b|--force|DROP TABLE' && echo '{\"decision\":\"block\",\"reason\":\"destructive op blocked\"}' || true" } ] } ] } }
```

### 5. "The app renders wrong / a change regresses what the UI shows" → 🚨🐌⏪ E2E sensor on the render
The computed value can be right while the *rendered* output is broken (a green-but-wrong UI). No unit test
sees the render; you need a sensor on what the app actually shows. Deferred (post-integration), inferential-
or-computational depending on the assertion. Rank 7 — the latest catch, justified only because nothing
earlier can observe the rendered surface. Freeze the render with `agent-browser` (headless-Chrome CLI):

```bash
# e2e-render.sh — drive the live app, assert on what's on screen. Exit 1 on regression.
# Primary: Vercel `agent-browser`. Fallback: `claude-in-chrome`, or a Playwright script.
set -euo pipefail
agent-browser run \
  --url "http://localhost:3000/dashboard" \
  --assert "text:'Uptime 99.9%'" \
  --assert "no-console-errors" \
  --screenshot ./e2e/dashboard.png
# → non-zero exit = the rendered surface regressed; wire into the pipeline stage.
```
Availability check first: `command -v agent-browser`. If absent, scaffold the `claude-in-chrome` drive or a
minimal Playwright `expect(page.getByText(...)).toBeVisible()` equivalent — same sensor, different engine.

## 🚨 Sandbox — `--safe-mode`, never `--bare` (full detail)

*Verified 2026-07-20, Claude Code v2.1.215 (headless.md · authentication.md · costs.md).*

| Flag | Auth | Isolation | Billing | Use |
|---|---|---|---|---|
| `--bare` | ❌ ignores OAuth/keychain — **needs `ANTHROPIC_API_KEY`** | max | **Console workspace** (not Max sub) | ⛔ avoid — auth/billing trap |
| `--safe-mode` | ✅ keeps OAuth/keychain (Max login) | cuts custom CLAUDE.md/skills/plugins/hooks/MCP/auto-memory | Max sub, zero setup | ✅ **default sandbox** |
| neither | ✅ | none | Max sub | only if the run must **discover hooks** |

- `--bare`'s only edge over `--safe-mode` is startup speed — not worth losing auth + correct billing.
- `--safe-mode` **does NOT cut `settings.json` permissions**: the personal allow/deny list **merges** across
  scopes. So `--safe-mode` alone ≠ default prompts. For a deterministic drive, pass **`--allowedTools`** (or
  override with `--settings '{"permissions":{...}}'`).
- Both `--bare` and `--safe-mode` **cut hook discovery** — a run that must find `PreToolUse` etc. needs full mode.

### Drive templates

```bash
# Dry-run a scaffolded artifact in isolation, deterministic tool set, on the Max sub:
claude -p --safe-mode --allowedTools "Read,Bash(./link-check.sh:*)" \
  "Run ./link-check.sh on draft.md and report the exit code and any DEAD lines."

# Prescribe as a containment layer around a risky task (no destructive tools reachable):
claude -p --safe-mode --allowedTools "Read,Grep,Glob" "<the task>"
```

## Runtime topology (fixed — do not re-derive)

Linear, single-context, Opus-high. The diagnosis is **one indivisible cross-axis judgment**: the four axes
interact, so sharding onto workers would let each see a slice of a global call (the #1 `/pick-workflow`
anti-pattern). The only fan-out-able step is scaffolding **multiple** artifacts — rare, because the thesis is
*minimal = one guardrail*. If an `--audit` mode ("map my whole harness surface, find every gap") is ever
added, that IS a fan-out shape (per-surface scan → orchestrator synthesis) — a separate Workflow-gated path
with a linear fallback, never this skill's default.

## Relation to siblings

| Skill | Picks | Question |
|---|---|---|
| `/pick-model` | model + effort | *which brain* runs a step |
| `/pick-workflow` | execution topology | *how steps run* (linear / fan-out / Workflow) |
| **`/pick-harness`** | **guardrail** | *what catches the failure* — and scaffolds it |

All three: recommend, don't execute the task. `/pick-harness` additionally **scaffolds** the artifact and
**dry-runs** it in `--safe-mode`.
