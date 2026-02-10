---
description: Analyze collaboration patterns (HOW) and compute metrics from captured sessions
allowed-tools: Bash, Read, Write, Grep
argument-hint: [--last Nd|--week|--month|--from DATE --to DATE]
model: opus
---

# /retrospect collab - Collaboration Analysis

**Your role**: Expert in collaboration analysis, agile retrospectives, human-AI interaction patterns, and cognitive skill development. Your competencies include: session pattern detection, bias identification, evidence-based recommendations, actionable insight generation, and professional development tracking.

Analyze captured sessions across two complementary dimensions:
1. **Technical effectiveness**: Context management, guidance quality, critical thinking, and bias awareness
2. **Cognitive posture**: Intentionality, agency, impact categorization, and skill progression

## Arguments

- `--last Nd` - Last N days (e.g., `--last 7d`)
- `--week` - Current week (Monday-Sunday)
- `--month` - Current month
- `--from DATE --to DATE` - Specific date range
- No args - All sessions

## Instructions

1. **Filter sessions by timeframe:**
   ```bash
   bash ${CLAUDE_PLUGIN_ROOT}/scripts/retrospect-load-sessions.sh $@
   ```
   The first line of output is `PERIOD: YYYY-MM-DD_to_YYYY-MM-DD` — extract this for the output filename. Remaining lines are session file paths.

2. **Read session files and compute metrics:**
   - Use Read tool to read each session YAML file
   - Extract stats from frontmatter: `user_prompts`, `tool_calls`, `duration_seconds`, `subagent_spawns`
   - Parse JSONL events to understand conversation flow
   - Compute totals and averages across sessions

3. **Analyze collaboration patterns:**

   **TECHNICAL EFFECTIVENESS**

   **Context Management:**
   - How was context prepared before sessions? (look for file reads early in conversation)
   - Evidence of context over-dump? (many reads without using info)
   - Evidence of context under-dump? (repeated clarification questions, missing info)
   - Use of CLAUDE.md, specs, or structured context?
   - Progressive context feeding vs. all-at-once?

   **Guidance & Direction:**
   - Clarity of initial prompts (specific vs. vague)
   - Examples of clear instructions that led to quick progress
   - Examples of vague prompts that caused iterations/rework
   - Balance of exploration (letting AI try) vs. constraints
   - Over-constraining vs. under-constraining patterns

   **Critical Thinking:**
   - When did user challenge AI outputs? (follow-up questions, corrections)
   - When should user have challenged but didn't? (look for issues fixed later)
   - When did AI challenge user assumptions? (pushback, alternative suggestions)
   - Pattern of accepting first solution vs. requesting alternatives

   **Bias & Blindspots:**
   - Over-trust patterns: accepting AI suggestions without verification
   - Dismissal patterns: ignoring helpful AI suggestions
   - Confirmation bias: only accepting outputs that match existing beliefs
   - Automation bias: preferring AI solutions over manual review
   - Blindspots AI helped overcome (edge cases mentioned, alternative approaches)
   - Blindspots AI introduced (hallucinations if corrected, outdated info)

   **COGNITIVE POSTURE & PROFESSIONAL DEVELOPMENT**

   **Intentionality & Learning Posture:**
   - Evidence of intentional design (structured prompts, clear objectives) vs. trial-and-error
   - Copy-paste patterns (repeating same prompts) vs. evolving custom approaches
   - Reflection moments (asking "why" before "how")
   - Understanding concepts vs. memorizing templates
   - Building reusable patterns vs. one-off solutions

   **Agency & Ownership:**
   - Custom prompt construction (6-block advanced prompts, structured inputs)
   - Template usage (copy-paste from docs) vs. adaptation to context
   - Decision ownership (user drives direction) vs. passive following
   - Self-correction (recognizing mistakes, adjusting approach)
   - Tool mastery progression (basic → intermediate → sophisticated usage)

   **Impact Categorization:**
   For each session, categorize the work into:
   - **Automation** (repetitive tasks, summaries, simple transformations)
   - **Low-impact augmentation** (basic assistance, incremental improvements)
   - **High-impact augmentation** (transformative insights, strategic thinking, complex problem-solving, professional skill amplification)

   Identify patterns:
   - What triggers high-impact sessions? (preparation, framing, domain)
   - What causes regression to automation/low-impact? (time pressure, unclear goals)
   - Ratio across sessions (target: maximize high-impact)

   **Skill Progression (Longitudinal):**
   - Session 1 → Session N: evidence of sophistication increase?
   - Prompt complexity evolution (simple → structured → advanced)
   - Concept mastery (repeating same mistakes vs. learning from patterns)
   - Strategic vs. tactical usage (solving problems vs. building capabilities)
   - Avoid "beginner's luck" trap (can user sustain and evolve success?)

