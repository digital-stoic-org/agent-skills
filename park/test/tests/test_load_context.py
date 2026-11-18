"""
test_load_context.py — L1/L3 behavioral test for load-context skill.
Smoke test: load request → stream detection + resume report plan.
"""
import pytest
import yaml

from harness.behavioral import check_cost_cap, invoke_skill, llm_judge

SKILL_PATH = "/workspace/skills/load-context/SKILL.md"
PLUGIN_DIR = "/workspace/dstoic"


@pytest.mark.behavioral
def test_load_context_plan(workspace, sandbox):
    """load-context produces a plan to detect streams and format a resume report."""
    check_cost_cap("load_context_smoke")

    prompt = "Load the context for my-feature stream."

    response = invoke_skill(prompt, SKILL_PATH, test_id="load_context_smoke",
                             plugin_dir=PLUGIN_DIR, skip_permissions=True,
                             cwd=str(sandbox))
    result_text = response["result"]

    judge = llm_judge(
        question=(
            "Does this response describe a plan to load session context that includes: "
            "(1) detecting or reading CONTEXT files, "
            "(2) parsing session state or key-value headers, "
            "(3) formatting a resume report for the user?"
        ),
        context=result_text,
        test_id="load_context_smoke",
    )

    (workspace / "load_context_smoke.yaml").write_text(yaml.dump({
        "status": "pass" if judge["verdict"] == "YES" else "fail",
        "judge_verdict": judge["verdict"],
        "judge_reason": judge["reason"],
        "cost_usd": response["cost_usd"] + judge["cost_usd"],
    }, default_flow_style=False, sort_keys=False))

    assert judge["verdict"] == "YES", f"Judge said NO: {judge['reason']}"
