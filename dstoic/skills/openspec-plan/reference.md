# OpenSpec Plan Reference

## Proposal: Philosophy Alignment Template

```markdown
## Execution Philosophy Alignment

**Mode**: {mode from project.md}
**Principles applied**: {relevant principles for this change}
**Trade-offs accepted**: {from accept list}
**Anti-patterns avoided**: {relevant anti-patterns}
```

## tests.md Anti-Pattern Table

When reviewing tests.md for quality, reject these lazy verification patterns:

| ❌ Lazy Pattern | ✅ What It Should Be |
|---|---|
| `grep "jwt" auth.py` | `POST /login → response has valid JWT` |
| `[ -f config.yaml ]` | `config.yaml contains required keys X, Y, Z` |
| `wc -l > 0` | `output matches expected format/schema` |
| `echo "looks good"` | `diff against expected output` |
| `git diff --name-only` | `Run modified endpoints and verify responses` |
| `cat file \| grep "import"` | `pytest test_module.py -v` |

## tests.md Quality Bar

Verification steps in tests.md MUST be:

1. **Functional over structural**
   - ❌ Check if code exists: `grep "function login" auth.js`
   - ✅ Check if feature works: `POST /api/login with credentials → returns 200 + JWT`

2. **Observable (human-reproducible)**
   - ❌ "Verify logic is correct"
   - ✅ "Run `curl -X POST localhost:3000/login` → expect `{token: "jwt..."}`"

3. **Specific expectations**
   - ❌ "Output looks good"
   - ✅ "Response contains `status: 200` and `token` field with 40+ chars"

## Mode-Specific Requirements

| Mode | tests.md Requirement | Enforcement |
|------|---------------------|-------------|
| **garage** | Recommended | Optional unless human requests it. Focus on critical paths. |
| **scale** | Required | Checkpoint blocks without tests.md. Full coverage expected. |
| **maintenance** | Required | Checkpoint blocks without tests.md. Emphasis on regression prevention. |

## Test Execution Model

Every verification step in tests.md MUST be tagged with an execution type:

| Type | Tag | Who runs it | Examples |
|------|-----|-------------|---------|
| **Automated** | `[auto]` | Agent/CI runs command, asserts exit code + output | `pytest tests/`, `npm test`, `curl` + assert |
| **Smoke** | `[smoke]` | Agent/CI runs command, human reviews output | `docker compose run`, quick sanity script |
| **Manual** | `[manual]` | Human follows steps, reports pass/fail | UI flows, visual checks, judgment calls |

**Rules**:
- Default is `[auto]` — if no tag, assume automated
- `[manual]` steps MUST include numbered human instructions + pass criteria
- Mixed gates are allowed — tag each step independently
- Checkpoint (openspec-test) pauses at `[manual]` steps and prompts human

## tests.md Template

```markdown
# Test Strategy: {change-id}

**Mode**: {mode} ({layers for this mode})

## GATE {n}: {description}

### {task-number} {task outcome from tasks.md} [auto]
- {concrete verification command}
- Expect: {observable result — exit code, output match, assertion}

### {task-number} {task outcome} [manual]
- **Steps**:
  1. {human action}
  2. {human action}
- **Pass criteria**: {what human verifies}

### {task-number} {task outcome} [smoke]
- {command to run}
- Expect: {what to look for in output}
```

## Cross-check Coverage Example

```markdown
### Coverage Check

| design.md Component | Type | tasks.md | tests.md | Status |
|---|---|---|---|---|
| TestRunner | container | S1 | GATE 1 | ✅ |
| Fixtures | aggregate | S2 | GATE 2 | ✅ |
| TestOutput | aggregate | — | — | ⚠️ missing |
| run-suite flow | flow | S3 | GATE 3 | ✅ |
| fixture-uniqueness | invariant | S2.3 | GATE 2 | ✅ |
| Reporter (X-as-a-Service) | interaction | — | — | ⚠️ missing |
```

⚠️ 2 gaps found. Fix these gaps now or defer?

## Common tests.md Patterns

### Pattern: API Endpoint Added
```markdown
### 2.3 POST /api/users returns 201 with user object
- `curl -X POST localhost:3000/api/users -d '{"name":"test"}'`
- Expect: HTTP 201, response `{"id": <uuid>, "name": "test", "created": <iso-date>}`
```

### Pattern: Configuration File Created
```markdown
### 1.2 config.yaml has required keys
- `yq eval '.database, .api, .logging' config.yaml`
- Expect: All three keys present with non-null values
```

### Pattern: Database Migration Applied
```markdown
### 3.1 users table has email_verified column
- `psql -c "\d users" | grep email_verified`
- Expect: Column exists with type `boolean`, default `false`
```

### Pattern: CLI Command Works
```markdown
### 2.4 openspec status shows change progress
- `./bin/openspec status transparent-checkpoint`
- Expect: Output includes section count, gate status, task progress percentage
```
