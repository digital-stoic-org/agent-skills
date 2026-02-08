---
description: Import Google Docs from Drive into local google-in/ folder with manifest tracking
argument-hint: [search-query]
allowed-tools: mcp__google-docs__search_docs, mcp__google-docs__get_doc_content, mcp__google-docs__list_docs_in_folder, mcp__google-docs__search_drive_files, Read, Write, Bash, AskUserQuestion
model: haiku
---

# Google Docs Import Command

Import Google Docs from Google Drive into a local `google-in/` folder with automatic manifest tracking.

## Workflow

### 1. Get User Email 📧

**ALWAYS ask for the user's Google email first** (required for MCP authentication):

Use AskUserQuestion to ask: "What is your Google email address for Google Docs access?"

Store this as `USER_EMAIL` for all subsequent MCP tool calls.

### 2. Determine Search Strategy 🔍

Parse `$ARGUMENTS`:
- **No arguments**: Interactive mode - ask user what to search for
- **Has arguments**: Use `$ARGUMENTS` as search query

### 3. Search for Documents 📄

Use one of these MCP tools based on user input:
- `mcp__google-docs__search_docs` - Search by document name
- `mcp__google-docs__list_docs_in_folder` - List all docs in a folder (if user provides folder ID)
- `mcp__google-docs__search_drive_files` - Advanced Drive search with filters

Present results to user:
```
🔍 Found X documents:

  1. Document Name 1 (ID: abc123)
  2. Document Name 2 (ID: xyz789)
  3. ...

Which documents to import? (comma-separated numbers, 'all', or 'cancel'):
```

Use AskUserQuestion to get selection.

### 4. Setup Directory Structure 📁

Create if missing:
```bash
mkdir -p google-in
```

### 5. Import Documents 📥

For each selected document:

1. **Fetch content**:
   ```
   mcp__google-docs__get_doc_content(user_google_email=USER_EMAIL, document_id=DOC_ID)
   ```

2. **Sanitize filename**:
   - Lowercase the document name
   - Replace non-alphanumeric chars with hyphens
   - Trim edge hyphens
   - Max 100 characters
   - Add `.md` extension

   Examples:
   - "Product Requirements Doc" → `product-requirements-doc.md`
   - "2024 Q4 Planning (DRAFT)" → `2024-q4-planning-draft.md`
   - "Tech Spec: Auth & API" → `tech-spec-auth-api.md`

3. **Handle duplicates**:
   - If file exists with same name, check manifest for file ID
   - Same ID: UPDATE (overwrite content, update timestamp)
   - Different ID: APPEND suffix (`-2.md`, `-3.md`, etc.)

4. **Save locally**:
   ```bash
   Write to google-in/<sanitized-name>.md
   ```

5. **Show progress**:
   ```
   📥 Importing "Document Name"... ✅ done
   ```

### 6. Update Manifest 📋

Read existing `google-in/README.md` (if exists) and parse table.

Update/add entries with this format:

```markdown
# Google Docs Import Manifest

Last updated: 2025-12-15T14:30:45Z

## Imported Documents

| Name | Last Import | Google Drive Link | File ID |
|------|-------------|-------------------|---------|
| Product Requirements Doc | 2025-12-15T14:30:45Z | [Open in Drive](https://docs.google.com/document/d/abc123/edit) | abc123 |
| Technical Specification | 2025-12-15T09:15:22Z | [Open in Drive](https://docs.google.com/document/d/xyz789/edit) | xyz789 |

---

*💡 Tip: Click the Google Drive links to open the original documents in your browser.*
*🔄 Re-run /import-gdoc to update local copies with latest content.*
```

**Manifest rules**:
- Sort by "Last Import" DESC (most recent first)
- Use ISO 8601 timestamps (e.g., `2025-12-15T14:30:45Z`)
- Generate Drive URL: `https://docs.google.com/document/d/{FILE_ID}/edit`
- Preserve existing entries not updated in this session

### 7. Final Summary ✨

Report:
```
✨ Import complete!

📂 Files saved to: google-in/
📋 Manifest updated: google-in/README.md

Imported documents:
  • product-requirements-doc.md
  • technical-specification.md

🔄 Run /import-gdoc again to sync with latest Google Docs content.
```

## Error Handling 🚨

- **Auth errors**: Ask user to verify email and MCP configuration
- **Permission denied**: Skip doc, show warning, continue with others
- **Network errors**: Show error, ask to retry
- **No docs found**: Suggest refining search query

## Edge Cases

1. **Large documents**: Show progress indicator if import takes >2s
2. **Special characters in names**: Strip all non-alphanumeric except hyphens
3. **Google Sheets/Slides**: Skip non-Doc files with warning
4. **Empty documents**: Import anyway (0 bytes), note in summary

## Usage Examples

```bash
# Interactive mode (search + select)
/import-gdoc

# Search by query
/import-gdoc planning docs

# Search with multiple keywords
/import-gdoc Q4 roadmap product
```

## Key Principles

- ✅ **Fail fast**: Exit on critical errors (no email, no MCP access)
- ✅ **Trust exit codes**: If MCP tool succeeds, trust the result
- ✅ **Visual feedback**: Use emojis liberally (🔍📥✅❌📂📋)
- ✅ **Atomic operations**: Update manifest after each successful import
- ✅ **Preserve data**: Never delete existing manifest entries

## Notes

- This command does NOT track google-in/ in git by default
- User can add `google-in/` to `.gitignore` if docs are sensitive
- Re-running with same docs will UPDATE content (not duplicate)
- File IDs ensure we can detect same doc even if renamed in Drive
