/* Round two of the concept work: three ANVIL variations, each built round a different piece of farm machinery, and one refined HOOK STALKER.
   Nothing here is in the game. Loaded after js/game.js and concepts.js by sheet2.js, to borrow the renderer's helpers.
   Metres; +Z forward, +Y up. Every colour comes from a palette, so the same shapes can be shown in plain grey or in a proposed paint scheme. */
const GREY = { a: [.6, .6, .585], b: [.44, .44, .45], f: [.075, .075, .082], s: [.8, .79, .74], p: [.33, .33, .35], t: [.2, .2, .215] };
const LIV = {
  corn: { a: [.4, .085, .05], b: [.72, .66, .5], f: [.055, .055, .06], s: [.52, .52, .5], p: [.3, .31, .3], t: [.11, .1, .09] },       /* oxide red, cream, one panel in bare primer */
  hopper: { a: [.12, .25, .12], b: [.68, .54, .16], f: [.055, .06, .055], s: [.52, .52, .5], p: [.38, .2, .11], t: [.1, .1, .09] },       /* faded green, ochre, one panel in red lead */
  bonnet: { a: [.16, .26, .38], b: [.74, .72, .64], f: [.055, .055, .065], s: [.52, .52, .5], p: [.42, .1, .06], t: [.1, .1, .1] },       /* dusty blue, off-white, one fender off a red machine */
};
function jleg(s, hip, knee, ank, tw, sw, P) { sg([s * hip[0], hip[1], hip[2]], [s * knee[0], knee[1], knee[2]], tw[0], tw[1], P.a); sg([s * knee[0], knee[1], knee[2]], [s * ank[0], ank[1], ank[2]], sw[0], sw[1], P.t); cy(s * knee[0], knee[1], knee[2], Math.max(tw[1], sw[1]) * .98, tw[0] + .16, 'x', P.f); cy(s * hip[0], hip[1], hip[2], tw[1], tw[0] + .16, 'x', P.f); }
function anvil(P, v) {
  /* The lower half: nearly half the height, and as wide across the feet as the chest is across the shoulders */
  for (const s of [-1, 1]) { box(s * 1.45, .27, .3, 1.45, .54, 2.2, P.f); box(s * 1.45, .58, .2, 1.15, .1, 1.7, P.a); for (const q of [-.37, .37]) box(s * 1.45 + q, .33, 1.5, .62, .56, .5, s < 0 ? P.a : q < 0 ? P.p : P.a); box(s * 1.45, .42, -.9, .95, .5, .4, P.f);
    jleg(s, [1.2, 2.25, .1], [1.45, 1.5, -.8], [1.45, .62, 0], [1.1, 1.05], [.95, .9], P); sg([s * 1.25, 2.1, -.55], [s * 1.45, 1.0, -.62], .22, .22, P.s); box(s * 1.45, 1.05, .5, .8, .7, .1, s < 0 ? P.p : P.a); }       /* a ram behind each knee, a shin plate in front; one of them is a replacement */
  box(0, 2.25, .1, 2.6, .72, 1.35, P.f); cy(0, 2.72, .1, 1.8, .3, 'y', P.t);
  push(); T(0, 2.85, .1); RX(-.12);
    box(0, .75, -.1, 2.9, 1.5, 2.1, P.a); box(0, 1.3, -.05, 3.3, .55, 2.3, P.a); box(0, .08, .92, 2.7, .3, .3, P.f); box(-.9, .8, .96, .9, .8, .05, P.s);       /* the chest, and a welded patch on it */
    box(0, .8, -1.38, 2.3, 1.3, .8, P.f); for (const y of [.45, .75, 1.05]) box(0, y, -1.8, 1.9, .12, .05, P.b);
    for (const s of [-1, 1]) { cy(s * 1.9, 1.2, 0, 1.25, 1.3, 'x', P.f); if (v !== 'bonnet') box(s * 1.9, 1.6, -.05, 1.35, .6, 1.65, s > 0 ? P.p : P.a); sg([s * 1.2, .5, .3], [s * 1.9, 1.0, .1], .3, .5, P.t); sg([s * 2.0, 1.0, .2], [s * 2.05, .2, .95], .82, .82, P.f); cy(s * 2.05, .2, .95, .92, .98, 'x', P.t); sg([s * 1.5, 1.05, .85], [s * 2.0, -.05, 1.55], .2, .2, P.s); }       /* shoulders on trunnions, a gusset from the chest, a lift ram to each forearm */
    box(-2.05, -.25, 1.8, 1.12, 1.16, 1.8, P.a); box(-2.05, .36, 1.8, .86, .1, 1.5, P.f); cy(-2.05, -.25, .78, 1.05, .62, 'x', P.b); for (const y of [.02, -.52]) { cy(-2.05, y, 2.95, .47, .66, 'z', P.f); cy(-2.05, y, 3.26, .58, .14, 'z', P.t); }       /* right forearm: the cannon. Two fat barrels, no longer than the fist */
    cy(2.05, -.25, 1.55, 1.12, 1.6, 'z', P.a); for (const q of [-1, 1]) cy(2.05 + q * .46, .32, 1.7, .16, 1.9, 'z', P.s); cy(2.05, -.25, 2.6, .44, .6, 'z', P.s);       /* left forearm: the pile-driver. A drum, two guide rods, the driving rod */
    if (v === 'corn') { box(2.05, -.25, 2.98, 2.2, .56, .36, P.f); for (const q of [-.74, 0, .74]) { push(); T(2.05 + q, -.32, 3.1); RX(Math.PI / 2 + .1); T(0, .8, 0); draw(MESH.spike, .62, 1.6, .5, P.b, -.3); pop(); push(); T(2.05 + q, -.02, 3.3); RX(.1); draw(MESH.cube, .3, .08, .8, P.s); pop(); } }       /* CORNHEAD: the striker is a section of corn header, three snouts that go in ahead of the blow */
    else { box(2.05, -.25, 3.0, 1.48, 1.48, .32, P.f); box(2.05, -.25, 3.18, 1.22, 1.22, .06, P.t); }
    if (v === 'bonnet') {       /* BONNET: an old tractor's hood and radiator for a chest, the mechanic on an open seat behind it, mudguards for shoulders */
      box(0, .7, 1.85, 1.36, 1.06, 1.9, P.a); box(0, 1.25, 1.85, 1.1, .06, 1.8, P.b); box(0, .7, 2.82, 1.2, .92, .06, P.t); for (const y of [.42, .7, .98]) box(0, y, 2.86, 1.0, .09, .03, P.b); for (const s of [-1, 1]) { cy(s * .86, .98, 2.5, .44, .3, 'z', P.f); cy(s * .86, .98, 2.67, .34, .04, 'z', CG, 2); }
      cy(.48, 1.85, 1.5, .2, 1.3, 'y', P.t); push(); T(.48, 2.52, 1.5); RX(-.5); draw(MESH.cyl, .26, .04, .26, P.t); pop();
      box(0, 1.64, .35, 1.6, .12, 1.4, P.f); box(0, 1.9, -.2, .7, .5, .14, P.t); pilot(0, 1.72, .15, 1.15); push(); T(0, 2.3, .78); RX(-.95); draw(MESH.cyl, .62, .05, .62, P.t); pop(); sg([0, 1.7, .95], [0, 2.28, .76], .08, .08, P.t);
      for (const s of [-1, 1]) { box(s * .8, 2.4, -.35, .12, 1.5, .12, P.b); } box(0, 3.14, -.35, 1.72, .12, .12, P.b);       /* a two-post roll bar behind his head, nothing over it */
      for (const s of [-1, 1]) { const c = s > 0 ? P.p : P.a; push(); T(s * 1.9, 1.86, -.05); draw(MESH.cube, 1.4, .1, 1.0, c); pop(); push(); T(s * 1.9, 1.6, .82); RX(.75); draw(MESH.cube, 1.4, .1, .8, c); pop(); push(); T(s * 1.9, 1.6, -.92); RX(-.75); draw(MESH.cube, 1.4, .1, .8, c); pop(); box(s * 2.58, 1.4, -.05, .08, .9, 1.9, c); } }
    else {       /* the pulpit: an open tub pushed out of the chest, bars in front, a roll hoop behind the mechanic's head so nothing is over him */
      box(0, .5, 1.55, 1.8, 1.0, 1.2, P.a); box(0, .6, 1.55, 1.5, .95, .95, P.t); pilot(0, .44, 1.55, 1.1); box(0, .5, 2.18, 1.8, .5, .12, P.b); for (const q of [-.6, 0, .6]) box(q, 1.05, 2.12, .1, .62, .1, P.b); box(0, 1.38, 2.12, 1.8, .1, .1, P.b); box(0, .98, 1.98, .8, .1, .1, CG, 1.2);
      for (const s of [-1, 1]) box(s * .86, 1.5, 1.02, .12, 1.0, .12, P.b); box(0, 2.02, 1.02, 1.84, .12, .12, P.b);
      cy(.85, 2.2, -1.45, .3, 1.3, 'y', P.t); push(); T(.85, 2.88, -1.45); RX(-.5); draw(MESH.cyl, .36, .04, .36, P.t); pop(); }
    if (v === 'hopper') {       /* HOPPER: a grain tank on its back full of shells, and the unloading auger carried over the shoulder to feed the gun */
      push(); T(0, 2.75, -.95); RZ(Math.PI); RY(.63); draw(MESH.taper, 3.6, 1.9, 3.0, P.a); pop(); box(0, 3.72, -.95, 2.9, .14, 2.4, P.f); box(0, 3.66, -.95, 2.5, .08, 2.0, P.s); box(1.2, 2.6, .05, .08, 1.9, .5, P.b); for (const y of [2.0, 2.5, 3.0]) box(1.24, y, .05, .06, .06, .5, P.f);
      sg([-.9, 2.0, -.7], [-1.95, 2.75, .3], .5, .5, P.b, MESH.cyl); sg([-1.95, 2.75, .3], [-2.05, .5, 1.55], .5, .5, P.b, MESH.cyl); cy(-1.95, 2.75, .3, .62, .62, 'x', P.f); box(-2.05, .5, 1.55, .7, .3, .7, P.f); }
    for (const q of [-.36, 0, .36]) { const y = v === 'bonnet' ? 1.25 : 2.02, z = v === 'bonnet' ? .9 : .6; box(1.9 + q, y, z, .28, .26, .3, P.f); box(1.9 + q, y, z + .16, .2, .18, .02, CG, 2); }       /* three work lamps on the left shoulder */
  pop(); }
