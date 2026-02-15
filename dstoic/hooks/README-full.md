# 📚 Hooks — Full Documentation

> ⚠️ **Live experiment.** Highly personalized—adapt to your setup.

## 🎯 Overview

| Hook | Purpose | Why | Trigger | Requires |
|------|---------|-----|---------|----------|
| 🖥️ `notify-tmux.sh` | Visual tmux window notifications | Know when the agent needs you vs working autonomously | Multiple | tmux |
| 📝 `retrospect-capture.sh` | Auto-log session events | Reflect on AI-human collab per project — beyond execution-centric Agile retros | Multiple | bash, jq |
| 📤 `dump-output.sh` | Debug artifacts on stop | Review agent output later without scrolling back | Stop | bash, jq |
| 🔄 `list-context-sync.sh` | Daily context sync + git notify | Stop wasting session starts on manual housekeeping | SessionStart | bash, jq, claude CLI |

```mermaid
flowchart LR
    subgraph S1["SessionStart"]
        A1["🖥️ notify-tmux"]
        A2["📝 retrospect-capture"]
        A3["🔄 list-context-sync"]
    end

    subgraph S2["During Session"]
        B1["🖥️ notify-tmux"]
        B2["📝 retrospect-capture"]
    end

    subgraph S3["Stop / End"]
        C1["📤 dump-output"]
        C2["🖥️ notify-tmux"]
        C3["📝 retrospect-capture"]
    end

    S1 --> S2 --> S3

    classDef hook fill:#E8F4FD,stroke:#4A90D9,color:#000
    classDef phase fill:#F0F0F0,stroke:#999,color:#000
    class A1,A2,A3,B1,B2,C1,C2,C3 hook
```

---

## 🖥️ notify-tmux.sh

Context-aware tmux window notification with double emoji prefixes (🤖 + status).

### 🔄 States

```mermaid
flowchart TD
    IDLE["(no emoji)<br/>No session"] -->|session_start| UNFOCUSED["🤖✏️ / 🤖🧪 / 🤖🔍<br/>Working autonomously"]
    UNFOCUSED -->|pane_focus| FOCUSED["🤖<br/>Working, you're watching"]
    FOCUSED -->|pane_blur| UNFOCUSED
    UNFOCUSED -->|ask_user| ALERT["🤖🚨<br/>Needs you!"]
    ALERT -->|user_responds| UNFOCUSED
    UNFOCUSED -->|stop| DONE["🤖✅<br/>Done"]
    FOCUSED -->|stop| DONE

    classDef idle fill:#F0F0F0,stroke:#999,color:#000
    classDef active fill:#90EE90,stroke:#333,color:#000
    classDef focused fill:#E8F4FD,stroke:#4A90D9,color:#000
    classDef alert fill:#FFB3B3,stroke:#CC0000,color:#000
    classDef done fill:#DDA0DD,stroke:#800080,color:#000
    class IDLE idle
    class UNFOCUSED active
    class FOCUSED focused
    class ALERT alert
    class DONE done
```

| Tmux Display | Meaning | Tool Emojis |
|-------------|---------|-------------|
| *(none)* | No active session | — |
| 🤖✏️ | Writing/editing files | Edit, Write |
| 🤖🧪 | Running tests | Bash (test) |
| 🤖🔍 | Searching/reading code | Grep, Glob, Read |
| 🤖⚙️ | Running commands | Bash |
| 🤖🌐 | Web fetch | WebFetch, WebSearch |
| 🤖💭 | Thinking/subagent | Task |
| 🤖🚨 | **Needs your input** | AskUserQuestion |
| 🤖✅ | **Done** | — |

Focus-aware: tool emoji hidden when pane is focused (you're already watching).

---

## 📝 retrospect-capture.sh

Captures all 10 Claude Code lifecycle events to `.retro/sessions/.staging/{session-id}.jsonl` for later analysis with `/retrospect-*` skills.

| Event | When |
|-------|------|
| `SessionStart` | 🎬 Session begins |
| `SessionEnd` | 🏁 Session ends (finalizes to YAML) |
| `UserPromptSubmit` | 💬 User sends message |
| `PreToolUse` / `PostToolUse` | 🔧 Tool execution |
| `PermissionRequest` | 🔐 Permission asked |
| `Stop` / `SubagentStop` | 🛑 Execution stops |
| `PreCompact` | 📦 Before compaction |
| `Notification` | 🔔 System notification |

---

## 📤 dump-output.sh

Dumps Claude's last output to `$CLAUDE_PROJECT_DIR/.dump/{timestamp}.md` on Stop event. Toggle-controlled — only active when `.dump/.enabled` exists. Use `/dump-output` skill to toggle.

**Safety**: Checks `stop_hook_active` to prevent infinite loops, sleeps 0.5s for transcript flush.

---

## 🔄 list-context-sync.sh

Opportunistic daily maintenance on session start. Praxis-only (exits immediately for other projects).

```mermaid
flowchart TD
    A["SessionStart"] --> B{"CWD contains<br/>'praxis'?"}
    B -->|No| X["exit 0"]
    B -->|Yes| C{"Synced<br/>today?"}
    C -->|Yes| D["Skip"]
    C -->|No| E["🔄 claude -p '/list-contexts --sync'<br/>(async background)"]
    E --> F["Touch date marker"]
    D --> G{"Unpushed<br/>commits?"}
    F --> G
    G -->|No| H["✅ Done"]
    G -->|Yes| I["⚠️ Warn on stderr<br/>(never auto-push)"]
    I --> H

    classDef action fill:#90EE90,stroke:#333,color:#000
    classDef check fill:#FFE4B5,stroke:#333,color:#000
    classDef skip fill:#F0F0F0,stroke:#999,color:#000
    class E,I action
    class B,C,G check
    class X,D skip
```

**State**: `{git_root}/.tmp/list-context-sync/{YYYYMMDD}-context-sync` marker prevents re-runs. Auto-cleaned after 2 days.

**Log**: `{git_root}/.tmp/list-context-sync.log`

---

## ⚙️ Configuration

All hooks configured in `hooks.json`. Edit to enable/disable specific hooks.

## ⚠️ Known Limitations

- 🟣 COMPLETED tmux state persists after Claude exits (no cleanup trigger)
- ✅ Workaround: acceptable for most use cases
