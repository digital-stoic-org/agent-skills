# Gaps — LLM Brief

last-reviewed: 2026-04-09
next-review: 2026-05-09
baseline: Bruniaux v2.12.0

## Open gaps

| # | Gap | Since | Phase | Blocking? |
|---|-----|-------|-------|-----------|
| G1 | System reminders bypass (GH #4160) — indexing before permission check | 2026-04-09 | — | No |
| G2 | `--dangerouslySkipPermissions` bypasses all deny | 2026-04-09 | 1 | No |
| G3 | Bash prefix-match only — `less`/`more`/`vim`/`xxd` not caught | 2026-04-09 | 1 | No |
| G4 | Gitleaks 46% precision — false positives | 2026-04-09 | 3 | No |
| G5 | Verification paradox — human review degrades with AI reliability | 2026-04-09 | — | Ongoing |
| G6 | MCP rug pull — no re-approval gate | 2026-04-09 | 2 | No |

## Opted out

| Item | Reason |
|------|--------|
| Docker/cloud sandbox | Native sufficient for local. Revisit for headless agents. |
| Enterprise governance | Not applicable. |
| Full sandbox isolation | Overkill for solo use. |

## Drift log

| Date | What | Action |
|------|------|--------|
| 2026-04-09 | Initial gap analysis vs Bruniaux v2.12.0 | REGISTRY.md rewritten, 3-phase plan established |

## Monthly review checklist

1. Check Bruniaux threat-db for new CVEs
2. Check Anthropic docs for settings.json changes
3. `claude --version` vs REGISTRY.md CVE fix versions
4. Verify MCP integrity hash current
5. Review gaps — close resolved, add new
6. Update `last-reviewed` + `next-review`
