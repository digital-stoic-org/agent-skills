---
name: commit-repo
description: Streamlined git commit for praxis-managed repos. Single human gate for scope + message approval. Use when committing changes, "commit repo", "commit praxis", "commit nano-vc".
argument-hint: "<repo-alias> [--all]"
allowed-tools: [Bash, Read, Edit]
model: sonnet
context: main
user-invocable: true
---

# Commit Repo

Streamlined commit flow for praxis-managed repos. One human gate only.

## Repo Resolution

Resolve `<repo-alias>` to a git-managed path:

1. If alias is the **project root name** (e.g., `praxis`): use CWD (the project root itself)
2. Otherwise: look up alias in **CLAUDE.md → Alias Paths** section, extract the `data` path

Example CLAUDE.md format:
```
## Alias Paths

- **nano-vc**: control `/praxis/repos/nano-vc` | data `/home/mat/dev/nano-vc`
- **agent-skills**: control `/praxis/repos/agent-skills` | data `/home/mat/dev/agent-skills`
```

The `data` value = the git repo path to commit in.

If alias not found, list available aliases from CLAUDE.md and exit.

## Arguments

- `$ARGUMENTS` first word = repo alias (required)
- `--all` flag: stage all modified files before committing (runs `git add -A`)
- Without `--all`: only commits what's already staged

## Flow

**CRITICAL: Each git command MUST be a separate Bash call. NEVER chain with `&&`, `||`, or `;`. This enables auto-approval via permission rules.**

### Phase 1: Recon (auto-approved, no human gate)

Run these as **separate sequential Bash calls**:

1. `git -C <data-path> status`
2. `git -C <data-path> diff --staged` (if no `--all` flag)
   OR `git -C <data-path> diff` (if `--all` flag, to show what will be staged)
3. `git -C <data-path> log --oneline -5`

### Phase 2: Analyze + Propose

From the recon output:
1. List files that will be committed (staged files, or all modified if `--all`)
2. Determine conventional commit `type(scope): description` per CLAUDE.md rules
3. Draft commit body: `What:` bullets + `Why:` line

### Phase 3: Propose + Execute (single human gate)

**DO NOT wait for user confirmation after the proposal.** Output the proposal text, then immediately fire the commit command. The Bash permission prompt on `git commit` IS the single human gate.

1. Output the proposal as text (no pause):
```
📦 Commit proposal for <alias> (<branch>)

Staged files:
- file1
- file2

Commit message:
type(scope): description

What:
- change 1
- change 2

Why: reason
```

2. If `--all`: `git -C <data-path> add -A` (user approves this Bash call)
3. Immediately run `git -C <data-path> commit -m "<message>"` — user approves or denies here. If denied, ask what to change.

Use HEREDOC for multi-line messages:
```
git -C <data-path> commit -m "$(cat <<'EOF'
subject line

What:
- change 1
- change 2

Why: reason
EOF
)"
```

4. After successful commit: `git -C <data-path> log --oneline -1` (auto-approved, verify success)

Report: ✅ Committed `<short-hash>` to `<branch>` in `<alias>`

## Rules

- **NEVER chain git commands** — one command per Bash call
- **NEVER add co-author tags** — per CLAUDE.md
- **NEVER push** — user does this manually via IDE
- If no changes to commit, report and exit
- If alias not recognized, list available aliases and exit

## Setup Requirements

### 1. CLAUDE.md Alias Paths

Your project CLAUDE.md must have an `## Alias Paths` section with `data` paths pointing to git repos:

```markdown
## Alias Paths

- **my-repo**: control `/praxis/repos/my-repo` | data `/path/to/my-repo`
```

### 2. Permission Rules (settings.json)

Add auto-approve rules for read-only git commands on each repo path. Example for `~/.claude/settings.json`:

```json
"permissions": {
  "allow": [
    "Bash(git -C /path/to/repo status *)",
    "Bash(git -C /path/to/repo status)",
    "Bash(git -C /path/to/repo diff *)",
    "Bash(git -C /path/to/repo diff)",
    "Bash(git -C /path/to/repo log *)"
  ]
}
```

This keeps recon (Phase 1) zero-approval. The `git add` and `git commit` calls in Phase 3 remain prompted — serving as the single human gate.
