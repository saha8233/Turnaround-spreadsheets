# Turnaround Spreadsheets — Design Spec
**Date:** 2026-04-02
**Status:** Approved

---

## Overview

A standalone, browser-based spreadsheet application built as a single HTML page. Designed to be linked to from an employer's existing website. General-purpose Excel-like functionality with turnaround/project tracking as the primary use case. Dark-grey background with purple accents to match the employer's site aesthetic.

No backend required at this stage. File attachment UI is stubbed for future backend integration.

---

## Licensing

All dependencies must be MIT or Apache-2.0 licensed with no commercial-use restrictions. This product is intended to be sold commercially.

| Library | Role | License |
|---|---|---|
| x-spreadsheet | Grid UI, formulas, multi-sheet | MIT |
| ExcelJS | `.xlsx` / `.ods` import/export | MIT |
| PapaParse | `.csv` / `.tsv` import/export | MIT |
| jsPDF + jspdf-autotable | PDF export | MIT |

All libraries are vendored locally in `/lib/` — no CDN dependencies.

---

## File Structure

```
/Turnaround Spreadsheets/
├── index.html
├── css/
│   ├── theme.css           # CSS custom properties: dark-grey/purple palette
│   └── spreadsheet.css     # Grid, toolbar, tabs, modals, attachment panel
├── js/
│   ├── app.js              # Entry point — initializes and wires all modules
│   ├── grid.js             # x-spreadsheet init, config, event bindings
│   ├── io.js               # Import/export logic for all file formats
│   ├── storage.js          # localStorage auto-save + manual save/load
│   ├── attachments.js      # Attachment panel UI + backend stub
│   └── findreplace.js      # Find & replace modal logic
├── lib/
│   ├── x-data-spreadsheet.min.js
│   ├── exceljs.min.js
│   ├── papaparse.min.js
│   └── jspdf.umd.min.js
└── docs/
    └── superpowers/specs/
        └── 2026-04-02-turnaround-spreadsheets-design.md
```

---

## UI Layout

```
┌─────────────────────────────────────────────────────┐
│  TOOLBAR  [File▼] [Edit▼] [Format▼] [Find & Replace]│
├─────────────────────────────────────────────────────┤
│  FORMULA BAR  [ Cell ref ] [ fx  formula input     ]│
├─────────────────────────────────────────────────────┤
│                                                     │
│                  GRID (x-spreadsheet)               │
│                                                     │
├─────────────────────────────────────────────────────┤
│  [+ Sheet1] [Sheet2] [Sheet3] [+]  │ Attachments ▶ │
└─────────────────────────────────────────────────────┘
```

### Toolbar Menus

- **File:** New, Open (import), Save (export JSON), Import (all formats), Export As (all formats)
- **Edit:** Cut, Copy, Paste, Insert Row, Delete Row, Insert Column, Delete Column
- **Format:** Bold, Italic, Underline, Font Size, Text Color, Fill Color, Borders, Alignment, Number Format
- **Find & Replace button:** Opens modal (`Ctrl+H`)

### Formula Bar

Displays and allows editing of the active cell's reference (e.g., `A1`) and its value or formula.

### Grid

x-spreadsheet canvas. Supports:
- Multiple sheets with add/rename/delete tabs
- Freeze rows/columns (panes)
- Right-click context menu for row/column operations
- Multi-cell selection

### Attachments Panel

Slides in from the right edge. Shows attachments associated with the currently selected row. Upload button is visible but disabled with a "Backend required" tooltip. Attachment list shows filename and type icon. When backend is wired up, only `attachments.js` needs to change.

---

## Import / Export

### Import (File → Open or drag-and-drop)

| Format | Handler | Notes |
|---|---|---|
| `.xlsx` / `.xls` | ExcelJS | Maps sheets, cell values, and basic formatting |
| `.csv` | PapaParse | Loads into active sheet |
| `.tsv` | PapaParse | Tab delimiter, loads into active sheet |
| `.ods` | ExcelJS | Partial — common formats supported |
| `.json` | Native | x-spreadsheet JSON, lossless round-trip |

### Export (File → Export As)

| Format | Handler | Notes |
|---|---|---|
| `.xlsx` | ExcelJS | Preserves formatting where possible |
| `.csv` | PapaParse | Active sheet only |
| `.tsv` | PapaParse | Active sheet only, tab delimiter |
| `.ods` | ExcelJS | |
| `.json` | Native | Full workbook backup |
| PDF | jsPDF + autotable | Visible grid as formatted table |

---

## Persistence

- **Auto-save:** On every cell change, debounced 2 seconds, saves to `localStorage` key `turnaround_spreadsheet_data`
- **Session restore:** On page load, if saved data exists, prompt: *"Restore your last session?"* (Yes / Start Fresh)
- **Manual Save:** File → Save exports a `.json` file to disk
- **Manual Load:** File → Open accepts `.json` to restore a full session

---

## Find & Replace

Triggered by `Ctrl+H` or the toolbar button. Modal overlay with:

- **Search** input field
- **Replace** input field
- **Options:** Match case (checkbox), Match entire cell (checkbox), Search all sheets (checkbox)
- **Actions:** Find Next, Find Prev, Replace, Replace All
- Matching cells are highlighted in the grid as the user types in the search field

---

## Formula Support

Via x-spreadsheet's built-in formula engine:

- **Math:** `SUM`, `AVERAGE`, `MIN`, `MAX`, `COUNT`, `ROUND`, `ABS`
- **Logic:** `IF`, `AND`, `OR`, `NOT`
- **Text:** `CONCAT`, `LEN`, `UPPER`, `LOWER`, `TRIM`
- **Lookup:** `VLOOKUP`, `HLOOKUP`
- **References:** Relative (`A1`), absolute (`$A$1`)
- **Note:** Cross-sheet formula references (`Sheet2!A1`) are not reliably supported by x-spreadsheet's built-in engine and are excluded from scope.

---

## Cell Formatting

- Bold (`Ctrl+B`), Italic (`Ctrl+I`), Underline (`Ctrl+U`)
- Font size
- Text color, background/fill color
- Border styles: all, outer, inner, none
- Text alignment: left, center, right
- Number formats: general, number, currency, percentage, date

---

## Visual Theme

CSS custom properties defined in `theme.css`:

```css
--bg-primary: #1e1e1e;       /* main dark grey background */
--bg-secondary: #2a2a2a;     /* panels, toolbar */
--bg-surface: #333333;       /* cells, inputs */
--accent-primary: #7c3aed;   /* purple — buttons, highlights, active tabs */
--accent-hover: #9461f5;     /* lighter purple on hover */
--accent-muted: #4c1d95;     /* dark purple for borders */
--text-primary: #f0f0f0;
--text-secondary: #a0a0a0;
--text-disabled: #555555;
--border-color: #444444;
--grid-line: #3a3a3a;
```

Re-theming for the employer's exact brand colors requires only changing `theme.css`.

---

## Attachment System (Stub)

`attachments.js` exposes:

```js
// Stub — replace body with real API call when backend is ready
async function uploadFile(file, rowId) {
  console.warn('Backend not connected. File not uploaded:', file.name);
  return null;
}

function getAttachments(rowId) {
  // Returns from localStorage for now
}
```

The UI renders attachment chips per row. The upload button shows a tooltip: *"File upload requires backend connection."* No other file in the project needs to change when the backend is added.

---

## Out of Scope (Future)

- Charts / graphs
- Pivot tables
- Conditional formatting rules
- Data validation
- Cell comments/notes
- Real file upload backend
- User authentication
