#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# PRAXIS_DIR Hard Gate: Block tool execution when PRAXIS_DIR is missing
# ==============================================================================
# Event: PreToolUse (exit 2 = block the tool call)
# stderr → feedback to Claude (reason for blocking)
# Fires on every tool call — fast path: PRAXIS_DIR set → exit 0 immediately
# ==============================================================================

# Fast path: env var set and directory exists
if [ -n "${PRAXIS_DIR:-}" ] && [ -d "$PRAXIS_DIR" ]; then
  exit 0
fi

# Block with reason
if [ -z "${PRAXIS_DIR:-}" ]; then
  echo "PRAXIS_DIR is not set. Export it in your shell profile: export PRAXIS_DIR=\$HOME/dev/praxis" >&2
else
  echo "PRAXIS_DIR=$PRAXIS_DIR does not exist." >&2
fi

exit 2
