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
    const result = Papa.parse(csvString, { delimiter: delim, skipEmptyLines: true });
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
    return Papa.unparse(matrix, { delimiter: delim });
  }

  // Convert ARGB hex string (e.g. 'FF7C3AED') → '#7c3aed', or null if not usable
  function _argbToHex(argb) {
    if (!argb || typeof argb !== 'string') return null;
    const rgb = argb.length === 8 ? argb.slice(2) : argb;
    if (!/^[0-9a-fA-F]{6}$/.test(rgb)) return null;
    return '#' + rgb.toLowerCase();
  }

  // Convert '#7c3aed' → 'FF7C3AED'
  function _hexToArgb(hex) {
    return 'FF' + hex.replace('#', '').toUpperCase();
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
        // Value
        if (typeof text === 'string' && text.startsWith('=')) {
          wsCell.value = { formula: text.slice(1) };
        } else if (!isNaN(text) && text !== '') {
          wsCell.value = Number(text);
        } else {
          wsCell.value = text;
        }
        // Formatting
        if (cell.style) {
          const s = cell.style;
          const font = {};
          if (s.font && s.font.bold)   font.bold   = true;
          if (s.font && s.font.italic) font.italic = true;
          if (s.underline)             font.underline = true;
          if (s.color)                 font.color  = { argb: _hexToArgb(s.color) };
          if (Object.keys(font).length > 0) wsCell.font = font;
          if (s.bgcolor) {
            wsCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: _hexToArgb(s.bgcolor) } };
          }
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
        if (cell.value && typeof cell.value === 'object' && cell.value.formula) {
          text = '=' + cell.value.formula;
        } else if (cell.formula) {
          text = '=' + cell.formula;
        } else if (cell.value !== null && cell.value !== undefined) {
          text = String(cell.value);
        }

        // Build style object from ExcelJS formatting
        const style = {};
        const font  = {};
        if (cell.font) {
          if (cell.font.bold)      font.bold   = true;
          if (cell.font.italic)    font.italic = true;
          if (cell.font.underline) style.underline = true;
          if (cell.font.color) {
            const c = _argbToHex(cell.font.color.argb);
            if (c) style.color = c;
          }
        }
        if (Object.keys(font).length > 0) style.font = font;
        if (cell.fill && cell.fill.type === 'pattern' && cell.fill.fgColor) {
          const c = _argbToHex(cell.fill.fgColor.argb);
          if (c) style.bgcolor = c;
        }

        const hasStyle = Object.keys(style).length > 0;
        if (text !== '' || hasStyle) {
          cells[ci] = { text, ...(hasStyle ? { style } : {}) };
        }
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
    const current = JSON.parse(JSON.stringify(window.App.Grid.getData()));
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
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return {
    importFile,
    exportCsv, exportTsv, exportJson, exportXlsx, exportOds, exportPdf,
    // Exported for tests:
    _csvToRows, _rowsToCsv,
  };
}());
