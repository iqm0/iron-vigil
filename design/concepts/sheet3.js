// Round three: the refined ANVIL and HOOK STALKER, the shared scene with the camera looking further ahead, and a motion sheet of poses.
// usage: node design/concepts/sheet3.js [outdir]      writes r3-anvil.png, r3-stalker.png, r3-scene.png, r3-motion.png (needs Pillow)
const { chromium } = require('playwright'), path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');
const out = path.resolve(process.argv[2] || path.join(__dirname, 'out3')); fs.mkdirSync(out, { recursive: true }); const C = 420, HH = Math.round(C / .62) + 2;
const SETUP = () => { window.requestAnimationFrame = () => 0; for (const s of document.querySelectorAll('.scr')) s.classList.remove('on'); document.getElementById('c').style.visibility = 'hidden';
  window.shoot = (fn, v) => { const d0 = draw, s0 = seg, M = [1, 0, 1], sil = v.sil; window.SILH = sil;
    if (sil) { draw = (m, sx, sy, sz) => d0(m, sx, sy, sz, M, 9); seg = (m, A, B, w, d, cc, e, ref) => s0(m, A, B, w, d, M, 9, ref); }
    fn(sil); draw = d0; seg = s0; const S = SC, at = [v.ax || 0, v.h, v.az || 0], cp = Math.cos(v.pitch), yw = v.yaw || 0; S.at = at; S.cam = [at[0] + Math.sin(yw) * cp * v.dist, at[1] + Math.sin(v.pitch) * v.dist, at[2] + Math.cos(yw) * cp * v.dist]; S.fov = v.fov; S.focus = [at[0], 0, at[2]];
    S.spotP = [0, 30, 0]; S.spotD = [0, -1, 0]; S.spotC = [0, 0, 0]; S.lights = [{ p: [6, 8, 9], c: [.8, .8, .78], r: 26 }]; S.ambS = [.3, .3, .32]; S.ambG = [.16, .16, .16]; S.moonD = [-.5, .7, .5]; S.moonC = [.85, .85, .82]; S.fogC = [.34, .34, .35]; S.fogR = v.fog || [10, 30]; S.rim = [.1, .1, .1]; S.exposure = 1.15;
    S.yard = [-1e4, 1e4, -1e4, 1e4]; S.apron = [-1e4, 1e4, -1e4, 1e4]; S.track = [1e4, 0, 1e4, 0]; renderScene(S, glc.width, glc.height); };
  window.mech = (pal, pose, v) => shoot(sil => { const t = v.turn || 0; reset(); RY(t); anvil3(pal === 'grey' ? P3G : P3, Object.assign({ turn: t }, pose)); if (!sil) { decal(0, 0, 3.6, 3.4, 0, 0, 0, 0, 0, .5); if (v.man) { reset(); man(v.man[0], v.man[1]); } } }, v);
  window.bug = (pose, v) => shoot(sil => { reset(); RY(v.turn || 0); stalker3(pose); if (!sil) { decal(0, 0, 2.6, 3.8, v.turn || 0, 0, 0, 0, 0, .5); if (v.man) { reset(); man(v.man[0], v.man[1]); } } }, v);
  window.duel = (ram, v) => shoot(sil => { const t = v.turn || 0; reset(); RY(t); anvil3(v.grey ? P3G : P3, { ram, turn: t }); push(); T(2.3, 0, 9.3); RY(Math.PI); stalker3('stuck'); pop(); if (!sil) { decal(0, 0, 3.6, 3.4, 0, 0, 0, 0, 0, .5); } }, v);
  window.scene = (v) => shoot(sil => { reset(); massing(); const place = (x, z, a, pose) => { reset(); T(x, 0, z); RY(a); stalker3(pose); decal(x, z, 2.6, 3.8, a, 0, 0, 0, 0, .5); }; reset(); T(0, 0, 2); RY(v.mturn); anvil3(P3, { turn: v.mturn, at: [0, 2], walk: v.walk }); decal(0, 2, 3.6, 3.4, 0, 0, 0, 0, 0, .55); reset(); man(3.6, 4.6); man(-11, -25.5);
    place(-9.5, -5.5, 1.15, 'stalk'); place(8.5, -8.5, -.75, 'wind'); place(2, -19, .1, 'stalk'); }, v); };
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }); const errs = [];
  const open = async (w, h) => { const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 }); p.on('pageerror', e => errs.push(e.message.slice(0, 300))); await p.goto('file://' + path.resolve(__dirname, '../../index.html')); await p.waitForTimeout(700); for (const f of ['concepts.js', 'anvil.js', 'round3.js']) await p.addScriptTag({ path: path.join(__dirname, f) }); await p.evaluate(SETUP); await p.waitForTimeout(300); await p.evaluate(() => mech('grey', {}, { yaw: 0, pitch: .1, dist: 15, fov: .9, h: 2.4 })); await p.waitForTimeout(200); return p; };
  let p = await open(C, HH); const clip = { x: 0, y: Math.round((HH - C) / 2), width: C, height: C }, O = .2, G = { yaw: 0, pitch: .8, dist: 30, fov: 1.0, h: 0, az: -.4 }, shot = n => p.screenshot({ path: path.join(out, n + '.png'), clip });
  const MV = [['front', 'grey', { yaw: 0, pitch: 0, dist: 70, fov: O, h: 2.6, man: [3.9, .6] }], ['side', 'grey', { yaw: Math.PI / 2, pitch: 0, dist: 70, fov: O, h: 2.6, az: .6, man: [0, 4.8] }], ['top', 'grey', { yaw: 0, pitch: 1.5, dist: 70, fov: O, h: 0, az: .8 }], ['threeq', 'grey', { yaw: .7, pitch: .4, dist: 17, fov: .9, h: 2.4, man: [3.8, 2.0] }], ['paint', 'liv', { yaw: .7, pitch: .4, dist: 17, fov: .9, h: 2.4, man: [3.8, 2.0] }], ['back', 'liv', { yaw: Math.PI - .7, pitch: .4, dist: 17, fov: .9, h: 2.4 }], ['game', 'liv', Object.assign({ turn: .6 }, G)], ['gameaway', 'liv', Object.assign({ turn: Math.PI - .6 }, G)], ['gamesil', 'grey', Object.assign({ turn: .6, sil: 1 }, G)], ['frontsil', 'grey', { yaw: 0, pitch: 0, dist: 70, fov: O, h: 2.6, sil: 1 }]];
  for (const [vn, pal, v] of MV) { await p.evaluate(({ pal, v }) => mech(pal, {}, v), { pal, v }); await shot('a_' + vn); }
  const SV = [['front', { yaw: 0, pitch: 0, dist: 70, fov: O * 1.05, h: 1.8, az: 1, man: [3.9, .6] }], ['side', { yaw: Math.PI / 2, pitch: 0, dist: 70, fov: O * 1.25, h: 1.8, az: .3, man: [0, 5.9] }], ['top', { yaw: 0, pitch: 1.5, dist: 70, fov: O * 1.35, h: 0, az: .6 }], ['threeq', { yaw: .7, pitch: .42, dist: 18, fov: .9, h: 1.3, az: .6, man: [3.6, 2.8] }], ['game', Object.assign({ turn: .6 }, G)], ['gamesil', Object.assign({ turn: .6, sil: 1 }, G)], ['frontsil', { yaw: 0, pitch: 0, dist: 70, fov: O * 1.05, h: 1.8, az: 1, sil: 1 }]];
  for (const id of ['stalk', 'wind']) for (const [vn, v] of SV) { await p.evaluate(({ id, v }) => bug(id, v), { id, v }); await shot(`s_${id}_${vn}`); }
  // motion: six moments of one stride, from the side and through the game's camera; then the ram, wound up and landed, against a stalker
  for (let i = 0; i < 6; i++) { await p.evaluate(i => mech('liv', { walk: i / 6 }, { yaw: Math.PI / 2, pitch: 0, dist: 70, fov: .2, h: 2.6, az: .4 }), i); await shot('m_walk_side_' + i); await p.evaluate(({ i, G }) => mech('liv', { walk: i / 6 }, Object.assign({ turn: .6 }, G, { dist: 24 })), { i, G }); await shot('m_walk_game_' + i); }
  for (const r of [1, 2]) { await p.evaluate(r => duel(r, { yaw: Math.PI / 2, pitch: 0, dist: 70, fov: .44, h: 2.6, az: 5.6 }), r); await shot('m_ram_side_' + r); await p.evaluate(r => duel(r, { yaw: 1.0, pitch: .42, dist: 27, fov: .9, h: 1.6, az: 5.2, ax: 1 }), r); await shot('m_ram_3q_' + r); await p.evaluate(({ r, G }) => duel(r, Object.assign({ turn: .6 }, G, { ax: 4, az: 3.5 })), { r, G }); await shot('m_ram_game_' + r); }
  for (const id of ['stalk', 'wind', 'stuck']) { await p.evaluate(id => bug(id, { yaw: Math.PI / 2, pitch: 0, dist: 70, fov: .25, h: 1.8, az: .3 }), id); await shot('m_bug_side_' + id); await p.evaluate(({ id, G }) => bug(id, Object.assign({ turn: .6 }, G, { dist: 24 })), { id, G }); await shot('m_bug_game_' + id); }
  await p.close(); p = await open(412, 880); const SC2 = { yaw: 0, pitch: .8, dist: 30, fov: 1.15, h: 0, fog: [34, 95] };
  for (const [n, v] of [['before', { az: -4, mturn: -.5 }], ['ahead', { az: -5.5, pitch: .66, mturn: -.5 }], ['ahead_walk', { az: -5.5, pitch: .66, mturn: 2.7, walk: .3 }], ['ahead_sil', { az: -5.5, pitch: .66, mturn: -.5, sil: 1 }]]) { await p.evaluate(v => scene(v), Object.assign({}, SC2, v)); await p.screenshot({ path: path.join(out, `scene_${n}.png`) }); }
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
def grid(rows, name, cols=None):
    cols = cols or max(len(r[1]) for r in rows); H = C + 30; im = Image.new('RGB', ((C + 4) * cols + 12, H * len(rows) + 8), (20, 20, 22)); d = ImageDraw.Draw(im)
    for r, (title, cells) in enumerate(rows):
        d.text((8, r * H + 6), title, fill=(240, 180, 40))
        for c, (f, lab) in enumerate(cells):
            a = Image.open(f'{out}/{f}.png').convert('RGB'); a = sil(a) if f.endswith('sil') else a; im.paste(a, (c * (C + 4) + 8, r * H + 24)); d.text((c * (C + 4) + 14, r * H + 28), lab, fill=(215, 215, 215) if not f.endswith('sil') else (60, 60, 60))
    im.save(f'{out}/{name}.png')
