stream: agent-skills
saved: 2026-10-22T14:50:10.698Z 7b5bce8c-5d9a-4107-93ce-0401441a41a4
status: brainstorm
previous_session: none
goal: Create a new PUBLIC Claude Code plugin in the agent-skills marketplace that makes the Context 101 deck's concepts actionable on the Run & cost angle, feeding Mat's personal branding (a branding page comes later)
journal: journal/agent-skills.md
journal_cursor: c00

read_first:
- /home/mat/dev/agent-skills/stoa/README.md — base to port (pack, auto mode, zones)
- /home/mat/dev/praxis/projects/personal-branding/ANCHOR-2026-07-28.md — canonical positioning, phrase-rule, differentiators
read_if_needed:
- /home/mat/dev/agent-skills/stoa/hooks/pack.tsx — port source: zones :40-49, onMeasure :1154, hardSave :1106, autoTrigger :1250, autoPack :1204, UNPACK_RULES :53, re-inject :1631
- /home/mat/dev/agent-skills/stoa/.claude-plugin/types/claude-code/index.d.ts — mods host API (621K, grep only): $.state :3358, prompt.* :2944, session.append, turn.step, tool.check, session.compact
- /home/mat/dev/praxis/projects/slasheo/ai-school-tech/wip/context-101/20-deck.html — deck, source of truth; never read whole: /usr/bin/grep -n 'data-slide-num'; gestures H:1179-1188, cost H:890-935, relay H:977-1052, scopes H:1153-1170
- /home/mat/dev/praxis/projects/slasheo/ai-school-tech/wip/context-101/slides/verif-table-cout.md — cost figures + doubts, before any bill estimator
- /home/mat/dev/praxis/projects/personal-branding/CLAUDE.md — kill list + hard constraints, before writing any public text
- /home/mat/dev/praxis/projects/personal-branding/DIFFERENCIATION-marche-FR-2026-07-28.md — why context engineering is occupied, lines 61-63,127
- /home/mat/dev/agent-skills/team/skills/relay/SKILL.md — publishable relay text, no private deps
- /home/mat/dev/agent-skills/dstoic/scripts/statusline.sh — context % computed right (current_usage); /praxis branches l.165-192 to strip
- /home/mat/dev/agent-skills/dstoic/skills/instruct-compact/SKILL.md — near-public compact steering
deliverable: none yet — new plugin dir /home/mat/dev/agent-skills/<name>/ + entry in /home/mat/dev/agent-skills/.claude-plugin/marketplace.json, once the name is chosen
decisions:
- Angle = Run & bill (compte-tours, réservoir, relay, bill estimator) — context engineering occupied in FR (AI-Driven Dev); Dumb Zone/context firewall/R→P→I are third-party (Dex Horthy/HumanLayer), cite with attribution, not signature; Mat chose it
- Language = EN code + README, FR + EN docs — public repo EN, deck/Slasheo audience FR; Mat chose it
- Tech base = mods only, port of stoa — Mat's choice; requires Claude Code 2.1.275+, state it at the top of the README
- Home = agent-skills marketplace (public, MIT, 20 stars, builder proof) — default, not contested
learnings:
- Mods in one plugin talk via plain TS imports (register.ts order = hook order); cross-plugin via $.state + on('state.set', {plugin,key}); $.store private — index.d.ts :3358-3423
- Mid-turn guidance channels: session.append hook door 'tool-result', classic.PostToolUse additionalContext, $.session.append user row, tool.check deny, turn.step own response / $.turn.abort; prompt.section busts the cache — index.d.ts
- The model does not know its context %: inject the number; guidance = finish step, write ckpt trailer, end the turn (turn-end auto pack fires)
- Full-auto blockers in stoa: UNPACK_RULES "Do nothing without my explicit go" pack.tsx:53; auto with no stream only advises
- tack waits for a hardAt seam from pack: stoa/hooks/tack-core.ts:569, tack.ts:62
- Publish blockers: private paths (/praxis, /repos, /home/mat, PRAXIS_DIR: dstoic 9 files, stoa 2), ckpt trailer rule not shipped (CLAUDE.md.example:34-36), stoa README = internal changelog, no per-plugin LICENSE
- Deck vocabulary: « jauge »/« température » banned (compte-tours); réservoir = forfait; « Dumb Zone »/« smart zone 40-60 % » kept EN; vouvoiement; no invented numbers
- Mat's signature concepts: Ferrari/copilote/carnet H:618; compte-tours ≠ réservoir; « la fenêtre change la facture, pas le modèle », Opus+relay 9 $ < Sonnet 14 $ H:910; context.md 7 sections; 3-scope sorting; NBvNR
- Branding constraints: kill list (AI-first/augmented/native, drive/leverage/unlock, trainer framing), silence on Humanomy, no Homo Promptus framework, no BNPP detail, .net canonical + .io→.net redirect before publishing — personal-branding/CLAUDE.md, facts.md:24,58
- rtk wrapper breaks grep/ls/find flags: use /usr/bin/grep, /usr/bin/find, /usr/bin/sed
- Name collision check: no Claude Code plugin named stint/pitstop/pitwall; rchaz/git-stint (35★, "Session-scoped change tracking for AI coding agents") shares niche + metaphor — gh search repos "stint" --limit 8
discarded:
- « gauge » as name — « jauge » banned in deck vocabulary
- Generic context-engineering positioning — occupied terrain, third-party concepts
in_progress:
- Name: Mat likes « stint » but fears it is not known enough; I recommended keeping stint (ownable, says Run) carried by known words: /pit = relay, « redline » = red zone, tagline « Run your agent in stints. Pit before the redline. »; alternatives pitwall or stintlab; waiting for Mat's go
next:
- Get Mat's go on the name (stint or alternative), then check Claude Code plugin marketplaces for the final name
- Draft the action plan: MVP = deck gestures → features (statusline 40/60/83 + réservoir, auto relay with auto-resume UNPACK_RULES variant, delegation nudge on big reads, 3-scope sorting skill, extension audit, bill estimator with/without relay), measure split into its own mod consumed by pack and tack
- Verify cache pricing (claude-api skill) before building the bill estimator
- Live probe before the guidance ladder: session.append mid-turn and tool-result rewrite seen by the model at the next step
unknowns:
- Final plugin name (stint pending Mat's go)
- Whether Mat adopts the measure-mod split and the guidance ladder (50/60-65/70/85/95 %) — proposed, not decided
- Mid-turn injection channels never tested live
- Target audience not reconciled: ANCHOR (doers/builders) vs pack 09/10 (founders/business owners with P&L)
- Cache pricing contradictions threaten « Opus 9 $ < Sonnet 14 $ » and ÷12,5 (deck journal c18, c20)
- Public proof or product; branding page prerequisite (.net site + redirect) not done
- Uncommitted changes in /home/mat/dev/agent-skills (stoa tack files, toolsmith edits, dstoic pick-workflow) are not from this stream
stale:
