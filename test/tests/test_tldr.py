"""
test_tldr.py — L1/L3 behavioral test for tldr skill.
Smoke test: recap request → concise bullet output.
"""
import pytest
import yaml

from harness.behavioral import check_cost_cap, invoke_skill, llm_judge

SKILL_PATH = "/workspace/skills/tldr/SKILL.md"


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

    (workspace / "tldr_smoke.yaml").write_text(yaml.dump({
        "status": "pass" if judge["verdict"] == "YES" else "fail",
        "judge_verdict": judge["verdict"],
        "judge_reason": judge["reason"],
        "cost_usd": response["cost_usd"] + judge["cost_usd"],
    }, default_flow_style=False, sort_keys=False))

    assert judge["verdict"] == "YES", f"Judge said NO: {judge['reason']}"
