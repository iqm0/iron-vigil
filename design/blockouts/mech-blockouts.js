/* Three walker blockouts, big masses only, to be judged as flat black shapes at gameplay scale before anything is detailed.
   Loaded after js/game.js by design/blockouts/sheet.js; never by the game. Each sets its own rig proportions and replaces drawMech.
   Conventions as in the game: +Z forward, cannon on -X, ram on +X, heading g.head for the legs, g.aim for whatever turns to shoot.
   Three values only: one light body colour, a near-black frame, and the lit cockpit as the accent. */
const BODY = [.86, .5, .05], FRAME = [.05, .055, .065], GLASS = [.015, .03, .05], SKIN = [.6, .58, .52], PANEL = [1, .6, .2];
function blkLegs(g, o) {       // pelvis and two legs on the game's own planted feet; leaves the stack in the pelvis frame and returns walk values
  const hx = Math.sin(g.head), hz = Math.cos(g.head), rx = hz, rz = -hx, sp = Math.hypot(g.vx, g.vz), wk = clamp(sp / 6.4, 0, 1), FW = [hx, 0, hz], RT = [rx, 0, rz], hipX = o.hipX || HIPW;
  let py = HIP + g.bob.x - Math.max(-.1, g.crouch.x) * .32 - g.heat * .07;
  for (let i = 0; i < 2; i++) { const f = g.feet[i], side = i ? -1 : 1, dh = Math.hypot(f.x - g.x - rx * side * HIPW, f.z - g.z - rz * side * HIPW); py = Math.min(py, Math.sqrt(Math.max(.5, REACH * REACH - dh * dh)) + f.y * .5 + .2); }
  g.py = py; g.bulk = 1; const sway = Math.sin(g.phase * TAU) * .07 * wk, twist = Math.sin(g.phase * TAU) * .09 * wk;
  if (!window.SILH) decal(g.x, g.z, o.shadow || 2.2, o.shadow || 2.2, 0, 0, 0, 0, 0, .55);
  reset(); T(g.x + rx * sway, py, g.z + rz * sway); RX(g.lz.x); RZ(-g.lx.x); RY(g.head + twist);
  box(0, 0, 0, hipX * 2 + .5, .44, .8, FRAME, -.6); push(); T(0, .3, 0); draw(MESH.cyl, 1.1, .24, 1.1, FRAME, -.8); pop();
  for (let i = 0; i < 2; i++) { const f = g.feet[i], side = i ? -1 : 1, pf = o.pole === 'fwd' ? 1 : o.pole === 'out' ? 0 : -1, po = o.pole === 'out' ? 1 : 0; xf(side * hipX, -.06, 0, _H); _A[0] = f.x; _A[1] = f.y + .26; _A[2] = f.z; _P[0] = hx * pf + rx * side * po; _P[1] = o.pole === 'out' ? .9 : .3; _P[2] = hz * pf + rz * side * po; ik2(_H, _A, L1, L2, _P, _K);
    seg(MESH.cube, _H, _K, o.thigh[0], o.thigh[1], BODY, 0, o.pole === 'out' ? FW : RT); seg(MESH.cube, _K, _A, o.shin[0], o.shin[1], FRAME, -.7, RT);
    W0(); T(_K[0], _K[1], _K[2]); RY(g.head); RZ(Math.PI / 2); if (o.pole === 'out') RX(Math.PI / 2); draw(MESH.cyl, o.knee, o.thigh[0] + .16, o.knee, FRAME, -.7); pop();
    W0(); T(_H[0], _H[1], _H[2]); RY(g.head); RZ(Math.PI / 2); draw(MESH.cyl, .66, .46, .66, FRAME, -.7); pop();
    W0(); T(f.x, f.y + .13, f.z); RY(f.a); box(0, 0, .12, o.foot[0], .26, o.foot[1], FRAME, -.6); box(0, .15, .12, o.foot[0] * .8, .08, o.foot[1] * .8, BODY); pop();
    if (!window.SILH) decal(f.x, f.z, .7, .95, f.a, 0, 0, 0, 0, .6 * (1 - Math.min(1, f.y * 2.2))); }
  return { wk, twist, burst: g.ram.x, sw: Math.sin(g.phase * TAU) * .14 * wk };
}
const g_lampP = [0, 0, 0];
function blkLamp(x, y, z) { xf(x, y, z, g_lampP); G.lampP[0] = g_lampP[0]; G.lampP[1] = g_lampP[1]; G.lampP[2] = g_lampP[2]; xfd(0, -.72, 1, G.lampD); box(x, y, z - .1, .4, .3, .3, FRAME); box(x, y, z + .06, .3, .22, .03, [1, .92, .75], 3); }
function blkPilot(x, y, z) { box(x, y, z - .3, .6, .8, .14, FRAME); box(x, y + .1, z - .08, .56, .5, .36, [.09, .1, .13]); push(); T(x, y + .52, z - .04); draw(MESH.sph, .44, .44, .46, SKIN, -.7); pop(); box(x, y - .05, z + .4, .6, .1, .1, PANEL, 1.4); }       // seat, shoulders, a pale helmet, the panel lit in front
function blkGun(len, thick, top) {       // three barrels in a shroud, drawn along +Z from the current frame; sets the muzzle
  box(0, 0, .5, thick * 1.5, thick * 1.6, 1.3, FRAME, -.6); if (top) box(0, thick * .85, .45, thick * 1.3, .1, 1.2, BODY);
  push(); T(0, 0, 1.1 + len * .2); RX(Math.PI / 2); draw(MESH.cyl, thick * 1.35, len * .4, thick * 1.35, BODY, 0); pop();
  push(); T(0, 0, 1.1 + len / 2); RZ(G.spin); for (let q = 0; q < 3; q++) { push(); RZ(q * TAU / 3); T(0, thick * .3, 0); RX(Math.PI / 2); draw(MESH.cyl, thick * .45, len, thick * .45, FRAME, -.9); pop(); } pop();
  push(); T(0, 0, 1.1 + len - .15); RX(Math.PI / 2); draw(MESH.cyl, thick * 1.3, .32, thick * 1.3, FRAME, -.7); pop();
  xf(0, 0, 1.1 + len, _B); G.muz[0] = _B[0] - G.x; G.muz[1] = _B[1]; G.muz[2] = _B[2] - G.z;
}
const BLOCKOUTS = {
  /* A: LONG GUN. A narrow fuselage that is mostly barrel, turning on a wide hip boom with the legs right out at its ends. Plan view: an arrow on a bar. */
  longgun: { rig: { HIP: 1.6, HIPW: 1.45, L1: 1.3, L2: 1.45, REACH: 2.5, STRIDE: 3.5 }, draw(g) {
    const L = blkLegs(g, { thigh: [.5, .66], shin: [.36, .42], knee: .6, foot: [.8, 1.4], shadow: 2.6 }); if (g.dead) return;
    T(0, .42, 0); RY(g.aim - g.head - L.twist); RX(-g.rec.x * .3 + L.burst * .2); RZ(g.roll.x * .04);
    box(0, .55, 0, 1.25, .9, 2.3, BODY); box(0, .6, -1.45, 1.0, .8, .7, FRAME, -.6); push(); T(.35, 1.5, -1.5); draw(MESH.cyl, .22, 1.0, .22, FRAME, -.8); pop();       /* fuselage, engine, one stack */
    box(0, .5, 1.35, 1.25, .55, .6, BODY); box(0, .52, 1.3, 1.0, .5, .5, FRAME); blkPilot(.3, .5, 1.25); for (const q of [-1, 1]) { xf(q * .58, .8, 1.6, _A); xf(q * .4, 1.3, 1.0, _B); seg(MESH.cube, _A, _B, .1, .1, FRAME); }       /* open nose cage, the mechanic sitting in it beside the barrel root */
    blkLamp(-.4, .9, 1.62);
    push(); T(0, 1.4, -1.1); RY(angDiff(g.aim, g.gunA)); RX(g.pitch.x - g.kick.x * .05); T(0, 0, -clamp(g.kick.x, -.3, 1.6) * .3); box(0, 0, -.1, .9, .85, 1.0, FRAME); blkGun(3.6, .58, true); pop();       /* the gun, on the centreline, over everything */
    const r = clamp(g.ram.x, -.2, 1.25); push(); T(.95, .45, .1); box(0, 0, 0, .56, .6, 1.9, FRAME, -.6); box(0, 0, 1.0 + r * .7, .3, .3, 1.2 + r * 1.4, FRAME, -.9); push(); T(0, 0, 1.75 + r * 1.5); draw(MESH.cube, 1.0, 1.0, .9, BODY); pop(); pop();       /* the ram: one piston along the left flank with a block head */
  } },
  /* B: LOPSIDED. The right arm is the gun and outweighs everything; the left is a short pile-driver carried low. The mechanic sits in an open bucket on the front-left corner as its counterweight. Plan view: an L. */
  lopsided: { rig: { HIP: 1.85, HIPW: 1.3, L1: 1.2, L2: 1.25, REACH: 2.38, STRIDE: 3.4 }, draw(g) {
    const L = blkLegs(g, { thigh: [.54, .68], shin: [.38, .44], knee: .62, foot: [.9, 1.4], shadow: 2.6 }); if (g.dead) return;
    T(0, .42, 0); RY(g.aim - g.head - L.twist); RX(-g.rec.x * .3 + L.burst * .2); RZ(g.roll.x * .04);
    box(0, .65, -.2, 1.5, 1.0, 1.4, BODY); box(.1, .7, -1.15, 1.2, .85, .6, FRAME, -.6); push(); T(.5, 1.6, -1.2); draw(MESH.cyl, .24, 1.0, .24, FRAME, -.8); pop();       /* core, engine, one stack */
    box(.5, .45, .9, 1.1, .7, 1.0, BODY); box(.5, .5, .9, .86, .66, .76, FRAME); blkPilot(.5, .55, .85); xf(0, 1.15, .4, _A); xf(1.0, 1.15, .4, _B); seg(MESH.cube, _A, _B, .14, .14, BODY); for (const q of [0, 1.0]) { xf(q, .6, .4, _A); xf(q, 1.15, .4, _B); seg(MESH.cube, _A, _B, .14, .14, BODY); }       /* the bucket and its hoop */
    blkLamp(1.0, 1.3, .5);
    push(); T(-1.35, .85, -.1); push(); T(0, 0, -1.0); RZ(Math.PI / 2); draw(MESH.cyl, 1.15, .7, 1.15, BODY); pop(); RY(angDiff(g.aim, g.gunA)); RX(g.pitch.x - g.kick.x * .05); T(0, 0, -clamp(g.kick.x, -.3, 1.6) * .3); box(0, 0, 0, 1.0, 1.0, 1.4, FRAME, -.6); box(0, .52, 0, .8, .08, 1.2, BODY); T(0, 0, -.2); blkGun(2.9, .7, false); pop();       /* the gun arm: breech the size of the core, drum behind the shoulder */
    const r = clamp(g.ram.x, -.2, 1.25); xf(1.05, .7, -.1, _A); xf(1.25, .35, .9 + r * .5, _K); seg(MESH.cube, _A, _K, .6, .66, FRAME, -.6); xf(1.25, .1, 1.55 + r * 1.5, _F); seg(MESH.cube, _K, _F, .4, .4, FRAME, -.9); push(); T(1.25, .1, 1.7 + r * 1.5); draw(MESH.cube, 1.15, 1.15, .5, BODY); pop();       /* the pile-driver: short, thick, a square head */
  } },
  /* C: CRAB. A low deck slung between legs that reach out sideways, so the legs are the outline. A plough across the front, a glazed cab at the back, the gun on a turntable above the deck turning alone. Plan view: a wide bar with a clock hand. */
  crab: { rig: { HIP: 1.25, HIPW: 1.9, L1: 1.3, L2: 1.5, REACH: 2.3, STRIDE: 3.2 }, draw(g) {
    const L = blkLegs(g, { hipX: 1.0, pole: 'out', thigh: [.5, .6], shin: [.4, .46], knee: .66, foot: [.9, 1.2], shadow: 2.9 }); if (g.dead) return;
    T(0, .3, 0); RX(-g.rec.x * .2 + L.burst * .2); RZ(g.roll.x * .04);       /* the deck does not turn to aim */
    box(0, .35, 0, 2.3, .6, 1.5, BODY); box(0, .5, -1.1, 1.8, .7, .7, FRAME, -.6);
    box(0, 1.0, -.55, 1.1, .9, .9, BODY); box(0, 1.15, -.08, .9, .5, .04, GLASS, -.95); box(.56, 1.15, -.55, .04, .5, .7, GLASS, -.95); box(-.56, 1.15, -.55, .04, .5, .7, GLASS, -.95); box(0, 1.15, -.1, .5, .12, .02, PANEL, 1.4);       /* the cab, glazed, at the rear */
    blkLamp(.8, .75, .78);
    const r = clamp(g.ram.x, -.2, 1.25); for (const q of [-1, 1]) { xf(q * .8, .3, .7, _A); xf(q * .8, .1, 1.4 + r * 1.2, _F); seg(MESH.cube, _A, _F, .3, .3, FRAME, -.9); }
    push(); T(0, .15, 1.55 + r * 1.2); RX(-.12); box(0, 0, 0, 2.6, 1.0, .22, BODY); box(0, -.5, .12, 2.7, .2, .34, FRAME, -.8); pop();       /* the plough */
    push(); T(0, 1.55, .25); box(0, -.45, 0, .5, .9, .5, FRAME); RY(g.gunA - g.head - L.twist); draw(MESH.cyl, 1.2, .24, 1.2, FRAME, -.7); T(0, .4, -.5); RX(g.pitch.x - g.kick.x * .05); T(0, 0, -clamp(g.kick.x, -.3, 1.6) * .3); box(0, 0, -.2, .8, .7, .8, FRAME); blkGun(3.0, .56, true); pop();       /* the gun on its pedestal */
  } },
};
function useBlockout(name) { const b = BLOCKOUTS[name], inner = name === 'current' ? drawMech : b.draw; if (b) ({ HIP, HIPW, L1, L2, REACH, STRIDE } = b.rig);
  drawMech = g => { if (!window.SILH) return inner(g); const d0 = draw, s0 = seg, M = [1, 0, 1]; draw = (m, sx, sy, sz) => d0(m, sx, sy, sz, M, 9); seg = (m, A, B, w, d, c, e, ref) => s0(m, A, B, w, d, M, 9, ref); inner(g); draw = d0; seg = s0; }; }       // SILH: the walker alone in flat magenta, for cutting a silhouette out of the frame
