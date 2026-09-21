# CLAUDE.md Reference Guide

## Official Documentation Sources

This guide is based on the Claude Code memory documentation, the primary resource for CLAUDE.md purpose and best practices.

Source: https://code.claude.com/docs/en/memory (consulted 2026-09-21).

## What is CLAUDE.md?

> "CLAUDE.md files are markdown files that give Claude persistent instructions for a project, your personal workflow, or your entire organization."

CLAUDE.md is Claude Code's **memory system**—persistent text files that provide context across sessions without requiring repetition.

### Organizational Hierarchy

CLAUDE.md exists at several scopes: managed policy (organization-wide), user (`~/.claude/CLAUDE.md`), project (`CLAUDE.md`, shared via source control) and project-local (`CLAUDE.local.md`, personal). For load order, on-demand loading and how files combine, see § Memory Hierarchy and Loading.

## Templates

### Basic Project Template

```markdown
# Project: [Project Name]

## Build Commands

- Build: `npm run build`
- Test: `npm test`
- Lint: `npm run lint`
- Deploy: `npm run deploy`

## Code Style

- Use 2-space indentation
- Follow ESLint config in `.eslintrc.json`
- Use camelCase for variables and functions
- Use PascalCase for classes and components

## Architecture

- Follow MVC pattern for controllers
- Place utilities in `/src/utils`
- Document complex functions with JSDoc

## Security

- Never commit credentials
- Use environment variables for secrets
- Review security implications before merging
```

### Advanced Multi-File Template (with imports)

**CLAUDE.md (root)**
```markdown
# Project Standards

## Build Commands
- Build: `npm run build`
- Test: `npm run test`

@./docs/coding-standards.md
@./docs/security-policy.md
```

**docs/coding-standards.md**
```markdown
## Code Style

- Use 2-space indentation
- Follow Prettier configuration
- Use TypeScript strict mode

## Naming Conventions

- Files: kebab-case
- Variables: camelCase
- Constants: UPPER_SNAKE_CASE
- Types: PascalCase
```

**docs/security-policy.md**
```markdown
## Security Standards

- All PRs require security review
- Use GitHub Secrets for API keys
- Run `npm audit` before merging
- Follow OWASP Top 10 guidelines
```

### Python Project Template

```markdown
# Python Project Standards

## Environment

- Python 3.11+
- Use virtual environment: `python -m venv venv`
- Install: `pip install -r requirements.txt`

## Code Style

- Follow PEP 8
- Use 4-space indentation
- Format with Black: `black .`
- Lint with Flake8: `flake8 .`
- Type hints required for functions

## Testing

- Use pytest: `pytest tests/`
- Minimum 80% code coverage
- Run: `pytest --cov=src tests/`

## Architecture

- Place modules in `/src`
- Tests mirror source structure in `/tests`
- Config files in `/config`
```

### Non-Technical Project with File Zones (ref/wip)

For creative/business projects where users work with reference docs + working documents:

```markdown
# Project: Lendemain Branding

## Identity

**State**: [brand identity statement]
**Persona**: [target description]
**Voice**: [communication style]

## File Zones

- 🔒 ref/ (or reference/) — READ-ONLY. Never edit unless user explicitly says "update ref". Show diff and ask first.
- ✏️ wip/ (or work-in-progress/) — Default workspace. All new files and edits go here.
- 🔒 .in/ — READ-ONLY archive. Never modify.

## Rules

1. Stay sober, precise, zero excessive promises
2. Keep brand voice consistent with ref/persona
3. All content in French unless otherwise requested
4. Persona data lives in ref/ — never duplicate in wip/
```

### Minimal Template

```markdown
# Quick Reference

Build: `make build`
Test: `make test`
Deploy: `make deploy`

## Style
- 2-space indent
- ESLint enforced
- TypeScript strict

## Conventions
- Files: kebab-case
- Variables: camelCase
- Types: PascalCase
```

## Modular Rules Organization

Use `.claude/rules/` directory to distribute content across focused files. All `.md` files in this directory are **automatically loaded** by Claude Code.

### Basic Structure

