# Lays out what sheet4.js rendered: three comparison images, the measurements, and the frames of the collision clip.
import sys, json, math, os, subprocess
from PIL import Image, ImageDraw, ImageFont
out, what = sys.argv[1], sys.argv[2]
W, H = 412, 880
def font(n, bold=False): return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if bold else ''), n)
F9, F10, F11, F12, F14, B11, B12, B14, B20 = font(9), font(10), font(11), font(12), font(14), font(11, True), font(12, True), font(14, True), font(20, True)
BG, TXT, DIM, AMB = (20, 20, 22), (222, 222, 218), (140, 140, 138), (240, 180, 40)
THUMBS = [(88, H - 150, 60, (20, H)), (W - 64, H - 136, 40, (W - 12, H))]
def phone(name, sky=True):
    a = Image.open(f'{out}/{name}.png').convert('RGB')
    if sky:      # past the edge of the blockout's ground nothing is drawn; carry the haze up over it
        px = a.load(); row = next((y for y in range(a.height) if sum(px[a.width // 2, y]) > 60), 0)
        if row:
            band = a.crop((0, row + 3, a.width, row + 4)).resize((a.width, row + 3)); a.paste(band, (0, 0))
    return a.resize((W, H), Image.LANCZOS)
def thumbs(a, col=(255, 255, 255, 110), hands=False):
    o = Image.new('RGBA', a.size, (0, 0, 0, 0)); d = ImageDraw.Draw(o)
    for x, y, r, c in THUMBS:
        if hands: d.line((x, y, c[0], c[1]), fill=(255, 255, 255, 36), width=64); d.ellipse((x - r, y - r, x + r, y + r), fill=(255, 255, 255, 36))
        d.ellipse((x - r, y - r, x + r, y + r), outline=col, width=2)
    return Image.alpha_composite(a.convert('RGBA'), o).convert('RGB')
def under(x, y):      # is this point of the screen under a thumb: the control itself, or the thumb reaching it from the corner
    for tx, ty, r, c in THUMBS:
        if math.hypot(x - tx, y - ty) <= r: return True
        vx, vy = c[0] - tx, c[1] - ty; u = max(0, min(1, ((x - tx) * vx + (y - ty) * vy) / (vx * vx + vy * vy)))
        if math.hypot(x - tx - vx * u, y - ty - vy * u) <= 32: return True
    return False
def dashed(d, pts, col, w=2, on=7, off=5):
    acc = 0
    for p, q in zip(pts, pts[1:]):
        if p is None or q is None: continue
        L = math.hypot(q[0] - p[0], q[1] - p[1]); n = max(1, int(L / 2))
        for i in range(n):
            if (acc + i * L / n) % (on + off) < on: d.line((p[0] + (q[0] - p[0]) * i / n, p[1] + (q[1] - p[1]) * i / n, p[0] + (q[0] - p[0]) * (i + 1) / n, p[1] + (q[1] - p[1]) * (i + 1) / n), fill=col, width=w)
        acc += L
def sil(a):
    s = Image.new('RGB', a.size, (205, 205, 200)); pa = a.load(); ps = s.load()
    for y in range(a.height):
        for x in range(a.width):
            R, G, B = pa[x, y]
            if R > 150 and B > 150 and G < 110: ps[x, y] = (14, 14, 16)
    return s

if what != 'clip':
    D = json.load(open(f'{out}/stills.json')); M = {}
    # 1. the walker
    C = 292; im = Image.new('RGB', (16 + (W + 8) * 2 + (C + 6) * 3 + 8, H + 62), BG); d = ImageDraw.Draw(im)
    d.text((10, 8), '1.  THE WALKER AT THE SIZE IT IS PLAYED AT', font=B14, fill=AMB); d.text((10, 30), 'Left: the whole phone screen, 38 degree camera, a person and a stalker for scale.   Right: the same walker cut out of that view, three headings, shown at 1.2 times screen size (a phone draws it at twice or more).', font=F11, fill=DIM)
    for i, (n, l) in enumerate([('mech_ctx_0', 'AS APPROVED IN ROUND THREE'), ('mech_ctx_1', 'SAME MACHINE, FACE HARDENED')]):
        im.paste(thumbs(phone(n)), (10 + i * (W + 8), 54)); d.text((16 + i * (W + 8), 60), l, font=B11, fill=TXT)
    x0 = 16 + (W + 8) * 2
    for r, (suf, l) in enumerate([('0', 'as approved'), ('1', 'hardened'), ('0_sil', 'flat shape')]):
        for c, hd in enumerate(['toward', 'side', 'away']):
            a = Image.open(f'{out}/mech_{hd}_{suf}.png').convert('RGB'); a = (sil(a) if suf.endswith('sil') else a).resize((C, C), Image.LANCZOS); im.paste(a, (x0 + c * (C + 6), 54 + r * (C + 2))); d.text((x0 + c * (C + 6) + 6, 58 + r * (C + 2)), f'{l}, {hd}', font=F10, fill=(60, 60, 60) if suf.endswith('sil') else TXT)
    im.save(f'{out}/validate-mech.png')
    # 2. the stalker at two sizes
    im = Image.new('RGB', (12 + (W + 8) * 4, H + 62), BG); d = ImageDraw.Draw(im)
    d.text((10, 8), '2.  THE HOOK STALKER AT FULL SIZE AND AT THREE QUARTERS', font=B14, fill=AMB); d.text((10, 30), 'Same camera, same positions, three stalkers.  Left pair: approaching.  Right pair: closed in.  Circles are where the thumbs rest.', font=F11, fill=DIM)
    for i, (k, l) in enumerate([('far_100', 'FULL SIZE, APPROACHING'), ('far_75', '75%, APPROACHING'), ('near_100', 'FULL SIZE, CLOSED IN'), ('near_75', '75%, CLOSED IN')]):
        im.paste(thumbs(phone('scale_' + k)), (10 + i * (W + 8), 54)); d.text((16 + i * (W + 8), 60), l, font=B11, fill=TXT)
        a = Image.open(f'{out}/count_{k}.png').convert('RGB'); px = a.load(); mg = gr = thumb = 0
        for y in range(0, a.height, 2):
            for x in range(0, a.width, 2):
                R, G, B = px[x, y]
                if R > 150 and B > 150 and G < 110: mg += 1; thumb += under(x / 2, y / 2)
                elif G > 150 and R < 110 and B < 110: gr += 1
        tot = (a.width // 2) * (a.height // 2); M[k] = dict(stalkers=mg / tot, walker=gr / tot, stalkers_under_thumbs=thumb / max(1, mg), pxm=D['scale'][k]['px'])
    im.save(f'{out}/validate-scale.png')
    # 3. two camera angles
    PW = 470; im = Image.new('RGB', (12 + (W + 8) * 2 + PW, H + 62), BG); d = ImageDraw.Draw(im)
    d.text((10, 8), '3.  THE CAMERA AT 38 AND AT 46 DEGREES', font=B14, fill=AMB); d.text((10, 30), 'Same walker, same four stalkers, same light, same 412 x 880 screen, the walker at the same height on it.', font=F11, fill=DIM)
    RC = dict(walk=(120, 220, 255), ram=(255, 205, 70), gun=(255, 255, 255)); cm = {}
    for i, n in enumerate(['38', '46']):
        c = D['cam'][n]; a = thumbs(phone('cam_' + n), hands=True); dd = ImageDraw.Draw(a); st = {}
        for k in ['walk', 'ram', 'gun']:
            pts = [tuple(p) if p else None for p in c['rings'][k]]; dashed(dd, pts, RC[k], 2, 9 if k != 'gun' else 3, 5)
            on = [p for p in pts[:-1] if p and 0 <= p[0] <= W and 0 <= p[1] <= H]; st[k] = dict(on=len(on) / 120, thumb=sum(under(*p) for p in on) / 120)
        dashed(dd, [tuple(p) for p in c['lane']] + [tuple(c['lane'][0])], (255, 90, 70), 2, 5, 4)
        im.paste(a, (10 + i * (W + 8), 54)); d.text((16 + i * (W + 8), 60), f'{n} DEGREES', font=B11, fill=TXT); cm[n] = st
    x = 16 + (W + 8) * 2; y = 58
    for col, l in [(RC['walk'], 'one second of walking, 5 m'), (RC['ram'], 'reach of the ram, 6 m'), (RC['gun'], "cannon range as in today's build, 11 m"), ((255, 90, 70), 'the lane of the stalker that is winding up'), ((150, 150, 150), 'thumbs: the controls, and the thumb over them')]:
        d.line((x, y + 7, x + 26, y + 7), fill=col, width=3); d.text((x + 34, y), l, font=F11, fill=TXT); y += 18
    y += 12; c38, c46 = D['cam']['38'], D['cam']['46']
    def row(l, a, b, bold=False):
        global y
        d.text((x, y), l, font=B11 if bold else F11, fill=AMB if bold else TXT); d.text((x + 300, y), a, font=B11 if bold else F11, fill=AMB if bold else TXT); d.text((x + 385, y), b, font=B11 if bold else F11, fill=AMB if bold else TXT); y += 17
    r38 = {r['d']: r for r in c38['rows']}; r46 = {r['d']: r for r in c46['rows']}; f1 = lambda v: f'{v:.1f}'; pc = lambda v: f'{v * 100:.0f}%'
    row('MEASURED', '38°', '46°', True)
    row('camera looks ahead of the walker by', f1(c38['ahead']) + ' m', f1(c46['ahead']) + ' m')
    row('pixels per metre across, at the walker', f1(r38[0]['h']), f1(r46[0]['h']))
    row('pixels per metre in depth, at the walker', f1(r38[0]['v']), f1(r46[0]['v']))
    row('pixels per metre in depth, 10 m ahead', f1(r38[10]['v']), f1(r46[10]['v']))
    row('pixels per metre in depth, 20 m ahead', f1(r38[20]['v']), f1(r46[20]['v']))
    row('pixels per metre in depth, 30 m ahead', f1(r38[30]['v']), f1(r46[30]['v']))
    row('ground seen ahead before the top edge', ('%.0f m' % c38['north']) if c38['north'] < 500 else 'horizon', ('%.0f m' % c46['north']) if c46['north'] < 500 else 'horizon')
    row('ground seen behind the walker', f1(c38['south']) + ' m', f1(c46['south']) + ' m')
    row('ground seen to each side, at the walker', f1(r38[0]['half']) + ' m', f1(r46[0]['half']) + ' m')
    row('ground seen to each side, 20 m ahead', f1(r38[20]['half']) + ' m', f1(r46[20]['half']) + ' m')
    row('a stalker 10 m ahead stands this tall', '%.0f px' % r38[10]['knee'], '%.0f px' % r46[10]['knee'])
    row('a stalker 20 m ahead stands this tall', '%.0f px' % r38[20]['knee'], '%.0f px' % r46[20]['knee'])
    row('the walker stands this tall', '%.0f px' % c38['walkerH'], '%.0f px' % c46['walkerH'])
    row('ground hidden behind the walker', f1(c38['hides']) + ' m', f1(c46['hides']) + ' m')
    y += 8; row('RANGES', '38°', '46°', True)
    for k, l in [('walk', 'walking ring'), ('ram', 'ram ring'), ('gun', 'cannon ring')]:
        row(f'{l}: on screen', pc(cm['38'][k]['on']), pc(cm['46'][k]['on'])); row(f'{l}: under a thumb', pc(cm['38'][k]['thumb']), pc(cm['46'][k]['thumb']))
    y += 8; row('THUMBS', '38°', '46°', True)
    for j, l in enumerate(['left thumb covers ground', 'right thumb covers ground']):
        t38, t46 = c38['thumbs'][j], c46['thumbs'][j]; row(l + ' from', f"{t38['zt']:.1f} m back", f"{t46['zt']:.1f} m back"); row('   ... centred this far to the side', f"{abs(t38['x']):.1f} m", f"{abs(t46['x']):.1f} m")
    im.save(f'{out}/validate-camera.png'); M['cam'] = cm; M['cam38'] = {k: v for k, v in c38.items() if k not in ('rings', 'lane')}; M['cam46'] = {k: v for k, v in c46.items() if k not in ('rings', 'lane')}
    json.dump(M, open(f'{out}/measured.json', 'w'), indent=1); print(json.dumps(M)[:3000])

if what != 'stills':
    J = json.load(open(f'{out}/clip.json')); k = J['K']['k']; fr = J['fr']; cache = {}
    CW, CH = 1000, 904; X0, T0, T1, BW = 444, 0, k['tEnd'], 528
    SB = [('stalking', 0, k['tLock'], (70, 70, 74)), ('wind-up, line locked', k['tLock'], k['tGo'], (214, 150, 40)), ('pounce', k['tGo'], k['tLand'], (220, 70, 50)), ('blades pinned', k['tLand'], k['tFree'], (70, 120, 170)), ('free', k['tFree'], T1, (70, 70, 74))]
    WB = [('walking, 5 m/s', 0, k['tBrake'], (70, 70, 74)), ('brake', k['tBrake'], k['tStop'], (110, 110, 114)), ('', k['tStop'], k['tCock'], (50, 50, 54)), ('cock', k['tCock'], k['tStrike'], (214, 150, 40)), ('strike', k['tStrike'], k['tHit'], (220, 70, 50)), ('recover', k['tHit'], k['tRec'], (110, 110, 114)), ('', k['tRec'], T1, (50, 50, 54))]
    tx = lambda t: X0 + (t - T0) / (T1 - T0) * BW
    def base(i):
        if i in cache: return cache[i]
        f = fr[i]; t = f['t']; im = Image.new('RGB', (CW, CH), BG); g = thumbs(phone(f'g_{i}'), (255, 255, 255, 70)); dg = ImageDraw.Draw(g)
        if k['tLock'] <= t < k['tLand'] + .12: dashed(dg, [tuple(p) for p in f['lane']] + [tuple(f['lane'][0])], (255, 110, 90), 1, 5, 5)
        im.paste(g, (12, 12)); c = Image.open(f'{out}/c_{i}.png').convert('RGB'); px = c.load(); rowi = next((y for y in range(c.height) if sum(px[40, y]) > 60), 0)
        if rowi: c.paste(c.crop((0, rowi + 3, c.width, rowi + 4)).resize((c.width, rowi + 3)), (0, 0))
        im.paste(c.resize((544, 544), Image.LANCZOS), (436, 12)); d = ImageDraw.Draw(im); d.text((444, 18), 'CLOSER, FROM THE SIDE', font=B11, fill=TXT); d.text((20, 18), 'THE GAME CAMERA, 38 DEGREES', font=B11, fill=TXT)
        y = 640
        for lab, bars in [('STALKER', SB), ('WALKER', WB)]:
            d.text((X0, y - 16), lab, font=B11, fill=DIM)
            for n, a, b, col in bars:
                live = a <= t < b; d.rectangle((tx(a), y, tx(b) - 1, y + 20), fill=col if live else tuple(int(v * .45) for v in col))
                if live and n: d.text((X0 + 70, y - 16), f'{n}   {b - a:.2f} s', font=B11, fill=TXT)
            y += 58
        d.line((tx(k['tHit']), 632, tx(k['tHit']), 724), fill=(255, 255, 255), width=1); d.text((tx(k['tHit']) + 4, 668), 'impact', font=F10, fill=TXT)
        d.line((tx(t), 628, tx(t), 728), fill=AMB, width=2)
        for s in range(0, 4): d.text((tx(s) - 3, 730), f'{s}s', font=F10, fill=DIM); d.line((tx(s), 724, tx(s), 728), fill=DIM)
        d.text((X0, 762), f't = {t:4.2f} s', font=B20, fill=TXT)
        notes = [f"line locks when the blades go up; the walker has {k['tLand'] - k['tLock']:.2f} s to clear it", f"blades stay pinned {k['tFree'] - k['tLand']:.1f} s; the ram lands {k['tHit'] - k['tLand']:.2f} s into that", 'the red outline is drawn for this test only. It is not game UI.']
        for j, s in enumerate(notes): d.text((X0, 800 + j * 17), s, font=F11, fill=DIM)
        cache[i] = im; return im
    os.makedirs(f'{out}/frames', exist_ok=True); last = None
    for n, s in enumerate(J['seq']):
        im = base(s['i']).copy(); d = ImageDraw.Draw(im); d.text((X0 + 180, 766), 'REAL TIME' if s['mode'] == 'real' else 'QUARTER SPEED', font=B14, fill=AMB if s['mode'] == 'slow' else TXT); im.save(f'{out}/frames/f_{n:04d}.png')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '30', '-i', f'{out}/frames/f_%04d.png', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-movflags', '+faststart', f'{out}/validate-collision.mp4'], check=True)
    keys = [k['tLock'] + .3, k['tGo'] + .12, k['tLand'] + .02, k['tStrike'], k['tHit'], k['tHit'] + .3]; strip = Image.new('RGB', (CW * 3, CH * 2), BG)
    for j, t in enumerate(keys):
        i = min(range(len(fr)), key=lambda q: abs(fr[q]['t'] - t)); strip.paste(base(i), ((j % 3) * CW, (j // 3) * CH))
    strip.save(f'{out}/clip-check.png'); print('clip', len(J['seq']), 'frames', json.dumps(J['K']['r']))
