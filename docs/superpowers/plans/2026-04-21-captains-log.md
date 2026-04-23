# Captain's Log Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shift-aware, append-only Captain's Log as a right-side panel in the main app and as a standalone `log.html` page, backed by localStorage.

**Architecture:** New `window.App.CaptainsLog` IIFE module following existing patterns. All localStorage I/O isolated in a `_store` object for easy backend swap. Panel slides in from the right (same pattern as Attachments). Standalone `log.html` loads only theme + captainslog assets.

**Tech Stack:** Vanilla JS (ES5-compatible IIFE), CSS custom properties from `theme.css`, localStorage, no build step.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `js/captainslog.js` | `window.App.CaptainsLog` IIFE — data store + all panel/page logic |
| Create | `css/captainslog.css` | Panel + standalone page styles |
| Create | `log.html` | Standalone full-page Captain's Log |
| Create | `tests/test-captainslog.js` | Tests for pure functions in captainslog.js |
| Modify | `index.html` | Add CSS link, panel HTML, toolbar button, JS script tag |
| Modify | `js/app.js` | Call `window.App.CaptainsLog.init()` on DOMContentLoaded |
| Modify | `tests/test.html` | Load `captainslog.js` + `test-captainslog.js` |

---

## Task 1: Create feature branch

- [ ] **Step 1: Create and switch to feature branch**

```bash
cd "/Users/samharris/turnaround spreadsheets"
git checkout -b feature/captains-log
```

Expected output: `Switched to a new branch 'feature/captains-log'`

---

## Task 2: Data module — pure functions

**Files:**
- Create: `js/captainslog.js`
- Create: `tests/test-captainslog.js`

- [ ] **Step 1: Create `js/captainslog.js` with pure functions only**

```js
// js/captainslog.js
// Captain's Log — shift-aware append-only log panel
// Depends on: nothing (standalone module)
// Load order: after storage.js, before app.js

window.App = window.App || {};

window.App.CaptainsLog = (function () {

  const STORAGE_KEY = 'turnaround_captains_log';
  let _activeDay    = null;   // null means "today"
  let _clockTimer   = null;

  // ── Pure functions (testable) ──────────────────────────────

  function _todayKey() {
    return new Date().toISOString().slice(0, 10); // "2026-04-21"
  }

  function _getShift() {
    const h = new Date().getHours();
    return (h >= 6 && h < 18) ? 'day' : 'night';
  }

  function _formatTime(date) {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return h + ':' + m;
  }

  function _formatDateLabel(key) {
    // "2026-04-21" → "Apr 21"
    const parts  = key.split('-');
    const month  = parseInt(parts[1], 10) - 1;
    const day    = parseInt(parts[2], 10);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[month] + ' ' + day;
  }

  // ── Data store — swap this object's body for a backend ────

  const _store = {
    getAll: function () {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
      } catch (e) { return {}; }
    },
    _save: function (data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    },
    addEntry: function (entry) {
      const data = this.getAll();
      const key  = _todayKey();
      if (!data[key]) data[key] = [];
      data[key].push(entry);
      this._save(data);
    },
    getCarryOverKey: function () {
      const data  = this.getAll();
      const today = _todayKey();
      const keys  = Object.keys(data)
        .filter(function (k) { return k < today && data[k].length > 0; })
        .sort();
      return keys.length > 0 ? keys[keys.length - 1] : null;
    },
  };

  // ── Public API (stubs — wired in later tasks) ──────────────

  function init()   {}
  function toggle() {}
  function close()  {}

  return {
    init, toggle, close,
    // Exported for tests:
    _todayKey, _getShift, _formatTime, _formatDateLabel, _store,
  };

}());
```

- [ ] **Step 2: Create `tests/test-captainslog.js`**

