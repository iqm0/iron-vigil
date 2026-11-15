/* Concept blockouts: five walkers and three animals, as plain grey masses. Nothing here is in the game or meant to be.
   Loaded after js/game.js by sheet.js purely to borrow the renderer's box, cylinder and segment helpers.
   Units are metres. +Z is forward, +Y up, the origin is on the ground under the middle of the thing. Three greys and one pale accent for wherever the pilot is. */
const CL = [.6, .6, .585], CM = [.3, .3, .31], CD = [.075, .075, .082], CG = [1, .96, .84], CB = [.82, .8, .74], CK = [.1, .1, .115], CK2 = [.17, .17, .19];
const _p = [0, 0, 0], _q = [0, 0, 0];
function cy(x, y, z, d, len, ax, c, e) { push(); T(x, y, z); if (ax === 'x') RZ(Math.PI / 2); else if (ax === 'z') RX(Math.PI / 2); draw(MESH.cyl, d, len, d, c, e === undefined ? -.4 : e); pop(); }
function sg(a, b, w, d, c, mesh, ref) { xf(a[0], a[1], a[2], _p); xf(b[0], b[1], b[2], _q); seg(mesh || MESH.cube, _p, _q, w, d, c, -.3, ref || [1, 0, 0]); }
function pilot(x, y, z, s) { s = s || 1; box(x, y + .32 * s, z - .05, .56 * s, .6 * s, .34 * s, [.14, .14, .16]); push(); T(x, y + .82 * s, z); draw(MESH.sph, .42 * s, .42 * s, .44 * s, CG, .5); pop(); }       /* head and shoulders: the one pale thing on the machine */
function man(x, z) { box(x - .1, .45, z, .15, .9, .18, [.36, .36, .38]); box(x + .1, .45, z, .15, .9, .18, [.36, .36, .38]); box(x, 1.2, z, .46, .62, .24, [.36, .36, .38]); push(); T(x, 1.66, z); draw(MESH.sph, .24, .26, .24, [.4, .4, .42]); pop(); if (!window.SILH) decal(x, z, .35, .35, 0, 0, 0, 0, 0, .5); }       /* a person, 1.8 m, for scale */
function leg(s, hip, knee, ank, tw, sw, c1, c2) { sg([s * hip[0], hip[1], hip[2]], [s * knee[0], knee[1], knee[2]], tw[0], tw[1], c1); sg([s * knee[0], knee[1], knee[2]], [s * ank[0], ank[1], ank[2]], sw[0], sw[1], c2); cy(s * knee[0], knee[1], knee[2], Math.max(tw[1], sw[1]) * .95, tw[0] + .14, 'x', CD); cy(s * hip[0], hip[1], hip[2], tw[1] * .95, tw[0] + .14, 'x', CD); }
const CONCEPTS = {
  /* ------------------------------------------------ walkers ------------------------------------------------ */
  anvil: { kind: 'mech', name: 'ANVIL', sub: 'the brute', h: 2.2, draw() {
    for (const s of [-1, 1]) { box(s * 1.3, .24, .3, 1.3, .48, 2.0, CD); box(s * 1.3, .52, .2, 1.0, .1, 1.5, CL); for (const q of [-.33, .33]) box(s * 1.3 + q, .3, 1.4, .56, .5, .5, CL); leg(s, [1.1, 1.8, .15], [1.3, 1.2, -.6], [1.3, .5, .05], [.95, .9], [.8, .78], CL, CM); }
    box(0, 1.8, .1, 2.0, .62, 1.1, CD); cy(0, 2.2, .1, 1.5, .34, 'y', CM);
    push(); T(0, 2.35, .1); RX(-.13);
      box(0, .7, -.1, 2.6, 1.4, 2.0, CL); box(0, 1.25, -.05, 3.0, .5, 2.2, CL); box(0, 1.56, -.3, 2.6, .16, 1.5, CM);       /* a chest that widens upward into the shoulders */
      box(0, .8, -1.25, 2.2, 1.3, .7, CD); for (const q of [-.7, .7]) cy(q, 1.95, -1.3, .32, 1.0, 'y', CM);       /* engine and stacks */
      box(0, .5, 1.5, 1.7, 1.0, 1.1, CL); box(0, .58, 1.5, 1.4, .95, .86, CD); pilot(0, .42, 1.5); box(0, .5, 2.08, 1.7, .5, .12, CM); for (const q of [-.55, 0, .55]) box(q, 1.05, 2.02, .1, .6, .1, CM); box(0, 1.4, 2.02, 1.7, .12, .12, CM); box(0, 1.5, 1.02, 2.1, .26, .34, CD);       /* the cab: an open tub pushed out of the chest, bars in front, a brow bar behind the mechanic's head so he shows from above */
      for (const s of [-1, 1]) { box(s * 1.85, 1.2, -.05, 1.25, 1.25, 1.5, CL); box(s * 1.85, 1.86, -.05, 1.35, .12, 1.6, CD); sg([s * 1.9, .8, .2], [s * 2.0, .05, .9], .75, .75, CD); cy(s * 1.95, .75, .1, .95, 1.0, 'x', CD); }
      for (const q of [-.36, 0, .36]) { box(1.85 + q, 2.02, .55, .28, .26, .3, CD); box(1.85 + q, 2.02, .71, .2, .18, .02, CG, 2); }       /* floodlights on the left shoulder */
      box(-2.0, -.3, 1.75, 1.05, 1.1, 2.0, CM); box(-2.0, .28, 1.75, .8, .1, 1.7, CL); cy(-2.0, -.3, .65, 1.0, .6, 'x', CL); for (const y of [-.02, -.56]) { cy(-2.0, y, 3.05, .46, .8, 'z', CD); cy(-2.0, y, 3.4, .56, .14, 'z', CM); }       /* right forearm: the cannon. Two fat barrels, barely longer than the fist they come out of */
      cy(2.0, -.3, 1.55, 1.05, 1.7, 'z', CM); cy(2.0, -.3, 2.6, .4, .6, 'z', CB); box(2.0, -.3, 3.0, 1.45, 1.45, .32, CD); box(2.0, -.3, 3.18, 1.2, 1.2, .06, CM); for (const q of [-1, 1]) cy(2.0 + q * .42, .36, 1.5, .2, 1.5, 'z', CB);       /* left forearm: the pile-driver. A drum, a rod, a striker plate */
    pop(); } },
  dockhand: { kind: 'mech', name: 'DOCKHAND', sub: 'the loader', h: 2.5, draw() {
    for (const s of [-1, 1]) { box(s * 1.35, .25, .1, 1.3, .5, 1.6, CD); box(s * 1.35, .54, .1, 1.0, .08, 1.2, CL); leg(s, [1.25, 2.05, -.3], [1.35, 1.15, -.85], [1.35, .5, .0], [.7, .7], [.6, .6], CL, CM); }
    box(0, 2.15, -.2, 3.1, .5, 2.5, CD); box(0, 2.85, -1.2, 2.5, 1.1, .9, CM); box(0, 3.44, -1.2, 2.3, .1, .8, CD);       /* deck and the cast counterweight */
    for (const qx of [-.75, .75]) for (const qz of [-.55, .7]) box(qx, 3.3, qz, .14, 1.9, .14, CL); box(0, 4.28, .08, 1.8, .12, 1.6, CL); box(0, 2.9, -.45, 1.0, 1.0, .16, CD); pilot(0, 2.7, -.1); box(0, 2.95, .6, .9, .12, .12, CG, 1.2);       /* the cage: four posts and a roof, the driver sitting in plain view */
    for (const s of [-1, 1]) { sg([s * 1.2, 3.2, .3], [s * 1.2, 1.7, 2.35], .42, .5, CL); sg([s * 1.2, 2.4, .2], [s * 1.2, 2.3, 1.5], .2, .2, CB); cy(s * 1.2, 3.2, .3, .7, .6, 'x', CD); }
    box(0, 1.75, 2.6, 3.3, 1.8, .26, CL); box(0, .9, 2.7, 3.4, .22, .4, CD); for (const q of [-1.1, 0, 1.1]) box(q, 1.8, 2.44, .2, 1.6, .12, CD);       /* the breach plate, carried on both lifting arms */
    cy(0, 4.42, .1, .9, .16, 'y', CD); push(); T(0, 4.72, .1); RY(.45); box(0, 0, .1, .55, .5, 1.1, CD); box(.42, -.05, -.1, .36, .4, .6, CM); cy(0, 0, 1.3, .28, 1.5, 'z', CM); cy(0, 0, 2.0, .38, .2, 'z', CD); pop();       /* the gun, on a ring on the roof, turning on its own */
    for (const q of [-.6, .6]) { box(q, 4.2, .9, .3, .22, .14, CD); box(q, 4.2, .98, .22, .15, .02, CG, 2); } } },
  heron: { kind: 'mech', name: 'HERON', sub: 'the stilt hunter', h: 2.9, draw() {
    for (const s of [-1, 1]) { box(s * 1.3, .2, .1, .7, .4, .9, CD); for (const a of [-.5, 0, .5]) { push(); T(s * 1.3, .16, .4); RY(a); box(0, 0, .6, .26, .3, .9, CL); pop(); } leg(s, [.95, 3.3, -.1], [1.3, 2.3, -1.3], [1.3, .45, .05], [.6, .7], [.4, .44], CL, CM); sg([s * 1.1, 3.0, -.6], [s * 1.3, 1.6, -.7], .16, .16, CB); }
    box(0, 3.35, -.1, 2.1, .5, .9, CD);
    box(0, 3.75, .2, 1.7, 1.1, 2.3, CL); box(0, 4.4, -.5, 1.3, .5, 1.3, CM); cy(.4, 4.9, -.8, .24, .7, 'y', CM);       /* the pod */
    push(); T(0, 3.75, 1.5); RX(.25); box(0, 0, .2, 1.4, .9, .7, CD); pop(); pilot(0, 3.45, 1.45); for (const q of [-.6, 0, .6]) sg([q, 3.35, 1.9], [q * .8, 4.25, 1.4], .08, .08, CM);       /* a caged nose */
    box(0, 2.95, .9, .56, .5, 1.3, CD); cy(0, 2.95, 2.5, .3, 2.0, 'z', CM); cy(0, 2.95, 3.45, .4, .2, 'z', CD);       /* the gun, slung under the chin like a beak */
    sg([-.95, 3.9, .1], [-1.5, 4.9, 1.2], .3, .34, CM); sg([-1.5, 4.9, 1.2], [-1.4, 4.4, 2.4], .24, .26, CM); push(); T(-1.4, 4.3, 2.5); RX(2.3); T(0, .7, 0); draw(MESH.spike, .5, 1.5, .34, CB, -.3); pop();       /* the pick: a crane arm that comes down like a beak */
    box(.5, 3.2, 1.6, .3, .26, .2, CD); box(.5, 3.2, 1.71, .22, .18, .02, CG, 2); } },
  strongroom: { kind: 'mech', name: 'STRONGROOM', sub: 'the bunker', h: 2.3, draw() {
    for (const s of [-1, 1]) { cy(s * 1.35, .24, .1, 1.6, .48, 'y', CD); cy(s * 1.35, .52, .1, 1.2, .1, 'y', CL); box(s * 1.35, .28, .85, 1.0, .4, .5, CL); leg(s, [1.25, 1.65, .1], [1.4, 1.15, -.4], [1.35, .5, .1], [1.05, 1.0], [.9, .85], CL, CM); }
    box(0, 1.7, .1, 2.2, .5, 1.2, CD);
    box(0, 2.75, -.05, 3.3, 1.7, 3.0, CL); push(); T(0, 3.3, 1.38); RX(-.62); draw(MESH.cube, 3.1, 1.1, .2, CL); pop(); push(); T(0, 2.1, 1.5); RX(.45); draw(MESH.cube, 3.1, .8, .2, CM); pop(); box(0, 3.66, -.3, 3.0, .14, 2.3, CM); for (const s of [-1, 1]) box(s * 1.72, 2.4, -.05, .14, 1.3, 2.7, CD);       /* the box: plate, a sloped front, skirts */
    box(0, 2.78, 1.52, 1.9, .26, .1, CG, 1.6); box(0, 2.78, 1.5, 2.2, .5, .08, CD);       /* the slit he drives through */
    cy(.65, 3.76, 0, 1.0, .14, 'y', CD); push(); T(.65, 3.8, -.52); RX(-1.0); draw(MESH.cyl, 1.0, .1, 1.0, CM); pop(); pilot(.65, 3.5, .02);       /* and the hatch he fights from, head and shoulders out */
    cy(-.85, 3.95, .5, .22, .5, 'y', CM); cy(-.85, 4.4, .6, .8, .55, 'z', CD); cy(-.85, 4.4, .89, .66, .04, 'z', CG, 2.2);       /* a searchlight for a head */
    cy(-.8, 2.45, 1.5, 1.15, .4, 'z', CD); cy(-.8, 2.45, 2.25, .56, 1.3, 'z', CM); box(-.8, 2.45, 2.95, .8, .6, .3, CD);       /* the gun, built into its face */
    for (const s of [-1, 1]) { push(); T(s * .85, 1.05, 2.0); RY(-s * .62); draw(MESH.cube, 2.1, 1.1, .2, CM); pop(); sg([s * 1.2, 1.9, 1.3], [s * 1.2, 1.2, 1.8], .22, .22, CB); } box(0, 1.05, 2.56, .3, 1.2, .3, CD);       /* the prow: a cow-catcher it shoves out on two rams */
    box(0, 2.9, -1.75, 2.4, 1.2, .5, CD); for (const q of [-.8, .8]) cy(q, 4.0, -1.6, .3, .9, 'y', CM); } },
  combine: { kind: 'mech', name: 'COMBINE', sub: 'the harvester', h: 2.2, draw() {
    for (const s of [-1, 1]) { box(s * 1.3, .25, -.5, 1.2, .5, 1.9, CD); box(s * 1.3, .54, -.55, .9, .08, 1.4, CL); leg(s, [1.1, 2.0, -.6], [1.3, 1.25, -1.3], [1.3, .5, -.6], [.85, .85], [.7, .7], CL, CM); }
    box(0, 2.0, -.6, 2.0, .5, 1.1, CD);
    box(0, 2.75, -.7, 2.6, 1.3, 2.4, CL); box(0, 3.46, -1.0, 2.2, .2, 1.6, CM); box(0, 2.7, -2.05, 2.2, 1.1, .4, CD); cy(.9, 3.9, -1.5, .28, .9, 'y', CM);       /* the grain tank is the body */
    for (const qx of [-.72, .72]) for (const qz of [.25, 1.35]) box(qx, 3.55, qz, .12, 1.5, .12, CL); box(0, 4.32, .8, 1.8, .12, 1.5, CL); box(0, 2.84, .8, 1.6, .14, 1.4, CD); pilot(0, 2.9, .75); box(0, 3.2, 1.38, 1.0, .1, .1, CG, 1.2); for (const q of [-.5, .5]) { box(q, 4.24, 1.5, .34, .2, .14, CD); box(q, 4.24, 1.58, .26, .13, .02, CG, 2); }       /* a tall glasshouse of a cab, up and forward */
    for (const s of [-1, 1]) { sg([s * .95, 2.2, .5], [s * 1.5, 1.0, 2.3], .34, .4, CM); sg([s * .95, 2.9, .3], [s * 1.4, 1.5, 1.8], .18, .18, CB); }
    box(0, .8, 2.7, 4.6, .8, 1.0, CM); box(0, .36, 3.1, 4.6, .12, .5, CD); for (let i = -5; i <= 5; i++) { push(); T(i * .42, .4, 3.3); RX(Math.PI / 2); T(0, .25, 0); draw(MESH.spike, .2, .6, .14, CB, -.3); pop(); }       /* the header: wider than the machine, toothed, and it leads with it */
    cy(0, 1.45, 3.0, .95, 4.3, 'x', CD); for (let i = 0; i < 4; i++) { push(); T(0, 1.45, 3.0); RX(i * Math.PI / 2 + .4); box(0, .5, 0, 4.3, .08, .12, CL); pop(); }       /* and the reel that turns over it */
    box(-1.62, 2.7, -.1, .7, .75, 1.5, CD); for (const y of [2.52, 2.88]) { cy(-1.62, y, 1.0, .3, .9, 'z', CM); cy(-1.62, y, 1.42, .4, .12, 'z', CD); } } },       /* the gun: a pod where the unloading auger used to hang */
  /* ------------------------------------------------ animals ------------------------------------------------ */
  hook: { kind: 'bug', name: 'HOOK STALKER', sub: 'two hooks and the legs to throw them', h: 1.0, draw() {
    push(); T(0, 1.35, -1.0); RX(-.25); draw(MESH.shell, 1.6, 1.25, 2.0, CK2, -.4); pop(); push(); T(0, 1.0, .35); RX(.3); draw(MESH.shell, 1.15, .85, 1.8, CK, -.4); pop(); push(); T(0, 1.62, -.9); RX(-.2); draw(MESH.scute, 1.6, 1.3, 2.0, CK2, -.5); pop();       /* all the mass is in the haunches; the back slopes down to the head */
    push(); T(0, .62, 1.45); RX(.25); draw(MESH.oct, .62, .42, 1.1, CK2, -.4); pop(); for (const s of [-1, 1]) { push(); T(s * .17, .7, 1.75); draw(MESH.oct, .1, .08, .12, CG, 2); pop(); }
    for (const s of [-1, 1]) { sg([s * .7, 1.35, -1.0], [s * 1.3, 2.35, -2.3], .6, .6, CK, MESH.taper, [0, 0, 1]); sg([s * 1.3, 2.35, -2.3], [s * 1.4, 0, -1.2], .44, .44, CK, MESH.spike, [0, 0, 1]); cy(s * 1.3, 2.35, -2.3, .5, .5, 'x', CK2);       /* rear legs folded high, like a thing about to jump */
      sg([s * .5, .9, .4], [s * .95, .75, .8], .26, .26, CK, MESH.taper, [0, 0, 1]); sg([s * .95, .75, .8], [s * 1.0, 0, .6], .2, .2, CK, MESH.spike, [0, 0, 1]);
      sg([s * .45, 1.0, .9], [s * 1.35, 1.55, 1.5], .46, .46, CK2, MESH.taper, [0, 0, 1]); sg([s * 1.35, 1.55, 1.5], [s * .7, .3, 3.9], 2.0, 2.3, CB, MESH.blade, [0, -1, .25]); cy(s * 1.35, 1.55, 1.5, .5, .5, 'x', CK2); }       /* the hooks: held low and forward like ice picks, each as long as its body */
    push(); T(0, 1.2, -1.9); RX(-.5); T(0, 0, -.5); draw(MESH.shell, .5, .34, 1.0, CK, -.4); pop(); } },
  lancer: { kind: 'bug', name: 'TAIL LANCER', sub: 'one spear, carried over its back', h: 1.6, draw() {
    draw; push(); T(0, .72, 0); draw(MESH.shell, 1.9, .62, 2.5, CK, -.4); pop(); push(); T(0, .98, -.1); draw(MESH.scute, 2.0, 1.2, 2.6, CK2, -.5); pop();       /* low, wide and flat */
    push(); T(0, .6, 1.35); draw(MESH.oct, .7, .36, .8, CK2, -.4); pop(); for (const s of [-1, 1]) { push(); T(s * .2, .66, 1.62); draw(MESH.oct, .1, .08, .12, CG, 2); pop(); sg([s * .3, .55, 1.6], [s * .55, .35, 2.3], .5, .7, CB, MESH.blade, [s, 0, 0]); }
    for (const s of [-1, 1]) for (const r of [-1, 0, 1]) { sg([s * .8, .7, r * .75], [s * 1.6, 1.05, r * .95], .26, .26, CK, MESH.taper, [0, 0, 1]); sg([s * 1.6, 1.05, r * .95], [s * 1.95, 0, r * 1.1], .2, .2, CK, MESH.spike, [0, 0, 1]); }       /* six short legs, splayed */
    const P = [[0, .95, -1.1], [0, 2.1, -1.75], [0, 3.05, -1.0], [0, 3.2, .3], [0, 2.75, 1.35]]; for (let i = 0; i < 4; i++) { sg(P[i], P[i + 1], .62 - i * .09, .62 - i * .09, i % 2 ? CK2 : CK, MESH.shell, [1, 0, 0]); cy(P[i + 1][0], P[i + 1][1], P[i + 1][2], .5 - i * .06, .5, 'x', CK2); }       /* the tail, arched up and forward in four joints */
    sg([0, 2.75, 1.35], [0, 1.5, 3.5], 1.0, 1.0, CB, MESH.spike, [1, 0, 0]); } },       /* and the lance on the end of it, pointing where it is looking */
  maul: { kind: 'bug', name: 'MAUL', sub: 'a skull with a body behind it', h: 1.5, draw() {
    push(); T(0, 1.55, .35); RX(.1); draw(MESH.shell, 2.3, 1.7, 2.2, CK, -.4); pop(); push(); T(0, 1.05, -1.35); RX(-.15); draw(MESH.shell, 1.4, 1.0, 1.7, CK2, -.4); pop();       /* all shoulders, almost no hindquarters */
    push(); T(0, 1.4, 1.75); RX(1.05); draw(MESH.scute, 2.9, 2.4, 2.9, CB, -.3); pop(); push(); T(0, 2.05, 1.2); RX(.5); draw(MESH.scute, 2.2, 1.6, 1.6, CK2, -.5); pop();       /* the prow: a bone plate the width of the animal, carried like a shield */
    for (const s of [-1, 1]) { push(); T(s * 1.15, .75, 2.2); RX(Math.PI / 2 - .3); RZ(-s * .3); T(0, .45, 0); draw(MESH.spike, .4, 1.1, .4, CB, -.3); pop(); push(); T(s * .5, 1.05, 2.42); draw(MESH.oct, .13, .1, .12, CG, 2); pop();
      sg([s * .9, 1.3, .7], [s * 1.25, .8, 1.0], .7, .7, CK, MESH.taper, [0, 0, 1]); sg([s * 1.25, .8, 1.0], [s * 1.25, 0, .9], .6, .6, CK2, MESH.taper, [0, 0, 1]);       /* front legs like pillars */
      sg([s * .6, 1.0, -1.3], [s * .95, .75, -1.75], .4, .4, CK, MESH.taper, [0, 0, 1]); sg([s * .95, .75, -1.75], [s * .95, 0, -1.5], .3, .3, CK2, MESH.spike, [0, 0, 1]); } } },
};
