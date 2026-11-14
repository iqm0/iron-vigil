#!/usr/bin/env python3
"""Repack the FLARE (flareteam/flare-game, CC-BY-SA 3.0) sprites this game uses into a few small atlases.

Usage: python3 -I tools/build_assets.py <dir with raw FLARE files> assets/
The raw files are fetched from https://github.com/flareteam/flare-game (mods/fantasycore); see CREDITS.md.
"""
import json, os, re, sys
from PIL import Image

SRC, OUT = sys.argv[1], sys.argv[2]
DIRS = ['SW', 'W', 'NW', 'N', 'NE', 'E', 'SE', 'S']

def parse(txt):
    an, cur = {}, None
    for ln in open(os.path.join(SRC, txt)):
        ln = ln.strip(); m = re.match(r'\[(\w+)\]', ln)
        if m: cur = m.group(1); an[cur] = {'frames': {}, 'n': 0, 'dur': 0}; continue
        if not cur: continue
        if ln.startswith('frames='): an[cur]['n'] = int(ln[7:])
        elif ln.startswith('duration='): an[cur]['dur'] = int(re.sub(r'\D', '', ln[9:]))
        elif ln.startswith('frame='): v = [int(x) for x in ln[6:].split(',')]; an[cur]['frames'][(v[0], v[1])] = v[2:]
    return an

class Packer:
    def __init__(self, width=2048): self.w = width; self.items = []
    def add(self, img, ox, oy):
        bb = img.getbbox()
        if bb is None: img = Image.new('RGBA', (1, 1)); ox = oy = 0
        else: img = img.crop(bb); ox -= bb[0]; oy -= bb[1]
        self.items.append([img, ox, oy, None]); return len(self.items) - 1
    def pack(self):
        order = sorted(range(len(self.items)), key=lambda i: -self.items[i][0].height); x = y = rowh = 0
        for i in order:
            im = self.items[i][0]
            if x + im.width + 1 > self.w: x = 0; y += rowh + 1; rowh = 0
            self.items[i][3] = (x, y); x += im.width + 1; rowh = max(rowh, im.height)
        H = y + rowh; sheet = Image.new('RGBA', (self.w, H))
        for im, ox, oy, (px, py) in self.items: sheet.paste(im, (px, py))
        return sheet, [[p[0], p[1], im.width, im.height, ox, oy] for im, ox, oy, p in self.items]

def save(sheet, name, q=82):
    path = os.path.join(OUT, name + '.webp'); sheet.save(path, 'WEBP', quality=q, method=6, alpha_quality=95); return os.path.getsize(path)

META = {}

def creature(name, layers, anims, order=None):
    """layers: list of (slot, file stem). Composes layered FLARE avatars into one frame per (anim, frame, direction)."""
    L = {slot: (Image.open(os.path.join(SRC, stem + '.png')).convert('RGBA'), parse(stem + '.txt')) for slot, stem in layers}
    P = Packer(); out = {}
    for a in anims:
        ref = L[layers[0][0]][1][a]; ids = []
        for i in range(ref['n']):
            for d in range(8):
                slots = order[DIRS[d]] if order else [layers[0][0]]
                parts = []
                for s in slots:
                    if s not in L: continue
                    img, an = L[s]; fr = an[a]['frames'].get((i, d))
                    if fr: x, y, w, h, ox, oy = fr; parts.append((img.crop((x, y, x + w, y + h)), ox, oy))
                mx = max(p[1] for p in parts); my = max(p[2] for p in parts)
                W = max(mx - p[1] + p[0].width for p in parts); H = max(my - p[2] + p[0].height for p in parts)
                canvas = Image.new('RGBA', (W, H))
                for sp, ox, oy in parts: canvas.alpha_composite(sp, (mx - ox, my - oy))
                ids.append(P.add(canvas, mx, my))
        out[a] = {'n': ref['n'], 'dur': ref['dur'], 'ids': ids}
    sheet, rects = P.pack(); size = save(sheet, name)
    META[name] = {'img': name, 'anims': {a: {'n': v['n'], 'dur': v['dur'], 'f': [rects[i] for i in v['ids']]} for a, v in out.items()}}
    print(f'{name}: {sheet.size} {size / 1024:.0f} KB')

