---
name: install-dependency
description: Monorepo-aware dependency installation. Scans parent dirs, prompts shared vs local, auto-installs bun.
tools: Bash, AskUserQuestion
model: sonnet
---

# Install Dependency

Install missing dependencies with monorepo awareness.

## Environment Setup

**CRITICAL**: All install commands MUST run with local TMPDIR to avoid /tmp/claude conflicts:

```bash
# Set local temp directory
LOCAL_TMP="${PWD}/.tmp"
mkdir -p "$LOCAL_TMP"

# Override temp directories
export TMPDIR="$LOCAL_TMP"
export TEMP="$LOCAL_TMP"
export TMP="$LOCAL_TMP"

# Unset Claude Code env vars that force /tmp/claude
unset CLAUDECODE
unset CLAUDE_CODE_ENTRYPOINT

# Bun-specific overrides
export BUN_TMPDIR="$LOCAL_TMP"
export BUN_INSTALL_CACHE_DIR="$LOCAL_TMP"

# Python-specific
export PYTHONUSERBASE="$HOME/.local"

# NPM-specific
export npm_config_tmp="$LOCAL_TMP"
```

## Rules

| Type | Location | Method |
|------|----------|--------|
| Python | `.venv/` | pip (venv) |
| JS/TS | `node_modules/` | bun (auto-install) |
| System | OS pkg mgr | apt/brew/dnf (approval required) |

## Workflow

### 1. Setup Environment (ALWAYS FIRST)

```bash
# Create local temp directory
LOCAL_TMP="${PWD}/.tmp"
mkdir -p "$LOCAL_TMP"

# Override all temp directories
export TMPDIR="$LOCAL_TMP" TEMP="$LOCAL_TMP" TMP="$LOCAL_TMP"
export BUN_TMPDIR="$LOCAL_TMP" BUN_INSTALL_CACHE_DIR="$LOCAL_TMP"
export npm_config_tmp="$LOCAL_TMP"

# Unset Claude Code environment
unset CLAUDECODE CLAUDE_CODE_ENTRYPOINT

# Get git root (scan boundary)
GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "")
```

### 2. Detect & Scan Parents

```bash
# Python: scan upward for .venv with package
for dir in . .. ../.. $GIT_ROOT; do
  if [ -d "$dir/.venv" ]; then
    source "$dir/.venv/bin/activate" 2>/dev/null
    pip show <package> &>/dev/null && echo "FOUND:$dir" && break
  fi
done

# JS: scan upward for node_modules/<package>
for dir in . .. ../.. $GIT_ROOT; do
  [ -f "$dir/node_modules/<package>/package.json" ] && echo "FOUND:$dir" && break
done
```

### 3. Decision Flow

```yaml
if_found_at_parent:
  action: Report "✓ <package> already at <path>"
  install: false

if_at_git_root:
  action: Install locally (no prompt)

if_in_subproject_not_found:
  action: Prompt user
  options:
    - "Shared (recommended)" → install at $GIT_ROOT
    - "Local (isolated)" → install at current dir
```

### 4. Install

**Python:**
```bash
# Shared
$GIT_ROOT/.venv/bin/pip install <package>

# Local (create venv if missing)
[ ! -d ".venv" ] && python3 -m venv .venv
source .venv/bin/activate && pip install --upgrade pip && pip install <package>
```

**JS/TS (auto-install bun with TMPDIR override):**
```bash
# Install bun if missing (with TMPDIR override)
if ! command -v bun &>/dev/null; then
  # Ensure temp override is active
  export TMPDIR="$LOCAL_TMP" BUN_TMPDIR="$LOCAL_TMP"

  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
fi

# Shared
bun add <package> --cwd $GIT_ROOT

# Local
bun add <package>
```

**System (approval required):**
```bash
# Detect pkg manager
PKG_MGR=$(command -v apt || command -v brew || command -v dnf)

# MUST prompt: "Install <pkg> via <PKG_MGR>? (requires sudo)"
sudo $PKG_MGR install -y <package>
```

### 5. Verify

```bash
# Python
python -c "import <module>"

# JS
bun pm ls <package>

# System
which <tool> && <tool> --version
```

## Output

```
✓ Installed <package>
  Location: <path>
  Method: <venv/bun/apt/brew>
```

## Cleanup

```bash
# Optional: Remove temp directory after successful install
rm -rf "$LOCAL_TMP"
```
