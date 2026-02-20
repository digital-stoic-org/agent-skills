"""
test_edit_skill.py — L1/L3 behavioral tests for the edit-skill skill.

T1: Happy CREATE — deterministic assertions (file exists, YAML valid, token count <500)
T2: Model selection — LLM-judge asserts correct model picked for architectural prompt
T3: Reject verbose — LLM-judge asserts refusal + alternative suggestion returned
"""
import json
from pathlib import Path

import pytest
import yaml

from harness.behavioral import check_cost_cap, invoke_skill, llm_judge

EDIT_SKILL_PATH = "/workspace/skills/edit-skill/SKILL.md"
PICK_MODEL_PATH = "/workspace/skills/pick-model/SKILL.md"
OUTPUT_DIR = Path("/workspace/output")


def _count_tokens_approx(text: str) -> int:
    """Approximate token count: ~4 chars per token (conservative estimate)."""
    return len(text) // 4


# ── T1: Happy CREATE ──────────────────────────────────────────────────────────

@pytest.mark.behavioral
def test_T1_happy_create(workspace):
    """T1: edit-skill creates a valid SKILL.md with correct structure."""
    check_cost_cap("T1")

    prompt = (
        "Create a new skill called 'greet-user' that greets the user by name. "
        "It should be triggered by 'greet' or 'say hello'. "
        "Keep it simple and under 200 tokens."
    )

    response = invoke_skill(prompt, EDIT_SKILL_PATH, test_id="T1")

    result_text = response["result"]
    result_file = OUTPUT_DIR / "T1.json"

    assertions = {
        "is_error": response["is_error"],
        "result_nonempty": bool(result_text.strip()),
        "contains_name_field": "name:" in result_text,
        "contains_description_field": "description:" in result_text,
        "token_count": _count_tokens_approx(result_text),
        "token_count_ok": _count_tokens_approx(result_text) < 500,
    }

    # Try to extract and validate YAML frontmatter from result
    yaml_valid = False
    if "---" in result_text:
        try:
            parts = result_text.split("---")
            if len(parts) >= 3:
                yaml.safe_load(parts[1])
                yaml_valid = True
        except yaml.YAMLError:
            pass
    assertions["yaml_valid"] = yaml_valid

    result_file.write_text(json.dumps({
        "status": "pass" if all([
            not assertions["is_error"],
            assertions["result_nonempty"],
            assertions["yaml_valid"],
            assertions["token_count_ok"],
        ]) else "fail",
        "assertions": assertions,
        "cost_usd": response["cost_usd"],
    }, indent=2))

    assert not response["is_error"], f"invoke_skill returned error: {result_text[:200]}"
    assert assertions["result_nonempty"], "Result is empty"
    assert assertions["yaml_valid"], f"YAML frontmatter invalid or missing in result:\n{result_text[:300]}"
    assert assertions["token_count_ok"], f"Token count {assertions['token_count']} >= 500"


# ── T2: Model Selection ───────────────────────────────────────────────────────

@pytest.mark.behavioral
def test_T2_model_selection(workspace):
    """T2: pick-model recommends opus/sonnet for architectural analysis (LLM-judge)."""
    check_cost_cap("T2")

    prompt = (
        "Pick the right model for a skill that analyzes entire codebases, "
        "identifies architectural patterns across 50+ files, generates "
        "dependency graphs, and produces ADR recommendations. "
        "This requires deep multi-framework reasoning."
    )

    response = invoke_skill(prompt, PICK_MODEL_PATH, test_id="T2")
    result_text = response["result"]

    judge_response = llm_judge(
        question="Did this response recommend opus or sonnet (not haiku) as the appropriate model for a complex architectural analysis task?",
        context=result_text,
        test_id="T2",
    )

    result_file = OUTPUT_DIR / "T2.json"
    result_file.write_text(json.dumps({
        "status": "pass" if judge_response["verdict"] == "YES" else "fail",
        "result": result_text[:500],
        "judge_verdict": judge_response["verdict"],
        "judge_reason": judge_response["reason"],
        "cost_usd": response["cost_usd"] + judge_response["cost_usd"],
    }, indent=2))

    assert judge_response["verdict"] == "YES", (
        f"Judge said NO: {judge_response['reason']}\n"
        f"Skill response: {result_text[:300]}"
    )


# ── T3: Reject Verbose ────────────────────────────────────────────────────────

@pytest.mark.behavioral
def test_T3_reject_verbose(workspace):
    """T3: edit-skill refuses >500 token SKILL.md and suggests alternative (LLM-judge)."""
    check_cost_cap("T3")

    # Read the violation fixture
    violation_path = "/workspace/fixtures/violations/edit-skill-token-overflow.md"
    violation_content = Path(violation_path).read_text()

    prompt = (
        f"Here is a SKILL.md I want to use:\n\n{violation_content}\n\n"
        "Please approve this skill or tell me if there are any issues with it."
    )

    response = invoke_skill(prompt, EDIT_SKILL_PATH, test_id="T3")
    result_text = response["result"]

    judge_response = llm_judge(
        question=(
            "Did this response identify that the SKILL.md is too large (exceeds token limit) "
            "AND suggest an alternative approach such as moving content to reference.md, "
            "splitting content, or reducing the skill size?"
        ),
        context=result_text,
        test_id="T3",
    )

    result_file = OUTPUT_DIR / "T3.json"
    result_file.write_text(json.dumps({
        "status": "pass" if judge_response["verdict"] == "YES" else "fail",
        "result": result_text[:500],
        "judge_verdict": judge_response["verdict"],
        "judge_reason": judge_response["reason"],
        "cost_usd": response["cost_usd"] + judge_response["cost_usd"],
    }, indent=2))

    assert judge_response["verdict"] == "YES", (
        f"Judge said NO: {judge_response['reason']}\n"
        f"Skill response: {result_text[:300]}"
    )
