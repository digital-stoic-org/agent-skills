# Test Skill Reference

## Test File Template

When scaffolding a new test, use this template. Replace all `{PLACEHOLDERS}`.

```python
"""
test_{SNAKE_NAME}.py — L1/L3 behavioral test for {SKILL_NAME} skill.
Smoke test: {SCENARIO_DESCRIPTION}
"""
from pathlib import Path

import pytest
import yaml

from harness.behavioral import check_cost_cap, invoke_skill, llm_judge

SKILL_PATH = "/workspace/skills/{SKILL_NAME}/SKILL.md"
OUTPUT_DIR = Path("/workspace/output")


@pytest.mark.behavioral
def test_{SNAKE_NAME}_smoke(workspace):
    """{SCENARIO_DESCRIPTION}"""
    test_id = "{SNAKE_NAME}_smoke"
    check_cost_cap(test_id)

    prompt = "{PROMPT}"

    response = invoke_skill(prompt, SKILL_PATH, test_id=test_id)
    result_text = response["result"]

    judge = llm_judge(
        question="{JUDGE_QUESTION}",
        context=result_text,
        test_id=test_id,
    )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / f"{test_id}.yaml").write_text(yaml.dump({
        "status": "pass" if judge["verdict"] == "YES" else "fail",
        "judge_verdict": judge["verdict"],
        "judge_reason": judge["reason"],
        "cost_usd": response["cost_usd"] + judge["cost_usd"],
    }, default_flow_style=False, sort_keys=False))

    assert judge["verdict"] == "YES", f"Judge said NO: {judge['reason']}"
```

## Placeholder Reference

| Placeholder | Source | Example |
|---|---|---|
| `{SKILL_NAME}` | skill_name (kebab-case) | `pick-model` |
| `{SNAKE_NAME}` | skill_name with `-`→`_` | `pick_model` |
| `{SCENARIO_DESCRIPTION}` | User answer to scenario question | `Simple task recommends haiku` |
| `{PROMPT}` | Derived from scenario — the actual prompt sent to the skill | `Pick the right model for: convert names to title case.` |
| `{JUDGE_QUESTION}` | User answer to judge question | `Does this response recommend haiku for a simple task?` |

## Golden Fixture Template

Simplified SKILL.md for structural validation. Under 250 tokens.

```markdown
---
name: {SKILL_NAME}
description: {SHORT_DESCRIPTION}
---

# {Title Case Name}

{One-line purpose from original SKILL.md.}

## Instructions

{3-5 condensed bullet points from original skill.}
```

## Docker Run Command

```bash
docker compose -f test/docker-compose.test.yml run --rm skill-tester pytest tests/test_{SNAKE_NAME}.py -v -s
```

## Existing Test Patterns

**Single judge assertion** (most common — pick-model, tldr, brainstorm):
- invoke_skill → llm_judge → assert verdict == YES

**Deterministic + judge** (edit-skill):
- invoke_skill → check YAML validity, token count → llm_judge for content quality

**Multi-test file** (edit-skill has 3 tests):
- Each test gets unique `test_id` for cost tracking
- Same SKILL_PATH, different prompts

## Cost Tracking

- Each `test_id` tracked separately in `/workspace/output/cost.yaml`
- Judge costs tracked as `{test_id}_judge`
- Total cap: $0.50 per session (ADR-5)
- `check_cost_cap` auto-skips if approaching limit