```js
// tests/test-captainslog.js
(function () {
  const { assert, assertEquals, runSuite } = window.TestRunner;

  runSuite('CaptainsLog — pure functions', [

    function test_todayKey_format() {
      const key = App.CaptainsLog._todayKey();
      assert(/^\d{4}-\d{2}-\d{2}$/.test(key), '_todayKey returns YYYY-MM-DD');
    },

    function test_getShift_returns_day_or_night() {
      const shift = App.CaptainsLog._getShift();
      assert(shift === 'day' || shift === 'night', '_getShift returns day or night');
    },

    function test_formatTime_pads_hours_and_minutes() {
      const d = new Date(2026, 3, 21, 8, 5); // 08:05
      assertEquals(App.CaptainsLog._formatTime(d), '08:05', 'pads single-digit hour and minute');
    },

    function test_formatTime_handles_noon() {
      const d = new Date(2026, 3, 21, 12, 30);
      assertEquals(App.CaptainsLog._formatTime(d), '12:30', 'noon formatted correctly');
    },

    function test_formatDateLabel_converts_key() {
      assertEquals(App.CaptainsLog._formatDateLabel('2026-04-21'), 'Apr 21', 'April key');
      assertEquals(App.CaptainsLog._formatDateLabel('2026-01-05'), 'Jan 5',  'January key');
      assertEquals(App.CaptainsLog._formatDateLabel('2026-12-31'), 'Dec 31', 'December key');
    },

  ]);

  runSuite('CaptainsLog — store', [

    function test_addEntry_persists_to_localStorage() {
      localStorage.removeItem('turnaround_captains_log');
      const entry = { time: '09:00', initials: 'NH', text: 'Test entry', shift: 'day' };
      App.CaptainsLog._store.addEntry(entry);
      const data = App.CaptainsLog._store.getAll();
      const today = App.CaptainsLog._todayKey();
      assert(Array.isArray(data[today]), 'today key exists and is array');
      assertEquals(data[today][0].text, 'Test entry', 'entry text stored correctly');
      assertEquals(data[today][0].initials, 'NH', 'initials stored correctly');
      localStorage.removeItem('turnaround_captains_log');
    },

    function test_getAll_returns_empty_object_when_no_data() {
      localStorage.removeItem('turnaround_captains_log');
      const data = App.CaptainsLog._store.getAll();
      assertEquals(typeof data, 'object', 'returns object');
      assertEquals(Object.keys(data).length, 0, 'empty when nothing stored');
    },

    function test_getCarryOverKey_returns_most_recent_prior_day() {
      localStorage.removeItem('turnaround_captains_log');
      // Manually seed two past days
      const seed = {
        '2020-01-01': [{ time: '08:00', initials: 'A', text: 'old', shift: 'day' }],
        '2020-01-02': [{ time: '09:00', initials: 'B', text: 'newer', shift: 'day' }],
      };
      localStorage.setItem('turnaround_captains_log', JSON.stringify(seed));
      const key = App.CaptainsLog._store.getCarryOverKey();
      assertEquals(key, '2020-01-02', 'returns most recent past day with entries');
      localStorage.removeItem('turnaround_captains_log');
    },

    function test_getCarryOverKey_returns_null_when_no_prior_days() {
      localStorage.removeItem('turnaround_captains_log');
      const key = App.CaptainsLog._store.getCarryOverKey();
      assertEquals(key, null, 'returns null when no prior entries');
    },

  ]);
}());
```

- [ ] **Step 3: Register module + tests in `tests/test.html`**

Add after the existing `App.Grid` stub and before `runner.js`:

```html
    window.App.CaptainsLog = null; // stub — loaded below
```

Then add after the existing script tags (before `TestRunner.summary()`):

```html
  <script src="../js/captainslog.js"></script>
  <script src="../tests/test-captainslog.js"></script>
```

The full updated `tests/test.html` scripts section:
```html
  <!-- Stub out App.Grid so storage.js doesn't fail without the grid -->
  <script>
    window.App = {};
    window.App.Grid = { getData: () => [], loadData: () => {} };
  </script>

  <script src="../lib/papaparse.min.js"></script>
  <script src="../tests/runner.js"></script>
  <script src="../js/storage.js"></script>
  <script src="../js/io.js"></script>
  <script src="../js/captainslog.js"></script>

  <script src="../tests/test-storage.js"></script>
  <script src="../tests/test-io.js"></script>
  <script src="../tests/test-captainslog.js"></script>

  <script> TestRunner.summary(); </script>
```

- [ ] **Step 4: Open `tests/test.html` in browser and verify all tests pass**

Open: `open "/Users/samharris/turnaround spreadsheets/tests/test.html"`  
Expected: All existing tests still pass + 9 new CaptainsLog tests pass, 0 failures.

- [ ] **Step 5: Commit**

```bash
cd "/Users/samharris/turnaround spreadsheets"
git add js/captainslog.js tests/test-captainslog.js tests/test.html
git commit -m "feat: add CaptainsLog data module + pure function tests"
```

---

## Task 3: CSS — panel and standalone styles

**Files:**
- Create: `css/captainslog.css`

- [ ] **Step 1: Create `css/captainslog.css`**

