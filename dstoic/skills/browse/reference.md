# Browse Reference

Full command reference for `agent-browser` CLI. Read on demand when you need specific command syntax.

## Commands

### open

```bash
agent-browser open <url>
```
Opens URL in headless browser. Must be called first. Returns when page is ready.

### snapshot

```bash
agent-browser snapshot -i
```
Returns accessibility tree text of current page. `-i` = inline (returns text directly, not saved to file). **Primary observation mode.**

### screenshot

```bash
agent-browser screenshot
```
Captures PNG of current page. Returns file path. Use for visual evidence only (opt-in).

### navigate

```bash
agent-browser navigate <url>
```
Navigates to a new URL within the same session (no need to `open` again).

### close

```bash
agent-browser close
```
Closes browser session. Always call after done to free resources.

### console

```bash
agent-browser console
```
Returns browser console logs (JS errors, warnings, info messages).

### network requests

```bash
agent-browser network requests
```
Returns list of network requests made by the page.

### errors

```bash
agent-browser errors
```
Returns page-level errors (load failures, unhandled exceptions).

---

## Multi-Page Navigation

Navigate naturally — no DSL required:

```bash
# Open initial page
agent-browser open https://example.com

# Snapshot to understand page structure
agent-browser snapshot -i

# Navigate to a subpage
agent-browser navigate https://example.com/about

# Snapshot again
agent-browser snapshot -i

# Collect diagnostics
agent-browser console
agent-browser network requests
agent-browser errors

# Close when done
agent-browser close
```

---

## Diagnostic Collection Pattern

Run after each `snapshot` for full observability:

```bash
agent-browser snapshot -i      # accessibility tree
agent-browser console          # JS console output
agent-browser network requests # HTTP requests
agent-browser errors           # page errors
```

---

## Security Notes

- Runs in headless mode — no visible browser window
- `localhost` URLs are trusted by default
- No cookies or auth tokens persist between `open/close` cycles
- External URLs are fetched as an anonymous client (no credentials)
