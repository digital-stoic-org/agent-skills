#!/usr/bin/env bash
#
# git-commit.sh - Claude-assisted git micro-commits
# Uses Haiku model for fast, cost-effective commit message generation
#

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_NAME="$(basename "$0")"
MODEL="haiku"
DEFAULT_MODE="assisted"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ============================================================================
# Helper Functions
# ============================================================================

log_info()    { echo -e "${BLUE}ℹ${NC} $*"; }
log_success() { echo -e "${GREEN}✅${NC} $*"; }
log_warn()    { echo -e "${YELLOW}⚠️${NC} $*"; }
log_error()   { echo -e "${RED}❌${NC} $*" >&2; }

usage() {
    cat <<EOF
Usage: $SCRIPT_NAME [OPTIONS] [FILES...]

Claude-assisted git micro-commits with Haiku model.

Modes:
  -a, --assisted    Interactive mode (default) - prompts at each step
  --auto            Automated mode - runs end-to-end, asks only if needed

Options:
  -p, --push        Push after commit (with confirmation in assisted mode)
  --no-push         Skip push (default)
  -s, --scope SCOPE Override scope detection (default: folder name)
  --dry-run         Show what would happen without executing
  -h, --help        Show this help message

Examples:
  $SCRIPT_NAME                      # Assisted mode, auto-detect files
  $SCRIPT_NAME --auto               # Full auto, staged files only
  $SCRIPT_NAME -a src/*.ts          # Assisted, specific files
  $SCRIPT_NAME --auto --push        # Auto commit + push
EOF
    exit 0
}

# Check if we're in a git repo
check_git_repo() {
    if ! git rev-parse --is-inside-work-tree &>/dev/null; then
        log_error "Not a git repository"
        exit 1
    fi
}

# Check if claude CLI is available
check_claude() {
    if ! command -v claude &>/dev/null; then
        log_error "claude CLI not found. Install from: https://claude.ai/code"
        exit 1
    fi
}

# Detect scope from git root folder name or current directory
detect_scope() {
    local git_root
    git_root=$(git rev-parse --show-toplevel 2>/dev/null)
    basename "$git_root"
}

# Get list of staged files
get_staged_files() {
    git diff --cached --name-only 2>/dev/null
}

# Get list of modified (unstaged) files
get_modified_files() {
    git diff --name-only 2>/dev/null
}

# Get list of untracked files
get_untracked_files() {
    git ls-files --others --exclude-standard 2>/dev/null
}

# Interactive file selection with fzf or fallback to select
select_files_interactive() {
    local all_files=()
    local staged modified untracked

    # Collect all files with status prefix
    while IFS= read -r file; do
        [[ -n "$file" ]] && all_files+=("staged:$file")
    done < <(get_staged_files)

    while IFS= read -r file; do
        [[ -n "$file" ]] && all_files+=("modified:$file")
    done < <(get_modified_files)

    while IFS= read -r file; do
        [[ -n "$file" ]] && all_files+=("untracked:$file")
    done < <(get_untracked_files)

    if [[ ${#all_files[@]} -eq 0 ]]; then
        log_error "No files to commit (nothing staged, modified, or untracked)"
        exit 1
    fi

    # Display to stderr so it doesn't mix with return values
    echo -e "${CYAN}Available files:${NC}" >&2

    # Check if fzf is available
    if command -v fzf &>/dev/null; then
        printf '%s\n' "${all_files[@]}" | fzf --multi --prompt="Select files (TAB to multi-select, ENTER to confirm): "
    else
        # Fallback to numbered selection
        local i=1
        for file in "${all_files[@]}"; do
            echo "  $i) $file" >&2
            ((i++))
        done

        echo "" >&2
        read -rp "Enter file numbers (space-separated) or 'all': " selection

        if [[ "$selection" == "all" ]]; then
            printf '%s\n' "${all_files[@]}"
        else
            for num in $selection; do
                if [[ "$num" =~ ^[0-9]+$ ]] && (( num > 0 && num <= ${#all_files[@]} )); then
                    echo "${all_files[$((num-1))]}"
                fi
            done
        fi
    fi
}

# Stage files for commit
stage_files() {
    local files=("$@")
    for entry in "${files[@]}"; do
        # Remove status prefix (staged:, modified:, untracked:)
        local file="${entry#*:}"
        git add "$file"
        log_info "Staged: $file"
    done
}

# Generate commit message using Claude Haiku
generate_commit_message() {
    local scope="$1"
    local diff
    diff=$(git diff --cached)

    if [[ -z "$diff" ]]; then
        log_error "No staged changes to generate commit message for"
        exit 1
    fi

    local prompt
    prompt=$(cat <<EOF
Analyze this git diff and generate a commit message.

FORMAT: type(scope): description
- Types: feat|fix|docs|refactor|test|chore|perf|build|ci
- Scope: $scope
- Deliverables (analysis/specs/research) = feat, not docs
- Keep description concise (under 72 chars total)
- NO Claude/Anthropic attribution or co-author tags

DIFF:
$diff

Output ONLY the commit message on a single line, nothing else.
EOF
)

    log_info "Generating commit message with Claude Haiku..."

    # Use claude CLI with haiku model, print mode
    local message
    message=$(claude --model "$MODEL" --print "$prompt" 2>/dev/null)

    # Clean up any extra whitespace/newlines
    message=$(echo "$message" | tr -d '\n' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

    echo "$message"
}

# Confirm action in assisted mode
confirm() {
    local prompt="$1"
    local default="${2:-n}"

    local yn_prompt
    if [[ "$default" == "y" ]]; then
        yn_prompt="[Y/n]"
    else
        yn_prompt="[y/N]"
    fi

    read -rp "$prompt $yn_prompt: " response
    response=${response:-$default}

    [[ "$response" =~ ^[Yy]$ ]]
}

# Edit message with $EDITOR
edit_message() {
    local message="$1"
    local tmpfile
    tmpfile=$(mktemp)

    echo "$message" > "$tmpfile"
    ${EDITOR:-vim} "$tmpfile"
    cat "$tmpfile"
    rm -f "$tmpfile"
}

# ============================================================================
# Main Logic
# ============================================================================

main() {
    local mode="$DEFAULT_MODE"
    local push=false
    local scope=""
    local dry_run=false
    local files=()

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -a|--assisted)
                mode="assisted"
                shift
                ;;
            --auto)
                mode="auto"
                shift
                ;;
            -p|--push)
                push=true
                shift
                ;;
            --no-push)
                push=false
                shift
                ;;
            -s|--scope)
                scope="$2"
                shift 2
                ;;
            --dry-run)
                dry_run=true
                shift
                ;;
            -h|--help)
                usage
                ;;
            -*)
                log_error "Unknown option: $1"
                usage
                ;;
            *)
                files+=("$1")
                shift
                ;;
        esac
    done

    # Preflight checks
    check_git_repo
    check_claude

    # Auto-detect scope if not provided
    if [[ -z "$scope" ]]; then
        scope=$(detect_scope)
    fi

    log_info "Mode: $mode | Scope: $scope | Push: $push"

    # ========================================================================
    # File Selection
    # ========================================================================

    local selected_files=()

    if [[ ${#files[@]} -gt 0 ]]; then
        # Files provided as arguments
        for f in "${files[@]}"; do
            selected_files+=("provided:$f")
        done
    elif [[ "$mode" == "auto" ]]; then
        # Auto mode: use staged files only
        while IFS= read -r file; do
            [[ -n "$file" ]] && selected_files+=("staged:$file")
        done < <(get_staged_files)

        if [[ ${#selected_files[@]} -eq 0 ]]; then
            log_error "Auto mode requires staged files. Stage files first with 'git add'"
            exit 1
        fi
    else
        # Assisted mode: interactive selection
        while IFS= read -r file; do
            [[ -n "$file" ]] && selected_files+=("$file")
        done < <(select_files_interactive)
    fi

    if [[ ${#selected_files[@]} -eq 0 ]]; then
        log_error "No files selected"
        exit 1
    fi

    # ========================================================================
    # Stage Files
    # ========================================================================

    log_info "Staging ${#selected_files[@]} file(s)..."

    if [[ "$dry_run" == true ]]; then
        log_warn "[DRY-RUN] Would stage:"
        for entry in "${selected_files[@]}"; do
            local file="${entry#*:}"
            echo "  $file"
        done
    else
        stage_files "${selected_files[@]}"
    fi

    # ========================================================================
    # Generate Commit Message
    # ========================================================================

    local commit_message

    if [[ "$dry_run" == true ]]; then
        log_warn "[DRY-RUN] Would generate commit message with Claude Haiku"
        commit_message="feat($scope): dry-run placeholder message"
    else
        commit_message=$(generate_commit_message "$scope")
    fi

    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}Proposed commit message:${NC}"
    echo ""
    echo "  $commit_message"
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    # ========================================================================
    # Commit
    # ========================================================================

    if [[ "$mode" == "assisted" ]]; then
        echo ""
        echo "Options: [c]onfirm, [e]dit, [a]bort"
        read -rp "Action: " action

        case "$action" in
            c|C|confirm)
                # proceed
                ;;
            e|E|edit)
                commit_message=$(edit_message "$commit_message")
                commit_message=$(echo "$commit_message" | tr -d '\n' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
                echo -e "${GREEN}Updated message:${NC} $commit_message"
                ;;
            a|A|abort|*)
                log_warn "Aborted"
                git restore --staged . 2>/dev/null || true
                exit 0
                ;;
        esac
    fi

    if [[ "$dry_run" == true ]]; then
        log_warn "[DRY-RUN] Would commit with message: $commit_message"
    else
        git commit -m "$commit_message"
        log_success "Committed!"
    fi

    # ========================================================================
    # Push (optional)
    # ========================================================================

    if [[ "$push" == true ]]; then
        # Check SSH agent
        if [[ -z "${SSH_AUTH_SOCK:-}" ]]; then
            log_warn "SSH_AUTH_SOCK not set - push may fail for SSH remotes"
        fi

        if [[ "$mode" == "assisted" ]]; then
            if ! confirm "Push to remote?"; then
                log_info "Skipping push"
                exit 0
            fi
        fi

        if [[ "$dry_run" == true ]]; then
            log_warn "[DRY-RUN] Would push to remote"
        else
            log_info "Pushing to remote..."
            git push
            log_success "Pushed!"
        fi
    fi

    log_success "Done!"
}

main "$@"
