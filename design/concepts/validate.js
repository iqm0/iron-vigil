/* Final validation before modelling: the same ANVIL and HOOK STALKER as round three, with every pose a blend so they can be animated, the stalker's size a parameter,
   and one optional treatment of the walker's face. Not in the game. Loaded after js/game.js, concepts.js, anvil.js and round3.js. */
const STRIKER = [0, 0, 0], P4H = { a: [.105, .175, .265], b: [.5, .49, .45], f: [.05, .05, .06], s: [.42, .42, .41], p: [.3, .08, .05], t: [.09, .09, .09], d: [.09, .082, .07], h: [.06, .052, .06] };
function anvil4(P, o) { o = o || {}; const ph = o.walk || 0, wkw = o.wk !== undefined ? o.wk : o.walk !== undefined ? 1 : 0, rw = o.rw || 0, ri = o.ri || 0, S = o.S || 2.5, ease = u => u * u * (3 - 2 * u), turn = o.turn || 0, H = !!o.hard, aim = o.aim || 0, bs = o.brace || 0,
    B = (r, w, a, b) => r + (w - r) * wkw + (a - r) * rw + (b - r) * ri;       /* rest, walking, ram wound up, ram landed */
  const foot = i => { const s = i ? -1 : 1, q = (ph + i * .5) % 1; let wz, wy = 0, wp = 0; if (q < .6) wz = S / 2 - S * q / .6; else { const u = (q - .6) / .4; wy = Math.sin(u * Math.PI) * .8; wz = -S / 2 + S * ease(u); wp = (u < .5 ? .4 : -.25) * Math.sin(u * Math.PI); }
    return [s * B(1.45, 1.45, 1.5, 1.5) + (i ? 0 : bs * 1.1), B(0, wy, 0, 0) + (i ? 0 : o.hop || 0), B(0, wz, i ? -.75 : .55, i ? -1.35 : 1.45) * (1 - bs) + bs * (i ? .3 : -.9), B(0, wp, 0, i ? .3 : 0) * (1 - bs)]; };       /* brace: the left foot steps out toward a target on that side */
  const c4 = Math.cos(4 * Math.PI * ph), s2 = Math.sin(TAU * ph), bob = B(0, -.11 * c4 - .05, -.34, -.16), sway = B(0, .2 * Math.sin(TAU * (ph - .05)), 0, 0), pyaw = B(0, .08 * s2, .12, -.2) * (1 - bs), lg = B(0, 0, -.25, o.lunge === undefined ? .75 : o.lunge), pz = lg * Math.cos(aim), px = lg * Math.sin(aim);
  const lean = B(.1, .15 + .035 * c4, -.13, .3), tyaw = aim + B(0, -.13 * s2, .34, -.3) * (aim ? .35 : 1), roll = B(0, .04 * Math.sin(TAU * (ph - .05)), 0, 0);
  for (let i = 0; i < 2; i++) { const s = i ? -1 : 1, f = foot(i); push(); T(f[0], f[1], f[2]); RX(f[3]);       /* the feet: the widest, lowest, dirtiest thing on it */
    box(0, .27, .3, 1.45, .54, 2.2, P.d); box(0, .58, .2, 1.15, .1, 1.7, P.a); for (const q of [-.37, .37]) box(q, .33, 1.5, .62, .56, .5, s > 0 && q < 0 ? P.p : P.a); box(0, .42, -.9, .95, .5, .4, P.d); pop(); }
  push(); T(sway + px, 2.25 + bob, .1 + pz); RY(pyaw); RZ(roll);
    box(0, 0, 0, 2.6, .72, 1.35, P.f); cy(0, .47, 0, 1.8, .3, 'y', P.t);
    for (let i = 0; i < 2; i++) { const s = i ? -1 : 1, f = foot(i); xf(s * 1.2, 0, 0, _kh); push(); M4.ident(STK[sp]); RY(turn); if (o.at) { M4.ident(STK[sp]); T(o.at[0], 0, o.at[1]); RY(turn); } xf(f[0], f[1] + .62, f[2] - Math.sin(f[3]) * .5, _ka); xfd(0, .25, -1, _kp); pop(); ik2(_kh, _ka, 1.2, 1.19, _kp, _kk);
      xfd(1, 0, 0, _kp); const R = [_kp[0], _kp[1], _kp[2]]; seg(MESH.cube, _kh, _kk, 1.1, 1.05, P.a, 0, R); seg(MESH.cube, _kk, _ka, .95, .9, P.d, -.3, R);
      for (const J of [[_kh, 1.05, 1.26], [_kk, 1.0, 1.26]]) { push(); M4.ident(STK[sp]); T(J[0][0], J[0][1], J[0][2]); RY(turn + pyaw); RZ(Math.PI / 2); draw(MESH.cyl, J[1], J[2], J[1], P.f, -.4); pop(); } }
    T(0, .6, 0); RY(tyaw - pyaw); RX(lean);
    box(0, .75, -.1, 2.9, 1.5, 2.1, P.a); box(0, 1.3, -.05, 3.3, .55, 2.3, P.a); box(0, .08, .92, 2.7, .3, .3, P.f); box(-.95, .8, .96, .8, .7, .05, P.s);       /* the chest, and the weld on it */
    box(0, .8, -1.38, 2.3, 1.3, .8, P.f); for (const y of [.45, .75, 1.05]) box(0, y, -1.8, 1.9, .12, .05, P.b);
    /* the bonnet: hood, radiator grille, two lamps. This is its face */
    box(0, .7, 1.85, 1.4, 1.1, 1.9, P.a); box(0, 1.28, 1.85, 1.1, .06, 1.8, H ? P.s : P.b); box(0, .7, 2.82, 1.24, .96, .06, P.t); for (const y of [.4, .7, 1.0]) box(0, y, 2.86, 1.04, .1, .03, H ? P.s : P.b);
    if (H) { for (const s of [-1, 1]) { box(s * .92, 1.0, 2.5, .6, .56, .4, P.f); box(s * .92, 1.0, 2.71, .34, .28, .03, s < 0 ? CG : P.t, s < 0 ? 2 : 0); } for (const q of [-.42, -.14, .14, .42]) box(q, .7, 2.95, .08, 1.06, .08, P.f); box(0, .18, 3.0, 2.0, .26, .2, P.f); box(0, 1.2, 2.97, 1.5, .1, .1, P.f); }       /* treated: lamps boxed in and one of them dead, a welded guard over the grille, a bar across the nose */
    else for (const s of [-1, 1]) { cy(s * .88, 1.0, 2.5, .48, .3, 'z', P.f); cy(s * .88, 1.0, 2.67, .38, .04, 'z', CG, 2); }
    cy(.5, 1.9, 1.5, .22, 1.4, 'y', P.h); push(); T(.5, 2.62, 1.5); RX(-.5 - .7 * ri); draw(MESH.cyl, .28, .04, .28, P.h); pop();
    /* the rider: an open seat on top, behind the hood, at a wheel, with a two-post bar behind his head and nothing over it */
    box(0, 1.64, .35, 1.6, .12, 1.4, P.f); box(0, 1.95, -.2, .76, .6, .16, P.t); pilot(0, 1.72, .15, H ? 1.02 : 1.2); if (H) for (const s of [-1, 1]) box(s * .78, 1.95, .3, .1, .5, 1.1, P.f); push(); T(0, 2.32, .8); RX(-.95); draw(MESH.cyl, .66, .05, .66, P.t); pop(); sg([0, 1.7, .97], [0, 2.3, .78], .08, .08, P.t);
    for (const s of [-1, 1]) box(s * .82, 2.45, -.38, .13, 1.6, .13, P.b); box(0, 3.22, -.38, 1.77, .13, .13, P.b);
    /* shoulders: a trunnion each, a gusset back to the chest, a mudguard over the top. The left one came off a red harvester */
    for (const s of [-1, 1]) { const c = s > 0 ? P.p : P.a; cy(s * 1.9, 1.2, 0, 1.25, 1.3, 'x', P.f); sg([s * 1.2, .5, .3], [s * 1.9, 1.0, .1], .3, .5, P.t);
      push(); T(s * 1.9, 1.88, -.05); draw(MESH.cube, 1.42, .1, 1.0, c); pop(); push(); T(s * 1.9, 1.62, .82); RX(.75); draw(MESH.cube, 1.42, .1, .8, c); pop(); push(); T(s * 1.9, 1.62, -.92); RX(-.75); draw(MESH.cube, 1.42, .1, .8, c); pop(); box(s * 2.6, 1.4, -.05, .08, .9, 1.9, c); }
    for (const q of [-.36, 0, .36]) { box(1.9 + q, 1.27, .92, .28, .26, .3, P.f); box(1.9 + q, 1.27, 1.08, .2, .18, .02, CG, 2); }
    /* the gun arm */
    push(); T(-1.9, 1.2, 0); RX(B(0, .05 * s2, .1, -.16)); T(1.9, -1.2, 0);
      sg([-2.0, 1.0, .2], [-2.05, .2, .95], .82, .82, P.f); cy(-2.05, .2, .95, .92, .98, 'x', P.t); sg([-1.5, 1.05, .85], [-2.0, -.05, 1.55], .2, .2, P.s);
      box(-2.05, -.25, 1.8, 1.12, 1.16, 1.8, P.a); box(-2.05, .36, 1.8, .86, .1, 1.5, P.f); cy(-2.05, -.25, .78, 1.05, .62, 'x', P.b); box(-2.05, -.25, 2.62, 1.14, 1.18, .2, P.h); for (const y of [.02, -.52]) { cy(-2.05, y, 2.95, .47, .66, 'z', P.h); cy(-2.05, y, 3.26, .58, .14, 'z', P.t); } pop();
    /* the ram arm. The drum and its guide rods are the pile-driver; the striker is three corn-header snouts cut short, boxed together and bolted to a crosshead: a toothed wedge, not a hand */
    const ex = B(0, 0, -.3, 1.35); push(); T(1.9, 1.2, 0); RX(B(0, -.05 * s2, -.5, .12)); T(-1.9, -1.2, 0);
      sg([2.0, 1.0, .2], [2.05, .2, .95], .82, .82, P.f); cy(2.05, .2, .95, .92, .98, 'x', P.t); sg([1.5, 1.05, .85], [2.0, -.05, 1.55], .2, .2, P.s);
      cy(2.05, -.25, 1.55, 1.14, 1.6, 'z', P.a); cy(2.05, -.25, 2.3, 1.2, .16, 'z', P.f); for (const q of [-1, 1]) cy(2.05 + q * .47, .34, 1.7 + ex * .5, .17, 1.9 + ex, 'z', P.s); cy(2.05, -.25, 2.55 + ex * .5, .46, .7 + ex, 'z', P.s);
      push(); T(2.05, -.25, 2.98 + ex); box(0, 0, 0, 2.1, .9, .44, P.f); for (const q of [-1, 1]) { box(q * .9, .5, -.25, .16, .3, .7, P.f); sg([q * .47, .59, -1.2], [q * .47, .2, -.1], .12, .12, P.s); }       /* crosshead, tied back to the guide rods */
        for (const q of [-.7, 0, .7]) { push(); T(q, -.06, .2); RX(Math.PI / 2); T(0, .42, 0); draw(MESH.taper, .86, .84, .98, P.p, -.2); T(0, .47, 0); draw(MESH.taper, .5, .2, .56, P.s, -.6); pop(); box(q, .36, .5, .5, .07, .66, P.s); } xf(0, -.06, 1.1, STRIKER); pop();       /* three blunt snouts, shoulder to shoulder, red where the paint is left and bright steel where it is not */
    pop();
  pop(); }