```
.claude/
├── CLAUDE.md              # Main universal rules (target under 200 lines)
├── CLAUDE.local.md        # Personal preferences; add to .gitignore
└── rules/
    ├── code-style.md      # Language/formatting
    ├── security.md        # Security standards
    ├── testing.md         # Test conventions
    ├── frontend/          # Subdirectory grouping
    │   ├── react.md
    │   └── styles.md
    └── backend/
        ├── api.md
        └── database.md
```

### Path-Specific Rules

Use YAML frontmatter to apply rules only to specific file paths:

```markdown
---
paths:
  - "src/api/**/*.ts"
  - "lib/endpoints/**/*.ts"
  - "tests/api/**/*.test.ts"
---

# API Development Rules

- All endpoints must validate input with Zod
- Use standard error response: `{error: string, code: number}`
- Include OpenAPI JSDoc comments
- Rate limit: 100 req/min per user
```

**Glob patterns supported:**
- `**/*.ts` — All TypeScript files
- `src/**/*.{ts,tsx}` — Multiple extensions
- `{src,lib}/**/*.ts` — Multiple directories
- `src/components/*.tsx` — Specific directory only

### When to Use Modular Rules

- **Path/language-specific content** (Python rules for `*.py`, JS rules for `*.js/*.ts`)
- **Domain-specific patterns** (frontend/, backend/, infra/ subdirectories)
- **Path-specific constraints** (validation, patterns for certain file paths)
- **Large single topic** (when the topic is separable and not universal)

### When NOT to Use Modular Rules

