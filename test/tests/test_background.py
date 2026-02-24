"""
test_background.py — L1/L3 behavioral test for background skill.
Smoke test: background task request → confirmation with status check instructions.
"""
import pytest
import yaml

from harness.behavioral import check_cost_cap, invoke_skill, llm_judge

SKILL_PATH = "/workspace/skills/background/SKILL.md"
PLUGIN_DIR = "/workspace/dstoic"


@pytest.mark.behavioral
def test_background_starts_task_and_confirms(workspace, sandbox):
    """background skill starts a task and confirms with status instructions."""
    check_cost_cap("background_smoke")

    prompt = "Run this in the background: scan all Python files for TODO comments."

    response = invoke_skill(prompt, SKILL_PATH, test_id="background_smoke",
                             plugin_dir=PLUGIN_DIR, skip_permissions=True,
                             cwd=str(sandbox))
    result_text = response["result"]

    judge = llm_judge(
        question=(
            "Does this response confirm that a background task has been started (or explain how it would be started), "
            "AND tell the user how to check on it later (e.g., TaskOutput, /tasks, or polling)?"
        ),
        context=result_text,
        test_id="background_smoke",
    )

    (workspace / "background_smoke.yaml").write_text(yaml.dump({
        "status": "pass" if judge["verdict"] == "YES" else "fail",
        "judge_verdict": judge["verdict"],
        "judge_reason": judge["reason"],
        "cost_usd": response["cost_usd"] + judge["cost_usd"],
    }, default_flow_style=False, sort_keys=False))

    assert judge["verdict"] == "YES", f"Judge said NO: {judge['reason']}"
