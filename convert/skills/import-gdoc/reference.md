# import-gdoc Reference

## Manifest Format (google-in/README.md)

```markdown
# Google Docs Import Manifest

Last updated: 2025-12-15T14:30:45Z

## Imported Documents

| Name | Last Import | Google Drive Link | File ID |
|------|-------------|-------------------|---------|
| Product Requirements Doc | 2025-12-15T14:30:45Z | [Open in Drive](https://docs.google.com/document/d/abc123/edit) | abc123 |

---

*🔄 Re-run /import-gdoc to update local copies with latest content.*
```

**Rules**: Sort by Last Import DESC, ISO 8601 timestamps, preserve existing entries.

## Filename Sanitization

- Lowercase the document name
- Replace non-alphanumeric chars with hyphens
- Trim edge hyphens, max 100 characters
- Add `.md` extension

Examples:
- "Product Requirements Doc" → `product-requirements-doc.md`
- "2024 Q4 Planning (DRAFT)" → `2024-q4-planning-draft.md`
- "Tech Spec: Auth & API" → `tech-spec-auth-api.md`

## Duplicate Handling

- Same filename + same file ID → UPDATE (overwrite content, update timestamp)
- Same filename + different file ID → APPEND suffix (`-2.md`, `-3.md`)

## Error Handling

| Error | Action |
|-------|--------|
| Auth errors | Ask user to verify email and MCP configuration |
| Permission denied | Skip doc, show warning, continue with others |
| Network errors | Show error, ask to retry |
| No docs found | Suggest refining search query |

## Edge Cases

- **Large documents**: Show progress indicator if >2s
- **Special characters**: Strip all non-alphanumeric except hyphens
- **Google Sheets/Slides**: Skip non-Doc files with warning
- **Empty documents**: Import anyway (0 bytes), note in summary

## Key Principles

- ✅ Fail fast on critical errors (no email, no MCP access)
- ✅ Visual feedback with emojis
- ✅ Atomic operations: update manifest after each successful import
- ✅ Never delete existing manifest entries
- This command does NOT track google-in/ in git by default