/* HOOK STALKER, refined. Six limbs like any insect, each with a job: two great hind legs to throw it, two mid legs to hold the ground, two arms that end in sickles.
   Each arm is three pieces on two joints: a thick upper arm, a long forearm, and the blade hinged at the wrist. pose 0 is stalking, pose 1 is the wind-up before it throws itself. */
function stalker(pose) { const w = pose || 0, K = [.05, .05, .058], K2 = [.095, .095, .108], L = (a, b) => a + (b - a) * w;
  push(); T(0, L(1.6, 1.25), -1.35); RX(L(-.2, -.4)); draw(MESH.shell, 2.4, 1.7, 2.9, K2, -.4); T(0, .52, .1); draw(MESH.scute, 2.3, 1.5, 2.6, K, -.5); T(0, .14, -.8); draw(MESH.scute, 1.6, 1.3, 1.6, K2, -.5); pop();       /* the haunches: where the mass is. They sink when it winds up */
  push(); T(0, L(1.2, 1.3), .55); RX(L(.2, -.05)); draw(MESH.shell, 1.8, 1.25, 2.1, K, -.4); T(0, .4, 0); draw(MESH.scute, 1.8, 1.2, 1.8, K2, -.5); pop();       /* the chest the arms hang from */
  push(); T(0, L(.9, 1.15), 1.95); RX(L(.28, .05)); draw(MESH.oct, 1.15, .72, 2.0, K2, -.4); push(); T(0, .24, -.3); RX(-.15); draw(MESH.scute, 1.5, 1.2, 1.6, K, -.5); pop();       /* the head: a heavy wedge under a brow plate, three eyes a side, jaws that open sideways */
    for (const s of [-1, 1]) { for (let i = 0; i < 3; i++) { push(); T(s * (.3 + i * .08), .14 - i * .03, .6 - i * .26); draw(MESH.oct, .14, .1, .16, CG, 2); pop(); } push(); T(s * .3, -.18, .8); RY(s * (.25 + w * .55)); RX(Math.PI / 2); T(0, .42, 0); draw(MESH.blade, 1.0, 1.0, 1.3, CB, -.3); pop(); } pop();
  push(); T(0, L(1.35, 1.05), -2.7); RX(L(-.5, -.75)); T(0, 0, -.6); draw(MESH.shell, .9, .6, 1.4, K, -.4); T(0, 0, -.7); draw(MESH.spike, .5, .4, 1.0, K2, -.4); pop();
  for (const s of [-1, 1]) {
    sg([s * 1.0, L(1.55, 1.25), -1.3], [s * 1.8, L(2.45, 2.7), -2.6], 1.15, 1.15, K, MESH.taper, [0, 0, 1]); sg([s * 1.8, L(2.45, 2.7), -2.6], [s * 1.85, .6, -1.7], .8, .8, K2, MESH.taper, [0, 0, 1]); sg([s * 1.85, .6, -1.7], [s * 1.9, 0, -.6], .58, .58, K, MESH.spike, [0, 1, 0]); cy(s * 1.8, L(2.45, 2.7), -2.6, .84, .8, 'x', K2); cy(s * 1.85, .6, -1.7, .62, .62, 'x', K2);       /* hind legs: thigh, shank, foot, each thicker than a man. The knees stand higher than its back */
    sg([s * .85, L(1.1, 1.2), .3], [s * 1.6, 1.35, .6], .62, .62, K, MESH.taper, [0, 0, 1]); sg([s * 1.6, 1.35, .6], [s * 1.75, 0, .4], .46, .46, K2, MESH.spike, [0, 0, 1]); cy(s * 1.6, 1.35, .6, .5, .5, 'x', K2);
    const sh = [s * .8, L(1.4, 1.5), 1.15], el = [s * L(1.75, 2.6), L(1.9, 2.9), L(1.5, .8)], wr = [s * L(1.55, 3.6), L(1.05, 3.4), L(2.95, 1.7)], tp = [s * L(.7, 4.0), L(.2, 1.7), L(5.1, 3.9)];
    sg(sh, el, .86, .86, K2, MESH.taper, [0, 0, 1]); sg(el, wr, .62, .62, K, MESH.taper, [0, 0, 1]); sg(wr, tp, 2.3, 2.9, CB, MESH.blade, [0, -1, .2]); cy(el[0], el[1], el[2], .8, .8, 'x', K2); cy(wr[0], wr[1], wr[2], .66, .66, 'x', K2); sg(wr, [wr[0] + s * .2, wr[1] + .7, wr[2] - .7], .34, .34, CB, MESH.spike, [0, 0, 1]); } }       /* the arms: upper arm, forearm, blade, on an elbow and a wrist. Stalking, they are carried cocked and low; winding up, the elbows go high and wide and the blades hang open */
