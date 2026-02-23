"""
test_capture.py — L1/L3 behavioral test for gtd capture skill.
Smoke test: captured item contains [created::] field with today's date.
"""
from pathlib import Path

import pytest
import yaml

from harness.behavioral import check_cost_cap, invoke_skill, llm_judge

SKILL_PATH = "/workspace/gtd-skills/capture/SKILL.md"
OUTPUT_DIR = Path("/workspace/output")
SCRATCH_INBOX = OUTPUT_DIR / "scratch-inbox.md"


@pytest.fixture(autouse=True)
def scratch_inbox():
    """Create a writable scratch inbox for capture tests."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    SCRATCH_INBOX.write_text("# GTD Inbox\n\n### New\n### Prio 1\n")
    yield SCRATCH_INBOX


@pytest.mark.behavioral
def test_capture_smoke(workspace):
    """Captured task is inserted with [created:: YYYY-MM-DD] field."""
    test_id = "capture_smoke"
    check_cost_cap(test_id)

    prompt = (
        f"Capture this item to the GTD inbox: buy groceries for the week. "
        f"Use {SCRATCH_INBOX} as the inbox file path (not the default path)."
    )

    response = invoke_skill(
        prompt, SKILL_PATH, test_id=test_id,
        allowed_tools=["Read", "Edit", "Bash"],
    )
    result_text = response["result"]

    # Primary assertion: verify the file was actually written with [created::]
    inbox_content = SCRATCH_INBOX.read_text()
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

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / f"{test_id}.yaml").write_text(yaml.dump({
        "status": "pass" if judge["verdict"] == "YES" else "fail",
        "judge_verdict": judge["verdict"],
        "judge_reason": judge["reason"],
        "inbox_after_capture": inbox_content,
        "cost_usd": response["cost_usd"] + judge["cost_usd"],
    }, default_flow_style=False, sort_keys=False))

    assert judge["verdict"] == "YES", f"Judge said NO: {judge['reason']}\nInbox content:\n{inbox_content}"
