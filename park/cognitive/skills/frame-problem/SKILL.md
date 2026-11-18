---
name: frame-problem
description: "Sense-making before action. Classify problem using Cynefin triangulation (3 tests + decomposition) to route to the right skill chain. Use when: frame, what approach, how should I start, which skill, where to begin, unsure what to do. NOT for known tasks — just do them."
allowed-tools: AskUserQuestion
model: opus
context: main
argument-hint: <task or problem to frame>
cynefin-domain: confused
cynefin-verb: decompose
---

# Frame

Sense-make → triangulate → decompose if needed → route. Domain determines agent pattern, not just skill.

**Framing:** **$ARGUMENTS**

## ⚠️ AskUserQuestion Guard

**CRITICAL**: After EVERY `AskUserQuestion` call, check if answers are empty/blank. Known Claude Code bug: outside Plan Mode, AskUserQuestion silently returns empty answers without showing UI.

**If answers are empty**: DO NOT proceed with assumptions. Instead:
1. Output: "⚠️ Questions didn't display (known Claude Code bug outside Plan Mode)."
2. Present the options as a **numbered text list** and ask user to reply with their choice number.
3. WAIT for user reply before continuing.

## 0. Auto-classify (skip if no $ARGUMENTS)

Read `$ARGUMENTS`. Attempt domain classification using constraint language.

**If confidence ≥80%**: Propose — but ALWAYS run the Adjacent Domain Challenge before confirming:

```
🎯 Auto-classified: [Domain] (constraint: [type])
→ Verb: [probe|analyze|execute|act|decompose]
→ Suggested route: [skill chain]

⚖️ Adjacent challenge: What if this is actually [nearest domain]?
   [1-2 sentence argument for why it could be the adjacent domain]
   [Why the original classification still holds — or doesn't]

Confirm? [Yes / Re-classify manually]
```

**LLM bias warning**: You are systematically biased toward Complicated (you have "expert knowledge" for everything, so you see governing constraints everywhere). When auto-classifying as Complicated, actively look for signs it might be Complex: Would two experts disagree? Is there genuine novelty? Has this specific combination been tried before?

**If confidence <80%** or no $ARGUMENTS: Skip to Step 1 (triangulation).

## 1. Triangulate (3 tests)

Do NOT ask user to self-classify by constraint type — people systematically misclassify. Instead, ask 3 concrete questions they CAN answer accurately.

**Question Refinement**: If $ARGUMENTS is vague or broad, generate 2-3 clarifying sub-questions to sharpen the problem statement. Present them inline before proceeding.

AskUserQuestion — all applicable questions in one call:

**T1 — "Who's done this before?"** (Keogh Scale)
- 1️⃣ Everyone on the team knows how → **Clear**
- 2️⃣ Someone on our team / we have access to expertise → **Complicated**
- 3️⃣ Someone outside our org has, but not us → **Complex**
- 4️⃣ Nobody has ever done this → **Complex (near Chaotic)**
- 5️⃣ Can't even tell what "this" is → **Confused**

**T2 — "Same inputs, same result?"** (Predictability)
- 🔁 Yes, reliably → **Ordered** (Clear or Complicated)
- 🎲 Probably not — path-dependent, sensitive to context → **Unordered** (Complex)
- 💥 No relationship between action and outcome → **Chaotic**

**T3 — "Can you take it apart?"** (Disassembly)
- 🔧 Yes — independent pieces, reassemble identically → **Complicated max**
- 🧬 No — entangled, changing parts changes the whole → **Complex min**
- ➗ Some parts yes, some parts no → **Composite** (→ Step 1.5 decompose)

**Also ask:**

**Q-Scale** (skip if Chaotic):
- 🪨 Boulder (multi-step, ambiguous, architectural)
- 🫧 Pebble (single file, obvious implementation)
- ❓ Not sure

**Q-Complicated sub** (only if T1=2 AND T2=ordered):
- 📈 **Evolving** — system improving, growing capacity → `/investigate`
- 📉 **Degraded** — was working, now failing → `/troubleshoot`
- ↔️ **Both** — improving in one dimension, degrading in another → `/investigate` with `/troubleshoot` sub-task

### Triangulation Logic

**All 3 agree** → High confidence. Classify directly.

**2 of 3 agree** → Classify by majority. Note the dissenting signal — it may indicate a liminal (boundary) state. Present:
```
🎯 [Domain] (2/3 tests agree)
⚠️ Liminal signal: T[N] suggests [adjacent domain] — [what this means]
```

**All 3 disagree or T3=composite** → Problem spans multiple domains. Go to Step 1.5.

**Misclassification traps to watch for:**
- Engineers/experts picking T1=2 + T2=ordered when T3=entangled → likely Complex, not Complicated (expertise bias)
- Overwhelm picking T2=chaotic when it's actually Complex with enabling constraints → slow down, decompose
- "Nobody has done this" + "predictable result" = contradiction → decompose, parts are in different domains

## 1.5. Decompose (only if tests disagree or problem is composite)

When triangulation doesn't converge, the problem is too coarse. Snowden's rule: "If you can't agree on it, break it down until you can."

1. Break $ARGUMENTS into 2-4 sub-problems
2. For each sub-problem, apply the triangulation tests mentally (don't re-ask user — use context)
3. Present a **domain map**:

```
🧩 Composite problem — sub-parts in different domains:

├── [sub-problem 1]: [Domain] → [verb] → [skill]
├── [sub-problem 2]: [Domain] → [verb] → [skill]
└── [sub-problem 3]: [Domain] → [verb] → [skill]

Suggested sequence: [order based on dependencies + risk]
Start with [highest-risk/Complex parts first — that's where value and risk concentrate]
```

AskUserQuestion: "Does this decomposition match your understanding? Adjust / Confirm / Re-frame"

## 2. Classify + Route

Map triangulation result → domain → verb → skill chain:

| Domain | Constraint | Verb | Scale | Route | OpenSpec? |
|--------|-----------|------|-------|-------|-----------|
| Clear | Rigid | execute | Pebble | Just code it | No |
| Clear | Rigid | execute | Boulder | `/openspec-develop` directly | Yes |
| Complicated | Governing/Evolving | analyze | Any | `/investigate` → `/openspec-plan` | Boulder: yes |
| Complicated | Governing/Degraded | analyze | Any | `/troubleshoot` → stabilize → re-frame | No |
| Complicated | Governing/Both | analyze | Any | `/investigate` + `/troubleshoot` sub-task | Boulder: yes |
| Complex | Enabling/no hypothesis | probe | Any | `/brainstorm` → `/probe` → `/openspec-plan` | Yes |
| Complex | Enabling/has hypothesis | probe | Any | `/probe` → sense → `/openspec-plan` | Yes |
| Liminal Comp↔Complex | Mixed | probe+analyze | Any | `/probe` first (resolve boundary) → re-frame | No |
| Chaotic | Absent | act | — | `/experiment` → stabilize → `/frame-problem` | No |
| Confused | Unknown | decompose | Any | Step 1.5 if not done, else ask user for more context | — |
| Composite | Mixed | per sub-problem | Mixed | Parallel/sequential per domain map from 1.5 | Per part |

**For single-domain result**, present:
`🎯 [Domain] → [Verb] → [skill chain] | OpenSpec: [yes/no] | Scale: [boulder/pebble]`

**For composite result**, present the domain map from Step 1.5 with full routing.

## 3. Handoff

AskUserQuestion "Proceed?": Start chain / Re-frame / Skip framing.

On confirm → invoke first skill with $ARGUMENTS (or first sub-problem for composite).
