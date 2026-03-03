---
name: browse
description: Open a URL in headless browser and capture page state (accessibility tree or screenshot). Use when browsing, verifying pages, or capturing visual snapshots. Triggers include "browse", "open browser", "verify page", "snapshot website".
argument-hint: "<url> [--screenshot]"
allowed-tools: [Bash, Read]
model: haiku
context: fork
user-invocable: true
---

# Browse

Capture page state from a URL using a headless browser.

## Prerequisites

Requires `agent-browser` CLI:
```bash
bun install -g agent-browser
```

## Input

```
$ARGUMENTS: <url> [--screenshot]
```

- `url` — required, the page to open
- `--screenshot` — optional, capture PNG instead of accessibility tree

## Workflow

Parse `$ARGUMENTS`:
- Extract URL (first positional arg)
- Check for `--screenshot` flag

Run via ACL script:
```bash
bash $SKILL_DIR/scripts/verify-url.sh <url> [--screenshot]
```

## Output

- **text mode** (default): accessibility tree text from `snapshot -i`
- **visual mode** (`--screenshot`): PNG file path

## Reference

For full command reference (navigate, console, network, errors), read `reference.md` from the skill directory.

## Flow

`open → snapshot → [screenshot] → close`

Returns snapshot text or PNG path to caller.
