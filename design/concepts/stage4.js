/* Staging for the final validation: cameras, the three comparison scenes, the measurements, and the timeline of the collision test.
   Not in the game. Loaded after js/game.js, concepts.js, anvil.js, round3.js and validate.js. */
const ez = u => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }, wrapA = a => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };
const CAM4 = { dist: 30, fov: 1.15, Y: 570 / 880 };       /* the walker sits 65% of the way down the screen at either angle, so the only thing that differs is the angle */
function gcam(pitch, wx, wz, o) { const k = (2 * CAM4.Y - 1) * Math.tan(CAM4.fov / 2), d = k * CAM4.dist / (Math.sin(pitch) + k * Math.cos(pitch)); return Object.assign({ pitch, dist: CAM4.dist, fov: CAM4.fov, h: 0, ax: wx, az: wz - d, fog: [34, 95], ahead: d }, o || {}); }
function flat(col, fn) { const d0 = draw, s0 = seg; draw = (m, sx, sy, sz) => d0(m, sx, sy, sz, col, 9); seg = (m, A, B, w, d, cc, e, ref) => s0(m, A, B, w, d, col, 9, ref); fn(); draw = d0; seg = s0; }
function stage(fn, v) { window.SILH = !!v.sil; if (v.sil) flat([1, 0, 1], () => fn(true)); else fn(false);
  const S = SC, at = [v.ax || 0, v.h || 0, v.az || 0], cp = Math.cos(v.pitch), yw = v.yaw || 0; S.at = at; S.cam = [at[0] + Math.sin(yw) * cp * v.dist, at[1] + Math.sin(v.pitch) * v.dist, at[2] + Math.cos(yw) * cp * v.dist]; S.fov = v.fov; S.focus = [at[0], 0, at[2]];
  S.spotP = [0, 30, 0]; S.spotD = [0, -1, 0]; S.spotC = [0, 0, 0]; S.lights = [{ p: [(v.lx || 0) + 6, 8, (v.lz || 0) + 9], c: [.8, .8, .78], r: 26 }]; S.ambS = [.3, .3, .32]; S.ambG = [.16, .16, .16]; S.moonD = [-.5, .7, .5]; S.moonC = [.85, .85, .82]; S.fogC = [.34, .34, .35]; S.fogR = v.fog || [10, 30]; S.rim = [.1, .1, .1]; S.exposure = 1.15;
  S.yard = [-1e4, 1e4, -1e4, 1e4]; S.apron = [-1e4, 1e4, -1e4, 1e4]; S.track = [1e4, 0, 1e4, 0]; renderScene(S, glc.width, glc.height); }
const put = (x, z, a, fn) => { reset(); T(x, 0, z); RY(a); fn(); }, shadow = (x, z, w, l, a, k) => { if (!window.SILH) decal(x, z, w, l, a, 0, 0, 0, 0, k || .5); };
const walker = (x, z, h, o, hard) => { put(x, z, h, () => anvil4(hard ? P4H : P3, Object.assign({ turn: h, at: [x, z], hard: !!hard }, o || {}))); shadow(x, z, 3.6, 3.4, h, .55); };
const bugAt = (x, z, a, pose, size) => { put(x, z, a, () => stalker4(pose, size)); shadow(x, z, 2.6 * (size || 1), 3.8 * (size || 1), a); };
const face = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);

/* 1. the walker at the size it is played at */
function mechShot(o) { const v = gcam(.66, 0, 0, { sil: o.sil, fog: o.ctx ? [34, 95] : [60, 140] }); stage(() => { if (o.ctx) { reset(); massing(); bugAt(-7.5, -6.5, face(-7.5, -6.5, 0, 0), 'stalk', 1); reset(); man(3.7, 1.6); } walker(0, 0, o.turn, o.walk !== undefined ? { walk: o.walk } : {}, o.hard); }, v); const c = toScr(0, 2.2, 0); return { cx: c[0], cy: c[1] }; }

