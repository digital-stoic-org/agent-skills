"""
test_retrospect_collab.py — L1/L3 behavioral test for retrospect-collab skill.
Smoke test: collab analysis request → plan with dimensions + output path.
"""
import pytest
import yaml

from harness.behavioral import check_cost_cap, invoke_skill, llm_judge

SKILL_PATH = "/workspace/skills/retrospect-collab/SKILL.md"
PLUGIN_DIR = "/workspace/dstoic"


@pytest.mark.behavioral
def test_retrospect_collab_plan(workspace, sandbox):
    """retrospect-collab produces an analysis plan with technical + cognitive dimensions."""
    check_cost_cap("retrospect_collab_smoke")

    prompt = "Analyze collaboration patterns from the last 7 days."

    response = invoke_skill(prompt, SKILL_PATH, test_id="retrospect_collab_smoke",
                             plugin_dir=PLUGIN_DIR, skip_permissions=True,
                             cwd=str(sandbox))
    result_text = response["result"]

    judge = llm_judge(
        question=(
            "Does this response describe a plan to analyze collaboration that includes: "
            "(1) loading or filtering session files, "
            "(2) analyzing patterns like context management or guidance quality, "
            "(3) generating insights or a report file?"
        ),
        context=result_text,
        test_id="retrospect_collab_smoke",
    )

    (workspace / "retrospect_collab_smoke.yaml").write_text(yaml.dump({
        "status": "pass" if judge["verdict"] == "YES" else "fail",
        "judge_verdict": judge["verdict"],
        "judge_reason": judge["reason"],
        "cost_usd": response["cost_usd"] + judge["cost_usd"],
    }, default_flow_style=False, sort_keys=False))

    assert judge["verdict"] == "YES", f"Judge said NO: {judge['reason']}"
