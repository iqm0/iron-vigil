// Deterministic full encounter film: simulation advances at 60 Hz, sampled at
// 15 fps and encoded at that rate. This is a bot replay, never a human playtest.
const { chromium, gameURL } = require('./browser');
const { spawn } = require('child_process');
const { once } = require('events');
const fs = require('fs'), path = require('path');
const out = path.resolve(process.argv[2] || 'tests/out/replays');
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  try {
    for (const [width, height] of [[360, 780], [412, 880]]) {
      const p = await b.newPage({ viewport: { width, height }, deviceScaleFactor: 1 }), errors = [];
      p.on('pageerror', e => errors.push(e.message));
      await p.goto(gameURL() + '?seed=7919'); await p.waitForTimeout(700);
      await p.evaluate(() => { window.requestAnimationFrame = () => 0; }); await p.waitForTimeout(100);
      await p.evaluate(() => { setSeed(7919); startGame(); });
      const file = path.join(out, width + '-bot.mp4');
      const enc = spawn(process.env.LAST_LIGHT_FFMPEG || 'ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-vcodec', 'png', '-r', '15', '-i', 'pipe:0', '-an', '-c:v', 'libx264', '-crf', '22', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', file]);
      let encoderError = '';
      enc.stderr.on('data', d => { encoderError += d; });
      const encoded = new Promise((resolve, reject) => { enc.on('error', reject); enc.on('exit', code => code === 0 ? resolve() : reject(new Error(encoderError || 'encoder exit ' + code))); });
      // Attach rejection handling immediately; the awaited promise still rejects.
      encoded.catch(() => {});
      let result, frames = 0, peakInstances = 0;
      for (; frames < 15 * 180; frames++) {
        result = await p.evaluate(() => {
          for (let tick = 0; tick < 4 && (state === 'play' || state === 'choose'); tick++) {
            if (state === 'choose') { offerAt = 0; choose(1); }
            const g = G; let ax = 0, az = 0;
            for (const e of g.en) {
              const ex = g.x - e.x, ez = g.z - e.z, d = Math.hypot(ex, ez) || 1;
              if (d < 6) { ax += ex / d / d; az += ez / d / d; }
              if (e.state === 'tell' && e.locked) { ax += -e.ldz * 2; az += e.ldx * 2; }
            }
            for (const d of g.drops) { const ex = d.x - g.x, ez = d.z - g.z, l = Math.hypot(ex, ez) || 1; ax += ex / l * .8; az += ez / l * .8; }
            for (const w of [[g.x-YARD.x0,1,0],[YARD.x1-g.x,-1,0],[g.z-YARD.z0,0,1],[YARD.z1-g.z,0,-1]]) {
              const d = Math.max(.6, w[0]); if (d < 5) { ax += w[1] / d * .9; az += w[2] / d * .9; }
            }
            const l = Math.hypot(ax, az), dx = l > .05 ? ax / l : 0, dz = l > .05 ? az / l : 0;
            if (g.dcd <= 0 && !g.dash) for (const e of g.en) {
              const ex = e.x-g.x, ez = e.z-g.z, d = Math.hypot(ex, ez);
              if (d < 7 && (e.state === 'stuck' || e.state === 'down')) { startDash(ex / d, ez / d); break; }
            }
            stick = dx || dz ? { id:1, ox:90, oy:700, dx, dy:dz, ux:dx, uy:dz, d:60 } : null;
            step(1 / 60);
          }
          render(); return { state, gameSeconds: G.t, clockSeconds: G.t / PACE, hull: G.hp, kills: G.kills, crushed: G.crushed, won: !!G.won, instances: STATS.inst };
        });
        peakInstances = Math.max(peakInstances, result.instances);
        const png = await p.screenshot();
        if (!enc.stdin.write(png)) await once(enc.stdin, 'drain');
        if (frames % 150 === 0) console.log(width, 'frame', frames, result);
        if (result.state === 'over') { frames++; break; }
      }
      enc.stdin.end(); await encoded;
      await p.screenshot({ path: path.join(out, width + '-final.png') });
      const metadata = { viewport:{width,height}, seed:7919, bot:'ace', simulationHz:60, sampledFps:15,
        frames, duration:frames/15, peakInstances, errors, realDevice:false, human:false, audio:false, result };
      fs.writeFileSync(path.join(out, width + '-bot.json'), JSON.stringify(metadata, null, 2));
      console.log('saved', file, metadata);
      if (errors.length || result.state !== 'over') process.exitCode = 1;
      await p.close();
    }
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
