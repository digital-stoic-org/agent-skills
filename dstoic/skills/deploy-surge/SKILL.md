---
name: deploy-surge
description: Deploy static sites to Surge.sh with inventory tracking. Use when deploying, tearing down, or listing surge deployments. Triggers include "deploy to surge", "surge deploy", "teardown surge", "list deployments".
argument-hint: <deploy|teardown|list> [path] [description] [--slug custom-slug]
allowed-tools: [Bash, Read, Edit, Write]
model: sonnet
context: main
user-invocable: true
---

# Deploy Surge

Deploy static files to Surge.sh with YAML inventory lifecycle management.

**Inventory**: `$PRAXIS_DIR/reference/deploy/surge-inventory.yaml`

## Argument Parsing

Parse `$ARGUMENTS` for subcommand routing:
- `deploy <path> <description> [--slug X]` → deploy flow
- `teardown <slug>` → teardown flow
- `list` → list flow
- No args or ambiguous → ask user which subcommand

## Subcommands

### `deploy`

1. **Validate**: `rtk summary which surge` — if missing: `bun install -g surge`
2. **Resolve target**: `--slug` → `<slug>.surge.sh` | default → `<prefix>-<8hex>.surge.sh`
3. **Confirm** — show target URL, wait for user approval
4. **Deploy**: `rtk summary surge <path> --domain <target>`
5. **Update inventory** — append entry per schema
6. **Report** — output live URL + inventory count

### `teardown`

1. Find entry by slug/URL in inventory
2. `rtk summary surge teardown <target>`
3. Set `status: torn-down`, add `torn_down` timestamp
4. Confirm teardown

### `list`

1. Read inventory, display table sorted active-first, newest-first
2. Show counts: `✅ N active | 🗑️ N torn-down`

See `reference.md` for inventory schema, error handling, and rules.
