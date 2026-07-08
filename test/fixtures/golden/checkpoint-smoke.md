# checkpoint golden smoke

Verifies the extractive contract of `/checkpoint`'s parser against a frozen transcript
fixture. A red test = Claude Code `.jsonl` schema drift → fix `extract_turns.py` before
trusting the skill.

Fixture: `dstoic/skills/checkpoint/scripts/fixture.jsonl`

## Assertions

1. **index** returns 4 numbered user/assistant turns (the pure `tool_result` user turn is filtered).
2. **collect 3** returns the turn text byte-exact, **including the typos** `differnce` / `mecansime`
   (proves verbatim copy — no LLM normalization).
3. A malformed `.jsonl` (no parseable turns) exits **non-zero (2)** → triggers the skill's os-only fallback.

## Run

```bash
cd dstoic/skills/checkpoint
PY=$(command -v python3 || command -v python)                    # never assume bare python3
"$PY" scripts/extract_turns.py index scripts/fixture.jsonl       # -> 4 turns
"$PY" scripts/extract_turns.py collect scripts/fixture.jsonl 3   # -> keeps "differnce"/"mecansime"
"$PY" scripts/extract_turns.py index /dev/null; echo $?          # -> 2
```
