#!/bin/bash
# Install system package
# Usage: install-system.sh <package>

set -e

PACKAGE="$1"

if [ -z "$PACKAGE" ]; then
  echo "Usage: install-system.sh <package>"
  exit 1
fi

# Detect package manager
PKG_MGR=$(command -v apt || command -v brew || command -v dnf || echo "")

if [ -z "$PKG_MGR" ]; then
  echo "ERROR: No package manager found (apt/brew/dnf)"
  exit 1
fi

PKG_MGR_NAME=$(basename "$PKG_MGR")

echo "NEEDS_APPROVAL:$PACKAGE via $PKG_MGR_NAME (requires sudo)"
echo "WAITING_FOR_APPROVAL"

# After Claude gets approval via AskUserQuestion, it should call this again with APPROVED=1
if [ "${APPROVED}" = "1" ]; then
  echo "Installing $PACKAGE via $PKG_MGR_NAME..."
  sudo "$PKG_MGR" install -y "$PACKAGE"
  echo "INSTALLED:system ($PKG_MGR_NAME)"
else
  echo "NOTE: Set APPROVED=1 to proceed with installation"
  exit 0
fi
