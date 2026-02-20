"""
behavioral.py — ACL layer for invoking skills via claude -p and parsing responses.

Translates --output-format json responses into assertion-friendly dicts.
Tracks running cost to enforce $0.50 cap (ADR-5).
Auto-traces every invocation to /workspace/output/{test_id}_trace_{ts}.yaml.
"""
import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path

import yaml

COST_FILE = Path("/workspace/output/cost.yaml")
TRACE_DIR = Path("/workspace/output")
COST_CAP = 0.50
COST_WARN_THRESHOLD = 0.45  # warn when approaching cap


def _load_cost_state() -> dict:
    if COST_FILE.exists():
        return yaml.safe_load(COST_FILE.read_text()) or {}
    return {"tests": {}, "running_total": 0.0}


def _save_cost_state(state: dict) -> None:
    COST_FILE.parent.mkdir(parents=True, exist_ok=True)
    COST_FILE.write_text(yaml.dump(state, default_flow_style=False, sort_keys=False))


def get_running_total() -> float:
    return _load_cost_state().get("running_total", 0.0)


# Cache timestamp per test_id so invoke_skill and llm_judge write to the same file
_trace_timestamps: dict[str, str] = {}


def _trace_ts(test_id: str) -> str:
    if test_id not in _trace_timestamps:
        _trace_timestamps[test_id] = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    return _trace_timestamps[test_id]


def _trace_path(test_id: str) -> Path:
    return TRACE_DIR / f"{test_id}_trace_{_trace_ts(test_id)}.yaml"


def _load_trace(test_id: str) -> dict:
    p = _trace_path(test_id)
    if p.exists():
        return yaml.safe_load(p.read_text()) or {}
    return {"test_id": test_id, "timestamp": datetime.now(timezone.utc).isoformat()}


def _save_trace(test_id: str, trace: dict) -> None:
    TRACE_DIR.mkdir(parents=True, exist_ok=True)
    _trace_path(test_id).write_text(
        yaml.dump(trace, default_flow_style=False, allow_unicode=True, sort_keys=False, width=120)
    )


def check_cost_cap(test_id: str = "") -> None:
    """Raise pytest.skip if running total is near or over cap."""
    import pytest
    total = get_running_total()
    if total >= COST_WARN_THRESHOLD:
        raise pytest.skip.Exception(
            f"WARNING: cost cap reached — running total ${total:.4f} >= ${COST_WARN_THRESHOLD} threshold "
            f"(cap: ${COST_CAP}). Skipping {test_id}."
        )


def invoke_skill(prompt: str, skill_path: str, test_id: str = "") -> dict:
    """
    Invoke a skill via claude -p and return an assertion dict.

    Args:
        prompt: The user prompt to send to the skill
        skill_path: Path to the SKILL.md file (used as system prompt context)
        test_id: Optional test identifier for cost tracking

    Returns:
        dict with keys:
            result (str): Raw text result from claude
            cost_usd (float): API cost for this invocation
            is_error (bool): Whether the invocation errored
            raw (dict): Full parsed JSON response
    """
    check_cost_cap(test_id)

    skill_content = Path(skill_path).read_text() if skill_path else ""

    if skill_content:
        full_prompt = f"<skill_context>\n{skill_content}\n</skill_context>\n\n{prompt}"
    else:
        full_prompt = prompt

    cmd = [
        "claude", "-p", full_prompt,
        "--output-format", "json",
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)

    if result.returncode != 0:
        return {
            "result": result.stderr or result.stdout,
            "cost_usd": 0.0,
            "is_error": True,
            "raw": {},
        }

    raw_output = result.stdout.strip()
    try:
        data = json.loads(raw_output)
    except json.JSONDecodeError:
        return {
            "result": raw_output,
            "cost_usd": 0.0,
            "is_error": True,
            "raw": {},
        }

    cost = float(data.get("total_cost_usd", 0.0))
    text_result = data.get("result", "")

    # Update running cost
    state = _load_cost_state()
    if test_id:
        state["tests"][test_id] = cost
    state["running_total"] = sum(state["tests"].values())
    _save_cost_state(state)

    # Auto-trace
    if test_id:
        trace = _load_trace(test_id)
        trace["skill_invocation"] = {
            "prompt": prompt,
            "skill_path": skill_path,
            "full_prompt": full_prompt,
            "response_text": text_result,
            "cost_usd": cost,
            "is_error": bool(data.get("is_error", False)),
        }
        _save_trace(test_id, trace)

    return {
        "result": text_result,
        "cost_usd": cost,
        "is_error": bool(data.get("is_error", False)),
        "raw": data,
    }


def llm_judge(question: str, context: str, test_id: str = "") -> dict:
    """
    Invoke a Haiku judge to evaluate non-deterministic assertions.

    Args:
        question: YES/NO question for the judge (e.g., "Did this response pick opus?")
        context: The response/content to evaluate
        test_id: Optional test identifier for cost tracking

    Returns:
        dict with keys:
            verdict (str): "YES" or "NO"
            reason (str): Judge's explanation
            cost_usd (float): Cost of judge invocation
            raw_response (str): Full judge response
    """
    prompt = (
        f"Evaluate the following and answer with YES or NO on the first line, "
        f"followed by a brief reason.\n\n"
        f"Question: {question}\n\n"
        f"Content to evaluate:\n{context}"
    )
    cmd = [
        "claude", "-p", prompt,
        "--output-format", "json",
        "--model", "haiku",
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    if result.returncode != 0:
        return {"verdict": "ERROR", "reason": result.stderr, "cost_usd": 0.0, "raw_response": ""}

    try:
        data = json.loads(result.stdout.strip())
    except json.JSONDecodeError:
        return {"verdict": "ERROR", "reason": "JSON parse failed", "cost_usd": 0.0, "raw_response": result.stdout}

    cost = float(data.get("total_cost_usd", 0.0))
    response_text = data.get("result", "")
    lines = response_text.strip().split("\n")
    verdict = "YES" if lines and lines[0].strip().upper().startswith("YES") else "NO"
    reason = "\n".join(lines[1:]).strip() if len(lines) > 1 else ""

    # Track judge cost
    state = _load_cost_state()
    judge_key = f"{test_id}_judge" if test_id else "judge"
    state["tests"][judge_key] = cost
    state["running_total"] = sum(state["tests"].values())
    _save_cost_state(state)

    # Auto-trace
    if test_id:
        trace = _load_trace(test_id)
        trace["judge"] = {
            "question": question,
            "context_snippet": context[:500],
            "full_prompt": prompt,
            "verdict": verdict,
            "reason": reason,
            "cost_usd": cost,
            "raw_response": response_text,
        }
        _save_trace(test_id, trace)

    return {
        "verdict": verdict,
        "reason": reason,
        "cost_usd": cost,
        "raw_response": response_text,
    }
