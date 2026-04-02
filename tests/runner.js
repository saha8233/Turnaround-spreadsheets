// tests/runner.js
// Minimal in-browser test runner — no dependencies

window.TestRunner = (function () {
  const results = [];

  function assert(condition, message) {
    results.push({ pass: !!condition, message });
    if (!condition) console.error('FAIL:', message);
    else console.log('PASS:', message);
  }

  function assertEquals(a, b, message) {
    const pass = JSON.stringify(a) === JSON.stringify(b);
    results.push({ pass, message });
    if (!pass) console.error('FAIL:', message, '| expected:', b, '| got:', a);
    else console.log('PASS:', message);
  }

  function runSuite(name, tests) {
    console.group(name);
    tests.forEach(fn => {
      try { fn(); }
      catch (e) { results.push({ pass: false, message: fn.name + ' threw: ' + e.message }); console.error('ERROR:', fn.name, e); }
    });
    console.groupEnd();
  }

  function summary() {
    const passed = results.filter(r => r.pass).length;
    const total  = results.length;
    console.log(`\n${passed}/${total} tests passed`);
    document.getElementById('test-summary').textContent = `${passed}/${total} tests passed`;
    results.forEach(r => {
      const li = document.createElement('li');
      li.style.color = r.pass ? '#38a169' : '#e53e3e';
      li.textContent = (r.pass ? '✓ ' : '✗ ') + r.message;
      document.getElementById('test-results').appendChild(li);
    });
  }

  return { assert, assertEquals, runSuite, summary };
}());
