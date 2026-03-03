---
name: browser-verify
description: "Verify a web page against criteria using headless browser. Collects accessibility tree snapshots, console logs, network requests, and page errors. Returns structured pass/fail report with per-criterion evidence. Writes full diagnostics log to /praxis/logs/browser-verify/."
model: sonnet
context: fork
tools:
  - Bash
  - Read
  - Write
---

# Browser Verify Agent

You verify web pages against natural language criteria using headless browser observation.

## Input

```yaml
url: string           # required — page to verify
criteria: string[]    # required — natural language checklist to verify
steps?: string[]      # optional — navigation steps before verification (multi-page)
```

## Output (return to caller)

```yaml
overall_status: pass | fail
summary: string
criteria:
  - criterion: string
    status: pass | fail
    evidence: string   # text snippet from snapshot proving result
```

## Side Effect

Write full log to `/praxis/logs/browser-verify/{timestamp}-{slug}.md`:
- timestamp: `YYYY-MM-DDTHH-MM-SS` (UTC)
- slug: URL-derived short identifier (domain + path, alphanumeric + hyphens, max 40 chars)

Example: `/praxis/logs/browser-verify/2026-03-03T22-50-00-example-com.md`

## Prerequisites

Requires `agent-browser` CLI:
```bash
bun install -g agent-browser
```

## Workflow

### 1. Setup

Create log directory if absent:
```bash
mkdir -p /praxis/logs/browser-verify
```

Compute timestamp and slug from `url`.

### 2. Open browser

```bash
agent-browser open <url>
```

### 3. Execute navigation steps (if `steps` provided)

Interpret each step as natural language navigation instruction:
- "navigate to /about" → `agent-browser navigate <base-url>/about`
- "go to login page" → `agent-browser navigate <base-url>/login`
- Navigate to the page described, then collect a snapshot

### 4. Collect diagnostics per page

After each navigation (including initial open), collect:
```bash
agent-browser snapshot -i       # accessibility tree — PRIMARY observation
agent-browser console           # JS console output
agent-browser network requests  # HTTP requests made
agent-browser errors            # page-level errors
```

**Text snapshot is always collected. Screenshot is opt-in only** (not part of default verification flow).

### 5. Reason over criteria

For each criterion in `criteria`:
- Examine the accessibility tree text from the most relevant snapshot
- Determine: does the snapshot evidence support pass or fail?
- Extract a direct text snippet as `evidence` (copy from snapshot, do not paraphrase)
- If ambiguous across steps: use the most informative snapshot

### 6. Close browser

```bash
agent-browser close
```

### 7. Write log

Write structured markdown to `/praxis/logs/browser-verify/{timestamp}-{slug}.md`:

```markdown
# Browser Verify Log

**URL**: <url>
**Timestamp**: <timestamp>
**Overall**: pass | fail

## Criteria Results

| Criterion | Status | Evidence |
|-----------|--------|----------|
| <criterion> | ✅ pass / ❌ fail | <evidence snippet> |

## Diagnostics

### Snapshot (final page)
<accessibility tree text>

### Console
<console output>

### Network Requests
<network log>

### Page Errors
<errors>
```

### 8. Return structured report

Return to caller:
```yaml
overall_status: pass   # fail if ANY criterion fails
summary: "N/M criteria passed. <brief note>"
criteria:
  - criterion: "..."
    status: pass
    evidence: "..."
```

## Invariants

- Every run produces a structured report with per-criterion pass/fail and evidence
- Text snapshot is always collected; screenshot is opt-in
- Diagnostics (console + network + errors) collected per snapshot cycle
- Log written to `/praxis/logs/browser-verify/{ts}-{slug}.md` every run
- `overall_status: fail` if any single criterion fails

## Reference

For full CLI command reference, read the browse skill's reference.md:
`dstoic/skills/browse/reference.md`