/* 2. three stalkers coming in, at full size and at three quarters */
const HERD = { far: [[-8.5, -5.5, 'stalk'], [7.2, -7.5, 'wind'], [1.5, -18.5, 'stalk']], near: [[-6.2, -2.6, 'stalk'], [5.6, -5.4, 'wind'], [-1.2, -9.6, 'stalk']] };
function scaleShot(o) { const v = gcam(.66, 0, 0, { fog: o.count ? [300, 400] : [34, 95] }); stage(() => { reset(); massing(); const bugs = () => { for (const [x, z, p] of HERD[o.set]) bugAt(x, z, face(x, z, 0, 0), p, o.size); };
    if (o.count) { window.SILH = true; flat([1, 0, 1], bugs); flat([0, 1, 0], () => walker(0, 0, -2.6, {})); } else { bugs(); walker(0, 0, -2.6, {}); reset(); man(3.4, 2.2); } }, v);
  return { px: toScr(1, 0, 0)[0] - toScr(0, 0, 0)[0], bugs: HERD[o.set].map(([x, z]) => ({ d: Math.hypot(x, z), s: toScr(x, 0, z) })) }; }

/* 3. the two camera angles, everything else the same */
const RINGS = { walk: 5, ram: 6, gun: 11 }, FOES = [[-8, -6, 'stalk'], [7, -7.7, 'wind'], [1, -21, 'stalk'], [-6.5, 6.2, 'stalk']];
function camShot(o) { const v = gcam(o.pitch, 0, 0); stage(() => { reset(); massing(); for (const [x, z, p] of FOES) bugAt(x, z, face(x, z, 0, 0), p, 1); walker(0, 0, -2.6, { walk: .3 }); reset(); man(3.4, 2.2); }, v);
  const W_ = innerWidth, H_ = innerHeight, P = (x, y, z) => toScr(x, y, z), p0 = P(0, 0, 0), ring = r => Array.from({ length: 121 }, (_, i) => P(Math.sin(i / 120 * TAU) * r, 0, Math.cos(i / 120 * TAU) * r));
  const gz = y => { let a = -600, b = 60; for (let i = 0; i < 50; i++) { const m = (a + b) / 2, s = P(0, 0, m); if (!s || s[1] < y) a = m; else b = m; } return (a + b) / 2; };
  const row = d => { const a = P(0, 0, -d), b = P(0, 0, -d - 1), c = P(1, 0, -d), t = P(0, 2.9, -d); return { d, y: a[1], v: a[1] - b[1], h: c[0] - a[0], knee: a[1] - t[1], half: W_ / 2 / (c[0] - a[0]) }; };
  const top = P(0, 4.7, 0), B = FOES[1], bd = Math.hypot(B[0], B[1]), ux = -B[0] / bd, uz = -B[1] / bd, lane = [[1.6, 0], [1.6, 10.4], [-1.6, 10.4], [-1.6, 0]].map(([l, f]) => P(B[0] + ux * f - uz * l, 0, B[1] + uz * f + ux * l));
  return { pitch: o.pitch, ahead: v.ahead, walker: p0, rings: { walk: ring(RINGS.walk), ram: ring(RINGS.ram), gun: ring(RINGS.gun) }, lane, rows: [0, 5, 10, 15, 20, 30].map(row), north: -gz(0), south: gz(H_), walkerH: p0[1] - top[1], hides: -gz(top[1]), foes: FOES.map(([x, z]) => ({ x, z, s: P(x, 0, z), top: P(x, 2.9, z) })),
    thumbs: [[88, H_ - 150, 60], [W_ - 64, H_ - 136, 40]].map(([x, y, r]) => { const z = gz(y), zt = gz(y - r), zb = Math.min(gz(Math.min(H_, y + r)), 99), h = P(1, 0, z)[0] - P(0, 0, z)[0]; return { x: (x - W_ / 2) / h, z, zt, zb, wr: r / h }; }) }; }

