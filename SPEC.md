# GTDown Obsidian Plugin — Product Specification

## Overview

**GTDown** is an Obsidian plugin that brings a TaskPaper-style plain-text task editor to Obsidian. It opens `.gtd` files in a dedicated custom editor pane with rich editing, filtering, and organisation features powered by CodeMirror 6.

**Tech Stack:**
- React 19 + TypeScript
- CodeMirror 6 (uses Obsidian's bundled CM6 instance — all `@codemirror/*` packages are marked external)
- esbuild (CJS output, Obsidian standard)

**Obsidian Integration:**
- Custom view type (`gtdown-view`) registered via `registerView()`
- `.gtd` extension registered via `registerExtensions()`
- Extends `TextFileView` — Obsidian manages file read/write via `setViewData` / `getViewData`
- Auto-save via `requestSave()` on every document change
- Themes automatically via Obsidian CSS variables (light/dark/custom themes)

---

## File Format

GTDown uses `.gtd` files — plain text in TaskPaper format. The format is identical to the GTDown desktop app and is human-readable outside of Obsidian.

### Line Types

**Project Lines**
- Pattern: `^[^\t-].*:\s*$` — non-indented, ends with `:`, has content
- Examples: `Inbox:`, `Work:`, `Personal:`
- Rendered: bold, larger, with a bottom border

**Task Lines**
- Pattern: `^\s*- .*`
- Examples: `	- Write the spec @today`, `	- Fix bug @done`
- Completion: add `@done` tag → strikethrough + dimmed

**Note Lines**
- Any indented non-task, non-project line
- Rendered: smaller, muted colour

**Tags and Labels**
- `@tags` — contexts; styled blue
- `#labels` — categories; styled purple

### Sample Document

```
Inbox:
	- Write the spec @today
	- Review PR @high
	- Read the docs

Work:
	- Fix login bug @done
	- Deploy to staging @done
	- Update dependencies @today

Done:
```

---

## File Management

### Creating Files

**Command palette → "New GTDown file"**
Creates `Untitled.gtd` in the vault root (appends `-1`, `-2` etc. to avoid collisions), opens it in GTDownView.

### Importing Existing Files

**Command palette → "Import GTDown file"**
Opens a system file picker (no extension filter — macOS UTType system doesn't recognise `.gtd` natively). Validates that selected files end in `.gtd`; skips others with a notice. Reads content and creates a proper vault-indexed `.gtd` file via `vault.create()`, then opens it.

Filename collision detection checks both the vault registry and the filesystem (`vault.adapter.exists()`) to catch files that exist on disk but aren't indexed.

### Opening Files

Files in the vault with `.gtd` extension open in GTDownView when clicked in the file explorer. A `workspace.on("file-open")` listener with `setViewState` handles cases where `registerExtensions` routing doesn't apply (e.g. files Obsidian detected via the filesystem watcher before the plugin registered the extension).

### Saving

Saving is fully managed by Obsidian via `TextFileView`. The plugin calls `requestSave()` on every document change; Obsidian calls `getViewData()` to retrieve current content and writes it to disk.

---

## Editor

The editor is a CodeMirror 6 `EditorView` instance created inside the GTDownView React component. All GTDown CM6 extensions are used as-is.

### Visual Decorations

| Element | Style |
|---|---|
| Project header (`Project:`) | Bold, 1.1em, heading colour, bottom border |
| `@done` task | Strikethrough, 45% opacity |
| Note line | 0.85em, faint colour, indented 1.5ch to align with task text, tighter spacing above than below |
| `@tag` | Sky-blue, weight 500 |
| `#label` | Purple, weight 500 |
| `[[wikilink]]` | Obsidian link colour, underlined |

Decorations are suppressed on the cursor's current line to prevent flicker during editing.

### Keyboard Shortcuts

| Shortcut | Behaviour |
|---|---|
| **Enter** | Smart insertion (see below) |
| **Cmd+D** | Toggle `@done` on current task |
| **Tab** | Indent line |
| **Shift+Tab** | Dedent line |
| **Backspace** | Delete empty `- ` task marker |
| **Escape** | Clear active @tag filters; if none, blur editor |
| **Opt+Cmd+↑** | Move line block up |
| **Opt+Cmd+↓** | Move line block down |
| **Cmd+S** | Trigger save |
| **Cmd+Shift+C** | Copy document to clipboard |

### Enter — Smart Insertion Rules

1. Task line with content → new task below at same indent
2. Empty task line → remove `- ` prefix, leave blank line
3. Project line → new tab-indented task beneath it
4. Indented note with content → new task at same indent
5. Empty indented note → strip indentation, leave blank line
6. Other → default CodeMirror behaviour

---

## Filtering System

Three combinable filter axes — project, @tag, #label — all AND semantics.

### Activating Filters

- **Sidebar:** click a project, tag, or label; multiple @tag and #label filters can be active simultaneously; project filter is single-select
- **Editor:** Cmd+click any `@tag` or `#label` in the text to toggle it

Clicking an already-active filter removes it.

### Negative Filters

Prefix with `!` to exclude (e.g. `!@done`). Used by the "Not Done" saved search.

### Visibility Algorithm

1. A line is visible if it matches all active filters
2. A project header is visible if it has at least one visible task/note
3. Hidden lines are replaced with zero-height block widgets (not removed from DOM)

### Clearing Filters

- Click an active sidebar item to deactivate it
- Press **Escape** to clear all active @tag filters

---

## Sidebar

Collapsible sections — each heading is a toggle button with a rotating `›` chevron. All sections default to open; state is local per session.

### Sections

**Projects** — all project headers in document order. Click to filter by project; click again to clear. Shows "No projects yet" when none exist.

**Searches** — fixed saved searches:

| Label | Filter |
|---|---|
| Now | `@now` |
| Not Done | `!@done` |
| Done | `@done` |

**Tags** — unique `@tags` from the document, sorted alphabetically. Hidden if none exist.

**Labels** — unique `#labels` from the document, sorted alphabetically. Hidden if none exist.

**Actions** *(pinned to bottom, separated by a border)*

| Action | Behaviour |
|---|---|
| Archive Done | Moves all `@done` tasks outside the Done section into Done, creating it if absent |
| Delete Archive | Permanently removes all `@done` tasks from within the Done section only |

---

## Archive Done

Moves all `@done` tasks from their original locations into a "Done:" section.

1. Scans for task lines (`^\s*- `) containing `@done` that are not already in "Done:"
2. If "Done:" exists, appends collected tasks at the bottom of it
3. If not, creates "Done:" at the end of the document
4. Removes tasks from their source positions

## Delete Archive

Permanently deletes `@done` tasks from within the "Done:" section only. Tasks in other sections are not affected. Leaves the "Done:" header in place.

---

## Wikilinks

GTDown supports Obsidian internal links (`[[Note name]]`) embedded anywhere in task, note, or project lines.

### Styling

`[[...]]` spans are decorated with `--link-color` and underlined. The decoration is suppressed on the active cursor line (consistent with other decorations) so editing remains clean.

### Navigation

**Click** any `[[wikilink]]` to open the linked note in Obsidian. The handler fires on `mousedown` (not `click`) to avoid a race condition where CM6 moves the cursor — which rebuilds decorations and removes the link class — before the click event fires.

Navigation is handled via `app.workspace.openLinkText(linkText, sourcePath)`. Supported formats:
- `[[Note name]]` — opens by filename
- `[[Note name|display text]]` — link part used for navigation, display text shown in editor
- `[[Note name#Heading]]` — heading anchor preserved in the link

### Autocomplete

Typing `[[` triggers a dropdown picker of all Markdown files in the vault. The list filters as you continue typing. Selecting a file inserts `filename]]` and moves the cursor past the closing brackets.

Implementation: CM6 `autocompletion()` with a custom source (`wikilinkCompletion.ts`) that calls `app.vault.getMarkdownFiles()`. `validFor: /^[^\]]*$/` keeps the picker active while typing inside the brackets.

---

## Theming

All colours are mapped from GTDown's internal tokens to Obsidian's CSS variables on the `.gtdown-root` container:

| GTDown token | Obsidian variable |
|---|---|
| `--color-bg` | `--background-primary` |
| `--color-surface` | `--background-secondary` |
| `--color-border` | `--background-modifier-border` |
| `--color-text` | `--text-normal` |
| `--color-text-muted` | `--text-muted` |
| `--color-accent` | `--interactive-accent` |
| `--color-tag-at` | `--color-blue` |
| `--color-tag-hash` | `--color-purple` |

The plugin respects Obsidian's light/dark/custom themes automatically with no additional CSS.

---

## Known Behaviour Notes

- `registerExtensions` reliably routes files created via `vault.create()` but may not apply to files copied into the vault via the OS filesystem. The `file-open` event listener with `setViewState` is the fallback.
- `.gtd` is not a registered macOS UTType. macOS Finder's "Hide Extension" can disguise other file types (e.g. `.gtd.md`) as `.gtd`. Users should enable "Show all filename extensions" in Finder → Settings → Advanced.
- The `@codemirror/*` and `@lezer/*` packages must remain external in the esbuild config. Bundling them causes silent failures due to CM6's object-identity state resolution.