```css
/* css/captainslog.css — Captain's Log panel + standalone page styles */

/* ── Panel (inside #grid-wrapper, position:absolute like attachments) ── */

#log-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 260px;
  height: 100%;
  background: var(--bg-secondary);
  border-left: 1px solid var(--border-accent);
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.2s ease;
  z-index: 99;
}

#log-panel.open { transform: translateX(0); }

/* Header */
.log-panel-header {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-accent);
  background: var(--accent-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.log-panel-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-primary);
}

.log-shift-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

.log-shift-badge.day {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.log-shift-badge.night {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

/* Day tabs */
.log-day-tabs {
  display: flex;
  gap: 3px;
  padding: 5px 7px;
  border-bottom: 1px solid var(--border-color);
  overflow-x: auto;
  flex-shrink: 0;
  background: var(--bg-surface);
  scrollbar-width: none;
}

.log-day-tabs::-webkit-scrollbar { display: none; }

.log-day-tab {
  padding: 3px 9px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  white-space: nowrap;
  border: 1px solid transparent;
  color: var(--text-secondary);
  background: var(--bg-primary);
  cursor: pointer;
  flex-shrink: 0;
  transition: var(--transition);
}

.log-day-tab:hover {
  border-color: var(--border-color);
  color: var(--text-primary);
}

.log-day-tab.active {
  background: var(--accent-subtle);
  border-color: var(--accent-primary);
  color: var(--accent-hover);
  font-weight: 600;
}

/* Entry list */
.log-entries {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
  scrollbar-width: thin;
  scrollbar-color: var(--border-color) transparent;
}

.log-carry-label {
  font-size: 10px;
  color: var(--text-disabled);
  padding: 6px 12px 3px;
  font-style: italic;
}

.log-entry {
  display: flex;
  gap: 8px;
  padding: 6px 12px;
  border-bottom: 1px solid rgba(68, 68, 68, 0.35);
  align-items: flex-start;
}

.log-entry.faded { opacity: 0.35; }

.log-entry-stripe {
  width: 2px;
  min-height: 34px;
  border-radius: 1px;
  flex-shrink: 0;
  margin-top: 2px;
}

.log-entry-stripe.day   { background: #f59e0b; }
.log-entry-stripe.night { background: #3b82f6; }

.log-entry-inner { flex: 1; min-width: 0; }

.log-entry-meta {
  font-size: 10px;
  font-weight: 700;
  margin-bottom: 2px;
}

.log-entry-meta.day   { color: #f59e0b; }
.log-entry-meta.night { color: #3b82f6; }

.log-entry-text {
  font-size: 12px;
  color: var(--text-primary);
  line-height: 1.4;
  word-break: break-word;
}

.log-entry.faded .log-entry-text { color: var(--text-secondary); }

/* Read-only notice (past days) */
.log-readonly-notice {
  padding: 10px 14px;
  font-size: 11px;
  color: var(--text-disabled);
  font-style: italic;
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
  background: var(--bg-surface);
}

/* Compose row */
.log-compose {
  padding: 8px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-surface);
  flex-shrink: 0;
}

.log-compose-row {
  display: flex;
  gap: 5px;
  align-items: center;
}

.log-time-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 7px;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  flex-shrink: 0;
}

.log-time-badge.day {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.log-time-badge.night {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.log-initials-input {
  width: 38px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 4px 5px;
  font-size: 11px;
  color: var(--text-primary);
  text-align: center;
  text-transform: uppercase;
  font-weight: 700;
  flex-shrink: 0;
}

.log-initials-input:focus { border-color: var(--accent-primary); outline: none; }

.log-note-input {
  flex: 1;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 4px 8px;
  font-size: 12px;
  color: var(--text-primary);
  min-width: 0;
}

.log-note-input:focus { border-color: var(--accent-primary); outline: none; }

.log-add-btn {
  background: var(--accent-primary);
  border: none;
  border-radius: var(--radius-sm);
  padding: 4px 10px;
  font-size: 12px;
  color: var(--text-inverse);
  font-weight: 600;
  flex-shrink: 0;
  cursor: pointer;
  transition: var(--transition);
}

.log-add-btn:hover { background: var(--accent-hover); }

/* ── Standalone log.html ───────────────────────────────────── */

.log-standalone-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* Top bar */
.log-topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  height: 44px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.log-back-link {
  font-size: 12px;
  color: var(--text-secondary);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: var(--transition);
}

.log-back-link:hover { color: var(--accent-hover); }

.log-topbar-sep {
  width: 1px;
  height: 18px;
  background: var(--border-color);
}

.log-topbar-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.log-topbar-shift {
  margin-left: auto;
  font-size: 12px;
}

/* Body layout */
.log-standalone-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Sidebar — vertical day list */
.log-sidebar {
  width: 130px;
  flex-shrink: 0;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  padding: 10px 6px;
  gap: 2px;
  overflow-y: auto;
}

.log-sidebar-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-disabled);
  padding: 0 6px;
  margin-bottom: 6px;
}

.log-sidebar-tab {
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  border: 1px solid transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
}

.log-sidebar-tab:hover { background: var(--bg-hover); color: var(--text-primary); }

.log-sidebar-tab.active {
  background: var(--accent-subtle);
  border-color: var(--accent-primary);
  color: var(--accent-hover);
  font-weight: 600;
}

.log-sidebar-tab-count {
  font-size: 10px;
  color: var(--text-disabled);
  margin-top: 1px;
}

/* Main area */
.log-standalone-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.log-standalone-entries {
  flex: 1;
  overflow-y: auto;
  padding: 12px 0;
  scrollbar-width: thin;
  scrollbar-color: var(--border-color) transparent;
}

/* Standalone carry-over divider */
.log-standalone-carry-label {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px 10px;
  font-size: 11px;
  color: var(--text-disabled);
  font-style: italic;
}

.log-standalone-carry-label::before,
.log-standalone-carry-label::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-color);
}

/* Standalone entries — same as panel but more padding */
.log-standalone-entry {
  display: flex;
  gap: 12px;
  padding: 9px 20px;
  border-bottom: 1px solid rgba(68, 68, 68, 0.3);
  align-items: flex-start;
}

.log-standalone-entry.faded { opacity: 0.35; }

.log-standalone-stripe {
  width: 3px;
  min-height: 38px;
  border-radius: 2px;
  flex-shrink: 0;
  margin-top: 3px;
}

.log-standalone-stripe.day   { background: #f59e0b; }
.log-standalone-stripe.night { background: #3b82f6; }

.log-standalone-entry-inner { flex: 1; }

.log-standalone-entry-meta {
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 3px;
}

.log-standalone-entry-meta.day   { color: #f59e0b; }
.log-standalone-entry-meta.night { color: #3b82f6; }

.log-standalone-entry-text {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.5;
}

.log-standalone-entry.faded .log-standalone-entry-text { color: var(--text-secondary); }

/* Standalone compose */
.log-standalone-compose {
  padding: 12px 18px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-surface);
  flex-shrink: 0;
}

.log-standalone-compose-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.log-standalone-hint {
  font-size: 10px;
  color: var(--text-disabled);
  margin-top: 5px;
}
```

