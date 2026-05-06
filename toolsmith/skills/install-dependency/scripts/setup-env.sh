#!/bin/bash
# Setup environment for dependency installation
# Usage: source setup-env.sh

# Create local temp directory
export LOCAL_TMP="${PWD}/.tmp"
mkdir -p "$LOCAL_TMP"

# Override all temp directories to avoid /tmp/claude conflicts
export TMPDIR="$LOCAL_TMP"
export TEMP="$LOCAL_TMP"
export TMP="$LOCAL_TMP"

# Bun-specific overrides
export BUN_TMPDIR="$LOCAL_TMP"
export BUN_INSTALL_CACHE_DIR="$LOCAL_TMP"

# NPM-specific
export npm_config_tmp="$LOCAL_TMP"

# Python-specific
export PYTHONUSERBASE="$HOME/.local"

# Unset Claude Code env vars that force /tmp/claude
unset CLAUDECODE
unset CLAUDE_CODE_ENTRYPOINT

# Get git root (scan boundary)
export GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "")

echo "=== Environment Setup Complete ==="
echo "TMPDIR: $LOCAL_TMP"
echo "GIT_ROOT: ${GIT_ROOT:-'(not a git repo)'}"
echo "PWD: $PWD"
