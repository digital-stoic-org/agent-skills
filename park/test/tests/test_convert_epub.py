"""
test_convert_epub.py — L1/L3 behavioral test for convert-epub skill.
Smoke test: EPUB conversion request → step-by-step plan with dependency install + output path.
"""
import pytest
import yaml

from harness.behavioral import check_cost_cap, invoke_skill, llm_judge

SKILL_PATH = "/workspace/skills/convert-epub/SKILL.md"
PLUGIN_DIR = "/workspace/dstoic"


@pytest.mark.behavioral
def test_convert_epub_plan_and_output(workspace, sandbox):
    """convert-epub produces a conversion plan with dependency install and output path."""
    check_cost_cap("convert_epub_smoke")

    prompt = "Convert my ebook at /tmp/mybook.epub to markdown for analysis."

    response = invoke_skill(prompt, SKILL_PATH, test_id="convert_epub_smoke",
                             plugin_dir=PLUGIN_DIR, skip_permissions=True,
                             cwd=str(sandbox))
    result_text = response["result"]

    judge = llm_judge(
        question=(
            "Does this response describe a plan to convert an EPUB to markdown that includes: "
            "(1) installing or checking for the epub-to-markdown dependency, "
            "(2) an output location (like .tmp/ directory), "
            "(3) mention of the conversion command or steps?"
        ),
        context=result_text,
        test_id="convert_epub_smoke",
    )

    (workspace / "convert_epub_smoke.yaml").write_text(yaml.dump({
        "status": "pass" if judge["verdict"] == "YES" else "fail",
        "judge_verdict": judge["verdict"],
        "judge_reason": judge["reason"],
        "cost_usd": response["cost_usd"] + judge["cost_usd"],
    }, default_flow_style=False, sort_keys=False))

    assert judge["verdict"] == "YES", f"Judge said NO: {judge['reason']}"
