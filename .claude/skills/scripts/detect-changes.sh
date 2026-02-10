#!/bin/bash
# Detect skill/command changes since last git tag
# Usage: detect-changes.sh <plugin-root>
# Output: YAML-formatted change list (deduplicated by name, priority: added > removed > renamed > modified)

set -euo pipefail

PLUGIN_ROOT="${1:-.}"
cd "$PLUGIN_ROOT"

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

# git diff --name-status needs raw git (rtk reformats output)
# Use raw git here since we parse structured output
while IFS=$'\t' read -r status path; do
    skill_name=$(echo "$path" | sed 's|dstoic/skills/||' | cut -d'/' -f1)
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
done < <(git diff --name-status "$BASE" HEAD -- dstoic/skills/ 2>/dev/null)

# Detect command changes
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
done < <(git diff --name-status "$BASE" HEAD -- dstoic/commands/ 2>/dev/null)

# Output
echo "changes:"
for key in $(echo "${!seen[@]}" | tr ' ' '\n' | sort); do
    type="${key%%:*}"
    name="${key#*:}"
    action="${seen[$key]}"
    echo "  - type: $type, name: $name, action: $action"
done

# Current counts — use rtk find for display, raw find for counting
echo ""
echo "counts:"
SKILL_COUNT=$(find dstoic/skills -maxdepth 1 -mindepth 1 -type d 2>/dev/null | wc -l)
CMD_COUNT=$(find dstoic/commands -maxdepth 1 -name '*.md' 2>/dev/null | wc -l)
echo "  skills: $SKILL_COUNT"
echo "  commands: $CMD_COUNT"
