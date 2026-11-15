// Renders each walker blockout at the game's real camera and scale, in four poses, as a flat black silhouette and lit.
// usage: node design/blockouts/sheet.js [outdir] [name,name,...]     writes <name>_<pose>_{lit,sil}.png and sheet.png (needs Pillow for the sheet)
const { chromium } = require('playwright'), path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');
const out = path.resolve(process.argv[2] || path.join(__dirname, 'out')), names = (process.argv[3] || 'current,longgun,lopsided,crab').split(','); fs.mkdirSync(out, { recursive: true });
const POSES = [['toward', 'head=0;aim=0;'], ['walk_east_aim_northwest', 'head=1.57;aim=-2.4;vx=5;'], ['away', 'head=3.14;aim=3.14;'], ['ram_west', 'head=-1.57;aim=-1.57;ram=1;']];
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const name of names) { const p = await b.newPage({ viewport: { width: 412, height: 880 }, deviceScaleFactor: 1 }); p.on('pageerror', e => console.log('E:', name, e.message.slice(0, 300)));
    await p.goto('file://' + path.resolve(__dirname, '../../index.html')); await p.waitForTimeout(600); await p.addScriptTag({ path: path.join(__dirname, 'mech-blockouts.js') }); await p.evaluate(() => { window.requestAnimationFrame = () => 0; });
    for (const [pose, js] of POSES) { await p.evaluate(({ name, js }) => { let head = 0, aim = 0, vx = 0, ram = 0; eval(js); useBlockout(name); setSeed(3); startGame(); G.spawnT = 1e9; G.eliteT = 1e9; G.en.length = 0; G.inv = 1e9;
          const ox = -6 - G.x, oz = 5 - G.z; G.x = -6; G.z = 5; G.feet.forEach(f => { f.x += ox; f.z += oz; }); G.head = head; G.aim = G.gunA = G.lamp = aim; G.cam.x = -6; G.cam.z = 4.2; G.cam.d = 1;
          for (let i = 0; i < 50; i++) { stick = vx ? { id: 1, ox: 60, oy: 700, dx: Math.sin(head), dy: Math.cos(head), ux: Math.sin(head), uy: Math.cos(head), d: 60 } : null; G.head = vx ? G.head : head; step(1 / 60); G.aim = G.gunA = G.lamp = aim; if (!vx) G.head = head; G.fireT = 9; G.cam.d = 1; }
          G.cam.x = G.x; G.cam.z = G.z - .8; if (ram) G.ram.x = 1; window.SILH = 0; render(); }, { name, js });
      const clip = { x: 46, y: 290, width: 320, height: 380 }; await p.screenshot({ path: path.join(out, `${name}_${pose}_lit.png`), clip });
      await p.evaluate(() => { window.SILH = 1; render(); window.SILH = 0; }); await p.screenshot({ path: path.join(out, `${name}_${pose}_mag.png`), clip }); }
    await p.close(); }
  await b.close();
  execFileSync('python3', ['-c', `
import sys
from PIL import Image, ImageDraw
out, names, poses = sys.argv[1], sys.argv[2].split(','), sys.argv[3].split(',')
W, H = 320, 380
sheet = Image.new('RGB', (len(poses) * W * 2 + 8, len(names) * (H + 26) + 4), (24, 24, 26)); d = ImageDraw.Draw(sheet)
for r, n in enumerate(names):
    d.text((6, r * (H + 26) + 6), n.upper(), fill=(240, 180, 40))
    for c, ps in enumerate(poses):
        lit = Image.open(f'{out}/{n}_{ps}_lit.png').convert('RGB'); mag = Image.open(f'{out}/{n}_{ps}_mag.png').convert('RGB')
        sil = Image.new('RGB', (W, H), (200, 200, 196)); px = mag.load(); sp = sil.load()
        for y in range(H):
            for x in range(W):
                R, G, B = px[x, y]
                if R > 150 and B > 150 and G < 110: sp[x, y] = (12, 12, 14)
        sil.save(f'{out}/{n}_{ps}_sil.png')
        sheet.paste(sil, (c * W * 2 + 4, r * (H + 26) + 24)); sheet.paste(lit, (c * W * 2 + W + 4, r * (H + 26) + 24))
sheet.save(f'{out}/sheet.png')
`, out, names.join(','), POSES.map(q => q[0]).join(',')]); console.log('wrote', path.join(out, 'sheet.png')); })();
