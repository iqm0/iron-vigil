// Run each command separately, retain complete logs and propagate every failure.
const { spawnSync } = require('child_process');
const fs = require('fs'), path = require('path');
const out = path.resolve(process.argv[2] || 'tests/out/baseline');
fs.mkdirSync(out, { recursive: true });
const commands = [
  ['checks.js'], ['approved-slice-checks.js'], ['behaviour.js'],
  ['behaviour.js', '--camera=46'], ['dodge.js'], ['matrix.js'],
  ['sim.js', '3'], ['shots.js', path.join(out, 'shots')], ['mutants.js']
];
const results = [];
for (const args of commands) {
  const name = args.join('-').replace(/[^a-zA-Z0-9.-]/g, '_');
  const start = Date.now();
  const r = spawnSync(process.execPath, [path.join(__dirname, args[0]), ...args.slice(1)], {
    encoding: 'utf8', timeout: 20 * 60 * 1000, maxBuffer: 16 * 1024 * 1024
  });
  const log = (r.stdout || '') + (r.stderr || '') + (r.error ? '\n' + r.error.stack : '');
  fs.writeFileSync(path.join(out, name + '.log'), log);
  const failed = r.status !== 0 || /^(FAIL |MISSED |STALE )/m.test(log) || /(?:page errors:|errors:)\s*[1-9]/.test(log);
  results.push({ command: 'node tests/' + args.join(' '), exit: r.status, signal: r.signal, failed, seconds: (Date.now() - start) / 1000, log: name + '.log' });
  console.log(`${failed ? 'FAIL' : 'PASS'} ${results.at(-1).command} (${results.at(-1).seconds.toFixed(1)}s)`);
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({
    node: process.version, platform: process.platform,
    browser: process.env.LAST_LIGHT_CHROMIUM || 'Playwright pinned Chromium',
    transport: process.env.LAST_LIGHT_HTTP === '1' ? 'loopback HTTP' : 'file',
    results
  }, null, 2));
}
process.exitCode = results.some(r => r.failed) ? 1 : 0;
