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
