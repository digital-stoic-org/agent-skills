# Toshl Financial Automation - Reference

## Account & Category Mapping

**Account → Entity mapping** (to be populated after first sync):

```yaml
accounts:
  personal:
    - TBD (populated from Toshl after first sync)

  ns_ds:  # Digital Stoic (via NS)
    - TBD (populated from Toshl after first sync)

  lw:  # Livarot (via NS)
    - TBD (populated from Toshl after first sync)

  vn:  # Villa Nara
    - TBD (populated from Toshl after first sync)

# Note: Account names come from Toshl API
# After first sync, manually classify accounts by entity in this file
```

**Categories**: All categories come dynamically from Toshl API via `categories.json`. No static mapping needed - reports will use actual Toshl category names and hierarchy.

## Monthly Report Template

Template for `/toshl monthly-report <YYYY-MM>` output.

### Structure

```markdown
# Financial Report: {YYYY-MM}

**Generated**: {YYYY-MM-DD HH:MM}
**Source**: Toshl API (synced to local cache)
**Cache**: `data/{YYYY-MM}_entries.csv`

## Summary

| Metric | Amount | Target | Status |
|---|---|---|---|
| Total Expenses | €X,XXX | <€4,000/mo | ✅/⚠️/❌ |
| Total Revenue | €X,XXX | €7,500/mo (€90K/yr) | ✅/⚠️/❌ |
| Net | €X,XXX | — | — |

## Expenses by Category

| Category | Amount | % of Total |
|---|---|---|
| {category_1} | €X,XXX | XX% |
| {category_2} | €X,XXX | XX% |
| ... | ... | ... |
| **Total** | **€X,XXX** | **100%** |

## Revenue by Category

| Category | Amount | % of Total |
|---|---|---|
| {category_1} | €X,XXX | XX% |
| {category_2} | €X,XXX | XX% |
| ... | ... | ... |
| **Total** | **€X,XXX** | **100%** |

---

**Next steps**:
- Review expense categories for optimization opportunities
- Plan CCA extraction based on personal expense needs
- Compare against previous months (future iteration)
```

### Rules

- **Categories**: Use actual Toshl category names from CSV (dynamic, not hardcoded)
- **Amounts**: EUR, no decimals (round to nearest euro)
- **Sorting**: Categories by amount descending
- **Status icons**:
  - ✅ On target
  - ⚠️ Within 10% of target
  - ❌ Expenses >€4,400 OR Revenue <€6,750
- **Net calculation**: Revenue - Expenses (positive = surplus, negative = deficit)

### Future Enhancements (Phase 2)

Out of scope for v1:
- Entity breakdown section (personal vs NS/DS/LW/VN accounts)
- CCA extraction recommendation (based on personal expenses)
- Burn rate trend chart (last 3-6 months)
- Mermaid pie chart (expense distribution)
- Month-over-month comparison

## Known Limitations (v1)

- **Manual account mapping**: Account names must be manually classified by entity
- **No multi-currency**: Assumes all transactions in EUR
- **No budget tracking**: Toshl budgets not yet imported
- **No recurring transaction detection**: Each entry treated independently
- **No investment tracking**: Toshl doesn't track non-Toshl assets (stocks, crypto, etc.)

## Data Resilience Strategy

**Local cache architecture**:
```
toshl/data/
├── 2020-01_entries.csv
├── 2020-02_entries.csv
├── ...
├── 2026-02_entries.csv
├── accounts.json       # Account metadata (updated on each sync)
├── categories.json     # Category hierarchy
└── tags.json          # Tag list
```

**CSV format design**:
- Denormalized: includes account name, category name, tag names inline
- Self-contained: no foreign keys, readable without metadata files
- Git-tracked: full history of changes over time
- Spreadsheet-compatible: import to Excel/Google Sheets directly

**Sync frequency**: On-demand via `/toshl sync-data` or auto-triggered by `/toshl monthly-report`

**Data sovereignty**: If Toshl shuts down, all historical data remains in git repository.
