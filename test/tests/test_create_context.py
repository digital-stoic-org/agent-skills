"""
test_create_context.py — L1/L3 behavioral test for create-context skill.
Smoke test: bootstrap request → scan + prioritize + baseline plan.
"""
import pytest
import yaml

from harness.behavioral import check_cost_cap, invoke_skill, llm_judge

SKILL_PATH = "/workspace/skills/create-context/SKILL.md"
PLUGIN_DIR = "/workspace/dstoic"


@pytest.mark.behavioral
def test_create_context_plan(workspace, sandbox):
    """create-context produces a plan to bootstrap from .in/ to .ctx/ with manifest."""
    check_cost_cap("create_context_smoke")

    prompt = "Create baseline context for this project from the .in/ folder."

    response = invoke_skill(prompt, SKILL_PATH, test_id="create_context_smoke",
                             plugin_dir=PLUGIN_DIR, skip_permissions=True,
                             cwd=str(sandbox))
    result_text = response["result"]

    judge = llm_judge(
        question=(
            "Does this response describe a plan to create project context that includes: "
            "(1) scanning an .in/ or input folder, "
            "(2) prioritizing or classifying files, "
            "(3) generating a manifest or baseline context file?"
        ),
        context=result_text,
        test_id="create_context_smoke",
    )

    (workspace / "create_context_smoke.yaml").write_text(yaml.dump({
        "status": "pass" if judge["verdict"] == "YES" else "fail",
        "judge_verdict": judge["verdict"],
        "judge_reason": judge["reason"],
        "cost_usd": response["cost_usd"] + judge["cost_usd"],
    }, default_flow_style=False, sort_keys=False))

    assert judge["verdict"] == "YES", f"Judge said NO: {judge['reason']}"
