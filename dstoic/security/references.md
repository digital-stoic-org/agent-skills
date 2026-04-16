# 📚 Security References

Curated sources for hardening Claude Code. Intentionally small — depth over breadth.

**Last reviewed**: 2026-04-09 · **Next review**: 2026-05-09

---

## Primary — check monthly

### Florian Bruniaux — Claude Code Ultimate Guide

The most comprehensive community resource for Claude Code security. Actively maintained threat database with CVEs, hook patterns, sandbox configuration, and maturity levels. This is our baseline — everything here is measured against it.

- **Repo**: [github.com/FlorianBruniaux/claude-code-ultimate-guide](https://github.com/FlorianBruniaux/claude-code-ultimate-guide)
- **Version**: v2.12.0 (Apr 6, 2026)
- **Activity**: Very active (last push Apr 9, 2026) · 325+ stars

| Guide | What you'll find | When to check |
|-------|-----------------|---------------|
| `security-hardening.md` | CVE database, hook patterns, maturity levels, MCP vetting | Monthly — new CVEs added regularly |
| `sandbox-native.md` | Native sandbox (Seatbelt/bwrap), SOCKS5 proxy, filesystem isolation | When changing sandbox settings |
| `production-safety.md` | Team safety, autonomous loop patterns, velocity governor | Cherry-pick what applies to solo use |
| `sandbox-isolation.md` | Docker sandboxes, cloud providers (Fly/E2B/Vercel) | Reference only — not needed locally |
| `enterprise-governance.md` | Org-level governance, compliance | Skip unless enterprise scope |

---

## Official

### Anthropic — Claude Code Documentation

The canonical source for `settings.json` schema, hook protocol, sandbox API, and the permissions model. Always check here after Claude Code updates — breaking changes happen.

- **URL**: [docs.anthropic.com/en/docs/claude-code](https://docs.anthropic.com/en/docs/claude-code)
- **Key sections**: Hooks, Security, Sandbox, Permissions

---

## Research — check quarterly

### arXiv 2604.03070 — Agent skill ecosystem security

Academic study documenting 1,708 issues across the agent skill ecosystem, with 83 confirmed malicious skills and 37.3% multi-pattern attacks. The paper that puts numbers behind "don't install random skills."

### Snyk ToxicSkills audit (Feb 2026)

Industry-scale audit: 36.82% of 3,984 skills compromised. 534 critical risk. 76 malicious payloads. 10.9% with hardcoded secrets. If you ever wonder whether supply chain risk is real for AI tools — this is the evidence.

- **Source**: Snyk blog / ClawHub/skills.sh dataset

---

## Scanning tools

Install when needed. No need to have everything from day one.

| Tool | What it does | When |
|------|-------------|------|
| **Gitleaks** | Pre-commit secret scanner (88% recall, 46% precision) | Phase 3 — git boundary |
| **mcp-scan** (Snyk) | Supply chain scanning for MCP servers and skills | Before adding any new MCP |
| **SandyClaw** (Permiso) | Dynamic sandbox — catches runtime-only payloads | Advanced — not needed yet |
| **Semgrep MCP** | SAST/SCA/Secrets as post-tool-use hook | Alternative to custom output scanner |

---

## Not tracking

- **Trail of Bits**: Good red team perspective but CVEs already in Bruniaux. Check ad-hoc.
- **OWASP LLM Top 10**: Too generic for Claude Code specifics. Bruniaux covers the relevant subset.
- **Enterprise compliance**: SOC2/HIPAA/FedRAMP — not applicable to individual setup.
- **Cloud sandbox providers**: Native sandbox is enough locally. Revisit for headless agents.
