"""
test_brainstorm.py — L1/L3 behavioral test for brainstorm skill.
Smoke test: ideation prompt → structured output with multiple ideas.
"""
import json
from pathlib import Path

import pytest

from harness.behavioral import check_cost_cap, invoke_skill, llm_judge

SKILL_PATH = "/workspace/skills/brainstorm/SKILL.md"
OUTPUT_DIR = Path("/workspace/output")


@pytest.mark.behavioral
def test_brainstorm_structured_output(workspace):
    """Brainstorm produces structured output with multiple ideas."""
    check_cost_cap("brainstorm_smoke")

    prompt = "Brainstorm ways to improve developer onboarding for a CLI tool."

    response = invoke_skill(prompt, SKILL_PATH, test_id="brainstorm_smoke")
    result_text = response["result"]

    judge = llm_judge(
        question="Does this response contain multiple distinct ideas or options presented in a structured format (numbered list, sections, or categories)?",
        context=result_text,
        test_id="brainstorm_smoke",
    )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "brainstorm_smoke.json").write_text(json.dumps({
        "status": "pass" if judge["verdict"] == "YES" else "fail",
        "judge_verdict": judge["verdict"],
        "judge_reason": judge["reason"],
        "cost_usd": response["cost_usd"] + judge["cost_usd"],
    }, indent=2))

    assert judge["verdict"] == "YES", f"Judge said NO: {judge['reason']}"
