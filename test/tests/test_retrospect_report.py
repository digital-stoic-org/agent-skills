"""
test_retrospect_report.py — L1/L3 behavioral test for retrospect-report skill.
Smoke test: report request → aggregate analysis plan with metrics + visualizations.
"""
import pytest
import yaml

from harness.behavioral import check_cost_cap, invoke_skill, llm_judge

SKILL_PATH = "/workspace/skills/retrospect-report/SKILL.md"
PLUGIN_DIR = "/workspace/dstoic"


@pytest.mark.behavioral
def test_retrospect_report_plan(workspace, sandbox):
    """retrospect-report produces an analysis plan with metrics and output path."""
    check_cost_cap("retrospect_report_smoke")

    prompt = "Generate a retrospective report for the last 7 days."

    response = invoke_skill(prompt, SKILL_PATH, test_id="retrospect_report_smoke",
                             plugin_dir=PLUGIN_DIR, skip_permissions=True,
                             cwd=str(sandbox))
    result_text = response["result"]

    judge = llm_judge(
        question=(
            "Does this response describe a plan to generate an aggregate report that includes: "
            "(1) filtering sessions by timeframe, "
            "(2) computing metrics like session counts or averages, "
            "(3) writing a report file?"
        ),
        context=result_text,
        test_id="retrospect_report_smoke",
    )

    (workspace / "retrospect_report_smoke.yaml").write_text(yaml.dump({
        "status": "pass" if judge["verdict"] == "YES" else "fail",
        "judge_verdict": judge["verdict"],
        "judge_reason": judge["reason"],
        "cost_usd": response["cost_usd"] + judge["cost_usd"],
    }, default_flow_style=False, sort_keys=False))

    assert judge["verdict"] == "YES", f"Judge said NO: {judge['reason']}"
