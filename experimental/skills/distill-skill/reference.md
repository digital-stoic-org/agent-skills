# Distill Skill — Reference

## RISEN-lite scaffold (full template)

Inspired by RISEN (Role, Instructions, Steps, End-goal, Narrowing) but stripped: **structures the gathering, not the output**. The final SKILL.md format is decided by `edit-tool`.

```yaml
role:
  who: "user profile inferred from session (e.g., senior backend dev, data scientist)"
  context: "domain / project type (e.g., Xano backend, Praxis meta-workflow)"

intent:
  one_liner: "generalized goal, session-specifics stripped"
  trigger_keywords: ["phrases a future user would say to invoke this"]
  anti_triggers: ["phrases that look similar but should route elsewhere"]

steps:
  - order: 1
    action: "what was done"
    tool: "Read|Edit|Bash|Agent|Skill|..."
    input_shape: "what the step consumes"
    output_shape: "what the step produces"
    branch_conditions: "when to skip / when to repeat"

end_goal:
  success_criteria: "observable signal the task is done"
  deliverable: "file / output / side-effect produced"

narrowing:
  constraints: ["scope limits, things NOT to do"]
  anti_patterns:
    - pattern: "what doesn't work"
      why: "root cause"
      correction: "what to do instead"
  confusion_disambiguation:
    - ambiguous_input: "what was unclear mid-session"
      resolution: "how to disambiguate upfront in final skill"
  resources_to_preload:
    - path: "$PRAXIS_DIR/reference/..."
      reason: "why this framework/glossary matters"
```

## Trace schema (`trace.jsonl`)

One JSON line per meaningful turn. Not every turn — skip pure acknowledgments.

```json
{
  "ts": "2026-04-23T15:40:00+00:00",
  "turn": 7,
  "user_intent": "generalized one-liner",
  "tools_used": ["Read", "Edit"],
  "files_touched": ["/path/to/file.md"],
  "outcome": "ok|retry|abandoned",
  "friction": "verbatim user correction (only if present)",
  "confusion_flag": true
}
```

### Annotation heuristics

| Signal | Capture as |
|---|---|
| User says "no", "don't", "stop", "wrong" | `friction` (verbatim) |
| User rewrites assistant output | `friction` + outcome: `retry` |
| User abandons direction ("let's do Y instead") | outcome: `abandoned` + new turn starts fresh |
| Assistant asks clarifying question | `confusion_flag: true` on the *prior* user turn |
| User confirms non-obvious approach ("yes exactly", "perfect") | outcome: `ok` + note in `draft.yaml` narrowing as validated approach |
| Tool call fails → retry | capture both attempts, annotate root cause in `anti-patterns.md` |

## Split-detection rules

Propose splitting into multiple skills when **all** hold:
- ≥2 distinct end-goals observable in trace
- Sub-tasks could be invoked independently in future sessions
- Sub-tasks have disjoint tool sets OR disjoint input shapes
- Each sub-task has ≥3 trace entries of its own

If only one holds → keep as single skill with branching.

## Compaction detection (retrospective mode)

Heuristics to warn user:
- Turn count in session >30
- User references facts from "earlier" that aren't in recent context
- Assistant's recent messages reference summaries rather than concrete turns
- `ls "$PRAXIS_DIR/.tmp/distill-skill/"` shows no forward-mode trace dir

If any → respond: `⚠️ Compaction may have dropped early context. Confirm start-of-session goal + first 3 user intents before I proceed.`

## Anti-patterns file format

`anti-patterns.md` — markdown, one entry per failure mode:

```markdown
## <short name>

- **What happened**: verbatim description
- **Why it failed**: root cause (not symptom)
- **Correction**: what worked instead
- **Signal for final skill**: prevention rule to embed in narrowing/constraints
```

## Handoff to edit-tool

Final invocation shape (model constructs the prompt):

```
/edit-tool create skill from $PRAXIS_DIR/.tmp/distill-skill/<SID>/draft.yaml
  - anti-patterns: $PRAXIS_DIR/.tmp/distill-skill/<SID>/anti-patterns.md
  - dedup verdict from search-skill: <verdict>
  - proposed name: <name>
  - target: dstoic/skills/<name>/
```

`edit-tool` triages (skill vs bash vs agent) per its decision tree. Trust its verdict — if it says "this should be a bash script, not a skill", don't override.

## Kaizen integration

After finalization, for each `friction` entry in `trace.jsonl` where outcome = `retry`:

```bash
/kaizen distill-skill "<friction verbatim>"
```

This feeds meta-improvement of `distill-skill` itself. Separate from the anti-patterns captured *in* the new skill being built.
