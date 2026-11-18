# create-lazy — Reference

Extended reference for the `create-lazy` skill. The main `SKILL.md` covers the algorithm; this file holds the generated template, design rationale, and promotion workflow.

## Generated template

When Step 4 of the algorithm writes the generated SKILL.md, copy the block below verbatim, substituting `<name>` and `<enriched-description>`. Everything between the fences is the file body (omit the outer `````markdown` fence itself).

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

## Design rationale

- **`lazy-` prefix** (not `stub-`) — matches the lazy-loading mental model; less negative than "stub".
- **Description is the router.** Claude Code routes to the generated skill by keyword-matching its `description` field against user messages. That is the *only* mechanism making interception work — hence the enrichment step in the main algorithm.
- **`allowed-tools: [Bash]`** on generated skills — sufficient for `mkdir`, `date`, `printf`, `wc`. No Write, no Read.
- **`model: haiku`** on generated skills — trivial logic, cheapest model.
- **Log at `/praxis/thinking/lazy/<name>.jsonl`** — long-term memory, survives compactions and sessions. Not `.tmp/`.
- **JSONL format** — one hit per line. `wc -l` for count, `jq` for analysis. `/kaizen-review` can parse later for promotion decisions.
- **No auto-delete** — promotion and removal are manual judgment calls.
- **Disabling the `lazy` plugin** pauses both `/create-lazy` and all hit capture at once. Existing `.jsonl` logs persist and resume accumulating when the plugin is re-enabled.
- **Patch bumps, not minor.** `/edit-plugin`'s default rule is "new skill = minor bump," but lazy skills are experimental placeholders, not real capability additions. Treating each declaration as a minor bump inflates version numbers. Patch is the honest semver for an additive stub.

## Promotion path

When hit count on `/praxis/thinking/lazy/<name>.jsonl` justifies building the real skill:

1. `mv $AGENT_SKILLS/lazy/skills/lazy-<name> $AGENT_SKILLS/<target-plugin>/skills/<name>`
2. Rewrite `SKILL.md` body with real implementation. Update `name:` to `<name>` (drop `lazy-`). Adjust `allowed-tools` and `model` as needed.
3. Run `/edit-plugin <target-plugin> minor "promote lazy-<name> to real skill"` — the target plugin gains a real capability, so minor is correct there.
4. Run `/edit-plugin lazy patch "remove promoted lazy-<name>"` — the lazy plugin lost a stub, patch-level cleanup.
5. Keep `/praxis/thinking/lazy/<name>.jsonl` as the historical record of time-from-declaration-to-promotion.
