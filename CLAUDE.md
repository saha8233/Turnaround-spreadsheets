# Turnaround Spreadsheets — Claude Context

## What This Is
A browser-based spreadsheet app (vanilla HTML/CSS/JS, no build step).
Open `index.html` directly in a browser — no server required.

## Architecture

### Module pattern
All modules attach to `window.App` as IIFEs. Load order in `index.html` matters:
`grid.js` → `storage.js` → `captainslog.js` → `io.js` → `findreplace.js` → `attachments.js` → `app.js`

### Key modules
| File | Responsibility |
|------|---------------|
| `js/grid.js` | Wraps x-spreadsheet, exposes `App.Grid` API, manages sheet tabs |
| `js/storage.js` | localStorage auto-save (2s debounce) + manual JSON save/load |
| `js/captainslog.js` | Captain's Log IIFE — data store (`_store`), panel rendering, compose logic |
| `js/io.js` | Import/export: xlsx, csv, tsv, ods, json, PDF |
| `js/findreplace.js` | Find & Replace modal (match-case, whole-cell, all-sheets) |
| `js/attachments.js` | Per-row file attachment panel (slides in from right) |
| `js/app.js` | Entry point — wires toolbar, dropdowns, keyboard shortcuts, formula bar |

### CSS files
- `css/theme.css` — design tokens (CSS custom properties), base styles
- `css/captainslog.css` — Captain's Log panel + standalone page styles

### Third-party libs (in `lib/`)
- `xspreadsheet.js` — grid rendering engine
- `exceljs.min.js` — xlsx import/export
- `papaparse.min.js` — CSV parsing
- `jspdf.umd.min.js` + `jspdf.plugin.autotable.min.js` — PDF export

### localStorage keys
- `turnaround_spreadsheet_data` — sheet data (JSON array of sheet objects)
- `turnaround_attachments` — per-row attachment metadata
- `turnaround_captains_log` — Captain's Log entries (object keyed by `YYYY-MM-DD` date strings)

## Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd+S | Save JSON |
| Ctrl/Cmd+N | New spreadsheet |
| Ctrl/Cmd+H | Find & Replace |
| Ctrl/Cmd+B/I/U | Bold / Italic / Underline |

## Testing
Tests live in `tests/`. Open `tests/test.html` in a browser to run.
- `test-storage.js` — unit tests for `_serialize`/`_deserialize`
- `test-io.js` — import/export tests
- `test-captainslog.js` — pure function + store tests for Captain's Log
- `tests/runner.js` — lightweight test runner (no framework)

## Git Workflow
- **Always create a new branch** for each new feature (e.g. `feature/my-feature`)
- **Never push directly to main** — always ask for confirmation first
- Merge to main via PR or explicit user approval only

## Session Notes

### 2026-04-21
- First session reviewing the project with Claude
- Confirmed project structure: vanilla JS, no build step, xspreadsheet-based
- Added this CLAUDE.md
- Designed and implemented Captain's Log feature (branch: `feature/captains-log`)
  - Right-side panel in `index.html` (toggleable via toolbar "📋 Log ▶" button)
  - Standalone `log.html` full-page view
  - Shift-aware colour coding: amber day (06:00–17:59), blue night (18:00–05:59)
  - Append-only entries with carry-over from previous day (faded)
  - localStorage-backed with isolated `_store` object (ready for backend swap)
