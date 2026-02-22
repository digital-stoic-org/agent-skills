"""
test_edit_tool.py — L1/L3 behavioral tests for the edit-tool orchestration skill.

T4: MODIFY + fork — edit-tool uses Edit approach (not Write/overwrite) for modifications
T5: Uncertain type — edit-tool delegates/asks to clarify which tool type
T6: Routing — "create tool for X" routes to edit-skill (not edit-command)
T7: Context pollution framing — output references pollution cost framework
"""
from pathlib import Path

import pytest
import yaml

from harness.behavioral import check_cost_cap, invoke_skill, llm_judge

EDIT_TOOL_PATH = "/workspace/skills/edit-tool/SKILL.md"
OUTPUT_DIR = Path("/workspace/output")


# ── T4: MODIFY + fork ────────────────────────────────────────────────────────

@pytest.mark.behavioral
def test_T4_modify_uses_edit(workspace):
    """T4: edit-tool recommends Edit approach (not Write/overwrite) for modifying an existing skill."""
    check_cost_cap("T4")

    prompt = (
        "I have an existing skill called 'greet-user' at dstoic/skills/greet-user/SKILL.md. "
        "I want to modify it to also support greeting in Spanish. "
        "How should I update this skill?"
    )

    response = invoke_skill(prompt, EDIT_TOOL_PATH, test_id="T4")
    result_text = response["result"]

    judge_response = llm_judge(
        question=(
            "Does this response recommend using an Edit-based approach (editing/modifying the existing file) "
            "rather than a Write/overwrite approach (creating a completely new file from scratch)? "
            "Look for language like 'edit', 'modify', 'update' vs 'write', 'create new', 'overwrite'."
        ),
        context=result_text,
        test_id="T4",
    )

    result_file = OUTPUT_DIR / "T4.yaml"
    result_file.write_text(yaml.dump({
        "status": "pass" if judge_response["verdict"] == "YES" else "fail",
        "result": result_text[:500],
        "judge_verdict": judge_response["verdict"],
        "judge_reason": judge_response["reason"],
        "cost_usd": response["cost_usd"] + judge_response["cost_usd"],
    }, default_flow_style=False, sort_keys=False))

    assert judge_response["verdict"] == "YES", (
        f"Judge said NO: {judge_response['reason']}\n"
        f"Skill response: {result_text[:300]}"
    )


# ── T5: Uncertain type ───────────────────────────────────────────────────────

@pytest.mark.behavioral
def test_T5_uncertain_type_delegates(workspace):
    """T5: edit-tool asks for clarification when request type is ambiguous."""
    check_cost_cap("T5")

    prompt = (
        "Make something for managing my daily standup notes. "
        "I'm not sure what form it should take."
    )

    response = invoke_skill(prompt, EDIT_TOOL_PATH, test_id="T5")
    result_text = response["result"]

    judge_response = llm_judge(
        question=(
            "Does this response ask the user to clarify what type of tool they want "
            "(e.g., skill vs command vs agent vs script) or present options for different "
            "tool types? It should NOT just pick one type and build it without asking."
        ),
        context=result_text,
        test_id="T5",
    )

    result_file = OUTPUT_DIR / "T5.yaml"
    result_file.write_text(yaml.dump({
        "status": "pass" if judge_response["verdict"] == "YES" else "fail",
        "result": result_text[:500],
        "judge_verdict": judge_response["verdict"],
        "judge_reason": judge_response["reason"],
        "cost_usd": response["cost_usd"] + judge_response["cost_usd"],
    }, default_flow_style=False, sort_keys=False))

    assert judge_response["verdict"] == "YES", (
        f"Judge said NO: {judge_response['reason']}\n"
        f"Skill response: {result_text[:300]}"
    )


# ── T6: Routing to edit-skill ─────────────────────────────────────────────────

@pytest.mark.behavioral
def test_T6_routes_to_edit_skill(workspace):
    """T6: edit-tool routes 'create a tool for X' to edit-skill, not edit-command."""
    check_cost_cap("T6")

    prompt = (
        "I want to create a new tool that helps me format markdown tables. "
        "It should be triggered when I say 'format table' or 'fix table'."
    )

    response = invoke_skill(prompt, EDIT_TOOL_PATH, test_id="T6")
    result_text = response["result"]

    judge_response = llm_judge(
        question=(
            "Does this response route to edit-skill (or recommend creating a skill) "
            "rather than edit-command or creating a command? "
            "It should NOT mention edit-command or suggest creating a command file. "
            "Look for references to 'skill', 'edit-skill', 'SKILL.md' as positive signals."
        ),
        context=result_text,
        test_id="T6",
    )

    result_file = OUTPUT_DIR / "T6.yaml"
    result_file.write_text(yaml.dump({
        "status": "pass" if judge_response["verdict"] == "YES" else "fail",
        "result": result_text[:500],
        "judge_verdict": judge_response["verdict"],
        "judge_reason": judge_response["reason"],
        "cost_usd": response["cost_usd"] + judge_response["cost_usd"],
    }, default_flow_style=False, sort_keys=False))

    assert judge_response["verdict"] == "YES", (
        f"Judge said NO: {judge_response['reason']}\n"
        f"Skill response: {result_text[:300]}"
    )


# ── T7: Context pollution framing ─────────────────────────────────────────────

@pytest.mark.behavioral
def test_T7_pollution_framing(workspace):
    """T7: edit-tool output references context pollution cost framework."""
    check_cost_cap("T7")

    prompt = (
        "I need to create a tool that analyzes my git history and generates "
        "a weekly summary report. It produces about 2000 tokens of output."
    )

    response = invoke_skill(prompt, EDIT_TOOL_PATH, test_id="T7")
    result_text = response["result"]

    judge_response = llm_judge(
        question=(
            "Does this response discuss context pollution, token cost, or pollution cost "
            "as part of its decision rationale? It should reference concepts like "
            "'pollution', 'token budget', 'context cost', or 'context: fork' for isolation. "
            "The key signal is that the decision framework is based on pollution/context cost, "
            "not on whether it's 'user-triggered vs auto-invoked'."
        ),
        context=result_text,
        test_id="T7",
    )

    result_file = OUTPUT_DIR / "T7.yaml"
    result_file.write_text(yaml.dump({
        "status": "pass" if judge_response["verdict"] == "YES" else "fail",
        "result": result_text[:500],
        "judge_verdict": judge_response["verdict"],
        "judge_reason": judge_response["reason"],
        "cost_usd": response["cost_usd"] + judge_response["cost_usd"],
    }, default_flow_style=False, sort_keys=False))

    assert judge_response["verdict"] == "YES", (
        f"Judge said NO: {judge_response['reason']}\n"
        f"Skill response: {result_text[:300]}"
    )
