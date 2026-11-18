---
name: create-lazy
description: Generate a lazy placeholder skill to capture demand signal for a future skill idea before building it. Use when user says "/create-lazy", "create lazy", "lazy skill", "stub a skill", "declare a skill idea", or wants to register a skill idea now to measure real demand. Writes lazy/skills/lazy-<name>/SKILL.md that intercepts trigger keywords and logs hits to /praxis/thinking/lazy/<name>.jsonl.
argument-hint: "<skill-name> \"<short intent hint>\""
allowed-tools: [Bash, Write, Skill]
---

# create-lazy — Declare a Lazy Skill

Generate a `lazy-<name>` placeholder that intercepts trigger keywords, logs each hit to `/praxis/thinking/lazy/<name>.jsonl`, and returns control to Claude Code for manual handling. See `reference.md` for the generated template, design rationale, and promotion workflow.

## Args

```
/create-lazy <skill-name> "<short intent hint>"
```

- **`<skill-name>`** — kebab-case, no `lazy-` prefix (this skill adds it).
- **`<intent hint>`** — **terse by design**. Treated as intent, not final copy. Step 1.5 rewrites it into a trigger-rich description.

## Template variables

| Placeholder | Source |
|---|---|
| `<name>` | kebab-case first arg |
| `<enriched-description>` | Step 1.5 output — user-approved, trigger-rich |
| `$AGENT_SKILLS` | `/home/mat/dev/agent-skills` (source, **never** the plugin cache) |

## Algorithm

Execute in order. Abort on failure.

### Step 1 — Validate args

- Empty `<name>` or intent → print usage, stop.
- `<name>` not matching `^[a-z0-9]+(-[a-z0-9]+)*$` → `❌ <name> must be kebab-case.`
- `<name>` starts with `lazy-` → `❌ Drop the "lazy-" prefix — this skill adds it.`

### Step 1.5 — Enrich the description

Rewrite the user's terse hint into a well-formed description. Required shape:

1. **One-sentence capability summary** — concrete verbs, specific domain.
2. **Trigger list** — `Use when user says "<phrase1>", "<phrase2>", …` — include the user's original phrase verbatim plus 4–8 plausible variations (synonyms, alternate verb forms, file extensions, domain jargon).
3. **Scope clarifiers** — formats, domains, contexts that disambiguate from adjacent skills.

Rules: stay truthful to intent (no invented capabilities); include obvious triggers (file extensions, format names); keep under 1024 chars; no meta-commentary about being a placeholder.

**Example enrichment:**

- User input: `"convert xlsx"`
- Enriched: `Convert Excel spreadsheets (.xlsx, .xls) to markdown or CSV for LLM context. Use when user says "convert xlsx", "convert excel", "excel to markdown", "xlsx to csv", "read this spreadsheet", or mentions .xlsx / .xls files. Handles multi-sheet workbooks and preserves table structure.`

Show enriched version to user for `y / edit / abort` approval before Step 2.

### Step 2 — Locate source repo

```bash
AGENT_SKILLS=/home/mat/dev/agent-skills
test -d "$AGENT_SKILLS" || { echo "❌ agent-skills source not found"; exit 1; }
```

### Step 3 — Collision checks

```bash
# A. Already-lazy
[ -d "$AGENT_SKILLS/lazy/skills/lazy-<name>" ] && { echo "❌ lazy-<name> already declared."; exit 1; }

# B. Future-shadow — real <name> exists in any plugin
EXISTING=$(find "$AGENT_SKILLS" -maxdepth 4 -type d -path "*/skills/<name>" 2>/dev/null)
[ -n "$EXISTING" ] && { echo "❌ Real skill <name> exists at $EXISTING — would collide on promotion."; exit 1; }
```

### Step 4 — Write the generated SKILL.md

Use the **Write** tool (creates missing parents) to write `$AGENT_SKILLS/lazy/skills/lazy-<name>/SKILL.md`. The file body is the template in `reference.md` § "Generated template", with `<name>` and `<enriched-description>` substituted. No leftover placeholders.

### Step 5 — Bump the `lazy` plugin version

Delegate to `/edit-plugin` — never hand-edit version files. Call as a Skill invocation:

```
/edit-plugin lazy patch "add lazy-<name> placeholder skill"
```

**`patch`, not `minor`.** Rationale in `reference.md` § "Design rationale": lazy skills are experimental stubs, not real capability additions, so minor bumps inflate the version. `/edit-plugin` will pause with a review summary before finalizing — that pause is expected. Surface any error and stop; no manual recovery.

### Step 6 — Confirm

```
✅ lazy-<name> declared at lazy/skills/lazy-<name>/SKILL.md
📊 First trigger will log to /praxis/thinking/lazy/<name>.jsonl
📦 lazy plugin bumped to <new-version>
🔌 Reload plugins (or restart CC) so the new skill is discovered.
```