grid([('ANVIL   bonnet body, cornhead striker', [('a_front', 'front'), ('a_side', 'side'), ('a_top', 'top'), ('a_threeq', 'three-quarter'), ('a_frontsil', 'front, flat')]),
      ('ANVIL   in its paint, and through the game camera', [('a_paint', 'paint'), ('a_back', 'from behind'), ('a_game', 'game camera, toward'), ('a_gameaway', 'game camera, away'), ('a_gamesil', 'game camera, flat')])], 'r3-anvil')
grid([('HOOK STALKER   stalking', [('s_stalk_front', 'front'), ('s_stalk_side', 'side'), ('s_stalk_top', 'top'), ('s_stalk_threeq', 'three-quarter'), ('s_stalk_game', 'game camera'), ('s_stalk_gamesil', 'game camera, flat'), ('s_stalk_frontsil', 'front, flat')]),
      ('HOOK STALKER   the wind-up', [('s_wind_front', 'front'), ('s_wind_side', 'side'), ('s_wind_top', 'top'), ('s_wind_threeq', 'three-quarter'), ('s_wind_game', 'game camera'), ('s_wind_gamesil', 'game camera, flat'), ('s_wind_frontsil', 'front, flat')])], 'r3-stalker')
grid([('WALK   one stride in six moments, from the side', [(f'm_walk_side_{i}', f'{i}/6') for i in range(6)]), ('WALK   the same six moments through the game camera', [(f'm_walk_game_{i}', f'{i}/6') for i in range(6)]),
      ('RAM   wound up, then landed on a stalker whose blades are stuck', [('m_ram_side_1', 'wind-up, side'), ('m_ram_side_2', 'impact, side'), ('m_ram_3q_1', 'wind-up'), ('m_ram_3q_2', 'impact'), ('m_ram_game_1', 'wind-up, game camera'), ('m_ram_game_2', 'impact, game camera')]),
      ('HOOK STALKER   stalking, wound up, and stuck after the pounce', [('m_bug_side_stalk', 'stalking'), ('m_bug_side_wind', 'wind-up'), ('m_bug_side_stuck', 'blades stuck'), ('m_bug_game_stalk', 'stalking, game camera'), ('m_bug_game_wind', 'wind-up, game camera'), ('m_bug_game_stuck', 'stuck, game camera')])], 'r3-motion')
