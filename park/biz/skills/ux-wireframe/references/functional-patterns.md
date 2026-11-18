# Functional Screen Patterns

Engagement screens answer "why should I use this?". Functional screens answer "how do I get my work done?". This reference covers the product UI where users spend 90% of their time.

## Deriving Functional Screens from Artifacts

### Which screens to build

Each JTBD `functional_job` with `frequency: high` or `importance: high` is a candidate for its own screen or screen section. Don't guess — the jobs list IS the feature inventory.

```
functional_jobs:
  - statement: "Track which invoices are overdue"     → List/table screen
    frequency: high, importance: high                  → Primary nav item

  - statement: "Generate a payment reminder"           → Action/creation screen
    frequency: med, importance: high                   → Accessible from list + detail

  - statement: "See payment history for a client"      → Detail/drill-down screen
    frequency: med, importance: med                    → Linked from list items

  - statement: "Configure automatic reminders"         → Settings screen
    frequency: low, importance: med                    → Under settings/preferences
```

### How artifacts shape each screen

| Screen type | Primary artifact driver | Key design question |
|---|---|---|
| List/table | JTBD functional jobs + Persona workarounds | What columns? What actions? How does the user currently organize this data? |
| Detail/drill-down | VPC pain_relievers + Journey touchpoints | What's the core entity? What actions can I take on it? What related info matters? |
| Creation/editing | Empathy does + Forces habit | What's the current workflow? How many steps? What's error-prone? |
| Multi-step workflow | Journey stages (within a task) + Empathy feels | Where does anxiety spike? Where do errors happen? Where to auto-save? |
| Settings/config | JTBD low-freq jobs + VPC over_serves | What's truly configurable vs what should be smart defaults? |
| Dashboard (functional) | JTBD functional jobs (aggregate) + VPC gain_creators | What metrics drive decisions? What's actionable vs informational? |

## Pattern 5: List/Table Screen

The workhorse screen. Users scan, filter, select, act.

```
┌─────────────────────────────────────┐
│  [Nav]                    [+New]    │
│                                     │
│  ┌── Filters/Search ──────────┐    │
│  │ [Search...] [Status ▼] [▼] │    │ ← Persona.workaround: match
│  └─────────────────────────────┘    │   how they currently filter
│                                     │
│  ┌── Summary Bar ─────────────┐    │ ← JTBD aggregate insight:
│  │ 12 total · 3 urgent · €2.4K│    │   the numbers that drive
│  └─────────────────────────────┘    │   action, not just count
│                                     │
│  ┌── List Items ──────────────┐    │
│  │ ┌────────────────────────┐ │    │
│  │ │ [Entity] [Key field]   │ │    │ ← VPC pain_relievers:
│  │ │ [Secondary info]       │ │    │   show the data that
│  │ │ [Status] [Quick action]│ │    │   relieves the pain
│  │ └────────────────────────┘ │    │
│  │ ┌────────────────────────┐ │    │
│  │ │ [Entity] [Key field]   │ │    │
│  │ │ [Secondary info]       │ │    │
│  │ │ [Status] [Quick action]│ │    │
│  │ └────────────────────────┘ │    │
│  └─────────────────────────────┘    │
│                                     │
│  [Pagination / Load more]           │
└─────────────────────────────────────┘
```

Design decisions from artifacts:
- **Columns/fields shown**: Map from JTBD — what info does the user need to decide their next action? NOT all entity fields.
- **Sort default**: What's most urgent? Pain-driven = sort by urgency/deadline. Gain-driven = sort by opportunity/value.
- **Quick actions**: From Journey touchpoints — if the next step is "call client", show phone icon. If "send email", show email icon.
- **Summary bar**: From VPC gain_creators — the aggregate metric that makes accumulated data valuable.
- **Empty state**: From Empathy feels — if new user feels overwhelmed, empty state should guide ("Add your first X to get started"). If confident user, keep it minimal.
- **Status indicators**: From Journey stages — map entity lifecycle to visual states (color, icon, label).

### List complexity calibration

| Persona.tech_comfort | List design |
|---|---|
| Low | Card list (not table), large touch targets, max 3 fields per item, no bulk select |
| Medium | Compact cards or simple table, filters visible, single-item actions |
| High | Dense table, column sorting, bulk select + batch actions, keyboard nav, inline editing |

## Pattern 6: Detail/Entity Screen

Deep view of a single item with contextual actions.

