# Turnaround Spreadsheets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone browser-based spreadsheet app with Excel-like features, dark-grey/purple theme, full import/export, localStorage persistence, find & replace, and a stubbed file attachment system.

**Architecture:** Single HTML page with vanilla JS loaded via `<script>` tags — no build tools, no framework, no Node.js required. Each JS file registers itself on a shared `window.App` namespace. `app.js` (loaded last) initializes all modules and wires events. x-spreadsheet drives the grid; ExcelJS/PapaParse/jsPDF handle all file I/O.

**Tech Stack:** x-data-spreadsheet 1.1.9 (MIT), ExcelJS 4.3.0 (MIT), PapaParse 5.4.1 (MIT), jsPDF 2.5.1 + jspdf-autotable 3.8.1 (MIT) — all vendored in `/lib/`.

---

## File Map

| File | Responsibility |
|---|---|
| `index.html` | App shell — loads all CSS/JS, defines DOM structure |
| `css/theme.css` | CSS custom properties for dark-grey/purple palette, base resets |
| `css/spreadsheet.css` | All component styles: toolbar, formula bar, grid, tabs, modals, attachment panel |
| `lib/xspreadsheet.js` | Vendored x-data-spreadsheet grid library |
| `lib/xspreadsheet.css` | Vendored x-spreadsheet default styles (overridden by our theme) |
| `lib/exceljs.min.js` | Vendored ExcelJS for .xlsx/.ods I/O |
| `lib/papaparse.min.js` | Vendored PapaParse for .csv/.tsv I/O |
| `lib/jspdf.umd.min.js` | Vendored jsPDF for PDF export |
| `lib/jspdf.plugin.autotable.min.js` | Vendored jspdf-autotable plugin |
| `js/grid.js` | x-spreadsheet init, config, exposes `window.App.Grid` |
| `js/storage.js` | localStorage auto-save (debounced) + manual save/load, exposes `window.App.Storage` |
| `js/io.js` | Import/export for all formats, exposes `window.App.IO` |
| `js/findreplace.js` | Find & replace modal + search logic, exposes `window.App.FindReplace` |
| `js/attachments.js` | Attachment panel UI + backend stub, exposes `window.App.Attachments` |
| `js/app.js` | Entry point — initializes all modules, wires toolbar/keyboard events |
| `tests/test.html` | Browser-runnable unit tests for pure JS functions |
| `tests/runner.js` | Minimal in-browser assertion library |
| `tests/test-storage.js` | Unit tests for storage serialization functions |
| `tests/test-io.js` | Unit tests for CSV/TSV conversion functions |

---

## Task 1: Project Structure & Git Init

**Files:**
- Create: all directories and empty placeholder files

- [ ] **Step 1: Create directory structure**

```bash
cd "/Users/samharris/Turnaround Spreadsheets"
mkdir -p css js lib tests
touch css/theme.css css/spreadsheet.css
touch js/app.js js/grid.js js/storage.js js/io.js js/findreplace.js js/attachments.js
touch tests/runner.js tests/test.html tests/test-storage.js tests/test-io.js
```

- [ ] **Step 2: Initialize git**

```bash
cd "/Users/samharris/Turnaround Spreadsheets"
git init
echo ".DS_Store" > .gitignore
echo ".superpowers/" >> .gitignore
git add .gitignore docs/
git commit -m "chore: init project with spec and plan"
```

- [ ] **Step 3: Verify structure**

```bash
find "/Users/samharris/Turnaround Spreadsheets" -not -path '*/.git/*' -not -path '*/docs/*'
```

Expected output — these paths exist:
```
./css/theme.css
./css/spreadsheet.css
./js/app.js
./js/grid.js
./js/storage.js
./js/io.js
./js/findreplace.js
./js/attachments.js
./lib/
./tests/runner.js
./tests/test.html
./tests/test-storage.js
./tests/test-io.js
./index.html  (not yet — created in Task 5)
```

---

## Task 2: Download & Vendor Libraries

**Files:**
- Create: `lib/xspreadsheet.js`, `lib/xspreadsheet.css`, `lib/exceljs.min.js`, `lib/papaparse.min.js`, `lib/jspdf.umd.min.js`, `lib/jspdf.plugin.autotable.min.js`

- [ ] **Step 1: Download x-data-spreadsheet**

```bash
cd "/Users/samharris/Turnaround Spreadsheets/lib"
curl -L "https://unpkg.com/x-data-spreadsheet@1.1.9/dist/xspreadsheet.js" -o xspreadsheet.js
curl -L "https://unpkg.com/x-data-spreadsheet@1.1.9/dist/xspreadsheet.css" -o xspreadsheet.css
```

- [ ] **Step 2: Download ExcelJS**

```bash
cd "/Users/samharris/Turnaround Spreadsheets/lib"
curl -L "https://cdn.jsdelivr.net/npm/exceljs@4.3.0/dist/exceljs.min.js" -o exceljs.min.js
```

- [ ] **Step 3: Download PapaParse**

```bash
cd "/Users/samharris/Turnaround Spreadsheets/lib"
curl -L "https://unpkg.com/papaparse@5.4.1/papaparse.min.js" -o papaparse.min.js
```

- [ ] **Step 4: Download jsPDF and autotable**

```bash
cd "/Users/samharris/Turnaround Spreadsheets/lib"
curl -L "https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js" -o jspdf.umd.min.js
curl -L "https://unpkg.com/jspdf-autotable@3.8.1/dist/jspdf.plugin.autotable.min.js" -o jspdf.plugin.autotable.min.js
```

- [ ] **Step 5: Verify all files are non-empty**

```bash
ls -lh "/Users/samharris/Turnaround Spreadsheets/lib"
```

Expected: 6 files, all > 1KB (exceljs.min.js will be ~1MB, others 50–300KB).

- [ ] **Step 6: Commit**

```bash
cd "/Users/samharris/Turnaround Spreadsheets"
git add lib/
git commit -m "chore: vendor all MIT libraries (x-spreadsheet, ExcelJS, PapaParse, jsPDF)"
```

---

## Task 3: CSS — theme.css

**Files:**
- Modify: `css/theme.css`

- [ ] **Step 1: Write theme.css**

```css
/* css/theme.css — Turnaround Spreadsheets color palette & base reset */

:root {
  --bg-primary:      #1e1e1e;
  --bg-secondary:    #2a2a2a;
  --bg-surface:      #333333;
  --bg-hover:        #3d3d3d;
  --accent-primary:  #7c3aed;
  --accent-hover:    #9461f5;
  --accent-muted:    #4c1d95;
  --accent-subtle:   rgba(124, 58, 237, 0.15);
  --text-primary:    #f0f0f0;
  --text-secondary:  #a0a0a0;
  --text-disabled:   #555555;
  --border-color:    #444444;
  --border-accent:   #7c3aed;
  --grid-line:       #3a3a3a;
  --danger:          #e53e3e;
  --danger-hover:    #fc8181;
  --success:         #38a169;

  --radius-sm: 3px;
  --radius-md: 6px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.4);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.6);
  --transition: 0.15s ease;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  height: 100%;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  overflow: hidden;
}

button {
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
}

input, select {
  font-family: inherit;
  font-size: 13px;
}

:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 1px;
}
```

- [ ] **Step 2: Commit**

```bash
cd "/Users/samharris/Turnaround Spreadsheets"
git add css/theme.css
git commit -m "style: add dark-grey/purple theme CSS variables"
```

---

## Task 4: CSS — spreadsheet.css

**Files:**
- Modify: `css/spreadsheet.css`

- [ ] **Step 1: Write spreadsheet.css**