order = {}
for ln in open(os.path.join(SRC, 'hero_layers.txt')):
    if ln.startswith('layer='): p = ln.strip()[6:].split(','); order[p[0]] = p[1:]
creature('hero', [('chest', 'h_plate_cuirass'), ('feet', 'h_plate_boots'), ('legs', 'h_plate_greaves'), ('hands', 'h_plate_gauntlets'), ('head', 'h_plate_helm'), ('main', 'h_greatstaff')], ['stance', 'run', 'cast', 'hit', 'die'], order)
creature('ant', [('b', 'antlion_small')], ['run', 'swing', 'block', 'hit', 'die'])
creature('fireant', [('b', 'fire_ant')], ['run', 'shoot', 'hit', 'die'])
creature('antlion', [('b', 'antlion')], ['run', 'swing', 'block', 'hit', 'die'])

# effects and loot: one direction is enough except for things that fly
P = Packer(1024); FX = {}
def fx(name, stem, dirs):
    img = Image.open(os.path.join(SRC, stem + '.png')).convert('RGBA'); an = list(parse(stem + '.txt').values())[0]; ids = []
    for i in range(an['n']):
        for d in dirs: x, y, w, h, ox, oy = an['frames'][(i, d)]; ids.append(P.add(img.crop((x, y, x + w, y + h)), ox, oy))
    FX[name] = {'n': an['n'], 'dur': an['dur'], 'dirs': len(dirs), 'ids': ids}
fx('bolt', 'p_fireball', range(8)); fx('spit', 'p_spit', range(8)); fx('spark', 'p_spark_orange', [0]); fx('blast', 'p_blast', [0]); fx('quake', 'p_quake', [0]); fx('gold', 'l_coins25', [0]); fx('potion', 'l_hp_potion', [0])
sheet, rects = P.pack(); size = save(sheet, 'fx', 84)
META['fx'] = {'img': 'fx', 'anims': {k: {'n': v['n'], 'dur': v['dur'], 'dirs': v['dirs'], 'f': [rects[i] for i in v['ids']]} for k, v in FX.items()}}
print(f'fx: {sheet.size} {size / 1024:.0f} KB')

# world: cave floor and props, plus the animated brazier from the dungeon set
P = Packer(2048); T = {}
def tiles(stem):
    img = Image.open(os.path.join(SRC, stem + '.png')).convert('RGBA'); defs = {}; anim = {}
    for ln in open(os.path.join(SRC, stem + '.txt')):
        if ln.startswith('tile='): v = [int(x) for x in ln.strip()[5:].split(',')]; defs[v[0]] = v[1:]
        elif ln.startswith('animation='): a, rest = ln.strip()[10:].split(';', 1); anim[int(a)] = [[int(q) for q in p.split(',')[:2]] for p in rest.split(';') if p]
    return img, defs, anim
img, defs, _ = tiles('tileset_cave')
def grab(key, ids, img=img, defs=defs):
    T[key] = []
    for t in ids: x, y, w, h, ox, oy = defs[t]; T[key].append(P.add(img.crop((x, y, x + w, y + h)), ox, oy))
grab('floor', range(16, 32)); grab('decor', range(48, 56)); grab('spire', [144, 145, 146, 147]); grab('rock', [150, 151, 152, 153]); grab('shroom', [132, 133, 134, 135]); grab('crate', [162, 163, 128, 130])
dimg, ddefs, danim = tiles('tileset_dungeon'); x, y, w, h, ox, oy = ddefs[167]; T['brazier'] = [P.add(dimg.crop((fx_, fy_, fx_ + w, fy_ + h)), ox, oy) for fx_, fy_ in danim[167]]
sheet, rects = P.pack(); size = save(sheet, 'world', 88)
META['world'] = {'img': 'world', 'tiles': {k: [rects[i] for i in v] for k, v in T.items()}}
print(f'world: {sheet.size} {size / 1024:.0f} KB')

open(os.path.join(OUT, 'atlas.js'), 'w').write('window.ATLAS=' + json.dumps(META, separators=(',', ':')) + ';')
print('atlas.js', os.path.getsize(os.path.join(OUT, 'atlas.js')) // 1024, 'KB')
