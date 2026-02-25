"""
test_coach_signal.py — L1/L3 behavioral test for coach signal skill.
Smoke test: Strategic signal coaching session that follows 6-step GROW protocol with scorecard,
positioning check, Goldsmith accountability, signal-gap scan, commitment, and debrief+persist.
"""
from pathlib import Path

import pytest
import yaml

from harness.behavioral import check_cost_cap, invoke_skill, llm_judge

SKILL_PATH = "/workspace/coach-skills/coach/SKILL.md"
PLUGIN_DIR = "/workspace/dstoic"


@pytest.mark.behavioral
def test_coach_signal_smoke(workspace, sandbox):
    """Signal coaching session follows 6-step GROW protocol end-to-end."""
    test_id = "coach_signal_smoke"
    check_cost_cap(test_id)

    prompt = (
        "Run a signal coaching session. "
        "My scorecard: 3 one-on-ones this week, tech_ratio 0.9, "
        "2 online signals, 1 follow-up owed, 0 sent, "
        "streams active: stream-a, stream-b, stream-c. "
        "Last session I committed to send a follow-up DM to partner lead. I did it. "
        "I have a lunch with a business buyer next week for stream-a."
    )

    response = invoke_skill(prompt, SKILL_PATH, test_id=test_id,
                             plugin_dir=PLUGIN_DIR, skip_permissions=True,
                             cwd=str(sandbox))
    result_text = response["result"]

    judge = llm_judge(
        question=(
            "Does the response follow a structured signal coaching session with at least these elements: "
            "1) a signal scorecard with numeric counts (1:1s, tech ratio, online signals, follow-ups, streams), "
            "2) a positioning check that references specific streams and audiences, "
            "3) accountability for a prior commitment, "
            "4) signal suggestions tagged as strategic or operational, "
            "5) a specific commitment with a person/post target and deadline, "
            "6) a debrief or persist step? "
            "Also check: does it flag the tech_ratio > 0.8 rebalance warning "
            "and the 3+ streams diffusion warning?"
        ),
        context=result_text,
        test_id=test_id,
    )

    (workspace / f"{test_id}.yaml").write_text(yaml.dump({
        "status": "pass" if judge["verdict"] == "YES" else "fail",
        "judge_verdict": judge["verdict"],
        "judge_reason": judge["reason"],
        "cost_usd": response["cost_usd"] + judge["cost_usd"],
    }, default_flow_style=False, sort_keys=False))

    assert judge["verdict"] == "YES", f"Judge said NO: {judge['reason']}"
