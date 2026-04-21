// tests/test-captainslog.js
(function () {
  const { assert, assertEquals, runSuite } = window.TestRunner;

  runSuite('CaptainsLog — pure functions', [

    function test_todayKey_format() {
      const key = App.CaptainsLog._todayKey();
      assert(/^\d{4}-\d{2}-\d{2}$/.test(key), '_todayKey returns YYYY-MM-DD');
    },

    function test_getShift_returns_day_or_night() {
      const shift = App.CaptainsLog._getShift();
      assert(shift === 'day' || shift === 'night', '_getShift returns day or night');
    },

    function test_formatTime_pads_hours_and_minutes() {
      const d = new Date(2026, 3, 21, 8, 5); // 08:05
      assertEquals(App.CaptainsLog._formatTime(d), '08:05', 'pads single-digit hour and minute');
    },

    function test_formatTime_handles_noon() {
      const d = new Date(2026, 3, 21, 12, 30);
      assertEquals(App.CaptainsLog._formatTime(d), '12:30', 'noon formatted correctly');
    },

    function test_formatDateLabel_converts_key() {
      assertEquals(App.CaptainsLog._formatDateLabel('2026-04-21'), 'Apr 21', 'April key');
      assertEquals(App.CaptainsLog._formatDateLabel('2026-01-05'), 'Jan 5',  'January key');
      assertEquals(App.CaptainsLog._formatDateLabel('2026-12-31'), 'Dec 31', 'December key');
    },

  ]);

  runSuite('CaptainsLog — store', [

    function test_addEntry_persists_to_localStorage() {
      localStorage.removeItem('turnaround_captains_log');
      const entry = { time: '09:00', initials: 'NH', text: 'Test entry', shift: 'day' };
      App.CaptainsLog._store.addEntry(entry);
      const data = App.CaptainsLog._store.getAll();
      const today = App.CaptainsLog._todayKey();
      assert(Array.isArray(data[today]), 'today key exists and is array');
      assertEquals(data[today][0].text, 'Test entry', 'entry text stored correctly');
      assertEquals(data[today][0].initials, 'NH', 'initials stored correctly');
      localStorage.removeItem('turnaround_captains_log');
    },

    function test_getAll_returns_empty_object_when_no_data() {
      localStorage.removeItem('turnaround_captains_log');
      const data = App.CaptainsLog._store.getAll();
      assertEquals(typeof data, 'object', 'returns object');
      assertEquals(Object.keys(data).length, 0, 'empty when nothing stored');
    },

    function test_getCarryOverKey_returns_most_recent_prior_day() {
      localStorage.removeItem('turnaround_captains_log');
      const seed = {
        '2020-01-01': [{ time: '08:00', initials: 'A', text: 'old', shift: 'day' }],
        '2020-01-02': [{ time: '09:00', initials: 'B', text: 'newer', shift: 'day' }],
      };
      localStorage.setItem('turnaround_captains_log', JSON.stringify(seed));
      const key = App.CaptainsLog._store.getCarryOverKey();
      assertEquals(key, '2020-01-02', 'returns most recent past day with entries');
      localStorage.removeItem('turnaround_captains_log');
    },

    function test_getCarryOverKey_returns_null_when_no_prior_days() {
      localStorage.removeItem('turnaround_captains_log');
      const key = App.CaptainsLog._store.getCarryOverKey();
      assertEquals(key, null, 'returns null when no prior entries');
    },

  ]);
}());
