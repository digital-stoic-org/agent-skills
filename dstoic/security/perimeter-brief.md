# 🧱 Phase 1: Perimeter — Permissions & Sandbox

The outer wall. This is the first thing to deploy and the simplest — pure configuration, no code.

## Why this matters

Claude Code has two native access control layers: **permissions** (tool-level allow/deny rules) and **sandbox** (OS-level filesystem and network restrictions). Out of the box, neither is configured defensively. The defaults trust you to not ask CC to read your SSH keys — but prompt injection doesn't ask permission.

The gap that surprised us most: `permissions.deny` only blocks Claude Code's own tools (Read, Edit, Write). It does **not** block Bash commands. So `Read(.env)` is denied, but `cat .env` sails right through. Phase 1 closes that gap.

## What we're protecting against

- **Secret file exposure** — `.env*`, `*.key`, `*.pem`, credentials, tokens read via any tool or Bash
- **Credential directory access** — `~/.ssh`, `~/.aws`, `~/.kube`, `~/.gnupg` contain keys that unlock production systems
- **Data exfiltration** — unrestricted outbound network means any compromised prompt can phone home
- **Sandbox escape** — `dangerouslyDisableSandbox`, `allowUnsandboxedCommands`, and auto-allow modes weaken isolation
- **Domain fronting** — CDN domains (Cloudflare, Akamai, Fastly) share IPs, making allowlist bypasses trivial if you're not careful

## The four pieces

### 1a. Complete the deny list 🚫

Current state blocks Read/Edit/Write on secret files. We add Bash patterns to close the `cat .env` bypass.

**Known limitation**: Bash patterns are prefix-matched. `cat .env` is caught, but `less .env` or `vim .env` aren't. Phase 2 hooks cover the long tail.

### 1b. Credential directories 🔑

Block Read/Edit on home directory credential stores. These should never be touched by CC under any circumstances — there's no legitimate use case.

### 1c. Sandbox: deny-by-default network 🌐

Switch from permissive (allow everything) to restrictive (deny everything, allowlist specific domains). The allowlist is minimal: Anthropic API, package registries (npm, pip, yarn), GitHub.

**Critical rule**: Never allowlist broad CDN domains (`*.cloudflare.com`, `*.akamai.net`). They resolve to shared IPs — an attacker can front any domain behind them.

### 1d. Allow/ask permission split ✅❓

Move portable permission rules from `.local.json` to `settings.json`. Read-only operations are auto-allowed. Writes, network calls, and destructive operations require confirmation.

The principle: **allow what's safe to repeat a thousand times. Ask for anything that changes state.**

## Review questions

Before applying, challenge these:

1. **Is the network allowlist complete?** Will `bun install`, `gh pr create`, or `pip install` break? If a domain is missing, the operation silently fails — frustrating to debug.
2. **Does `autoAllowMode: false` break your workflow?** If you rely on sandbox auto-approving Bash commands, this will add friction. That friction is the point — but worth knowing.
3. **Are we blocking too much?** `cat .env.example` (a harmless template file) will be blocked because it matches `.env*`. Acceptable tradeoff — rename to `env.example.template` if needed.
4. **What about WSL/remote?** Sandbox behavior differs across platforms. Seatbelt (macOS) vs bwrap (Linux) vs nothing (Windows). Test on your actual environment.

## After applying

Smoke-test every control. A deny rule that doesn't actually deny is worse than no rule — it creates false confidence.

→ Exact config blocks, patterns, and test commands: [perimeter-brief-llm.md](perimeter-brief-llm.md)
