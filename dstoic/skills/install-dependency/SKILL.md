---
name: install-dependency
description: >
  Install dependencies with monorepo awareness. Use when: user asks to install
  a package, add a dependency, or setup Python/JS packages. Triggers: "install X",
  "add package", "setup dependency", "I need lodash", "install docling".
allowed-tools:
  - Bash
  - AskUserQuestion
---

# Install Dependency

Monorepo-aware dependency installation using bundled scripts.

## Quick Reference

**Types**: `python` (pip), `js` (bun), `system` (apt/brew/dnf)

```bash
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SKILL_DIR/scripts/setup-env.sh"           # 1. Setup env
"$SKILL_DIR/scripts/scan.sh" <pkg> <type>          # 2. Check existing
# 3. Prompt user if needed (see below)
"$SKILL_DIR/scripts/install-{python,js,system}.sh" <pkg> [shared|local]  # 4. Install
"$SKILL_DIR/scripts/verify.sh" <pkg> <type>        # 5. Verify
"$SKILL_DIR/scripts/cleanup.sh"                    # 6. Cleanup (optional)
```

## Workflow

### 1. Setup Environment

```bash
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SKILL_DIR/scripts/setup-env.sh"
```

Sets `$LOCAL_TMP`, `$GIT_ROOT`, overrides `$TMPDIR` to avoid /tmp/claude conflicts.

### 2. Scan for Existing Package

```bash
if "$SKILL_DIR/scripts/scan.sh" <package> <type>; then
  echo "✓ Package already installed"
  exit 0
fi
```

Exit codes: 0=found, 1=not found, 2=usage error.

### 3. Prompt User (if needed)

**Decision tree:**

```yaml
if_found_in_parent:
  action: Report "✓ <package> already at <path>"
  install: false

if_at_git_root:
  action: Install locally (no prompt)
  mode: local

if_in_subproject_not_found:
  action: Use AskUserQuestion
  options:
    - "Shared at {GIT_ROOT} (recommended)" → mode=shared
    - "Local at {PWD} (isolated)" → mode=local
```

**AskUserQuestion example:**

```yaml
question: "Where should {package} be installed?"
header: "Location"
options:
  - label: "Shared at {GIT_ROOT} (recommended)"
    description: "Install once, available to all subprojects"
  - label: "Local at {PWD} (isolated)"
    description: "Install only for this project"
```

### 4. Install Package

**Python:**
```bash
"$SKILL_DIR/scripts/install-python.sh" <package> [shared|local]
```

**JavaScript:**
```bash
"$SKILL_DIR/scripts/install-js.sh" <package> [shared|local]
```

**System (requires approval):**
```bash
# First check needs approval
"$SKILL_DIR/scripts/install-system.sh" <package>
# Output: NEEDS_APPROVAL:<package> via apt/brew/dnf

# After AskUserQuestion approval:
APPROVED=1 "$SKILL_DIR/scripts/install-system.sh" <package>
```

### 5. Verify Installation

```bash
"$SKILL_DIR/scripts/verify.sh" <package> <type> [module_name]
```

Optional `module_name` for Python packages where import name differs (e.g., `PIL` vs `pillow`).

### 6. Cleanup (optional)

```bash
"$SKILL_DIR/scripts/cleanup.sh"
```

Removes `$LOCAL_TMP` (.tmp/) directory.

## Output Format

```
✓ Installed <package>
  Location: <path>
  Method: <pip/bun/apt/brew/dnf>
```

## Scripts Reference

| Script | Args | Exit Codes | Output |
|--------|------|------------|--------|
| setup-env.sh | (none, source it) | - | Sets env vars |
| scan.sh | pkg type | 0=found, 1=not found | FOUND:path or NOT_FOUND |
| install-python.sh | pkg [shared\|local] | 0=success | INSTALLED:path |
| install-js.sh | pkg [shared\|local] | 0=success | INSTALLED:path |
| install-system.sh | pkg | 0=success | NEEDS_APPROVAL or INSTALLED:system |
| verify.sh | pkg type [module] | 0=success, 1=failed | VERIFIED:path or FAILED |
| cleanup.sh | (none) | 0=success | CLEANED:path |
