# Security — LLM Context

## Structure

```
dstoic/security/
├── README.md / README-llm.md
├── perimeter-brief.md / perimeter-brief-llm.md
├── intercept-brief.md / intercept-brief-llm.md
├── sentinel-brief.md / sentinel-brief-llm.md
├── references.md
├── gaps.md / gaps-llm.md
```

- `*.md` = human docs (why, rationale, prose)
- `*-llm.md` = LLM docs (directives, config blocks, checklists)
- Hook scripts: `dstoic/hooks/security-*.sh`
- Target config: `/praxis/.claude/settings.json`
- Risk registry: `/praxis/code/security/REGISTRY.md`

## Phases

| # | Name | Scope | Target | Bruniaux |
|---|------|-------|--------|----------|
| 1 | Perimeter | permissions.deny + sandbox | settings.json | Baseline |
| 2 | Intercept | 5 hooks + infra/deps deny + MCP integrity | dstoic/hooks/ + settings.json | Basic→Standard |
| 3 | Sentinel | Gitleaks + velocity governor + watchdog | git hooks + dstoic/hooks/ | Hardened |

## Rules

- Block = `exit 2` (CC hook protocol)
- Security matchers BEFORE catch-all `""` in hooks.json
- Hooks: stateless, no temp files, no shared state, prefix `security-`
- Conservative: false positives erode trust
- Bruniaux adopted wholesale — opt-out documented in gaps.md
- Phase 1 = config only, no code
- Never mix config + code in same phase