- [ ] **Step 2: Commit**

```bash
cd "/Users/samharris/turnaround spreadsheets"
git add css/captainslog.css
git commit -m "feat: add Captain's Log CSS for panel and standalone page"
```

---

## Task 4: Add panel HTML + toolbar button to `index.html`

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add CSS link in `<head>` after `theme.css`**

In `index.html`, after:
```html
  <link rel="stylesheet" href="css/theme.css" />
```
Add:
```html
  <link rel="stylesheet" href="css/captainslog.css" />
```

- [ ] **Step 2: Add Log toggle button to toolbar**

In `index.html`, find the toolbar separator before the Find & Replace button:
```html
    <div class="toolbar-separator"></div>
    <button class="toolbar-btn" id="btn-find-replace">Find & Replace</button>
```
Add a second separator and Log button after the Find & Replace button:
```html
    <div class="toolbar-separator"></div>
    <button class="toolbar-btn" id="btn-find-replace">Find & Replace</button>
    <div class="toolbar-separator"></div>
    <button class="toolbar-btn" id="btn-log-toggle">📋 Log ▶</button>
```

- [ ] **Step 3: Add log panel HTML inside `#grid-wrapper`**

In `index.html`, find the closing of `#grid-wrapper` (just before `<!-- Tab Bar -->`):
```html
  </div>

  <!-- Tab Bar -->
```
Insert the log panel HTML before that closing `</div>`:
```html
    <!-- Captain's Log Panel (slides in from right) -->
    <div id="log-panel">
      <div class="log-panel-header">
        <span class="log-panel-title">Captain's Log</span>
        <span class="log-shift-badge" id="log-shift-badge">☀ Day</span>
      </div>
      <div class="log-day-tabs" id="log-day-tabs"></div>
      <div class="log-entries" id="log-entries"></div>
      <div class="log-compose" id="log-compose">
        <div class="log-compose-row">
          <span class="log-time-badge day" id="log-time-badge">00:00</span>
          <input class="log-initials-input" id="log-initials" maxlength="3" placeholder="NH" />
          <input class="log-note-input" id="log-note" placeholder="Add a note…" />
          <button class="log-add-btn" id="log-add-btn">Add</button>
        </div>
      </div>
    </div>
```

- [ ] **Step 4: Add `captainslog.js` script tag**

In `index.html`, find the app modules comment and add `captainslog.js` after `storage.js`:
```html
<!-- App modules (order matters) -->
<script src="js/grid.js"></script>
<script src="js/storage.js"></script>
<script src="js/captainslog.js"></script>
<script src="js/io.js"></script>
<script src="js/findreplace.js"></script>
<script src="js/attachments.js"></script>
<script src="js/app.js"></script>
```

- [ ] **Step 5: Open `index.html` in browser and verify**

```
open "/Users/samharris/turnaround spreadsheets/index.html"
```

Expected: App loads normally. "📋 Log ▶" button visible in toolbar. Clicking it does nothing yet (init not wired). No console errors.

- [ ] **Step 6: Commit**

```bash
cd "/Users/samharris/turnaround spreadsheets"
git add index.html
git commit -m "feat: add Captain's Log panel HTML and toolbar button to index.html"
```

---

## Task 5: Panel rendering — shift badge, day tabs, entry list

**Files:**
- Modify: `js/captainslog.js`

- [ ] **Step 1: Replace the `init()` stub and add all rendering functions**

