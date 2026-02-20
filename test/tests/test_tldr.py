"""
test_tldr.py — L1/L3 behavioral test for tldr skill.
Smoke test: recap request → concise bullet output.
"""
import json
from pathlib import Path

import pytest

from harness.behavioral import check_cost_cap, invoke_skill, llm_judge

SKILL_PATH = "/workspace/skills/tldr/SKILL.md"
OUTPUT_DIR = Path("/workspace/output")


@pytest.mark.behavioral
def test_tldr_concise_output(workspace):
    """tldr produces a concise bulleted recap."""
    check_cost_cap("tldr_smoke")

    prompt = (
        "Here is the previous response to summarize:\n\n"
        "We refactored the authentication module to use JWT tokens instead of sessions. "
        "Updated 3 files: auth.py, middleware.py, and config.py. "
        "The main decision was to use RS256 signing for better security. "
        "Next steps: update the API docs and add refresh token rotation."
    )

    response = invoke_skill(prompt, SKILL_PATH, test_id="tldr_smoke")
    result_text = response["result"]

    judge = llm_judge(
        question="Is this response a concise bullet-point summary (5 or fewer bullets) with emoji tags?",
        context=result_text,
        test_id="tldr_smoke",
    )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "tldr_smoke.json").write_text(json.dumps({
        "status": "pass" if judge["verdict"] == "YES" else "fail",
        "judge_verdict": judge["verdict"],
        "judge_reason": judge["reason"],
        "cost_usd": response["cost_usd"] + judge["cost_usd"],
    }, indent=2))

    assert judge["verdict"] == "YES", f"Judge said NO: {judge['reason']}"
