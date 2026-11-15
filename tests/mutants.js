// Breaks the game on purpose, one rule at a time, in a throwaway copy, and confirms that the test meant to guard that rule fails. usage: node tests/mutants.js
// A test that still passes against its mutant proves nothing; that is reported as MISSED.
const fs = require('fs'), os = require('os'), path = require('path'), { spawnSync } = require('child_process'); const root = path.resolve(__dirname, '..');
const M = [
  ['a shell no longer makes it flinch', 'e.flinch = .16;', 'e.flinch = 0;', 'checks.js', 'makes it flinch'],
  ['the ram makes the walker invulnerable again', 'g.dcd = g.s.dashCd; g.crouch.v += 5.5;', 'g.dcd = g.s.dashCd; g.inv = Math.max(g.inv, DASH.wind + B); g.crouch.v += 5.5;', 'behaviour.js', "damage lands during the ram's wind-up"],
  ['a cancelled touch fires the ram', "cv.addEventListener('pointercancel', cancelPtr)", "cv.addEventListener('pointercancel', endPtr)", 'approved-slice-checks.js', 'Pointer cancel'],
  ['the ram crushes an animal that is not pinned', "const open = e.state === 'stuck';", "const open = e.state === 'stuck' || e.state === 'stalk';", 'behaviour.js', 'takes the ram as a roaming one'],
  ['the closing step is given whatever the aim', '(tx * dx + tz * dz) / d > .87', '(tx * dx + tz * dz) / d > -2', 'behaviour.js', 'a flick away from a pinned animal'],
  ['the closing step survives the animal pulling free', "if (d.pin && !d.hit.has(d.pin) && (d.pin.dead || d.pin.state !== 'stuck')) { d.B = d.base; d.pin = null; }", '', 'behaviour.js', 'loses it if the animal pulls free'],
  ['the last step of the leap is dropped', 'e.st <= 0 ? Math.max(0, dt + e.st) : dt', 'e.st <= 0 ? 0 : dt', 'behaviour.js', 'covers the same ground at every rate'],
  ['the blades cut twice as wide', 'half: 1.2,', 'half: 2.6,', 'behaviour.js', '1.15 m off the line'],
  ['the wind-up is a third as long', 'tell: .9, lock: .9,', 'tell: .3, lock: .3,', 'behaviour.js', 'begun 250 ms after'],
  ['the hit is sampled once a frame again', 'const th = e.hitP ? -1 : sweepBox(e.pal, e.psl, al, sl, SHEAR.reach[0], SHEAR.reach[1], SHEAR.half)', 'const th = e.hitP ? -1 : sweepBox(al, sl, al, sl, SHEAR.reach[0], SHEAR.reach[1], SHEAR.half)', 'behaviour.js', 'same result at 30, 60 and 120'],
  ['a tap goes at a target that is off the screen', 'return t && !t.dead && onScreen(t.x, t.z) ? t : null; }', 'return t && !t.dead ? t : null; }', 'behaviour.js', 'off the screen'],
  ['a pinned animal is not preferred', "if (best) return best; const t = g.tgt;", "const t = g.tgt;", 'behaviour.js', 'a pinned animal before the one the cannon tracks'],
  ['the thumbs are ignored by the hidden-attack cue', 'for (const c of [[B.x, B.y, B.r * 1.3], [b.x, b.y, 74]]) {', 'for (const c of []) {', 'behaviour.js', 'under a control is flagged'],
  ['the cue is never drawn', "if (e.shear && e.state === 'tell' && e.locked && unseen(e.x, e.z)) { const w", "if (false) { const w", 'behaviour.js', 'the arc is drawn'],
  ['resolution never comes back up', 'ema < 17.6', 'ema < 0', 'behaviour.js', 'steps back up'],
  ['resolution bounces', 'if (now - s.up < 12000) s.cap = Math.max(.5, s.q - .17);', '', 'behaviour.js', 'does not try that level again'],
  ['a lost graphics context is not handled', 'e.preventDefault(); GLOK = false; stick = null; dbtn = null;', 'GLOK = false; stick = null; dbtn = null;', 'behaviour.js', 'getting it back draws'],
  ['the camera is at 50 degrees', "? 46 : 38;", "? 46 : 50;", 'approved-slice-checks.js', 'Camera looks down at 38'],
  ['the walker casts its own lamp shadow again', 'shadowCut(); drawMech(g);', 'drawMech(g);', 'approved-slice-checks.js', 'no shadow of its own'],
];
const run = (dir, suite) => spawnSync(process.execPath, [path.join(dir, 'tests', suite)], {
  encoding: 'utf8', timeout: 600000
});
const output = r => (r.stdout || '') + (r.stderr || '');
const copy = () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'lastlight-'));
  for (const f of fs.readdirSync(root)) {
    if (['.git', 'design', 'screenshots', 'node_modules'].includes(f)) continue;
    fs.cpSync(path.join(root, f), path.join(d, f), {
      recursive: true, filter: s => !s.includes(path.join('tests', 'out'))
    });
  }
  return d;
};
const only = process.argv[2], selected = M.filter(([name]) => !only || name.includes(only));
if (!selected.length) throw new Error('No mutants match: ' + only);
let missed = 0, bad = 0, caughtCount = 0;
const base = copy();
try {
  for (const suite of ['checks.js', 'approved-slice-checks.js', 'behaviour.js']) {
    const r = run(base, suite), o = output(r), fails = o.split('\n').filter(l => l.startsWith('FAIL'));
    const passed = r.status === 0 && !r.error && !fails.length && /^PASS /m.test(o);
    console.log(`unbroken  ${suite.padEnd(26)} ${passed ? 'all pass' : 'BASELINE FAILED'}`);
    if (!passed) { bad++; console.error('exit:', r.status, r.error || '', o.slice(-1000)); }
  }
} finally { fs.rmSync(base, { recursive: true, force: true }); }
if (bad) {
  console.error('Mutation run aborted: an unbroken baseline did not pass.');
  process.exit(1);
}
for (const [name, find, repl, suite, expect] of selected) {
  const d = copy();
  try {
    const p = path.join(d, 'js', 'game.js'), src = fs.readFileSync(p, 'utf8');
    if (src.split(find).length !== 2) {
      console.log(`STALE     ${name}: the line to break was not found exactly once`); bad++; continue;
    }
    fs.writeFileSync(p, src.replace(find, repl));
    const r = run(d, suite), fails = output(r).split('\n').filter(l => l.startsWith('FAIL'));
    const caught = r.status === 1 && !r.error && fails.some(l => l.includes(expect));
    if (caught) caughtCount++; else missed++;
    console.log(`${caught ? 'CAUGHT   ' : 'MISSED   '} ${name} -> ${suite}: ${caught ? fails.find(l => l.includes(expect)).slice(0, 110) : 'expected failure absent; exit ' + r.status}`);
  } finally { fs.rmSync(d, { recursive: true, force: true }); }
}
console.log(`${caughtCount} caught, ${missed} missed, ${bad} problems (${selected.length} selected)`);
process.exitCode = missed || bad ? 1 : 0;
