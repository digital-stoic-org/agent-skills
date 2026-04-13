---
name: toshl
description: Toshl Finance automation - sync data to local cache and generate monthly financial reports
context: inherit
allowed-tools: [Bash, Read, Write, Edit, Grep, Glob]
model: sonnet
user-invocable: true
---

# Toshl Financial Automation

Automate Toshl Finance data synchronization and monthly reporting with multi-entity financial strategy context (NS/DS/LW/VN + CCA extraction planning).

**Data source**: Toshl Finance API (via toshl MCP server)
**Cache**: Local CSV/JSON in `toshl/data/` (git-tracked)
**Reports**: Markdown files in `toshl/reports/`

## Commands

### sync-data [start-month] [end-month]

Sync Toshl data to local CSV cache with reconciliation vs. prior state.

**Usage**:
```
/toshl sync-data                    # Current month MTD
/toshl sync-data 2026-03            # Single month
/toshl sync-data 2026-01 2026-04    # Inclusive month range
```

**Implementation**: Runs `scripts/monthly_sync.py` which calls the Toshl API directly (not via MCP — avoids token-limit spills). Stdlib only, no venv needed.

```bash
# Current month MTD
python3 toshl/scripts/monthly_sync.py --current

# Specific month
python3 toshl/scripts/monthly_sync.py 2026-03

# Range
python3 toshl/scripts/monthly_sync.py 2026-01 2026-04

# With reconcile report
python3 toshl/scripts/monthly_sync.py --current --json-report /tmp/reconcile.json
```

**Script behavior**:
1. Reads `TOSHL_API_TOKEN` from `toshl/.env`
2. Paginates `/entries` (per_page=200) for each month's date range
3. Resolves account/category/tag IDs against `data/_{account,category,tag}_lookup.json`
4. Writes `data/{YYYY-MM}_entries.csv` (denormalized, UTF-8, sorted date desc)
5. Reconciles: prints rows/sum before → after and delta per month
6. Idempotent — re-running the same month yields Δ=0

**CSV format** (denormalized, human-readable):
```csv
date,description,amount,currency,category,account,tags,type
2026-02-05,Groceries,-45.50,EUR,Food & Dining,Cash,shopping,expense
2026-02-10,Freelance Income,2500.00,EUR,Consulting,Cash,revenue,income
```

**When to use MCP vs. this script**:
- **Script** (`monthly_sync.py`): for bulk backfill, monthly ritual, reconciliation. Always preferred for writing CSVs.
- **MCP tools** (`mcp__toshl__*`): for live querying during analysis ("what did I spend on X?"). Never use for bulk export — token-limit spills on months >40 entries.

### monthly-report <YYYY-MM>

Generate markdown financial report for specified month. Auto-triggers sync-data first.

**Usage**:
```
/toshl monthly-report 2026-02
```

**Workflow**:
1. Validate month format (YYYY-MM)
2. Auto-run `/toshl sync-data {YYYY-MM}` first (cache refresh)
3. Read CSV entries from `data/{YYYY-MM}_entries.csv`
4. Parse and aggregate:
   - Separate expenses (amount < 0) vs revenue (amount > 0)
   - Group by category name (from CSV), sum amounts
   - Calculate percentages of total
   - Sort by amount descending
   - Categories are dynamic from Toshl (no static mapping)
5. Calculate summary metrics:
   - Total expenses, total revenue, net
   - Compare against targets
   - Determine status (✅/⚠️/❌)
6. Generate markdown report using template from reference.md
7. Write to `reports/{YYYY-MM}.md`
8. Display summary to user

**Status indicators**:
- ✅ On target: Expenses ≤€4,000 AND Revenue ≥€7,500
- ⚠️ Within 10%: Expenses ≤€4,400 OR Revenue ≥€6,750
- ❌ Over/under: Expenses >€4,400 OR Revenue <€6,750

**Implementation**:
- Ensure `reports/` directory exists
- Use Write tool for report generation
- Format amounts as EUR with thousand separators, no decimals
- Round percentages to 1 decimal place

## Financial Strategy Context

**Entity structure**:
- NS (Nosetalgy): Holding company
- DS (Digital Stoic): CTO-as-Service (100% NS)
- LW (Livarot): Whisky strategy (100% NS)
- VN (Villa Nara): Regenerative agriculture (49% NS)

**Targets**:
- Liquid reserves: €120K (24-month runway)
- Monthly burn: <€4K
- Net income: €90K/year (€7,500/mo avg)

**CCA (compte courant d'associé)**: Currently ~€100K balance. Monthly reports track personal expenses to plan CCA extraction from entities.

## Next Steps

Phase 2 (future):
- Entity breakdown in reports (personal vs NS/DS/LW/VN)
- CCA extraction recommendations
- Burn rate trends (3-6 month rolling)
- Non-Toshl data overlay (investments, loans)

See `reference.md` for account/category mappings and report template.
