// Actual in-engine, scripted real-time run. Browser video has no audio.
// Software rendering can slow the game clock: metadata records both clocks.
const { chromium } = require('./browser');
const fs = require('fs'), path = require('path');
const out = path.resolve(process.argv[2] || 'tests/out/recordings');
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  try {
    for (const [width, height] of [[360, 780], [412, 880]]) {
      const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1,
        recordVideo: { dir: out, size: { width, height } } });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(require('./browser').gameURL() + '?seed=7');
      await page.waitForFunction(() => typeof startGame === 'function');
      await page.evaluate(() => { setSeed(7); startGame(); });
      const started = Date.now();
      // A transparent scripted control pattern, not a player or a success bot.
      for (let i = 0; i < 36; i++) {
        const key = ['a', 'w', 'd', 's'][Math.floor(i / 3) % 4];
        await page.keyboard.down(key);
        if (i % 3 === 0) await page.keyboard.press('Space');
        await page.waitForTimeout(2000);
        await page.keyboard.up(key);
        const status = await page.evaluate(() => {
          if (state === 'choose') { offerAt = 0; choose(0); }
          return { state, time: G.t, hull: G.hp };
        });
        if (['over', 'end'].includes(status.state)) break;
      }
      const status = await page.evaluate(() => ({ state, gameSeconds: G.t, pace: PACE, hull: G.hp,
        kills: G.kills, crushed: G.crushed, stats: STATS, text: render_game_to_text() }));
      await page.screenshot({ path: path.join(out, width + '-final.png') });
      const video = page.video();
      await context.close();
      await video.saveAs(path.join(out, width + '-run.webm'));
      fs.writeFileSync(path.join(out, width + '-run.json'), JSON.stringify({
        viewport: { width, height }, seed: 7, wallSeconds: (Date.now() - started) / 1000,
        scripted: true, realDevice: false, audio: false, errors, ...status
      }, null, 2));
      if (errors.length) process.exitCode = 1;
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
