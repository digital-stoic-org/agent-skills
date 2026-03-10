---
name: scratch
description: Session scratch pad for parking side-thoughts during deep work without losing flow. Use when user says "scratch", "note this", "park this", "jot this down", "remember for later", or wants to capture a quick thought mid-task. Always use this skill for any /scratch command — even for simple captures — because it manages numbered storage and stable IDs.
allowed-tools: [TaskCreate, TaskList, TaskUpdate, TaskGet]
---

# Scratch — Session Scratch Pad

Capture side-thoughts during deep work without breaking flow. Backing store: in-memory Task system (session-scoped, no persistence).

The whole point of this skill is to be invisible — capture the thought and get out of the way so the user stays in flow. Every interaction should feel instant: one-line confirmation, then resume exactly where the conversation was.

## Commands

| Command | Action |
|---|---|
| `/scratch <text>` | Capture. Respond `✅ Scratch #N added.` then **resume prior work**. |
| `/scratch list` | Show all notes numbered. |
| `/scratch rm <n>` | Delete note #n. |
| `/scratch clear` | Delete all notes, reset counter. |

## Capture (`/scratch <text>`)

If no text provided, respond: `⚠️ Usage: /scratch <your thought here>` — nothing else.

1. `TaskList` → find max `display_num` where `metadata.type === "scratch"` (0 if none)
2. `TaskCreate`: `subject` = verbatim text, `description` = `"scratch"`, `metadata` = `{"type": "scratch", "display_num": max+1}`
3. Respond: `✅ Scratch #N added.`
4. **Resume prior conversation immediately.** No commentary, no analysis, no reformulation.

## List (`/scratch list`)

1. `TaskList` → filter `metadata.type === "scratch"`, status not `"deleted"`
2. Display numbered by `display_num`:

```
📋 Scratch pad (3)
1. revoir le naming des endpoints
3. exposer les ADRs en read-only
5. doc OpenSpec manque le flow 422
```

If empty: `📋 Scratch pad is empty.`

## Remove (`/scratch rm <n>`)

If no number provided: `⚠️ Usage: /scratch rm <number>`

1. `TaskList` → find task where `metadata.display_num === n` and `metadata.type === "scratch"`
2. If not found: `⚠️ Scratch #N not found.`
3. `TaskUpdate` with `status: "deleted"`
4. Respond: `🗑️ Scratch #N removed.`

## Clear (`/scratch clear`)

1. `TaskList` → all tasks with `metadata.type === "scratch"`
2. `TaskUpdate` `status: "deleted"` for each
3. Respond: `🗑️ Scratch pad cleared.`

## Key behaviors

- **One-line responses only.** Never add commentary, analysis, or suggestions about the note content.
- **Resume immediately.** After any scratch command, pick up the prior conversation exactly where it left off — mid-sentence if needed.
- **Store verbatim.** No cleanup, no categorization, no reformulation.
- **Stable numbering.** Gaps stay after deletion (1, 3, 5 is fine). Reset only on clear.
