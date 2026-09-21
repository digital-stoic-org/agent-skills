---
name: edit-claude
description: Creates, updates, or optimizes CLAUDE.md files following Anthropic best practices. Use when user requests creating, updating, improving, or optimizing CLAUDE.md files for project context, coding standards, or persistent memory.
---

# Instructions for Managing CLAUDE.md Files

## Determine Action Type

**CREATE**: New CLAUDE.md file requested
**UPDATE**: Modify existing CLAUDE.md (keywords: "update", "add", "modify", "change")
**OPTIMIZE**: Audit and clean an existing CLAUDE.md chain (keywords: "optimize", "audit", "clean up", "reduce tokens", "improve")

## Updating Existing CLAUDE.md Files

Make surgical edits in the relevant section (or a new heading), preserving the file's existing organization. After editing, check the file's line count against the size guidance below, because longer files consume more context and may reduce adherence.

## Optimizing CLAUDE.md Files

The goal is that every line earns its place for the current model, not the shortest file. Rules lose value when cut from their reason, so compress wording, never reasons.

1. **Dated-pattern pass**: invoke `/claude-api prompt-audit` scoped to the CLAUDE.md chain (and `.claude/rules/`), with the current session model as target. It returns a report and a diff covering pressure language, fossils and restated defaults. Call it by skill name only: its bundled file path is versioned per Claude Code release and breaks on upgrade, and a copy here would go stale, so do not copy it either.
2. **CLAUDE.md-specific pass** (prompt-audit does not cover these):
   - Move path/domain-specific content to `.claude/rules/` with `paths` frontmatter, so it loads only when needed; `@imports` can organize long material but still load at launch
   - Remove secrets and frequently changing data
   - Check each file's line count (`wc -l`) and what actually loads (`/context`) against the size guidance below
3. Present both diffs and apply only what the user accepts.

See `reference.md § Optimization Strategies` for rewrite examples.

## Fit check (CREATE)

CLAUDE.md is loaded into every session, so it only holds content that is persistent, used in most sessions, and non-sensitive. Route what fails that to its better home and say so: secrets to env vars, one-off asks to the conversation, long docs to a README referenced by path, detailed guidelines to `.claude/rules/`. For mixed requests, write the part that fits and route the rest.

## Creating New CLAUDE.md Files

1. **Gather context**: Ask user for project details if missing:
   - Coding standards (indentation, naming conventions)
   - Build/test/deployment commands
   - Architectural patterns
   - Security requirements

2. **Organize around WHAT/WHY/HOW**:
   - **WHAT**: Tech stack, codebase map, key packages
   - **WHY**: Project purpose, component responsibilities
   - **HOW**: Build/test/deploy commands, verification methods

