"""
test_investigate.py — L1/L3 behavioral test for investigate skill.
Smoke test: technical question → analysis output.
"""
import json
from pathlib import Path

import pytest

from harness.behavioral import check_cost_cap, invoke_skill, llm_judge

SKILL_PATH = "/workspace/skills/investigate/SKILL.md"
OUTPUT_DIR = Path("/workspace/output")


@pytest.mark.behavioral
def test_investigate_analysis_output(workspace):
    """investigate produces a structured analysis for a technical question."""
    check_cost_cap("investigate_smoke")

    prompt = (
        "Investigate: What are the trade-offs between using SQLite vs PostgreSQL "
        "for a CLI tool that needs local-first data storage with occasional sync?"
    )

    response = invoke_skill(prompt, SKILL_PATH, test_id="investigate_smoke")
    result_text = response["result"]

    judge = llm_judge(
        question="Does this response provide a structured technical analysis with trade-offs, considerations, or recommendations (not just a one-line answer)?",
        context=result_text,
        test_id="investigate_smoke",
    )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "investigate_smoke.json").write_text(json.dumps({
        "status": "pass" if judge["verdict"] == "YES" else "fail",
        "judge_verdict": judge["verdict"],
        "judge_reason": judge["reason"],
        "cost_usd": response["cost_usd"] + judge["cost_usd"],
    }, indent=2))

    assert judge["verdict"] == "YES", f"Judge said NO: {judge['reason']}"
