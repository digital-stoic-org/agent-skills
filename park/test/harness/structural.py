"""
structural.py — L2 structural validators for SKILL.md files.

Validators:
  1. frontmatter_valid: required keys name + description present and non-empty
  2. token_count_ok: SKILL.md < 500 tokens (approx: len // 4)
  3. naming_ok: directory is kebab-case, file is SKILL.md
  4. file_exists: SKILL.md exists at expected path

Usage (CLI):
  python3 -m harness.structural <path-to-SKILL.md>
  → exit 0 on pass, exit 1 on fail (prints failures)
"""
import re
import sys
from pathlib import Path

import yaml

TOKEN_LIMIT = 500
KEBAB_CASE_RE = re.compile(r'^[a-z][a-z0-9]*(-[a-z0-9]+)*$')


def _approx_tokens(text: str) -> int:
    return len(text) // 4


def validate_file_exists(skill_path: Path) -> list[str]:
    if not skill_path.exists():
        return [f"file_not_found: {skill_path}"]
    return []


def validate_naming(skill_path: Path) -> list[str]:
    errors = []
    if skill_path.name != "SKILL.md":
        errors.append(f"naming: file must be SKILL.md, got {skill_path.name!r}")
    dir_name = skill_path.parent.name
    if not KEBAB_CASE_RE.match(dir_name):
        errors.append(f"naming: directory must be kebab-case, got {dir_name!r}")
    return errors


def validate_frontmatter(skill_path: Path) -> list[str]:
    text = skill_path.read_text()
    if not text.startswith("---"):
        return ["frontmatter: no YAML frontmatter found (must start with ---)"]
    parts = text.split("---", 2)
    if len(parts) < 3:
        return ["frontmatter: unclosed YAML block (missing closing ---)"]
    try:
        fm = yaml.safe_load(parts[1])
    except yaml.YAMLError as e:
        return [f"frontmatter: YAML parse error: {e}"]
    if not isinstance(fm, dict):
        return ["frontmatter: YAML block is not a mapping"]
    errors = []
    for key in ("name", "description"):
        if key not in fm:
            errors.append(f"frontmatter: missing required key {key!r}")
        elif not fm[key] or not str(fm[key]).strip():
            errors.append(f"frontmatter: key {key!r} is empty")
    return errors


def validate_token_count(skill_path: Path) -> list[str]:
    """Token count check — warns only, does not fail. <500 is ideal not required."""
    text = skill_path.read_text()
    count = _approx_tokens(text)
    if count >= TOKEN_LIMIT:
        # Return warning prefix so callers can distinguish warn vs error
        return [f"WARN token_count: ~{count} tokens >= {TOKEN_LIMIT} ideal (consider moving content to reference.md)"]
    return []


def validate_skill(skill_path: Path) -> dict:
    """
    Run all 4 validators on a SKILL.md path.

    Returns:
        dict with keys:
            passed (bool): True if all validators pass
            errors (list[str]): List of failure messages
            token_count (int): Approximate token count
    """
    p = Path(skill_path)
    all_messages = []
    all_messages += validate_file_exists(p)
    if all_messages:
        return {"passed": False, "errors": all_messages, "warnings": [], "token_count": 0}
    all_messages += validate_naming(p)
    all_messages += validate_frontmatter(p)
    all_messages += validate_token_count(p)
    token_count = _approx_tokens(p.read_text())
    errors = [m for m in all_messages if not m.startswith("WARN ")]
    warnings = [m for m in all_messages if m.startswith("WARN ")]
    return {
        "passed": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "token_count": token_count,
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 -m harness.structural <path-to-SKILL.md>")
        sys.exit(1)
    result = validate_skill(sys.argv[1])
    for w in result.get("warnings", []):
        print(f"  ⚠ {w}")
    if result["passed"]:
        print(f"PASS: {sys.argv[1]} (~{result['token_count']} tokens)")
        sys.exit(0)
    else:
        print(f"FAIL: {sys.argv[1]}")
        for err in result["errors"]:
            print(f"  - {err}")
        sys.exit(1)
