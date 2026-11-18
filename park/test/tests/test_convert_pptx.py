"""
test_convert_pptx.py — L1/L3 behavioral test for convert-pptx skill.
Smoke test: PPTX conversion request → step-by-step plan with markitdown + output path.
"""
import pytest
import yaml

from harness.behavioral import check_cost_cap, invoke_skill, llm_judge

SKILL_PATH = "/workspace/skills/convert-pptx/SKILL.md"
PLUGIN_DIR = "/workspace/dstoic"


@pytest.mark.behavioral
def test_convert_pptx_plan_and_output(workspace, sandbox):
    """convert-pptx produces a conversion plan with markitdown and output location."""
    check_cost_cap("convert_pptx_smoke")

    prompt = "Convert my PowerPoint slides at /tmp/presentation.pptx to markdown."

    response = invoke_skill(prompt, SKILL_PATH, test_id="convert_pptx_smoke",
                             plugin_dir=PLUGIN_DIR, skip_permissions=True,
                             cwd=str(sandbox))
    result_text = response["result"]

    judge = llm_judge(
        question=(
            "Does this response describe a plan to convert a PPTX to markdown that includes: "
            "(1) installing or checking for markitdown, "
            "(2) a markitdown command or conversion step, "
            "(3) an output location?"
        ),
        context=result_text,
        test_id="convert_pptx_smoke",
    )

    (workspace / "convert_pptx_smoke.yaml").write_text(yaml.dump({
        "status": "pass" if judge["verdict"] == "YES" else "fail",
        "judge_verdict": judge["verdict"],
        "judge_reason": judge["reason"],
        "cost_usd": response["cost_usd"] + judge["cost_usd"],
    }, default_flow_style=False, sort_keys=False))

    assert judge["verdict"] == "YES", f"Judge said NO: {judge['reason']}"
