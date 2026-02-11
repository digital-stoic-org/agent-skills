# Anonymization Examples

## Example 1: Customer Data with PII

### Original
```text
Customer Report - Q4 2024

Contact: John Doe
Email: john.doe@acmecorp.com
Phone: (555) 123-4567
SSN: 123-45-6789
Address: 123 Main Street, San Francisco, CA 94102
Credit Card: 4532-1234-5678-9010
IP Address: 192.168.1.100
```

### Strategy Comparison

| Field | Masking | Pseudonymization | Tokenization |
|-------|---------|------------------|--------------|
| Contact | `**** ***` | `Robert Smith` | `TKN_8d7f3a2b` |
| Email | `********@***.com` | `robert.smith@example.net` | `TKN_9f2e1c4d` |
| Phone | `(***) ***-****` | `(555) 987-6543` | `TKN_7a3b8c9e` |
| SSN | `***-**-****` | `456-78-9012` | `TKN_1d4f6a8c` |
| Credit Card | `****-****-****-****` | `5432-9876-5432-1098` | `TKN_3b6d8f1a` |

---

## Example 2: Mixed PII and Business Data (Pseudonymization)

### Original
```text
Partnership Agreement Discussion Notes

From: Alice Johnson (alice.johnson@startup.io)
To: Bob Williams (bob.williams@bigcorp.com)
Date: January 15, 2025

1. Revenue Sharing
   - Startup.io: $1.2M ARR (40% growth)
   - BigCorp: $500M revenue (15% market share)

2. Team Integration
   - Startup.io Engineering (25 employees) → BigCorp R&D
   - CTO: David Chen (david.chen@startup.io, 555-111-2222)
   - VP Eng: Emily Rodriguez (emily.r@bigcorp.com, 555-333-4444)

3. Financial Terms
   - Acquisition price: $15M
   - Earnout: $5M over 2 years
   - Operating budget: $2M annually

SSNs for background checks:
- Alice Johnson: 123-45-6789
- Bob Williams: 987-65-4321
```

### Pseudonymized
```text
Partnership Agreement Discussion Notes

From: Jessica Martinez (jessica.martinez@example.com)
To: Michael Thompson (michael.thompson@sample.org)
Date: March 22, 2025

1. Revenue Sharing
   - TechStart Inc: $1.5M ARR (35% growth)
   - Global Solutions: $580M revenue (12% market share)

2. Team Integration
   - TechStart Inc Product Development (30 employees) → Global Solutions Innovation
   - CTO: Robert Lee (robert.lee@example.com, 555-999-8888)
   - VP Eng: Sarah White (sarah.w@sample.org, 555-777-6666)

3. Financial Terms
   - Acquisition price: $18M
   - Earnout: $6M over 2 years
   - Operating budget: $2.4M annually

SSNs for background checks:
- Jessica Martinez: 456-78-9012
- Michael Thompson: 654-32-1098
```

---

## Choosing a Strategy

| Scenario | Recommended | Why |
|----------|-------------|-----|
| Share logs with contractor | `mask` | Max privacy, no reversal needed |
| Sales demo environment | `pseudo` | Realistic but fake data |
| Cross-dataset analytics | `hash` | Consistent tracking, GDPR compliant |
| Customer case study | `pseudo` | Compelling narrative, no real data |
| Complex M&A document | `mixed` | Hash SSN/financials, pseudo names/emails |
| Regulatory audit (GDPR) | `mask` or `hash` | Must be irreversible |