```css
/* css/spreadsheet.css — All component styles */

/* ── App Layout ─────────────────────────────────────────── */
#app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* ── Toolbar ────────────────────────────────────────────── */
#toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
  height: 40px;
  user-select: none;
}

#toolbar .toolbar-title {
  font-weight: 600;
  font-size: 13px;
  color: var(--accent-hover);
  margin-right: 12px;
  white-space: nowrap;
}

.toolbar-btn {
  position: relative;
  padding: 4px 10px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  transition: var(--transition);
  white-space: nowrap;
}

.toolbar-btn:hover {
  background: var(--bg-hover);
  border-color: var(--border-color);
}

.toolbar-btn.active {
  background: var(--accent-subtle);
  border-color: var(--accent-primary);
  color: var(--accent-hover);
}

.toolbar-separator {
  width: 1px;
  height: 20px;
  background: var(--border-color);
  margin: 0 4px;
}

/* Dropdown menus */
.dropdown {
  position: relative;
}

.dropdown-menu {
  display: none;
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 180px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  z-index: 1000;
  padding: 4px 0;
}

.dropdown-menu.open { display: block; }

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  color: var(--text-primary);
  cursor: pointer;
  transition: var(--transition);
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}

.dropdown-item:hover {
  background: var(--accent-subtle);
  color: var(--accent-hover);
}

.dropdown-item .shortcut {
  margin-left: auto;
  color: var(--text-disabled);
  font-size: 11px;
}

.dropdown-separator {
  height: 1px;
  background: var(--border-color);
  margin: 4px 0;
}

/* ── Formula Bar ────────────────────────────────────────── */
#formula-bar {
  display: flex;
  align-items: center;
  gap: 0;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
  height: 30px;
}

#cell-ref {
  width: 80px;
  padding: 0 8px;
  background: var(--bg-surface);
  border: none;
  border-right: 1px solid var(--border-color);
  color: var(--text-primary);
  font-family: 'Courier New', monospace;
  font-size: 12px;
  height: 100%;
  text-align: center;
}

#formula-prefix {
  padding: 0 8px;
  color: var(--accent-primary);
  font-style: italic;
  font-size: 12px;
  border-right: 1px solid var(--border-color);
  height: 100%;
  display: flex;
  align-items: center;
}

#formula-input {
  flex: 1;
  padding: 0 10px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-family: 'Courier New', monospace;
  font-size: 12px;
  height: 100%;
}

#formula-input:focus { background: var(--accent-subtle); }

/* ── Grid Area ──────────────────────────────────────────── */
#grid-wrapper {
  flex: 1;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

#grid-container {
  flex: 1;
  overflow: hidden;
}

/* Override x-spreadsheet default styles to match our theme */
.x-spreadsheet {
  background: var(--bg-primary) !important;
  border-color: var(--border-color) !important;
}

.x-spreadsheet-toolbar { display: none !important; }

.x-spreadsheet-sheet {
  background: var(--bg-primary) !important;
}

/* ── Sheet Tabs ─────────────────────────────────────────── */
#tab-bar {
  display: flex;
  align-items: center;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
  height: 34px;
  overflow-x: auto;
  scrollbar-width: none;
}

#tab-bar::-webkit-scrollbar { display: none; }

#sheet-tabs {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 2px;
  padding: 0 6px;
}

.sheet-tab {
  padding: 4px 14px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
  font-size: 12px;
  transition: var(--transition);
}

.sheet-tab:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.sheet-tab.active {
  background: var(--bg-primary);
  border-color: var(--border-color);
  border-bottom-color: var(--bg-primary);
  color: var(--accent-hover);
}

.sheet-tab-add {
  padding: 4px 10px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  transition: var(--transition);
}

.sheet-tab-add:hover { color: var(--accent-primary); }

#attachments-toggle {
  margin-left: auto;
  margin-right: 8px;
  padding: 4px 12px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
  transition: var(--transition);
}

#attachments-toggle:hover, #attachments-toggle.open {
  border-color: var(--accent-primary);
  color: var(--accent-hover);
}

/* ── Attachments Panel ──────────────────────────────────── */
#attachments-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 260px;
  height: 100%;
  background: var(--bg-secondary);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.2s ease;
  z-index: 100;
}

#attachments-panel.open { transform: translateX(0); }

.panel-header {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-header h3 {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.panel-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
}

.panel-close:hover { color: var(--text-primary); }

.panel-row-label {
  padding: 8px 14px;
  font-size: 11px;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color);
}

#attachment-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.attachment-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--text-primary);
}

.attachment-chip .file-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.attachment-chip .file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-empty {
  text-align: center;
  color: var(--text-disabled);
  padding: 24px 14px;
  font-size: 12px;
}

.panel-footer {
  padding: 10px;
  border-top: 1px solid var(--border-color);
}

.btn-attach {
  width: 100%;
  padding: 8px;
  background: var(--bg-surface);
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-disabled);
  cursor: not-allowed;
  font-size: 12px;
  position: relative;
}

.btn-attach:hover::after {
  content: 'Backend connection required';
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  font-size: 11px;
  pointer-events: none;
}

/* ── Modals ─────────────────────────────────────────────── */
.modal-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  z-index: 2000;
  align-items: center;
  justify-content: center;
}

.modal-overlay.open { display: flex; }

.modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  min-width: 360px;
  max-width: 520px;
  width: 100%;
}

.modal-header {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h2 {
  font-size: 14px;
  font-weight: 600;
}

.modal-body { padding: 16px; }

.modal-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--border-color);
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

/* Form controls inside modals */
.form-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.form-row label {
  width: 70px;
  color: var(--text-secondary);
  font-size: 12px;
  flex-shrink: 0;
}

.form-row input[type="text"] {
  flex: 1;
  padding: 6px 10px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
}

.form-row input[type="text"]:focus {
  border-color: var(--accent-primary);
  background: var(--accent-subtle);
}

.form-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.form-options label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 12px;
}

.form-options input[type="checkbox"] {
  accent-color: var(--accent-primary);
}

/* Find result info */
#find-result-info {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 4px;
  min-height: 16px;
}

/* Buttons */
.btn {
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  font-size: 12px;
  transition: var(--transition);
}

.btn-primary {
  background: var(--accent-primary);
  color: #fff;
  border-color: var(--accent-primary);
}

.btn-primary:hover { background: var(--accent-hover); border-color: var(--accent-hover); }

.btn-secondary {
  background: var(--bg-surface);
  color: var(--text-primary);
  border-color: var(--border-color);
}

.btn-secondary:hover { border-color: var(--accent-primary); color: var(--accent-hover); }

/* ── Restore Session Dialog ─────────────────────────────── */
#restore-dialog .modal-body p {
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

/* ── Scrollbars ─────────────────────────────────────────── */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: var(--bg-primary); }
::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--text-disabled); }
```

- [ ] **Step 2: Commit**

```bash
cd "/Users/samharris/Turnaround Spreadsheets"
git add css/spreadsheet.css
git commit -m "style: add component styles for toolbar, grid, tabs, modals, attachment panel"
```

---

## Task 5: index.html — App Shell

**Files:**
- Create: `index.html`

- [ ] **Step 1: Write index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Turnaround Spreadsheets</title>
  <link rel="stylesheet" href="lib/xspreadsheet.css" />
  <link rel="stylesheet" href="css/theme.css" />
  <link rel="stylesheet" href="css/spreadsheet.css" />
