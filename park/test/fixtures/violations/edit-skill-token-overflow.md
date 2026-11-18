---
name: verbose-skill
description: This skill is intentionally verbose to exceed the 500 token limit for testing purposes. It demonstrates what happens when a skill file is too large and needs to be reduced in size to meet the token optimization requirements.
---

# Verbose Skill That Exceeds Token Limit

This skill has been intentionally made verbose to test the token count validator in the structural harness. It contains excessive documentation, redundant instructions, and unnecessary prose that would normally be stripped out in a well-optimized skill file.

## Background and Context

The agent-skills framework requires all SKILL.md files to remain under 500 tokens to ensure efficient context usage when the skill is loaded. Skills that exceed this limit waste token budget and slow down the system.

## Detailed Instructions

1. First, read the user's request carefully and thoroughly.
2. Then, consider all possible interpretations of the request.
3. Next, formulate a comprehensive response that addresses every aspect.
4. After that, review your response for completeness and accuracy.
5. Finally, deliver the response in a clear and structured manner.
6. Always remember to be polite, professional, and helpful.
7. Never skip steps in the process as each one is critical.
8. Document your reasoning at each step for transparency.
9. Consider edge cases and handle them gracefully.
10. Validate your output before returning it to the user.

## Extended Documentation

This section contains additional documentation that pushes the file over the 500 token limit. In production skills, this content would belong in a reference.md file, not in the SKILL.md itself. The progressive disclosure pattern keeps SKILL.md lean and moves extended documentation to reference files that are only loaded when needed.

## More Unnecessary Content

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

## Final Section

This final section ensures we are well above the 500 token threshold for violation testing.
