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
