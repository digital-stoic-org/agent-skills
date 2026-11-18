---
name: anonymize-doc
description: Detect and anonymize PII (SSN, cards, emails, phones, names) and business data (companies, revenue, costs, pricing). Use when handling sensitive files or user requests anonymization. Check-only or full anonymization with 5 strategies (mask/hash/pseudo/token/mixed). GDPR/HIPAA aware.
allowed-tools: [Read, Bash, Write]
model: sonnet
context: main
---

# PII & Business Data Anonymization

Detect and anonymize PII + sensitive business data using ML-powered detection (Scrubadub + spaCy NER).

## Instructions

### 0. Dependency Check

```bash
SKILL_DIR="$(dirname "$(realpath "$0")" 2>/dev/null || echo /home/mat/dev/agent-skills/dstoic/skills/anonymize-doc)"
pip install -q -r "$SKILL_DIR/requirements.txt" && python -m spacy download -q en_core_web_sm 2>/dev/null
```

### 1. Ask Mode

**Question:** "Check for PII/business data (detection only) or anonymize?"

### 2. Detection

1. Run: `python "$SKILL_DIR/scripts/detect.py" <file_path>`
2. Parse JSON output → format report (type, line/col, severity, category)
3. Ask: "Proceed with anonymization?"

### 3. Anonymization

**Ask strategy:**

| Strategy | Use Case | Reversible | GDPR |
|----------|----------|------------|------|
| `mask` | Max privacy, redaction | No | ✅ Full |
| `hash` | Analytics, tracking | No | ✅ Full |
| `pseudo` | Demos, case studies | Yes | ⚠️ Partial |
| `token` | Financial, vault-backed | Yes | ⚠️ Partial |
| `mixed` | Complex docs (auto per severity) | Mixed | ⚠️ Partial |

**Run:** `python "$SKILL_DIR/scripts/anonymize.py" <file_path> --strategy <choice>`

**Outputs:** `<file>-anonymized.<ext>` + `<file>-audit-log.json`

### 4. Safety Rules

- Preserve original file — never overwrite
- Never commit audit logs to git — check `.gitignore` has `*-audit-log.json`
- Warn: reversible strategies need secure mapping storage
- GDPR requires irreversible (mask/hash) for full compliance

See `reference.md` for entity types, severity tiers, compliance details.
See `examples.md` for before/after samples.