```
┌─────────────────────────────────────┐
│  [← Back to list]    [Edit] [···]  │
│                                     │
│  ┌── Entity Header ───────────┐    │
│  │ [Name/Title]                │    │
│  │ [Status badge] [Key metric] │    │ ← Status = journey stage
│  └─────────────────────────────┘    │   for this entity
│                                     │
│  ┌── Primary Info ────────────┐    │ ← JTBD: fields needed to
│  │ [Field: Value]              │    │   accomplish the primary
│  │ [Field: Value]              │    │   functional job
│  │ [Field: Value]              │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌── Actions (contextual) ────┐    │ ← Journey touchpoints:
│  │ [Action A] [Action B]      │    │   what can I do with
│  │                             │    │   this entity NOW given
│  │                             │    │   its current status?
│  └─────────────────────────────┘    │
│                                     │
│  ┌── Related / History ───────┐    │ ← Timeline of interactions
│  │ [Event] [date] [outcome]    │    │   with this entity
│  │ [Event] [date] [outcome]    │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌── Contextual Insight ──────┐    │ ← VPC gain_creator:
│  │ "Based on history,          │    │   insight only possible
│  │  [actionable suggestion]"   │    │   because of accumulated
│  └─────────────────────────────┘    │   data about this entity
└─────────────────────────────────────┘
```

Design decisions:
- **Status-driven actions**: Actions change based on entity state. A "draft" shows [Edit] [Send]. A "sent" shows [Resend] [Cancel]. Map from Journey stages.
- **Which fields to show**: JTBD importance — high-importance fields in Primary Info, low-importance under "More details" expandable.
- **Related section**: Forces habit — if user currently tracks history in spreadsheet/notes, show timeline UI. If they don't track, this is a gain_creator (new value).
- **Contextual insight**: VPC gain_creator — this is where accumulated intelligence surfaces. "This client has been late 3 times" or "Similar items took 5 days on average".

## Pattern 7: Creation/Editing Form

Where data enters the system. Most error-prone, most anxiety-producing.

```
┌─────────────────────────────────────┐
│  [← Cancel]        [Save / Submit]  │
│                                     │
│  ┌── Form Section 1 ──────────┐    │
│  │ Label                       │    │ ← Empathy says: use
│  │ [Input field]               │    │   user's vocabulary
│  │ Helper text                 │    │   for labels
│  │                             │    │
│  │ Label                       │    │
│  │ [Input field]               │    │ ← VPC pain_reliever:
│  │ [Auto-suggestion ▼]        │    │   auto-fill, smart defaults,
│  │                             │    │   validation = pain relief
│  └─────────────────────────────┘    │
│                                     │
│  ┌── Form Section 2 ──────────┐    │ ← Progressive disclosure:
│  │ [Optional fields]           │    │   JTBD importance drives
│  │ [Expandable: "More options"]│    │   required vs optional
│  └─────────────────────────────┘    │
│                                     │
│  ┌── Preview / Validation ────┐    │ ← Forces anxiety:
│  │ "Here's what will happen:"  │    │   show before committing
│  │ [Preview of result]         │    │   "you can change this"
│  │                             │    │
│  │ [Submit] [Save as draft]   │    │ ← Low-commitment option
│  └─────────────────────────────┘    │   reduces anxiety
└─────────────────────────────────────┘
```

Design decisions:
- **Field count & grouping**: Empathy does — how many steps in current workflow? Mirror grouping, reduce total steps.
- **Smart defaults**: VPC pain_relievers with mechanism "auto-detect" or "pre-fill" → implement as default values.
- **Validation timing**: Persona tech_comfort low → validate on submit (less interruption). High → validate inline (faster feedback).
- **Required vs optional**: JTBD importance. High-importance fields = required. Medium = visible but optional. Low = hidden under "More options".
- **Preview before commit**: Forces anxiety strength. Strong anxiety → always show preview. Weak → skip preview, allow undo.
- **Save as draft**: Journey pain_points at creation stage. If "afraid of losing work" → auto-save + draft option.
- **Error messages**: Empathy thinks — address the concern behind the error, not just the technical fix. "This field is required" → "We need this to [accomplish your goal]".

### Form complexity calibration

| Persona.tech_comfort | Form design |
|---|---|
| Low | One field per row, large labels, immediate inline validation message, wizard (multi-step) for >4 fields |
| Medium | Standard form, grouped sections, validate on blur, single page up to ~8 fields |
| High | Compact layout, multi-column if >6 fields, keyboard-navigable, tab order, paste-from-spreadsheet support |