Replace the `// ── Public API (stubs — wired in later tasks) ──` section and everything below it in `js/captainslog.js` with:

```js
  // ── Rendering ──────────────────────────────────────────────

  function _updateShiftBadge() {
    const badge = document.getElementById('log-shift-badge');
    if (!badge) return;
    const shift = _getShift();
    badge.textContent = shift === 'day' ? '☀ Day' : '🌙 Night';
    badge.className   = 'log-shift-badge ' + shift;
  }

  function _renderDayTabs() {
    const container = document.getElementById('log-day-tabs');
    if (!container) return;
    const data  = _store.getAll();
    const today = _todayKey();

    // Build sorted list of days — all stored days + today
    const days = Object.keys(data).sort();
    if (days.indexOf(today) === -1) days.push(today);

    container.innerHTML = '';
    days.forEach(function (key) {
      const tab       = document.createElement('button');
      const isToday   = key === today;
      const isActive  = (_activeDay === null && isToday) || _activeDay === key;
      tab.className   = 'log-day-tab' + (isActive ? ' active' : '');
      tab.textContent = _formatDateLabel(key) + (isToday ? ' ★' : '');
      tab.addEventListener('click', function () {
        _activeDay = isToday ? null : key;
        _renderDayTabs();
        _renderEntries();
        _updateComposeArea();
      });
      container.appendChild(tab);
    });

    // Scroll active tab into view
    const activeTab = container.querySelector('.log-day-tab.active');
    if (activeTab) activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }

  function _renderEntries() {
    const container = document.getElementById('log-entries');
    if (!container) return;
    container.innerHTML = '';

    const data      = _store.getAll();
    const today     = _todayKey();
    const viewKey   = _activeDay || today;
    const isToday   = viewKey === today;

    // Carry-over: only shown when viewing today
    if (isToday) {
      const carryKey = _store.getCarryOverKey();
      if (carryKey) {
        const label = document.createElement('div');
        label.className   = 'log-carry-label';
        label.textContent = '↩ Carried from ' + _formatDateLabel(carryKey);
        container.appendChild(label);

        (data[carryKey] || []).forEach(function (entry) {
          container.appendChild(_makeEntryEl(entry, true));
        });
      }
    }

    // Today's (or selected day's) entries
    (data[viewKey] || []).forEach(function (entry) {
      container.appendChild(_makeEntryEl(entry, false));
    });

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  }

  function _makeEntryEl(entry, faded) {
    const shiftIcon = entry.shift === 'day' ? '☀' : '🌙';
    const row       = document.createElement('div');
    row.className   = 'log-entry' + (faded ? ' faded' : '');

    const stripe    = document.createElement('div');
    stripe.className = 'log-entry-stripe ' + entry.shift;

    const inner     = document.createElement('div');
    inner.className = 'log-entry-inner';

    const meta      = document.createElement('div');
    meta.className  = 'log-entry-meta ' + entry.shift;
    meta.textContent = shiftIcon + ' ' + entry.time + ' · ' + entry.initials;

    const text      = document.createElement('div');
    text.className  = 'log-entry-text';
    text.textContent = entry.text;

    inner.appendChild(meta);
    inner.appendChild(text);
    row.appendChild(stripe);
    row.appendChild(inner);
    return row;
  }

  function _updateComposeArea() {
    const compose = document.getElementById('log-compose');
    if (!compose) return;
    const today   = _todayKey();
    const viewKey = _activeDay || today;

    if (viewKey !== today) {
      // Past day — show read-only notice instead of compose row
      compose.innerHTML = '<div class="log-readonly-notice">Viewing ' +
        _formatDateLabel(viewKey) + ' — entries are read-only</div>';
    } else {
      // Restore compose row if it was replaced
      if (!document.getElementById('log-note')) {
        compose.innerHTML =
          '<div class="log-compose-row">' +
          '<span class="log-time-badge day" id="log-time-badge">00:00</span>' +
          '<input class="log-initials-input" id="log-initials" maxlength="3" placeholder="NH" />' +
          '<input class="log-note-input" id="log-note" placeholder="Add a note…" />' +
          '<button class="log-add-btn" id="log-add-btn">Add</button>' +
          '</div>';
        _wireComposeRow();
      }
      _updateTimeBadge();
    }
  }

  // ── Time badge ─────────────────────────────────────────────

  function _updateTimeBadge() {
    const badge = document.getElementById('log-time-badge');
    if (!badge) return;
    const shift      = _getShift();
    badge.textContent = _formatTime(new Date());
    badge.className   = 'log-time-badge ' + shift;
  }

  function _startClock() {
    _updateTimeBadge();
    _clockTimer = setInterval(function () {
      _updateTimeBadge();
      _updateShiftBadge();
    }, 60000);
  }

  // ── Compose row wiring ─────────────────────────────────────

  function _wireComposeRow() {
    const noteInput = document.getElementById('log-note');
    const addBtn    = document.getElementById('log-add-btn');
    if (!noteInput || !addBtn) return;

    function _submit() {
      const initials = (document.getElementById('log-initials').value || '').trim().toUpperCase();
      const text     = noteInput.value.trim();
      if (!text) return;

      const entry = {
        time:     _formatTime(new Date()),
        initials: initials || '??',
        text:     text,
        shift:    _getShift(),
      };

      _store.addEntry(entry);
      noteInput.value = '';
      _renderDayTabs();
      _renderEntries();
    }

    noteInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); _submit(); }
    });
    addBtn.addEventListener('click', _submit);
  }

  // ── Toggle / open / close ──────────────────────────────────

  function toggle() {
    const panel = document.getElementById('log-panel');
    if (!panel) return;
    if (panel.classList.contains('open')) {
      close();
    } else {
      open();
    }
  }

  function open() {
    const panel = document.getElementById('log-panel');
    const btn   = document.getElementById('btn-log-toggle');
    if (!panel) return;
    panel.classList.add('open');
    if (btn) { btn.textContent = '📋 Log ◀'; btn.classList.add('active'); }
    _activeDay = null;
    _renderDayTabs();
    _renderEntries();
    _updateComposeArea();
    const initials = document.getElementById('log-initials');
    if (initials) initials.focus();
  }

  function close() {
    const panel = document.getElementById('log-panel');
    const btn   = document.getElementById('btn-log-toggle');
    if (!panel) return;
    panel.classList.remove('open');
    if (btn) { btn.textContent = '📋 Log ▶'; btn.classList.remove('active'); }
  }

  // ── Init ───────────────────────────────────────────────────

  function init() {
    _updateShiftBadge();
    _renderDayTabs();
    _renderEntries();
    _updateComposeArea();
    _wireComposeRow();
    _startClock();

    const toggleBtn = document.getElementById('btn-log-toggle');
    if (toggleBtn) toggleBtn.addEventListener('click', toggle);
  }

  return {
    init, toggle, open, close,
    // Exported for tests:
    _todayKey, _getShift, _formatTime, _formatDateLabel, _store,
  };
```

