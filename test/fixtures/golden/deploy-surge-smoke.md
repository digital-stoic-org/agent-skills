---
name: deploy-surge
description: Deploy static sites to Surge.sh with inventory tracking.
allowed-tools: [Bash, Read, Edit, Write]
model: sonnet
---

# Deploy Surge

Deploy static files to Surge.sh with YAML inventory lifecycle.

Subcommands:
- `deploy <path> <description> [--slug X]` → deploy + update inventory
- `teardown <slug>` → teardown + mark inventory
- `list` → display active/torn-down table
