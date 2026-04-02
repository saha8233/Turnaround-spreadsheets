// tests/test-storage.js
// Loaded by tests/test.html — tests pure serialization functions only

(function () {
  const { assert, assertEquals, runSuite } = window.TestRunner;

  runSuite('Storage — serialize/deserialize', [

    function test_serialize_returns_json_string() {
      const data = [{ name: 'Sheet1', rows: { 0: { cells: { 0: { text: 'Hello' } } } } }];
      const result = App.Storage._serialize(data);
      assert(typeof result === 'string', 'serialize returns a string');
      assert(result.includes('Hello'), 'serialized string contains cell text');
    },

    function test_deserialize_roundtrips_data() {
      const data = [{ name: 'Test', rows: { 1: { cells: { 2: { text: '42' } } } } }];
      const json = App.Storage._serialize(data);
      const result = App.Storage._deserialize(json);
      assertEquals(result[0].name, 'Test', 'sheet name preserved');
      assertEquals(result[0].rows[1].cells[2].text, '42', 'cell text preserved');
    },

    function test_deserialize_invalid_json_returns_null() {
      const result = App.Storage._deserialize('not valid json {{');
      assertEquals(result, null, 'invalid JSON returns null');
    },

    function test_deserialize_wrong_shape_returns_null() {
      const result = App.Storage._deserialize('"just a string"');
      assertEquals(result, null, 'non-array JSON returns null');
    },

  ]);
}());