- [ ] **Step 2: Wire `init()` call in `js/app.js`**

In `js/app.js`, inside `document.addEventListener('DOMContentLoaded', () => {`, after step 4 (Wire attachments):

```js
  // 4. Wire attachments
  window.App.Attachments.init();

  // 5. Wire Captain's Log
  if (window.App.CaptainsLog) window.App.CaptainsLog.init();
```

Then renumber the subsequent steps (6, 7, 8) accordingly.

- [ ] **Step 3: Open `index.html` and verify panel works**

```
open "/Users/samharris/turnaround spreadsheets/index.html"
```

Expected:
- "📋 Log ▶" button visible in toolbar
- Clicking button slides log panel in from right; button changes to "📋 Log ◀"
- Shift badge shows ☀ Day or 🌙 Night based on current time
- Time badge in compose row shows current time
- Day tabs show today's tab with ★
- Type initials + note, press Enter → entry appears with correct colour stripe
- Click a past day tab → compose area shows read-only notice
- Click today tab → compose row restored

- [ ] **Step 4: Run tests and verify they still pass**

```
open "/Users/samharris/turnaround spreadsheets/tests/test.html"
```
Expected: All 9 CaptainsLog tests pass, all existing tests pass.

- [ ] **Step 5: Commit**

```bash
cd "/Users/samharris/turnaround spreadsheets"
git add js/captainslog.js js/app.js
git commit -m "feat: implement Captain's Log panel — rendering, compose, toggle"
```

---

## Task 6: Standalone `log.html` page

**Files:**
- Create: `log.html`

