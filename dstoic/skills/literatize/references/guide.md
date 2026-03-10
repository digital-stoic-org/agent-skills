# Literatize Reference Guide

## Knuth Distinction

True literate programming (Knuth, 1984) embeds code in documentation — the narrative drives structure, `tangle` reorders for the compiler. This skill does the converse: documentation embedded in code, following code structure. "Literatize" is aspiration, not claim. The practical goal — context preservation for ephemeral LLM sessions — is served either way.

## Full Example (Python — Stripe + FastHTML)

```python
# ════════════════════════════════════════
# Purpose: Stripe + FastHTML spike — validates checkout/webhook/portal
# Architecture: Browser ←→ FastHTML ←→ Stripe API ←→ SQLite
# Invariants: All webhooks signature-verified, events deduped by event_id
# ════════════════════════════════════════

import os, json, stripe
from dotenv import load_dotenv
from fasthtml.common import *

load_dotenv()

# ── 1. Configuration
# Three secrets from Stripe Dashboard (test mode).
# Gotcha: FastHTML doesn't auto-load .env — load_dotenv() required.

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
WEBHOOK_SECRET = os.getenv("STRIPE_LOCAL_TEST_WEBHOOK_SECRET")

# ── 2. Database
# FastHTML wraps SQLite via fastlite (sqlite-utils + apsw).
# Two tables: StripeEvent (webhook log), StripeState (key/value).
# UNIQUE indexes enforce dedup (event_id) and single-value (key).

db = database("stripe_spike.db")
# ... schema definitions ...

# ── 6. POST /webhook — Receive and verify Stripe events
# This is the critical route that validates the hypothesis.
# Key insight: await req.body() returns raw bytes in @rt async handlers.
# Stripe signature verification REQUIRES raw bytes (not parsed JSON).
# Confirmed working by FastHTML's official Stripe guide.
# See ADR-1 in design.md for the full decision record.

@rt("/webhook", methods=["POST"])
async def webhook(req: Request):
    payload = await req.body()
    # ...
```

## Language Comment Syntax

| Language | Line | Header | Section |
|----------|------|--------|---------|
| Python, Ruby, Shell | `#` | `# ════════════` | `# ── N. Name` |
| JS, TS, Java, Go, Rust, C | `//` | `// ════════════` | `// ── N. Name` |
| CSS | `/* */` | `/* ════════════ */` | `/* ── N. Name */` |
| HTML | `<!-- -->` | `<!-- ════════════ -->` | `<!-- ── N. Name -->` |
| SQL, Lua | `--` | `-- ════════════` | `-- ── N. Name` |
| Clojure, Lisp | `;;` | `;; ════════════` | `;; ── N. Name` |

## Anti-Patterns

- ❌ Commenting obvious code (`x = x + 1`)
- ❌ Duplicating variable/function names in comments
- ❌ Adding docstrings or type annotations
- ❌ Reformatting or refactoring code
- ❌ Writing essay-length comment blocks (>6 lines per section)
- ❌ Claiming this is "literate programming"

