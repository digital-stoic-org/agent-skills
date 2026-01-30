#!/bin/bash
# Verify package installation
# Usage: verify.sh <package> <type> [module_name]
# type: python|js|system

set -e

PACKAGE="$1"
TYPE="$2"
MODULE="${3:-$PACKAGE}"  # Optional: module name if different from package

if [ -z "$PACKAGE" ] || [ -z "$TYPE" ]; then
  echo "Usage: verify.sh <package> <type> [module_name]"
  echo "  type: python|js|system"
  exit 1
fi

verify_python() {
  local module="$1"
  # Try local venv first, then parent venvs
  for dir in . .. ../.. "$GIT_ROOT"; do
    if [ -n "$dir" ] && [ -d "$dir/.venv" ]; then
      if "$dir/.venv/bin/python" -c "import $module; print('Version:', getattr($module, '__version__', 'unknown'))" 2>/dev/null; then
        echo "VERIFIED:$dir/.venv"
        exit 0
      fi
    fi
  done
  echo "FAILED: Could not import $module"
  exit 1
}

verify_js() {
  local pkg="$1"
  if command -v bun &>/dev/null; then
    if bun pm ls "$pkg" 2>/dev/null | grep -q "$pkg"; then
      echo "VERIFIED:$(bun pm ls "$pkg" 2>/dev/null)"
      exit 0
    fi
  fi
  echo "FAILED: $pkg not found in node_modules"
  exit 1
}

verify_system() {
  local pkg="$1"
  if command -v "$pkg" &>/dev/null; then
    local version=$("$pkg" --version 2>&1 | head -1)
    echo "VERIFIED: $pkg - $version"
    exit 0
  fi
  echo "FAILED: $pkg not found in PATH"
  exit 1
}

case "$TYPE" in
  python) verify_python "$MODULE" ;;
  js)     verify_js "$PACKAGE" ;;
  system) verify_system "$PACKAGE" ;;
  *)      echo "Unknown type: $TYPE"; exit 1 ;;
esac