- [ ] **Step 1: Create `log.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Captain's Log — Turnaround Spreadsheets</title>
  <link rel="stylesheet" href="css/theme.css" />
  <link rel="stylesheet" href="css/captainslog.css" />
</head>
<body>
<div class="log-standalone-page">

  <!-- Top bar -->
  <div class="log-topbar">
    <a class="log-back-link" href="index.html">← Back to Spreadsheet</a>
    <div class="log-topbar-sep"></div>
    <span class="log-topbar-title">Captain's Log</span>
    <span class="log-shift-badge day log-topbar-shift" id="sa-shift-badge">☀ Day</span>
  </div>

  <!-- Body -->
  <div class="log-standalone-body">

    <!-- Sidebar: vertical day list -->
    <div class="log-sidebar" id="sa-sidebar">
      <div class="log-sidebar-label">Days</div>
    </div>

    <!-- Main area -->
    <div class="log-standalone-main">
      <div class="log-standalone-entries" id="sa-entries"></div>
      <div class="log-standalone-compose" id="sa-compose">
        <div class="log-standalone-compose-row">
          <span class="log-time-badge day" id="sa-time-badge">00:00</span>
          <input class="log-initials-input" id="sa-initials" maxlength="3" placeholder="NH" />
          <input class="log-note-input" id="sa-note" placeholder="Add a note and press Enter…" style="flex:1" />
          <button class="log-add-btn" id="sa-add-btn">Add</button>
        </div>
        <div class="log-standalone-hint">Press Enter to submit · Time auto-updates · Shift colour applied automatically</div>
      </div>
    </div>

  </div>
</div>

<script src="js/captainslog.js"></script>
<script>
  // Standalone page init — uses same _store and pure functions,
  // but drives its own DOM elements (sa-* prefix)
  (function () {
    const CL       = window.App.CaptainsLog;
    let _activeDay = null;   // null = today

    function _updateShiftBadge() {
      const badge = document.getElementById('sa-shift-badge');
      if (!badge) return;
      const shift      = CL._getShift();
      badge.textContent = shift === 'day' ? '☀ Day shift — ' + _todayLabel() : '🌙 Night shift — ' + _todayLabel();
      badge.className   = 'log-shift-badge ' + shift + ' log-topbar-shift';
    }

    function _todayLabel() {
      return CL._formatDateLabel(CL._todayKey()) + ', ' + new Date().getFullYear();
    }

    function _renderSidebar() {
      const sidebar = document.getElementById('sa-sidebar');
      if (!sidebar) return;
      const data  = CL._store.getAll();
      const today = CL._todayKey();
      const days  = Object.keys(data).sort();
      if (days.indexOf(today) === -1) days.push(today);

      // Keep the label, rebuild tabs
      sidebar.innerHTML = '<div class="log-sidebar-label">Days</div>';
      days.forEach(function (key) {
        const isToday  = key === today;
        const isActive = (_activeDay === null && isToday) || _activeDay === key;
        const count    = (data[key] || []).length;
        const tab      = document.createElement('div');
        tab.className  = 'log-sidebar-tab' + (isActive ? ' active' : '');
        tab.innerHTML  =
          '<div>' + CL._formatDateLabel(key) + (isToday ? ' ★' : '') + '</div>' +
          '<div class="log-sidebar-tab-count">' + count + (count === 1 ? ' entry' : ' entries') + '</div>';
        tab.addEventListener('click', function () {
          _activeDay = isToday ? null : key;
          _renderSidebar();
          _renderEntries();
          _updateComposeArea();
        });
        sidebar.appendChild(tab);
      });
    }

    function _renderEntries() {
      const container = document.getElementById('sa-entries');
      if (!container) return;
      container.innerHTML = '';

      const data    = CL._store.getAll();
      const today   = CL._todayKey();
      const viewKey = _activeDay || today;
      const isToday = viewKey === today;

      if (isToday) {
        const carryKey = CL._store.getCarryOverKey();
        if (carryKey) {
          const label       = document.createElement('div');
          label.className   = 'log-standalone-carry-label';
          label.textContent = 'Carried from ' + CL._formatDateLabel(carryKey);
          container.appendChild(label);
          (data[carryKey] || []).forEach(function (e) { container.appendChild(_makeEl(e, true)); });
        }
      }

      (data[viewKey] || []).forEach(function (e) { container.appendChild(_makeEl(e, false)); });
      container.scrollTop = container.scrollHeight;
    }

    function _makeEl(entry, faded) {
      const icon = entry.shift === 'day' ? '☀' : '🌙';
      const row  = document.createElement('div');
      row.className = 'log-standalone-entry' + (faded ? ' faded' : '');

      const stripe = document.createElement('div');
      stripe.className = 'log-standalone-stripe ' + entry.shift;

      const inner = document.createElement('div');
      inner.className = 'log-standalone-entry-inner';

      const meta = document.createElement('div');
      meta.className   = 'log-standalone-entry-meta ' + entry.shift;
      meta.textContent = icon + ' ' + entry.time + '  ·  ' + entry.initials;

      const text = document.createElement('div');
      text.className   = 'log-standalone-entry-text';
      text.textContent = entry.text;

      inner.appendChild(meta);
      inner.appendChild(text);
      row.appendChild(stripe);
      row.appendChild(inner);
      return row;
    }

    function _updateComposeArea() {
      const compose = document.getElementById('sa-compose');
      if (!compose) return;
      const today   = CL._todayKey();
      const viewKey = _activeDay || today;
      const noteEl  = document.getElementById('sa-note');

      if (viewKey !== today) {
        compose.innerHTML = '<div class="log-readonly-notice">Viewing ' +
          CL._formatDateLabel(viewKey) + ' — entries are read-only</div>';
      } else {
        if (!noteEl) {
          compose.innerHTML =
            '<div class="log-standalone-compose-row">' +
            '<span class="log-time-badge day" id="sa-time-badge">00:00</span>' +
            '<input class="log-initials-input" id="sa-initials" maxlength="3" placeholder="NH" />' +
            '<input class="log-note-input" id="sa-note" placeholder="Add a note and press Enter…" style="flex:1" />' +
            '<button class="log-add-btn" id="sa-add-btn">Add</button>' +
            '</div>' +
            '<div class="log-standalone-hint">Press Enter to submit · Time auto-updates · Shift colour applied automatically</div>';
          _wireCompose();
        }
        _updateTimeBadge();
      }
    }

    function _updateTimeBadge() {
      const badge = document.getElementById('sa-time-badge');
      if (!badge) return;
      const shift      = CL._getShift();
      badge.textContent = CL._formatTime(new Date());
      badge.className   = 'log-time-badge ' + shift;
    }

    function _wireCompose() {
      const noteInput = document.getElementById('sa-note');
      const addBtn    = document.getElementById('sa-add-btn');
      if (!noteInput || !addBtn) return;

      function _submit() {
        const initials = (document.getElementById('sa-initials').value || '').trim().toUpperCase();
        const text     = noteInput.value.trim();
        if (!text) return;
        CL._store.addEntry({
          time:     CL._formatTime(new Date()),
          initials: initials || '??',
          text:     text,
          shift:    CL._getShift(),
        });
        noteInput.value = '';
        _renderSidebar();
        _renderEntries();
      }

      noteInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); _submit(); }
      });
      addBtn.addEventListener('click', _submit);
    }

    // Boot
    _updateShiftBadge();
    _renderSidebar();
    _renderEntries();
    _updateComposeArea();
    setInterval(function () { _updateTimeBadge(); _updateShiftBadge(); }, 60000);
    const initEl = document.getElementById('sa-initials');
    if (initEl) initEl.focus();

  }());
</script>
</body>
</html>
```

