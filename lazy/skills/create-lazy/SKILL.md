---
name: create-lazy
description: Generate a lazy placeholder skill to capture demand signal for a future skill idea before building it. Use when user says "/create-lazy", "create lazy", "lazy skill", "stub a skill", "declare a skill idea", or wants to register a skill idea now to measure real demand. Writes lazy/skills/lazy-<name>/SKILL.md that intercepts trigger keywords and logs hits to /praxis/thinking/lazy/<name>.jsonl.
argument-hint: "<skill-name> \"<description with trigger keywords>\""
allowed-tools: [Bash, Write]
---

# create-lazy — Declare a Lazy Skill

Generate a `lazy-<name>` placeholder skill. It intercepts trigger keywords, logs each hit to measure demand, and returns control to Claude Code so you handle the task manually. Declaring an idea costs ~30 seconds instead of the 15 minutes a real skill build would take.

## Args

```
/create-lazy <skill-name> "<description with trigger keywords>"
```

- **`<skill-name>`** — kebab-case (`[a-z0-9-]+`). Do NOT include the `lazy-` prefix; this skill adds it. Reject if user prepends `lazy-`.
- **`"<description>"`** — treat as **intent hint, not final copy**. Users will typically type something terse like `"convert xlsx"` or `"summarize meetings"`. You must expand this into a well-formed, trigger-rich description during Step 1.5. The enriched version is what gets written to the generated skill's frontmatter.

### Examples (user input → what gets written)

| User types | You enrich to (written to generated skill) |
|---|---|
| `/create-lazy convert-xlsx "convert xlsx"` | `Convert Excel spreadsheets (.xlsx, .xls) to markdown or CSV for LLM context. Use when user says "convert xlsx", "convert excel", "excel to markdown", "xlsx to csv", "read this spreadsheet", or mentions `.xlsx` / `.xls` files. Handles multi-sheet workbooks and preserves table structure.` |
| `/create-lazy summarize-meeting "meeting action items"` | `Extract action items, decisions, and owners from meeting transcripts or notes. Use when user says "action items", "summarize meeting", "meeting notes", "what did we decide", "extract todos from transcript", or pastes meeting content asking for a recap.` |

## Substitution contract

When you (Claude Code) execute this skill, you receive concrete `<name>` and `<description>` values from the user. Every `<name>` and `<description>` placeholder below is a **template variable** you must substitute before writing files or running shell commands. Do not leave angle-bracket placeholders in generated output.

| Placeholder | Source | Example |
|---|---|---|
| `<name>` | first arg, kebab-case | `convert-xlsx` |
| `<description>` | user's second arg (intent hint, usually terse) | `convert xlsx` |
| `<enriched-description>` | Step 1.5 output — rewritten, trigger-rich, user-approved | `Convert Excel spreadsheets (.xlsx, .xls) to markdown…` |
| `$AGENT_SKILLS` | fixed constant | `/home/mat/dev/agent-skills` |

The **enriched** description is what gets written to the generated skill's `description:` frontmatter field, not the raw user input.

## Algorithm

**Execute these steps in order. Abort on any failure.**

### Step 1 — Validate args

- If `<name>` or `<description>` is empty → print usage block from the **Args** section and stop.
- If `<name>` does not match `^[a-z0-9]+(-[a-z0-9]+)*$` → abort: `❌ <name> must be kebab-case (lowercase, digits, hyphens).`
- If `<name>` starts with `lazy-` → abort: `❌ Drop the "lazy-" prefix — this skill adds it (you'd get lazy-lazy-<name>).`

### Step 1.5 — Enrich the description

The user's `<description>` is a hint, usually terse. You must rewrite it into a well-formed description that Claude Code can keyword-match against future user messages. The enriched string — call it `<enriched-description>` — is what gets written to the generated skill, **not** the user's raw input.

**A good enriched description contains, in this order:**

1. **One-sentence capability summary** — what the future skill will do. Concrete, domain-specific verbs.
2. **Explicit trigger phrases** — introduced by `Use when user says` followed by a comma-separated list of quoted phrases a user would naturally type. Include the user's original hint phrase verbatim, plus 4–8 plausible variations (synonyms, alternate verb forms, file extension mentions, domain jargon).
3. **Scope clarifiers** — file formats, domains, or contexts where it applies. Anything that helps CC disambiguate from adjacent skills.

**Enrichment rules:**

- **Stay truthful to intent.** Do not invent capabilities the user didn't ask for. If the hint is `"convert xlsx"`, don't add "and generate pivot tables." Scope = what the user said, expressed thoroughly.
- **Think like a router.** Ask: what phrases would a user type in three months when they want this capability? Include those phrases.
- **Include the obvious.** File extensions (`.xlsx`, `.pdf`), format names (`excel`, `spreadsheet`), and domain verbs (`extract`, `summarize`, `parse`). Obvious triggers are still triggers.
- **Keep under 1024 characters.** That's the description field hard limit.
- **No meta-commentary.** Don't say "this is a lazy placeholder" — the generated skill's body handles that. The description pretends to be a real skill so routing works.

**Show the enriched description to the user for approval before Step 4:**

```
📝 Enriched description (will be written to lazy-<name>):

<enriched-description>

Confirm? (y / edit / abort)
```

If the user edits, use their version. If they abort, stop cleanly. If they confirm, proceed to Step 2.

