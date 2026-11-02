# Sub-agent Editor Reference

<!-- Source: code.claude.com/docs/en/sub-agents — verified 2026-10-02 -->

Templates, patterns, and field guidance for Claude Code sub-agents.

---

## Frontmatter Fields (Complete)

### Required Fields

| Field | Purpose | Example |
|-------|---------|---------|
| `name` | Identifier (must match filename, lowercase-hyphens) | `code-reviewer` |
| `description` | When Claude should delegate. Include "Use proactively" for auto-delegation | `Reviews code for quality. Use proactively after code changes.` |

### Tool Control

| Field | Purpose | Example |
|-------|---------|---------|
| `tools` | Allowlist — only these tools available (omit = inherit all) | `Read, Grep, Glob, Bash` |
| `disallowedTools` | Denylist — removed from inherited/specified set | `Write, Edit` |

**Use one approach, not both.** Allowlist when few tools needed; denylist when most tools needed minus a few.

**`Agent(agent_type)` restriction** (sub-agents doc, 2026-10-02): for agents running as main thread (`claude --agent`), restrict spawnable sub-agents:
```yaml
tools: Agent(worker, researcher), Read, Bash  # Only worker and researcher allowed
```
`Agent` without parens = spawn any sub-agent. Omitting `Agent` = cannot spawn sub-agents. "In version 2.1.63, the Task tool was renamed to Agent. Existing `Task(...)` references in settings and agent definitions still work as aliases."
The type list applies only to main-thread agents. In a sub-agent definition, listing `Agent` lets it spawn sub-agents of its own while the depth limit allows (see `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` under Sub-agent vs Other Tools), but any type list in the parentheses is ignored.

### Model

| Field | Purpose | Values |
|-------|---------|--------|
| `model` | Override model | `opus` / `sonnet` / `haiku` / `inherit` |

Default: `inherit` (parent conversation model). Use `pick-model` skill for guidance.

### Permissions

| Field | Purpose | Values |
|-------|---------|--------|
| `permissionMode` | How agent handles permission prompts | See table below |

| Mode | Behavior | When to use |
|------|----------|-------------|
| `default` | Standard permission checking with prompts | Most agents |
| `acceptEdits` | Auto-accept file edits | Trusted code-modification agents |
| `dontAsk` | Auto-deny permission prompts (allowed tools still work) | Read-only research, background agents |
| `bypassPermissions` | Skip ALL permission checks | Automation pipelines (use with caution) |
| `plan` | Read-only exploration mode | Planning/analysis agents |

If parent uses `bypassPermissions`, it takes precedence and cannot be overridden.

### Execution Control

| Field | Purpose | Example |
|-------|---------|---------|
| `maxTurns` | Max agentic turns before stop | `20` |
| `background` | Keep this sub-agent in the background even when Claude wants the result | `true` |
| `isolation` | Run in isolated git worktree | `worktree` |

**Background agents** (the default): run concurrently; permission prompts surface in the main session (see Foreground vs Background below).

**Worktree isolation**: Agent gets isolated repo copy. Worktree auto-cleaned if no changes made. Use for parallel work that might conflict.

### Skills Injection

| Field | Purpose | Example |
|-------|---------|---------|
| `skills` | Preload skill content into agent context at startup | `[api-conventions, error-handling]` |

```yaml
skills:
  - api-conventions
  - error-handling-patterns
```

Full skill content is injected, not just made available. Sub-agents do NOT inherit skills from parent — list them explicitly.

### MCP Servers

| Field | Purpose | Example |
|-------|---------|---------|
| `mcpServers` | MCP servers available to this agent | See below |

Reference an already-configured server by name, or inline a full definition:
```yaml
mcpServers:
  - slack                    # Reference existing server
  - my-db:                   # Inline definition
      command: npx
      args: ["-y", "@my/db-server"]
```

### Persistent Memory

| Field | Purpose | Values |
|-------|---------|--------|
| `memory` | Enable cross-session learning | `user` / `project` / `local` |

| Scope | Location | When to use |
|-------|----------|-------------|
| `user` | `~/.claude/agent-memory/<name>/` | Learnings across all projects (recommended default) |
| `project` | `.claude/agent-memory/<name>/` | Project-specific, shareable via VCS |
| `local` | `.claude/agent-memory-local/<name>/` | Project-specific, NOT in VCS |

When enabled:
- System prompt gets memory read/write instructions + first 200 lines of `MEMORY.md`
- Read, Write, Edit tools auto-enabled for memory management
- Agent builds knowledge over time (patterns, conventions, decisions)

**Prompt tip**: Include memory instructions in system prompt:
```markdown
Update your agent memory as you discover codepaths, patterns, and key
architectural decisions. This builds institutional knowledge across conversations.
```

### Hooks

| Field | Purpose | Example |
|-------|---------|---------|
| `hooks` | Lifecycle hooks scoped to this agent | See below |

