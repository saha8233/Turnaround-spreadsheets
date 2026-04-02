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
    if (window.App.Storage) window.App.Storage.onDataChanged();
  }

  function renderTabs() {
    if (!xs) return;
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
    try {
      xs.sheet.resetData(xs.datas[index]);
    } catch (e) { xs.reRender && xs.reRender(); }
    renderTabs();
  }

  function addSheet() {
    const data = xs.getData();
    const name = 'Sheet' + (data.length + 1);
    const newData = [...data, { name, rows: {} }];
    xs.loadData(newData);
    switchSheet(newData.length - 1);
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
  function loadData(data) {
    if (!xs) return;
    xs.loadData(data);
    // Clamp active sheet index in case new data has fewer sheets
    if (!xs.datas || activeSheetIndex >= xs.datas.length) activeSheetIndex = 0;
    try {
      xs.sheet.resetData(xs.datas[activeSheetIndex]);
    } catch (e) { /* sheet reselect failed — x-spreadsheet will default to sheet 0 */ }
    renderTabs();
  }
  function getActiveSheet()    { return activeSheetIndex; }

  return { init, getInstance, getData, loadData, getActiveSheet, renderTabs, switchSheet };
}());
