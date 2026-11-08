---
date: 2026-11-03
axis: B (interaction/layout patterns: ask, answer, track, close feedback; decision; test execution)
sources_consulted: 34 (primary fetched: 17; secondary via search snippets: 17)
patterns: 35
status: draft-complete
notes:
  - evidence tags: primary = page fetched and read this session; secondary = search snippets or blog summaries; unverified = no source reached, from general knowledge
  - all patterns assumed implementable as plain HTML/CSS + small vanilla JS, offline, light/dark via prefers-color-scheme, mobile via single column
  - common state model for all patterns: one JSON per page {page_id, round, blocks[{id, kind, verdict, comment, anchor, status}], exported_at}; localStorage autosave; export = Blob download + textarea fallback
objective_ids: [G1,G2,G3,G4,G5,G6,D1,D2,D3,D5,C1,C4,T1,T2,T3,X1,X2,X3]
---

# 1. catalog

```yaml
patterns:

- id: P01
  name: Check-your-answers recap with per-row Change link
  origin: GOV.UK Design System, pattern "Check answers" - https://design-system.service.gov.uk/patterns/check-answers/
  problem: reviewer submits without seeing the sum of what they decided; mistakes found after export
  objectives: [G6, G3, X3]
  data_required: blocks[{id, label, verdict, comment_excerpt}]
  html_feasibility: low
  interaction: final section lists every block with its verdict and comment as key/value rows; "Change" link scrolls to the block; button names the action ("Export verdicts"); page states export is not final until clicked
  injection_rule: always, as last section of any page with >=3 blocks
  anti_use: single-block pages; do not use as the only place to answer
  evidence: primary (rules: title tells what to do, button names action, Change returns to recap, skipped = "Not provided")
  tips: show unanswered rows as "Not provided" with link to the block, not blank

- id: P02
  name: Summary list (key/value rows) with optional summary cards
  origin: GOV.UK Summary list - https://design-system.service.gov.uk/components/summary-list/
  problem: context facts (objective, audience, mandate, sources, dates) buried in prose
  objectives: [G2, D1, G5, C4]
  data_required: context{key,value,action?} rows; cards[] when several items of the same type
  html_feasibility: low (dl/dt/dd + CSS grid; stacks on phone)
  interaction: read-only scan; optional row action ("Open source")
  injection_rule: use for any set of >=3 short facts with fixed keys; cards when items repeat (e.g. one card per source, per option)
  anti_use: tabular multi-column data (use table); items without a key
  evidence: primary (dl element; keep borders, they help reading; card actions max 2-3, warn on risky actions)

- id: P03
  name: Task list with minimal status set and "have you completed this section?"
  origin: GOV.UK Complete multiple tasks - https://design-system.service.gov.uk/patterns/complete-multiple-tasks/
  problem: long review spread over sessions; reviewer loses track of what remains
  objectives: [G3, T3, G1]
  data_required: sections[{id, title, status in {completed, incomplete, in_progress?, cannot_start}, est_minutes}]
  html_feasibility: low
  interaction: list of sections with tag on the right; click jumps to block; reviewer explicitly declares a section done (yes/no) rather than the page inferring it from clicks
  injection_rule: >=5 blocks or expected review >10 min; at page top below the ask
  anti_use: short pages (guide says simplify first); never use the "problem" status as validation (inline errors instead)
  evidence: primary (fewest statuses; verbs for tasks; adjectives for status; "cannot start yet" = grey, unlinked; user-declared completion)
  tips: map "completed" to declared-done, not "visited"; this solves "unseen" tracking

- id: P04
  name: Typed response with motivation (verdict is a typed annotation, not a free comment)
  origin: W3C Web Annotation Data Model, motivations (commenting, questioning, assessing, editing, replying) - https://www.w3.org/TR/annotation-model/
  problem: untyped comments force the agent to guess whether a note is approval, change request, or question
  objectives: [G6, G4]
  data_required: block ids; verdict enum {ok, revise, no, question}; comment string; optional proposed_text
  html_feasibility: low (radio group styled as segmented control; comment textarea revealed by non-ok verdicts)
  interaction: pick one verdict per block; comment mandatory for revise/no/question, optional for ok
  injection_rule: every block that carries a claim, decision, or deliverable unit
  anti_use: purely informational blocks (give a "seen" checkbox only)
  evidence: primary for the motivation vocabulary; the 4-verdict mapping (ok=assessing, revise=editing, no=assessing, question=questioning) is my derivation
  tips: segmented control with text labels and shapes, not colour only; touch target >=44px; keyboard 1-4 shortcuts on desktop

- id: P05
  name: Text-quote anchoring of comments (select text -> comment)
  origin: W3C Web Annotation TextQuoteSelector (exact + prefix + suffix) - https://www.w3.org/TR/annotation-model/
  problem: block-level comment cannot point at one figure or sentence; ids break when the text changes in round 2
  objectives: [G6, G4, D2]
  data_required: block text immutable per round; export stores {block_id, exact, prefix, suffix}
  html_feasibility: med (window.getSelection + range; mobile selection UX is clumsy)
  interaction: select a phrase, a small "Comment on selection" button appears; comment attaches to the quote
  injection_rule: only on prose blocks >120 words or tables with figures; offer as optional layer, block verdict stays mandatory
  anti_use: phone-first pages (fallback: per-sentence or per-row "comment" link generated by the code, ids assigned by generator)
  evidence: primary (selector spec); phone usability unverified
  tips: for generated pages prefer generator-assigned ids on sentences/rows (stable, no selection API); keep quote selector for robustness across rounds

- id: P06
  name: Author-query table with response column and house codes
  origin: CIEP "Queries to the author" (editorial copyediting practice) - https://www.ciep.uk/resource/queries-author.html
  problem: agent questions to the reviewer are mixed with prose and get lost; answers are vague
  objectives: [G1, G4, G6, D3]
  data_required: queries[{id (e.g. Q3), location (block id), query text, options[] optional, default?}]
  html_feasibility: low
  interaction: three columns - location, query, response; reviewer picks an offered option or types; "Agreed" / "Done" style short answers accepted
  injection_rule: whenever the agent has questions it could not resolve; list at the top (G1) and inline at the block
  anti_use: do not query what the agent can fix alone (spelling, trivial facts); do not ask without proposing options
  evidence: primary (neutral tone, specific, offer alternatives, no silent changes, answers recorded through the query system)
  tips: each query needs an id, a location, and at least two options + "other"; mark the default the agent will apply if no answer

- id: P07
  name: Markup view switcher (Original / Simple / All changes)
  origin: Microsoft Word Track Changes views - https://support.microsoft.com/en-us/office/track-changes-in-word-197ba630-0f5f-4a8e-9a77-3712475e806a ; legal redlining practice
  problem: round 2 reader must re-read everything to find what changed
  objectives: [G4, D2, D3]
  data_required: per block {text_prev, text_now, change_type, linked_feedback_id}
  html_feasibility: low-med (ins/del elements; word-level diff computed by the generator, not at runtime)
  interaction: toggle: Final (clean) / Changes shown / Original; margin bar marks changed blocks; "Next change" button
  injection_rule: round >=2 and any block with text_prev; default view = clean with margin bars, changes one click away
  anti_use: round 1; heavy rewrites (diff noise) - show side-by-side before/after instead
  evidence: primary (Simple = margin line, All = coloured, Hiding markup does not remove it; only Accept/Reject resolve)
  tips: underline+strike, not only colour; the accept/reject maps to the reviewer re-verdict on the changed block

- id: P08
  name: Review counter ("n changes, m comments, k unresolved") 
  origin: Word Reviewing Pane summary - same Microsoft page as P07
  problem: reviewer cannot tell whether anything remains before sending
  objectives: [G3, G4]
  data_required: counts derived live from state
  html_feasibility: low (sticky footer/header bar)
  interaction: sticky bar shows answered/total and unresolved items; click cycles to next unanswered
  injection_rule: always
  anti_use: none; keep numbers not percentages (exact counts are verifiable)
  evidence: primary (pane summary confirms none remain before sharing)

- id: P09
  name: Round-2 resolution ledger (addressed / answered / pending / declined, linked to the original feedback)
  origin: composite - CIEP query response log (P06) + inspection issue log dispositions (Wiegers template, secondary) + Figma comment pins (resolve)
  problem: after "process the feedback" the reviewer cannot verify that each remark was handled and how
  objectives: [G4, G3]
  data_required: prior_feedback[{id, block_id, verdict, comment}], agent_response[{feedback_id, status in {addressed, answered, pending, declined}, note, new_block_ref}]
  html_feasibility: low-med
  interaction: top-of-page ledger, one row per previous comment, grouped by status; reviewer can reopen a row (sets verdict again) or confirm
  injection_rule: round >=2; mandatory first section; "declined" requires a reason
  anti_use: round 1
  evidence: secondary for inspection dispositions (Resolved/Deferred/Rejected from student/defect-tracking notes; Wiegers log lists severity major/minor); Figma resolve behaviour not confirmed (help page fetched did not cover it) -> unverified
  tips: counts first ("11 addressed, 2 answered, 1 declined, 0 pending"), exceptions (declined, pending) expanded, rest collapsed

- id: P10
  name: Single "Important" banner for the one thing that changes the review
  origin: GOV.UK Notification banner - https://design-system.service.gov.uk/components/notification-banner/
  problem: critical caveat (stale source, scope change, deadline) lost in the page
  objectives: [G5, G4, G1]
  data_required: banner{type in {important, success}, heading, text}
  html_feasibility: low
  interaction: read; dismissal optional
  injection_rule: at most one per page; use when a freshness check failed, a source is older than threshold, or an assumption changed between rounds
  anti_use: validation errors; information that belongs to the main task; several banners (merge or show highest priority)
  evidence: primary (sparing use, one per page, heading text so meaning is not colour-only)

- id: P11
  name: Progressive disclosure for secondary detail
  origin: GOV.UK Details - https://design-system.service.gov.uk/components/details/
  problem: detail overloads the first read
  objectives: [G2, G5, D2, T1]
  data_required: block.summary (always shown), block.detail (collapsible)
  html_feasibility: low (native details/summary, zero JS)
  interaction: reviewer opens only what they doubt
  injection_rule: sources list, full commands, raw logs, long rationale; default closed
  anti_use: anything most readers need; GOV.UK warns some users skip the link and voice control may struggle -> never hide a verdict-relevant fact, never hide the flagged exception
  evidence: primary
  tips: summary line must state the finding, not "More details"

- id: P12
  name: Error summary at export ("There is a problem")
  origin: GOV.UK Error summary - https://design-system.service.gov.uk/components/error-summary/
  problem: export with missing mandatory comments or unanswered blocks silently produces a poor round 2
  objectives: [G3, G6]
  data_required: validation rules per block (comment required for revise/no/question)
  html_feasibility: low
  interaction: on Export click, summary at top lists each problem as a link to the offending block; focus moves to it
  injection_rule: always with export button; allow "export anyway" with explicit "unanswered = no opinion" marker
  anti_use: do not block export for unseen blocks the reviewer chose to skip - mark them "not reviewed"
  evidence: primary (links to first field, same wording as inline message, focus moves to summary)

- id: P13
  name: Warning callout for irreversible or consequential items
  origin: GOV.UK Warning text - https://design-system.service.gov.uk/components/warning-text/
  problem: one-way or costly items look like any other block
  objectives: [X2, D5, C1]
  data_required: block.flags[] {kind: irreversible|costly|public|security}, reason
  html_feasibility: low
  interaction: read; may require explicit confirm checkbox before verdict "ok"
  injection_rule: content signals - delete, publish, send, migrate, spend, rotate keys, schema change, external recipient
  anti_use: general emphasis; overuse kills the signal (cap ~3 per page)
  evidence: primary (use to warn about something important); the confirm-checkbox gate is my addition

- id: P14
  name: Confirmation panel after export (what happens next)
  origin: GOV.UK Confirmation pages - https://design-system.service.gov.uk/patterns/confirmation-pages/
  problem: reviewer unsure whether export worked and what to do (copy JSON where? say what?)
  objectives: [G1, G4]
  data_required: export file name, exact next-step phrase ("tell the agent: process the feedback"), reference id/round/timestamp
  html_feasibility: low
  interaction: panel replaces the button area: file saved name, copy-the-sentence button (see P21), round number, how to reopen
  injection_rule: always
  anti_use: none
  evidence: primary (completion + what happens next + reference number + way to save a record)

- id: P15
  name: SBAR header (Situation / Background / Assessment / Recommendation)
  origin: clinical handoff, Navy-origin, endorsed by IHI/Joint Commission/WHO - https://qi.elft.nhs.uk/?p=10117 ; review https://link.springer.com/article/10.1186/s40886-018-0073-1
  problem: the synthesis is narrative; reader must dig for what is asked of them
  objectives: [G1, G2, C1, X3, D1]
  data_required: situation (1-2 lines), background (objective, mandate), assessment (agent's own read incl. confidence), recommendation (what reviewer must do, time)
  html_feasibility: low
  interaction: read in 30s; recommendation ends with the ask and button to start
  injection_rule: top of every page; for code review fill C1 (big picture) as Situation+Background
  anti_use: do not pad; if assessment is empty the agent has not formed a view
  evidence: secondary (SBAR content from nursing sources and a 2018 narrative review; IHI download page not reached)

- id: P16
  name: Objective-anchored critique brief (goals first, questions not opinions, requested kinds of input)
  origin: Nielsen Norman Group "Design critiques" - https://www.nngroup.com/articles/design-critiques/
  problem: reviewer judges on taste; feedback is not tied to the objective
  objectives: [G1, G2, D1, G6]
  data_required: objective, audience, success criteria, "what input I want" list, "out of scope" list
  html_feasibility: low
  interaction: reviewer reads goals, then each verdict is read against them; verdict form may show the criterion tag per block
  injection_rule: top of doc review and design deliverables; per block add "serves objective O2"
  anti_use: code diffs where the mandate is a spec (use P29/C4 table)
  evidence: primary (set scope/objectives first, share beforehand, reframe opinions as goal questions, facilitator time-box)
  tips: include explicit "not asking you about" list; reduces scope creep in feedback

- id: P17
  name: Time-boxed silent read with margin questions
  origin: Amazon six-page memo meetings - https://www.cnbc.com/2018/04/23/what-jeff-bezos-learned-from-requiring-6-page-memos-at-amazon.html (and blogs)
  problem: reviewer skims and responds from impression; no stated reading time
  objectives: [G1, G3]
  data_required: est_read_minutes per section, total; question count
  html_feasibility: low (static estimate; optional timer)
  interaction: reviewer sees "Read 8 min, decide 4 min"; notes questions as they read (verdict=question)
  injection_rule: header of long deliverables; estimate = words/200 + 20s per block needing verdict
  anti_use: do not impose a hard timer; estimate only
  evidence: secondary (durations vary 10-30 min across blogs; no Amazon primary document found)

- id: P18
  name: Pause-point Do-Confirm checklist of killer items
  origin: aviation checklists (Boorman/Boeing via Gawande, "Checklist Manifesto"); WHO Surgical Safety Checklist 3 pauses - https://www.who.int/publications/i/item/9789241598590
  problem: reviewer forgets the few checks that matter before approving
  objectives: [C4, D5, G3, T2]
  data_required: items[<=9]{id, text, evidence_ref}, pause_point (e.g. "before approving merge", "before export")
  html_feasibility: low (checkboxes; export blocked or flagged until all ticked or waived)
  interaction: Do-Confirm: reviewer reads, then ticks to confirm; each tick optionally waivable with reason
  injection_rule: before the final verdict; items drawn from risks, flagged irreversible items, mandate requirements; keep 5-9
  anti_use: long procedures (use P19); lists that restate everything
  evidence: secondary (Boorman five-nine items and killer items from book summaries; WHO manual text not reached - the fetched WHO page lacked pause details)

- id: P19
  name: Read-Do step runner (one step in focus, ordered)
  origin: Read-Do checklist type (aviation emergency/abnormal procedures; Gawande) - https://sketchplanations.com/read-do-do-confirm-checklists ; https://www.cfinotebook.net/notebook/flight-training/checklist-usage-in-aviation
  problem: tester executes steps out of order, misses a precondition
  objectives: [T1, T2]
  data_required: steps[{n, action, expected, command?, precondition?}]
  html_feasibility: med (current-step highlight, next/prev buttons; all steps still visible)
  interaction: current step expanded; "Pass / Fail / Blocked" advances; failed step stops the run by default and offers "skip with reason"
  injection_rule: sequential test procedures with dependencies; destructive or irreversible steps
  anti_use: independent checks (use P22 list); do not hide the other steps
  evidence: secondary (terminology varies across sources; no FAA primary text reached)

- id: P20
  name: Given/When/Then triple with Examples table
  origin: Gherkin reference - https://cucumber.io/docs/gherkin/reference/
  problem: test step mixes setup, action and expectation; expected result unclear
  objectives: [T1, T3]
  data_required: scenarios[{id, given[], when, then[], examples[]?}]
  html_feasibility: low
  interaction: read; run each Then as the observable check; one example row = one execution row
  injection_rule: behaviour tests with data variants; user-facing acceptance criteria
  anti_use: exploratory tests; Then must be observable (guide says check output, not internal state)
  evidence: primary (Background max ~4 lines; Examples table feeds placeholders)

- id: P21
  name: Copy button with insecure-context fallback
  origin: Clipboard API secure-context rule + execCommand fallback (developer sources only) - https://bobbyhadz.com/blog/navigator-clipboard-is-undefined-in-javascript
  problem: copy-paste of commands/prompts/curl fails silently on http/LAN and file://
  objectives: [T1, G1, G4]
  data_required: snippet text (inert, in pre or textarea), label, language
  html_feasibility: low-med
  interaction: button "Copy" copies; state changes to "Copied" or "Select and press Ctrl+C" on failure
  injection_rule: any command, prompt, curl, path, SQL block; also the "tell the agent: process the feedback" phrase
  anti_use: snippets containing secrets: show masked placeholder
  evidence: secondary (MDN page not reached; pattern consistent across sources)
  implementation: |
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(ok, fb);
    else fb();
    fb(): create textarea (position:fixed; left:-9999px, NOT display:none), select(), document.execCommand('copy') synchronously in the click handler, use the boolean result;
    if false: reveal the snippet in a visible readonly textarea, auto-selected, message "Press Ctrl+C".
    Show success only on true.

- id: P22
  name: Run status set with progress bar (Passed / Failed / Blocked / Retest / Untested)
  origin: TestRail result statuses - https://velog.io/@dahunyoo/TestRun-and-TestPlan-on-Testrail ; vendor blog https://blog.gurock.com/announcing-testrail-1-1/
  problem: test execution outcome reduced to pass/fail; blocked work looks like failure
  objectives: [T2, T3, G3]
  data_required: tests[{id, title, status, note, evidence_attachment?}]; status enum fixed in the page
  html_feasibility: low
  interaction: per-test segmented control; note required for failed/blocked; stacked bar summarizes counts
  injection_rule: any test plan; map blocked = precondition unmet, retest = fixed, ready again
  anti_use: do not add custom statuses beyond 6; do not count blocked as pass
  evidence: secondary (default ids 1 Passed, 2 Blocked, 3 Untested, 4 Retest, 5 Failed; progress-bar computation not documented in sources)
  tips: stacked bar order = failed, blocked, retest, untested, passed; exceptions first

- id: P23
  name: Coverage matrix (requirement x test, gaps highlighted)
  origin: requirements traceability matrix (general QA practice); linked to assurance cases (P26)
  problem: reviewer cannot see what is not tested
  objectives: [T3, C4]
  data_required: requirements[{id, text, priority}], tests[{id}], links[{req_id, test_id}]
  html_feasibility: med (table; phone: grouped list "Requirement - tests - gap")
  interaction: rows with zero tests flagged; click a cell jumps to the test; verdict on gap: accept risk / add test
  injection_rule: test plans with >=5 requirements or a mandate document; generate from links in data
  anti_use: tiny plans
  evidence: unverified (no primary source fetched; standard QA artefact)

- id: P24
  name: Mandate-conformity table (requirement - status - evidence - deviation reason)
  origin: composite - GOV.UK summary list rows (P02) + risk-of-bias per-domain judgement with justified override (Cochrane Handbook ch.8) - https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-08
  problem: "does it do what was asked?" answered by impression
  objectives: [C4, D5, C1]
  data_required: mandate_items[{id, text, source}], status in {met, partial, not_met, not_applicable}, evidence_ref, deviation_reason
  html_feasibility: low
  interaction: reviewer overrides status with written reason (Cochrane: reviewer may override algorithm with justification); partial/not_met rows expanded first
  injection_rule: whenever a written mandate/brief/spec exists; agent must fill each row, never leave blank
  anti_use: no mandate -> instead ask reviewer to state it (P16)
  evidence: primary for the three-level judgement + override-with-justification; the table itself is my composite

- id: P25
  name: Signalling questions before the verdict
  origin: Cochrane risk-of-bias tool signalling questions (Yes / Probably yes / Probably no / No / No information) - https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-08
  problem: single judgement call without structured facts; hard for a tired reviewer
  objectives: [D5, C4, G6]
  data_required: per block 2-4 closed questions with agent's proposed answer + evidence; derived verdict suggestion
  html_feasibility: med
  interaction: reviewer confirms or flips the agent's answers (one tap each); suggested verdict computed by code, reviewer can override with reason
  injection_rule: high-stakes blocks (security, legal, financial claim); not for every block
  anti_use: low-stakes blocks (adds clicks)
  evidence: primary for the answer scale and "algorithm proposes, human can override with justification"

- id: P26
  name: Claim tree with evidence and defeaters (Assurance 2.0 / GSN)
  origin: Goal Structuring Notation (Kelly) and Assurance 2.0 (Bloomfield/Rushby) - https://www.csl.sri.com/~rushby/papers/a2nutshell.pdf ; https://arxiv.org/abs/2408.11699v3
  problem: key claims, their support and what could undermine them are scattered
  objectives: [D2, D5, C4, X3]
  data_required: claims[{id, text, parent, evidence[], defeaters[{type: rebutting|undermining|undercutting, text, status: open|resolved|residual}]}]
  html_feasibility: med (nested list with indentation, not a graph; native details for subtrees)
  interaction: claim -> evidence -> defeaters; reviewer verdict on each claim; open defeaters listed first
  injection_rule: key figures/claims changed (D2), risk sections, safety/legal/performance claims
  anti_use: do not draw GSN shapes in HTML (axis A); keep it a nested text outline
  evidence: secondary (search summaries of Assurance 2.0: defeaters, evidence must discriminate claim from negation); full papers not read

- id: P27
  name: Evidence certainty badge (High / Moderate / Low / Very low) with stated reasons
  origin: GRADE / Cochrane summary-of-findings - https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-14
  problem: all claims look equally solid
  objectives: [D2, G5, X3]
  data_required: claim.certainty enum, reasons[] (risk of bias, inconsistency, imprecision, indirectness, publication bias analogues: source age, single source, unverified)
  html_feasibility: low
  interaction: badge on claim; hover/tap shows reasons; ratings are per claim, not per document
  injection_rule: any claim with a figure; derive certainty from provenance rules (primary vs secondary, date, corroboration count)
  anti_use: ratings without recorded reasons (Cochrane requires justification)
  evidence: secondary (symbol notation not verified; per-outcome rating and mandatory justification confirmed via search summary)

- id: P28
  name: Provenance strip (source, date, rank, reference) per claim
  origin: Wikidata statement ranks (preferred / normal / deprecated) with references - https://www.wikidata.org/wiki/Help:Ranking
  problem: reviewer cannot tell which values are current, sourced, or superseded
  objectives: [G5, D2, D3]
  data_required: claim{source_ref, retrieved_at, source_date, rank in {preferred, normal, deprecated}, rank_reason}
  html_feasibility: low
  interaction: small line under claim: "source - date - retrieved" ; deprecated values shown struck-through with reason, preferred marked
  injection_rule: every figure, quote, or external fact; stale = retrieved_at older than a threshold set by the generator
  anti_use: do not display on every sentence; only on claims
  evidence: primary (ranks and "preferred/deprecated" semantics; reason qualifiers; deprecation is for erroneous/outdated values)
  tips: freshness uses date text plus an icon-free word ("stale"), not colour only

- id: P29
  name: Decided / Open / Question ledger (decision status per item)
  origin: ADR status field (proposed, accepted, rejected, deprecated, superseded) - https://adr.github.io/madr/ ; DACI template status/outcome - https://www.atlassian.com/team-playbook/plays/daci
  problem: reader cannot separate what is settled from what still needs input
  objectives: [D3, G4, G1]
  data_required: items[{id, text, status in {decided, open, superseded}, decided_by, date, link_to_block}]
  html_feasibility: low
  interaction: three-column or grouped list; "open" items carry the response control; "decided" collapsed, with "reopen" link
  injection_rule: doc review and decision sheets; open first
  anti_use: pages with no decisions
  evidence: primary (status vocabularies; DACI outcome added after decision)

- id: P30
  name: Options comparison table with decision factors and pros/cons
  origin: MADR Considered Options / Pros and Cons; DACI options table - https://adr.github.io/madr/ ; https://www.atlassian.com/team-playbook/plays/daci
  problem: options compared in prose; criteria implicit
  objectives: [X1, X3]
  data_required: criteria[{id, label}], options[{id, summary, per_criterion{value, note}, good[], bad[], cost, effort}]
  html_feasibility: low-med (table; phone: one card per option with criteria rows)
  interaction: reviewer picks an option (radio) or "none of these"; may flag a criterion as non-negotiable
  injection_rule: >=2 options; include the do-nothing option always
  anti_use: single recommended path without alternatives; criteria not tied to the objective
  evidence: primary (section names; decision drivers listed before options; do not hide the outcome)
  tips: put the recommended option first but label the recommendation separately (P31); show the difference between options, not full parity

- id: P31
  name: Recommendation card with likelihood word + numeric range and separate confidence
  origin: Kent "Words of Estimative Probability" (CIA, 1964) - https://www.cia.gov/resources/csi/studies-in-intelligence/archives/vol-8-no-4/words-of-estimative-probability ; ICD 203 (likelihood and confidence kept separate) - https://www.dni.gov/files/documents/ICD/ICD-203.pdf
  problem: "likely"/"probably" read as anywhere from 20% to 80%; confidence conflated with probability
  objectives: [X3, D5, G6]
  data_required: recommendation{option_id, likelihood_pct_range, confidence in {low, moderate, high}, basis[], assumptions[], what_would_change_my_mind[]}
  html_feasibility: low
  interaction: reviewer agrees / disagrees with recommendation, challenges an assumption (each assumption has a verdict)
  injection_rule: every decision sheet; any block where the agent expresses a probability judgement
  anti_use: false precision (no 73.4%); use ranges or bands; do not show confidence without its basis
  evidence: secondary (PDFs unreadable by the fetch tool; search results confirm 1951 "serious possibility" read as 20-80%, and the separation of likelihood vs confidence in ICD 203; confidence defined by source quality - not directly verified)

- id: P32
  name: Door-type badge (one-way / two-way) that sets process weight
  origin: Bezos 2015 shareholder letter, Type 1 / Type 2 - https://www.sec.gov/Archives/edgar/data/1018724/000119312516530910/d168744dex991.htm
  problem: reviewer spends equal effort on trivial reversible and irreversible choices
  objectives: [X2, D5]
  data_required: decision.reversibility in {one_way, two_way}, cost_to_reverse (time/money), blast_radius
  html_feasibility: low
  interaction: badge at top of the decision; one-way unfolds extra gates (premortem P33, confirm checkbox P13); two-way gets "decide fast, here is the default"
  injection_rule: classify by content signals (delete, publish, contract, migration = one-way; config, copy, draft = two-way)
  anti_use: do not apply the "70% of information" rule to one-way doors (that rule is from the 2016 letter and concerns two-way; sources differ)
  evidence: primary for the one-way/two-way definition (quoted: "consequential and irreversible or nearly irreversible"; Type 2 "can and should be made quickly"); the 70% line not found in the letter fetched -> secondary

- id: P33
  name: Pre-mortem block ("assume it failed; why")
  origin: Gary Klein, "Performing a Project Premortem", HBR Sept 2007
  problem: confirmation bias on the recommended option
  objectives: [X2, D5]
  data_required: failure_stories[{cause, likelihood_band, early_signal, mitigation, owner}] (agent-authored), prompt for reviewer to add one
  html_feasibility: low
  interaction: reviewer reads 3-5 failure causes, ranks them or adds one; verdict per cause: accept risk / mitigate / blocker
  injection_rule: decisions that are one-way or costly, or recommendation confidence <= moderate
  anti_use: reversible low-cost decisions (noise)
  evidence: secondary (HBR article not retrievable; method described via several summaries; 30% prospective-hindsight claim is Klein's citation of a 1989 study)

- id: P34
  name: Default-if-no-answer and decision deadline
  origin: DACI (due date, single Approver, outcome recorded) - https://www.atlassian.com/team-playbook/plays/daci ; type 2 speed principle (P32)
  problem: decision stalls; agent blocked waiting
  objectives: [X2, G1, G4]
  data_required: deadline, default_option, default_consequence, who_is_approver
  html_feasibility: low
  interaction: header line "If no answer by <date>, the agent will do <default> (reversible: yes/no)"
  injection_rule: any decision where agent can proceed on a default and the choice is two-way
  anti_use: one-way decisions: no silent default; state "blocked until answered"
  evidence: primary for due date/Approver; "default if no answer" convention is my synthesis -> unverified as a published pattern

- id: P35
  name: Decision journal record (prediction + confidence + review date)
  origin: decision journaling (Annie Duke, Thinking in Bets, secondary sources) ; MADR Confirmation section
  problem: no way to check the call later; outcome bias
  objectives: [X2, X3]
  data_required: decision, expected_outcome, confidence_pct, what_would_change_my_mind, review_date, how_to_confirm
  html_feasibility: low (export fields into the JSON)
  interaction: reviewer fills one-line expectation and review date on one-way decisions
  injection_rule: one-way decisions only; optional otherwise
  anti_use: routine decisions
  evidence: secondary (exact Duke template fields not confirmed; MADR Confirmation = how compliance will be checked, primary)
```

