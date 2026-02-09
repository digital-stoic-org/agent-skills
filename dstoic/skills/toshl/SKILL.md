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

### sync-data [start-date] [end-date]

Sync Toshl data to local cache. Defaults to current month if no dates provided.

**Usage**:
```
/toshl sync-data                    # Current month
/toshl sync-data 2020-01            # Specific month
/toshl sync-data 2020-01 2026-02    # Date range
```

**Workflow**:
1. Parse date range from arguments (default: current month YYYY-MM)
2. Use toshl MCP server to query entries:
   - Call `get_entries` tool with from/to date range
   - Get full entry details with account, category, tags
3. Call `get_accounts` to fetch all accounts
4. Call `get_categories` to fetch all categories
5. Call `get_tags` to fetch all tags
6. Transform entries to denormalized CSV format
7. Write CSV: `data/{YYYY-MM}_entries.csv`
8. Write metadata JSON files: `data/accounts.json`, `data/categories.json`, `data/tags.json`
9. Report: files created, entry count, date range

**CSV format** (denormalized, human-readable):
```csv
date,description,amount,currency,category,account,tags,type
2026-02-05,Groceries,-45.50,EUR,Food & Dining,Personal Checking,"shopping,food",expense
2026-02-10,Freelance Income,2500.00,EUR,Consulting,DS Business,"revenue,consulting",income
```

**Implementation**:
- Use MCP `get_entries` tool with date filters
- Denormalize: resolve account/category/tag IDs to names in CSV
- Handle negative amounts for expenses, positive for income
- Quote tag fields if they contain commas

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