/* HOOK STALKER. Rounded masses for muscle, flat plates for shell on top of them, and the blade growing out of the forearm through a sheath. pose: 'stalk', 'wind' or 'stuck' */
function stalker4(pose, size) { const K = [.045, .045, .055], K2 = [.085, .085, .1], K3 = [.3, .28, .25], q = typeof pose === 'string' ? { w: pose === 'wind' ? 1 : 0, u: pose === 'stuck' ? 1 : 0 } : pose || {}, w = q.w || 0, u = q.u || 0, fl = q.flat || 0, sel = (a, b, c) => a + (b - a) * w + (c - a) * u, y0 = sel(0, -.32, -.42), pitch = sel(0, -.1, .2);
  push(); SCL(size || 1); if (fl) { const m = STK[sp]; for (const k of [4, 5, 6]) m[k] *= 1 - .6 * fl; for (const k of [0, 1, 2]) m[k] *= 1 + .18 * fl; } T(0, y0 + (q.lift || 0), 0); RX(pitch + (q.tw || 0)); RY(q.yw || 0);
    el([0, 1.7, -2.7], [0, 1.8, -.4], 2.5, 1.9, K); el([0, 1.7, -1.0], [0, 1.35, 1.1], 2.0, 1.5, K); el([0, 1.3, .7], [0, 1.02, 1.8], 1.15, 1.0, K2);       /* haunches, chest, neck: one line from hip to head */
    el([0, 1.72, -2.3], [0, sel(1.2, 1.5, 2.2), -3.8], 1.05, .85, K); el([0, sel(1.3, 1.55, 2.1), -3.5], [0, sel(.95, 1.5, 2.9), -4.7], .6, .5, K2);       /* a tail to balance it; it stands up when the blades are stuck */
    for (const [z, w, l, y, t] of [[-2.1, 2.0, 1.5, 2.5, -.12], [-1.2, 2.2, 1.5, 2.62, -.04], [-.3, 2.0, 1.4, 2.55, .08], [.5, 1.6, 1.3, 2.25, .2], [1.2, 1.1, 1.0, 1.8, .3]]) { push(); T(0, y - .2, z); RX(t); draw(MESH.scute, w, 1.2, l, K2, -.5); pop(); }       /* five plates down the back, each lapping the next */
    push(); T(0, .95, 2.2); RX(sel(.22, .05, .45)); el([0, .1, -.9], [0, -.05, 1.0], 1.2, .85, K2); push(); T(0, .34, -.5); RX(-.22); draw(MESH.scute, 1.5, 1.0, 1.9, K, -.5); pop(); el([0, -.3, .1], [0, -.38, 1.0], .7, .4, K);       /* the head: long, a crest swept back over the neck, a heavy lower jaw */
      for (const s of [-1, 1]) { for (let i = 0; i < 3; i++) { push(); T(s * (.34 + i * .07), .14, .66 - i * .28); draw(MESH.sph, .15, .12, .17, CG, 2); pop(); } push(); T(s * .3, -.28, .85); RY(s * sel(.2, .6, .1)); RX(Math.PI / 2); T(0, .42, 0); draw(MESH.blade, .9, .95, 1.2, CB, -.3); pop(); } pop();
    for (const s of [-1, 1]) {
      const hip = [s * .95, 1.7, -1.5], kn = [s * sel(1.9, 2.0, 1.7), sel(2.8, 3.05, 2.1) - y0, sel(-2.9, -2.6, -3.3)], an = [s * 1.95, .7 - y0, sel(-1.9, -1.5, -2.7)], toe = [s * 2.0, -y0, sel(-.7, -.4, -1.6)];
      el(hip, kn, 1.3, 1.2, K); sg(kn, an, .78, .78, K2, MESH.taper, [0, 0, 1]); sg(an, toe, .56, .56, K, MESH.spike, [0, 1, 0]); push(); T(kn[0], kn[1], kn[2]); draw(MESH.sph, .78, .78, .78, K2, -.4); pop();       /* hind legs: a thigh like a ham, a shank, a foot. The knee stands higher than the back */
      el([s * .9, 1.3, .2], [s * 1.75, 1.5, .6], .66, .6, K); sg([s * 1.75, 1.5, .6], [s * 1.9, -y0, .5], .44, .44, K2, MESH.spike, [0, 0, 1]);
      const sh = [s * .85, 1.5, .9], eb = [s * sel(1.9, 2.0, 1.5), sel(2.1, 3.15, 2.1), sel(1.5, .5, 2.3)], wr = [s * sel(1.7, 2.45, 1.15), sel(1.15, 4.0, 1.75), sel(3.1, 1.7, 3.6)], tp = [s * sel(.75, 1.55, .7), sel(.2, 2.5, -.45), sel(5.3, 4.3, 4.9)], rt = [wr[0] + (tp[0] - wr[0]) * .3, wr[1] + (tp[1] - wr[1]) * .3, wr[2] + (tp[2] - wr[2]) * .3];
      el(sh, eb, 1.0, .9, K); sg(eb, wr, .66, .66, K2, MESH.taper, [0, 0, 1]); el(wr, rt, .7, .62, K3); sg(wr, tp, 2.2, 2.9, CB, MESH.blade, [0, -1, .2]); push(); T(eb[0], eb[1], eb[2]); draw(MESH.sph, .7, .7, .7, K2, -.4); pop(); }       /* the arms: a muscled upper arm, a forearm, and the blade growing out of a sheath at the wrist */
  pop(); }
