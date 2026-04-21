# Captain's Log — Design Spec
**Date:** 2026-04-21  
**Status:** Approved

---

## Overview

A shift-aware, append-only log panel embedded in the Turnaround Spreadsheets app. Entries are timestamped and colour-coded by shift automatically. Each day carries over the previous day's entries in a faded state for context. Data lives in localStorage now, with the data layer isolated for a clean backend swap later.

---

## Decisions

| Decision | Choice |
|----------|--------|
| Placement | Right side panel (toggleable) + standalone `log.html` page |
| Entry format | Single-line compose row: `[time badge] [initials] [note] [Add]` |
| Initials | Typed fresh per entry (no stored user profile) |
| Day shift colour | Amber `#f59e0b` (06:00–17:59) |
| Night shift colour | Blue `#3b82f6` (18:00–05:59) |
| Shift boundaries | Hardcoded 6am–6pm for now — configurable in a future iteration |
| Day navigation | Scrollable horizontal day tabs; today marked ★ |
| Carry-over | Previous day's entries shown faded at top of today's view |
| Editing | Append-only — entries are immutable once added |
| Storage | localStorage (`turnaround_captains_log`) — data layer isolated for future backend |
| Reset | Not implemented in this iteration |
| Real-time sync | Not implemented — localStorage only; Firebase planned for a future phase |

---

## Architecture

### New files
```
js/captainslog.js       — window.App.CaptainsLog IIFE module
css/captainslog.css     — panel + standalone page styles
log.html                — standalone full-page Captain's Log
```

### Modified files
```
index.html              — add Log panel HTML, load captainslog.css + captainslog.js,
                          add "Log ◀/▶" toggle button to toolbar
```

### Module pattern
`captainslog.js` follows the existing IIFE pattern (`window.App = window.App || {}`).  
Load order in `index.html`: after `grid.js`, before `app.js`.

### Data layer isolation
All read/write operations go through a single internal `_store` object inside `captainslog.js`. To swap localStorage for a real backend, only `_store` changes — the UI layer is unaffected.

---

## Data Model

**localStorage key:** `turnaround_captains_log`

```json
{
  "2026-04-21": [
    {
      "time": "08:14",
      "initials": "NH",
      "text": "Valve check complete — Unit 3 signed off",
      "shift": "day"
    },
    {
      "time": "19:45",
      "initials": "JB",
      "text": "Night crew on site",
      "shift": "night"
    }
  ],
  "2026-04-22": []
}
```

- Keys are ISO date strings `YYYY-MM-DD`
- `shift` is determined at write time: `"day"` if hour is 6–17, `"night"` otherwise
- Entries are ordered by insertion (append-only, no re-sorting)
- Missing keys = no entries for that day (not an error)

---

## UI — Side Panel (in `index.html`)

### Toggle
- "📋 Log ▶" button in the toolbar (right side, after the separator)
- Clicking toggles the panel open/closed — same pattern as the Attachments panel
- Button text flips to "📋 Log ◀" when open

### Panel structure
```
┌─────────────────────────────────┐
│ Captain's Log        ☀ Day      │  ← header: title + live shift badge
├─────────────────────────────────┤
│ Apr 19 │ Apr 20 │ Apr 21 ★     │  ← scrollable day tabs
├─────────────────────────────────┤
│ ↩ Carried from Apr 20           │  ← faded carry-over label
│ 🌙 22:10 · JB  (faded)          │
│   Night crew on site            │
├─────────────────────────────────┤
│ ☀ 07:02 · NH                    │  ← today's entries (full colour)
│   Day crew on, handoff done     │
│ ☀ 08:14 · NH                    │
│   Valve check complete          │
├─────────────────────────────────┤
│ [11:32] [NH] [note input] [Add] │  ← compose row
└─────────────────────────────────┘
```

### Compose row behaviour
- **Time badge**: shows current time (`HH:MM`), updates every minute via `setInterval`
- **Initials field**: 3-char max, auto-uppercased, focused on panel open
- **Note input**: free text, no length limit enforced
- **Submit**: Enter key on note input OR clicking Add button
- On submit: entry written to store, list re-rendered, note input cleared, initials retained

### Day tabs
- One tab per calendar day that has at least one entry, plus today (always shown)
- Sorted oldest → newest, scrollable horizontally
- Today tab always has ★ suffix
- Clicking a past day shows that day's entries (read-only — compose row disabled with a note)
- New day tab created automatically on the first entry of a new calendar day

### Carry-over behaviour
- When viewing today: the **last day with entries** has its entries prepended, faded (opacity 0.35), above a "↩ Carried from [date]" divider
- When viewing a past day: no carry-over shown — just that day's entries
- Carry-over is display-only — no data is duplicated in storage

---

## UI — Standalone `log.html`

A self-contained page for users who want to focus solely on the log during a shift.

### Layout
```
┌──────────────────────────────────────────────────────┐
│ ← Back to Spreadsheet  │  Captain's Log   ☀ Day shift — Apr 21, 2026 │
├────────────┬─────────────────────────────────────────┤
│  Days      │                                         │
│  Apr 19    │  ── Carried from Apr 20 ──              │
│  3 entries │  🌙 22:10 · JB  (faded)                 │
│  Apr 20    │    Night crew on site                   │
│  5 entries │                                         │
│  Apr 21 ★  │  ☀ 07:02 · NH                           │
│  3 entries │    Day crew on, handoff complete         │
│            │  ☀ 08:14 · NH                           │
│            │    Valve check complete                  │
│            ├─────────────────────────────────────────┤
│            │ [11:32] [NH] [Add a note…]  [Add]       │
│            │ Press Enter · Time auto-updates          │
└────────────┴─────────────────────────────────────────┘
```

- **Left sidebar**: vertical list of day tabs with entry counts
- **Main area**: entry list + compose row (same behaviour as panel)
- **"← Back to Spreadsheet"**: links to `index.html`
- Reads/writes the same localStorage key — stays in sync with the main app on the same machine
- `log.html` loads: `css/theme.css`, `css/captainslog.css`, `js/captainslog.js` only (no grid, no xspreadsheet)

---

## Behaviour Details

### Shift detection
```js
function _getShift() {
  const h = new Date().getHours(); // 0–23
  return (h >= 6 && h < 18) ? 'day' : 'night';
}
```

### Today's date key
```js
function _todayKey() {
  return new Date().toISOString().slice(0, 10); // "2026-04-21"
}
```

### Carry-over source
The most recent day key before today that has at least one entry. If no prior days exist, carry-over section is hidden entirely.

### Past day view (read-only)
When a day tab other than today is active, the compose row is replaced with:  
`"Viewing [date] — entries are read-only"` in muted text.

---

## Out of Scope (this iteration)
- Shift time configurability (hardcoded 6am–6pm)
- Real-time sync / backend
- Editing or deleting existing entries
- Export of log entries
- Reset / archive functionality
- User profiles or stored initials
