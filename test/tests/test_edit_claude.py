"""
test_edit_claude.py — L1/L3 behavioral test for edit-claude skill.
Smoke test: CLAUDE.md creation request → structured output.
"""
from pathlib import Path

import pytest
import yaml

from harness.behavioral import check_cost_cap, invoke_skill, llm_judge

SKILL_PATH = "/workspace/skills/edit-claude/SKILL.md"
OUTPUT_DIR = Path("/workspace/output")


@pytest.mark.behavioral
def test_edit_claude_structured_output(workspace):
    """edit-claude produces structured CLAUDE.md content when asked to create one."""
    check_cost_cap("edit_claude_smoke")

    prompt = (
        "Create a CLAUDE.md for a Python FastAPI project that uses PostgreSQL "
        "and follows conventional commits."
    )

    response = invoke_skill(prompt, SKILL_PATH, test_id="edit_claude_smoke")
    result_text = response["result"]

    judge = llm_judge(
        question="Does this response contain structured CLAUDE.md content with sections (like headings, rules, or conventions) appropriate for a project configuration file?",
        context=result_text,
        test_id="edit_claude_smoke",
    )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "edit_claude_smoke.yaml").write_text(yaml.dump({
        "status": "pass" if judge["verdict"] == "YES" else "fail",
        "judge_verdict": judge["verdict"],
        "judge_reason": judge["reason"],
        "cost_usd": response["cost_usd"] + judge["cost_usd"],
    }, default_flow_style=False, sort_keys=False))

    assert judge["verdict"] == "YES", f"Judge said NO: {judge['reason']}"
