---
name: save-context
description: Save session to CONTEXT-llm.md with conversation summary. Use when saving work, checkpointing progress, preserving session state. Triggers include "save context", "save session", "checkpoint", "save my progress".
argument-hint: "[stream-name] [--as <role>] [description]"
allowed-tools: [Bash, Read, Write, Edit, AskUserQuestion]
model: sonnet
context: main
user-invocable: true
---

# Save Context

Save current session state to `CONTEXT-{stream}-llm.md` with LLM-optimized format.

**Target**: 2500-3000 tokens MAX | **Speed**: 3-5 seconds
*(Not a throwaway summary: the working memory of a multi-session stream, holding accumulating per-role lines.)*

## ⚠️ AskUserQuestion Guard

**CRITICAL**: After EVERY `AskUserQuestion` call, check if answers are empty/blank. Known Claude Code bug: outside Plan Mode, AskUserQuestion silently returns empty answers without showing UI.

**If answers are empty**: DO NOT proceed with assumptions. Instead:
1. Output: "⚠️ Questions didn't display (known Claude Code bug outside Plan Mode)."
2. Present the options as a **numbered text list** and ask user to reply with their choice number.
3. WAIT for user reply before continuing.

## ⚠️ VERBATIM RULE

**CRITICAL**: Never rewrite the text after the colon of a carried-forward line. Never touch a line whose role is not yours — copy it byte-for-byte. A Haiku pass once reworded a user's exact phrasing while explicitly asked to quote it verbatim — hence Sonnet here, not Haiku.

## Performance Rules

1. **Use `rtk` for ALL shell commands**
2. **Parallel tool calls** — ALL independent calls in one message
3. **Minimize round-trips** — gather all data phase 1, reason phase 2, write phase 3

## Workflow

### Phase 1: Gather Data (parallel)

```
Bash: rtk ls openspec/changes/ + rtk ls -t CONTEXT-*llm.md
Read: existing CONTEXT-{stream}-llm.md (if present) — needed to carry forward owned lines and to read the `saved:` field for the Phase 3 concurrency check
```

**Stream resolution**: First word of `$ARGUMENTS` = stream name (`^[a-zA-Z0-9_-]{1,50}$`), rest = description. Empty → reuse prior `/load-context` stream or AskUserQuestion.

**Role resolution**: `--as <role>` flag in `$ARGUMENTS` > role recorded by the last `/load-context` for this stream > none (solo session — untagged line format, unchanged behavior).

### Phase 1b: Detect Thinking Artifacts (parallel with Phase 1)

If `$PRAXIS_DIR` is set:
```
Bash: ls -t "$PRAXIS_DIR/thinking"/*/{project}/ 2>/dev/null | head -10
```
Where `{project}` = current project folder name. Collect recent artifact paths written during this session (match conversation timestamps/topics).

If `$PRAXIS_DIR` is unset or empty: skip silently — no error, no warning.

### Phase 2: Collect Trailers & Synthesize

**Collect-then-fill.** Trailers (`<!-- ckpt ... -->`) are author-distilled at the moment of decision — route them mechanically, and only synthesize what they don't cover.

1. **Collect** — gather every `<!-- ckpt` block already present in this session's own conversation. No transcript parsing, no scripts, no greps of `~/.claude` — the trailers are already in context.
2. **Route** — map each clause to its target section via the routing table in `reference.md`. Mechanical, no rewording.
3. **My lines** = my old lines carried forward BY COPY (verbatim, from the Phase 1 Read) + my new trailers + my `## Hot Files` rows re-derived fresh (that list is regenerated every save — but MY rows only; Hot Files is an owned section like the rest). Pruning:
   - A reversed decision is NOT deleted — move it to `## Dead Ends` WITH its rationale intact.
   - An answered `open:` is removed.
   - Criterion is VALIDITY (still true?), never line type — never drop a `reasoning:` for not being a decision.
4. **Other roles' lines** — copy byte-for-byte. Never edit, reorder, reword, or reflow a line whose role isn't mine, their `## Hot Files` rows included: "fresh each save" governs my rows, it is not license to overwrite theirs.
5. **Synthesize** — ONLY what trailers don't cover: focus, goal, Next, status, Drop, progression.
   - **Next** — union of routed `open:` lines + inferred tasks. IMPORTANT: heading must stay `Next` (Claude Code compaction grep-matches `next`/`todo`/`pending`/`remaining` for survival priority).
   - **Thinking Artifacts** (if Phase 1b found any) — paths only, no content.
   - **Predecessor** — path of the CONTEXT this session resumed (`/load-context`) or overwrites, so streams chain into a walkable history. Else `none`.
6. **Fallback** — zero trailers this session → pre-rework behaviour: infer Session (decisions/thinking/unexpected), Learnings, Dead Ends from the last 15-20 messages.

### Phase 3: Write & Report

Before writing, apply three pre-write passes:
- **Concurrency check**: re-read the `saved:` field from the on-disk CONTEXT file. If it changed since Phase 1's read, another session wrote in between — re-read the file, re-merge (Phase 2 steps 3-4), and retry. Optimistic check; no lock file.
- **Reference-don't-copy** (named contract): never inline content that already lives in a spec/plan/diff/OpenSpec/thinking-artifact — reference it by path. The CONTEXT file points at sources; it does not duplicate them.
- **Scrub secrets**: strip anything key/token/credential/PII-shaped from the synthesized text (API keys, bearer tokens, `KEY=`/`PASSWORD=` values, private-key blocks) → replace with `[REDACTED]`. The resume file must never persist a secret.

Write CONTEXT file using template.

**Stream naming**: `"default" → CONTEXT-llm.md`, `"{name}" → CONTEXT-{name}-llm.md`

**Report** — growth line so the human can watch accumulation:
`📈 {total} lignes · ~{tok} tok · [{role} {n}] [{role} {n}]  (+{delta} depuis {last_save})`

### Phase 3b: Auto-archive to `done/`

If status is `done` or `parked` → move file to `done/` subfolder:
```
Bash: mkdir -p done && mv CONTEXT-{stream}-llm.md done/
```
Report: `"📦 Archived to done/ (status: {status})"`

See `reference.md` for CONTEXT file template, quality self-check, and done/ archival rules.
