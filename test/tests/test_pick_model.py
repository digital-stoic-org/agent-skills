"""
test_pick_model.py — L1/L3 behavioral test for pick-model skill.
Smoke test: simple task → haiku recommended.
"""
from pathlib import Path

import pytest
import yaml

from harness.behavioral import check_cost_cap, invoke_skill, llm_judge

SKILL_PATH = "/workspace/skills/pick-model/SKILL.md"
OUTPUT_DIR = Path("/workspace/output")


@pytest.mark.behavioral
def test_pick_model_simple_task_recommends_haiku(workspace):
    """Simple formatting task should recommend haiku (cheapest/fastest)."""
    check_cost_cap("pick_model_smoke")

    prompt = "Pick the right model for: convert a list of names to title case."

    response = invoke_skill(prompt, SKILL_PATH, test_id="pick_model_smoke")
    result_text = response["result"]

    judge = llm_judge(
        question="Does this response recommend haiku as the appropriate model for a simple formatting task?",
        context=result_text,
        test_id="pick_model_smoke",
    )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "pick_model_smoke.yaml").write_text(yaml.dump({
        "status": "pass" if judge["verdict"] == "YES" else "fail",
        "judge_verdict": judge["verdict"],
        "judge_reason": judge["reason"],
        "cost_usd": response["cost_usd"] + judge["cost_usd"],
    }, default_flow_style=False, sort_keys=False))

    assert judge["verdict"] == "YES", f"Judge said NO: {judge['reason']}"
