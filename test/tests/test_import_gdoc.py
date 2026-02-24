"""
test_import_gdoc.py — L1/L3 behavioral test for import-gdoc skill.
Smoke test: import request → plan with MCP search + manifest update.
"""
import pytest
import yaml

from harness.behavioral import check_cost_cap, invoke_skill, llm_judge

SKILL_PATH = "/workspace/skills/import-gdoc/SKILL.md"
PLUGIN_DIR = "/workspace/dstoic"


@pytest.mark.behavioral
def test_import_gdoc_plan(workspace, sandbox):
    """import-gdoc produces an import plan with MCP tools and manifest tracking."""
    check_cost_cap("import_gdoc_smoke")

    prompt = "Import Google Docs matching 'project roadmap' into this project."

    response = invoke_skill(prompt, SKILL_PATH, test_id="import_gdoc_smoke",
                             plugin_dir=PLUGIN_DIR, skip_permissions=True,
                             cwd=str(sandbox))
    result_text = response["result"]

    judge = llm_judge(
        question=(
            "Does this response describe a plan to import Google Docs that includes: "
            "(1) searching for docs via Google Drive or MCP, "
            "(2) fetching document content, "
            "(3) saving to a local folder with a manifest or README?"
        ),
        context=result_text,
        test_id="import_gdoc_smoke",
    )

    (workspace / "import_gdoc_smoke.yaml").write_text(yaml.dump({
        "status": "pass" if judge["verdict"] == "YES" else "fail",
        "judge_verdict": judge["verdict"],
        "judge_reason": judge["reason"],
        "cost_usd": response["cost_usd"] + judge["cost_usd"],
    }, default_flow_style=False, sort_keys=False))

    assert judge["verdict"] == "YES", f"Judge said NO: {judge['reason']}"
