# deploy-surge Reference

## Inventory Schema

```yaml
# $PRAXIS_DIR/reference/deploy/surge-inventory.yaml
deployments:
  - slug: rpt-a3f9d2e1
    url: https://rpt-a3f9d2e1.surge.sh
    local_path: ./output/report
    deployed: "2026-02-10T14:30:00Z"
    description: "Q1 Financial Report"
    status: active               # active | torn-down
    # added on teardown:
    # torn_down: "2026-02-10T16:00:00Z"
```

## Slug Generation

- `--slug` provided → `<slug>.surge.sh`
- Arg contains `.` without `.surge.sh` → custom CNAME domain
- **Default** → `<prefix>-<8hex>.surge.sh` (prefix: first word of description lowercased alphanumeric max 10 chars, hex: `openssl rand -hex 4`)

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