# 2. matrix

```yaml
G1_ask:
  - [P15, "SBAR recommendation line states the ask; P15 header read in 30s"]
  - [P17, "read/decide time estimate sets expectation"]
  - [P06, "agent questions listed with options and defaults at top"]
G2_context:
  - [P02, "key/value summary of objective, audience, mandate, sources"]
  - [P16, "goals, success criteria and out-of-scope list tie verdicts to objective"]
  - [P11, "sources and long rationale one click away"]
G3_progress_unseen:
  - [P03, "user-declared section completion, not inferred"]
  - [P08, "sticky counter answered/total, unresolved"]
  - [P12, "export-time error summary links to unanswered blocks"]
G4_round2:
  - [P09, "ledger of previous comments: addressed/answered/pending/declined"]
  - [P07, "clean view with margin bars, changes toggle"]
  - [P10, "single banner for what changed the review"]
G5_provenance_freshness:
  - [P28, "source, date, rank, deprecated values struck"]
  - [P27, "certainty badge with reasons"]
  - [P10, "one banner when a source is stale"]
G6_response_types:
  - [P04, "typed verdict with mandatory comment on non-ok"]
  - [P05, "text-quote anchor for pinpoint comments (optional layer)"]
  - [P01, "recap with Change links before export"]
D1_objectives_audience:
  - [P16, "objective-first brief, out-of-scope"]
  - [P02, "audience/mandate rows"]
  - [P15, "background line"]
D2_key_claims_figures_changed:
  - [P07, "word-level redline of changed figures"]
  - [P26, "claim - evidence - defeaters"]
  - [P27, "certainty badge per figure"]
D3_decided_vs_open:
  - [P29, "decided/open/superseded ledger, open first"]
  - [P06, "open questions as queries with options"]
  - [P28, "rank preferred/deprecated for superseded values"]
D5_risks:
  - [P33, "pre-mortem failure causes with early signals"]
  - [P26, "open defeaters listed first"]
  - [P13, "warning callout on irreversible items"]
C1_big_picture:
  - [P15, "situation/background/assessment frame outside the diff"]
  - [P13, "flag blast radius and irreversible changes"]
  - [P24, "mandate rows place the change within the ask"]
C4_conformity_vs_mandate:
  - [P24, "requirement - status - evidence - deviation"]
  - [P23, "requirements with no test or no change flagged"]
  - [P18, "killer-item Do-Confirm before approval"]
T1_steps_expected_copy:
  - [P20, "Given/When/Then with Examples table"]
  - [P21, "copy button with insecure-context fallback"]
  - [P19, "ordered step runner for dependent steps"]
T2_pass_fail_blocked:
  - [P22, "6-status set, note required on fail/blocked, stacked bar"]
  - [P19, "failed step stops run, skip needs reason"]
  - [P18, "pre-run checklist of preconditions"]
T3_coverage:
  - [P23, "requirement x test matrix with gaps"]
  - [P22, "untested count visible"]
  - [P03, "section completion for plan-level coverage"]
X1_options_compared:
  - [P30, "criteria table or per-option cards, do-nothing included"]
  - [P11, "pros/cons detail collapsed"]
  - [P29, "status of each option: chosen/rejected/open"]
X2_heuristics:
  - [P32, "one-way/two-way badge sets gates"]
  - [P33, "pre-mortem"]
  - [P34, "default if no answer + deadline"]
X3_recommendation_confidence:
  - [P31, "recommendation with likelihood range, separate confidence, assumptions, what would change my mind"]
  - [P35, "journal record: expectation, confidence, review date"]
  - [P27, "evidence certainty behind the recommendation"]
```

