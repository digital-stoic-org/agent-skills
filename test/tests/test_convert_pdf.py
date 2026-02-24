"""
test_convert_pdf.py — L1/L3 behavioral test for convert-pdf skill.
Smoke test: PDF conversion request → step-by-step plan with Docling + output path.
"""
import pytest
import yaml

from harness.behavioral import check_cost_cap, invoke_skill, llm_judge

SKILL_PATH = "/workspace/skills/convert-pdf/SKILL.md"
PLUGIN_DIR = "/workspace/dstoic"


@pytest.mark.behavioral
def test_convert_pdf_plan_and_output(workspace, sandbox):
    """convert-pdf produces a conversion plan with Docling and output location."""
    check_cost_cap("convert_pdf_smoke")

    prompt = "Convert my PDF at /tmp/research-paper.pdf to markdown."

    response = invoke_skill(prompt, SKILL_PATH, test_id="convert_pdf_smoke",
                             plugin_dir=PLUGIN_DIR, skip_permissions=True,
                             cwd=str(sandbox))
    result_text = response["result"]

    judge = llm_judge(
        question=(
            "Does this response describe a plan to convert a PDF to markdown that includes: "
            "(1) installing or checking for docling, "
            "(2) a docling command or conversion step, "
            "(3) an output location?"
        ),
        context=result_text,
        test_id="convert_pdf_smoke",
    )

    (workspace / "convert_pdf_smoke.yaml").write_text(yaml.dump({
        "status": "pass" if judge["verdict"] == "YES" else "fail",
        "judge_verdict": judge["verdict"],
        "judge_reason": judge["reason"],
        "cost_usd": response["cost_usd"] + judge["cost_usd"],
    }, default_flow_style=False, sort_keys=False))

    assert judge["verdict"] == "YES", f"Judge said NO: {judge['reason']}"
