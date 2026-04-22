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

  // 4. Wire attachments (disabled — panel commented out in index.html)
  // window.App.Attachments.init();

  // 5. Wire Captain's Log
  if (window.App.CaptainsLog) window.App.CaptainsLog.init();

  // 6. Wire formula bar → grid
  document.getElementById('formula-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const cellRef = document.getElementById('cell-ref').value;
      const value   = e.target.value;
      // Parse cell ref (e.g. "B3") and set the cell value in the grid data
      const col = cellRef.match(/[A-Z]+/)?.[0] || 'A';
      const row = parseInt(cellRef.match(/\d+/)?.[0] || '1', 10);
      const ci  = col.split('').reduce((acc, c) => acc * 26 + c.charCodeAt(0) - 64, 0) - 1;
      const ri  = row - 1;
      const data = JSON.parse(JSON.stringify(window.App.Grid.getData()));
      const si   = window.App.Grid.getActiveSheet();
      if (!data[si].rows) data[si].rows = {};
      if (!data[si].rows[ri]) data[si].rows[ri] = { cells: {} };
      if (!data[si].rows[ri].cells) data[si].rows[ri].cells = {};
      data[si].rows[ri].cells[ci] = { text: value };
      window.App.Grid.loadData(data);
      window.App.Storage.onDataChanged();
      e.target.blur();
    }
  });

  // 7. Wire toolbar dropdowns
  _initDropdowns();

  // 8. Wire toolbar actions
  _initActions();

  // 9. Wire keyboard shortcuts
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
        localStorage.removeItem('turnaround_attachments');
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

function _triggerFormatKey(key) {
  const xs = window.App.Grid.getInstance();
  if (!xs || !xs.sheet || !xs.sheet.el || !xs.sheet.el.el) return;
  const el = xs.sheet.el.el;
  el.focus();
  el.dispatchEvent(new KeyboardEvent('keydown', {
    key: key,
    ctrlKey: true,
    bubbles: true,
    cancelable: true,
  }));
}

function _setAlign(align) {
  const xs = window.App.Grid.getInstance();
  if (!xs) return;
  try { xs.sheet.selector.setStyle('align', align); xs.reRender(); } catch (e) {
    console.warn('setAlign failed:', e);
  }
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