- **Universal cohesive sections** (Git workflow, Security policies, Planning methodology, Style guides)
- **Conceptually related content** (Don't fragment: keep pre-commit workflow with commit conventions)
- **Cross-cutting concerns** (Content that applies to ALL files/operations regardless of path)
- **Short universal sections** (if the main file stays near the 200-line target, keep universal content together)

### CLAUDE.local.md Pattern

**Personal preferences (personal; add to .gitignore so the file isn't committed):**

```markdown
# Personal Development Setup

## Local Shortcuts
- Skip E2E tests locally (run in CI)
- Use verbose logging in dev mode
- Mock API: http://localhost:3001

## Experimental Rules
- Testing new commit message format
- Trying functional components only
```

---

## Import Syntax

### Inline References

```markdown
See @README for project overview and @package.json for available npm commands.
```

### Block Imports

```markdown
# Git Workflow
@docs/git-instructions.md

# Architecture
@docs/architecture.md
```

### Home Directory Imports

```markdown
# Personal preferences shared across projects
@~/.claude/my-project-preferences.md
```

### Recursive Imports

Supports up to **5 hops** maximum depth:

```markdown
# Main CLAUDE.md
@./base-standards.md
```

```markdown
# base-standards.md
@./coding-style.md
@./testing-standards.md
```

### Important Notes

- Imports NOT evaluated inside code blocks/spans: `` `@anthropic-ai/claude-code` `` is safe
- Use `/memory` command during session to view loaded memories
- Relative paths: `@./docs/standards.md` (relative to CLAUDE.md)
- Absolute paths: `@/home/user/shared/guidelines.md`

### Cross-Team Guidelines

```markdown
# Project CLAUDE.md
@/shared/company-standards.md
@~/.claude/my-preferences.md

## Project-Specific

- Build: `npm run build`
- Test: `npm test`
```

## Optimization Strategies

Compress the wording, never the reasons. Cut filler, politeness and narration, but keep the "because" attached to each behavioral rule: a rule cut from its reason gets applied rigidly or in the wrong place. Use full words rather than abbreviations or sentence fragments.

### Before: Verbose Prose

```markdown
## Testing Standards

When writing tests for this project, please ensure that you always write unit tests for any new functionality. The tests should be comprehensive and cover edge cases. We use Jest as our testing framework, so please make sure you're familiar with Jest syntax. All tests should be placed in the __tests__ directory next to the source files. Please run the test suite before committing to ensure everything passes.
```

### After: Filler Removed, Content Kept

```markdown
## Testing

- Framework: Jest
- Location: `__tests__/` next to source
- Run `npm test` before committing, so broken tests never reach the shared branch
- Cover edge cases in unit tests for every new function
```

### Optimization Techniques

| Technique | Before | After |
|-----------|--------|-------|
| **Remove filler** | "please make sure that you..." | "Use..." |
| **Bullets for reference data** | Paragraph listing commands and paths | • One bullet per command or path |
| **Use tables** | Multiple bullets with the same shape | Compact table |
| **Commands inline** | "Run the test command which is npm test" | "Test: `npm test`" |
| **Group related** | Scattered items | Organized sections |

### Table Compression Example

**Before**:
```markdown
- For JavaScript files, use .js extension
- For TypeScript files, use .ts extension
- For React components, use .tsx extension
- For test files, use .test.js extension
```

**After**:
```markdown
| Type | Extension |
|------|-----------|
| JavaScript | .js |
| TypeScript | .ts |
| React | .tsx |
| Tests | .test.js |
```

## Common Patterns

### Multi-Language Projects

```markdown
# Polyglot Project

## JavaScript
- Style: Standard.js
- Build: `npm run build`

## Python
- Style: PEP 8
- Build: `python setup.py build`

## Go
- Style: gofmt
- Build: `go build`
```

### Monorepo Structure

```markdown
# Monorepo Standards

## Workspace Commands
- Build all: `npm run build:all`
- Test all: `npm run test:all`

## Package Standards
- Naming: `@company/package-name`
- Versioning: Semantic versioning

@./packages/frontend/STANDARDS.md
@./packages/backend/STANDARDS.md
```

### CI/CD Integration

```markdown
# CI/CD Standards

## GitHub Actions
- All workflows in `.github/workflows/`
- Use GitHub Secrets for API keys (never hardcode)
- Required checks: lint, test, build

## Coding Standards
- Enforced via pre-commit hooks
- Auto-format on save
- Review criteria in CONTRIBUTING.md
```

### Security-First Template

```markdown
# Security Standards

## Authentication
- Use OAuth 2.0 for user auth
- JWT tokens expire in 1 hour
- Refresh tokens in httpOnly cookies

## Secrets Management
- All secrets in environment variables
- Use `.env.example` for templates
- Never commit `.env` to git
- Production secrets in CI/CD vault

## Code Review
- Security review required for:
  - Authentication changes
  - Database queries
  - External API calls
  - File uploads
```

## Content Guidelines

### What to Include ✓

| Content Type | Location | Example |
|--------------|----------|---------|
| Build/test/deploy commands | Main CLAUDE.md | `npm test`, `make build` |
| Universal code style | Main CLAUDE.md | 2-space indent, camelCase |
| Naming conventions | .claude/rules/code-style.md | Files: kebab-case, Types: PascalCase |
| Architectural patterns | .claude/rules/architecture.md | MVC for controllers, utilities in /utils |
| Security policies | .claude/rules/security.md | Never commit credentials, review required |
| Team workflows | Main CLAUDE.md or @import | Git flow, PR process |
| Path-specific rules | .claude/rules/ with frontmatter | API validation for src/api/**/*.ts |

### What to Exclude ✗

| Anti-Pattern | Why | Alternative |
|--------------|-----|-------------|
| Sensitive credentials | Security risk | Environment variables, secrets manager |
| Frequently changing data | Becomes stale | Direct request, issue tracker |
| Temporary instructions | One-time use | Direct request in conversation |
| Verbose documentation | Loaded every session, consumes context and may reduce adherence | Separate docs referenced by path (an @import still loads at launch) |
| One-off tasks | Session-specific | Direct instruction |
| Code style rules handled by linters | Redundant | Let linter enforce |

Note: `@imports` inside code blocks or code spans are not resolved; the text itself is read normally.

---

## Anti-Patterns (What NOT to Do)

### ❌ Including Sensitive Data

```markdown
# DON'T DO THIS
API_KEY=sk_live_abc123xyz789
DATABASE_URL=postgresql://user:password@localhost:5432/db
```

**Why**: Credentials should never be in CLAUDE.md. Use environment variables.

### ❌ Verbose Documentation

```markdown
# DON'T DO THIS
This project is a web application built using Node.js and Express.
It uses PostgreSQL as the database. When you want to start the
development server, you need to first make sure you have all the
dependencies installed by running npm install, and then you can
start the server by running npm start...
```

**Why**: This belongs in README.md, not CLAUDE.md. Be concise.

### ❌ Temporary or Changing Information

```markdown
# DON'T DO THIS
Current sprint: Sprint 23
Active bugs: Bug #456, Bug #789
Next release: v2.3.1 (planned for next Tuesday)
```

**Why**: This information changes frequently. CLAUDE.md is for persistent context.

### ❌ Generic Advice

```markdown
# DON'T DO THIS
- Write clean code
- Use best practices
- Make it maintainable
- Follow conventions
```

**Why**: Too vague. Be specific: "Use 2-space indentation" not "Format properly".

## Decision Tree: CLAUDE.md vs Alternatives

```
Is this information persistent?
├─ NO → Use direct request or temporary note
└─ YES
    │
    Is this information sensitive?
    ├─ YES → Use environment variables or secrets manager
    └─ NO
        │
        Is this frequently referenced?
        ├─ NO → Use README.md or documentation
        └─ YES
            │
            Does the file stay near the 200-line target with it?
            ├─ NO → Use .claude/rules/ with `paths`, or a separate doc referenced by path
            └─ YES → ✓ Use CLAUDE.md
```

## Best Practices Summary

### ✓ DO

- Use specific commands: `npm run build` not "build the project"
- Organize with markdown headings
- Use bullets and tables for reference data (commands, paths, conventions)
- Keep the reason next to each behavioral rule
- Include build/test/deploy commands
- Document naming conventions
- Specify architectural patterns
- Use imports for modular organization
- Review and update periodically

### ✗ DON'T

- Include credentials or API keys
- Pad rules with filler or README-style narration
- Add temporary information
- Use generic advice
- Duplicate README content
- Include frequently changing data
- Add one-off instructions

## Size Budget

Measure size in lines (`wc -l`) and check what actually loads with `/context`, not with token estimates. The documented target is under 200 lines per CLAUDE.md file, and it is guidance, not a cap to enforce; the facts and their sources are in SKILL.md § Size Limits. Within that target, keep content only if it is universal and earns its place.

## Examples from Real Projects

### Web Application Example

```markdown
# Web App Standards

## Stack
- Frontend: React 18 + TypeScript
- Backend: Node.js + Express
- Database: PostgreSQL 15
- ORM: Prisma

## Commands
- Dev: `npm run dev` (port 3000)
- Build: `npm run build`
- Test: `npm test`
- DB migrate: `npx prisma migrate dev`

## Code Style
- Prettier enforced
- ESLint: Airbnb config
- 2-space indent

## Conventions
- Components: `src/components/ComponentName.tsx`
- Pages: `src/pages/PageName.tsx`
- Utils: `src/utils/utilName.ts`
- Types: `src/types/TypeName.ts`

## Git Workflow
- Branch: `feature/description`
- Commit: Conventional Commits
- PR: Require 1 approval
```

### Data Science Project Example

```markdown
# ML Project Standards

## Environment
- Python 3.11
- Conda env: `conda activate ml-project`
- GPU: CUDA 11.8

## Commands
- Train: `python train.py --config config.yaml`
- Eval: `python evaluate.py --model models/latest.pth`
- Notebook: `jupyter lab`

## Data
- Raw: `data/raw/` (never modify)
- Processed: `data/processed/`
- Models: `models/`

## Code Style
- Black formatter
- isort for imports
- Type hints required
- Docstrings: Google style

## Experiments
- Track with MLflow
- Log to `experiments/`
- Version datasets with DVC
```

### Real-World Case Study: Universal vs Modular

**Project Structure:**
```
my-project/
├── CLAUDE.md                    # Universal conventions
└── .claude/rules/
    ├── python.md                # Path-scoped (*.py)
    ├── javascript.md            # Path-scoped (*.js/*.ts)
    └── bash-scripting.md        # Path-scoped (*.sh)
```

**CLAUDE.md Sections:**
- Rules (`.in/` directory convention)
- Communication (clarification, no hallucinations)
- Git Commits (conventional commits, pre-commit workflow)
- Security (file exclusion patterns)
- Planning (OpenSpec triggers, boulder→pebbles)
- Style (Mermaid-first, emoji usage, human vs LLM output)

**Why This Works:**
- ✅ All sections are **universal** (apply to all files/operations regardless of type)
- ✅ Sections are **cohesive** (Git workflow belongs with commit conventions)
- ✅ The main file stays near the 200-line target while holding project-wide conventions
- ✅ Language-specific rules properly extracted to `.claude/rules/` with path frontmatter

**Anti-Pattern (DON'T DO THIS):**
```
# This would be WRONG - fragmenting cohesive universal content

CLAUDE.md
.claude/rules/git.md
.claude/rules/security.md
.claude/rules/planning.md
.claude/rules/style.md
```

**Why This is Wrong:**
- ❌ Git/Security/Planning/Style apply universally, not path-specifically
- ❌ Fragments conceptually related content (commit format separated from pre-commit workflow)
- ❌ Forces context switching between files for related concepts
- ❌ Misuses `.claude/rules/` which is designed for path/domain-specific content

## Memory Hierarchy and Loading

Source: https://code.claude.com/docs/en/memory (consulted 2026-09-21). This section is the single description of load order in this skill; SKILL.md and the sections above and below point here.

Claude Code loads instruction files from the broadest scope to the most specific:

1. **Managed policy** (organization-wide, managed by IT/DevOps)
2. **User memory** (`~/.claude/CLAUDE.md`, cross-project personal). User-level rules load before project rules.
3. **Project memory**: `CLAUDE.md` files from the filesystem root down to the working directory. In each directory, `CLAUDE.local.md` (personal; add to .gitignore) is appended after `CLAUDE.md`. Files in `.claude/rules/*.md` without a `paths` frontmatter have the same priority as `.claude/CLAUDE.md`.

The files are concatenated: none replaces another, and the most specific one is simply read last. The docs give no conflict-resolution rule ("if two rules contradict each other, Claude may pick one arbitrarily"), so resolve contradictions in the files themselves instead of relying on load order.

### When Files Load

- `CLAUDE.md` files in the working directory and its parent directories load at launch.
- `CLAUDE.md` files in subdirectories load on demand, when Claude reads files in those directories.
- Path-specific rules (`paths:` frontmatter) apply when Claude works on matching files.

**Example:** launched in `foo/bar/`
- `foo/CLAUDE.md` then `foo/bar/CLAUDE.md` load at launch
- `foo/bar/baz/CLAUDE.md` loads only once Claude reads a file in `foo/bar/baz/`

---

## Troubleshooting

### CLAUDE.md Not Loading?

1. Check file location: `CLAUDE.md` in project root or `~/.claude/CLAUDE.md`
2. Verify markdown syntax is valid
3. Use `/memory` command during session to view loaded memories
4. Check for import path errors (typos, missing files)

### File Over 200 Lines?

1. **Distribute to .claude/rules/**: Move topic-focused, non-universal content
2. **Reference docs by path**: Point to external docs instead of duplicating them. `@imports` do not help here, because imported files load at launch with the CLAUDE.md that references them
3. **Cut filler, keep reasons**: Tighten wording, but keep the reason attached to each behavioral rule
4. **Remove redundancy**: Eliminate duplicate information
5. **Path-specific rules**: Apply rules only where needed with frontmatter

### Conflicting Guidelines?

Files are concatenated with no override rule (see § Memory Hierarchy and Loading), so when two instructions contradict each other, Claude may follow either one, whether they sit in different files or in the same file. Use `/memory` to find both instructions, then fix the contradiction in the files: delete one, or state the scope of each explicitly.

### Debugging Memory Loading

Use `/memory` command during session to:
- View all currently loaded memories
- Edit memory files inline
- Verify import resolution
- Check which rules are active

## Related Tools

- **Edit skill**: Use `edit-claude` skill to modify CLAUDE.md
- **Git workflow**: Include CLAUDE.md in version control for team sharing
