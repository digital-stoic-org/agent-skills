---
name: dump-output
description: Toggle automatic dumping of Claude's output to timestamped markdown files
context: fork
allowed-tools: [Bash]
user-invocable: true
---

# Output Dump Toggle

Toggle automatic dumping of Claude's complete output to `.dump/` folder.

## Instructions

1. Check if `.dump/.enabled` file exists
2. If exists: Remove it (turn OFF)
3. If doesn't exist: Create it (turn ON)
4. Always show the new status to the user

## Commands

Toggle (on/off):
```bash
mkdir -p .dump
if [ -f .dump/.enabled ]; then
  rm .dump/.enabled
  echo "❌ Output dumping is now DISABLED"
else
  touch .dump/.enabled
  echo "✅ Output dumping is now ENABLED"
fi
```
