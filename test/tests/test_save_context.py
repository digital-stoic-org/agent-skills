"""
test_save_context.py — L1/L3 behavioral test for save-context skill.
Smoke test: save request → gather + synthesize + write plan.
"""
import pytest
import yaml

from harness.behavioral import check_cost_cap, invoke_skill, llm_judge

SKILL_PATH = "/workspace/skills/save-context/SKILL.md"
PLUGIN_DIR = "/workspace/dstoic"


@pytest.mark.behavioral
def test_save_context_plan(workspace, sandbox):
    """save-context produces a plan to gather state and write a CONTEXT file."""
    check_cost_cap("save_context_smoke")

    prompt = "Save context for the my-feature stream with description 'auth module done'."

    response = invoke_skill(prompt, SKILL_PATH, test_id="save_context_smoke",
                             plugin_dir=PLUGIN_DIR, skip_permissions=True,
                             cwd=str(sandbox))
    result_text = response["result"]

    judge = llm_judge(
        question=(
            "Does this response describe a plan to save session context that includes: "
            "(1) gathering current state (tasks, files, or conversation), "
            "(2) synthesizing into a structured format, "
            "(3) writing a CONTEXT file?"
        ),
        context=result_text,
        test_id="save_context_smoke",
    )

    (workspace / "save_context_smoke.yaml").write_text(yaml.dump({
        "status": "pass" if judge["verdict"] == "YES" else "fail",
        "judge_verdict": judge["verdict"],
        "judge_reason": judge["reason"],
        "cost_usd": response["cost_usd"] + judge["cost_usd"],
    }, default_flow_style=False, sort_keys=False))

    assert judge["verdict"] == "YES", f"Judge said NO: {judge['reason']}"
