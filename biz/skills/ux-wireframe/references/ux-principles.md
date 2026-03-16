# UX Principles for Wireframe Design

Encode these as design constraints, not as guidelines to remember. Each principle should visibly shape the wireframe HTML.

## Cognitive Load Principles (NNG)

Apply these to every screen, especially forms and functional screens:

### 1. Structure
- Group related fields with visual containers (card, section, divider)
- Logical field ordering: familiar → complex, less sensitive → more sensitive
- Single-column layouts for forms (prevents scanning confusion)
- Progressive disclosure: reveal only what's needed at each step
- Visual hierarchy through spacing, not just color or size

### 2. Transparency
- Show upfront what's needed: "You'll need: X, Y, Z" before a multi-step form
- Required vs. optional: clearly distinguished at a glance
- Progress visible from start: show all steps, current position, what's ahead
- Completion time estimate for long workflows

### 3. Clarity
- Plain language: write at 6th–8th grade reading level in labels and help text
- Positive wording: "Keep me logged in" not "Don't log out"
- One thing per question in wizards — don't combine unrelated inputs
- Format examples in placeholder or help text ("e.g., +33 6 12 34 56 78")
- Field length proportional to expected content (short for postcode, long for address)

### 4. Support
- Labels outside input fields (not placeholder-only — placeholders disappear on focus)
- Help text below fields, not above (users read label → help → field)
- Real-time validation only for: passwords, emails — not for every field (reduces anxiety)
- Error messages adjacent to the problem field, not top-of-form only
- Constructive errors: identify problem + provide fix ("Enter a date after today")

## UX Laws Applied to Wireframe Decisions

| Law | Principle | Wireframe Application |
|---|---|---|
| **Fitts's Law** | Larger/closer = easier to click | Primary CTA: largest button, most reachable position (bottom-right on desktop, full-width bottom on mobile) |
| **Hick's Law** | More choices = longer decision time | Limit navigation items to 5–7. Limit inline actions per item to 1–2 primary. |
| **Jakob's Law** | Users expect familiar patterns | Follow platform conventions: nav top/bottom, back = ←, settings = gear. Don't innovate on navigation. |
| **Miller's Law** | 7±2 items in working memory | Groups/chunks: max 7 items in a list before paginating, max 7 nav items, max 7 form fields before section break |
| **Gestalt: Proximity** | Near = related | Group related elements physically. Use whitespace to separate unrelated groups. |
| **Gestalt: Similarity** | Same look = same behavior | All buttons that trigger the same type of action look the same |
| **Affordances** | Looks should signal behavior | Buttons look clickable. Input fields look fillable. Drag handles look draggable. |
| **Feedback principle** | Every action needs a response | Status change after submit. Confirmation after save. Progress during load. |
| **Visibility of system status** | User always knows what's happening | Loading states, progress bars, success/error confirmations |

## Information Architecture Principles

Before screen layout, establish IA from artifacts:

1. **Primary navigation** = JTBD high-frequency functional jobs
2. **Secondary navigation** = JTBD medium-frequency + VPC secondary gains
3. **Settings/Advanced** = JTBD low-frequency + VPC over_serves
4. **Depth limit**: aim for max 3 clicks to any content (NNG standard)
5. **Card sorting validation**: if persona.workaround maps to a different mental model, follow their model not the system's data model

**Navigation choices by persona tech_comfort:**
- Low: Bottom navigation (mobile), clear top nav (desktop), no hamburger if avoidable
- Medium: Standard nav patterns, hamburger acceptable for secondary sections
- High: Sidebar navigation, keyboard shortcuts, command palette

## Annotation Standards (Decode Agency / Balsamiq)

Annotations explain WHY, not WHAT. The wireframe shows what — annotations explain the reasoning.

### What to annotate
1. **Behavior not visible in static wireframe**: animations, gestures, dynamic content rules, state transitions
2. **Design rationale**: why this choice over alternatives ("CTA at bottom because Fitts's Law + thumb reach on mobile")
3. **Content rules**: character limits, truncation behavior, overflow handling
4. **Interaction specifics**: what triggers what, in what order, with what outcome
5. **Accessibility requirements**: focus order, ARIA labels, screen reader behavior

### How to annotate
- Number annotations (①②③) — reduces arrow clutter, enables systematic reference
- Place numbered annotations in a column beside or below the wireframe
- Use distinct visual style: different color from wireframe elements (red is industry standard)
- Be concise: minimum words to communicate effectively
- Audience-aware:
  - **Developers**: implementation steps, API triggers, state logic
  - **Designers**: UX rationale, which artifact insight drove this choice
  - **Stakeholders**: user benefit framing, not technical detail
  - **Copywriters**: content specs, character limits, tone guidance

### Annotation format in HTML comments
```html
<!-- [①] Pain-first headline because:
     VPC pain severity (high) > gain priority (nice-to-have)
     Empathy feels: frustration dominates → lead with relief -->

<!-- [②] Upload zone full-width because:
     Persona tech_comfort: low → maximize target size (Fitts's Law)
     Journey stage 1 emotion: anxious → reduce cognitive load -->

<!-- [③] Trust signal placement here because:
     Forces anxiety "data security" rated strong at this stage
     Forces interventions: "show encryption certificate" -->
```

## Promptframe Principle (NNG, 2025)

**The content inspires feedback, not the container.**

Don't use lorem ipsum. Real content reveals real design challenges. For each wireframe section:
- Use actual copy derived from UX artifacts (Empathy `says`, VPC UVP, JTBD outcome statements)
- If copy is approximate, mark it: `[COPY: Final text TBD by UX writer — tone: reassuring, 12 words max]`
- For data placeholders, use realistic values (not "Item 1, Item 2") — derive from persona context
- For images/icons, use descriptive alt text that specifies intent, not `[image]`

This is how research insights survive the handoff — the copy in the wireframe should be traceable back to artifact data.

## Multi-Option Exploration (from Magdoub pattern)

For ambiguous or high-stakes screens (moments-of-truth, first-run experience), generate **2–3 layout approaches** rather than one:

- **Option A: Conservative** — follows Jakob's Law, familiar patterns, lower adoption friction
- **Option B: Optimized** — applies research insights fully, higher value if adopted
- **Option C: Experimental** — tests a hypothesis derived from an artifact contradiction or opportunity

Label options clearly. Brief rationale for each (1 sentence per option). Let the design brief drive which to recommend.

This is especially valuable for: entry screens, moment-of-truth screens, screens with strong force tension (needs-intervention balance).