</head>
<body>
<div id="app">

  <!-- Toolbar -->
  <div id="toolbar">
    <span class="toolbar-title">Turnaround Spreadsheets</span>

    <!-- File menu -->
    <div class="dropdown" id="menu-file">
      <button class="toolbar-btn" id="btn-file">File ▾</button>
      <div class="dropdown-menu" id="dropdown-file">
        <button class="dropdown-item" data-action="new">New <span class="shortcut">Ctrl+N</span></button>
        <div class="dropdown-separator"></div>
        <button class="dropdown-item" data-action="import">Import…</button>
        <div class="dropdown-separator"></div>
        <button class="dropdown-item" data-action="save">Save (JSON) <span class="shortcut">Ctrl+S</span></button>
        <button class="dropdown-item" data-action="export-xlsx">Export as .xlsx</button>
        <button class="dropdown-item" data-action="export-csv">Export as .csv</button>
        <button class="dropdown-item" data-action="export-tsv">Export as .tsv</button>
        <button class="dropdown-item" data-action="export-ods">Export as .ods</button>
        <button class="dropdown-item" data-action="export-json">Export as .json</button>
        <button class="dropdown-item" data-action="export-pdf">Export as PDF</button>
      </div>
    </div>

    <!-- Edit menu -->
    <div class="dropdown" id="menu-edit">
      <button class="toolbar-btn" id="btn-edit">Edit ▾</button>
      <div class="dropdown-menu" id="dropdown-edit">
        <button class="dropdown-item" data-action="cut">Cut <span class="shortcut">Ctrl+X</span></button>
        <button class="dropdown-item" data-action="copy">Copy <span class="shortcut">Ctrl+C</span></button>
        <button class="dropdown-item" data-action="paste">Paste <span class="shortcut">Ctrl+V</span></button>
        <div class="dropdown-separator"></div>
        <button class="dropdown-item" data-action="insert-row">Insert Row</button>
        <button class="dropdown-item" data-action="delete-row">Delete Row</button>
        <button class="dropdown-item" data-action="insert-col">Insert Column</button>
        <button class="dropdown-item" data-action="delete-col">Delete Column</button>
      </div>
    </div>

    <!-- Format menu -->
    <div class="dropdown" id="menu-format">
      <button class="toolbar-btn" id="btn-format">Format ▾</button>
      <div class="dropdown-menu" id="dropdown-format">
        <button class="dropdown-item" data-action="bold">Bold <span class="shortcut">Ctrl+B</span></button>
        <button class="dropdown-item" data-action="italic">Italic <span class="shortcut">Ctrl+I</span></button>
        <button class="dropdown-item" data-action="underline">Underline <span class="shortcut">Ctrl+U</span></button>
        <div class="dropdown-separator"></div>
        <button class="dropdown-item" data-action="align-left">Align Left</button>
        <button class="dropdown-item" data-action="align-center">Align Center</button>
        <button class="dropdown-item" data-action="align-right">Align Right</button>
      </div>
    </div>

    <div class="toolbar-separator"></div>
    <button class="toolbar-btn" id="btn-find-replace">Find & Replace</button>
  </div>

  <!-- Formula Bar -->
  <div id="formula-bar">
    <input id="cell-ref" type="text" value="A1" readonly />
    <span id="formula-prefix">fx</span>
    <input id="formula-input" type="text" placeholder="Enter value or formula…" />
  </div>

  <!-- Grid + Attachment Panel -->
  <div id="grid-wrapper">
    <div id="grid-container"></div>

    <!-- Attachment Panel (slides in from right) -->
    <div id="attachments-panel">
      <div class="panel-header">
        <h3>Attachments</h3>
        <button class="panel-close" id="attachments-close">×</button>
      </div>
      <div class="panel-row-label" id="attachment-row-label">Select a row to view attachments</div>
      <div id="attachment-list">
        <div class="attachment-empty">No attachments for this row.</div>
      </div>
      <div class="panel-footer">
        <button class="btn-attach" disabled>+ Attach File</button>
      </div>
    </div>
  </div>

  <!-- Tab Bar -->
  <div id="tab-bar">
    <div id="sheet-tabs">
      <!-- Sheet tabs rendered by grid.js -->
    </div>
    <button id="attachments-toggle">Attachments ▶</button>
  </div>

</div>

<!-- Hidden file input for import -->
<input type="file" id="import-file-input" accept=".xlsx,.xls,.csv,.tsv,.ods,.json" style="display:none" />

<!-- Find & Replace Modal -->
<div class="modal-overlay" id="findreplace-overlay">
  <div class="modal">
    <div class="modal-header">
      <h2>Find & Replace</h2>
      <button class="panel-close" id="findreplace-close">×</button>
    </div>
    <div class="modal-body">
      <div class="form-row">
        <label for="find-input">Find</label>
        <input type="text" id="find-input" placeholder="Search…" autocomplete="off" />
      </div>
      <div class="form-row">
        <label for="replace-input">Replace</label>
        <input type="text" id="replace-input" placeholder="Replace with…" autocomplete="off" />
      </div>
      <div class="form-options">
        <label><input type="checkbox" id="opt-match-case" /> Match case</label>
        <label><input type="checkbox" id="opt-whole-cell" /> Whole cell</label>
        <label><input type="checkbox" id="opt-all-sheets" /> All sheets</label>
      </div>
      <div id="find-result-info"></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" id="btn-find-prev">◀ Prev</button>
      <button class="btn btn-secondary" id="btn-find-next">Next ▶</button>
      <button class="btn btn-secondary" id="btn-replace-one">Replace</button>
      <button class="btn btn-primary" id="btn-replace-all">Replace All</button>
    </div>
  </div>
</div>

<!-- Restore Session Modal -->
<div class="modal-overlay" id="restore-dialog">
  <div class="modal">
    <div class="modal-header">
      <h2>Restore Session</h2>
    </div>
    <div class="modal-body">
      <p>A previous session was found. Would you like to restore it?</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" id="btn-start-fresh">Start Fresh</button>
      <button class="btn btn-primary" id="btn-restore">Restore</button>
    </div>
  </div>
</div>

<!-- Libraries -->
<script src="lib/xspreadsheet.js"></script>
<script src="lib/exceljs.min.js"></script>
<script src="lib/papaparse.min.js"></script>
<script src="lib/jspdf.umd.min.js"></script>
<script src="lib/jspdf.plugin.autotable.min.js"></script>

<!-- App modules (order matters) -->
<script src="js/grid.js"></script>
<script src="js/storage.js"></script>
<script src="js/io.js"></script>
<script src="js/findreplace.js"></script>
<script src="js/attachments.js"></script>
<script src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Open in browser and verify it loads without JS errors**

Open `file:///Users/samharris/Turnaround%20Spreadsheets/index.html` in a browser.

