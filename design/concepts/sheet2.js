// Round two: three ANVIL variations and the refined HOOK STALKER, and one shared scene at two camera distances.
// usage: node design/concepts/sheet2.js [outdir]      writes anvil.png, stalker.png, scene.png (needs Pillow)
const { chromium } = require('playwright'), path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');
const out = path.resolve(process.argv[2] || path.join(__dirname, 'out2')); fs.mkdirSync(out, { recursive: true }); const C = 440, HH = Math.round(C / .62) + 2;
const SETUP = () => { window.requestAnimationFrame = () => 0; for (const s of document.querySelectorAll('.scr')) s.classList.remove('on'); document.getElementById('c').style.visibility = 'hidden';
  window.shoot = (fn, v) => { const d0 = draw, s0 = seg, M = [1, 0, 1], sil = v.sil; window.SILH = sil;
    if (sil) { draw = (m, sx, sy, sz) => d0(m, sx, sy, sz, M, 9); seg = (m, A, B, w, d, cc, e, ref) => s0(m, A, B, w, d, M, 9, ref); }
    fn(sil); draw = d0; seg = s0; const S = SC, at = [v.ax || 0, v.h, v.az || 0], cp = Math.cos(v.pitch), yw = v.yaw || 0; S.at = at; S.cam = [at[0] + Math.sin(yw) * cp * v.dist, at[1] + Math.sin(v.pitch) * v.dist, at[2] + Math.cos(yw) * cp * v.dist]; S.fov = v.fov; S.focus = [at[0], 0, at[2]];
    S.spotP = [0, 30, 0]; S.spotD = [0, -1, 0]; S.spotC = [0, 0, 0]; S.lights = [{ p: [6, 8, 9], c: [.8, .8, .78], r: 26 }]; S.ambS = [.3, .3, .32]; S.ambG = [.16, .16, .16]; S.moonD = [-.5, .7, .5]; S.moonC = [.85, .85, .82]; S.fogC = [.34, .34, .35]; S.fogR = v.fog || [10, 30]; S.rim = [.1, .1, .1]; S.exposure = 1.15;
    S.yard = [-1e4, 1e4, -1e4, 1e4]; S.apron = [-1e4, 1e4, -1e4, 1e4]; S.track = [1e4, 0, 1e4, 0]; renderScene(S, glc.width, glc.height); };
  window.one = (what, pal, v) => shoot(sil => { reset(); RY(v.turn || 0); if (what === 'stalk' || what === 'windup') stalker(what === 'windup' ? 1 : 0); else anvil(pal === 'grey' ? GREY : LIV[what], what); if (!sil) { decal(0, 0, 3.6, 3.4, 0, 0, 0, 0, 0, .5); if (v.man) { reset(); man(v.man[0], v.man[1]); } } }, v);
  window.scene = (what, v) => shoot(sil => { reset(); massing(); reset(); T(0, 0, 2); RY(-.5); anvil(LIV[what], what); decal(0, 2, 3.6, 3.4, 0, 0, 0, 0, 0, .55); reset(); man(3.6, 4.6); man(-11, -25.5);
    reset(); T(-9.5, 0, -5.5); RY(1.15); stalker(0); decal(-9.5, -5.5, 2.4, 3.4, 1.15, 0, 0, 0, 0, .5); reset(); T(8.5, 0, -8.5); RY(-.75); stalker(1); decal(8.5, -8.5, 2.4, 3.4, -.75, 0, 0, 0, 0, .5); reset(); T(2, 0, -19); RY(.1); stalker(0); decal(2, -19, 2.4, 3.4, 0, 0, 0, 0, 0, .5); }, v); };
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }); const errs = [];
  const open = async (w, h) => { const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 }); p.on('pageerror', e => errs.push(e.message.slice(0, 300))); await p.goto('file://' + path.resolve(__dirname, '../../index.html')); await p.waitForTimeout(700); await p.addScriptTag({ path: path.join(__dirname, 'concepts.js') }); await p.addScriptTag({ path: path.join(__dirname, 'anvil.js') }); await p.evaluate(SETUP); await p.waitForTimeout(300); await p.evaluate(() => one('corn', 'grey', { yaw: 0, pitch: .1, dist: 15, fov: .9, h: 2.4 })); await p.waitForTimeout(200); return p; };
  let p = await open(C, HH); const clip = { x: 0, y: Math.round((HH - C) / 2), width: C, height: C }, O = .2;       // O: a long lens far away, as near to orthographic as the renderer gets
  const MV = [['front', 'grey', { yaw: 0, pitch: 0, dist: 70, fov: O, h: 2.6, man: [3.6, .6] }], ['side', 'grey', { yaw: Math.PI / 2, pitch: 0, dist: 70, fov: O, h: 2.6, man: [0, 4.3] }], ['top', 'grey', { yaw: 0, pitch: 1.5, dist: 70, fov: O, h: 0, az: .6 }], ['threeq', 'grey', { yaw: .7, pitch: .4, dist: 17, fov: .9, h: 2.4, man: [3.6, 1.8] }], ['paint', 'liv', { yaw: .7, pitch: .4, dist: 17, fov: .9, h: 2.4, man: [3.6, 1.8] }], ['game', 'liv', { yaw: 0, pitch: .8, dist: 27, fov: 1.0, turn: .6, h: 0, az: -.4 }], ['gamesil', 'grey', { yaw: 0, pitch: .8, dist: 27, fov: 1.0, turn: .6, h: 0, az: -.4, sil: 1 }], ['frontsil', 'grey', { yaw: 0, pitch: 0, dist: 70, fov: O, h: 2.6, sil: 1 }]];
  for (const id of ['corn', 'hopper', 'bonnet']) for (const [vn, pal, v] of MV) { await p.evaluate(({ id, pal, v }) => one(id, pal, v), { id, pal, v }); await p.screenshot({ path: path.join(out, `${id}_${vn}.png`), clip }); }
  const SV = [['front', { yaw: 0, pitch: 0, dist: 70, fov: O * 1.05, h: 1.6, az: 1, man: [3.9, .6] }], ['side', { yaw: Math.PI / 2, pitch: 0, dist: 70, fov: O * 1.05, h: 1.6, az: .8, man: [0, 5.2] }], ['top', { yaw: 0, pitch: 1.5, dist: 70, fov: O * 1.3, h: 0, az: .9 }], ['threeq', { yaw: .7, pitch: .42, dist: 17, fov: .9, h: 1.3, az: .8, man: [3.4, 2.6] }], ['game', { yaw: 0, pitch: .8, dist: 27, fov: 1.0, turn: .6, h: 0, az: -.4 }], ['gamesil', { yaw: 0, pitch: .8, dist: 27, fov: 1.0, turn: .6, h: 0, az: -.4, sil: 1 }], ['frontsil', { yaw: 0, pitch: 0, dist: 70, fov: O * 1.05, h: 1.6, az: 1, sil: 1 }]];
  for (const id of ['stalk', 'windup']) for (const [vn, v] of SV) { await p.evaluate(({ id, v }) => one(id, 'grey', v), { id, v }); await p.screenshot({ path: path.join(out, `${id}_${vn}.png`), clip }); }
  await p.close(); p = await open(412, 880);       // the shared scene, in a phone's frame: the camera as it is now, and pulled back
  for (const id of ['corn', 'hopper', 'bonnet']) { await p.evaluate(id => scene(id, { yaw: 0, pitch: .8, dist: 30, fov: 1.15, h: 0, az: -4, fog: [30, 80] }), id); await p.screenshot({ path: path.join(out, `scene_${id}.png`) }); }
  await p.evaluate(() => scene('bonnet', { yaw: 0, pitch: .77, dist: 21, fov: 1.15, h: 0, az: -1, fog: [30, 80] })); await p.screenshot({ path: path.join(out, 'scene_now.png') });
  await p.evaluate(() => scene('bonnet', { yaw: 0, pitch: .8, dist: 30, fov: 1.15, h: 0, az: -4, fog: [30, 80], sil: 1 })); await p.screenshot({ path: path.join(out, 'scene_sil.png') });
  console.log('errors', errs.length, errs.slice(0, 3)); await b.close();
  execFileSync('python3', ['-c', `
import sys
from PIL import Image, ImageDraw
out, C = sys.argv[1], int(sys.argv[2])
def sil(a):
    s = Image.new('RGB', a.size, (205, 205, 200)); pa = a.load(); ps = s.load()
    for y in range(a.height):
        for x in range(a.width):
            R, G, B = pa[x, y]
            if R > 150 and B > 150 and G < 110: ps[x, y] = (14, 14, 16)
    return s
def sheet(rows, views, labels, name):
    H = C + 30; im = Image.new('RGB', ((C + 4) * len(views) + 12, H * len(rows) + 28), (20, 20, 22)); d = ImageDraw.Draw(im)
    for c, l in enumerate(labels): d.text((c * (C + 4) + 12, 8), l, fill=(150, 150, 150))
    for r, (i, t) in enumerate(rows):
        d.text((8, 26 + r * H + 4), t, fill=(240, 180, 40))
        for c, v in enumerate(views):
            a = Image.open(f'{out}/{i}_{v}.png').convert('RGB'); a = sil(a) if v.endswith('sil') else a; im.paste(a, (c * (C + 4) + 8, 26 + r * H + 20))
    im.save(f'{out}/{name}.png')
sheet([('corn', 'ANVIL / CORNHEAD   the striker is a corn header'), ('hopper', 'ANVIL / HOPPER   a grain tank feeds the gun by its auger'), ('bonnet', 'ANVIL / BONNET   a tractor that stood up')], ['front', 'side', 'top', 'threeq', 'paint', 'game', 'gamesil', 'frontsil'], ['FRONT', 'SIDE', 'TOP', 'THREE-QUARTER', 'A PAINT PROPOSAL', "THE GAME'S CAMERA, PULLED BACK", 'THE SAME, FLAT', 'FRONT, FLAT'], 'anvil')
sheet([('stalk', 'HOOK STALKER   stalking'), ('windup', 'HOOK STALKER   the wind-up')], ['front', 'side', 'top', 'threeq', 'game', 'gamesil', 'frontsil'], ['FRONT', 'SIDE', 'TOP', 'THREE-QUARTER', "THE GAME'S CAMERA, PULLED BACK", 'THE SAME, FLAT', 'FRONT, FLAT'], 'stalker')
ids = ['scene_now', 'scene_corn', 'scene_hopper', 'scene_bonnet', 'scene_sil']; L = ['THE CAMERA AS IT IS NOW (BONNET)', 'PULLED BACK: CORNHEAD', 'PULLED BACK: HOPPER', 'PULLED BACK: BONNET', 'PULLED BACK, FLAT']
im = Image.new('RGB', (416 * 5 + 12, 880 + 30), (20, 20, 22)); d = ImageDraw.Draw(im)
for c, i in enumerate(ids):
    a = Image.open(f'{out}/{i}.png').convert('RGB'); a = sil(a) if i.endswith('sil') else a; im.paste(a, (c * 416 + 8, 24)); d.text((c * 416 + 12, 6), L[c], fill=(150, 150, 150))
im.save(f'{out}/scene.png')
`, out, String(C)]); console.log('wrote', out); })();
