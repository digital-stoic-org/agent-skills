# Evaluation Dimensions

Integrates Nielsen, Krug (Don't Make Me Think), Norman (Design of Everyday Things), Shneiderman (8 Golden Rules), Weinschenk (100 Things Every Designer Needs to Know).

## Dimension 1: Heuristic Evaluation

Score each heuristic 0-4 per screen. Extended beyond Nielsen's 10 with Krug, Norman, Shneiderman checks.

| # | Heuristic | Source | What to check in wireframe |
|---|---|---|---|
| H1 | Visibility of system status | Nielsen | Progress indicators, loading states, confirmation messages |
| H2 | Match system ↔ real world | Nielsen | Vocabulary matches target user mental model (empathy map `says`) |
| H3 | User control and freedom | Nielsen + Shneiderman | Back buttons, undo, cancel, escape hatches. **Reversal of actions** easy and obvious. |
| H4 | Consistency and standards | Nielsen + Shneiderman | Same patterns across screens, conventional placement. Internal consistency (within app) AND external (platform conventions). |
| H5 | Error prevention | Nielsen | Validation, confirmation dialogs, clear constraints |
| H6 | Recognition over recall | Nielsen | Labels on icons, visible nav, no hidden menus for primary actions |
| H7 | Flexibility and efficiency | Nielsen + Shneiderman | Shortcuts hint, alternative input methods. **Frequent users** can accelerate. |
| H8 | Aesthetic minimalist design | Nielsen | No unnecessary elements, clear hierarchy, whitespace |
| H9 | Error recovery | Nielsen + Shneiderman | Clear error messages with fix instructions, retry. **Constructive, specific** messages (not "an error occurred"). |
| H10 | Help and documentation | Nielsen | Tooltips, contextual help, FAQ links |
| H11 | Don't make me think | Krug | **Trunk test**: Can user answer "where am I? what are main sections? what can I do here?" in 5 seconds? Each screen self-evident without instructions. |
| H12 | Obvious > clever | Krug | Labels, CTAs, navigation use **obvious** words, not creative/branded terms. "Mes relances" not "Mon cockpit". |
| H13 | Scanning not reading | Krug | Visual hierarchy supports F-pattern scan. Key info in headings/bold. Users don't read — they scan and satisfice. |
| H14 | Affordances & signifiers | Norman | Interactive elements **look** interactive (buttons look clickable, inputs look fillable). Flat design doesn't hide affordances. |
| H15 | Conceptual model | Norman | UI reveals **how the system works**. User can build mental model from the interface (not just follow steps blindly). |
| H16 | Feedback | Norman + Shneiderman | Every action produces **immediate, visible** response. No "did it work?" moments. Shneiderman: closure on action groups. |

### Severity Scale

- **0**: Not a usability problem
- **1**: Cosmetic — fix if time permits
- **2**: Minor — low priority fix
- **3**: Major — high priority, significant impact
- **4**: Catastrophe — must fix before shipping

### Scoring

Per screen: sum of max-severity per heuristic. Invert to 0-100:
`score = 100 - (total_severity / (num_screens × num_heuristics × 4)) × 100`

---

## Dimension 2: Strategy Alignment

Cross-reference wireframe content against UX strategy artifacts. Binary pass/fail per check.

| Check | Source Artifact | What to verify |
|---|---|---|
| **Headline = UVP** | `vpc-{subject}.md` | Landing headline matches/paraphrases the UVP |
| **CTA vocabulary** | `empathy-map-{subject}.md` → `says` | Buttons use words the user actually says |
| **Pain relief visible** | `empathy-map-{subject}.md` → `feels` | UI addresses emotional concerns with reassuring microcopy |
| **JTBD hierarchy** | `jtbd-{subject}.md` | Primary job = hero section. Killer features above fold. Table stakes de-emphasized. |
| **Journey stage mapping** | `journey-map-{subject}.md` | Each screen maps to a stage. No stages skipped. Transitions clear. |
| **Persona fit** | `persona-{subject}.md` | Day-in-life scenario achievable through flow. Tech literacy matches UI complexity. |
| **Engagement layer** | PRD engagement framework | Each engagement tier delivers clear value. Free tier → conversion nudge present. Retention mechanics visible. |

### Scoring

`score = (checks_passed / total_checks) × 100`

List specific misalignments with remediation for each failure.

---

## Dimension 3: Accessibility (WCAG 2.1 AA)

Binary pass/fail per check.

| Check | Rule | How to evaluate in HTML |
|---|---|---|
| Color contrast | WCAG 1.4.3 (4.5:1 text, 3:1 large) | Parse CSS color values, compute contrast ratios |
| Touch targets | WCAG 2.5.8 (44×44px minimum) | Check button/link dimensions |
| Focus indicators | WCAG 2.4.7 | Verify `:focus-visible` styles exist |
| Alt text | WCAG 1.1.1 | `<img>` tags have `alt` attributes |
| Heading hierarchy | WCAG 1.3.1 | h1→h2→h3 order, no skipped levels |
| Form labels | WCAG 1.3.1 | Every `<input>` has associated `<label>` |
| Language attribute | WCAG 3.1.1 | `<html lang="...">` present |
| Keyboard navigation | WCAG 2.1.1 | Tab order follows visual order, all interactive reachable |
| ARIA usage | WCAG 4.1.2 | Roles/labels where needed (upload zones, custom controls) |

### Scoring

`score = (checks_passed / total_checks) × 100`

---

## Dimension 4: Cognitive Load

Per-screen assessment. Persona tech literacy = baseline. Integrates Miller, Hick, Krug (satisficing), Weinschenk (chunking, patterns), Norman (gulf of execution/evaluation).

| Check | Rule | Source | What to evaluate |
|---|---|---|---|
| **Decisions per screen** | Miller 7±2 | Miller | Count distinct choices visible simultaneously. >7 = overload. |
| **Hick's law** | Choice count → decision time | Hick | Primary CTA competing with >2 secondary actions = diluted conversion. |
| **Information density** | Scan vs read | Krug | Can user get gist in <5 seconds? Users satisfice (pick first reasonable option), not optimize. |
| **Progressive disclosure** | Show minimum, reveal on demand | Weinschenk | Advanced options behind accordion/expand. Not everything visible. |
| **Cognitive grouping** | Gestalt proximity/similarity | Gestalt | Related items grouped. Unrelated separated. |
| **Working memory** | No cross-screen recall | Miller | User shouldn't remember info from screen N to act on N+1. |
| **Form complexity** | Fields per step | Weinschenk | >5 visible fields = split into steps. |
| **Gulf of execution** | Clear path from intent to action | Norman | User can immediately see HOW to do what they want. No guessing which button/field to use. |
| **Gulf of evaluation** | Clear feedback after action | Norman | User can immediately see WHETHER their action worked and what changed. |
| **Satisficing support** | First reasonable = right answer | Krug | The obvious/first option IS the right one. Don't punish users who don't read everything. |
| **Chunking** | Group related info in digestible units | Weinschenk | Long lists chunked (max 4-5 per group). Numbers formatted (12 345 € not 12345). Dates readable. |
| **Progress indication** | Show progress during waits | Perceived latency | Waits >1s have progress indicator. Determinate (progress bar) preferred over indeterminate (spinner) when duration is known. |
| **Active waiting** | Reduce perceived wait time | Perceived latency | During waits >3s, user has something to read/see (tips, previews, skeleton screens). Dead spinners avoided. |
| **Calm messaging** | Tone reduces anxiety during waits | Perceived latency | Wait-state copy is calm ("Generating your document…") not anxious ("Please wait, do not close this window!"). |
| **Wait failure recovery** | Failed waits are actionable | Perceived latency | If processing fails, UI explains what happened, offers retry, preserves user input. No silent failures or hangs. |
| **Perceived duration** | Wait feels shorter than actual | Perceived latency | Animation, skeleton screens, or incremental results used to compress perceived time. Empty screen + spinner = worst case. |

### Scoring

Count violations weighted by severity (overload=4, grouping=2). Invert to 0-100:
`score = 100 - (weighted_violations / max_possible) × 100`

---

## Dimension 5: Flow Coherence

Cross-screen navigation audit. Requires all screen HTML + journey-map if available. Integrates Krug (safe exploration, breadcrumbs), Norman (mapping), Tidwell (instant gratification).

| Check | Rule | Source | What to evaluate |
|---|---|---|---|
| **Journey coverage** | Every stage has a screen | Strategy | Map journey stages → screens. Flag missing. |
| **Dead ends** | No screen without forward action | Nielsen | Every screen has CTA/nav (except final confirmation). |
| **Back navigation** | Escape hatches present | Krug | Users can go back from any screen. No point-of-no-return before confirm. |
| **Safe exploration** | No penalty for exploring | Krug | User can click around without fear of losing data, triggering irreversible actions, or getting lost. |
| **State consistency** | Data persists across screens | Shneiderman | Info from screen N visible on N+1 (e.g., filename on result). |
| **Entry point routing** | Multi-entry support | Strategy | All discovery entry points reach appropriate first screen. |
| **Transition clarity** | User knows what happens next | Norman | CTAs communicate next screen ("Voir mon résultat" not "Suivant"). Mapping between action and outcome obvious. |
| **Wayfinding** | User always knows where they are | Krug | Breadcrumbs, step indicators, highlighted nav state. Trunk test passes on every screen. |
| **Instant gratification** | Value before commitment | Tidwell | User sees useful output before being asked to sign up, pay, or provide personal data. |
| **Error recovery flow** | Errors don't strand user | Nielsen | Failed action returns to actionable state. |
| **Engagement transitions** | Logical progression between engagement layers | Strategy | Layer transitions natural, not forced. Free→account nudge present. |

### Scoring

`score = (checks_passed / total_checks) × 100`

Critical weight: dead ends (severity 4), missing journey stages (severity 3).

---

## Dimension 6: Cognitive Walkthrough

Task-based evaluation. For each critical user task, walk through screen-by-screen and answer 4 questions at every step. Source: Wharton et al. (1994), adapted from Lewis & Polson.

### Setup

1. Define 3-5 critical tasks from JTBD/persona (e.g., "Upload invoice and generate reminder letter")
2. For each task, list the ideal action sequence (screen → action → screen)
3. Assume first-time user with persona's tech literacy

### Per-Step Questions

| # | Question | Pass criteria |
|---|---|---|
| Q1 | **Will the user try to achieve the right effect?** | Goal is clear from screen context. User knows what to do next. |
| Q2 | **Will the user notice the correct action is available?** | The right button/link/field is visible without scrolling or guessing. |
| Q3 | **Will the user associate the correct action with the desired effect?** | Label/icon clearly communicates what will happen. No ambiguity. |
| Q4 | **Will the user interpret feedback correctly after acting?** | Response confirms action worked and shows next step. |

### Scoring

Per task: `success_probability = steps_all_4_pass / total_steps × 100`

Overall: average across tasks. Report per-persona if multiple personas defined.

| Score | Interpretation |
|---|---|
| >85% | High discoverability — most users complete first-try |
| 60-85% | Moderate — some steps need label/placement fixes |
| <60% | Low — significant redesign needed for key flows |
