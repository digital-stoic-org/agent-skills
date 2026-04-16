# 🪝 Phase 2: Intercept — Runtime Hooks & MCP Integrity

The second line of defense. Where Phase 1 blocks known-bad paths statically, Phase 2 inspects behavior at runtime — what's being written, what's being executed, what's coming back.

## Why hooks, not just permissions?

Permissions are pattern-matching on tool names and arguments. They answer "is this tool allowed?" but not "is what this tool is doing dangerous?" A `Write` call to `config.yaml` is permitted — but if the content contains `ignore previous instructions`, that's prompt injection. Permissions can't see content. Hooks can.

The five hooks cover distinct attack surfaces:

## The five scripts

### Dangerous actions blocker 💥

The blunt instrument. Catches destructive Bash commands that should never run unreviewed: recursive deletes on root paths, database drops, force pushes to main, disk overwrites.

Also catches **nested injection** — `$(rm -rf /)` hiding inside an otherwise-innocent command. This is the vector that static deny lists miss entirely.

**The hard part**: Distinguishing `rm -rf /` (catastrophic) from `rm -rf node_modules/` (routine cleanup). Scope matters. The hook must parse targets, not just keywords.

### Prompt injection detector 🎭

Content-level defense. Scans Edit/Write payloads for patterns that try to override Claude's instructions: role hijacking, jailbreak phrases, authority impersonation, suspicious base64 blobs.

**The tension**: Code files legitimately contain strings like `"system:"` or base64 encoding. The hook must be context-aware — a `.py` file with base64 is normal; a `.md` file with a 500-char base64 blob is suspicious.

### Unicode injection scanner 👁️

The invisible threat. Zero-width characters, RTL overrides, and homoglyphs can make code appear safe to human review while executing something entirely different. A variable named with a Cyrillic 'а' instead of Latin 'a' passes code review but references a different binding.

**Scoped carefully**: i18n/l10n files legitimately contain unusual Unicode. The hook checks file type before flagging.

### Output secrets scanner 🔍

Post-execution defense. After a Bash command runs, scan stdout for leaked credentials — AWS keys, GitHub tokens, database URLs with embedded passwords. 

**Warn, don't block.** By the time output exists, the command already ran. Blocking the output doesn't unrun it. The goal is alerting the user to rotate exposed credentials immediately.

### MCP integrity checker 🔐

Session-start verification. Hash the MCP config file and compare against a known-good baseline. If the hash changes — whether from a rug pull, a malicious repo's `.claude/` override, or an accidental edit — the user is warned before the session proceeds.

**Bootstrap**: First run stores the hash. The user must verify MCP config is clean before that first run.

## Infrastructure & dependency locks

Beyond hooks, Phase 2 adds `permissions.deny` patterns for infrastructure files (Dockerfiles, CI workflows, Terraform, k8s manifests) and dependency installation commands. These are high-blast-radius operations that should always require human review.

## Review questions

1. **Are the dangerous-actions patterns too narrow?** The hook blocks `rm -rf /` but what about `rm -rf $HOME`? Variable expansion makes pattern matching fragile. How far do we go?
2. **Will prompt injection detection trigger on security documentation?** This very folder contains examples of injection patterns. The hook needs to handle meta-examples.
3. **Is warn-only sufficient for output scanning?** The secret is already in Claude's context window. Can it be exfiltrated in a follow-up prompt? (Yes, theoretically — but blocking output doesn't prevent that.)
4. **MCP hash — what's the rotation story?** Legitimate MCP config changes require re-baselining the hash. Is the process frictionless enough to not be skipped?

## Prerequisites

Phase 1 (perimeter) must be applied and smoke-tested. Hooks are defense-in-depth — they don't replace permissions.

→ Exact patterns, hook registration, and test commands: [intercept-brief-llm.md](intercept-brief-llm.md)
