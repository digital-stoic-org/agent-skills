---
name: openspec-develop
description: "Implement OpenSpec change proposals. Use when: implementing approved changes, working through task lists, or checking implementation progress."
model: sonnet
allowed-tools: [Glob, Grep, Read, Edit, Write, Bash, TodoWrite, AskUserQuestion]
---

# OpenSpec Develop

Implementation engine for approved OpenSpec proposals. Turns tasks.md checkboxes into working code.

## Workflow: Explore → Implement → Mark → Gate

```mermaid
flowchart LR
    A["Read task"] --> B["Explore context"]
    B --> C["Implement"]
    C --> D["Mark ✅ in tasks.md"]
    D --> E{"More tasks\nin section?"}
    E -->|Yes| A
    E -->|No| G{"Gate exists?"}
    G -->|No| H{"More sections?"}
    G -->|Yes| I["🚧 Checkpoint prompt"]
    I --> J["STOP"]
    H -->|Yes| A
    H -->|No| F["Report complete"]

    classDef action fill:#C8E6C9,stroke:#388E3C,color:#000
    classDef decision fill:#FFF9C4,stroke:#FBC02D,color:#000
    classDef gate fill:#FFE0B2,stroke:#F57C00,color:#000
    class A,B,C,D,F action
    class E,G,H decision
    class I,J gate
```

**Critical**: Mark checkbox immediately after each task. Enables crash recovery.

## Guardrails

**Autonomous** (no confirmation needed):
- Code generation matching specs
- File edits within scope
- Checkbox updates
- Pattern-matching existing code

**Ask-first** (pause and confirm):
- Architectural decisions not in specs
- New dependencies not mentioned
- Scope deviation >20% from proposal
- Files outside change scope

**Scope check**: Before creating files not mentioned in proposal.md, count affected files. If >20% more than proposal's "Affected files", ask:
```
⚠️ Scope expansion detected
Proposal mentions: {n} files
Implementation needs: {m} files ({percent}% more)

Proceed with expanded scope? [y/N]
```

## Commands

### implement

Implement all pending tasks from tasks.md, pausing at gates.

**Input**: `$ARGUMENTS` = `change-id`

**Workflow**:
1. Read `openspec/changes/{change-id}/tasks.md`
2. Group tasks by section headers (`## N. Section Name`)
3. For each section (in order):
   a. For each unchecked task in section:
      - Consult Exploration Strategy for context/tools
      - Read specs and must-read files
      - Explore codebase for patterns
      - Implement the task
      - **Immediately** mark checkbox: `- [ ]` → `- [x]`
   b. After all section tasks complete, check for `### GATE N:` line
   c. If gate exists and not `[PASS]`: output checkpoint prompt, **stop processing**
   d. If no gate or already `[PASS]`: continue to next section
4. When all sections complete: Report "All tasks complete"

**Gate checkpoint** (stops processing):
```
🚧 GATE {n}: {description}
Section {n} tasks: {done}/{total} complete
→ Run checkpoint: /openspec-test checkpoint {change-id} {n}
→ Skip gate: /openspec-develop section {change-id} {n+1}
```

**All complete**:
```
✅ All tasks complete for {change-id}
Progress: {done}/{total} tasks
Ready for: /openspec-test {change-id}
```

### task

Implement a specific task by number.

**Input**: `$ARGUMENTS` = `change-id task-number` (e.g., `add-feature 1.3`)

**Workflow**:
1. Read tasks.md, find task by number (e.g., `1.3`)
2. If already checked: Report "Task {number} already complete"
3. If unchecked: Implement using same workflow as `implement`
4. Mark checkbox immediately after completion

**Already complete**:
```
⏭️ Task {number} already complete
Description: {task description}
```

### section

Implement all tasks in one section only.

**Input**: `$ARGUMENTS` = `change-id section-number` (e.g., `add-feature 3`)

**Workflow**:
1. Read tasks.md, find section `## {section-number}. ...`
2. For each unchecked task in that section: implement and mark checkbox
3. After completing: if gate exists, output checkpoint prompt; else suggest next section

**Section complete (with gate)**:
```
🚧 GATE {n}: {description}
Section {n} tasks: {done}/{total} complete
→ Run checkpoint: /openspec-test checkpoint {change-id} {n}
→ Skip gate: /openspec-develop section {change-id} {n+1}
```

**Section complete (no gate)**:
```
✅ Section {n} complete: {section-name}
Progress: {done}/{total} tasks in section
→ Next: /openspec-develop section {change-id} {n+1}
```

### status

Show implementation progress.

**Input**: `$ARGUMENTS` = `change-id`

**Run**:
```bash
openspec show {change-id}
```

Display task completion progress from CLI output.

## Philosophy Check

Before implementing, read `openspec/project.md` → Execution Philosophy → `mode`.

**During implementation**, flag anti-patterns for current mode:
```
⚠️ Philosophy check ({mode} mode):
- Anti-pattern detected: {anti-pattern}
- Current action: {what you're about to do}
- Question: {is this necessary or gold-plating?}

Proceed anyway? [y/N]
```

**Examples by mode**:
- `garage`: Flag premature abstractions, over-engineering, excessive documentation
- `scale`: Flag missing tests, undocumented decisions, cowboy changes
- `maintenance`: Flag unnecessary refactors, feature creep, risky upgrades

## Task Parsing

Parse tasks.md format:
```markdown
## 1. Section Name
- [ ] 1.1 Task description here
- [x] 1.2 Already complete task
- [ ] 1.3 Another pending task
```

Match pattern: `- \[([ x])\] (\d+\.\d+) (.+)$`
- Group 1: checkbox state (space = pending, x = complete)
- Group 2: task number (e.g., 1.3)
- Group 3: task description

## Section & Gate Parsing

Parse section headers and gate markers in tasks.md:

**Section header**: `## (\d+)\. (.+)$`
**Gate line**: `### GATE (\d+): (.+?)(?:\s+\[(PASS|PARTIAL|BLOCKED)\])?$`

Group tasks by their parent section header. Gates are optional markers between sections.

Gate states:
- Unmarked = not attempted
- `[PASS]` = checkpoint verified
- `[PARTIAL]` = some failures, needs attention
- `[BLOCKED]` = cannot proceed without resolution

## Checkbox Update

After completing task, edit tasks.md:
- Find: `- [ ] {task-number} {description}`
- Replace: `- [x] {task-number} {description}`

Use Edit tool for surgical update. Never rewrite entire file.

## Gate Update

After checkpoint passes, mark gate in tasks.md:
- Find: `### GATE {n}: {description}`
- Replace: `### GATE {n}: {description} [PASS]`

Use Edit tool. Gate state drives crash recovery — on resume, develop skips `[PASS]` gates and re-prompts unmarked gates after completed sections.

## Exploration Strategy

Before implementation, consult `openspec/project.md` → Exploration Strategy section:

1. **Context sources**: Read `primary` files (project.md, proposal.md, specs)
2. **Must-read files**: CLAUDE.md, settings.json (project constraints)
3. **Tools**: Use configured codebase tools (Glob, Grep, Read, or MCP if enabled)
4. **Pattern matching**: Read existing similar files to match structure/style
5. **Philosophy**: Read Execution Philosophy section for current mode and principles
