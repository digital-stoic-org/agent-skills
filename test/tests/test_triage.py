"""
test_triage.py — L1/L3 behavioral test for gtd triage skill.
Smoke test: triage output shows routing plan before edits (propose-then-apply).
"""
from pathlib import Path

import pytest
import yaml

from harness.behavioral import check_cost_cap, invoke_skill, llm_judge

SKILL_PATH = "/workspace/gtd-skills/triage/SKILL.md"
OUTPUT_DIR = Path("/workspace/output")
SCRATCH_INBOX = OUTPUT_DIR / "triage-scratch-inbox.md"


@pytest.fixture(autouse=True)
def scratch_inbox():
    """Create a scratch inbox with test items for triage."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    SCRATCH_INBOX.write_text(
        "# GTD Inbox\n\n"
        "### New\n"
        "- buy milk [created:: 2026-02-23]\n"
        "- call dentist [created:: 2026-02-23]\n"
        "### Prio 1\n"
    )
    yield SCRATCH_INBOX


@pytest.mark.behavioral
def test_triage_smoke(workspace):
    """Triage produces a routing plan showing destination and tags for each item."""
    test_id = "triage_smoke"
    check_cost_cap(test_id)

    prompt = (
        f"Run GTD triage on the inbox at {SCRATCH_INBOX}. "
        f"Do NOT apply routing edits — just show me the triage plan (what you would route where). "
        f"There are no project files available, so suggest generic destinations."
    )

    response = invoke_skill(
        prompt, SKILL_PATH, test_id=test_id,
        allowed_tools=["Read", "Glob", "Grep"],
    )
    result_text = response["result"]

    judge = llm_judge(
        question=(
            "Does the response show a triage routing plan listing each inbox item "
            "(buy milk, call dentist) with a proposed destination and tags, "
            "before any edits are applied?"
        ),
        context=result_text,
        test_id=test_id,
    )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / f"{test_id}.yaml").write_text(yaml.dump({
        "status": "pass" if judge["verdict"] == "YES" else "fail",
        "judge_verdict": judge["verdict"],
        "judge_reason": judge["reason"],
        "cost_usd": response["cost_usd"] + judge["cost_usd"],
    }, default_flow_style=False, sort_keys=False))

    assert judge["verdict"] == "YES", f"Judge said NO: {judge['reason']}"
