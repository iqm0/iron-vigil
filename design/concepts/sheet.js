// Renders each concept as grey masses on a plain floor: front, side, three-quarter, the game's camera at the game's scale, and that last one as a black silhouette.
// usage: node design/concepts/sheet.js [outdir]      writes mechs.png and animals.png (needs Pillow)
const { chromium } = require('playwright'), path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');
const out = path.resolve(process.argv[2] || path.join(__dirname, 'out')); fs.mkdirSync(out, { recursive: true }); const C = 460;
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }), HH = Math.round(C / .62) + 2, p = await b.newPage({ viewport: { width: C, height: HH }, deviceScaleFactor: 1 }), clip = { x: 0, y: Math.round((HH - C) / 2), width: C, height: C }; const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 300)));
  await p.goto('file://' + path.resolve(__dirname, '../../index.html')); await p.waitForTimeout(700); await p.addScriptTag({ path: path.join(__dirname, 'concepts.js') });
  await p.evaluate(() => { window.requestAnimationFrame = () => 0; for (const s of document.querySelectorAll('.scr')) s.classList.remove('on'); document.getElementById('c').style.visibility = 'hidden';
    window.studio = (id, v) => { const c = CONCEPTS[id], d0 = draw, s0 = seg, M = [1, 0, 1], sil = v.sil; window.SILH = sil;
      if (sil) { draw = (m, sx, sy, sz) => d0(m, sx, sy, sz, M, 9); seg = (m, A, B, w, d, cc, e, ref) => s0(m, A, B, w, d, M, 9, ref); }
      reset(); RY(v.turn || 0); c.draw(); if (!sil) { decal(0, 0, c.kind === 'mech' ? 3.2 : 2.4, c.kind === 'mech' ? 3.0 : 2.8, 0, 0, 0, 0, 0, .5); if (v.man) { reset(); man(v.man[0], v.man[1]); } }
      draw = d0; seg = s0; const S = SC, at = [0, v.h === undefined ? c.h : v.h, v.az || 0], cp = Math.cos(v.pitch), yw = v.yaw || 0; S.at = at; S.cam = [at[0] + Math.sin(yw) * cp * v.dist, at[1] + Math.sin(v.pitch) * v.dist, at[2] + Math.cos(yw) * cp * v.dist]; S.fov = v.fov; S.focus = [0, 0, 0];
      S.spotP = [0, 14, 0]; S.spotD = [0, -1, 0]; S.spotC = [0, 0, 0]; S.lights = [{ p: [5, 7, 8], c: [.9, .9, .88], r: 22 }]; S.ambS = [.3, .3, .32]; S.ambG = [.16, .16, .16]; S.moonD = [-.5, .7, .5]; S.moonC = [.85, .85, .82]; S.fogC = [.34, .34, .35]; S.fogR = [9, 26]; S.rim = [.1, .1, .1]; S.exposure = 1.15;
      S.yard = [-1e4, 1e4, -1e4, 1e4]; S.apron = [-1e4, 1e4, -1e4, 1e4]; S.track = [1e4, 0, 1e4, 0]; renderScene(S, glc.width, glc.height); }; });
  const mechs = ['anvil', 'dockhand', 'heron', 'strongroom', 'combine'], bugs = ['hook', 'lancer', 'maul'];
  await p.waitForTimeout(300); await p.evaluate(() => studio('anvil', { yaw: 0, pitch: .1, dist: 15, fov: .9 })); await p.waitForTimeout(200);       // one throwaway frame, so nothing the game had queued draws over the first real one
  const views = k => k === 'mech' ? [['front', { yaw: 0, pitch: .1, dist: 15, fov: .9, man: [3.3, .6] }], ['side', { yaw: Math.PI / 2, pitch: .1, dist: 15, fov: .9, man: [0, 3.6] }], ['threeq', { yaw: .65, pitch: .42, dist: 16, fov: .9, man: [3.2, 1.6] }], ['game', { yaw: 0, pitch: .8, dist: 21, fov: 1.0, turn: .6, h: 0, az: -.4 }], ['gamesil', { yaw: 0, pitch: .8, dist: 21, fov: 1.0, turn: .6, h: 0, az: -.4, sil: 1 }]]
    : [['front', { yaw: 0, pitch: .12, dist: 13, fov: .9, man: [2.9, .6] }], ['side', { yaw: Math.PI / 2, pitch: .12, dist: 13, fov: .9, man: [0, 4.2] }], ['threeq', { yaw: .65, pitch: .45, dist: 14, fov: .9, man: [2.8, 1.8] }], ['game', { yaw: 0, pitch: .8, dist: 21, fov: 1.0, turn: .6, h: 0, az: -.4 }], ['gamesil', { yaw: 0, pitch: .8, dist: 21, fov: 1.0, turn: .6, h: 0, az: -.4, sil: 1 }]];
  for (const id of mechs.concat(bugs)) { const kind = mechs.includes(id) ? 'mech' : 'bug'; for (const [vn, v] of views(kind)) { await p.evaluate(({ id, v }) => studio(id, v), { id, v }); await p.screenshot({ path: path.join(out, `${id}_${vn}.png`), clip }); } }
  const meta = await p.evaluate(() => JSON.stringify(Object.fromEntries(Object.entries(CONCEPTS).map(([k, c]) => [k, [c.name, c.sub]])))); console.log('errors', errs.length, errs.slice(0, 3)); await b.close();
  execFileSync('python3', ['-c', `
import sys, json
from PIL import Image, ImageDraw
out, C = sys.argv[1], int(sys.argv[2]); meta = json.loads(sys.argv[3]); V = ['front', 'side', 'threeq', 'game', 'gamesil']; L = ['FRONT', 'SIDE', 'THREE-QUARTER', "THE GAME'S CAMERA, AT THE GAME'S SCALE", 'THE SAME, AS A FLAT SHAPE']
def sheet(ids, name):
    H = C + 34; im = Image.new('RGB', (C * 5 + 24, H * len(ids) + 30), (20, 20, 22)); d = ImageDraw.Draw(im)
    for c, l in enumerate(L): d.text((c * (C + 4) + 12, 8), l, fill=(150, 150, 150))
    for r, i in enumerate(ids):
        d.text((8, 30 + r * H + 4), meta[i][0] + '  ' + meta[i][1], fill=(240, 180, 40))
        for c, v in enumerate(V):
            a = Image.open(f'{out}/{i}_{v}.png').convert('RGB')
            if v == 'gamesil':
                s = Image.new('RGB', a.size, (205, 205, 200)); pa = a.load(); ps = s.load()
                for y in range(a.height):
                    for x in range(a.width):
                        R, G, B = pa[x, y]
                        if R > 150 and B > 150 and G < 110: ps[x, y] = (14, 14, 16)
                a = s
            im.paste(a, (c * (C + 4) + 8, 30 + r * H + 22))
    im.save(f'{out}/{name}.png')
sheet(${JSON.stringify(mechs)}, 'mechs'); sheet(${JSON.stringify(bugs)}, 'animals')
`, out, String(C), meta]); console.log('wrote', out); })();