### Step 2 — Locate source repo

```bash
AGENT_SKILLS=/home/mat/dev/agent-skills
test -d "$AGENT_SKILLS" || { echo "❌ agent-skills source not found at $AGENT_SKILLS"; exit 1; }
```

**Never** write into `~/.claude/plugins/cache/` — that's a copy, not a symlink. Cache is refreshed from source on plugin reload.

### Step 3 — Collision checks

Run both checks with `<name>` substituted. Abort if either finds a hit.

```bash
# A. Already-lazy check
if [ -d "$AGENT_SKILLS/lazy/skills/lazy-<name>" ]; then
  echo "❌ lazy-<name> already declared at lazy/skills/lazy-<name>/"
  exit 1
fi

# B. Future-shadow check: if a real skill named <name> already exists in any
# plugin, promoting lazy-<name> later would collide. Warn now.
EXISTING=$(find "$AGENT_SKILLS" -maxdepth 4 -type d -path "*/skills/<name>" 2>/dev/null)
if [ -n "$EXISTING" ]; then
  echo "❌ Real skill <name> already exists at: $EXISTING"
  echo "   Promoting lazy-<name> to <name> would collide. Pick a different name."
  exit 1
fi
```

### Step 4 — Write the generated SKILL.md

Use the **Write** tool (not a heredoc) to create:

```
$AGENT_SKILLS/lazy/skills/lazy-<name>/SKILL.md
```

The parent directory does not exist yet. The Write tool creates missing parents; no `mkdir -p` needed.

Copy the **Generated template** section below verbatim, substituting `<name>` and `<enriched-description>` (the approved output of Step 1.5 — **not** the user's raw input). Do not leave any `<name>` or `<description>` placeholder in the written file.

### Step 5 — Confirm

Print exactly:

```
✅ lazy-<name> declared at lazy/skills/lazy-<name>/SKILL.md
📊 First trigger will log to /praxis/thinking/lazy/<name>.jsonl
🔌 Reload plugins (or restart CC) so the new skill is discovered.
```

## Generated template

Write this content to `$AGENT_SKILLS/lazy/skills/lazy-<name>/SKILL.md` with `<name>` and `<description>` substituted. Everything between the fences is the file body (omit the outer `````markdown` fence itself).

`````markdown
---
name: lazy-<name>
description: <enriched-description>
allowed-tools: [Bash]
model: haiku
---

# lazy-<name> — Demand Capture Placeholder

**This skill is a placeholder.** It does NOT perform the task its description advertises. Its only job is to log that the user asked for this capability, so demand can be measured before a real skill is built.

## Rules (non-negotiable)

1. **Do not attempt the task.** Even if it looks trivial. The whole point is measuring signal, not solving the problem. If you solve it here, no hit is logged and the signal is lost.
2. **Log → announce → stop.** Three steps, nothing more. Then return control so Claude Code handles the request manually in its normal flow.
3. **Do not ask clarifying questions.** Log first. Manual handling afterward can clarify.

## Steps

1. **Log the hit** (portable ISO-8601 UTC timestamp, JSON-safe cwd):

   ```bash
   mkdir -p /praxis/thinking/lazy
   TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
   CWD=$(pwd | sed 's/"/\\"/g')
   printf '{"ts":"%s","cwd":"%s"}\n' "$TS" "$CWD" >> /praxis/thinking/lazy/<name>.jsonl
   ```

2. **Count hits** and announce:

   ```bash
   N=$(wc -l < /praxis/thinking/lazy/<name>.jsonl)
   echo "⚠️ lazy:<name> [hit #$N] — under consideration, proceeding manually"
   ```

3. **Stop.** Return control to Claude Code. Do not continue with additional tool calls or task work in this skill invocation.
`````

## Design notes

- **`lazy-` prefix** (not `stub-`) — matches the lazy-loading mental model and is less negative than "stub".
- **Description is the router** — Claude Code routes to the generated skill by keyword-matching its `description` field against user messages. That's why `<description>` must contain real trigger phrases. No other mechanism makes interception work.
- **`allowed-tools: [Bash]`** on generated skills — sufficient for `mkdir`, `date`, `printf`, `wc`. No Write, no Read.
- **`model: haiku`** on generated skills — the logic is trivial; use the cheapest model.
- **Log at `/praxis/thinking/lazy/<name>.jsonl`** — long-term memory, survives compactions and sessions. Not `.tmp/`.
- **JSONL format** — one hit per line, `wc -l` for count, `jq` for analysis. `/kaizen-review` can parse later for promotion decisions.
- **No auto-delete** — promotion and removal are manual judgment calls.
- **Disabling the `lazy` plugin** pauses both `/create-lazy` and all hit capture at once. Existing `.jsonl` logs persist and resume accumulating when the plugin is re-enabled.

## Promotion path

When hit count on `/praxis/thinking/lazy/<name>.jsonl` justifies building the real skill:

1. `mv $AGENT_SKILLS/lazy/skills/lazy-<name> $AGENT_SKILLS/<target-plugin>/skills/<name>`
2. Rewrite the `SKILL.md` body with real implementation. Update `name:` to `<name>` (drop `lazy-`). Update `allowed-tools` and `model` as needed.
3. Keep `/praxis/thinking/lazy/<name>.jsonl` — it becomes the historical record of time-from-declaration-to-promotion.