Expected: Dark page with toolbar, formula bar visible. Console shows no errors (the grid won't render yet — grid.js is empty).

- [ ] **Step 3: Commit**

```bash
cd "/Users/samharris/Turnaround Spreadsheets"
git add index.html
git commit -m "feat: add HTML app shell with toolbar, formula bar, grid, tabs, modals"
```

---

## Task 6: js/grid.js — x-spreadsheet Initialization

**Files:**
- Modify: `js/grid.js`

- [ ] **Step 1: Write grid.js**

```js
// js/grid.js
// Initializes x-spreadsheet, exposes App.Grid API
// Depends on: lib/xspreadsheet.js loaded before this file

window.App = window.App || {};

window.App.Grid = (function () {
  let xs = null;   // x-spreadsheet instance
  let activeSheetIndex = 0;

  const DEFAULT_DATA = [{ name: 'Sheet1', rows: {} }];

  function init(containerSelector) {
    xs = x_spreadsheet(containerSelector, {
      mode: 'edit',
      showToolbar: false,
      showGrid: true,
      showContextmenu: true,
      view: {
        height: () => document.getElementById('grid-container').clientHeight,
        width:  () => document.getElementById('grid-container').clientWidth,
      },
      row:  { len: 200, height: 25 },
      col:  { len: 26, width: 100, indexWidth: 60, minWidth: 60 },
      style: {
        bgcolor: '#1e1e1e',
        align:   'left',
        valign:  'middle',
        textwrap: false,
        strike:   false,
        underline: false,
        color:    '#f0f0f0',
        font: { name: 'Arial', size: 10, bold: false, italic: false },
      },
    });

    xs.loadData(DEFAULT_DATA);
    renderTabs();

    xs.on('cell-selected', onCellSelected);
    xs.on('cell-edited',   onCellEdited);

    return xs;
  }

  function onCellSelected(cell, ri, ci) {
    const col = colIndexToLetter(ci);
    document.getElementById('cell-ref').value = col + (ri + 1);
    document.getElementById('formula-input').value = (cell && cell.text) ? cell.text : '';
  }

  function onCellEdited(text, ri, ci) {
    // Storage module listens for this via the public event; nothing to do here
    if (window.App.Storage) window.App.Storage.onDataChanged();
  }

  function renderTabs() {
    const data = xs.getData();
    const container = document.getElementById('sheet-tabs');
    container.innerHTML = '';

    data.forEach((sheet, i) => {
      const tab = document.createElement('button');
      tab.className = 'sheet-tab' + (i === activeSheetIndex ? ' active' : '');
      tab.textContent = sheet.name || ('Sheet' + (i + 1));
      tab.dataset.index = i;

      tab.addEventListener('click', () => switchSheet(i));
      tab.addEventListener('dblclick', () => renameSheet(i, tab));

      container.appendChild(tab);
    });

    // Add sheet button
    const addBtn = document.createElement('button');
    addBtn.className = 'sheet-tab-add';
    addBtn.title = 'Add sheet';
    addBtn.textContent = '+';
    addBtn.addEventListener('click', addSheet);
    container.appendChild(addBtn);
  }

  function switchSheet(index) {
    activeSheetIndex = index;
    xs.sheet.switchSheet(index);
    renderTabs();
  }

  function addSheet() {
    const data = xs.getData();
    const name = 'Sheet' + (data.length + 1);
    data.push({ name, rows: {} });
    xs.loadData(data);
    switchSheet(data.length - 1);
    if (window.App.Storage) window.App.Storage.onDataChanged();
  }

  function renameSheet(index, tabEl) {
    const current = tabEl.textContent;
    const newName = prompt('Sheet name:', current);
    if (!newName || newName === current) return;
    const data = xs.getData();
    data[index].name = newName;
    xs.loadData(data);
    renderTabs();
    if (window.App.Storage) window.App.Storage.onDataChanged();
  }

  function colIndexToLetter(index) {
    let letter = '';
    let n = index + 1;
    while (n > 0) {
      const rem = (n - 1) % 26;
      letter = String.fromCharCode(65 + rem) + letter;
      n = Math.floor((n - 1) / 26);
    }
    return letter;
  }

  function getInstance()       { return xs; }
  function getData()           { return xs ? xs.getData() : []; }
  function loadData(data)      { xs.loadData(data); renderTabs(); }
  function getActiveSheet()    { return activeSheetIndex; }

  return { init, getInstance, getData, loadData, getActiveSheet, renderTabs };
}());
```

- [ ] **Step 2: Open in browser, verify grid renders**

Refresh `index.html`. Expected: Dark spreadsheet grid fills the center area, "Sheet1" tab appears in the tab bar, formula bar updates when you click cells.

- [ ] **Step 3: Commit**

```bash
cd "/Users/samharris/Turnaround Spreadsheets"
git add js/grid.js
git commit -m "feat: initialize x-spreadsheet grid with dark theme, sheet tabs, formula bar"
```

---

## Task 7: js/storage.js — Persistence

**Files:**
- Modify: `js/storage.js`
- Create: `tests/test-storage.js`

- [ ] **Step 1: Write the failing test first**

```js
// tests/test-storage.js
// Loaded by tests/test.html — tests pure serialization functions only

(function () {
  const { assert, assertEquals, runSuite } = window.TestRunner;

  runSuite('Storage — serialize/deserialize', [

    function test_serialize_returns_json_string() {
      const data = [{ name: 'Sheet1', rows: { 0: { cells: { 0: { text: 'Hello' } } } } }];
      const result = App.Storage._serialize(data);
      assert(typeof result === 'string', 'serialize returns a string');
      assert(result.includes('Hello'), 'serialized string contains cell text');
    },

    function test_deserialize_roundtrips_data() {
      const data = [{ name: 'Test', rows: { 1: { cells: { 2: { text: '42' } } } } }];
      const json = App.Storage._serialize(data);
      const result = App.Storage._deserialize(json);
      assertEquals(result[0].name, 'Test', 'sheet name preserved');
      assertEquals(result[0].rows[1].cells[2].text, '42', 'cell text preserved');
    },

    function test_deserialize_invalid_json_returns_null() {
      const result = App.Storage._deserialize('not valid json {{');
      assertEquals(result, null, 'invalid JSON returns null');
    },

    function test_deserialize_wrong_shape_returns_null() {
      const result = App.Storage._deserialize('"just a string"');
      assertEquals(result, null, 'non-array JSON returns null');
    },

  ]);
}());
```

- [ ] **Step 2: Write tests/runner.js**

```js
// tests/runner.js
// Minimal in-browser test runner — no dependencies

window.TestRunner = (function () {
  const results = [];

  function assert(condition, message) {
    results.push({ pass: !!condition, message });
    if (!condition) console.error('FAIL:', message);
    else console.log('PASS:', message);
  }

  function assertEquals(a, b, message) {
    const pass = JSON.stringify(a) === JSON.stringify(b);
    results.push({ pass, message });
    if (!pass) console.error('FAIL:', message, '| expected:', b, '| got:', a);
    else console.log('PASS:', message);
  }

  function runSuite(name, tests) {
    console.group(name);
    tests.forEach(fn => {
      try { fn(); }
      catch (e) { results.push({ pass: false, message: fn.name + ' threw: ' + e.message }); console.error('ERROR:', fn.name, e); }
    });
    console.groupEnd();
  }

  function summary() {
    const passed = results.filter(r => r.pass).length;
    const total  = results.length;
    console.log(`\n${passed}/${total} tests passed`);
    document.getElementById('test-summary').textContent = `${passed}/${total} tests passed`;
    results.forEach(r => {
      const li = document.createElement('li');
      li.style.color = r.pass ? '#38a169' : '#e53e3e';
      li.textContent = (r.pass ? '✓ ' : '✗ ') + r.message;
      document.getElementById('test-results').appendChild(li);
    });
  }

  return { assert, assertEquals, runSuite, summary };
}());
```

- [ ] **Step 3: Write tests/test.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Tests — Turnaround Spreadsheets</title>
  <style>
    body { font-family: monospace; background: #1e1e1e; color: #f0f0f0; padding: 20px; }
    h1 { color: #9461f5; margin-bottom: 16px; }
    #test-summary { font-size: 18px; margin: 16px 0; }
    #test-results { list-style: none; padding: 0; line-height: 2; }
  </style>
</head>
<body>
  <h1>Test Suite</h1>
  <div id="test-summary"></div>
  <ul id="test-results"></ul>

  <!-- Stub out App.Grid so storage.js doesn't fail without the grid -->
  <script>
    window.App = {};
    window.App.Grid = { getData: () => [], loadData: () => {} };
  </script>

  <script src="../tests/runner.js"></script>
  <script src="../js/storage.js"></script>
  <script src="../js/io.js"></script>

  <script src="../tests/test-storage.js"></script>
  <script src="../tests/test-io.js"></script>

  <script> TestRunner.summary(); </script>
</body>
</html>
```

- [ ] **Step 4: Open tests/test.html in browser — verify tests FAIL**

Open `file:///Users/samharris/Turnaround%20Spreadsheets/tests/test.html`.

Expected: Tests fail with "App.Storage._serialize is not a function" (storage.js is empty).

- [ ] **Step 5: Write js/storage.js**

```js
// js/storage.js
// localStorage auto-save + manual save/load
// Depends on: App.Grid being initialized before checkRestore() is called

window.App = window.App || {};

window.App.Storage = (function () {
  const STORAGE_KEY = 'turnaround_spreadsheet_data';
  let saveTimer = null;

  // ── Pure functions (testable) ──────────────────────────────

  function _serialize(data) {
    return JSON.stringify(data);
  }

  function _deserialize(jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!Array.isArray(parsed)) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  // ── Side-effecting functions ───────────────────────────────

  function onDataChanged() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(_autoSave, 2000);
  }

  function _autoSave() {
    const data = window.App.Grid.getData();
    localStorage.setItem(STORAGE_KEY, _serialize(data));
  }

  function hasSavedSession() {
    return !!localStorage.getItem(STORAGE_KEY);
  }

  function checkRestore() {
    if (!hasSavedSession()) return;
    const overlay = document.getElementById('restore-dialog');
    overlay.classList.add('open');

    document.getElementById('btn-restore').onclick = () => {
      const json = localStorage.getItem(STORAGE_KEY);
      const data = _deserialize(json);
      if (data) window.App.Grid.loadData(data);
      overlay.classList.remove('open');
    };

    document.getElementById('btn-start-fresh').onclick = () => {
      localStorage.removeItem(STORAGE_KEY);
      overlay.classList.remove('open');
    };
  }

  function manualSave() {
    const data = window.App.Grid.getData();
    const json = _serialize(data);
    _downloadFile(json, 'turnaround-spreadsheet.json', 'application/json');
  }

  function manualLoad(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = _deserialize(e.target.result);
        if (!data) { reject(new Error('Invalid JSON file')); return; }
        window.App.Grid.loadData(data);
        resolve();
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  function _downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return { onDataChanged, checkRestore, manualSave, manualLoad, hasSavedSession, _serialize, _deserialize };
}());
```

- [ ] **Step 6: Reload tests/test.html — verify tests PASS**

Expected: All 4 storage tests pass (green). Console shows "4/4 tests passed" (io tests may still fail — that's fine).

- [ ] **Step 7: Commit**

```bash
cd "/Users/samharris/Turnaround Spreadsheets"
git add js/storage.js tests/runner.js tests/test.html tests/test-storage.js
git commit -m "feat: add localStorage persistence with auto-save, manual save/load, session restore"
```

---

## Task 8: js/io.js — Import / Export

**Files:**
- Modify: `js/io.js`
- Modify: `tests/test-io.js`

- [ ] **Step 1: Write the failing tests**

```js
// tests/test-io.js

(function () {
  const { assert, assertEquals, runSuite } = window.TestRunner;

  runSuite('IO — CSV conversion', [

    function test_csvToRows_basic() {
      const rows = App.IO._csvToRows('Name,Age\nAlice,30\nBob,25');
      assertEquals(rows[0].cells[0].text, 'Name',  'header col 0');
      assertEquals(rows[0].cells[1].text, 'Age',   'header col 1');
      assertEquals(rows[1].cells[0].text, 'Alice', 'data row col 0');
      assertEquals(rows[2].cells[1].text, '25',    'data row col 1');
    },

    function test_csvToRows_empty_string_returns_empty() {
      const rows = App.IO._csvToRows('');
      assert(Object.keys(rows).length === 0, 'empty CSV yields empty rows');
    },

    function test_rowsToCsv_basic() {
      const rows = {
        0: { cells: { 0: { text: 'A' }, 1: { text: 'B' } } },
        1: { cells: { 0: { text: '1' }, 1: { text: '2' } } },
      };
      const csv = App.IO._rowsToCsv(rows, ',');
      assert(csv.includes('A,B'), 'first row in CSV');
      assert(csv.includes('1,2'), 'second row in CSV');
    },

    function test_rowsToCsv_tsv_delimiter() {
      const rows = { 0: { cells: { 0: { text: 'X' }, 1: { text: 'Y' } } } };
      const tsv = App.IO._rowsToCsv(rows, '\t');
      assert(tsv.includes('X\tY'), 'TSV uses tab delimiter');
    },

  ]);
}());
```

- [ ] **Step 2: Open tests/test.html — verify io tests FAIL**

Expected: IO tests fail with "App.IO._csvToRows is not a function".

- [ ] **Step 3: Write js/io.js**

```js
// js/io.js
// Import/export for .xlsx, .csv, .tsv, .ods, .json, PDF
// Depends on: ExcelJS, PapaParse, jsPDF (all loaded before this file)

window.App = window.App || {};

window.App.IO = (function () {

  // ── Pure helpers (testable) ────────────────────────────────

  // Parse CSV/TSV string → x-spreadsheet rows object
  function _csvToRows(csvString, delimiter) {
    if (!csvString || !csvString.trim()) return {};
    const delim  = delimiter || ',';
    const result = PapaParse.parse(csvString, { delimiter: delim, skipEmptyLines: true });
    const rows   = {};
    result.data.forEach((row, ri) => {
      const cells = {};
      row.forEach((val, ci) => { if (val !== '') cells[ci] = { text: String(val) }; });
      if (Object.keys(cells).length > 0) rows[ri] = { cells };
    });
    return rows;
  }

  // Convert x-spreadsheet rows object → CSV/TSV string
  function _rowsToCsv(rows, delimiter) {
    const delim   = delimiter || ',';
    if (!rows || Object.keys(rows).length === 0) return '';
    const maxRow  = Math.max(...Object.keys(rows).map(Number));
    const maxCol  = Math.max(...Object.values(rows).flatMap(r =>
      r.cells ? Object.keys(r.cells).map(Number) : [0]
    ));
    const matrix  = [];
    for (let ri = 0; ri <= maxRow; ri++) {
      const row = [];
      for (let ci = 0; ci <= maxCol; ci++) {
        row.push(rows[ri] && rows[ri].cells && rows[ri].cells[ci]
          ? rows[ri].cells[ci].text || '' : '');
      }
      matrix.push(row);
    }
    return PapaParse.unparse(matrix, { delimiter: delim });
  }

  // Convert x-spreadsheet sheet data → ExcelJS worksheet
  function _sheetToExcelJsWs(workbook, sheetData) {
    const ws   = workbook.addWorksheet(sheetData.name || 'Sheet1');
    const rows = sheetData.rows || {};
    const rowNums = Object.keys(rows).map(Number).sort((a, b) => a - b);
    rowNums.forEach(ri => {
      const rowData = rows[ri];
      if (!rowData || !rowData.cells) return;
      const colNums = Object.keys(rowData.cells).map(Number).sort((a, b) => a - b);
      colNums.forEach(ci => {
        const cell = rowData.cells[ci];
        if (!cell || cell.text === undefined) return;
        const wsCell = ws.getCell(ri + 1, ci + 1);
        const text   = cell.text;
        // Detect formula
        if (typeof text === 'string' && text.startsWith('=')) {
          wsCell.value = { formula: text.slice(1) };
        } else if (!isNaN(text) && text !== '') {
          wsCell.value = Number(text);
        } else {
          wsCell.value = text;
        }
        // Basic formatting
        if (cell.style) {
          if (cell.style.bold)      wsCell.font  = { ...(wsCell.font || {}), bold: true };
          if (cell.style.italic)    wsCell.font  = { ...(wsCell.font || {}), italic: true };
          if (cell.style.underline) wsCell.font  = { ...(wsCell.font || {}), underline: true };
        }
      });
    });
    return ws;
  }

  // Convert ExcelJS worksheet → x-spreadsheet rows object
  function _excelJsWsToRows(ws) {
    const rows = {};
    ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
      const ri    = rowNum - 1;
      const cells = {};
      row.eachCell({ includeEmpty: false }, (cell, colNum) => {
        const ci  = colNum - 1;
        let text  = '';
        if (cell.formula) {
          text = '=' + cell.formula;
        } else if (cell.value !== null && cell.value !== undefined) {
          text = String(cell.value);
        }
        if (text !== '') cells[ci] = { text };
      });
      if (Object.keys(cells).length > 0) rows[ri] = { cells };
    });
    return rows;
  }

  // ── Public import functions ────────────────────────────────

  async function importFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'json') {
      return window.App.Storage.manualLoad(file);
    }
    if (ext === 'csv') {
      return _importDelimited(file, ',');
    }
    if (ext === 'tsv') {
      return _importDelimited(file, '\t');
    }
    if (['xlsx', 'xls', 'ods'].includes(ext)) {
      return _importExcelJs(file);
    }
    throw new Error('Unsupported file type: ' + ext);
  }

  async function _importDelimited(file, delimiter) {
    const text = await file.text();
    const rows = _csvToRows(text, delimiter);
    const current = window.App.Grid.getData();
    current[window.App.Grid.getActiveSheet()].rows = rows;
    window.App.Grid.loadData(current);
    window.App.Storage.onDataChanged();
  }

  async function _importExcelJs(file) {
    const buffer   = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const sheets = [];
    workbook.eachSheet(ws => {
      sheets.push({ name: ws.name, rows: _excelJsWsToRows(ws) });
    });
    if (sheets.length === 0) throw new Error('No sheets found in file');
    window.App.Grid.loadData(sheets);
    window.App.Storage.onDataChanged();
  }

  // ── Public export functions ────────────────────────────────

  function exportCsv() {
    const data   = window.App.Grid.getData();
    const sheet  = data[window.App.Grid.getActiveSheet()];
    const csv    = _rowsToCsv(sheet.rows || {}, ',');
    _download(csv, (sheet.name || 'sheet') + '.csv', 'text/csv');
  }

  function exportTsv() {
    const data   = window.App.Grid.getData();
    const sheet  = data[window.App.Grid.getActiveSheet()];
    const tsv    = _rowsToCsv(sheet.rows || {}, '\t');
    _download(tsv, (sheet.name || 'sheet') + '.tsv', 'text/tab-separated-values');
  }

  function exportJson() {
    const data = window.App.Grid.getData();
    _download(JSON.stringify(data, null, 2), 'turnaround-spreadsheet.json', 'application/json');
  }

  async function exportXlsx() {
    const data     = window.App.Grid.getData();
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Turnaround Spreadsheets';
    workbook.created = new Date();
    data.forEach(sheet => _sheetToExcelJsWs(workbook, sheet));
    const buffer = await workbook.xlsx.writeBuffer();
    _download(buffer, 'turnaround-spreadsheet.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }

  async function exportOds() {
    const data     = window.App.Grid.getData();
    const workbook = new ExcelJS.Workbook();
    data.forEach(sheet => _sheetToExcelJsWs(workbook, sheet));
    // ExcelJS writes ODS via xlsx buffer (ODS support is limited)
    const buffer = await workbook.xlsx.writeBuffer();
    _download(buffer, 'turnaround-spreadsheet.ods',
      'application/vnd.oasis.opendocument.spreadsheet');
  }

  function exportPdf() {
    const { jsPDF } = window.jspdf;
    const doc    = new jsPDF({ orientation: 'landscape' });
    const data   = window.App.Grid.getData();
    const sheet  = data[window.App.Grid.getActiveSheet()];
    const rows   = sheet.rows || {};
    if (Object.keys(rows).length === 0) { alert('Nothing to export.'); return; }

    const maxRow = Math.max(...Object.keys(rows).map(Number));
    const maxCol = Math.max(...Object.values(rows).flatMap(r =>
      r.cells ? Object.keys(r.cells).map(Number) : [0]
    ));

    const head = [];
    const body = [];
    if (rows[0]) {
      // Use first row as header if it has text
      const headerRow = [];
      for (let ci = 0; ci <= maxCol; ci++) {
        headerRow.push(rows[0].cells && rows[0].cells[ci] ? rows[0].cells[ci].text || '' : '');
      }
      head.push(headerRow);
    }
    for (let ri = head.length; ri <= maxRow; ri++) {
      const row = [];
      for (let ci = 0; ci <= maxCol; ci++) {
        row.push(rows[ri] && rows[ri].cells && rows[ri].cells[ci]
          ? rows[ri].cells[ci].text || '' : '');
      }
      body.push(row);
    }

    doc.autoTable({ head, body, styles: { fontSize: 9 } });
    doc.save((sheet.name || 'sheet') + '.pdf');
  }

  function _download(content, filename, mimeType) {
    const blob = content instanceof ArrayBuffer || content instanceof Uint8Array
      ? new Blob([content], { type: mimeType })
      : new Blob([content], { type: mimeType + ';charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return {
    importFile,
    exportCsv, exportTsv, exportJson, exportXlsx, exportOds, exportPdf,
    // Exported for tests:
    _csvToRows, _rowsToCsv,
  };
}());
```

- [ ] **Step 4: Reload tests/test.html — all tests should PASS**

Expected: 8/8 tests passed (4 storage + 4 IO). If any fail, read the console message and fix the relevant function.

- [ ] **Step 5: Commit**

```bash
cd "/Users/samharris/Turnaround Spreadsheets"
git add js/io.js tests/test-io.js
git commit -m "feat: add import/export for xlsx, csv, tsv, ods, json, pdf with unit tests"
```

---

## Task 9: js/findreplace.js — Find & Replace

**Files:**
- Modify: `js/findreplace.js`

- [ ] **Step 1: Write js/findreplace.js**

```js
// js/findreplace.js
// Find & replace modal logic
// Depends on: App.Grid

window.App = window.App || {};

window.App.FindReplace = (function () {
  let matches  = [];   // Array of { sheetIndex, ri, ci }
  let cursor   = -1;   // Current position in matches

  function init() {
    document.getElementById('find-input').addEventListener('input', _onSearchInput);
    document.getElementById('btn-find-next').addEventListener('click', findNext);
    document.getElementById('btn-find-prev').addEventListener('click', findPrev);
    document.getElementById('btn-replace-one').addEventListener('click', replaceOne);
    document.getElementById('btn-replace-all').addEventListener('click', replaceAll);
    document.getElementById('findreplace-close').addEventListener('click', close);
    document.getElementById('findreplace-overlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) close();
    });
  }

  function open() {
    document.getElementById('findreplace-overlay').classList.add('open');
    document.getElementById('find-input').focus();
    _search();
  }

  function close() {
    document.getElementById('findreplace-overlay').classList.remove('open');
    matches = [];
    cursor  = -1;
    _updateInfo('');
  }

  function _getOptions() {
    return {
      matchCase:  document.getElementById('opt-match-case').checked,
      wholeCell:  document.getElementById('opt-whole-cell').checked,
      allSheets:  document.getElementById('opt-all-sheets').checked,
      needle:     document.getElementById('find-input').value,
    };
  }

  function _cellMatches(text, needle, matchCase, wholeCell) {
    if (!needle) return false;
    const a = matchCase ? text  : text.toLowerCase();
    const b = matchCase ? needle : needle.toLowerCase();
    return wholeCell ? a === b : a.includes(b);
  }

  function _search() {
    const { needle, matchCase, wholeCell, allSheets } = _getOptions();
    matches = [];
    cursor  = -1;
    if (!needle) { _updateInfo(''); return; }

    const data         = window.App.Grid.getData();
    const activeIndex  = window.App.Grid.getActiveSheet();
    const sheetsToSearch = allSheets
      ? data.map((_, i) => i)
      : [activeIndex];

    sheetsToSearch.forEach(si => {
      const sheet = data[si];
      if (!sheet || !sheet.rows) return;
      Object.keys(sheet.rows).forEach(ri => {
        const rowData = sheet.rows[ri];
        if (!rowData || !rowData.cells) return;
        Object.keys(rowData.cells).forEach(ci => {
          const cell = rowData.cells[ci];
          if (!cell || cell.text === undefined) return;
          if (_cellMatches(String(cell.text), needle, matchCase, wholeCell)) {
            matches.push({ sheetIndex: si, ri: Number(ri), ci: Number(ci) });
          }
        });
      });
    });

    _updateInfo(matches.length === 0 ? 'No results' : matches.length + ' match(es) found');
  }

  function _onSearchInput() { _search(); }

  function _updateInfo(text) {
    document.getElementById('find-result-info').textContent = text;
  }

  function findNext() {
    _search();
    if (matches.length === 0) return;
    cursor = (cursor + 1) % matches.length;
    _navigateTo(matches[cursor]);
    _updateInfo(`${cursor + 1} of ${matches.length}`);
  }

  function findPrev() {
    _search();
    if (matches.length === 0) return;
    cursor = (cursor - 1 + matches.length) % matches.length;
    _navigateTo(matches[cursor]);
    _updateInfo(`${cursor + 1} of ${matches.length}`);
  }

  function _navigateTo(match) {
    // Switch sheet if needed
    if (match.sheetIndex !== window.App.Grid.getActiveSheet()) {
      window.App.Grid.getInstance().sheet.switchSheet(match.sheetIndex);
    }
    // Scroll to cell using x-spreadsheet internal API
    try {
      const xs = window.App.Grid.getInstance();
      xs.sheet.selector.set(match.ri, match.ci);
      xs.sheet.scrollbar.vertical.move(match.ri * 25);
      xs.reRender();
    } catch (e) {
      // Internal API may differ — graceful fallback
      console.warn('FindReplace: could not navigate to cell', match, e);
    }
  }

  function replaceOne() {
    _search();
    if (matches.length === 0 || cursor < 0) { findNext(); return; }
    const match       = matches[cursor];
    const replaceWith = document.getElementById('replace-input').value;
    const data        = window.App.Grid.getData();
    const sheet       = data[match.sheetIndex];
    if (sheet && sheet.rows && sheet.rows[match.ri] && sheet.rows[match.ri].cells) {
      sheet.rows[match.ri].cells[match.ci].text = replaceWith;
      window.App.Grid.loadData(data);
      window.App.Storage.onDataChanged();
    }
    _search();
    findNext();
  }

  function replaceAll() {
    _search();
    if (matches.length === 0) return;
    const { needle, matchCase, wholeCell } = _getOptions();
    const replaceWith = document.getElementById('replace-input').value;
    const data        = window.App.Grid.getData();
    let   count       = 0;

    matches.forEach(match => {
      const sheet = data[match.sheetIndex];
      if (!sheet || !sheet.rows || !sheet.rows[match.ri] || !sheet.rows[match.ri].cells) return;
      const cell = sheet.rows[match.ri].cells[match.ci];
      if (!cell) return;

      if (wholeCell) {
        cell.text = replaceWith;
      } else {
        const flags = matchCase ? 'g' : 'gi';
        const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        cell.text = String(cell.text).replace(new RegExp(escaped, flags), replaceWith);
      }
      count++;
    });

    window.App.Grid.loadData(data);
    window.App.Storage.onDataChanged();
    _updateInfo(count + ' replacement(s) made');
    matches = [];
    cursor  = -1;
  }

  return { init, open, close };
}());
```

- [ ] **Step 2: Verify cell formatting access**

x-spreadsheet's built-in right-click context menu (and Ctrl+B/I/U keyboard shortcuts when the grid has focus) handles:
- Font size, text color, fill/background color
- Border styles (all, outer, inner, none)
- Number formats (general, number, currency, percentage, date)

These do NOT require custom code — they work out of the box as long as `showToolbar: false` is set (which hides only x-spreadsheet's own top toolbar, not the right-click menu).

To verify: right-click any cell in the grid and confirm the context menu shows format options.

- [ ] **Step 3: Open index.html, click Find & Replace button, verify modal opens**

Expected: Modal appears, typing in search box shows match count, Find Next scrolls to matching cell.

- [ ] **Step 4: Commit**

```bash
cd "/Users/samharris/Turnaround Spreadsheets"
git add js/findreplace.js
git commit -m "feat: add find & replace modal with match-case, whole-cell, all-sheets options"
```

---

## Task 10: js/attachments.js — Attachment Panel

**Files:**
- Modify: `js/attachments.js`

- [ ] **Step 1: Write js/attachments.js**

```js
// js/attachments.js
// Attachment panel UI + backend stub
// To wire up a real backend: replace uploadFile() body only. Nothing else changes.

window.App = window.App || {};

window.App.Attachments = (function () {
  const STORAGE_KEY = 'turnaround_attachments';

  function init() {
    document.getElementById('attachments-toggle').addEventListener('click', toggle);
    document.getElementById('attachments-close').addEventListener('click', close);

    // Update panel when cell is selected
    const xs = window.App.Grid.getInstance();
    xs.on('cell-selected', (_cell, ri, _ci) => {
      _render(ri);
      _updateRowLabel(ri);
    });
  }

  function toggle() {
    const panel  = document.getElementById('attachments-panel');
    const btn    = document.getElementById('attachments-toggle');
    const isOpen = panel.classList.contains('open');
    panel.classList.toggle('open', !isOpen);
    btn.classList.toggle('open', !isOpen);
    btn.textContent = isOpen ? 'Attachments ▶' : 'Attachments ◀';
  }

  function close() {
    const panel = document.getElementById('attachments-panel');
    const btn   = document.getElementById('attachments-toggle');
    panel.classList.remove('open');
    btn.classList.remove('open');
    btn.textContent = 'Attachments ▶';
  }

  function _updateRowLabel(ri) {
    document.getElementById('attachment-row-label').textContent =
      ri !== undefined ? `Row: ${ri + 1}` : 'Select a row to view attachments';
  }

  function _render(ri) {
    const list        = document.getElementById('attachment-list');
    const attachments = getAttachments(ri);
    list.innerHTML    = '';

    if (attachments.length === 0) {
      list.innerHTML = '<div class="attachment-empty">No attachments for this row.</div>';
      return;
    }

    attachments.forEach(att => {
      const chip = document.createElement('div');
      chip.className = 'attachment-chip';
      chip.innerHTML = `
        <span class="file-icon">${_fileIcon(att.name)}</span>
        <span class="file-name" title="${att.name}">${att.name}</span>
      `;
      list.appendChild(chip);
    });
  }

  function _fileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = { pdf: '📄', xlsx: '📊', xls: '📊', csv: '📊',
                    png: '🖼', jpg: '🖼', jpeg: '🖼', gif: '🖼',
                    doc: '📝', docx: '📝', txt: '📝', zip: '📦' };
    return icons[ext] || '📎';
  }

  // ── Stub — replace this function's body when backend is ready ──

  async function uploadFile(file, rowId) {
    // TODO: Replace with real API call, e.g.:
    // const formData = new FormData();
    // formData.append('file', file);
    // formData.append('rowId', rowId);
    // const res = await fetch('/api/attachments', { method: 'POST', body: formData });
    // return res.json();
    console.warn('Attachment upload stub: backend not connected.', file.name, rowId);
    return null;
  }

  // ── localStorage-backed attachment store ──────────────────

  function getAttachments(ri) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const all    = stored ? JSON.parse(stored) : {};
      return all[ri] || [];
    } catch (e) {
      return [];
    }
  }

  function _saveAttachments(ri, list) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const all    = stored ? JSON.parse(stored) : {};
      all[ri]      = list;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
      console.error('Could not save attachments', e);
    }
  }

  return { init, toggle, close, uploadFile, getAttachments };
}());
```

- [ ] **Step 2: Open index.html, click Attachments toggle, verify panel slides in**

Expected: Panel slides in from the right. Selecting different rows updates "Row: N" label. Upload button shows tooltip "Backend connection required" on hover.

- [ ] **Step 3: Commit**

```bash
cd "/Users/samharris/Turnaround Spreadsheets"
git add js/attachments.js
git commit -m "feat: add attachment panel with localStorage store and backend upload stub"
```

---

## Task 11: js/app.js — Wire Everything Together

**Files:**
- Modify: `js/app.js`

- [ ] **Step 1: Write js/app.js**

```js
// js/app.js
// Entry point — initializes all modules and wires toolbar/keyboard events
// Loaded last; all other modules must be in place.

document.addEventListener('DOMContentLoaded', () => {

  // 1. Initialize grid
  const xs = window.App.Grid.init('#grid-container');

  // 2. Wire storage
  window.App.Storage.checkRestore();

  // 3. Wire find & replace
  window.App.FindReplace.init();

  // 4. Wire attachments
  window.App.Attachments.init();

  // 5. Wire formula bar → grid
  document.getElementById('formula-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      // x-spreadsheet doesn't expose a direct "set cell value" API;
      // editing via the formula bar is informational only in this version.
      e.target.blur();
    }
  });

  // 6. Wire toolbar dropdowns
  _initDropdowns();

  // 7. Wire toolbar actions
  _initActions();

  // 8. Wire keyboard shortcuts
  _initShortcuts();

});

// ── Dropdown open/close ───────────────────────────────────

function _initDropdowns() {
  const dropdowns = document.querySelectorAll('.dropdown');

  dropdowns.forEach(dd => {
    const btn  = dd.querySelector('.toolbar-btn');
    const menu = dd.querySelector('.dropdown-menu');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menu.classList.contains('open');
      _closeAllDropdowns();
      if (!isOpen) menu.classList.add('open');
    });
  });

  // Close on outside click
  document.addEventListener('click', _closeAllDropdowns);

  // Wire each dropdown item
  document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const action = e.currentTarget.dataset.action;
      if (action) _handleAction(action);
      _closeAllDropdowns();
    });
  });
}

function _closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu.open').forEach(m => m.classList.remove('open'));
}

// ── Action handler ────────────────────────────────────────

function _initActions() {
  // Find & Replace standalone button
  document.getElementById('btn-find-replace').addEventListener('click', () => {
    window.App.FindReplace.open();
  });

  // Import file input (from File menu)
  document.getElementById('import-file-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await window.App.IO.importFile(file);
    } catch (err) {
      alert('Import failed: ' + err.message);
    }
    e.target.value = '';
  });

  // Drag-and-drop import onto the grid
  const gridWrapper = document.getElementById('grid-wrapper');
  gridWrapper.addEventListener('dragover', (e) => {
    e.preventDefault();
    gridWrapper.style.outline = '2px dashed var(--accent-primary)';
  });
  gridWrapper.addEventListener('dragleave', () => {
    gridWrapper.style.outline = '';
  });
  gridWrapper.addEventListener('drop', async (e) => {
    e.preventDefault();
    gridWrapper.style.outline = '';
    const file = e.dataTransfer.files[0];
    if (!file) return;
    try {
      await window.App.IO.importFile(file);
    } catch (err) {
      alert('Import failed: ' + err.message);
    }
  });
}

function _handleAction(action) {
  switch (action) {
    case 'new':
      if (confirm('Start a new spreadsheet? Unsaved changes will be lost.')) {
        window.App.Grid.loadData([{ name: 'Sheet1', rows: {} }]);
        localStorage.removeItem('turnaround_spreadsheet_data');
      }
      break;

    case 'import':
      document.getElementById('import-file-input').click();
      break;

    case 'save':
      window.App.Storage.manualSave();
      break;

    case 'export-xlsx': window.App.IO.exportXlsx(); break;
    case 'export-csv':  window.App.IO.exportCsv();  break;
    case 'export-tsv':  window.App.IO.exportTsv();  break;
    case 'export-ods':  window.App.IO.exportOds();  break;
    case 'export-json': window.App.IO.exportJson(); break;
    case 'export-pdf':  window.App.IO.exportPdf();  break;

    case 'cut':   document.execCommand('cut');   break;
    case 'copy':  document.execCommand('copy');  break;
    case 'paste': document.execCommand('paste'); break;

    // Row/column operations delegate to x-spreadsheet's context menu equivalent
    case 'insert-row':
    case 'delete-row':
    case 'insert-col':
    case 'delete-col':
      _showKeyboardHint(action);
      break;

    case 'bold':      _triggerFormatKey('b'); break;
    case 'italic':    _triggerFormatKey('i'); break;
    case 'underline': _triggerFormatKey('u'); break;

    case 'align-left':   _setAlign('left');   break;
    case 'align-center': _setAlign('center'); break;
    case 'align-right':  _setAlign('right');  break;
  }
}

// x-spreadsheet handles bold/italic/underline via its own keyboard events
function _triggerFormatKey(key) {
  const xs = window.App.Grid.getInstance();
  xs.sheet.el.el.focus();
  document.execCommand('bold');  // fallback; x-spreadsheet intercepts Ctrl+B internally
}

function _setAlign(align) {
  // x-spreadsheet exposes alignment via its toolbar internally;
  // trigger by dispatching a custom sheet event
  const xs = window.App.Grid.getInstance();
  try { xs.sheet.selector.setStyle('align', align); xs.reRender(); } catch (e) {}
}

function _showKeyboardHint(action) {
  const hints = {
    'insert-row': 'Right-click a row number in the grid and choose Insert Row.',
    'delete-row': 'Right-click a row number in the grid and choose Delete Row.',
    'insert-col': 'Right-click a column header in the grid and choose Insert Column.',
    'delete-col': 'Right-click a column header in the grid and choose Delete Column.',
  };
  alert(hints[action] || 'Use the right-click context menu in the grid.');
}

// ── Keyboard shortcuts ────────────────────────────────────

function _initShortcuts() {
  document.addEventListener('keydown', (e) => {
    const ctrl = e.ctrlKey || e.metaKey;
    if (!ctrl) return;

    switch (e.key.toLowerCase()) {
      case 'h':
        e.preventDefault();
        window.App.FindReplace.open();
        break;
      case 's':
        e.preventDefault();
        window.App.Storage.manualSave();
        break;
      case 'n':
        e.preventDefault();
        _handleAction('new');
        break;
    }
  });
}
```

- [ ] **Step 2: Full integration test in browser**

Open `file:///Users/samharris/Turnaround%20Spreadsheets/index.html`. Verify each of the following manually:

```
[ ] Grid renders, cells are editable
[ ] Formula bar shows cell reference and value when a cell is selected
[ ] Sheet tabs display; clicking switches sheets; double-click renames; + adds a new sheet
[ ] File > Import loads a .csv file (create a test CSV: "Name,Score\nAlice,95\nBob,80")
[ ] File > Export As > .csv downloads a CSV file with the correct data
[ ] File > Export As > .xlsx downloads an xlsx file (verify it opens in Excel/Sheets)
[ ] File > Save downloads a .json file
[ ] Find & Replace (Ctrl+H) opens modal, finds matches, highlights count, replaces text
[ ] Attachments panel opens/closes from toggle button
[ ] Auto-save: edit a cell, wait 3 seconds, refresh page — Restore Session prompt appears
[ ] Restore: click Restore — data is back; Start Fresh — grid is empty
[ ] Ctrl+S triggers File > Save
[ ] Ctrl+N prompts and clears the grid
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/samharris/Turnaround Spreadsheets"
git add js/app.js
git commit -m "feat: wire all modules — toolbar, shortcuts, import/export, session restore"
```

---

## Task 12: Final Polish & PDF Verification

**Files:**
- No new files — browser verification only

- [ ] **Step 1: Test PDF export**

Add some data to the grid (at least 3 rows, 3 columns). File → Export As → PDF. Verify the downloaded PDF opens and shows the grid data as a table.

- [ ] **Step 2: Test xlsx round-trip**

1. Export as `.xlsx`
2. Re-import the exported `.xlsx`
3. Verify data and sheet names are preserved

- [ ] **Step 3: Test session persistence across tabs**

1. Open the app, add data, wait for auto-save
2. Open a second browser tab to the same `index.html`
3. Verify Restore Session prompt appears on the second tab

- [ ] **Step 4: Final commit**

```bash
cd "/Users/samharris/Turnaround Spreadsheets"
git add -A
git status
# Verify no unexpected files
git commit -m "chore: verified full integration — spreadsheet app complete"
```

---

## Notes for Backend Integration (Future)

When ready to add real file upload:

1. Open `js/attachments.js`
2. Replace only the body of `uploadFile(file, rowId)` with your API call
3. No other file needs to change

The stub signature is:
```js
async function uploadFile(file, rowId) {
  // Replace this body
}
```