3. **Determine organization strategy** (memory hierarchy):

   **Main CLAUDE.md** (universal content; aim for the 200-line target below):
   - Build/test/deploy commands
   - Universal code style applying to all files
   - Critical patterns used everywhere
   - Cohesive project-wide conventions (Git, Security, Planning, Style)
   - `CLAUDE.md` in project root (shared via git)

   **.claude/rules/** (modular, one topic per file):
   - Path/language-specific files (auto-loaded): `python.md`, `javascript.md`
   - Domain-specific patterns: `frontend/`, `backend/`
   - Path-specific rules with frontmatter (see reference.md)

   **CLAUDE.local.md** (personal; add to .gitignore):
   - Personal preferences not shared with team
   - Local dev shortcuts, experimental rules

   **~/.claude/CLAUDE.md** (cross-project personal):
   - Universal personal preferences across all projects

   **@imports** (organization, not context reduction):
   - External docs: `@README`, `@docs/architecture.md`
   - Home directory: `@~/.claude/my-prefs.md`
   - Imported files are expanded and loaded at launch alongside the CLAUDE.md that references them, so splitting into imports does not reduce context. To load content only when needed, use `.claude/rules/` with `paths` frontmatter or a subdirectory CLAUDE.md.

   **Load order and how files combine**: see `reference.md § Memory Hierarchy and Loading`.

4. **File Zones (if project uses ref/wip pattern)**:
   - Detect folder names: `ref/` or `reference/` (read-only), `wip/` or `work-in-progress/` (workspace). Use whichever name the project already has.
   - Add to CLAUDE.md:
     ```
     ## File Zones
     - 🔒 ref/ (or reference/) — READ-ONLY. Never edit unless user explicitly says "update ref". Show diff and ask first.
     - ✏️ wip/ (or work-in-progress/) — Default workspace. All new files and edits go here.
     - 🔒 .in/ — READ-ONLY archive. Never modify.
     ```
   - Include this section in main CLAUDE.md for all projects using ref/wip (non-technical users especially benefit from visual clarity)

5. **Organization decision tree**:
   - Universal + cohesive (Git/Security/Planning/File Zones)? → Main CLAUDE.md; if the file grows past the 200-line target, move non-universal parts to path-scoped rules
   - Path/language-specific (Python/JS/Bash rules)? → .claude/rules/lang.md with frontmatter
   - Domain-specific (frontend/backend patterns)? → .claude/rules/domain/
   - Large, separable, non-universal topic? → Consider .claude/rules/topic.md
   - Personal preferences? → CLAUDE.local.md or ~/.claude/
   - Detailed reference docs? → Separate doc referenced by path; `@import` it only if most sessions need it, because imports load at launch

6. **Universal vs Path-Specific Decision**:

   **Keep in main CLAUDE.md:**
   - Universal conventions applying to ALL files/operations
   - Cohesive conceptual units (Git workflow, Security policies, Style guides)
   - Examples: commit format, pre-commit flow, security exclusions, output formatting

   **Extract to .claude/rules/:**
   - Path/language-specific rules (Python for `*.py`, React for `*.tsx`)
   - Domain-specific patterns (`frontend/`, `backend/`, `infra/`)
   - A single separable topic that grows large enough to crowd the main file
   - Examples: `python.md` with `paths: "**/*.py"`, `bash-scripting.md` with `paths: "**/*.sh"`

   **Key principle:** Cohesion and semantic grouping matter more than a short file. A main CLAUDE.md whose universal sections (Git, Security, Planning, Style) sit together is better than the same content fragmented across files, provided it stays near the 200-line target.

7. **H1 = Project Name** (required):
   - First line must be `# Project Name` — used by `/switch`, `/save-context`, `/load-context` for project identification
   - Examples: `# Praxis`, `# NanoVC — Control Repo`, `# GTD-PCM Control Plane`

8. **Structure content**:
   - Use markdown headings for organization
   - Tables and bullets for reference data (commands, paths); a short sentence with its reason for behavioral rules
   - Be specific (e.g., "Use 2-space indentation" not "Format code properly")
   - Group related items logically

9. **Write file** with appropriate sections based on user context

See `reference.md § Templates` for starter examples and `§ Modular Rules` for .claude/rules/ patterns.

## Size Limits

Each fact below carries its source, consulted 2026-09-21.

- **Target**: keep each CLAUDE.md file under 200 lines, because files over 200 lines consume more context and may reduce adherence ([memory docs](https://code.claude.com/docs/en/memory)). The 200-line target is guidance, not a cap to enforce.
- **Hard limit**: Claude Code loads a CLAUDE.md file of up to 4 MiB in full and skips a larger file ([memory docs](https://code.claude.com/docs/en/memory)).
- **Warning**: the "CLAUDE.md is too long" warning threshold scales with the model's context window ([changelog, v2.1.169](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)).

**Measure**: `wc -l` for each file's line count; `/context` to check which CLAUDE.md and rules files loaded into the current session; `/memory` to list memory file locations.

**When creating/updating**: If a file passes the 200-line target, tell the user and suggest path-scoped rules or trimming content that is not needed in every session. Imports do not help here, because imported files load at launch.

## Key Principles

- **Specific over generic**: "Run `npm test`" not "Test the code"
- **Persistent not temporary**: Coding standards yes, current bug no
- **Concise, with reasons**: cut filler, keep the "because" next to each rule
- **Modular organization**: Main CLAUDE.md + .claude/rules/ + @imports
- **Path-specific when needed**: Frontmatter with `paths:` glob patterns
- **Secure**: Never include credentials or sensitive data

**Ordering and emphasis** (sources: code.claude.com/docs/en/memory, code.claude.com/docs/en/best-practices, platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices; consulted 2026-09-21):
- Across the chain, the harness sets the order: files are concatenated from broadest to most specific, and the most specific is read last. You only control order inside a file; there, group related rules and order sections for the reader.
- Anthropic documents no in-prompt position effect (U-shaped attention, primacy, recency) for current models, so do not reorder rules for attention. The documented lever is length and noise: "If your CLAUDE.md is too long, Claude ignores half of it because important rules get lost in the noise."
- State each rule once: current models retain a once-stated instruction, so repeated reminders are cruft.
- If Claude keeps skipping one specific instruction, emphasize that line alone; emphasizing many lines cancels out.
- "Long documents at the top, query at the end" applies to prompts over 20k tokens, not to CLAUDE.md.

---

## Progressive Disclosure

Keep main CLAUDE.md to universal content, near the 200-line target. Distribute the rest:

**Modular rules** (.claude/rules/; files with `paths` frontmatter load only for matching files):
```
.claude/rules/
  |- code-style.md
  |- security.md
  |- frontend/react.md
  |- backend/api.md
```

**Imports** (loaded at launch with the referencing CLAUDE.md; they organize content but do not reduce context):
```markdown
@README
@docs/architecture.md
@~/.claude/my-project-prefs.md
```

**Reference docs** (external):
```
reference/
  |- runbooks/building.md
  |- standards/conventions.md
```

Use `/memory` command during session to view/edit loaded memories.

## Constraints

- **Size**: under 200 lines per file as a target; files up to 4 MiB load in full (see Size Limits above)
- **Universal relevance**: Every line should apply to most sessions, not task-specific work
- **Modular distribution**: Use .claude/rules/ for path/language/domain-specific content, not to fragment universal cohesive sections
- **Cohesion over tokens**: Keep conceptually related universal sections together (Git, Security, Planning, Style) even if that makes the main file longer, as long as it stays near the 200-line target

See `reference.md § Content Guidelines` for inclusion/exclusion rules and anti-patterns.

## Validation Checklist

- [ ] Information is persistent and frequently referenced
- [ ] No sensitive credentials or tokens included
- [ ] Each file near or under the 200-line target (`wc -l`), and the expected files loaded (`/context`)
- [ ] Markdown structure is clear with headings
- [ ] Specific guidelines (not generic advice)
- [ ] Appropriate organization: main vs .claude/rules/ vs @imports
- [ ] Path-specific rules use frontmatter (if applicable)

See `reference.md § Templates`, `§ Modular Rules`, and `§ Import Syntax` for detailed examples.
