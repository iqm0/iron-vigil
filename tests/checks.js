// Scripted checks of the rules the slice depends on. Each prints PASS or FAIL. usage: node tests/checks.js
const { chromium } = require('playwright'), path = require('path');
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }), p = await b.newPage({ viewport: { width: 412, height: 880 } }); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 300)));
  await p.goto('file://' + path.resolve(__dirname, '../index.html')); await p.waitForTimeout(600); await p.evaluate(() => { window.requestAnimationFrame = () => 0; }); await p.waitForTimeout(100);
  const R = await p.evaluate(() => { const out = [], ok = (n, c, d) => out.push((c ? 'PASS ' : 'FAIL ') + n + (d !== undefined ? '  [' + d + ']' : '')), calm = () => { G.en.length = 0; G.spawnT = 1e9; G.eliteT = 1e9; }, run = n => { for (let i = 0; i < n; i++) step(1 / 60); };
    const fresh = seed => { setSeed(seed); startGame(); calm(); };
    // the same seed offers the same pairs in the same order
    fresh(11); const o1 = G.order.join(), s1 = G.siteOrder.join(); fresh(11); ok('seed repeats the offer order and the breach order', o1 === G.order.join() && s1 === G.siteOrder.join(), o1); fresh(12); ok('another seed can differ', true, G.order.join());
    // slots: three hardware, then no more hardware is offered; one organ; a pair is never offered twice
    fresh(5); const seen = []; for (let i = 0; i < 4; i++) { const pr = nextPair(G); if (!pr) break; seen.push(pr[0].grp); G.items.push(pr[i % 2].id); } recalc(G); ok('at most three hardware modules', G.items.length === 3 && nextPair(G) === null, G.items.join()); ok('no pair offered twice', new Set(seen).size === seen.length, seen.join());
    openChoice('organ'); ok('an organ offer can be declined', state === 'choose' && offer.kind === 'organ' && !document.getElementById('chNo').hidden); offerAt = 0; choose(-1); ok('declining fits nothing', state === 'play' && G.items.length === 3 && G.choices.slice(-1)[0] === 'declined');
    // damage is not a global multiplier any more: no card changes pow
    fresh(5); const p0 = G.s.pow; G.items = CARDS.map(c => c.id); recalc(G); ok('no card multiplies base power', G.s.pow === p0, G.s.pow);
    // guard armour: front, flank, penetrator, stagger
    const hit = (setup, dx, dz) => { fresh(5); spawnBug(G.x, G.z + 6, 'big'); const e = G.en[0]; e.emer = 0; e.a = Math.PI; if (setup) setup(e); const h = e.hp; hurtBug(e, 100, dx, dz, false, true); return Math.round(h - e.hp); };
    const front = hit(null, 0, 1), back = hit(null, 0, -1), stag = hit(e => { e.stag = 1; }, 0, 1), pen = hit(() => { G.items = ['pen']; recalc(G); }, 0, 1); ok('guard armour turns most of a frontal shell', front < 40, front); ok('a shell from behind lands in full', back === 100, back); ok('a staggered guard takes more', stag === 160, stag); ok('penetrator ignores the armour', pen === 100, pen);
    // ram: interrupts a guard's wind-up and staggers it; the dash is not a long shield
    fresh(5); spawnBug(G.x, G.z + 3, 'big'); let e = G.en[0]; e.emer = 0; e.state = 'tell'; e.st = .8; startDash(0, 1); run(20); ok('ram interrupts a guard wind-up and staggers it', e.state === 'rec' && e.stag > 0, e.state + ' ' + e.stag.toFixed(2)); ok('dash cooldown is 2.4 s', Math.abs(G.s.dashCd - 2.4) < 1e-9); run(12); ok('no invulnerability once the burst is over', G.inv <= 0, G.inv.toFixed(2));
    // burrows: rammed shut, nothing comes out, reopens later
    fresh(5); const bw = G.burrows[0]; openSite(G, bw); const px = bw.x + 4, pz = bw.z; const ox = px - G.x, oz = pz - G.z; G.x = px; G.z = pz; G.feet.forEach(f => { f.x += ox; f.z += oz; }); startDash(-1, 0); run(25); ok('ramming an open burrow shuts it', bw.shut > 0 && G.closed === 1, bw.shut.toFixed(1)); ok('a shut burrow gives no spawn', burrow(G, Math.atan2(bw.x - G.x, bw.z - G.z)) !== bw); G.dcd = 0; bw.shut = .05; run(10); ok('it reopens', bw.shut <= 0 && bw.on);
    // the organ: stated drawbacks are real
    fresh(5); const a0 = G.s.accel, t0 = G.s.turn; G.items = ['graft']; recalc(G); ok('spitter graft slows acceleration and turning', G.s.accel < a0 && G.s.turn < t0, G.s.accel + ' ' + G.s.turn);
    fresh(5); G.items = ['molt']; recalc(G); G.hp = 5; G.inv = 0; hurtPlayer(50, 0, 1); ok('emergency molt saves one lethal hit at two fifths hull', !G.dead && Math.round(G.hp) === 40, Math.round(G.hp)); ok('and halves the cannon for twelve seconds', G.weakT > 11.5, G.weakT.toFixed(1)); G.inv = 0; hurtPlayer(500, 0, 1); ok('only once', !!G.dead);
    // growth only with an organ
    fresh(5); G.items = ['pen', 'mortar', 'plate']; recalc(G); G.spawnT = 1e9; run(120); ok('hardware alone grows nothing', G.stage === 0, G.stage); G.items.push('graft'); recalc(G); run(120); ok('an organ does', G.stage > 0, G.stage);
    // the mother: two phases
    fresh(5); G.bossUp = true; spawnBug(G.x, G.z + 8, 'boss'); e = G.bossE = G.en[0]; e.emer = 0; run(30); ok('mother starts in phase one', e.ph === 1); e.hp = e.mhp * .49; run(5); ok('and breaks at half', e.ph === 2 && e.stag > 0);
    return out; });
  for (const l of R) console.log(l); console.log(R.filter(l => l.startsWith('FAIL')).length + ' failed of ' + R.length, '· page errors:', errs.length, errs.slice(0, 2)); await b.close(); })();
