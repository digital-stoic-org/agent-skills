"""
test_troubleshoot.py — L1/L3 behavioral test for troubleshoot skill.
Smoke test: error description → diagnostic steps.
"""
import json
from pathlib import Path

import pytest

from harness.behavioral import check_cost_cap, invoke_skill, llm_judge

SKILL_PATH = "/workspace/skills/troubleshoot/SKILL.md"
OUTPUT_DIR = Path("/workspace/output")


@pytest.mark.behavioral
def test_troubleshoot_diagnostic_steps(workspace):
    """troubleshoot produces diagnostic steps for an error."""
    check_cost_cap("troubleshoot_smoke")

    prompt = (
        "I'm getting 'ECONNREFUSED 127.0.0.1:5432' when running my tests. "
        "The app worked fine yesterday. Help me troubleshoot."
    )

    response = invoke_skill(prompt, SKILL_PATH, test_id="troubleshoot_smoke")
    result_text = response["result"]

    judge = llm_judge(
        question="Does this response provide diagnostic steps or a troubleshooting procedure (not just an explanation of the error)?",
        context=result_text,
        test_id="troubleshoot_smoke",
    )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "troubleshoot_smoke.json").write_text(json.dumps({
        "status": "pass" if judge["verdict"] == "YES" else "fail",
        "judge_verdict": judge["verdict"],
        "judge_reason": judge["reason"],
        "cost_usd": response["cost_usd"] + judge["cost_usd"],
    }, indent=2))

    assert judge["verdict"] == "YES", f"Judge said NO: {judge['reason']}"
