"""
test_focus.py — L1/L3 behavioral test for gtd focus skill.
Smoke test: output contains ranked tasks with source project paths.
"""
from pathlib import Path

import pytest
import yaml

from harness.behavioral import check_cost_cap, invoke_skill, llm_judge

SKILL_PATH = "/workspace/gtd-skills/focus/SKILL.md"
PLUGIN_DIR = "/workspace/dstoic"


def _create_project(vault_dir: Path, project_dir: str, content: str) -> None:
    """Create a project task file in the scratch vault."""
    d = vault_dir / "03-projects" / project_dir
    d.mkdir(parents=True, exist_ok=True)
    filename = f"01-{project_dir.split('-', 1)[1]}.md" if '-' in project_dir else "01-tasks.md"
    (d / filename).write_text(content)


@pytest.mark.behavioral
def test_focus_smoke(workspace, sandbox):
    """Focus returns ranked tasks with source project paths."""
    test_id = "focus_smoke"
    check_cost_cap(test_id)

    vault_dir = sandbox / "focus-vault"
    vault_dir.mkdir(parents=True, exist_ok=True)

    _create_project(vault_dir, "01-alpha", (
        "# Alpha\n\n"
        "## Top\n"
        "- [ ] Deploy alpha to prod #frog [created:: 2026-02-01]\n"
        "- [x] Setup CI pipeline\n\n"
        "## Next Actions\n"
        "- [ ] Write migration docs #next [created:: 2026-02-20]\n"
    ))

    _create_project(vault_dir, "10-beta", (
        "# Beta\n\n"
        "## Next Actions\n"
        "- [ ] Review beta proposal #next [created:: 2026-02-22]\n"
        "- [ ] Order equipment #waiting [created:: 2026-02-10]\n"
    ))

    _create_project(vault_dir, "30-gamma", (
        "# Gamma\n\n"
        "## Backlog\n"
        "- [ ] Research gamma options [created:: 2026-01-15]\n"
    ))

    prompt = (
        f"Generate the daily focus list. "
        f"Use {vault_dir} as the vault root (glob 03-projects/*/01-*.md under it). "
        f"There is no coaching pulse file — skip energy filter. "
        f"Today's date is 2026-02-23."
    )

    response = invoke_skill(
        prompt, SKILL_PATH, test_id=test_id,
        allowed_tools=["Glob", "Read"],
        plugin_dir=PLUGIN_DIR, skip_permissions=True,
        cwd=str(sandbox),
    )
    result_text = response["result"]

    judge = llm_judge(
        question=(
            "Does the response contain a ranked focus list of 3-5 tasks where: "
            "(1) each task shows a source project path containing '03-projects/', "
            "(2) the top-ranked task is 'Deploy alpha to prod' (highest priority project + frog tag), "
            "(3) tasks include scores or ranking info?"
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

    assert judge["verdict"] == "YES", f"Judge said NO: {judge['reason']}\nFocus output:\n{result_text}"
