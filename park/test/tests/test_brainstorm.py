"""
test_brainstorm.py — L1/L3 behavioral test for brainstorm skill.
Smoke test: ideation prompt → structured output with multiple ideas.
"""
import pytest
import yaml

from harness.behavioral import check_cost_cap, invoke_skill, llm_judge

SKILL_PATH = "/workspace/skills/brainstorm/SKILL.md"
PLUGIN_DIR = "/workspace/dstoic"


@pytest.mark.behavioral
def test_brainstorm_structured_output(workspace, sandbox):
    """Brainstorm produces structured output with multiple ideas."""
    check_cost_cap("brainstorm_smoke")

    prompt = "Brainstorm ways to improve developer onboarding for a CLI tool."

    response = invoke_skill(prompt, SKILL_PATH, test_id="brainstorm_smoke",
                             plugin_dir=PLUGIN_DIR, skip_permissions=True,
                             cwd=str(sandbox))
    result_text = response["result"]

    judge = llm_judge(
        question="Does this response contain multiple distinct ideas or options presented in a structured format (numbered list, sections, or categories)?",
        context=result_text,
        test_id="brainstorm_smoke",
    )

    (workspace / "brainstorm_smoke.yaml").write_text(yaml.dump({
        "status": "pass" if judge["verdict"] == "YES" else "fail",
        "judge_verdict": judge["verdict"],
        "judge_reason": judge["reason"],
        "cost_usd": response["cost_usd"] + judge["cost_usd"],
    }, default_flow_style=False, sort_keys=False))

    assert judge["verdict"] == "YES", f"Judge said NO: {judge['reason']}"
