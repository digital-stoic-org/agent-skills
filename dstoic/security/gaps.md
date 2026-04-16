# 🔍 Known Gaps & Drift

Security is never complete. This file tracks what we chose **not** to do, what we **can't** fully mitigate, and how the landscape drifts over time.

## Open gaps

### G1 — System reminders bypass (GitHub #4160)

Claude Code's background indexing may expose file contents before `permissions.deny` is checked. This is a known limitation of the permission model — it's **best-effort, not airtight**.

**Mitigation**: Don't store secrets inside the project directory. Use `~/.secrets/`, environment variables, or an external vault. Phase 1 permissions are a safety net, not a vault door.

### G2 — The `--dangerouslySkipPermissions` escape hatch

This flag bypasses every deny rule. It exists for sandboxed environments (containers, VMs) where OS-level isolation replaces permission checks. In an unsandboxed environment, it's a master key.

**Mitigation**: Never use outside a sandboxed environment. Not in current workflow — deferred.

### G3 — Bash prefix matching is incomplete

`permissions.deny` matches Bash commands by prefix. `cat .env` is caught. `less .env`, `more .env`, `vim .env`, `xxd .env` are not. The pattern space is unbounded — you can't enumerate every Unix command that reads files.

**Mitigation**: Phase 2 hooks catch the long tail. Phase 1 permissions handle the common vectors. Together, they cover ~95% of practical attacks.

### G4 — Gitleaks false positives

46% precision means roughly half of all flags are false positives. High-entropy strings in test fixtures, example configs, and documentation trigger constantly.

**Mitigation**: `.gitleaksignore` for known exceptions. Tune after first week of real usage. If precision is unacceptable, evaluate alternatives (truffleHog, detect-secrets).

### G5 — The verification paradox

As AI becomes more reliable, humans review its output less carefully. The more we trust Claude Code, the less likely we are to catch its mistakes — including security mistakes.

**Mitigation**: This is why we automate. Hooks, scanners, and hash checks don't get complacent. Build safety into the system, not into human discipline.

### G6 — MCP rug pull

A trusted MCP server can push a malicious update. There's no re-approval gate — once trusted, always trusted until manually revoked. Version pinning helps but doesn't prevent a compromised registry.

**Mitigation**: Phase 2 MCP integrity hash detects config changes. Pin exact versions, not "latest". Run `npx mcp-scan` before adding new MCPs.

## Opted out

| Item | Reason |
|------|--------|
| Docker/cloud sandbox | Native sandbox sufficient for local setup. Revisit for headless agents. |
| Enterprise governance | Not applicable to individual/small team setup. |
| Full sandbox isolation | Overkill for solo use. |

## Review cadence

Monthly. Aligned with Bruniaux threat-db check.

1. Check Bruniaux for new CVEs/techniques
2. Check Anthropic docs for settings.json schema changes
3. Verify CC version against REGISTRY.md CVE fix versions
4. Verify MCP integrity hash is current
5. Review this file — close resolved gaps, add new ones
6. Update dates below

→ Gap tracking table and review dates: [gaps-llm.md](gaps-llm.md)
