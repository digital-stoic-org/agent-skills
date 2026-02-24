"""
test_list_contexts.py — L1/L3 behavioral test for list-contexts skill.
Smoke test: list request → scan plan with glob + metadata extraction.
"""
import pytest
import yaml

from harness.behavioral import check_cost_cap, invoke_skill, llm_judge

SKILL_PATH = "/workspace/skills/list-contexts/SKILL.md"
PLUGIN_DIR = "/workspace/dstoic"


@pytest.mark.behavioral
def test_list_contexts_plan(workspace, sandbox):
    """list-contexts produces a plan to scan and display context files."""
    check_cost_cap("list_contexts_smoke")

    prompt = "List all context files across the repository."

    response = invoke_skill(prompt, SKILL_PATH, test_id="list_contexts_smoke",
                             plugin_dir=PLUGIN_DIR, skip_permissions=True,
                             cwd=str(sandbox))
    result_text = response["result"]

    judge = llm_judge(
        question=(
            "Does this response describe a plan to list context files that includes: "
            "(1) scanning or globbing for CONTEXT files, "
            "(2) extracting metadata like status or timestamps, "
            "(3) displaying results in a table or structured format?"
        ),
        context=result_text,
        test_id="list_contexts_smoke",
    )

    (workspace / "list_contexts_smoke.yaml").write_text(yaml.dump({
        "status": "pass" if judge["verdict"] == "YES" else "fail",
        "judge_verdict": judge["verdict"],
        "judge_reason": judge["reason"],
        "cost_usd": response["cost_usd"] + judge["cost_usd"],
    }, default_flow_style=False, sort_keys=False))

    assert judge["verdict"] == "YES", f"Judge said NO: {judge['reason']}"
