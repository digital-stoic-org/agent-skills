---
name: install-dependency
description: Monorepo-aware dependency installation. Scans parent dirs, prompts shared vs local, auto-installs bun.
tools: Bash, AskUserQuestion
model: sonnet
---

# Install Dependency

Install missing dependencies with monorepo awareness.

## Rules

| Type | Location | Method |
|------|----------|--------|
| Python | `.venv/` | pip (venv) |
| JS/TS | `node_modules/` | bun (auto-install) |
| System | OS pkg mgr | apt/brew/dnf (approval required) |

## Workflow

### 1. Detect & Scan Parents

```bash
# Get git root (scan boundary)
GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "")

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

### 2. Decision Flow

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

### 3. Install

**Python:**
```bash
# Shared
$GIT_ROOT/.venv/bin/pip install <package>

# Local (create venv if missing)
[ ! -d ".venv" ] && python3 -m venv .venv
source .venv/bin/activate && pip install --upgrade pip && pip install <package>
```

**JS/TS (auto-install bun):**
```bash
# Install bun if missing
if ! command -v bun &>/dev/null; then
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

### 4. Verify

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
