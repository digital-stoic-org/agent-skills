# 🔒 Claude Code Security Hardening

AI coding assistants are powerful — and that power comes with a real attack surface. Prompt injection, supply chain poisoning, secret exfiltration, sandbox escapes: these aren't theoretical threats, they're documented CVEs with proof-of-concept exploits.

This folder contains the security hardening plan for Claude Code, built on the [Bruniaux Ultimate Guide](https://github.com/FlorianBruniaux/claude-code-ultimate-guide) baseline — the most comprehensive community resource for CC security as of April 2026.

## 🎯 Philosophy

**Defense-in-depth, not silver bullets.** No single layer stops everything. Permissions can be bypassed via Bash. Sandbox can be escaped via CVEs. Hooks can be evaded by novel patterns. Stack them — each layer catches what the previous one misses.

**Automate safety, don't trust human vigilance.** The verification paradox: as AI reliability increases, human review quality decreases. The solution is programmatic enforcement (hooks, scanners, hash checks) over manual review at scale.

**Conservative patterns first.** False positives erode trust. Start tight, expand after real usage data — not the other way around.

**Adopt baselines wholesale, opt out explicitly.** Bruniaux recommendations are adopted by default. Any deviation is documented with a reason in [gaps.md](gaps.md).

## 🏗️ Three Phases

Each phase is an independent layer. Never mix config and code in the same phase.

### Phase 1 — Perimeter 🧱

The outer wall. Block unauthorized file access and restrict network/filesystem at the OS level.

- `permissions.deny` for secret files (Read, Edit, Write, **and Bash**)
- Credential directory deny (~/.ssh, ~/.aws, ~/.kube, ~/.gnupg)
- Sandbox network: deny-by-default + explicit allowlist
- Sandbox filesystem: OS-level read blocks
- Allow/ask permission split for daily operations

**Config only** — no code, no scripts. Just `settings.json`.

→ [perimeter-brief.md](perimeter-brief.md)

### Phase 2 — Intercept 🪝

Runtime pattern detection. Catch what passes through permissions.

5 hook scripts in `dstoic/hooks/`:
- **Dangerous actions blocker** — rm -rf, DROP TABLE, force push, nested injection
- **Prompt injection detector** — role overrides, jailbreak patterns, authority impersonation
- **Unicode injection scanner** — zero-width chars, RTL overrides, ANSI escapes, homoglyphs
- **Output secrets scanner** — AWS keys, tokens, DB URLs in stdout (warn, not block)
- **MCP integrity checker** — hash drift detection on session start

Plus: infrastructure file protection + dependency install blocks.

→ [intercept-brief.md](intercept-brief.md)

### Phase 3 — Sentinel 🗼

Last line of defense. Catch secrets before they leave the repo, govern autonomous agents.

- **Gitleaks** pre-commit — scan staged content for secrets
- **Velocity governor** — rate-limit runaway agent loops
- **Heartbeat + watchdog** — kill stuck autonomous sessions

→ [sentinel-brief.md](sentinel-brief.md)

## 📊 Maturity Mapping

These phases map to [Bruniaux maturity levels](https://github.com/FlorianBruniaux/claude-code-ultimate-guide):

| Bruniaux Level | Our Phase | Time |
|----------------|-----------|------|
| Baseline | Perimeter | ~10 min |
| Basic → Standard | Intercept | ~30 min |
| Hardened | Sentinel | ~2 hrs |

## 🔗 Related

| What | Where | Purpose |
|------|-------|---------|
| Risk registry + status | `/praxis/code/security/REGISTRY.md` | Living inventory — what's done, what's not |
| Phase briefs | This folder | Review before, reference after |
| References | [references.md](references.md) | Curated sources, monthly check cadence |
| Known gaps | [gaps.md](gaps.md) | What we chose not to do, and why |
| Hook scripts | `dstoic/hooks/security-*.sh` | Deployed automatically by plugin |
| Target config | `/praxis/.claude/settings.json` | Git-tracked, replicated across environments |

## 🔄 Review Cadence

- **Monthly**: Check Bruniaux for new CVEs, update gaps
- **After CC updates**: Verify settings.json schema compatibility
- **After each phase**: Update REGISTRY.md status, smoke-test