Supported events in frontmatter: `PreToolUse`, `PostToolUse`, `Stop`

```yaml
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-command.sh"
  PostToolUse:
    - matcher: "Edit|Write"
      hooks:
        - type: command
          command: "./scripts/run-linter.sh"
```

`Stop` hooks in frontmatter are auto-converted to `SubagentStop` events.

**Project-level hooks** (in `settings.json`) can respond to `SubagentStart` and `SubagentStop` events with matchers targeting specific agent names.

---

## Templates

**Minimal (read-only):**
```markdown
---
name: code-reviewer
description: Expert code reviewer. Use proactively after code changes.
tools: Read, Grep, Glob, Bash
model: inherit
---

You are a senior code reviewer. When invoked:
1. Run git diff to see recent changes
2. Focus on modified files
3. Review for: bugs, style, security, performance

Provide feedback by priority: Critical (must fix), Warnings (should fix), Suggestions.
Include specific examples of how to fix issues.
```

**With hooks and permissions:**
```markdown
---
name: db-reader
description: Execute read-only database queries for analysis and reports.
tools: Bash
permissionMode: dontAsk
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-readonly-query.sh"
---

You are a database analyst with read-only access. Execute SELECT queries to answer
questions about the data. If asked to INSERT/UPDATE/DELETE, explain you only have read access.
```

**With memory and skills:**
```markdown
---
name: api-developer
description: Implement API endpoints following team conventions.
tools: Read, Edit, Write, Bash, Grep, Glob
model: sonnet
memory: project
skills:
  - api-conventions
  - error-handling-patterns
---

Implement API endpoints. Follow the conventions from preloaded skills.
Update your agent memory with patterns and architectural decisions you discover.
```

**Background research agent:**
```markdown
---
name: deep-researcher
description: Thorough codebase research. Use for complex questions about architecture.
tools: Read, Grep, Glob, Bash
model: haiku
background: true
maxTurns: 30
---

Research the codebase thoroughly. Return a structured summary with:
1. Key findings with file:line references
2. Architecture patterns discovered
3. Recommendations
```

**Isolated parallel worker:**
```markdown
---
name: feature-worker
description: Implement features in isolated worktree to avoid conflicts.
tools: Read, Edit, Write, Bash, Grep, Glob
isolation: worktree
model: sonnet
---

Implement the requested feature in your isolated worktree. Create a branch,
make changes, and commit. The worktree is auto-cleaned if no changes are made.
```

---

## Tool Lists

**Common tools:** Read, Edit, Write, Bash, Grep, Glob, WebFetch, WebSearch, Agent (formerly Task)

**Grant minimal access:**
- Analysis only → `Read, Grep, Glob`
- Code changes → `Read, Edit, Write, Bash`
- Execute tests → `Read, Bash`
- Research → `Read, Grep, Glob, WebFetch, WebSearch`
- Omit field → Inherit all available tools

**Denylist alternative:** When agent needs most tools minus a few:
```yaml
disallowedTools: Write, Edit   # Can read/search but not modify
```

---

## Naming & Location

**Naming:** lowercase-hyphens-only, max 64 chars, descriptive

| Good | Bad |
|------|-----|
| `code-reviewer` | `CodeReviewer`, `code_reviewer` |
| `test-analyzer` | `test`, `TestAnalyzer` |

**Locations (priority order):**

| Location | Scope | Priority |
|----------|-------|----------|
| `--agents` CLI flag | Session-only (JSON) | 1 (highest) |
| `.claude/agents/` | Project (team, VCS) | 2 |
| `~/.claude/agents/` | Personal (all projects) | 3 |
| Plugin `agents/` dir | Where plugin enabled | 4 (lowest) |

When multiple agents share a name, higher priority wins.

**CLI-defined agents** (session-only, for testing/automation):
```bash
claude --agents '{
  "code-reviewer": {
    "description": "Expert code reviewer. Use proactively after code changes.",
    "prompt": "You are a senior code reviewer...",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "sonnet"
  }
}'
```

---

## System Prompt Best Practices

Agent-specific only. Generic prompt hygiene (pressure language, over-specification, imposed formatting, stacked prohibitions) is covered by the `claude-api` skill's prompt-audit pass, not restated here.

- **Specific role + task**, not a generic persona.
  ```markdown
  Bad:  You are a helpful coding assistant.
  Good: You are a Python test specialist. Analyze pytest failures, identify root causes, and suggest fixes.
  ```
- **Workflow as numbered steps** (a non-fork sub-agent starts with a fresh context and no parent history; docs sub-agents, 2026-10-02).
  ```markdown
  When invoked:
  1. Run git diff to see recent changes
  2. Focus on modified files
  3. Begin review immediately
  ```
- **Output format only if the caller parses it**; otherwise describe the deliverable, not a template.
- **Memory-aware** (when `memory` is set): tell the agent to read its memory before starting and update it with recurring patterns.

---

## Modification Workflow