/* 4. the collision: one pounce that misses, the blades stuck, the ram that answers it.  All of it is a function of time. */
const K4 = { v: 5, S: 3.2, h0: 1.75, P0: [2, 0], S0: [1.5, -10.3], leap: 5.5, tLock: .8, tGo: 1.7, tLand: 1.95, tBrake: 1.8, tStop: 2.13, tCock: 2.15, tStrike: 2.37, tHit: 2.49, tFree: 2.85, tRec: 3.25, tEnd: 3.7, hold: .13, dt: 1 / 240 };
function buildTL() { const K = K4, n = Math.round(K.tEnd / K.dt) + 1, TL = [], sd = [K.P0[0] - K.S0[0], K.P0[1] - K.S0[1]], sl = Math.hypot(sd[0], sd[1]); sd[0] /= sl; sd[1] /= sl; K.sd = sd; K.syaw = Math.atan2(sd[0], sd[1]); K.land = [K.S0[0] + sd[0] * K.leap, K.S0[1] + sd[1] * K.leap]; K.tgt = [K.land[0] + sd[0] * 2.2, K.land[1] + sd[1] * 2.2];
  let x = K.P0[0] - K.v * K.tLock * Math.sin(K.h0), z = K.P0[1] - K.v * K.tLock * Math.cos(K.h0), ph = .1, aim = null, cx = null, cz = 0;
  for (let i = 0; i < n; i++) { const t = i * K.dt, v = t < K.tBrake ? K.v : K.v * Math.max(0, 1 - (t - K.tBrake) / (K.tStop - K.tBrake)), h = K.h0 + .55 * ez((t - K.tBrake) / (K.tStop - K.tBrake + .15));
    const s = t < K.tGo ? 0 : Math.min(1, (t - K.tGo) / (K.tLand - K.tGo)), go = 1 - Math.pow(1 - s, 1.5), creep = Math.min(0, t - K.tLock) * 1.5, kick = ez((t - K.tHit) / .22);
    const rd = K.rdir || [0, 0], sx = K.S0[0] + sd[0] * (creep + K.leap * go) + rd[0] * kick * 1.1, sz = K.S0[1] + sd[1] * (creep + K.leap * go) + rd[1] * kick * 1.1;
    const want = wrapA(Math.atan2(sx + sd[0] * .8 - x, sz + sd[1] * .8 - z) - h); aim = aim === null ? want : aim + Math.max(-2.6 * K.dt, Math.min(2.6 * K.dt, wrapA(want - aim)));
    if (cx === null) { cx = x; cz = z; } cx += (x - cx) * K.dt / .3; cz += (z - cz) * K.dt / .3;
    TL.push({ t, x, z, h, v, ph, aim, sx, sz, s, cx, cz }); x += Math.sin(h) * v * K.dt; z += Math.cos(h) * v * K.dt; ph = (ph + v / (K.S / .6) * K.dt) % 1; }
  K.TL = TL; return TL; }
function poseAt(t) { const K = K4, f = K.TL[Math.max(0, Math.min(K.TL.length - 1, Math.round(t / K.dt)))], wk = 1 - ez((t - K.tCock) / .2), bs = ez((t - K.tCock) / .2), hop = .55 * Math.sin(Math.PI * Math.max(0, Math.min(1, (t - K.tCock) / .2)));
  const rw = t < K.tStrike ? ez((t - K.tCock) / (K.tStrike - K.tCock)) : 1 - Math.min(1, (t - K.tStrike) / (K.tHit - K.tStrike)), k = Math.max(0, Math.min(1, (t - K.tStrike) / (K.tHit - K.tStrike))), ri = t < K.tHit + .1 ? k * k : 1 - ez((t - K.tHit - .1) / (K.tRec - K.tHit - .1));
  const m = t < K.tStrike ? ez((t - K.tCock) / (K.tStrike - K.tCock)) : 1 - .6 * ez((t - K.tHit - .2) / .5), aim = K.aimR === undefined ? f.aim : f.aim + wrapA(K.aimR - f.aim) * m;
  const w = t < K.tLock ? 0 : t < K.tGo ? ez((t - K.tLock) / .28) : 1 - f.s, u = f.s, dead = Math.max(0, Math.min(1, (t - K.tHit) / .1)), air = Math.sin(Math.PI * f.s), tense = t > K.tLock && t < K.tGo ? (t - K.tLock) / (K.tGo - K.tLock) : 0, stuck = t >= K.tLand && t < K.tHit ? 1 : 0;
  return { f, walker: { walk: f.ph, wk, rw, ri, S: K.S, aim, brace: bs, hop, lunge: K.lunge === undefined ? .75 : K.lunge }, bug: { w, u, flat: dead, lift: air * .9 - tense * .12, tw: -air * .22 + stuck * .03 * Math.sin(t * 34), yw: stuck * .05 * Math.sin(t * 21) + dead * .3 }, byaw: K.syaw }; }
