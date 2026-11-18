"""
test_edit_tool.py — L1/L3 behavioral tests for the edit-tool orchestration skill.

edit_tool_modify: MODIFY + fork — edit-tool uses Edit approach (not Write/overwrite) for modifications
edit_tool_uncertain: Uncertain type — edit-tool presents options or explains triage reasoning
edit_tool_pollution: Pollution cost routing — high-token request routes to progressive disclosure or fork
edit_tool_command_to_skill: Command → skill routing — "slash command" request creates a skill (not a command file)

Uses --plugin-dir for native skill discovery (edit-tool is the unified editor)
and --dangerously-skip-permissions (sandboxed Docker) for full e2e validation.
"""
import pytest
import yaml

from harness.behavioral import check_cost_cap, invoke_skill, llm_judge

EDIT_TOOL_PATH = "/workspace/skills/edit-tool/SKILL.md"
PLUGIN_DIR = "/workspace/dstoic"


# ── edit_tool_modify: MODIFY + fork ──────────────────────────────────────────

@pytest.mark.behavioral
def test_edit_tool_modify(workspace, sandbox):
    """edit_tool_modify: edit-tool recommends Edit approach (not Write/overwrite) for modifying an existing skill."""
    check_cost_cap("edit_tool_modify")

    prompt = (
        "I have an existing skill called 'greet-user' at dstoic/skills/greet-user/SKILL.md. "
        "I want to modify it to also support greeting in Spanish. "
        "How should I update this skill?"
    )

    response = invoke_skill(prompt, EDIT_TOOL_PATH, test_id="edit_tool_modify",
                             plugin_dir=PLUGIN_DIR, skip_permissions=True,
                             cwd=str(sandbox))
    result_text = response["result"]

    judge_response = llm_judge(
        question=(
            "Does this response recommend or use an Edit-based approach (editing/modifying the existing file) "
            "rather than creating a completely new file from scratch? "
            "Acceptable answers include: recommending Edit tool, suggesting surgical edits, "
            "explaining how to modify specific sections, or actually performing edits. "
            "Also acceptable: asking to see the file first before editing (this implies Edit approach). "
            "Only answer NO if it explicitly recommends overwriting/recreating the entire file."
        ),
        context=result_text,
        test_id="edit_tool_modify",
    )

    result_file = workspace / "edit_tool_modify.yaml"
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


# ── edit_tool_pollution: Pollution cost routing ──────────────────────────────

@pytest.mark.behavioral
def test_edit_tool_pollution(workspace, sandbox):
    """edit_tool_pollution: edit-tool routes verbose/complex skills to progressive disclosure or context:fork."""
    check_cost_cap("edit_tool_pollution")

    prompt = (
        "I want to create a new skill for running full security audits across my codebase. "
        "It needs to check OWASP top 10, scan for secrets, analyze dependencies, and "
        "generate a detailed report. The instructions will be quite long — probably 1500+ tokens."
    )

    response = invoke_skill(prompt, EDIT_TOOL_PATH, test_id="edit_tool_pollution",
                             plugin_dir=PLUGIN_DIR, skip_permissions=True,
                             cwd=str(sandbox))
    result_text = response["result"]

    judge_response = llm_judge(
        question=(
            "Does this response acknowledge the high token count and recommend or use "
            "progressive disclosure (SKILL.md + reference.md), context:fork, or a sub-agent? "
            "Also acceptable: creating a skill with a reference.md file, or explaining that "
            "the content should be split across files. "
            "Only answer NO if it creates a single monolithic SKILL.md with all content inline "
            "and makes no mention of splitting, reference.md, fork, or sub-agent."
        ),
        context=result_text,
        test_id="edit_tool_pollution",
    )

    result_file = workspace / "edit_tool_pollution.yaml"
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


# ── edit_tool_command_to_skill: Command → skill routing ──────────────────────

@pytest.mark.behavioral
def test_edit_tool_command_to_skill(workspace, sandbox):
    """edit_tool_command_to_skill: edit-tool routes 'slash command' requests to skill creation (not commands/ directory)."""
    check_cost_cap("edit_tool_command_to_skill")

    prompt = (
        "Create a new slash command called /deploy-preview that runs my preview deployment script. "
        "It should accept an environment argument."
    )

    response = invoke_skill(prompt, EDIT_TOOL_PATH, test_id="edit_tool_command_to_skill",
                             plugin_dir=PLUGIN_DIR, skip_permissions=True,
                             cwd=str(sandbox))
    result_text = response["result"]

    judge_response = llm_judge(
        question=(
            "Does this response create or recommend creating a SKILL (SKILL.md in a skills/ directory) "
            "rather than a legacy command file in a commands/ directory? "
            "Acceptable: creating skills/deploy-preview/SKILL.md, recommending a skill, "
            "explaining the triage decision to create a skill, or asking clarifying questions "
            "while framing the solution as a skill. "
            "Answer NO only if it explicitly creates a file in commands/ directory "
            "or recommends the legacy command format."
        ),
        context=result_text,
        test_id="edit_tool_command_to_skill",
    )

    result_file = workspace / "edit_tool_command_to_skill.yaml"
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


# ── edit_tool_uncertain: Uncertain type ──────────────────────────────────────

@pytest.mark.behavioral
def test_edit_tool_uncertain(workspace, sandbox):
    """edit_tool_uncertain: edit-tool presents options or explains triage reasoning for ambiguous requests."""
    check_cost_cap("edit_tool_uncertain")

    prompt = (
        "Make something for managing my daily standup notes. "
        "I'm not sure what form it should take."
    )

    response = invoke_skill(prompt, EDIT_TOOL_PATH, test_id="edit_tool_uncertain",
                             plugin_dir=PLUGIN_DIR, skip_permissions=True,
                             cwd=str(sandbox))
    result_text = response["result"]

    judge_response = llm_judge(
        question=(
            "Does this response show triage reasoning — either by presenting tool type options "
            "(skill vs agent vs script), asking clarifying questions about the use case, "
            "or explaining WHY a particular tool type was chosen? "
            "Acceptable: recommending a skill with explanation of why, asking what form "
            "the user prefers, presenting trade-offs between options. "
            "Answer NO only if it immediately builds something without any triage reasoning, "
            "explanation, or clarification."
        ),
        context=result_text,
        test_id="edit_tool_uncertain",
    )

    result_file = workspace / "edit_tool_uncertain.yaml"
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
