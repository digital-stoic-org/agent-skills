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
| 3 | 🧱 **containment (sandbox/deny)** | zero damage — action blocked | `--safe-mode` (or `--bare` carve-out) + `--allowedTools`; PreToolUse deny |
| 4 | 🚨⚙️⚡ **computational sensor, early** | one wasted attempt | pre-commit lint/test, link-check |
| 5 | 🚨🧠 **inferential sensor** | tokens + a judge pass | native `/goal` (judged every turn, auto-retries) · else LLM-judge vs a reference |
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
- **Sandbox the whole run** — `claude -p --safe-mode` + an explicit allow-list (below). The op simply isn't reachable. *(If the run must keep a plugin loaded or authenticates via a 3P provider, use the `--bare` carve-out instead — same containment, different auth path.)*
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

### 6. "Starting a multi-stage agentic pipeline" → 🔗 pipeline harness tier *(gated)*

> **Gate first.** All three or it's not this tier: ① ≥2 **ordered** stages · ② each stage an **isolated agent
> invocation** (own process/context) · ③ a **machine-readable verdict** crosses each seam. One long session
> with phases is NOT a pipeline — that's the one-guardrail default. `/pick-workflow` decides *that* it's N
> stages; this decides *what guards each seam*.
>
> *Sourced from a described cold run (5 sequential `claude -p` stages on Bedrock); patterns transcribed from
> the report, not re-derived from the raw artifacts.*

Three grid points, laid along the pipeline. Not a new axis — a **bundle**.

| # | Component | Grid point | Guards |
|---|---|---|---|
| A | persisted stream-json logs + jq viewer | 🚨 sensor · ⚙️ computational · 🐌 deferred | *every* other verdict, after the fact |
| B | clean-room isolation + auth re-inject | 🧱 containment (+ mandatory auth rider) | ambient-context leakage into the run |
| C | injected protocol + `STAGE_FAIL` exit verdict | 🪧 guide ⏩ + 🚨⚙️ sensor | each seam between stages |