## Pattern 8: Multi-Step Workflow

When a task has sequential phases with different concerns at each step.

```
┌─────────────────────────────────────┐
│  Step 1 of 3: [Name]               │
│  ●───────○───────○                  │ ← Progress indicator
│                                     │
│  ┌── Current Step Content ────┐    │
│  │                             │    │
│  │  [Step-specific UI]         │    │ ← Each step maps to a
│  │                             │    │   journey sub-stage
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌── Step Summary ────────────┐    │ ← Show what's been
│  │  Step 1: ✅ [summary]      │    │   completed (reduces
│  │  Step 2: (current)         │    │   anxiety about progress)
│  │  Step 3: (upcoming)        │    │
│  └─────────────────────────────┘    │
│                                     │
│  [← Previous]  [Save & Continue →] │ ← Always allow going back
│                                     │   + auto-save between steps
└─────────────────────────────────────┘
```

Design decisions:
- **Number of steps**: From Empathy does — count the steps in current workflow. Consolidate where possible but don't force unrelated inputs into one step.
- **Step boundaries**: From Journey stages or from natural task phases. Each step should have a clear "done" state.
- **Progress persistence**: From Forces anxiety — if strong, show "your progress is saved" after each step. Allow exit and resume.
- **Branching**: From JTBD functional jobs — if different job types need different paths, branch after the first classification step.
- **Step-back**: Always allow. From Empathy thinks "did I enter that correctly?" — the ability to review and fix reduces anxiety.

## Pattern 9: Settings/Configuration

Low-frequency but high-impact. Where defaults are set and automations configured.

```
┌─────────────────────────────────────┐
│  [← Back]              Settings     │
│                                     │
│  ┌── Category 1 ──────────────┐    │
│  │ Setting A                   │    │
│  │ [Toggle / Input]  [Default] │    │ ← Show current default
│  │ Helper: why this matters    │    │   + explain impact
│  │                             │    │
│  │ Setting B                   │    │
│  │ [Toggle / Select]           │    │
│  │ Helper: when to change this │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌── Category 2 ──────────────┐    │
│  │ [Settings...]               │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌── Danger Zone ─────────────┐    │ ← Destructive actions
│  │ [Delete account / Reset]    │    │   isolated at bottom
│  │ "This cannot be undone"     │    │   with clear warnings
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

Design decisions:
- **Which settings exist**: JTBD low-frequency jobs + VPC over_serves. Only expose what users actually configure. Over-served features = hidden or removed.
- **Defaults**: VPC pain_relievers — smart defaults that work for 80% of users. Don't force configuration.
- **Helper text**: Empathy thinks — explain in terms of outcomes ("Receive an alert when...") not mechanics ("Set threshold to...").
- **Grouping**: By user goal, not by system entity. "Notifications" not "Email SMTP settings".

## State Screens

Every functional screen needs non-happy-path states:

### Empty State
```
┌─────────────────────────────────┐
│                                 │
│  [Illustration / Icon]          │  ← Empathy feels:
│                                 │    match emotional tone
│  "No [items] yet"               │
│  "Get started by [action]"      │  ← JTBD: guide to first
│                                 │    functional job
│  [Primary CTA]                  │
│                                 │
└─────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────┐
│  ⚠️ [What went wrong]          │  ← Empathy thinks:
│                                 │    address the concern,
│  [What to do about it]          │    not just the error code
│  [Try again] [Get help]         │
└─────────────────────────────────┘
```

### Loading State
```
┌─────────────────────────────────┐
│  [Skeleton / spinner]           │  ← Persona tech_comfort:
│  "[Processing your X...]"       │    low = explain what's
│                                 │    happening. high = just
│                                 │    show spinner.
└─────────────────────────────────┘
```

## Anti-Patterns for Functional Screens

| ❌ Don't | ✅ Instead |
|---|---|
| Show all entity fields equally | Prioritize by JTBD importance — what drives the next decision? |
| Same actions regardless of state | Status-driven actions from Journey stages |
| Generic "Submit" button | Use Empathy `says` verb: "Send reminder", "Save invoice" |
| Expose all settings upfront | Smart defaults from VPC pain_relievers, configure only what varies |
| Wizard for everything | Wizard only when Persona tech_comfort is low AND >4 fields |
| Generic error messages | Address the user's concern (Empathy thinks), not the system error |
| Identical empty states | Tailor to where user is in Journey — first-time vs returning |
| Form follows database schema | Form follows user's mental model (Empathy does + Persona workaround) |
