# OpenSpec Plan Reference

## test.md Anti-Pattern Table

When reviewing test.md for quality, reject these lazy verification patterns:

| ❌ Lazy Pattern | ✅ What It Should Be |
|---|---|
| `grep "jwt" auth.py` | `POST /login → response has valid JWT` |
| `[ -f config.yaml ]` | `config.yaml contains required keys X, Y, Z` |
| `wc -l > 0` | `output matches expected format/schema` |
| `echo "looks good"` | `diff against expected output` |
| `git diff --name-only` | `Run modified endpoints and verify responses` |
| `cat file \| grep "import"` | `pytest test_module.py -v` |

## test.md Quality Bar

Verification steps in test.md MUST be:

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

| Mode | test.md Requirement | Enforcement |
|------|---------------------|-------------|
| **garage** | Recommended | Optional unless human requests it. Focus on critical paths. |
| **scale** | Required | Checkpoint blocks without test.md. Full coverage expected. |
| **maintenance** | Required | Checkpoint blocks without test.md. Emphasis on regression prevention. |

## test.md Template

```markdown
# Test Strategy: {change-id}

**Mode**: {mode} ({layers for this mode})

## GATE {n}: {description} | {layers}

### {task-number} {task outcome from tasks.md}
- {concrete verification step}
- Expect: {observable result}

### {task-number} {task outcome}
- {verification step}
- Expect: {result}
```

## Common test.md Patterns

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
