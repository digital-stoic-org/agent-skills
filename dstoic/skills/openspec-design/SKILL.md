---
name: openspec-design
description: "Create OpenSpec design artifacts. Use when: user wants to design a feature before tasking, run a bounded context check, produce design.md, or create C4/ER/flow diagrams for an OpenSpec change. Triggers: design, openspec-design, BC check, bounded context, design.md."
model: opus
argument-hint: "design <change-id> | maintain <change-id>"
---

# OpenSpec Design

BC-first structural design engine. Produces `design.md` — the missing layer between proposal.md and tasks.md.

**Domain-agnostic**: Containers are any bounded unit — services, files, skill directories, workflow phases, document sections, process stages. Not limited to software architecture. Choose the zoom level that fits the change.

**You are designing:** `$ARGUMENTS`

## Commands

### design

Analyze proposal → BC check → Minimal Design Kit → write `design.md`.

**Input**: `$ARGUMENTS` = `design <change-id>`

**Workflow**:

1. **Read context**:
   - `openspec/project.md` → execution mode
   - `openspec/changes/{id}/proposal.md` → change scope

2. **BC check** (mandatory first step — stop if fails):
   - Scan proposal for BC violation signals (see reference.md §BC Signals)
   - If multi-domain detected → output split recommendation and **STOP**
   - If single-domain → proceed

3. **Design phase** (only if BC check passes):
   - Produce all 5 sections of `design.md` (see §Output Format)
   - Maintain mode (project.md mode = `maintain`) → delta-only, skip full kit

4. **Write**: `openspec/changes/{id}/design.md`

**BC split output** (stop before design artifacts):
```
⚠️ Bounded Context boundary crossed

This change appears to span multiple domains:
- BC1: {name} — {what it owns}
- BC2: {name} — {what it owns}

Recommendation: Split into separate OpenSpec changes:
1. openspec-plan create {change-id}-{bc1}: {description}
2. openspec-plan create {change-id}-{bc2}: {description}

Why: 1 change = 1 BC enables isolated testing, clear ownership,
and tractable troubleshooting. Mixing domains creates ambiguous
failures where you can't tell which boundary is broken.

Override: Add ADR to proposal.md documenting why mixed-domain is
intentional, then re-invoke /openspec-design design {id}.
```

### maintain

Delta-only design update for an existing `design.md`.

**Input**: `$ARGUMENTS` = `maintain <change-id>`

**Workflow**:
1. Read existing `openspec/changes/{id}/design.md`
2. Read proposal.md for what changed
3. BC check on the delta only
4. Output: which sections change, what moves, why
5. Append `## Delta` section to design.md (do not rewrite existing sections)

## Output: design.md

5 sections — see reference.md §design.md Template for full copy-paste scaffold:

1. **BC Scope** — Domain, ubiquitous language, owns/doesn't own, invariants, context interactions
2. **Containers (C4 L2)** — Bounded units at appropriate zoom + cognitive load check per container
3. **Entity-Relationship** — Mermaid ER with aggregate boundaries marked
4. **Key Flows** — Sequence diagrams (3-5 critical paths), solid=command, dashed=event
5. **ADRs** — context → decision → consequences

## BC Check Signals

Scan proposal.md for these patterns. Any 2+ signals = recommend split.

| Signal | What to look for |
|---|---|
| Multiple vocabularies | Proposal uses terms from 2+ distinct domains that don't overlap (e.g., "order fulfillment" + "payment processing", or "skill authoring" + "plugin deployment") |
| Independent subgraphs | Containers that never interact — diagram splits into disconnected clusters |
| Independent testability | "Part A works without part B" — if separable, should be separate |
| Multiple ownership | "Who owns this?" yields different answers depending on which part |
| Cognitive load overflow | Single container requires 3+ distinct domains to understand simultaneously |

## Reference

See `reference.md` for:
- Full context map relationship types (7 DDD patterns + quick-pick)
- ACL detection heuristic
- Aggregate boundary annotation guide
- Domain event / command flow conventions
- Cognitive load heuristic detail
- design.md template (copy-paste scaffold)
- ADR format template
