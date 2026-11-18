---
name: edit-risen-prompt
description: Create or audit RISEN prompts with structure validation.
allowed-tools: [Read, Write, Edit, Glob, Grep]
model: sonnet
---

# Edit RISEN Prompt

CREATE mode: Transform messy notes into structured RISEN (Role, INPUT, STEPS, EXPECTATIONS, NARROWING).
AUDIT mode (--audit): Score each section 0-5, total X/25, recommend improvements.

1. Read file, detect mode
2. CREATE: enhance all 5 sections with step patterns + .ctx management
3. AUDIT: score sections, identify gaps, generate recommendations
4. Write output to `[name]-risen.md` or `[name]-audit.md`
