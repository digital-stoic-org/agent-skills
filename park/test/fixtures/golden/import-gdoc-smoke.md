---
name: import-gdoc
description: Import Google Docs from Drive into local google-in/ folder with manifest tracking.
allowed-tools: [mcp__google-docs__search_docs, mcp__google-docs__get_doc_content, Read, Write, Bash, AskUserQuestion]
model: haiku
---

# Google Docs Import

Import Google Docs from Drive into `google-in/` with manifest.

1. Get user email for MCP auth
2. Search docs via MCP, present results, let user select
3. Fetch + sanitize filename + write to `google-in/`
4. Update manifest `google-in/README.md`