# 3. gaps

```yaml
gaps:
  - id: unverified_sources
    detail: Kent and ICD 203 PDFs not parsable by the fetch tool; WHO checklist manual, Klein HBR article, Duke template, Boorman text, TestRail progress-bar logic, Figma resolve behaviour, Assurance 2.0 full papers were not read. Entries marked secondary/unverified accordingly.
  - id: phone_selection_UX
    detail: P05 text selection on phones not tested; fallback = generator-assigned sentence/row ids.
  - id: cross_round_anchor_stability
    detail: no primary source on keeping comment anchors valid after text edits beyond W3C selectors (quote+prefix+suffix); decide whether round 2 carries a block-id mapping table.
  - id: reviewer_fatigue_metrics
    detail: no evidence found for optimal verdict-control count, tap targets, or default collapse thresholds in review forms; values in this brief are heuristics.
  - id: accessibility_testing
    detail: GOV.UK rules cover hidden link text, focus, role=alert; no check done for dark-mode contrast or colour-blind status tags. Use text + shape with every colour.
  - id: persistence_and_export
    detail: localStorage persistence, Blob download, file:// vs http behaviour, JSON schema versioning not researched (engineering, outside axis B).
  - id: no_primary_source_for
    detail: [coverage matrix P23, default-if-no-answer P34, round-2 ledger P09 as a composite, mandate table P24 as a composite]
  - id: not_covered_by_design
    detail: charts/diagram grammars (other agent); rating scales beyond 4 verdicts; multi-reviewer consensus (single reviewer assumed); voice or dictation input.
```
