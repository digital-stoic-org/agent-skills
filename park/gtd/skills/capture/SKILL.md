---
name: capture
description: Quick capture to GTD inbox from CLI or natural language
context: subagent
allowed-tools: [Read, Edit]
model: haiku
user-invocable: true
argument-hint: <item>
---

# GTD Capture

Fast append to inbox. No priority, no routing — just capture.

## Steps

1. Take `$ARGUMENTS` as item text.
2. **Clean URLs** — if the item contains a URL, strip tracking params (see below).
3. Read `/praxis/gtd/01-inbox.md`. If missing → error (see below).
4. Find the `### New` section. If missing → error.
5. Insert with Edit, newest-first (after the header, before existing items):
   - old_string: `### New`
   - new_string: `### New\n- [ ] <cleaned item> [created:: TODAY]`
   - `TODAY` = today's date as `YYYY-MM-DD`.
6. Report: `Captured: <item>`.

**Example** — capture "buy milk" on 2026-05-23:
```
### New
- [ ] buy milk [created:: 2026-05-23]
- [ ] existing item [created:: 2026-05-20]
```

## URL Cleaning

If the item contains a URL, strip these query params (case-insensitive key):

| Group | Params |
|-------|--------|
| Analytics | `utm_*` (any `utm_`-prefixed key) |
| Ad/click IDs | `fbclid` `gclid` `gbraid` `wbraid` `msclkid` `dclid` `yclid` `twclid` `ttclid` |
| Email/marketing | `mc_eid` `mc_cid` `_hsenc` `_hsmi` `vero_id` `vero_conv` `oly_anon_id` `oly_enc_id` `mkt_tok` |
| Social/referral | `igshid` `ref` `ref_src` `ref_url` `source` `spm` |
| Platform | `si` (YouTube/Spotify share token) `feature` (YouTube) |

Rules: remove only listed keys; **keep all other params** (`id` `q` `v` `page` `t`, etc.); drop a trailing `?` if no params remain; preserve path + `#fragment`; leave non-URL text untouched.

```
https://example.com/article?utm_source=nl&utm_medium=email&id=42&fbclid=abc
  → https://example.com/article?id=42

https://youtu.be/dQw4w9WgXcQ?si=Xy12&t=30
  → https://youtu.be/dQw4w9WgXcQ?t=30
```

## Triggers

- **Direct**: `/gtd:capture buy milk` · `/gtd:capture call John about project`
- **Natural language**: "add buy milk to inbox" · "capture: need to call John" · "inbox: review quarterly goals"

## Notes

- Append as-is — no flags, no parsing, no priority sorting (that's triage).
- Empty `### New` is fine. Preserve all other sections unchanged.

## Errors

- **File not found** → report, suggest checking vault path.
- **`### New` missing** → report, suggest running setup.
- **Edit fails** (concurrent modification) → report, ask user to retry.