- [ ] **Step 2: Open `log.html` and verify it works**

```
open "/Users/samharris/turnaround spreadsheets/log.html"
```

Expected:
- Full-page layout: top bar with "← Back to Spreadsheet" link + shift badge
- Left sidebar shows day tabs with entry counts
- Main area shows entries (with carry-over if prior days exist)
- Adding an entry works; entry appears and sidebar count updates
- "← Back to Spreadsheet" navigates to `index.html`
- Any entries added in `log.html` appear when you open the Log panel in `index.html` (same localStorage key)

- [ ] **Step 3: Commit**

```bash
cd "/Users/samharris/turnaround spreadsheets"
git add log.html
git commit -m "feat: add standalone log.html Captain's Log page"
```

---

## Task 7: Update CLAUDE.md + push for review

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add Captain's Log to CLAUDE.md session notes and module table**

In `CLAUDE.md`, add `captainslog.js` to the Key modules table:

```markdown
| `js/captainslog.js` | Captain's Log IIFE — data store, panel rendering, compose logic |
```

Add `captainslog.css` to the libs section:
```markdown
- `css/captainslog.css` — Captain's Log panel + standalone page styles
```

Add to localStorage keys:
```markdown
- `turnaround_captains_log` — Captain's Log entries (object keyed by YYYY-MM-DD date strings)
```

Add to Session Notes:
```markdown
### 2026-04-21 (continued)
- Designed and implemented Captain's Log feature
- Right-side panel (toggle via toolbar) + standalone `log.html` page
- Shift-aware colour coding: amber day (6am–6pm), blue night
- Append-only entries with day carry-over; localStorage-backed data store
```

- [ ] **Step 2: Commit and push branch**

```bash
cd "/Users/samharris/turnaround spreadsheets"
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with Captain's Log module and session notes"
```

Then ask user before pushing:
> "Ready to push `feature/captains-log` to GitHub and open a PR to main. Shall I proceed?"

---

## Self-Review Checklist

| Spec requirement | Covered in |
|-----------------|------------|
| Right-side panel, toggleable | Task 4 (HTML), Task 5 (toggle logic) |
| Standalone `log.html` page | Task 6 |
| Auto-prefix compose row: time · initials · note · Add | Task 5 (`_wireComposeRow`) |
| Initials typed fresh per entry | Task 5 (no stored profile) |
| Amber day / blue night colour coding | Task 3 (CSS), Task 5 (entry rendering) |
| Shift determined at write time | Task 5 (`_submit` calls `_getShift()`) |
| Day tabs, scrollable, today ★ | Task 5 (`_renderDayTabs`) |
| Carry-over from most recent prior day, faded | Task 5 (`_renderEntries`) |
| Past day = read-only compose area | Task 5 (`_updateComposeArea`) |
| Time badge updates every minute | Task 5 (`_startClock`) |
| localStorage key `turnaround_captains_log` | Task 2 (`STORAGE_KEY`) |
| Data layer isolated (`_store`) | Task 2 |
| No editing of existing entries | Append-only — no edit UI |
| `log.html` loads only theme + captainslog assets | Task 6 |
| `log.html` ← Back to Spreadsheet link | Task 6 |
| Tests for pure functions | Task 2 |
