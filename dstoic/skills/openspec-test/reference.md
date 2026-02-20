# OpenSpec Test Reference

**Note**: This reference documents framework-specific testing patterns for **future specialized skills** (test-pytest, test-jest, test-cargo). The main openspec-test skill is now a generic test.md executor and does not use these patterns directly.

## Framework Detection

Detect test framework from project files:

```yaml
javascript:
  files: [package.json]
  frameworks:
    jest: '"jest"' in dependencies/devDependencies
    vitest: '"vitest"' in dependencies/devDependencies
    mocha: '"mocha"' in dependencies/devDependencies
  default: "npm test"

python:
  files: [pyproject.toml, pytest.ini, setup.py]
  frameworks:
    pytest: pytest.ini exists OR "pytest" in pyproject.toml
    unittest: test_*.py pattern without pytest
  default: "pytest"

rust:
  files: [Cargo.toml]
  default: "cargo test"

go:
  files: [go.mod]
  default: "go test ./..."
```

**Fallback**: If no framework detected, prompt for test command:
```
⚠️ No test framework detected
Project has: {detected config files}

What command runs tests? (or 'skip' to skip automated tests)
```

## Test Layers

```yaml
layers:
  smoke:
    purpose: Basic health checks
    examples: ["app starts", "endpoints respond", "no crash on basic input"]
    auto: true

  integration:
    purpose: Component interactions
    examples: ["API contracts match", "DB state consistent", "error handling"]
    auto: true

  manual:
    purpose: Human-verified critical paths
    examples: ["UI flows", "user journeys", "edge cases needing judgment"]
    auto: false  # Generate instructions only

  pbt:
    purpose: Property-based edge case discovery
    examples: ["invariants hold", "no unexpected states", "boundary conditions"]
    auto: true
    frameworks: [hypothesis, fast-check, proptest]
```

## Test Command Patterns

When running tests, use framework-appropriate commands:

```bash
# Smoke (fast, basic)
npm test -- --grep "smoke"
pytest -m smoke
cargo test --lib

# Integration (slower, thorough)
npm test -- --grep "integration"
pytest -m integration
cargo test --test '*'

# PBT (property-based)
npm test -- --grep "property"
pytest -m "property or hypothesis"
cargo test --features proptest
```

Adapt patterns based on detected framework and existing test structure.

## Manual Test Instructions Template

For manual layer, generate human-executable steps:

```markdown
## Manual Test Instructions: {change-id}

### Test 1: {test name}
**Purpose**: {what this validates}
**Steps**:
1. {step 1}
2. {step 2}
3. {step 3}

**Expected**: {expected outcome}
**Pass criteria**: {what constitutes pass}

---

### Test 2: {test name}
...

---

When complete, report results:
- Test 1: PASS / FAIL (reason)
- Test 2: PASS / FAIL (reason)
```

## Output Formats

### test command
```
🧪 Test Results: {change-id}

Layer      | Status | Details
-----------|--------|--------
Smoke      | ✅/❌   | {count} tests
Integration| ✅/❌   | {count} tests
Manual     | 📋     | {n} instructions generated
PBT        | ✅/⏭️   | {count} tests or "skipped"

Overall: ✅ Ready for gate / ❌ Fix required
```

### layer command
```
🧪 Layer: {layer-name} for {change-id}

Status: ✅/❌
Tests: {passed}/{total}
Details: {summary}
```

### status command (no history)
```
🧪 Test Status: {change-id}

No test runs recorded. Run: /openspec-test test {change-id}
```

### status command (with history)
```
🧪 Test Status: {change-id}

Layer      | Last Run   | Status
-----------|------------|-------
Smoke      | {datetime} | ✅/❌
Integration| {datetime} | ✅/❌
Manual     | pending    | 📋 Awaiting human
PBT        | {datetime} | ✅/⏭️
```

### checkpoint PASS
```
✅ GATE {n}: {description} [PASS]
Smoke: {passed}/{total} tests passed
→ Continue: /openspec-develop section {change-id} {n+1}
```

### checkpoint PARTIAL
```
⚠️ GATE {n}: {description} [PARTIAL]
Smoke: {passed}/{total} tests passed
Failures:
- {test}: {reason}
→ Fix and re-run: /openspec-test checkpoint {change-id} {n}
```

### checkpoint BLOCKED
```
🚫 GATE {n}: {description} [BLOCKED]
Reason: {blocker description}
Options:
→ Fix blocker and retry: /openspec-test checkpoint {change-id} {n}
→ Skip gate: /openspec-develop section {change-id} {n+1}
→ Replan: /openspec-replan {change-id}
```

## Log Formats

### Filename Convention

```
test-logs/gate-{n}-{yyyyMMddHHmm}.yaml   # raw source of truth
test-logs/gate-{n}-{yyyyMMddHHmm}.md     # human summary
```

Timestamp = run start time (UTC). Each run = new file pair. No overwriting.

Examples: `gate-0-202602200145.yaml`, `gate-0-202602200145.md`

### Raw Log Format (YAML — append-per-step)

Write to `openspec/changes/{change-id}/test-logs/gate-{n}-{ts}.yaml`.

**Header** — written once at init (step 4 of workflow):

