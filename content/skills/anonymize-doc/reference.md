# Anonymize-Doc Reference

## Entity Detection

### Severity Tiers

| Tier | PII Entities | Business Entities |
|------|-------------|-------------------|
| **High** | SSN, Credit Card, Medical ID | Company Names, Revenue, Costs, Market Size, Monetary Values |
| **Medium** | Email, Phone, Address, IP | Departments, Pricing, Financial %, Headcount |
| **Low** | Person Names, URLs, Username | Job Titles, Dates |

### PII Entity Patterns

| Entity | Detection | Example | Severity |
|--------|-----------|---------|----------|
| Email | Regex | `john.doe@email.com` | Medium |
| Phone (US) | Regex | `(555) 123-4567` | Medium |
| SSN | Regex + validation | `123-45-6789` | High |
| Credit Card | Regex + Luhn | `4532-1234-5678-9010` | High |
| Person Names | spaCy NER (PERSON) | `John Doe` | Medium |
| Physical Address | Regex + spaCy (GPE, LOC) | `123 Main St, City, ST` | Medium |
| IP Address | Regex | `192.168.1.1` | Low |
| URLs | Regex | `https://example.com` | Low |

### Business Entity Patterns

| Entity | Detection | Example | Severity |
|--------|-----------|---------|----------|
| Company Names | spaCy NER (ORG) | `Acme Corp` | High |
| Revenue | Regex + context | `$2.5M revenue` | High |
| Costs | Regex + context | `$500K operating costs` | High |
| Market Size | Regex + context | `$10B TAM` | High |
| Monetary Values | spaCy NER (MONEY) + Regex | `$1.2M` | High |
| Pricing | Regex + currency | `$99/month` | Medium |
| Financial % | Regex + context | `23.5% profit margin` | Medium |
| Headcount | Regex + keywords | `150 employees` | Medium |
| Departments | Pattern matching | `Engineering`, `Sales` | Medium |
| Dates | spaCy NER (DATE) | `Q4 2024` | Low |

## Anonymization Strategies

### Masking

Replace characters with asterisks. Keeps format structure visible.

| Entity | Example |
|--------|---------|
| Email | `john.doe@email.com` → `********@***.com` |
| Phone | `(555) 123-4567` → `(***) ***-****` |
| SSN | `123-45-6789` → `***-**-****` |
| Financial | `$2.5M revenue` → `$*.*M revenue` |
| Names | `John Doe` → `**** ***` |

### Hashing (SHA-256)

One-way cryptographic hash. Same input = same 64-char hex output. Good for cross-dataset entity tracking.

### Pseudonymization (Faker)

Realistic fake data. Names → fake names, companies → fake companies, financials → ±20% variant.

### Tokenization

Random tokens (`TKN_` + 8 hex chars). Consistent per entity. Requires secure vault for reversal.

### Mixed Strategy

Auto-selects per severity tier:
- **High severity** → hashing (irreversible)
- **Medium severity** → pseudonymization (readable)
- **Low severity** → pseudonymization (readable)

## Compliance

### GDPR

| Strategy | Status | Notes |
|----------|--------|-------|
| Masking | ✅ Fully compliant | Irreversible, not personal data |
| Hashing | ✅ Fully compliant | Irreversible (watch rainbow tables) |
| Pseudonymization | ⚠️ Still personal data | Requires: separate mapping storage, access controls, encryption, right to erasure |
| Tokenization | ⚠️ Still personal data | Requires: secure vault, access controls |
| Mixed | ⚠️ Partial | High-severity entities fully compliant, others partial |

### HIPAA Safe Harbor (18 Identifiers)

| Coverage | Identifiers |
|----------|-------------|
| ✅ Covered (8/18) | Names, Phone, Fax, Email, SSN, URLs, IP, Account numbers |
| ⚠️ Partial | Dates (except year), Geographic < State |
| ❌ Not covered | Medical/health plan records, certificates, vehicle/device IDs, biometrics, photos |

### NDA & Trade Secrets

Covered: company names, financial metrics, market intelligence, headcount, org structure, project names.

Best practice: masking/hashing for max confidentiality, pseudo for shareable case studies.

## Detection Accuracy

| Category | Method | Accuracy | False Positive Rate |
|----------|--------|----------|---------------------|
| Emails | Regex | 98% | <1% |
| Phones | Regex | 95% | 2-3% |
| SSN | Regex + validation | 99% | <1% |
| Credit Cards | Regex + Luhn | 97% | <1% |
| Person Names | spaCy NER | 85-90% | 5-10% |
| Companies | spaCy ORG | 80-85% | 10-15% |
| Financial | Regex + context | 85-90% | 5-10% |
| Departments | Patterns | 70-80% | 10-15% |

### Known Limitations

- **Person Names**: May miss unusual/non-English/single-word names
- **Companies**: May miss informal references, subsidiaries; may flag universities/gov agencies
- **Financial**: May miss non-standard formats, spelled-out numbers ("two million dollars")
- **Departments**: May miss custom/abbreviated names

Improve accuracy: use `en_core_web_md` or `en_core_web_lg` spaCy models.

## Best Practices

- **Max privacy**: masking or hashing
- **Test data/demos**: pseudonymization
- **Financial with vault**: tokenization
- **Complex docs**: mixed (hash high, pseudo low)
- Always review detection report before anonymizing
- Secure or delete audit logs after use
- Add `*-audit-log.json` and `*-anonymized.*` to `.gitignore`

## Custom Patterns

Add to `scripts/detect.py`:

```python
# PII pattern
custom_patterns = [
    {'name': 'EMPLOYEE_ID', 'pattern': r'EMP-\d{6}', 'severity': 'high', 'category': 'PII'}
]

# Business pattern
business_patterns = [
    {'name': 'PROJECT_CODE', 'pattern': r'PROJ-[A-Z]{3}-\d{4}', 'severity': 'medium', 'category': 'BUSINESS'}
]
```

## Audit Log Security

1. **Encrypt at rest**: `gpg --symmetric --cipher-algo AES256 audit-log.json`
2. **Restrict permissions**: `chmod 600 audit-log.json`
3. **Separate storage**: Mappings stored separately from anonymized data
4. **Retention**: Delete after use: `shred -vfz -n 10 audit-log.json`
5. **Version control**: Never commit — add to `.gitignore`

## Dependencies

```bash
pip install scrubadub faker spacy
python -m spacy download en_core_web_sm
```

Upgrade for better NER accuracy:
```bash
python -m spacy download en_core_web_md
# Then update detect.py: nlp = spacy.load("en_core_web_md")
```
