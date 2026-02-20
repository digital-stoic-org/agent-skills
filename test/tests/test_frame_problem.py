"""
test_frame_problem.py — L1/L3 behavioral test for frame-problem skill.
Smoke test: ambiguous scenario → Cynefin classification.
"""
from pathlib import Path

import pytest
import yaml

from harness.behavioral import check_cost_cap, invoke_skill, llm_judge

SKILL_PATH = "/workspace/skills/frame-problem/SKILL.md"
OUTPUT_DIR = Path("/workspace/output")


@pytest.mark.behavioral
def test_frame_problem_cynefin_classification(workspace):
    """frame-problem classifies an ambiguous scenario using Cynefin or similar framework."""
    check_cost_cap("frame_problem_smoke")

    prompt = (
        "Our API is getting slow but we're not sure if it's the database, "
        "the network, or the application code. Users are complaining but "
        "the metrics look normal. How should I approach this?"
    )

    response = invoke_skill(prompt, SKILL_PATH, test_id="frame_problem_smoke")
    result_text = response["result"]

    judge = llm_judge(
        question="Does this response classify or frame the problem using a structured framework (like Cynefin, Stacey, or similar) and recommend an approach based on that classification?",
        context=result_text,
        test_id="frame_problem_smoke",
    )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "frame_problem_smoke.yaml").write_text(yaml.dump({
        "status": "pass" if judge["verdict"] == "YES" else "fail",
        "judge_verdict": judge["verdict"],
        "judge_reason": judge["reason"],
        "cost_usd": response["cost_usd"] + judge["cost_usd"],
    }, default_flow_style=False, sort_keys=False))

    assert judge["verdict"] == "YES", f"Judge said NO: {judge['reason']}"
