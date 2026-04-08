#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# PRAXIS_DIR Guard: Verify env var is set and points to a valid directory
# ==============================================================================
# Event: SessionStart
# Exit 2 + stderr = shown to user in terminal (degraded mode, not blocking).
# Skills that need PRAXIS_DIR will degrade gracefully on their own.
# ==============================================================================

if [ -z "${PRAXIS_DIR:-}" ]; then
  cat >&2 <<'EOF'
⚠️  PRAXIS_DIR is not set — running in degraded mode.
    Some skills (thinking artifacts, session logs, config) will be limited.
    Fix: export PRAXIS_DIR="$HOME/dev/praxis" in your shell profile.
EOF
  exit 2
fi

if [ ! -d "$PRAXIS_DIR" ]; then
  echo "⚠️  PRAXIS_DIR=$PRAXIS_DIR does not exist — running in degraded mode." >&2
  exit 2
fi
