---
name: pin
description: >
  Pin session decisions, questions, objections, scope constraints, and corrections
  to a persistent board that survives context compaction. Use PROACTIVELY when:
  (1) user approves/rejects a recommendation, (2) user asks a clarifying question
  about a proposal, (3) user states a scope constraint, (4) user corrects a
  misunderstanding. Also use when user says "pin", "track this", "mark as approved",
  "board", "show pins". This skill should be auto-invoked by the model without
  user asking — whenever a decision, question, or constraint is detected in
  conversation, pin it immediately after responding.
allowed-tools: [Bash, Read, Write, Edit]
model: haiku
context: main
user-invocable: true
---

# Pin — Session Decision Board

Persist decisions, questions, constraints, and corrections to a JSON file that survives context compaction. A companion hook injects the board into every tool call so the model never forgets.

## Auto-Invoke Rules

After responding to any user message where a decision was made, a question was asked about a proposal, or a constraint was stated, IMMEDIATELY invoke /pin with the appropriate category. Do not ask permission — just pin it.

Examples of auto-invoke triggers:
- User: "yes go with bun" → respond normally, then `/pin ✅ use bun`
- User: "what about the latency impact?" → respond normally, then `/pin ❓ split services — latency impact?`
- User: "no skip auth for now" → respond normally, then `/pin ❌ auth layer — skip for MVP`
- User: "MVP only, max 3 files" → respond normally, then `/pin 📌 MVP only, max 3 files`
- User: "no I meant artisans not developers" → respond normally, then `/pin 🔧 target = artisans, not developers`

Do NOT pin:
- Casual conversation, greetings
- Implementation details (code changes, file edits)
- Things already pinned (check board first)

## Commands

| Command | Action |
|---|---|
| `/pin ✅ <text>` | Pin approved item |
| `/pin ❓ <text>` | Pin pending question |
| `/pin ❌ <text>` | Pin killed/rejected item |
| `/pin 📌 <text>` | Pin scope constraint |
| `/pin 🔧 <text>` | Pin correction |
| `/pin show` or `/pin` | Display current board |
| `/pin rm <n>` | Remove pin by number |
| `/pin clear` | Clear all pins |
| `/pin clear triage` | Clear ✅/❓ only, keep 📌/❌/🔧 |

## State File

Path: `/home/mat/dev/praxis/.session-logs/<slug>/pins.json`

Derive slug from CWD:

```bash
GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
REL_PATH="${PWD#$GIT_ROOT/}"
SLUG=$(echo "$REL_PATH" | tr '/' '-')
PINS_DIR="/home/mat/dev/praxis/.session-logs/$SLUG"
PINS_FILE="$PINS_DIR/pins.json"
```

Schema:

```json
{
  "items": [
    {
      "id": 1,
      "type": "approved",
      "emoji": "✅",
      "content": "use bun everywhere",
      "detail": "",
      "ts": "2026-04-01T14:30:00Z"
    }
  ],
  "next_id": 2
}
```

Type mapping: ✅=approved, ❓=pending, ❌=killed, 📌=scope, 🔧=correction

## Pin (`/pin <emoji> <text>`)

Parse the emoji prefix to determine type. Text after emoji is content. If text contains ` — `, split into content and detail.

1. Derive `PINS_FILE` path (see State File above)
2. `mkdir -p` the directory
3. Read existing file or init `{"items":[],"next_id":1}`
4. Check if content already pinned (exact match on content field) → if so, respond `⚠️ Already pinned.` and stop
5. Check limits: 5 items per type, 20 total. If category full, drop oldest item of that type.
6. Append new item with `id=next_id`, increment `next_id`
7. Write file
8. Respond: `📌 Pinned #N: <emoji> <content>` — one line only, then resume prior work

## Show (`/pin show` or `/pin`)

1. Read `PINS_FILE`
2. If file missing or items empty: `📋 Pin board is empty.`
3. Display:

```
📋 Pin Board (5 items)
 1. ✅ use bun everywhere (minor: keep fallback for CI)
 2. ✅ split the PR into 2
 3. ❓ split services — latency impact?
 4. ❌ auth rewrite — out of MVP scope
 5. 📌 MVP only, max 3 files
```

## Remove (`/pin rm <n>`)

If no number: `⚠️ Usage: /pin rm <number>`

1. Read `PINS_FILE`, find item with `id === n`
2. If not found: `⚠️ Pin #N not found.`
3. Remove item, write file
4. Respond: `🗑️ Pin #N removed.`

## Clear (`/pin clear`)

1. Reset file to `{"items":[],"next_id":<keep current next_id>}`
2. Respond: `🗑️ Pin board cleared.`

## Clear Triage (`/pin clear triage`)

1. Remove items where type is `approved` or `pending`
2. Keep items where type is `killed`, `scope`, or `correction`
3. Write file
4. Respond: `🗑️ Triage cleared. <N> pins remaining.`

## Limits

- 5 items per type, 20 total
- When a category is full, drop the oldest item of that type (lowest id)

## Key Behaviors

- **One-line responses only.** Never add commentary about pin content.
- **Resume immediately.** After any pin command, pick up the prior conversation exactly where it left off.
- **Store verbatim.** No cleanup, no categorization, no reformulation of user's words.
- **Stable numbering.** Gaps stay after deletion. `next_id` always increments, never reuses.
