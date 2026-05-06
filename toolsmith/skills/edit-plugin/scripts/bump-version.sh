#!/bin/bash
# Bump semver version
# Usage: bump-version.sh <current-version> <patch|minor>
# Output: new version string
# Note: Pure bash arithmetic — no external commands needed (rtk not applicable)

set -euo pipefail

VERSION="${1:?Usage: bump-version.sh <version> <patch|minor>}"
BUMP="${2:?Usage: bump-version.sh <version> <patch|minor>}"

IFS='.' read -r MAJOR MINOR PATCH <<< "$VERSION"

case "$BUMP" in
    patch)
        PATCH=$((PATCH + 1))
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    *)
        echo "Error: bump type must be 'patch' or 'minor'" >&2
        exit 1
        ;;
esac

echo "${MAJOR}.${MINOR}.${PATCH}"
