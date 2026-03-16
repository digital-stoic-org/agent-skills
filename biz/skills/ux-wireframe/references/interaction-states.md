# Interaction States & Edge Cases

Every functional screen must document ALL states, not just the happy path. This is where wireframes earn their value — a wireframe that only shows the success state is incomplete.

## Pre-Wireframe Device & Context Decisions

Before generating HTML, resolve these from artifacts or ask user:

| Decision | Source | Options |
|---|---|---|
| Primary device target | Persona day_in_life + touchpoints | mobile / tablet / desktop / all |
| Screen orientation | Journey touchpoints | portrait / landscape / both |
| User type variants | Persona triggers + Journey stages | new user / returning / power-user / admin |
| Language/locale | Artifact language + user confirmation | affects layout (RTL, date, currency, legal) |

Generate separate wireframes or clearly labeled variant states when multiple user types or devices matter.

## Form States (document all)

Every form field needs these states visible in wireframe or annotated:

| State | Visual treatment | When triggered |
|---|---|---|
| Default | Empty input, placeholder text | On load |
| Focus | Highlighted border/outline | On click/tab |
| Filled | Entered value | User input |
| Valid | Subtle success indicator | On blur (for critical fields only) |
| Invalid | Error color + error message | On submit or critical fields on blur |
| Disabled | Greyed out, not interactive | Conditional logic |
| Required | Marked distinctly (not asterisk-only) | Always visible |
| Optional | Clearly distinguishable from required | Always visible |

## Form Error Messages (NNG standard)

Error messages must:
1. Identify the specific problem (not "invalid input")
2. State the fix ("Enter a valid email, e.g., name@example.com")
3. Be adjacent to the problem field (not top-of-form only)
4. Use plain language, no technical jargon
5. Max 1-2 sentences

Derive error message wording from **Empathy `thinks`** — address the concern behind the error.

## System Feedback States

Every action that takes >0.5s or has an outcome needs documented feedback:

| State | Pattern | Notes |
|---|---|---|
| Loading | Skeleton screen or spinner + progress label | Persona low-tech: explain what's happening. High-tech: spinner only. |
| Success | Confirmation (inline or toast) | JTBD emotional jobs: celebrate if pride/satisfaction is a goal |
| Warning | Alert with required action | "Are you sure?" for irreversible actions |
| Error (system) | Explain what failed + what user can do | Not "Something went wrong" — be specific |
| Empty state | Guide to first action | Different for: new user, no results, no data yet |
| Offline | Status + queue behavior | Only if relevant to persona context |

## Empty State Variants (derive from Journey)

| Context | Design |
|---|---|
| First-time user (Journey stage 1) | Onboarding nudge: show what success looks like, one clear CTA |
| No search results | Offer: clear search, try different terms, related items |
| No data yet (logged in, nothing created) | Show example/demo data + CTA to create first item |
| Filtered to zero results | Offer to clear filters, not just "no results" |

## File Upload States

If any screen involves file upload:

| State | Must show |
|---|---|
| Idle | Drop zone with clear affordance |
| Drag-over | Visual feedback (border change, highlight) |
| Uploading | File name + progress bar |
| Success | File name + size + confirmation + remove option |
| Error | Specific reason (too large, wrong format) + allowed specs |
| Cancelled | Return to idle state |

## Interaction Gesture Map

Document which interactions each screen responds to. Especially important for mobile-first:

| Gesture | Desktop | Mobile | Note |
|---|---|---|---|
| Primary action | Click | Tap | Default — always present |
| Hover states | Yes | No equivalent | Need tap-to-reveal alternative |
| Drag-and-drop | Yes | Requires long-press | Provide alternative action (button) |
| Keyboard navigation | Tab order | N/A | Accessibility requirement |
| Swipe | No | Yes | Swipe patterns (reveal actions, dismiss, navigate) |
| Pinch/zoom | Browser default | Yes | Only if relevant (maps, images) |
| External links | New tab | Browser | Annotate clearly |

**Rule:** Any interaction only available on one platform needs an alternative on the other.

## Dynamic Content Rules

Annotate behavior for content that changes in length or quantity:

| Scenario | Design |
|---|---|
| Long text in fixed-width cell | Ellipsis + tooltip or truncation strategy |
| List with 0 items | Empty state (see above) |
| List with 100+ items | Pagination or infinite scroll — define threshold |
| Nested content | Nesting strategy: indent + collapse, not infinite depth |
| Badge/counter overflow | "99+" display for counts > visible digits |
| Title overflow | Wrapping rules — when does title wrap vs truncate? |

## Supplementary Screens (easy to forget)

These screens exist in every product. Document or explicitly mark as out-of-scope:

- 404 / Page not found
- 500 / Service unavailable (with retry, status page link)
- Login screen (CAPTCHA rules, social login options, SSO)
- Password recovery flow (email sent → link clicked → new password → confirmation)
- Account creation / verification email
- Settings and preferences
- Help / FAQ / Support contact
- Terms of service / Privacy policy (required, locale-specific)
- Role-specific views (admin vs standard user — if roles exist in persona)
- Session timeout / Re-authentication

Mark these in index.html with status: `[✅ wireframed]` / `[📋 planned]` / `[❌ out of scope]`.

## Wireflows for Dynamic Interactions

For screens with significant dynamic behavior (filters, modals, inline changes), use wireflows:
- Same screen wireframe + arrows from clickable elements → resulting state
- Show the **delta** — what changes after the action — not always a full new screen
- Use for: modal dialogs, filter panels, accordion expand, form step progression, notification dismiss

Annotate wireflow arrows with: trigger event → resulting state change.
