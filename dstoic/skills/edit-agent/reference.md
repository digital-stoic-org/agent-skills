# Sub-agent Editor Reference

Templates and patterns for Claude Code sub-agents.

**NOTE**: For comprehensive tool selection matrix (agent vs skill vs command vs script) and context isolation analysis, see `edit-tool/reference.md`.

---

## Templates

**Minimal:**
```markdown
---
name: code-reviewer
description: Reviews code for bugs, style, and performance issues
---

You are a code review specialist. Review code thoroughly for:
- Logic errors and bugs
- Code style and best practices
- Performance issues
- Security vulnerabilities

Provide specific, actionable feedback with examples.
```

**With Tools:**
```markdown
---
name: test-analyzer
description: Analyzes test failures and suggests fixes
tools: Read, Grep, Bash
model: haiku
---

You are a test analysis expert. When analyzing test failures:
1. Read test output and identify root causes
2. Search codebase for related code
3. Suggest specific fixes with code examples
4. Explain why tests failed

Keep responses concise and actionable.
```

---

## Frontmatter Fields

| Field | Purpose | Example |
|-------|---------|---------|
| `name` | Identifier (must match filename) | `code-reviewer` |
| `description` | When to use (triggers) | `Reviews code for bugs and style` |
| `tools` | Restrict tools (omit for all) | `Read, Edit, Bash` |
| `model` | Override model | `haiku` / `sonnet` / `opus` |

**Models:** haiku (fast/cheap), sonnet (default), opus (complex reasoning)

---

## Tool Lists

**Common tools:** Read, Edit, Write, Bash, Grep, Glob, WebFetch, Task

**Grant minimal access:**
- Analysis only → `Read, Grep, Glob`
- Code changes → `Read, Edit`
- Execute tests → `Read, Bash`
- Research → `Read, Grep, WebFetch`
- Omit field → Inherit all available tools

---

## Naming & Location

**Naming:** lowercase-hyphens-only, max 64 chars, descriptive

| ✅ Good | ❌ Bad |
|---------|--------|
| `code-reviewer` | `CodeReviewer`, `code_reviewer` |
| `test-analyzer` | `test`, `TestAnalyzer` |

**Locations:**
- `.claude/agents/` → Project agents (team, highest priority)
- `~/.claude/agents/` → Personal agents (all projects)

---

## System Prompt Best Practices

**Be specific:**
```markdown
❌ You are a helpful coding assistant.
✅ You are a Python test specialist. Analyze pytest failures, identify root causes, and suggest fixes with code examples.
```

**Include examples:**
```markdown
When suggesting fixes, use this format:
- Issue: [what's wrong]
- Fix: [specific solution]
- Code: ```python [example] ```
```

**Set constraints:**
```markdown
- Keep responses under 200 words
- Always provide code examples
- Cite line numbers when referencing code
```

**Define output format:**
```markdown
Structure your review as:
1. Summary (2-3 sentences)
2. Critical Issues (list)
3. Suggestions (list with code)
```

---

## Common Agent Types

**Code Reviewer:**
```markdown
---
name: code-reviewer
description: Reviews code changes for quality, bugs, and style
tools: Read, Grep
---
Review code for bugs, style, performance, security. Provide specific feedback with examples.
```

**Test Analyzer:**
```markdown
---
name: test-analyzer
description: Analyzes test failures and suggests fixes
tools: Read, Bash, Grep
---
Analyze test output, identify root causes, suggest specific fixes with code examples.
```

**Documentation Generator:**
```markdown
---
name: doc-generator
description: Generates API documentation from code
tools: Read, Grep, Write
model: haiku
---
Generate clear markdown documentation: function signatures, parameters, return types, examples.
```

**Security Auditor:**
```markdown
---
name: security-auditor
description: Audits code for security vulnerabilities
tools: Read, Grep
---
Audit for OWASP Top 10: SQL injection, XSS, CSRF, auth issues, secrets. Rate severity and suggest fixes.
```

---

## Modification Workflow

| Change Type | Update |
|-------------|--------|
| Add tools | tools field |
| Change purpose | description, system prompt |
| Fix behavior | System prompt only |
| Optimize cost | model field (switch to haiku) |
| Expand scope | description, system prompt |

**Process:** Read existing → Identify change → Edit (not rewrite) → Validate YAML

---

## Common Mistakes

| Issue | Fix |
|-------|-----|
| Agent not triggered | Add clear triggers to description |
| Too broad scope | Focus on single responsibility |
| Vague prompts | Add examples, constraints, formats |
| Too many tools | Grant minimal necessary access |
| Invalid YAML | Check `---` delimiters |
| Name mismatch | Ensure name matches filename |

---

## Sub-agent vs Other Tools

| Use Sub-agent When | Use Instead |
|-------------------|-------------|
| Complex multi-step task | ✅ Sub-agent with isolated context |
| Simple one-step task | ❌ Direct conversation |
| Frequently auto-invoked | ❌ Skill (if <500 tokens) |
| User manually triggers | ❌ Slash command |
| Needs exploration | ✅ Sub-agent with Task tool |

---

## Quick Reference

**File Structure:**
```markdown
---
name: identifier
description: When to use this agent
tools: Read, Edit, Bash
model: haiku/sonnet/opus
---

System prompt with role, instructions, examples, constraints.
```

**Locations:**
- `.claude/agents/` - Project (team)
- `~/.claude/agents/` - Personal

**Best Practices:**
- Single responsibility
- Specific triggers in description
- Minimal tool permissions
- Detailed system prompts with examples
- Use /agents command for interactive creation