```yaml
gate: 0
change_id: test-framework-setup
timestamp: "2026-02-20T01:45:00Z"
mode: garage
steps:
```

**Per step** — appended immediately after each step executes:

```yaml
  - id: "0.5"
    description: ANTHROPIC_API_KEY reaches container env
    type: auto
    command: "docker compose -f test/docker-compose.test.yml run skill-tester printenv ANTHROPIC_API_KEY"
    expected: "Non-empty string. Exit code 0."
    stdout: "sk-ant-...riQAA"
    stderr: ""
    exit_code: 0
    duration_s: 3
    result: PASS
    reason: null
```

**Footer** — appended after all steps complete:

```yaml
summary:
  auto: {pass: 4, total: 4}
  smoke: {pass: 0, total: 1, skip: 1}
  manual: {pass: 0, total: 0}
  total_duration_s: 10
result: PASS
```

**Append protocol**: The raw YAML file is the source of truth. Each step is appended with a single Edit/Write call immediately after execution — never batched. This means the file is always current even if the run is interrupted. The summary + result footer are only written after all steps complete (or on interruption with partial results).

**Rules**:
- Full stdout/stderr — no truncation (except mask API keys/tokens: first 7 + last 4 chars)
- Multi-line stdout/stderr: use YAML literal block `|` syntax
- Never overwrite — each run is a new file

### Test Log Format (Markdown — summary)

Write to `openspec/changes/{change-id}/test-logs/gate-{n}-{ts}.md` after all steps complete. Rendered from raw YAML, not memory.

```markdown
# Test Log: GATE {n} — {description}

**Run**: {ISO 8601 timestamp}
**Mode**: {mode} ({layers})
**Result**: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL

## Summary

| Step | Type | Status | Duration |
|------|------|--------|----------|
| {id} | auto | ✅/❌ | {Xs} |
| {id} | smoke | ✅/📋 | {Xs} |
| {id} | manual | ✅/❌/📋 | — |

**Auto**: {pass}/{total} ✅ | **Smoke**: {pass}/{total} 📋 | **Manual**: {pass}/{total} 👤
**Total duration**: {Xs}

---

## {step-id} {description} [{type}]

- **Command**: `{exact command run}`
- **Expected**: {pass criteria from test.md}
- **Stdout**: {first 50 lines, or "(empty)"}
- **Stderr**: {first 20 lines, or "(none)"}
- **Exit code**: {code}
- **Duration**: {Xs}
- **Result**: ✅ PASS / ❌ FAIL — {1-line reason}

---

## Next Action

{If PASS}: → Continue: `/openspec-develop section {change-id} {n+1}`
{If PARTIAL}: → Fix failures, re-run: `/openspec-test checkpoint {change-id} {n}`
{If BLOCKED}: → Resolve blocker: {specific instruction}
```

Markdown truncation: stdout >50 lines → first 30 + last 10; stderr >20 lines → first 15.

## Test Progression Strategy

Mandatory first: smoke tests (basic sanity, < 5s). Then risk-based progression:

1. **Smoke** — app starts, no crashes (mandatory)
2. **Unit** — functions in isolation (< 10s)
3. **Integration** — components interact (< 30s)
4. **E2E** — full user flows (> 30s)

Garage mode can stop after smoke. Scale mode runs all. test.md MUST start with smoke tests, ordered fast→slow.

## Execution Tracing

### Per-Step Capture Protocol

For every `[auto]` and `[smoke]` step:
1. Execute command
2. Capture stdout, stderr, exit code, duration
3. Evaluate result (PASS/FAIL/SKIP)
4. **Immediately append** step YAML block to raw log file (see §Raw Log Format)

This ensures the raw log is always current — even if the run is interrupted mid-gate.

**Masking rules** (applied before writing):
- API keys/tokens → `sk-ant-...xxxx` (first 7 + last 4 chars)

**Truncation rules** (markdown summary only — raw YAML keeps full output):
- stdout >50 lines → first 30 + `\n... ({N} lines omitted)\n` + last 10
- stderr >20 lines → first 15 + `\n... ({N} lines omitted)\n`
- Single lines >500 chars → first 200 + `...` + last 50

### Failure Diagnostics

When a step fails, include diagnostic context:

```markdown
- **Result**: ❌ FAIL — exit code 1 (expected 0)
- **Diagnostic**: stderr shows "Read-only file system" — mount flag :ro is applied but command expected write access
- **Fix hint**: Check if test expectation matches. Step expects non-zero exit for read-only validation.
```

**Diagnostic heuristic**:
- Exit code mismatch → report expected vs actual
- Stderr contains error → extract first error line
- Timeout → report command duration vs expected
- Empty stdout when output expected → flag as "no output produced"

## Error Handling

### Test failure
```
❌ Layer failed: {layer-name}

Failed tests:
- {test 1}: {reason}
- {test 2}: {reason}

Fix the failures before proceeding. Re-run: /openspec-test layer {change-id} {layer}
```

### No tests found
```
⚠️ No tests found for layer: {layer-name}

This could mean:
1. Tests not yet written for this change
2. Test naming convention doesn't match expected pattern

Options:
- Write tests matching convention
- Skip layer with: /openspec-test layer {change-id} {next-layer}
```