**Layout** — one job per script, ordered by prefix; utilities carry **no** prefix (the number means "a
sequenced rung"). Scripts are executables, so they live in the tracked control plane, **not** under
`.claude/` (that dir is Claude Code config, not a bin). Definition tracked; all generated output + `.env` in
a **non-git run dir**, bridged by one env var — `SK_RUN_DIR`, not symlinks. `SK_RUN_DIR` must be set
*outside* `.env` (the `.env` lives inside the run dir — otherwise it's circular).

```
bin/  10-drive-pipeline.sh   # run the stages in order, collect verdicts
      20-verify-deploy.sh    # assert the result / static-validate
      30-simulate-deploy.sh  # dry-run the deploy; real writes behind --live
      watch-logs.sh          # utility, no prefix — read the logs
sk-test-protocol.md          # the pass/fail contract, injected (below)
$SK_RUN_DIR/{logs/,out/,.env}   # untracked, gitignored, disposable
```

**A — persisted logs + viewer.** Each stage tees to `$SK_RUN_DIR/logs/<stage>.stream-json.log` (persisted,
**never** `mktemp`+`rm` — a post-mortem you can't read is not a post-mortem):

```bash
claude -p ... --output-format stream-json --verbose 2>&1 | tee "$LOGS/$stage.stream-json.log"
```

One jq filter folds the jsonl firehose into a timeline — `init`→🟦, text→💬 (`STAGE_FAIL:`→🛑),
`tool_use`→🔧, `tool_result`→↳✅/❌, `result`→🏁. Bare invocation = per-stage ledger; `-f` = live tail:

```bash
jq -r '
if .type=="system" and .subtype=="init" then
  "🟦 init   model=\(.model // "?")  tools=\(.tools|length)  sid=\((.session_id // "········")[0:8])"
elif .type=="assistant" then
  (.message.content[]? |
    if .type=="text" then
      (.text | split("\n")[] | select(length>0) |
        if startswith("STAGE_FAIL:") then "🛑 \(.)" else "💬 \(.[0:160])" end)
    elif .type=="tool_use" then "🔧 \(.name)  \(.input|tostring|.[0:110])"
    else empty end)
elif .type=="user" then
  (.message.content[]? | select(.type=="tool_result") |
    (if .is_error == true then "   ↳❌ " else "   ↳✅ " end)
    + (.content|tostring|gsub("\n";" ⏎ ")|.[0:110]))
elif .type=="result" then
  "🏁 \(.subtype)  turns=\(.num_turns)  in=\(.usage.input_tokens)  out=\(.usage.output_tokens)  $\(.total_cost_usd)"
else empty end' "$LOGS/$stage.stream-json.log"
```

> ⚠️ **jq gotcha, found by dry-running this filter:** `.is_error // true` is **wrong** — jq's `//` treats
> `false` as empty, so every *clean* stage reads as a crash. Compare explicitly: `.is_error == true`.
>
> ⚠️ **Token accounting.** Per-event `output_tokens` in stream-json is **unreliable** — most events report
> ~5. On the fixture below the per-event sum was **20** against a real **2947**. The **authoritative** figure
> is **`total_cost_usd` on the `result` line**; sum `.message.usage` only for cache-vs-noncache ratios, never
> for billable output. Run-wide cost:
> `jq -s 'map(select(.type=="result").total_cost_usd)|add' logs/*.log`. Mine the logs with jq **aggregates** —
> never load raw log content into a context window.

**B — clean-room + auth re-inject.** The containment combo and its mandatory auth rider are in the sandbox
section below (`--bare --strict-mcp-config --mcp-config "$MCP_NONE" --setting-sources ""` + sourced `.env`).
This is the one place `--bare` is not optional: `--safe-mode` would disable the plugin under test.

**C — protocol injection + `STAGE_FAIL`.** The pass/fail contract lives in **one plain text file** injected
via `--append-system-prompt` — **not** a CWD-auto-loaded `.claude/rules/*.md`, which silently does nothing
once CWD is the run dir. Single source of truth; each stage prompt just points at its row. The protocol must
carry a **token-ceiling stop** ("if a stage heads past ~N tok, STOP and report") and the rule **"PARTIAL is
never reported as SUCCESS."**

A stage signals a *deliberate* stop by emitting a line starting `STAGE_FAIL:`; the driver greps for it and
converts it to an exit code. **Three outcomes, never two** — conflating the first two misreads a working
guardrail as a bug:

| Log signature | Verdict | Meaning |
|---|---|---|
| `subtype:"success"` + no `STAGE_FAIL:` | ✅ **OK** | stage did the job |
| `subtype:"success"` + `STAGE_FAIL:` | 🛑 **STOPPED** | the agent **chose** to stop — the guardrail worked |
| `is_error:true` / `api_error` | 💥 **CRASH** | a real failure |

```bash
run_stage() {                      # in 10-drive-pipeline.sh
  local stage="$1" prompt="$2" log="$SK_RUN_DIR/logs/$stage.stream-json.log"
  claude -p --output-format stream-json --verbose \
    --append-system-prompt "$(cat "$PROTOCOL")" "$prompt" 2>&1 | tee "$log"
  jq -es 'any(.[]; .type=="result" and .is_error == true)' "$log" >/dev/null && return 2   # 💥 crash
  grep -q 'STAGE_FAIL:' "$log" && return 1                                                 # 🛑 deliberate
  return 0                                                                                 # ✅ ok
}
```

## 🚨 Sandbox — `--safe-mode` default, `--bare` carve-out (full detail)

*Verified 2026-07-20, v2.1.215 (headless.md · authentication.md · costs.md). Carve-out verified 2026-07-29,
v2.1.220 — `claude --help` states `--bare` skips keychain reads and CLAUDE.md auto-discovery, but that
"3P providers (Bedrock/Vertex/Foundry) use their own credentials", "Skills still resolve via /skill-name",
and context is re-suppliable via `--add-dir`/`--mcp-config`/`--settings`/`--agents`/`--plugin-dir`.*

| Flag | Auth | Isolation | Plugins/skills | Use |
|---|---|---|---|---|
| `--safe-mode` | ✅ keeps OAuth/keychain (Max login) | cuts custom CLAUDE.md/skills/plugins/hooks/MCP/auto-memory | ⛔ **disabled** | ✅ **default sandbox** |
| `--bare` + OAuth | ❌ keychain never read — **needs `ANTHROPIC_API_KEY`** → **bills a Console workspace, not the Max sub** | max | ✅ `--plugin-dir` kept | ⛔ auth/billing trap |
| `--bare` + **3P** (Bedrock/Vertex/Foundry) | ✅ provider's own creds — **unaffected by `--bare`** | max | ✅ `--plugin-dir` kept | ✅ **carve-out** |
| `--bare` + **plugin under test** | per the row above | max | ✅ the only mode that keeps it | ✅ **carve-out — mandatory** |
| neither | ✅ | none | ✅ | only if the run must **discover hooks** |

**The two carve-outs, stated as a decision:**

1. **Plugin/skill under test.** `--safe-mode` disables plugins — it disables *the thing you're testing*, so the
   run proves nothing. `--bare --plugin-dir <path>` keeps it loaded. There is no third option.
2. **Auth is 3P, not OAuth.** The "needs `ANTHROPIC_API_KEY`" hazard is **Anthropic-direct-specific**. A
   Bedrock run under `--bare` authenticates normally. Don't generalise the OAuth warning past its case.

> 🔑 **Isolation and auth are coupled — the trap that eats an afternoon.** `--setting-sources ""` strips
> `~/.claude/settings.json`, which is frequently *where the 3P auth env lives*. The clean room then kills its
> own oxygen: `apiKeySource:"none"` → "Not logged in", with nothing in the error pointing at the flag that
> caused it. **Fix: source a `.env` inside the run** that re-supplies exactly the auth vars. Sourcing ≠
> exposing — put a **profile name** (SSO) in the file, never a raw key. *Isolate, then hand back exactly what
> you need — no more.*

- `--safe-mode` **does NOT cut `settings.json` permissions**: the personal allow/deny list **merges** across
  scopes. So `--safe-mode` alone ≠ default prompts. For a deterministic drive, pass **`--allowedTools`** (or
  override with `--settings '{"permissions":{...}}'`).
- Both `--bare` and `--safe-mode` **cut hook discovery** — a run that must find `PreToolUse` etc. needs full mode.

### Drive templates

```bash
# DEFAULT — dry-run a scaffolded artifact in isolation, deterministic tool set, on the Max sub:
claude -p --safe-mode --allowedTools "Read,Bash(./link-check.sh:*)" \
  "Run ./link-check.sh on draft.md and report the exit code and any DEAD lines."

# DEFAULT — prescribe as a containment layer around a risky task (no destructive tools reachable):
claude -p --safe-mode --allowedTools "Read,Grep,Glob" "<the task>"

# CARVE-OUT — cold-test a plugin/skill in a clean room, with auth restored.
# `set -a` exports everything the .env defines; the .env carries a PROFILE NAME, not a key.
set -a; . "$SK_RUN_DIR/.env"; set +a      # CLAUDE_CODE_USE_BEDROCK=1 AWS_REGION=… AWS_PROFILE=…
MCP_NONE='{"mcpServers":{}}'              # assign first — an inline literal reads as injection-shaped
claude -p --bare \
  --plugin-dir "$PLUGIN_SRC" \
  --strict-mcp-config --mcp-config "$MCP_NONE" \
  --setting-sources "" \
  --append-system-prompt "$(cat "$PROTOCOL")" \
  --allowedTools "Read,Grep,Glob,Bash(./20-verify-deploy.sh:*)" \
  "<the stage prompt — point at the protocol row that governs it>"
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

**Boundary with `/pick-workflow`** (the pipeline tier sits right on it): `/pick-workflow` decides **that** the
work is N ordered stages and where the seams fall. `/pick-harness` takes that shape as given and decides
**what guards each seam**. An input phrased "should this be a pipeline / fan out?" belongs to the sibling —
hand it over rather than answering it here.

All three: recommend, don't execute the task. `/pick-harness` additionally **scaffolds** the artifact and
**dry-runs** it — in the sandbox mode the rule above selects, or against a synthetic fixture when the
artifact is deterministic (no model call, no auth).
