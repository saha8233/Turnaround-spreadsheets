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
