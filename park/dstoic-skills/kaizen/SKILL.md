---
name: kaizen
description: Capture friction with any Praxis artifact (skill, CLAUDE.md, rule, workflow) in under 30 seconds. Use when user says "kaizen", "log friction", "this annoyed me", or invokes `/kaizen <target> <note>`. One-shot append to `/praxis/thinking/kaizen/<target>.jsonl` — no editor, no follow-up questions, no context switch. Friction signal (fix existing), distinct from lazy skills (build new).
model: sonnet
allowed-tools: [Bash]
---

# Kaizen — Friction Capture

One-shot friction log. Capture, confirm, resume. Speed is the point.

## Usage

```
/kaizen <target> <note>
```

Both required. If either missing → respond `⚠️ Usage: /kaizen <target> <note>` and stop.

## Behavior

Single Bash call. Slugify target (lowercase, ` ./` → `-`), append one JSON line, count, respond:

```bash
SLUG=$(echo "<target>" | tr '[:upper:]' '[:lower:]' | tr ' ./' '---')
DIR=/praxis/thinking/kaizen
mkdir -p "$DIR"
FILE="$DIR/$SLUG.jsonl"
NOTE_JSON=$(printf '%s' "<note>" | python3 -c 'import json,sys;print(json.dumps(sys.stdin.read()))')
printf '{"ts":"%s","cwd":"%s","note":%s}\n' "$(date -Iseconds)" "$(pwd)" "$NOTE_JSON" >> "$FILE"
wc -l < "$FILE"
```

Then respond: `🏷 kaizen:<target> logged (total: N) — thanks` and **resume prior conversation immediately**. No commentary, no analysis, no reformulation.

Use `python3 json.dumps` for escaping — never hand-roll JSON.

## Reserved targets

| Target | Meaning |
|---|---|
| `praxis` | Top-level meta (workflow, methodology, portfolio) |
| `claude.md` | Instruction drift in any CLAUDE.md. All levels collapse to `claude-md.jsonl`; disambiguate via `cwd` field at review time |
| `self` | Note to future-self about personal workflow habits (distinct from `introspect/self.md` identity profile) |
| `<skill-name>` | Friction with a specific skill — use real name, not `lazy-*` prefix |

Free-form otherwise; conventions unenforced.

## Examples

```
/kaizen troubleshoot "asks same diagnostic twice in a row"
/kaizen claude.md "git commit rules ambiguous on scope field"
/kaizen convert-pdf "OCR re-runs on cached pages"
/kaizen convert-pdf "VLM mode is great for scanned docs"
/kaizen self "forgot to check benchmarks/inventory.yaml before starting"
```

Praise and friction share the bucket — natural language carries the sign. No `type` field, no `--priority`, no `--undo`, no auto-dedupe (repeats = valid intensity signal). Manual jsonl edit if needed.

## Key rules

- **Note required.** Missing note = useless for clustering.
- **After-only.** Works after a skill returns, not mid-skill.
- **Verbatim storage.** No cleanup, categorization, or reformulation.
- **One-line response.** Never comment on note content. Resume immediately.
