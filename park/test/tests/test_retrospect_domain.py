"""
test_retrospect_domain.py — L1/L3 behavioral test for retrospect-domain skill.
Smoke test: domain analysis request → insights plan with framework + output path.
"""
import pytest
import yaml

from harness.behavioral import check_cost_cap, invoke_skill, llm_judge

SKILL_PATH = "/workspace/skills/retrospect-domain/SKILL.md"
PLUGIN_DIR = "/workspace/dstoic"


@pytest.mark.behavioral
def test_retrospect_domain_plan(workspace, sandbox):
    """retrospect-domain produces an analysis plan with domain framework and output."""
    check_cost_cap("retrospect_domain_smoke")

    prompt = "Analyze domain insights from the last 7 days of technical sessions."

    response = invoke_skill(prompt, SKILL_PATH, test_id="retrospect_domain_smoke",
                             plugin_dir=PLUGIN_DIR, skip_permissions=True,
                             cwd=str(sandbox))
    result_text = response["result"]

    judge = llm_judge(
        question=(
            "Does this response describe a plan to analyze domain insights that includes: "
            "(1) loading or selecting a domain framework, "
            "(2) reading session files, "
            "(3) generating insights or recommendations?"
        ),
        context=result_text,
        test_id="retrospect_domain_smoke",
    )

    (workspace / "retrospect_domain_smoke.yaml").write_text(yaml.dump({
        "status": "pass" if judge["verdict"] == "YES" else "fail",
        "judge_verdict": judge["verdict"],
        "judge_reason": judge["reason"],
        "cost_usd": response["cost_usd"] + judge["cost_usd"],
    }, default_flow_style=False, sort_keys=False))

    assert judge["verdict"] == "YES", f"Judge said NO: {judge['reason']}"