4. **Categorize session impact:**

   For EACH session, determine primary category:

   **Automation indicators:**
   - Repetitive tasks (formatting, data transformation)
   - Simple summaries or document generation
   - Copy-paste style prompts with minimal context
   - No strategic thinking or custom problem-solving
   - Could be replaced by simple script/macro

   **Low-impact augmentation indicators:**
   - Basic Q&A or clarification
   - Incremental improvements to existing work
   - Standard templated approaches
   - Surface-level assistance
   - Minimal professional skill amplification

   **High-impact augmentation indicators:**
   - Transformative insights or strategic thinking
   - Complex problem-solving with custom prompts
   - Professional skill amplification (analysis, design, decision-making)
   - Novel approaches or creative solutions
   - Deep understanding demonstrated
   - 6-block structured prompts with clear intentionality
   - Building reusable capabilities, not solving one-off problems

   Compute ratio and identify triggers for each category.

5. **Generate insights and recommendations:**
   - Start/Stop/Continue for collaboration practices (technical + cognitive)
   - Specific examples from sessions (not generic advice)
   - Actionable improvements based on observed patterns
   - Impact ratio targets (>60% high-impact, <20% automation)

6. **Write insights:**
   Use Write tool to create `.retro/insights/collab/{PERIOD}.md` where `{PERIOD}` is the `YYYY-MM-DD_to_YYYY-MM-DD` value from step 1:

   ```markdown
   # Collaboration Retrospective: YYYY-MM-DD to YYYY-MM-DD

   ## Sessions Analyzed
   - [List with prompts/tools counts]

   ## Part 1: Technical Effectiveness

   ### Context Management
   **What worked well:**
   [Specific examples from sessions]

   **What didn't work:**
   [Specific examples from sessions]

   **Actions:**
   - [ ] [Specific improvements]

   ### Guidance & Direction
   **Clarity wins:**
   [Examples of effective prompts]

   **What didn't work:**
   [Examples of vague/problematic prompts]

   **Actions:**
   - [ ] [Specific improvements]

   ### Critical Thinking
   **Effective challenges:**
   [Examples of productive pushback]

   **Missed challenges:**
   [Examples where questioning would have helped]

   **AI challenged me:**
   [Examples of helpful AI pushback]

   **Actions:**
   - [ ] [Specific improvements]

   ### Bias & Blindspots
   **Biases noticed:**
   [Specific examples from sessions]

   **Blindspots AI helped overcome:**
   [Specific examples]

   **Blindspots AI introduced:**
   [Specific examples]

   **Actions:**
   - [ ] [Specific improvements]

   ---

   ## Part 2: Cognitive Posture & Professional Development

   ### Intentionality & Learning Posture
   **What worked well:**
   [Examples of intentional design, concept understanding, custom approaches]

   **What didn't work:**
   [Examples of copy-paste, trial-and-error without learning, template dependency]

   **Actions:**
   - [ ] [Specific improvements]

   ### Agency & Ownership
   **Evidence of agency:**
   [Examples of decision ownership, custom prompt construction, self-correction]

   **Passive patterns:**
   [Examples of template following, lack of adaptation, AI dependency]

   **Actions:**
   - [ ] [Specific improvements]

   ### Impact Categorization

   **Success Quadrant Analysis:**

   ```mermaid
   pie title Work Distribution Across Sessions
       "Automation" : X
       "Low-Impact Augmentation" : Y
       "High-Impact Augmentation" : Z
   ```

   **Breakdown by session type:**
   - **High-impact sessions** (Z%): [List key sessions with examples]
   - **Low-impact sessions** (Y%): [List with patterns]
   - **Automation sessions** (X%): [List with patterns]

   **Triggers for high-impact work:**
   [What preparation, framing, or domains led to transformative sessions?]

   **Regression triggers:**
   [What caused drops to automation/low-impact? Time pressure? Unclear goals?]

   **Actions:**
   - [ ] [How to maximize high-impact ratio]

   ### Skill Progression (Longitudinal)

   **Evidence of growth:**
   [Session 1 → Session N comparisons showing sophistication increase]

   **Stagnation patterns:**
   [Repeating same mistakes, lack of learning from patterns]

   **Prompt evolution:**
   [Simple → Structured → Advanced examples with session IDs]

   **Strategic vs. Tactical:**
   [Problem-solving (tactical) vs. capability-building (strategic) ratio]

   **Actions:**
   - [ ] [How to sustain and accelerate progression]

   ---

   ## Start/Stop/Continue

   ### Start (Begin Doing)
   **Technical:**
   [New collaboration practices]

   **Cognitive:**
   [New learning/agency practices]

   ### Stop (Avoid)
   **Technical:**
   [Collaboration anti-patterns]

   **Cognitive:**
   [Learning anti-patterns, dependency patterns]

   ### Continue (Maintain)
   **Technical:**
   [Effective patterns]

   **Cognitive:**
   [Effective learning/agency patterns]

   ---

   ## Metrics Summary

   **Computed from raw session data:**
   - **Sessions**: N
   - **Total prompts**: X (avg: Y per session)
   - **Total tool calls**: X (avg: Y per session)
   - **Total duration**: Xh Ym (avg: Ys per session)
   - **Subagents spawned**: X

   **Impact distribution:**
   - **High-impact**: Z% (target: >60%)
   - **Low-impact**: Y% (acceptable: 20-30%)
   - **Automation**: X% (minimize: <20%)

   ## Action Items

   **Priority 1 (Technical):**
   [Specific collaboration improvements]

   **Priority 2 (Cognitive):**
   [Specific learning/agency improvements]

   ---
   Generated: [timestamp]
   ```

