// Final validation before modelling: the walker at the size it is played at, the stalker at two sizes, two camera angles measured, and an animated collision test.
// usage: node design/concepts/sheet4.js [outdir] [stills|clip|all]      needs Pillow, and ffmpeg for the clip
const { chromium } = require('playwright'), path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');
const out = path.resolve(process.argv[2] || path.join(__dirname, 'out4')), what = process.argv[3] || 'all'; fs.mkdirSync(out, { recursive: true });
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }), errs = [];
  const open = async (w, h) => { const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 }); p.on('pageerror', e => errs.push(e.message.slice(0, 300))); await p.goto('file://' + path.resolve(__dirname, '../../index.html')); await p.waitForTimeout(700);
    for (const f of ['concepts.js', 'anvil.js', 'round3.js', 'validate.js', 'stage4.js']) await p.addScriptTag({ path: path.join(__dirname, f) });
    await p.evaluate(() => { window.requestAnimationFrame = () => 0; for (const s of document.querySelectorAll('.scr')) s.classList.remove('on'); document.getElementById('c').style.visibility = 'hidden'; }); await p.waitForTimeout(300); await p.evaluate(() => mechShot({ turn: .6 })); await p.waitForTimeout(200); return p; };
  const data = {};
  if (what !== 'clip') { const p = await open(412, 880), shot = (n, clip) => p.screenshot({ path: path.join(out, n + '.png'), clip });
    for (const hard of [0, 1]) { await p.evaluate(hard => mechShot({ turn: .6, hard, ctx: 1 }), hard); await shot('mech_ctx_' + hard);
      for (const [n, turn] of [['toward', .6], ['side', Math.PI / 2 + .15], ['away', Math.PI - .6]]) for (const sil of hard ? [0] : [0, 1]) { const c = await p.evaluate(o => mechShot(o), { turn, hard, sil }); await shot(`mech_${n}_${hard}${sil ? '_sil' : ''}`, { x: Math.round(c.cx - 120), y: Math.round(c.cy - 128), width: 240, height: 240 }); } }
    data.scale = {}; for (const set of ['far', 'near']) for (const size of [1, .75]) { const k = `${set}_${size * 100}`; data.scale[k] = await p.evaluate(o => scaleShot(o), { set, size }); await shot('scale_' + k); await p.evaluate(o => scaleShot(o), { set, size, count: 1 }); await shot('count_' + k); }
    data.cam = {}; for (const [n, pitch] of [['38', .66], ['46', .8]]) { data.cam[n] = await p.evaluate(o => camShot(o), { pitch }); await shot('cam_' + n); }
    fs.writeFileSync(path.join(out, 'stills.json'), JSON.stringify(data)); await p.close(); }
  if (what !== 'stills') { const pg = await open(412, 880), pc = await open(600, 968), K = await pg.evaluate(() => { const r = solveRam(), k = Object.assign({}, K4); delete k.TL; return { r, k }; }); await pc.evaluate(() => solveRam());
    const k = K.k, seq = [], times = [], idx = t => { const key = Math.round(t * 240); let i = times.indexOf(key); if (i < 0) { i = times.length; times.push(key); } return i; }, hold = (i, n, mode) => { for (let j = 0; j < n; j++) seq.push({ i, mode }); };
    for (let f = 0; f <= Math.round(k.tEnd * 30); f++) { const t = f / 30, t1 = (f + 1) / 30; seq.push({ i: idx(t), mode: 'real' }); if (t < k.tHit && t1 >= k.tHit) hold(idx(k.tHit), 4, 'real'); } hold(seq[seq.length - 1].i, 18, 'real');
    for (let f = 0; f <= Math.round((2.9 - 1.6) * 120); f++) { const t = 1.6 + f / 120, t1 = t + 1 / 120; seq.push({ i: idx(t), mode: 'slow' }); if (t < k.tHit && t1 >= k.tHit) hold(idx(k.tHit), 8, 'slow'); } hold(seq[seq.length - 1].i, 24, 'slow');
    const fr = []; for (let i = 0; i < times.length; i++) { const t = times[i] / 240; fr.push(await pg.evaluate(t => clipFrame(t, 'game'), t)); await pg.screenshot({ path: path.join(out, `g_${i}.png`) }); await pc.evaluate(t => clipFrame(t, 'close'), t); await pc.screenshot({ path: path.join(out, `c_${i}.png`), clip: { x: 0, y: 184, width: 600, height: 600 } }); if (i % 40 === 0) console.log('frame', i, '/', times.length); }
    fs.writeFileSync(path.join(out, 'clip.json'), JSON.stringify({ K, seq, fr })); }
  console.log('errors', errs.length, errs.slice(0, 3)); await b.close();
  execFileSync('python3', [path.join(__dirname, 'compose4.py'), out, what], { stdio: 'inherit' }); })();
