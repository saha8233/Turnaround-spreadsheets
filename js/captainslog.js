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
    const d = new Date();
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return y + '-' + mo + '-' + da;
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

  // ── Rendering ──────────────────────────────────────────────

  function _updateShiftBadge() {
    const badge = document.getElementById('log-shift-badge');
    if (!badge) return;
    const shift      = _getShift();
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
      const tab      = document.createElement('button');
      const isToday  = key === today;
      const isActive = (_activeDay === null && isToday) || _activeDay === key;
      tab.className  = 'log-day-tab' + (isActive ? ' active' : '');
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

    const data    = _store.getAll();
    const today   = _todayKey();
    const viewKey = _activeDay || today;
    const isToday = viewKey === today;

    // Carry-over: only shown when viewing today
    if (isToday) {
      const carryKey = _store.getCarryOverKey();
      if (carryKey) {
        const label       = document.createElement('div');
        label.className   = 'log-carry-label';
        label.textContent = '↩ Carried from ' + _formatDateLabel(carryKey);
        container.appendChild(label);

        (data[carryKey] || []).forEach(function (entry) {
          container.appendChild(_makeEntryEl(entry, true));
        });
      }
    }

    // Selected day's entries
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
    if (_clockTimer) return;  // guard against double-init
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
    // Wire the compose row that is pre-rendered in index.html static markup.
    // _updateComposeArea only wires when it rebuilds the DOM (after past-day view);
    // on first load #log-note already exists so we wire here explicitly.
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

}());