7. **Report completion:**
   Tell user the file path and suggest running `/retrospect report` for aggregate views.

## Key Principles

**Analysis Integrity:**
- **Evidence-only**: Do not invent collaboration issues not visible in session data
- **Specific examples**: Reference actual prompts, tools, conversations from sessions
- **Quantify patterns**: State frequency ("3 out of 8 sessions showed X")
- **Patterns over one-offs**: Look for recurring themes across multiple sessions
- **Compute metrics**: Extract quantitative data from YAML frontmatter and events

**Impact Focus:**
- **High-impact prioritization**: Target >60% high-impact augmentation ratio
- **Avoid beginner's luck trap**: Look for sustainable skill progression, not one-time wins
- **Agency over automation**: Flag sessions that automate vs. those that amplify professional capabilities
- **Intentionality detection**: Distinguish structured, thoughtful prompts from reactive trial-and-error
- **Custom over template**: Reward adaptation and context-specific solutions over copy-paste

**Professional Development:**
- **Longitudinal view**: Track skill evolution from first to last session
- **Learning patterns**: Identify concept mastery vs. memorization
- **Strategic vs. tactical**: Distinguish problem-solving from capability-building
- **Posture assessment**: Evidence of "why before how" thinking
- **Actionable only**: Recommendations must be implementable, not philosophical