ids = [('scene_before', 'PULLED BACK, AS LAST TIME (46 DEGREES)'), ('scene_ahead', 'TILTED TO LOOK AHEAD (38 DEGREES)'), ('scene_ahead_walk', 'THE SAME, WALKING AWAY UP THE YARD'), ('scene_ahead_sil', 'TILTED, FLAT')]
im = Image.new('RGB', (416 * 4 + 12, 880 + 30), (20, 20, 22)); d = ImageDraw.Draw(im)
for c, (i, l) in enumerate(ids):
    a = Image.open(f'{out}/{i}.png').convert('RGB')
    px = a.load(); row = next((y for y in range(a.height) if sum(px[a.width // 2, y]) > 60), 0)       # past the edge of the blockout's ground there is nothing drawn; carry the haze up over it
    if row and not i.endswith('sil'):
        for y in range(row + 2):
            for x in range(a.width): px[x, y] = px[x, row + 2]
    a = sil(a) if i.endswith('sil') else a
    if True: 
        o = Image.new('RGBA', a.size, (0, 0, 0, 0)); od = ImageDraw.Draw(o); col = (255, 255, 255, 120) if not i.endswith('sil') else (90, 90, 90, 200)
        od.ellipse((88 - 60, 730 - 60, 88 + 60, 730 + 60), outline=col, width=2); od.ellipse((348 - 40, 744 - 40, 348 + 40, 744 + 40), outline=col, width=2); a = Image.alpha_composite(a.convert('RGBA'), o).convert('RGB')
    im.paste(a, (c * 416 + 8, 24)); d.text((c * 416 + 12, 6), l, fill=(150, 150, 150))
im.save(f'{out}/r3-scene.png')
`, out, String(C)]); console.log('wrote', out); })();
