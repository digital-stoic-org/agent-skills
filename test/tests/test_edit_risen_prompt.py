"""
test_edit_risen_prompt.py — L1/L3 behavioral test for edit-risen-prompt skill.
Smoke test: create mode request → structured RISEN output plan.
"""
import pytest
import yaml

from harness.behavioral import check_cost_cap, invoke_skill, llm_judge

SKILL_PATH = "/workspace/skills/edit-risen-prompt/SKILL.md"
PLUGIN_DIR = "/workspace/dstoic"


@pytest.mark.behavioral
def test_edit_risen_prompt_plan(workspace, sandbox):
    """edit-risen-prompt produces a plan to transform notes into RISEN structure."""
    check_cost_cap("edit_risen_prompt_smoke")

    prompt = "Create a RISEN prompt from my notes at /tmp/project-notes.md."

    response = invoke_skill(prompt, SKILL_PATH, test_id="edit_risen_prompt_smoke",
                             plugin_dir=PLUGIN_DIR, skip_permissions=True,
                             cwd=str(sandbox))
    result_text = response["result"]

    judge = llm_judge(
        question=(
            "Does this response describe a plan to create a structured RISEN prompt that includes: "
            "(1) reading the input file, "
            "(2) organizing content into RISEN sections (Role, INPUT, STEPS, EXPECTATIONS, NARROWING), "
            "(3) writing the output to a new file?"
        ),
        context=result_text,
        test_id="edit_risen_prompt_smoke",
    )

    (workspace / "edit_risen_prompt_smoke.yaml").write_text(yaml.dump({
        "status": "pass" if judge["verdict"] == "YES" else "fail",
        "judge_verdict": judge["verdict"],
        "judge_reason": judge["reason"],
        "cost_usd": response["cost_usd"] + judge["cost_usd"],
    }, default_flow_style=False, sort_keys=False))

    assert judge["verdict"] == "YES", f"Judge said NO: {judge['reason']}"