function drawClip(t, dry) { const K = K4, q = poseAt(t), f = q.f; walker(f.x, f.z, f.h, q.walker); bugAt(f.sx, f.sz, q.byaw, q.bug, 1);
  if (!dry) { const a = t - K.tLand, b = t - K.tHit, tip = [f.sx + K.sd[0] * 4.6, f.sz + K.sd[1] * 4.6]; if (a > 0 && a < .7) for (const s of [-1, 1]) decal(tip[0] - K.sd[1] * s * .7, tip[1] + K.sd[0] * s * .7, .7 + a * 3.2, .7 + a * 3.2, 0, 0, .62, .6, .55, .42 * (1 - a / .7), .01);
    if (b > 0 && b < .6) decal(K.tgt[0], K.tgt[1], 1.2 + b * 7, 1.2 + b * 7, 0, 0, .7, .68, .6, .5 * (1 - b / .6), .012); } return q; }
/* the ram is thrown on the slew ring: find the torso angle and the step-in that put the striker on the animal's shoulders */
function solveRam() { const K = K4; buildTL(); const f = K.TL[Math.round(K.tHit / K.dt)]; K.aimR = f.aim; K.lunge = .75; const d0 = draw, s0 = seg; draw = () => 0; seg = () => 0;
  for (let i = 0; i < 12; i++) { const q = poseAt(K.tHit); q.walker.rw = 0; q.walker.ri = 1; put(f.x, f.z, f.h, () => anvil4(P3, Object.assign({ turn: f.h, at: [f.x, f.z] }, q.walker)));
    K.aimR += wrapA(Math.atan2(K.tgt[0] - f.x, K.tgt[1] - f.z) - Math.atan2(STRIKER[0] - f.x, STRIKER[2] - f.z)); K.lunge += Math.hypot(K.tgt[0] - f.x, K.tgt[1] - f.z) - Math.hypot(STRIKER[0] - f.x, STRIKER[2] - f.z); }
  draw = d0; seg = s0; K.rdir = [Math.sin(f.h + K.aimR), Math.cos(f.h + K.aimR)]; buildTL(); return { aimR: K.aimR, lunge: K.lunge, striker: Array.from(STRIKER), tgt: K.tgt, land: K.land, walker: [f.x, f.z, f.h], trackAim: f.aim, gap: Math.hypot(K.tgt[0] - f.x, K.tgt[1] - f.z) }; }
function clipFrame(t, view) { const K = K4, f = poseAt(t).f; let v;
  if (view === 'game') v = gcam(.66, f.cx, f.cz, { lx: f.cx, lz: f.cz }); else if (view === 'top') v = { yaw: 0, pitch: 1.5, dist: 70, fov: .42, h: 0, ax: 3.5, az: -4.5, fog: [200, 300], lx: 3, lz: -4 }; else v = { yaw: -.12, pitch: .3, dist: 22, fov: .91, h: 1.6, ax: 4.7, az: -2.6, fog: [40, 110], lx: 3, lz: -4 };
  stage(() => { reset(); massing(); drawClip(t); }, v); const P = (x, z) => toScr(x, 0, z), l = 1.5, a = K.S0, e = [K.P0[0] + K.sd[0] * .8, K.P0[1] + K.sd[1] * .8];
  return { t, walker: P(f.x, f.z), bug: P(f.sx, f.sz), lane: [[a[0] - K.sd[1] * l, a[1] + K.sd[0] * l], [e[0] - K.sd[1] * l, e[1] + K.sd[0] * l], [e[0] + K.sd[1] * l, e[1] - K.sd[0] * l], [a[0] + K.sd[1] * l, a[1] - K.sd[0] * l]].map(p => P(p[0], p[1])), p0: P(K.P0[0], K.P0[1]), striker: toScr(STRIKER[0], STRIKER[1], STRIKER[2]), wpos: [f.x, f.z], spos: [f.sx, f.sz] }; }