/* grey masses for the shared scene: enough of a farm to judge distance by, and no more */
function massing() { const M = [.2, .2, .21], M2 = [.14, .14, .15];
  box(-15, 2.2, -31, 10, 4.4, 7, M); push(); T(-15, 5.3, -29.2); RX(.6); draw(MESH.cube, 10.8, .25, 4.8, M2); pop(); for (const q of [-3, 3]) box(-15 + q, 2.3, -27.46, 1.8, 1.5, .08, CG, 1.2);       /* a house, two lit windows */
  box(15, 2.8, -34, 14, 5.6, 9, M); push(); T(15, 5.9, -34); RX(.06); draw(MESH.cube, 15, .25, 10, M2); pop(); box(15, 2.1, -29.46, 7.5, 4.2, .1, M2); cy(24, 6, -42, 7, 12, 'y', M); push(); T(24, 13.2, -42); draw(MESH.cone, 7.5, 2.6, 7.5, M2); pop();       /* a shed and a silo */
  for (let i = -8; i <= 8; i++) { box(i * 3.2, .7, 16, .16, 1.4, .16, M2); box(i * 3.2 + 1.6, 1.1, 16, 3.2, .05, .05, M2); box(-25.6, .7, i * 3.2 - 6, .16, 1.4, .16, M2); box(25.6, .7, i * 3.2 - 6, .16, 1.4, .16, M2); }
  for (let i = -5; i <= 5; i++) { decal(i * 5, -6, .04, 24, 0, 2, 0, 0, 0, .3, .002); decal(0, -6 + i * 5, 28, .04, 0, 2, 0, 0, 0, .3, .002); } }       /* and a five-metre grid on the ground */
