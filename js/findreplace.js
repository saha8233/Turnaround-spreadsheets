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
    // Switch sheet if needed, using public API to keep activeSheetIndex in sync
    if (match.sheetIndex !== window.App.Grid.getActiveSheet()) {
      window.App.Grid.switchSheet(match.sheetIndex);
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
    const data        = JSON.parse(JSON.stringify(window.App.Grid.getData()));
    const sheet       = data[match.sheetIndex];
    if (sheet && sheet.rows && sheet.rows[match.ri] && sheet.rows[match.ri].cells) {
      sheet.rows[match.ri].cells[match.ci].text = replaceWith;
      window.App.Grid.loadData(data);
      window.App.Storage.onDataChanged();
    }
    findNext();
  }

  function replaceAll() {
    _search();
    if (matches.length === 0) return;
    const { needle, matchCase, wholeCell } = _getOptions();
    const replaceWith = document.getElementById('replace-input').value;
    const data        = JSON.parse(JSON.stringify(window.App.Grid.getData()));
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
