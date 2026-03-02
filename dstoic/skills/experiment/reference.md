# Experiment Reference

## Chaos Types

### Accidental Chaos (Crisis)

Trigger: something broke badly. Constraints were present, now absent.

Signals:
- Production system down or degrading
- Logs are gibberish / contradictory
- Cascading failures with no clear origin
- Experts disagree or are absent

Protocol:
- Faster gate cadence (minutes not hours)
- Prioritize reversible actions
- Document everything — post-mortem needed
- Parallel stabilization track: who else is working this?
- Primary goal: impose ANY constraint (stop the bleeding)
- Secondary goal: preserve enough signal for post-mortem

Exit criteria: system stabilizing OR root cause visible → `/troubleshoot` or `/probe`

### Deliberate Chaos (Innovation)

Trigger: intentional disruption. No constraints exist yet by design.

Signals:
- Novel architecture with no prior art
- Paradigm shift — old mental models don't apply
- Exploring solution space with no hypothesis
- Research spike into unknown territory

Protocol:
- Slower gate cadence (hours not minutes)
- Broader action scope — multiple dimensions acceptable
- Document surprises > document confirmations
- Primary goal: discover what constraints WANT to emerge
- Secondary goal: build a hypothesis for `/probe`

Exit criteria: repeatable pattern visible → `/probe`

## Gate-Per-Action Pattern

### Why gate after every action

In the Chaotic domain, cause-effect relationships are invisible. Any action can:
- Impose a useful constraint (progress)
- Harden a wrong constraint (setback)
- Reveal the problem is different than assumed (reframe)

Autonomous runs batch actions before sensing. In chaos, this compounds errors invisibly. Human gates prevent constraint-lock: acting in one direction before sensing whether that direction is right.

### Gate anatomy

```
PROPOSE: One minimal action
EXPECTED SIGNAL: "If this works we'll see X"
EXECUTE: Human executes (or approves agent execution)
OBSERVE: What actually happened?
INTERPRET: Constraint map update
LOG: action N: [what] → [outcome] → [constraint type shift]
```

### Gate decisions

At each gate, human chooses:
- Continue (same direction, more specific)
- Pivot (different dimension)
- Stop (structure emerged or situation changed)
- Escalate (crisis exceeds scope)

## Transition Triggers

### Chaotic → Complex: invoke `/probe`

Signal: repeatable pattern visible in outcomes.

Criteria (any one sufficient):
- Two consecutive actions produce predictable outcomes
- A hypothesis can be stated ("I think X causes Y")
- An expert says "this looks like a known class of problem"
- The action log shows a direction (not just noise)

Handoff: populate `experiment->-probe-llm.md`
- Carry: action log, emerged constraints, hypothesis candidate
- Do NOT assume stability — probe should test it

### Chaotic → Confused: invoke `/frame-problem`

Signal: experiment revealed the problem is misclassified.

Criteria:
- Original framing was wrong (not chaos, something else)
- Constraints exist but were misidentified
- The situation is actually a mix of domains

Handoff: populate `experiment->-frame-problem-llm.md`
- Carry: action log, what the experiment revealed
- Do NOT default back to Chaotic — re-classify with fresh eyes

### Chaotic → Complicated (crisis): invoke `/troubleshoot`

Signal: chaos was a failure state, not a domain classification.

Criteria:
- Root cause is now visible (chaos was the symptom, not the domain)
- Expert diagnosis is now applicable
- System has stabilized enough to diagnose

Handoff: pass action log as context to `/troubleshoot`
- The experiment log IS the diagnostic timeline
- `/troubleshoot` picks up from "what we tried and what happened"

## Observability Format

```
⚡ Experiment → {mode} → {N} acts → {N} gates → {structure} → TRANSITION
```

Examples:
```
⚡ Experiment → accidental → 3 acts → 3 gates → enabling constraints visible → TRANSITION /probe
⚡ Experiment → deliberate → 7 acts → 7 gates → hypothesis formed → TRANSITION /probe
⚡ Experiment → accidental → 2 acts → 2 gates → root cause visible → TRANSITION /troubleshoot
⚡ Experiment → deliberate → 4 acts → 4 gates → misclassified → TRANSITION /frame-problem
```

Fields:
- `mode`: accidental | deliberate
- `N acts`: total actions taken in act-gate loop
- `N gates`: total gate decisions (should equal acts)
- `structure`: what emerged or was discovered
- `TRANSITION`: target skill

## Worktree Containment

`isolation: worktree` is used for code containment ONLY.

Purpose: isolate experimental code changes so they don't contaminate the main branch during chaotic exploration.

NOT for: background execution, parallelism, autonomy.

Pattern:
- Enter worktree before making code changes
- Gate still fires — human decides whether to merge, discard, or pivot
- Worktree is disposable if experiment direction is abandoned

## Constraint Map

Maintain a running constraint map across the act-gate loop:

```yaml
constraint_map:
  absent: [dimensions with no constraint]
  enabling: [dimensions where patterns emerged]
  hardened_wrong: [directions that closed off]
  unknown: [dimensions not yet explored]
```

Update after each gate. When `absent` list shrinks to zero → structure has emerged.
