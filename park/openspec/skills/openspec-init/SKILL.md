---
name: openspec-init
description: "Initialize OpenSpec in a project. Use when: user says 'init openspec', 'setup openspec', or asks to add OpenSpec to a project."
model: sonnet
---

# OpenSpec Init

Initialize OpenSpec in a project. Detects framework and creates structure.

## Commands

### detect

Analyze project to identify framework and structure.

**Steps**:
1. Check for framework markers:
   - `package.json` → Node.js (check for `next`, `react`, `vue`, `svelte`)
   - `pyproject.toml` or `requirements.txt` → Python
   - `Cargo.toml` → Rust
   - `go.mod` → Go
2. Output detected framework, language, and key files

**Output format**:
```yaml
framework: [detected]
language: [detected]
package_manager: [detected]
entry_points: [list]
```

### init

Create OpenSpec directory structure.

**Input**: `$ARGUMENTS` = project description (optional)

**Steps**:
1. Run `detect` if not already done
2. Create structure:
   ```
   openspec/
   ├── project.md    # From template + detected context
   └── AGENTS.md     # Copy from openspec CLI or template
   ```
3. Generate `project.md` with:
   - Tech Stack (from detection)
   - Naming Conventions (kebab-case default)
   - Code Style (framework-appropriate)
   - Git Workflow (conventional commits)
   - Exploration Strategy (tools + must-read files)
   - Execution Philosophy (mode + principles)

**Exploration Strategy template**:
```yaml
context_sources:
  primary:
    - openspec/project.md
    - openspec/changes/{id}/proposal.md
    - openspec/changes/{id}/tasks.md
    - openspec/changes/{id}/test.md
    - openspec/changes/{id}/specs/*.md
  artifacts:
    - openspec/changes/{id}/test-logs/*.md
  must_read:
    - CLAUDE.md
tools:
  codebase: [Glob, Grep, Read, Task:Explore]
  # mcp_serena: true      # Uncomment for large C#/.NET
  # mcp_sourcegraph: true # Uncomment for monorepos
```

**Execution Philosophy template**:
```yaml
mode: garage  # garage | scale | maintenance

modes:
  garage:
    description: Fast iteration, validate ideas quickly
    principles:
      - Ship fast, iterate faster (speed > polish)
      - Working > perfect (80% solution now beats 100% later)
      - Validate with real usage (dogfood immediately)
      - Defer optimization until patterns stabilize
      - Fail fast, learn faster
    accept: [tech_debt, rough_edges, manual_steps, minimal_docs]
    reject: [broken_core_flows, data_loss, security_holes]
    anti_patterns:
      - Over-engineering for hypothetical futures
      - Gold-plating before validation
      - Premature abstraction
      - Analysis paralysis

  scale:
    description: Production hardening, team growth
    principles:
      - Stability over speed (measure twice, cut once)
      - Document decisions for team alignment
      - Abstractions justified by repeated patterns
      - Test coverage for critical paths
    accept: [slower_iteration, more_review, documentation_overhead]
    reject: [untested_deployments, undocumented_apis, tribal_knowledge]
    anti_patterns:
      - Cowboy coding without review
      - Skipping tests for speed
      - Undocumented architectural decisions

  maintenance:
    description: Stability preservation, minimal changes
    principles:
      - If it works, don't touch it
      - Minimal blast radius for changes
      - Comprehensive regression testing
      - Document before modifying
    accept: [conservative_changes, extensive_testing, slow_rollouts]
    reject: [unnecessary_refactors, feature_creep, risky_upgrades]
    anti_patterns:
      - Refactoring for aesthetics
      - Upgrading dependencies without cause
      - Adding features during maintenance windows
```

**Ask user**: "Which execution mode fits your current phase?" (default: garage)

**Requires**: User confirmation before writing files
