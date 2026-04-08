#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# PRAXIS_DIR Guard: Verify env var is set and points to a valid directory
# ==============================================================================
# Event: SessionStart
# Blocks session with clear error if $PRAXIS_DIR is missing or invalid.
# ==============================================================================

if [ -z "${PRAXIS_DIR:-}" ]; then
  cat >&2 <<'EOF'
❌ $PRAXIS_DIR is not set.

Many skills depend on this variable (config, thinking artifacts, session logs).
Add to your shell profile:

  export PRAXIS_DIR="$HOME/dev/praxis"

Then restart your terminal or run: source ~/.bashrc
EOF
  exit 1
fi

if [ ! -d "$PRAXIS_DIR" ]; then
  echo "❌ \$PRAXIS_DIR=$PRAXIS_DIR does not exist or is not a directory." >&2
  exit 1
fi
