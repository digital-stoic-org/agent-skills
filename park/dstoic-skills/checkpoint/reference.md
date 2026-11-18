# checkpoint Reference

## Why: extractive, not abstractive (the whole point)

Any LLM asked to *produce* the text it preserves will regenerate it — normalizing wording, fixing typos, smoothing nuance. Proven empirically (a Haiku pass rewrote a user's exact phrasing when asked to cite it verbatim). The meat IS the exact phrasing, so:

- **Model → returns ids only** (a few hundred tokens). Never content.
- **Script → copies `turns[id].text`** verbatim. A `dict[id]` lookup cannot hallucinate.
- **Bonus**: no generated verbatim = no ~5× output-token cost that a full re-summarization would incur.

The **summary** layer is different on purpose: orientation state (goal, next, decisions) is cheap to reword and doesn't need byte-fidelity. The **meat** layer is where fidelity is the entire deliverable — so it is copied, not written.

## Temp files (never /tmp)

Use `${CLAUDE_PROJECT_DIR:-$(pwd)}/.tmp/checkpoint/` for all intermediates. `/tmp` is off-limits (shared, world-readable, outside the project sandbox). Create it with `mkdir -p`, remove it at the end of the run.

## Transcript path resolution

Claude Code logs the live session to `~/.claude/projects/<slug>/<session>.jsonl`, where `<slug>` = the **resolved** working dir (symlinks followed) with every `/` replaced by `-`.

⚠️ **Do NOT slug bare `$(pwd)`** — under a symlink/alias (e.g. `/praxis` → `/home/mat/dev/praxis`), `pwd` is the alias but the slug is built from the real path, so the naive transform points at a directory that doesn't exist → false PARSE_FAILED. Resolve the real path first, then fall back to a basename scan:

```bash
REAL=$(cd "$(pwd)" && pwd -P)                          # follow symlinks (realpath . also works)
DIR="$HOME/.claude/projects/$(printf '%s' "$REAL" | sed 's#/#-#g')"
if [ ! -d "$DIR" ]; then                                # slug mismatch — scan by basename
  BASE=$(basename "$REAL")
  DIR=$(ls -dt "$HOME/.claude/projects/"*"-$BASE" 2>/dev/null | head -1)
fi
TRANSCRIPT=$(ls -t "$DIR"/*.jsonl 2>/dev/null | grep -v subagents | head -1)
[ -z "$TRANSCRIPT" ] && echo "PARSE_FAILED: no transcript" >&2   # -> summary-only fallback
```

⚠️ Undocumented format — Anthropic may change path/schema. The script guards version drift and exits non-zero on failure; the skill falls back to summary-only. Never assume it succeeded.

## Triage prompt (Phase 2 sub-agent — Sonnet)

Give the sub-agent `$TMP/turns.json` and this instruction (validated: Sonnet catches structural reasoning + rejections that a cheaper model misses; ID-only prevents hallucination):

> You are an EXTRACTIVE classifier. Read the transcript JSON `[{id,role,text}]` fully. DESIGNATE by number the turns carrying "meat" — context that would be LOST and costly to reconstruct if the conversation were erased. Nothing is pre-tagged; judge semantically. Signal types:
>
> - **constraint** — a framing/wording/scope requirement ("must stay X", "strict priority Y>Z", "never W").
> - **rejection** — a discarded path + why ("no, not that, because…"). The session's anti-library.
> - **correction** — a redirection of the current path ("actually the opposite", "no in fact", "I'm not clear on X").
> - **decision** — a settled choice + its rationale.
> - **reasoning** — a chain that DERIVES a non-trivial consequence (an architecture, an implication pulled from a constraint) — high value even with no decision keyword.
> - **learning** — a non-obvious fact discovered in-session (a gotcha, an empirical result, "turns out X", a measurement, a root cause).
> - **pivot** — a change of direction/scope/goal larger than a correction: the *frame itself* shifted ("let's set that aside and instead…", "new plan").
> - **assumption** — an unverified premise the work now rests on (cold-resume risk if it's wrong).
> - **open-question** — an unresolved fork, an explicit TBD, something deferred ("we'll decide later", "still unclear whether…").
> - **preference** — a stable taste/tone/style the user expressed and will expect honored again.
> - **definition** — a coined term or shared vocabulary specific to this session.
> - **resource** — an external anchor cited and worth not losing (URL, file path, ticket, dataset, command).
>
> A turn that DERIVES a consequence, records a learning, or shifts the frame is meat. A pure ACTION turn ("go", "launching tool", "published") is NOT, even if it advances the work. Optimize recall on reasoning / rejections / learnings / pivots; stay precise on action.
>
> Weight 1–3 (3 = catastrophic if lost). Return ONLY ids + types + weight. NO text, NO citation, NO paraphrase — if you emit any transcript content you fail.

Schema:
```json
{"bearers":[{"id":61,"types":["decision","pivot"],"weight":3}],"notes":"..."}
```

## Trailer harvest (primary path for ASSISTANT meat) — and required setup

The costly, lossy part of extraction is reconstructing the **assistant's** own signal after the fact (whole-turn copies bloat the file — measured at ~73% of output — and a triage model only *guesses* which sentence was load-bearing). The fix: have the model emit its own distilled signal at generation time, and here just **harvest** it.

**Required setup (tell the user if trailers are absent):** the user's global `~/.claude/CLAUDE.md` must instruct every turn to end — only when it settles a decision / discovers a learning / rejects a path / pivots / opens a fork — with an HTML-comment trailer:

```
<!-- ckpt
decision: <choice> — <why>
reasoning: <non-trivial consequence derived this turn, even with no decision>
learning: <non-obvious fact discovered this turn>
pivot: <frame/scope change>
rejected: <path> — <why>
constraint: <hard rule in force>
assumption: <unverified premise the work rests on>
open: <unresolved fork>
definition: <term> = <meaning>
refs: <path → anchor, or URL/ticket/dataset>
-->
```

The 10 trailer fields cover 10 of the 12 taxonomy signals. The two omitted — **correction** and **preference** — are *user-authored* (a redirect, a stable taste); self-tagging can only reach the assistant's own turns, so those two stay with the extractive pass. This is the division, not a gap.

**Harvest (0 LLM, deterministic):** grep the last `<!-- ckpt … -->` block per assistant turn from the transcript and concat into the summary's `decisions/learnings/open-questions/hot-files`. Because the trailer is authored live, it needs no triage and no verbatim copy — it IS the distilled bone, already reworded by the author who knew.

```bash
# extract trailers straight from the raw .jsonl (each is self-contained, greppable)
grep -o '<!-- ckpt.*-->' "$TRANSCRIPT" 2>/dev/null   # or a small python pass over assistant turns
```

**Division of labor once trailers exist:**
- ASSISTANT meat → trailers (harvest, ~free, high fidelity — no whole-turn copies).
- USER meat → still the extractive Sonnet-triage + code-copy path below (a user's exact words can't be self-tagged).
- Sessions predating the rule (no trailers) → fall back to full extractive triage over both roles.

This is why the triage prompt can, when trailers are present, be scoped to **user turns only** — halving the read and eliminating the assistant-essay bloat at the source rather than trimming it afterward.

## Contiguous-window rule (Phase 3, capture 2)

The live thread = turns AFTER the most-recent id with weight ≥ 2 that is a `decision` or `pivot`. Everything before it has already crystallized into the summary. Guards:
- **Floor**: always keep the last 3 turns (never return empty).
- **Cap**: never exceed 25 turns OR `CHECKPOINT_MAX_CONTIG_TURNS` if set — avoid re-importing an obese thread.
- If no decision/pivot found: keep last min(8, cap) turns.

## CHECKPOINT file template

```markdown
# Session Checkpoint: {title}

saved: YYYY-MM-DDTHH:MM:SSZ
stream: {name}
status: {exploring|building|decided|parked|done}
predecessor: {path to prior CHECKPOINT this session continues | none}
goal: {1 sentence}

---

## Summary (synthesized — orientation, safe to reword)

focus: {1-2 sentences}
next:
  - {task}
decisions:
  - {[P1|P2]} {choice}: {rationale}
learnings:
  - {non-obvious fact / gotcha}
dead-ends:
  - {approach tried & abandoned}: {why — so it isn't re-attempted}
open-questions:
  - {unresolved fork}
hot-files:
  - {[P1|P2]} {path} → {semantic anchor: section/function, NOT line numbers}

## Meat — verbatim (copied by script, unedited)

### Punctual (bearing turns, grouped by type)
- **[id {n} · {types} · w{weight}]** {verbatim text, exact}

### Contiguous (live thread)
> {verbatim turns after last decision/pivot, in order}

## Drop
- {noise not to re-chase}
```

The Meat section is verbatim — **do not edit, summarize, or fix typos in it**. That fidelity is the deliverable. The Summary section may be freely worded.

**Sole exception to verbatim — secret scrub:** the `collect` script masks a *narrow, high-precision* set of unambiguous secret shapes (private-key blocks, `sk-`/`sk-ant-` keys, AWS `AKIA…`, GitHub/Slack tokens, JWTs, `password=`/`token=` assignments) with `[REDACTED:type]` before the text lands on disk. Precision over recall — prose is never clobbered, so a checkpoint never persists a live credential a transcript happened to quote. Set `CHECKPOINT_NO_REDACT=1` to disable (e.g. when checkpointing a session that legitimately discusses key *shapes*).

**`dead-ends` (summary layer):** fold the `rejected` trailer field and the `rejection` triage type into this list — the session's anti-library, surfaced up-front so a cold resume sees "don't retry X" without scanning the verbatim meat. Omit if none.

**`predecessor` (header):** if this checkpoint continues an earlier one for the same stream, stamp its path so a multi-day reasoning thread chains into a walkable lineage. Else `none`.

## Empty-answer guard (Phase 4)

Known Claude Code bug: outside Plan Mode, `AskUserQuestion` can silently return empty answers. After the call, if answers are empty:
1. Print: "⚠️ Questions didn't display (known Claude Code bug outside Plan Mode)."
2. Present options as a numbered text list; wait for a reply. Never assume the user wants to clear.

## Stream naming

`"default" → CHECKPOINT-llm.md`, `"{name}" → CHECKPOINT-{name}-llm.md`. Pattern `^[a-zA-Z0-9_-]{1,50}$`. First word of `$ARGUMENTS` = stream, rest = description.

## Python invocation (gotcha)

`extract_turns.py` is **stdlib-only** (`json`, `sys`) — no pip installs, no venv needed for dependencies. But **never assume bare `python3` resolves**: it may be absent, aliased, or the wrong interpreter. Resolve one explicitly and fail loud if none:

```bash
PY=$(command -v python3 || command -v python) || { echo "PARSE_FAILED: no python" >&2; }   # -> summary-only fallback
"$PY" scripts/extract_turns.py index "$TRANSCRIPT" > "$TMP/turns.json"
```

If a project pins a venv (`.venv/bin/python`), prefer it — never run the script with a global interpreter when the project expects an isolated one.

## Golden test

Fixture: `test/fixtures/golden/checkpoint-smoke.md`. Asserts: (1) `extract_turns.py index` on a sample `.jsonl` returns N numbered turns; (2) `collect` returns byte-exact text for given ids (incl. preserved typos) — the fixture must contain **no** secret-shaped strings so redaction is a no-op here; (3) a malformed `.jsonl` exits 2 (fallback path); (4) `collect` on a turn containing a planted secret (`sk-ant-…`, a private-key block) masks it with `[REDACTED:…]`, and `CHECKPOINT_NO_REDACT=1` restores byte-exact copy. Re-run on every Claude Code version bump — a red test = schema drift, fix the parser before trusting the skill.
