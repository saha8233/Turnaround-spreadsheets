// tests/test-io.js

(function () {
  const { assert, assertEquals, runSuite } = window.TestRunner;

  runSuite('IO — CSV conversion', [

    function test_csvToRows_basic() {
      const rows = App.IO._csvToRows('Name,Age\nAlice,30\nBob,25');
      assertEquals(rows[0].cells[0].text, 'Name',  'header col 0');
      assertEquals(rows[0].cells[1].text, 'Age',   'header col 1');
      assertEquals(rows[1].cells[0].text, 'Alice', 'data row col 0');
      assertEquals(rows[2].cells[1].text, '25',    'data row col 1');
    },

    function test_csvToRows_empty_string_returns_empty() {
      const rows = App.IO._csvToRows('');
      assert(Object.keys(rows).length === 0, 'empty CSV yields empty rows');
    },

    function test_rowsToCsv_basic() {
      const rows = {
        0: { cells: { 0: { text: 'A' }, 1: { text: 'B' } } },
        1: { cells: { 0: { text: '1' }, 1: { text: '2' } } },
      };
      const csv = App.IO._rowsToCsv(rows, ',');
      assert(csv.includes('A,B'), 'first row in CSV');
      assert(csv.includes('1,2'), 'second row in CSV');
    },

    function test_rowsToCsv_tsv_delimiter() {
      const rows = { 0: { cells: { 0: { text: 'X' }, 1: { text: 'Y' } } } };
      const tsv = App.IO._rowsToCsv(rows, '\t');
      assert(tsv.includes('X\tY'), 'TSV uses tab delimiter');
    },

  ]);
}());
