"""
test_triage.py — L1/L3 behavioral test for gtd triage skill.
Smoke test: triage output shows routing plan before edits (propose-then-apply).
"""
from pathlib import Path

import pytest
import yaml

from harness.behavioral import check_cost_cap, invoke_skill, llm_judge

SKILL_PATH = "/workspace/gtd-skills/triage/SKILL.md"
PLUGIN_DIR = "/workspace/dstoic"


@pytest.mark.behavioral
def test_triage_smoke(workspace, sandbox):
    """Triage produces a routing plan showing destination and tags for each item."""
    test_id = "triage_smoke"
    check_cost_cap(test_id)

    scratch_inbox = sandbox / "triage-scratch-inbox.md"
    scratch_inbox.write_text(
        "# GTD Inbox\n\n"
        "### New\n"
        "- buy milk [created:: 2026-02-23]\n"
        "- call dentist [created:: 2026-02-23]\n"
        "### Prio 1\n"
    )

    prompt = (
        f"Run GTD triage on the inbox at {scratch_inbox}. "
        f"Do NOT apply routing edits — just show me the triage plan (what you would route where). "
        f"There are no project files available, so suggest generic destinations."
    )

    response = invoke_skill(
        prompt, SKILL_PATH, test_id=test_id,
        allowed_tools=["Read", "Glob", "Grep"],
        plugin_dir=PLUGIN_DIR, skip_permissions=True,
        cwd=str(sandbox),
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

    (workspace / f"{test_id}.yaml").write_text(yaml.dump({
        "status": "pass" if judge["verdict"] == "YES" else "fail",
        "judge_verdict": judge["verdict"],
        "judge_reason": judge["reason"],
        "cost_usd": response["cost_usd"] + judge["cost_usd"],
    }, default_flow_style=False, sort_keys=False))

    assert judge["verdict"] == "YES", f"Judge said NO: {judge['reason']}"
