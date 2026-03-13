#!/bin/bash
# Detect skill/command changes since last git tag
# Usage: detect-changes.sh <repo-root> <plugin-dir>
# Output: YAML-formatted change list (deduplicated by name, priority: added > removed > renamed > modified)

set -euo pipefail

REPO_ROOT="${1:?Usage: detect-changes.sh <repo-root> <plugin-dir>}"
PLUGIN_DIR="${2:?Usage: detect-changes.sh <repo-root> <plugin-dir>}"
cd "$REPO_ROOT"

# Use rtk if available, fall back to standard commands
if command -v rtk &>/dev/null; then
    GIT="rtk git"
    FIND="rtk find"
else
    GIT="git"
    FIND="find"
fi

# Get last tag or fall back to recent history
LAST_TAG=$($GIT describe --tags --abbrev=0 2>/dev/null || echo "")

if [ -z "$LAST_TAG" ]; then
    echo "# No tags found, comparing last 20 commits"
    BASE="HEAD~20"
else
    echo "# Since: $LAST_TAG"
    BASE="$LAST_TAG"
fi

# Action priority: added=1, removed=2, renamed=3, modified=4 (lower = higher priority)
action_priority() {
    case "$1" in
        added) echo 1 ;;
        removed) echo 2 ;;
        renamed) echo 3 ;;
        modified) echo 4 ;;
        *) echo 9 ;;
    esac
}

# Collect all changes, deduplicate by (type, name), keep highest priority action
declare -A seen

# Detect skill changes (only if skills dir exists)
if [ -d "${PLUGIN_DIR}/skills" ]; then
    while IFS=$'\t' read -r status path; do
        skill_name=$(echo "$path" | sed "s|${PLUGIN_DIR}/skills/||" | cut -d'/' -f1)
        case "$status" in
            A*) action="added" ;;
            M*) action="modified" ;;
            D*) action="removed" ;;
            R*) action="renamed" ;;
            *) continue ;;
        esac
        key="skill:$skill_name"
        new_pri=$(action_priority "$action")
        if [ -z "${seen[$key]:-}" ]; then
            seen[$key]="$action"
        else
            old_pri=$(action_priority "${seen[$key]}")
            if [ "$new_pri" -lt "$old_pri" ]; then
                seen[$key]="$action"
            fi
        fi
    done < <(git diff --name-status "$BASE" HEAD -- "${PLUGIN_DIR}/skills/" 2>/dev/null)
fi

# Detect command changes (only if commands dir exists)
if [ -d "${PLUGIN_DIR}/commands" ]; then
    while IFS=$'\t' read -r status path; do
        cmd_name=$(basename "$path" .md)
        case "$status" in
            A*) action="added" ;;
            M*) action="modified" ;;
            D*) action="removed" ;;
            R*) action="renamed" ;;
            *) continue ;;
        esac
        key="command:$cmd_name"
        new_pri=$(action_priority "$action")
        if [ -z "${seen[$key]:-}" ]; then
            seen[$key]="$action"
        else
            old_pri=$(action_priority "${seen[$key]}")
            if [ "$new_pri" -lt "$old_pri" ]; then
                seen[$key]="$action"
            fi
        fi
    done < <(git diff --name-status "$BASE" HEAD -- "${PLUGIN_DIR}/commands/" 2>/dev/null)
fi

# Output
echo "changes:"
for key in $(echo "${!seen[@]}" | tr ' ' '\n' | sort); do
    type="${key%%:*}"
    name="${key#*:}"
    action="${seen[$key]}"
    echo "  - type: $type, name: $name, action: $action"
done

# Current counts
echo ""
echo "counts:"
if [ -d "${PLUGIN_DIR}/skills" ]; then
    SKILL_COUNT=$(find "${PLUGIN_DIR}/skills" -maxdepth 1 -mindepth 1 -type d 2>/dev/null | wc -l)
else
    SKILL_COUNT=0
fi
if [ -d "${PLUGIN_DIR}/commands" ]; then
    CMD_COUNT=$(find "${PLUGIN_DIR}/commands" -maxdepth 1 -name '*.md' 2>/dev/null | wc -l)
else
    CMD_COUNT=0
fi
echo "  skills: $SKILL_COUNT"
echo "  commands: $CMD_COUNT"
