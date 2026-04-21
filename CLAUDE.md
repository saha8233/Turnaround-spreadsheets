# Turnaround Spreadsheets — Claude Context

## What This Is
A browser-based spreadsheet app (vanilla HTML/CSS/JS, no build step).
Open `index.html` directly in a browser — no server required.

## Architecture

### Module pattern
All modules attach to `window.App` as IIFEs. Load order in `index.html` matters:
`grid.js` → `storage.js` → `io.js` → `findreplace.js` → `attachments.js` → `app.js`

### Key modules
| File | Responsibility |
|------|---------------|
| `js/grid.js` | Wraps x-spreadsheet, exposes `App.Grid` API, manages sheet tabs |
| `js/storage.js` | localStorage auto-save (2s debounce) + manual JSON save/load |
| `js/io.js` | Import/export: xlsx, csv, tsv, ods, json, PDF |
| `js/findreplace.js` | Find & Replace modal (match-case, whole-cell, all-sheets) |
| `js/attachments.js` | Per-row file attachment panel (slides in from right) |
| `js/app.js` | Entry point — wires toolbar, dropdowns, keyboard shortcuts, formula bar |

### Third-party libs (in `lib/`)
- `xspreadsheet.js` — grid rendering engine
- `exceljs.min.js` — xlsx import/export
- `papaparse.min.js` — CSV parsing
- `jspdf.umd.min.js` + `jspdf.plugin.autotable.min.js` — PDF export

### localStorage keys
- `turnaround_spreadsheet_data` — sheet data (JSON array of sheet objects)
- `turnaround_attachments` — per-row attachment metadata

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
- `tests/runner.js` — lightweight test runner (no framework)

## Session Notes

### 2026-04-21
- First session reviewing the project with Claude
- Confirmed project structure: vanilla JS, no build step, xspreadsheet-based
- Added this CLAUDE.md
