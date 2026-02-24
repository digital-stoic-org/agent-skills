"""
test_capture.py — L1/L3 behavioral test for gtd capture skill.
Smoke test: captured item contains [created::] field with today's date.
"""
from pathlib import Path

import pytest
import yaml

from harness.behavioral import check_cost_cap, invoke_skill, llm_judge

SKILL_PATH = "/workspace/gtd-skills/capture/SKILL.md"
PLUGIN_DIR = "/workspace/dstoic"


@pytest.mark.behavioral
def test_capture_smoke(workspace, sandbox):
    """Captured task is inserted with [created:: YYYY-MM-DD] field."""
    test_id = "capture_smoke"
    check_cost_cap(test_id)

    scratch_inbox = sandbox / "scratch-inbox.md"
    scratch_inbox.write_text("# GTD Inbox\n\n### New\n### Prio 1\n")

    prompt = (
        f"Capture this item to the GTD inbox: buy groceries for the week. "
        f"Use {scratch_inbox} as the inbox file path (not the default path)."
    )

    response = invoke_skill(
        prompt, SKILL_PATH, test_id=test_id,
        allowed_tools=["Read", "Edit", "Bash"],
        plugin_dir=PLUGIN_DIR, skip_permissions=True,
        cwd=str(sandbox),
    )
    result_text = response["result"]

    # Primary assertion: verify the file was actually written with [created::]
    inbox_content = scratch_inbox.read_text()
    combined_context = (
        f"Skill response:\n{result_text}\n\n"
        f"Inbox file content after capture:\n{inbox_content}"
    )

    judge = llm_judge(
        question=(
            "Looking at the inbox file content after capture, does it contain a task line "
            "with 'buy groceries' and a [created::] field with a real date in YYYY-MM-DD format "
            "(like 2026-02-23, not a literal YYYY-MM-DD placeholder)?"
        ),
        context=combined_context,
        test_id=test_id,
    )

    (workspace / f"{test_id}.yaml").write_text(yaml.dump({
        "status": "pass" if judge["verdict"] == "YES" else "fail",
        "judge_verdict": judge["verdict"],
        "judge_reason": judge["reason"],
        "inbox_after_capture": inbox_content,
        "cost_usd": response["cost_usd"] + judge["cost_usd"],
    }, default_flow_style=False, sort_keys=False))

    assert judge["verdict"] == "YES", f"Judge said NO: {judge['reason']}\nInbox content:\n{inbox_content}"
