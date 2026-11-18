"""
test_deploy_surge.py — L1/L3 behavioral test for deploy-surge skill.
Smoke test: deploy request → plan with surge command + inventory update.
"""
import pytest
import yaml

from harness.behavioral import check_cost_cap, invoke_skill, llm_judge

SKILL_PATH = "/workspace/skills/deploy-surge/SKILL.md"
PLUGIN_DIR = "/workspace/dstoic"


@pytest.mark.behavioral
def test_deploy_surge_plan(workspace, sandbox):
    """deploy-surge produces a deployment plan with surge and inventory tracking."""
    check_cost_cap("deploy_surge_smoke")

    prompt = "Deploy the ./dist folder to surge with description 'landing page v2'."

    response = invoke_skill(prompt, SKILL_PATH, test_id="deploy_surge_smoke",
                             plugin_dir=PLUGIN_DIR, skip_permissions=True,
                             cwd=str(sandbox))
    result_text = response["result"]

    judge = llm_judge(
        question=(
            "Does this response describe a plan to deploy to Surge.sh that includes: "
            "(1) checking or installing surge, "
            "(2) a surge deploy command with a domain, "
            "(3) updating an inventory file?"
        ),
        context=result_text,
        test_id="deploy_surge_smoke",
    )

    (workspace / "deploy_surge_smoke.yaml").write_text(yaml.dump({
        "status": "pass" if judge["verdict"] == "YES" else "fail",
        "judge_verdict": judge["verdict"],
        "judge_reason": judge["reason"],
        "cost_usd": response["cost_usd"] + judge["cost_usd"],
    }, default_flow_style=False, sort_keys=False))

    assert judge["verdict"] == "YES", f"Judge said NO: {judge['reason']}"
