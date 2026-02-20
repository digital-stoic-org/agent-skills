---
name: test-skill
description: "Scaffold and run behavioral tests for skills. Triggers: test my-skill, add test for X, run skill test, test-skill. Generates pytest file from template + runs in Docker."
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion, Glob
model: sonnet
user-invocable: true
argument-hint: "<skill-name> [--run-only | --scaffold-only]"
---

# Test Skill

Scaffold + run behavioral tests for a skill in the Docker test harness.

## Arguments

From `$ARGUMENTS`: `skill_name` (positional, kebab-case), `--run-only`, `--scaffold-only`.

Derive: `snake_name` = `-` → `_`, `test_file` = `test/tests/test_{snake_name}.py`, `golden_file` = `test/fixtures/golden/{skill_name}-smoke.md`.

## Steps

**1. Validate** — `dstoic/skills/{skill_name}/SKILL.md` must exist. Error if not.

**2. Scaffold test** (skip if `--run-only`) — If `test_file` exists → skip to 4. Otherwise AskUserQuestion:
- "What scenario should the smoke test cover?" (header: Scenario)
- "What YES/NO question should the LLM judge answer?" (header: Judge Q)

Generate `test_file` from template in `reference.md`. Derive prompt from scenario.

**3. Scaffold golden** (skip if `--run-only`) — If `golden_file` exists → skip. Read source SKILL.md → generate simplified version: frontmatter (`name`+`description`) + minimal body. Under 250 tokens.

**4. Run** (skip if `--scaffold-only`)

    docker compose -f test/docker-compose.test.yml run --rm skill-tester pytest tests/test_{snake_name}.py -v -s

**5. Report** — Parse `test/output/{snake_name}_smoke.yaml`: status, judge verdict/reason, cost USD. Also show latest trace file `test/output/{snake_name}_smoke_trace_*.yaml`.
