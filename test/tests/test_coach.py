"""
test_coach.py — L1/L3 behavioral test for coach skill.
Smoke test: Personal coaching session that follows 6-step CLEAR protocol with pulse check,
anxiety surfacing, Goldsmith accountability, explore/reframe, commitment, and review.
"""
from pathlib import Path

import pytest
import yaml

from harness.behavioral import check_cost_cap, invoke_skill, llm_judge

SKILL_PATH = "/workspace/coach-skills/coach/SKILL.md"
OUTPUT_DIR = Path("/workspace/output")


@pytest.mark.behavioral
def test_coach_smoke(workspace):
    """Personal coaching session follows 6-step CLEAR protocol end-to-end."""
    test_id = "coach_smoke"
    check_cost_cap(test_id)

    prompt = (
        "Run a personal coaching session. "
        "My energy is 6, mood is 5, stress is 7. "
        "I'm avoiding writing the quarterly business plan."
    )

    response = invoke_skill(prompt, SKILL_PATH, test_id=test_id)
    result_text = response["result"]

    judge = llm_judge(
        question=(
            "Does the response follow a structured coaching session with at least these elements: "
            "emotional state check, anxiety/avoidance question, accountability for prior commitment, "
            "reframing, a specific commitment with deadline, and a session review?"
        ),
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
