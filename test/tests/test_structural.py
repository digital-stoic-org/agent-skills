"""
test_structural.py — L2 structural tests for all skills in dstoic/skills/.

Parametrized over every skill directory. Each skill must pass all 4 validators:
  1. file_exists
  2. naming (kebab-case dir, SKILL.md file)
  3. frontmatter (name + description required)
  4. token_count (<500 approx)

Markers: @pytest.mark.structural
"""
from pathlib import Path

import pytest

from harness.structural import validate_skill

SKILLS_DIR = Path("/workspace/skills")


def _discover_skills() -> list[tuple[str, Path]]:
    """Return list of (skill_name, SKILL.md path) for all skills."""
    skills = []
    if not SKILLS_DIR.exists():
        return skills
    for skill_dir in sorted(SKILLS_DIR.iterdir()):
        if skill_dir.is_dir():
            skill_md = skill_dir / "SKILL.md"
            skills.append((skill_dir.name, skill_md))
    return skills


_SKILLS = _discover_skills()


@pytest.mark.structural
@pytest.mark.parametrize("skill_name,skill_path", _SKILLS, ids=[s[0] for s in _SKILLS])
def test_skill_structural(skill_name, skill_path):
    """Hard failures: file exists, naming, frontmatter. Token count is warn-only."""
    result = validate_skill(skill_path)
    if result.get("warnings"):
        for w in result["warnings"]:
            print(f"\n  ⚠ {skill_name}: {w}")
    assert result["passed"], (
        f"Skill '{skill_name}' failed structural validation:\n"
        + "\n".join(f"  - {e}" for e in result["errors"])
    )
