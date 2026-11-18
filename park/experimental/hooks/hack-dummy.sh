#!/usr/bin/env bash
# DISABLED for demo — PoC hack hook neutralized — re-enable by removing this guard
exit 0
set -euo pipefail

# ==============================================================================
# hack-dummy.sh — EDUCATIONAL PoC. NO EXFIL. NO SECRET READS. NO NETWORK.
# ==============================================================================
# Purpose: prove that a SessionStart hook in a Claude Code plugin can run
# arbitrary code on the developer's machine the moment they open a session.
#
# This script intentionally collects ONLY harmless system info (hostname, user,
# kernel, cpu, shell, cwd) — no SSH keys, no env vars, no creds, no .env files,
# no shell history. A real malicious hook would not be so polite.
#
# Inspired by:
#   - Check Point CVE-2025-59536 / CVE-2026-21852 (CC hook RCE + key exfil)
#   - PromptArmor "Hijacking Claude Code via Injected Marketplace Plugins"
#
# Disarmed by default. Needs EXPERIMENTAL_HOOKS_ENABLED=1 + PRAXIS_DIR set, AND
# HACK_DUMMY_ARM=1 to enable. DUMMY_NOOP=1 force-disables.
# ==============================================================================

# experimental plugin gate (full experimental): opt-in + Praxis context required
{ [ "${EXPERIMENTAL_HOOKS_ENABLED:-0}" = "1" ] && [ -n "${PRAXIS_DIR:-}" ]; } || exit 0
[ "${DUMMY_NOOP:-0}" = "1" ] && exit 0
[ "${HACK_DUMMY_ARM:-0}" = "1" ] || exit 0

# Portable temp dir: $TMPDIR (Mac), /tmp (Linux), $TEMP (Windows Git Bash)
TMP="${TMPDIR:-${TEMP:-/tmp}}"
RECEIPT="${TMP%/}/you-ve-been-hacked.md"

cat > "$RECEIPT" <<EOF
# 🚨 YOU'VE BEEN HACKED (educational)

**This file was written by a SessionStart hook running arbitrary code on your machine.**

A real malicious hook could have read your SSH keys, AWS credentials, .env files,
shell history, and \$ANTHROPIC_API_KEY — with the same access this script had.
This one chose not to. It only collected harmless system info:

- hostname: $(hostname 2>/dev/null || echo unknown)
- user:     ${USER:-unknown}
- shell:    ${SHELL:-unknown}
- kernel:   $(uname -sr 2>/dev/null || echo unknown)
- cpu:      $(_cpu=$(awk -F: '/model name/{print $2; exit}' /proc/cpuinfo 2>/dev/null | sed 's/^ *//'); [ -z "$_cpu" ] && _cpu=$(sysctl -n machdep.cpu.brand_string 2>/dev/null); echo "${_cpu:-unknown}")
- cwd:      $(pwd)
- ts:       $(date -Iseconds)

A real malicious hook could have read your SSH keys, AWS creds, .env files, and
shell history with the same access — this one chose not to.

Harden your setup: https://cc.bruniaux.com/guide/security-hardening/
EOF

printf '\033[1;31m\n'
cat <<EOF
╔══════════════════════════════════════════════════════════════════╗
║  🚨  YOU'VE BEEN HACKED (educational PoC)                        ║
║                                                                  ║
║  A SessionStart hook just ran arbitrary code on your machine.    ║
║  You should add protection layers.                               ║
║                                                                  ║
║  Florian Bruniaux's CC security hardening guide:                 ║
║    https://cc.bruniaux.com/guide/security-hardening/             ║
║                                                                  ║
║  Receipt: $RECEIPT
╚══════════════════════════════════════════════════════════════════╝
EOF
printf '\033[0m\n'
