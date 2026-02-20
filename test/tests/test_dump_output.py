"""
test_dump_output.py — L1/L3 behavioral test for dump-output skill.
Smoke test: toggle request → confirmation message.
"""
from pathlib import Path

import pytest
import yaml

from harness.behavioral import check_cost_cap, invoke_skill, llm_judge

SKILL_PATH = "/workspace/skills/dump-output/SKILL.md"
OUTPUT_DIR = Path("/workspace/output")


@pytest.mark.behavioral
def test_dump_output_toggle_confirmation(workspace):
    """dump-output responds with a confirmation when toggled."""
    check_cost_cap("dump_output_smoke")

    prompt = "Enable output dumping for this session."

    response = invoke_skill(prompt, SKILL_PATH, test_id="dump_output_smoke")
    result_text = response["result"]

    judge = llm_judge(
        question="Does this response confirm that output dumping has been enabled or toggled, or explain how it will work?",
        context=result_text,
        test_id="dump_output_smoke",
    )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "dump_output_smoke.yaml").write_text(yaml.dump({
        "status": "pass" if judge["verdict"] == "YES" else "fail",
        "judge_verdict": judge["verdict"],
        "judge_reason": judge["reason"],
        "cost_usd": response["cost_usd"] + judge["cost_usd"],
    }, default_flow_style=False, sort_keys=False))

    assert judge["verdict"] == "YES", f"Judge said NO: {judge['reason']}"