| Change Type | Fields to Update |
|-------------|-----------------|
| Add tools | `tools` or `disallowedTools` |
| Change purpose | `description`, system prompt |
| Fix behavior | System prompt only |
| Optimize cost | `model` field |
| Add persistence | `memory` field + prompt instructions |
| Add validation | `hooks` field + validation script |
| Change permissions | `permissionMode` |
| Enable background | `background: true` |

**Process:** Read existing → Enumerate functional outputs → Edit (not rewrite) → Regression check → Validate YAML

---

## Common Mistakes

| Issue | Fix |
|-------|-----|
| Agent not triggered | Add clear triggers + "Use proactively" to description |
| Too broad scope | Focus on single responsibility |
| Vague prompts | Add workflow steps, constraints, output formats |
| Too many tools | Use `tools` allowlist or `disallowedTools` denylist |
| Invalid YAML | Check `---` delimiters, proper indentation |
| Name mismatch | Ensure `name` matches filename (without .md) |
| Model default wrong | Default is `inherit`, not `sonnet` |
| Skills not loading | Must list explicitly — sub-agents don't inherit parent skills |
| Background agent blocked | Answer the permission prompt surfaced in the main session |
| Memory not persisting | Set `memory` field AND include memory instructions in prompt |

---

## Sub-agent vs Other Tools

| Scenario | Recommendation |
|----------|---------------|
| Complex multi-step task, needs isolation | Sub-agent |
| Simple one-step task | Direct conversation |
| Frequently auto-invoked, SKILL.md < 500 lines (doc officielle, 2026-09-23) | Skill |
| Reusable prompt in main context | Skill |
| Deterministic shell-only | Bash script |
| Needs exploration + action | Sub-agent with broad tools |
| Parallel independent research | Multiple sub-agents |
| Cross-session coordination | Agent team (not sub-agent) |
| Verbose output you don't need in main context | Sub-agent |

**Nesting is allowed up to `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` (default 3, since v2.1.219; env-vars doc, 2026-10-02).** A sub-agent at the third layer cannot spawn further; set it to `1` to turn nesting off.

---

## Patterns

### Disable Specific Sub-agents

In `settings.json`:
```json
{
  "permissions": {
    "deny": ["Agent(Explore)", "Agent(my-custom-agent)"]
  }
}
```

Or via CLI: `claude --disallowedTools "Agent(Explore)"`

### Resume Sub-agents

Each invocation creates fresh context. To continue previous work, ask Claude to resume:
```
Continue that code review and now analyze the authorization logic
```
Claude uses the agent ID to resume with full conversation history preserved.

Transcripts persist in `~/.claude/projects/{project}/{sessionId}/subagents/agent-{agentId}.jsonl`.

### Foreground vs Background

Source: sub-agents doc, "Run subagents in foreground or background", 2026-10-02.

- Fork mode off: "Claude runs the subagent in the background by default and in the foreground when it needs the result before continuing." Fork mode on (default in an interactive session): always background, and Claude "can't ask for the foreground".
- `background: true` in the definition: "keep a particular subagent in the background even when Claude wants the result". Spawning a teammate's sub-agent whose definition sets it errors.
- **Background**: concurrent; the main conversation keeps going. Every permission prompt surfaces in the main session. Use for independent research/analysis.
- **Foreground** also applies when an in-process team teammate spawned the sub-agent, or when `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1`.
- Background tool set: Read, Grep, Glob, LSP, Bash, PowerShell, Edit, Write, NotebookEdit, WebFetch, WebSearch, TodoWrite, Skill, ToolSearch, EnterWorktree, ExitWorktree, Monitor, TaskStop, SendMessage, Artifact, SubagentHandback, plus all MCP tools. Agent and ExitPlanMode follow special rules.

Press **Ctrl+B** to background a running task.

---

## Quick Reference

```markdown
---
name: identifier
description: When to use. Use proactively after X.
tools: Read, Edit, Bash           # Allowlist (or use disallowedTools)
model: inherit                    # opus/sonnet/haiku/inherit (default)
permissionMode: default           # default/acceptEdits/dontAsk/bypassPermissions/plan
maxTurns: 20                      # Optional turn limit
skills: [skill-a, skill-b]        # Preload skills
memory: user                      # user/project/local
background: false                 # true = stay background even when Claude wants the result
isolation: worktree               # Optional isolated git copy
hooks:                            # Optional lifecycle hooks
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate.sh"
---

System prompt with role, workflow, constraints, output format.
```

**Locations:** `.claude/agents/` (project) · `~/.claude/agents/` (personal) · `--agents` flag (session)

**Best Practices:**
- Single responsibility per agent
- Specific triggers in description with "Use proactively" when appropriate
- Minimal tool permissions (allowlist or denylist)
- Detailed system prompts with workflow steps
- Set `memory` for agents that benefit from cross-session learning
- Use hooks for runtime validation of tool usage
- Use `/agents` command for interactive creation and management
