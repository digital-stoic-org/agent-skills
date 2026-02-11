---
description: Deploy static sites to Surge.sh with inventory tracking. Use when deploying, tearing down, or listing surge deployments. Triggers include "deploy to surge", "surge deploy", "teardown surge", "list deployments".
argument-hint: <deploy|teardown|list> [path] [description] [--slug custom-slug]
allowed-tools: Bash, Read, Edit, Write
model: sonnet
---

# Deploy Surge

Deploy static files to Surge.sh with YAML inventory lifecycle management.

**Inventory**: `/praxis/reference/deploy/surge-inventory.yaml`

## Argument Parsing

Parse `$ARGUMENTS` for subcommand routing:
- `deploy <path> <description> [--slug X]` → deploy flow
- `teardown <slug>` → teardown flow
- `list` → list flow
- No args or ambiguous → ask user which subcommand

## Inventory Schema

```yaml
# /praxis/reference/deploy/surge-inventory.yaml
deployments:
  - slug: rpt-a3f9d2e1          # slug or custom domain
    url: https://rpt-a3f9d2e1.surge.sh
    local_path: ./output/report
    deployed: "2026-02-10T14:30:00Z"
    description: "Q1 Financial Report"
    status: active               # active | torn-down
    # added on teardown:
    # torn_down: "2026-02-10T16:00:00Z"
```

## Subcommands

### `deploy`

1. **Validate**: `rtk summary which surge` — if missing: `bun install -g surge` (confirm first)
2. **Resolve target**:
   - `--slug` provided → `<slug>.surge.sh`
   - Arg contains `.` without `.surge.sh` → custom CNAME domain
   - **Default** → auto-generate `<prefix>-<8hex>.surge.sh` (prefix: first word of description lowercased alphanumeric max 10 chars, hex: `openssl rand -hex 4`)
3. **Confirm** — show target URL, wait for user approval
4. **Deploy**: `rtk summary surge <path> --domain <target>`
5. **Update inventory** — Read file, append entry per schema, Write back
6. **Report** — output live URL + inventory count

### `teardown`

1. **Read inventory** — find entry by slug or URL
2. **Teardown**: `rtk summary surge teardown <target>` (use URL domain from inventory)
3. **Update inventory** — set `status: torn-down`, add `torn_down: <ISO-8601-UTC>`
4. **Report** — confirm teardown

### `list`

1. **Read inventory**
2. **Display table**: sort active first, newest first

   | # | Slug | URL | Deployed | Status | Description |
   |---|------|-----|----------|--------|-------------|

3. **Counts**: `✅ N active | 🗑️ N torn-down`

## Error Handling

| Error | Action |
|-------|--------|
| `surge` not installed | Prompt: `bun install -g surge` |
| Not logged in | Run `surge login` (interactive) |
| Inventory file missing | Auto-create with `deployments: []` |
| Slug not found | Show available slugs, ask user |
| Deploy fails | Show error, do NOT update inventory |

## Rules

- **Always use `rtk`** for all shell commands
- **Never deploy without confirmation** — show target URL first
- **Inventory is source of truth** — always read before write
- **Atomic updates** — read full YAML, modify, write back complete file
