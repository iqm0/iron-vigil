'use strict';
/* =====================================================================
   Last Light: the game. Rigs, animation, combat, input, sound, HUD.
   World: Y is up, the ground is XZ. A heading h faces (sin h, 0, cos h). The camera looks from +Z, so screen right is +X and screen down is +Z.
   ===================================================================== */
const $ = id => document.getElementById(id);
const glc = $('gl'), cv = $('c'), ctx = cv.getContext('2d');
const S0 = () => ({ x: 0, v: 0 });
function spring(s, target, k, d, dt) { s.v += ((target - s.x) * k - s.v * d) * dt; s.x += s.v * dt; }
const fmtT = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

/* ---------- settings (saved on the device; defaults follow the device's own preferences) ---------- */
const DEF = { shake: 1, hitstop: true, flash: false, gore: true, bright: 0, contrast: false, text: 1, nums: false, caps: false, cards: true, vol: 1, sfxv: 1, musv: 1, haptics: true, hand: 'right', btn: 1, fixed: false, dead: 8, tscale: 1, dmg: 1, espd: 1, ecount: 1 };
function mq(q) { try { return !!(window.matchMedia && matchMedia(q).matches); } catch (e) { return false; } }
function defaultSettings() { const d = Object.assign({}, DEF); if (mq('(prefers-reduced-motion: reduce)')) { d.shake = 0; d.hitstop = false; d.flash = true; } if (mq('(prefers-contrast: more)')) { d.contrast = true; d.bright = .3; } return d; }
let ST = defaultSettings();
try { const o = JSON.parse(localStorage.getItem('ll4_settings')); if (o && o.v === 2) for (const k in DEF) if (k in o.s && typeof o.s[k] === typeof DEF[k]) ST[k] = o.s[k]; } catch (e) { }
function saveSettings() { try { localStorage.setItem('ll4_settings', JSON.stringify({ v: 2, s: ST })); } catch (e) { } }

/* ---------- canvas ---------- */
let W = 0, H = 0, DPR = 1, Q = 1, SAFE = 0, GLOK = false;
function resize() {
  W = Math.min(innerWidth, Math.round(innerHeight * .62)); H = innerHeight; DPR = Math.min(window.devicePixelRatio || 1, 2);
  let rs = Math.max(1, DPR * Q); const px = W * H * rs * rs; if (px > 1.5e6) rs *= Math.sqrt(1.5e6 / px);       // the 3D view never draws more than 1.5 million pixels
  glc.width = Math.max(2, Math.round(W * rs)); glc.height = Math.max(2, Math.round(H * rs)); cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  for (const c of [glc, cv]) { c.style.width = W + 'px'; c.style.height = H + 'px'; } SAFE = parseFloat(getComputedStyle($('probe')).paddingTop) || 0;
}
addEventListener('resize', resize);

/* ---------- sound: everything is synthesised ---------- */
let AC = null, master = null, sfxBus = null, musBus = null, noiseBuf = null, muted = false, whine = null, whineG = null, lastHitSnd = 0;
function initAudio() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); sfxBus = AC.createGain(); musBus = AC.createGain(); sfxBus.connect(master); musBus.connect(master); applyAudio();
    const comp = AC.createDynamicsCompressor(); master.connect(comp); comp.connect(AC.destination);
    noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    whine = AC.createOscillator(); whine.type = 'sawtooth'; whine.frequency.value = 60; const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; whineG = AC.createGain(); whineG.gain.value = 0; whine.connect(lp); lp.connect(whineG); whineG.connect(sfxBus); whine.start();
    startMusic(); } catch (e) { AC = null; }
}
function applyAudio() { if (!AC) return; master.gain.value = muted ? 0 : .5 * ST.vol; sfxBus.gain.value = ST.sfxv; musBus.gain.value = ST.musv; }
function tone(f, d, type, v, slide, at) { if (!AC || muted) return; at = at || AC.currentTime; const o = AC.createOscillator(), g = AC.createGain(); o.type = type || 'square'; o.frequency.setValueAtTime(f, at); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), at + d); g.gain.setValueAtTime(v || .1, at); g.gain.exponentialRampToValueAtTime(.001, at + d); o.connect(g); g.connect(sfxBus); o.start(at); o.stop(at + d + .03); }
function noise(d, v, fc, type, at, sweep) { if (!AC || muted) return; at = at || AC.currentTime; const s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const f = AC.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.setValueAtTime(fc || 1200, at); if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(40, fc + sweep), at + d); const g = AC.createGain(); g.gain.setValueAtTime(v || .2, at); g.gain.exponentialRampToValueAtTime(.001, at + d); s.connect(f); f.connect(g); g.connect(sfxBus); s.start(at, Math.random()); s.stop(at + d + .03); }
const vr = () => .92 + Math.random() * .16;      // a little pitch variance keeps repeated sounds alive
const buzz = ms => { if (ST.haptics && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) { } };
const sfx = {
  shot() { const t = AC && AC.currentTime; tone(96 * vr(), .24, 'sine', .6, -58); tone(190 * vr(), .09, 'square', .13, -120); noise(.18, .5, 1700 * vr(), 'lowpass', 0, -1450); noise(.045, .22, 5200, 'highpass'); noise(.05, .1, 2300, 'bandpass', t + .1, -900); tone(2100 * vr(), .03, 'triangle', .025, 0, t + .42); },      // boom, crack, the action cycling, and the shell case landing
  thwack() { noise(.13, .3, 760 * vr(), 'lowpass', 0, -500); tone(150 * vr(), .09, 'sawtooth', .1, -90); },
  hit() { const n = performance.now(); if (n - lastHitSnd < 45) return; lastHitSnd = n; noise(.05, .1, 1500 * vr(), 'bandpass', 0, -900); },
  kill() { noise(.16, .2, 800 * vr(), 'lowpass', 0, -600); tone(170 * vr(), .12, 'sawtooth', .07, -110); },
  step() { noise(.07, .1, 300, 'lowpass'); tone(62 * vr(), .09, 'sine', .2, -22); },
  dash() { noise(.42, .34, 500, 'bandpass', 0, 3200); tone(70, .32, 'sawtooth', .16, 220); tone(48, .3, 'sine', .34, -18); buzz(18); },
  skid() { noise(.28, .16, 2600, 'highpass', 0, -1600); },
  ram() { noise(.22, .42, 700, 'lowpass', 0, -500); tone(56, .24, 'sine', .42, -26); tone(310 * vr(), .08, 'square', .07, -180); buzz(30); },
  hurt() { noise(.3, .34, 520, 'lowpass', 0, -300); tone(92, .28, 'sawtooth', .18, -50); tone(660, .09, 'square', .05, -380); buzz(40); },
  tell() { noise(.3, .07, 1700, 'bandpass', 0, 2400); },
  lunge() { noise(.16, .12, 2200, 'bandpass', 0, -1700); },
  ready() { tone(660, .07, 'triangle', .05); tone(990, .09, 'triangle', .05, 0, AC && AC.currentTime + .06); },
  swarm() { tone(210, .5, 'sawtooth', .05, 160); noise(.5, .08, 2400, 'bandpass', 0, 1200); },
  item(r) { if (r === 'l') { [262, 392, 523, 659, 784, 1047].forEach((f, i) => tone(f, .5, 'triangle', .1, 0, AC && AC.currentTime + i * .09)); tone(65, .9, 'sine', .3, -10); buzz(60); return; } const b = r === 'e' ? 523 : r === 'r' ? 440 : 392, n = r === 'e' ? 4 : r === 'r' ? 3 : 2; for (let i = 0; i < n; i++) tone(b * [1, 1.25, 1.5, 2][i], .22, 'triangle', .09, 0, AC && AC.currentTime + i * .08); buzz(25); },
  repair() { tone(520, .1, 'sine', .08, 260); tone(780, .14, 'sine', .06, 0, AC && AC.currentTime + .08); },
  spit() { noise(.2, .12, 900, 'bandpass', 0, 900); tone(210, .2, 'sine', .07, 260); },
  splat() { noise(.25, .2, 600, 'lowpass', 0, -350); },
  mortar() { tone(120, .16, 'sine', .3, -70); noise(.12, .2, 500, 'lowpass'); },
  zap() { noise(.12, .14, 3200, 'highpass', 0, -1500); tone(880 * vr(), .09, 'sawtooth', .05, -600); },
  pew() { tone(620 * vr(), .05, 'square', .03, -300); },
  win() { [392, 494, 587, 784, 988].forEach((f, i) => tone(f, .4, 'triangle', .09, 0, AC && AC.currentTime + i * .11)); },
  blast() { noise(.3, .3, 1100, 'lowpass', 0, -900); tone(80, .22, 'sine', .25, -40); },
  boom() { noise(.9, .5, 900, 'lowpass', 0, -800); tone(52, .8, 'sine', .45, -30); buzz(120); },
};
function startMusic() {
  const bass = [41.2, 41.2, 49, 41.2, 55, 41.2, 36.7, 38.9]; let step = 0, next = AC.currentTime + .15;
  setInterval(() => { if (!AC) return; while (next < AC.currentTime + .4) {
    if (!muted && (state === 'play' || state === 'title')) { const k = state === 'play' && G ? Math.min(1, G.t / 180) : .1, f = bass[step % 8];
      const o = AC.createOscillator(), g = AC.createGain(), lp = AC.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.setValueAtTime(180 + k * 520, next); lp.frequency.exponentialRampToValueAtTime(80, next + .42);
      g.gain.setValueAtTime(.1, next); g.gain.exponentialRampToValueAtTime(.001, next + .44); o.connect(lp); lp.connect(g); g.connect(musBus); o.start(next); o.stop(next + .48); }
    step++; next += .46; } }, 120);
}

/* ---------- tuning ---------- */
const HIP = 1.5, HIPW = .56, L1 = .98, L2 = 1.02, REACH = 1.93, STRIDE = 3.1, SWING = .42;
const DASH = { wind: .045, burst: .2, rec: .3, v: 31 };
const BUGV = 4.5, TELL = .5, LUNGE_T = .3, LUNGE_V = 17, LANE = LUNGE_T * LUNGE_V + .8, PACE = .9, RUN = 360 * PACE;      // the whole game runs at nine tenths speed; RUN is in game seconds, so a run lasts six real minutes
const YEL = [.78, .47, .05], YEL2 = [.5, .3, .04], DRK = [.055, .06, .07], STL = [.24, .25, .28], RUST = [.24, .1, .045], CONC = [.3, .29, .27], BRASS = [.8, .55, .15];
const SHELL = 4.6, CHITM = [.12, .042, .022], GROW = [0, 2, 4, 7, 10, 13, 17], FLESH = [.32, .07, .06], ALLYC = [.03, .07, .1], ALLYC2 = [.06, .26, .36], GUARDC = [.04, .034, .034], GUARDC2 = [.1, .078, .064], GUARDF = [.075, .06, .052], SPITC = [.12, .13, .05], SPITC2 = [.3, .32, .1], CHIT = [.05, .032, .03], CHIT2 = [.26, .085, .03], BONE = [.6, .52, .4], ICH = [.32, .75, .08];

/* ---------- parts: the mech starts bare; bugs drop parts and they bolt themselves on ----------
   Rarity is the part's role: common parts tune what you have, rare parts are new weapons, epic parts change a rule.
   Finding a part again raises its mark. Every part is something you can see happen on screen. */
const RAR = { c: { n: 'Common', col: [.8, .84, .86], css: '#d5dde0', w: 46 }, r: { n: 'Rare', col: [.25, .6, 1], css: '#6db4ff', w: 40 }, e: { n: 'Epic', col: [.7, .4, 1], css: '#c79bff', w: 14 }, l: { n: 'Legendary', col: [1, .72, .15], css: '#ffcf4a', w: 3 } };
const ITEMS = [
  { id: 'hot', n: 'Hot Loads', r: 'c', max: 3, d: l => `All damage +${35 * l}%`, f: (s, l) => { s.pow *= 1 + .35 * l; } },
  { id: 'belt', n: 'Belt Feeder', r: 'c', max: 3, d: l => `Cannon fires ${30 * l}% faster`, f: (s, l) => { s.rate *= 1 + .3 * l; } },
  { id: 'cool', n: 'Coolant Lines', r: 'c', max: 3, d: l => `Dash back ${[25, 45, 60][l - 1]}% sooner`, f: (s, l) => { s.dashCd *= [.75, .55, .4][l - 1]; } },
  { id: 'weld', n: 'Field Welder', r: 'c', max: 3, d: l => `Each kill mends ${[.6, 1.2, 1.8][l - 1]} hull`, f: (s, l) => { s.leech = .6 * l; } },
  { id: 'mortar', n: 'Shoulder Mortar', r: 'r', max: 3, d: l => ['Shells the thickest group', 'Two shells at a time', 'Three shells at a time'][l - 1], f: (s, l) => { s.mortar = l; } },
  { id: 'coil', n: 'Arc Coil', r: 'r', max: 3, d: l => `Lightning chains through ${[4, 6, 9][l - 1]}`, f: (s, l) => { s.coil = [4, 6, 9][l - 1]; } },
  { id: 'drone', n: 'Sentry Drone', r: 'r', max: 3, d: l => ['A drone shoots for you', 'Two drones shoot for you', 'Three drones shoot for you'][l - 1], f: (s, l) => { s.drone = l; } },
  { id: 'burn', n: 'Afterburner', r: 'r', max: 3, d: l => `Dash leaves fire for ${[3, 4.5, 6][l - 1]}s`, f: (s, l) => { s.burn = [3, 4.5, 6][l - 1]; } },
  { id: 'shock', n: 'Shock Plating', r: 'r', max: 3, d: l => `Blocks a hit every ${[9, 7, 5][l - 1]}s`, f: (s, l) => { s.shock = [9, 7, 5][l - 1]; } },
  { id: 'pierce', n: 'Piercing Rounds', r: 'r', max: 2, d: l => l === 1 ? 'Shells pierce three bugs' : 'Shells pierce every bug', f: (s, l) => { s.pierce = l === 1 ? 3 : 99; } },
  { id: 'boom', n: 'Breaching Rounds', r: 'e', max: 2, d: l => `Every ${l === 1 ? 'fourth' : 'second'} shell explodes`, f: (s, l) => { s.boom = l === 1 ? 4 : 2; } },
  { id: 'ichor', n: 'Volatile Ichor', r: 'e', max: 2, d: l => l === 1 ? 'Dead bugs burst' : 'Dead bugs burst wider', f: (s, l) => { s.ichor = l; } },
  { id: 'chain', n: 'Ram Charger', r: 'e', max: 2, d: l => l === 1 ? 'Longer dash; ram kills recharge it' : 'Dash ends in a slam', f: (s, l) => { s.chain = l; } },
  /* legendary parts are organs, not hardware. Each changes how a run plays, and none can be raised */
  { id: 'heart', n: 'Brood Heart', r: 'l', max: 1, d: () => 'Some kills rise and fight for you', f: s => { s.heart = 1; } },
  { id: 'stride', n: 'Titan Tendons', r: 'l', max: 1, d: () => 'Footfalls crush what is near', f: s => { s.stride = 1; } },
  { id: 'reaper', n: 'Reaper Limbs', r: 'l', max: 1, d: () => 'Scythes sweep around you', f: s => { s.reaper = 1; } },
  { id: 'molt', n: 'Second Shell', r: 'l', max: 1, d: () => 'Survive one wrecking hit a night', f: s => { s.molt = 1; } },
  { id: 'graft', n: 'Spitter Graft', r: 'l', max: 1, d: () => 'Acid limb hits a second target', f: s => { s.graft = 1; } },
  { id: 'sear', n: 'Searing Lamp', r: 'e', max: 2, d: l => l === 1 ? 'Lamp burns and slows' : 'Lamp burns hotter', f: (s, l) => { s.sear = l; } },
];
const ITEM = {}; for (const it of ITEMS) ITEM[it.id] = it; const MK = ['', 'Mark I', 'Mark II', 'Mark III'];
let FOUND = []; try { const o = JSON.parse(localStorage.getItem('ll4_found')); if (Array.isArray(o)) FOUND = o.filter(id => ITEM[id]); } catch (e) { }
const baseStats = () => ({ pow: 12, dmg: 0, rate: 3, range: 16, speed: 6.4, dashCd: 1.5, maxhp: 100, ramDmg: 110, pierce: 1, spread: .02, magnet: 5, leech: 0, mortar: 0, coil: 0, drone: 0, burn: 0, shock: 0, boom: 0, ichor: 0, chain: 0, sear: 0, heart: 0, stride: 0, reaper: 0, molt: 0, graft: 0 });
function recalc(g) { const s = baseStats(); for (const id of g.items) ITEM[id].f(s, g.lv[id]); s.dmg = s.pow * SHELL; g.s = s; }      // every weapon scales from one number; a cannon shell is worth several of it, enough to kill an early bug outright
const cardQ = []; let cardAt = 0;
function equip(id, how) { const g = G, it = ITEM[id], first = !g.lv[id]; if (g.lv[id] >= it.max) { g.hp = Math.min(g.s.maxhp, g.hp + 15); sfx.repair(); return; }      // already at its top mark: it is scrap, and scrap mends the hull
  if (first) { g.items.push(id); g.lv[id] = 1; } else g.lv[id]++; const l = g.lv[id]; recalc(g); g.itemFx = 1; g.itemCol = RAR[it.r].col; g.parts++; g.fitT[id] = g.t; g.weldT = .8; g.crouch.v += 4.5;
  let fresh = false; if (!FOUND.includes(id)) { FOUND.push(id); fresh = true; try { localStorage.setItem('ll4_found', JSON.stringify(FOUND)); } catch (e) { } g.fresh.push(id); }
  sfx.item(it.r); const line = it.n + (it.max > 1 ? ', ' + MK[l] : '') + '. ' + it.d(l) + '.';
  if (first && !how && ST.cards) { cardQ.push({ id, l, fresh }); if (state === 'play') openCard(); } else cap((how ? how + ': ' : '') + line, 4.5); }     // a part you have not had this run stops the game so you can read it; a higher mark is a caption
function openCard() { const c = cardQ[0]; if (!c) return; const it = ITEM[c.id], R = RAR[it.r]; state = 'card'; stick = null; dbtn = null; cardAt = performance.now();
  $('partR').textContent = R.n; $('partR').style.color = R.css; $('partN').textContent = it.n; $('partD').textContent = it.d(c.l); $('part').setAttribute('aria-label', `${R.n} part fitted: ${it.n}` + (it.max > 1 ? `, ${MK[c.l]} of ${it.max}` : ''));
  const x = $('partI').getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, 192, 192); x.fillStyle = 'rgba(0,0,0,.55)'; x.beginPath(); x.arc(96, 96, 92, 0, TAU); x.fill(); x.strokeStyle = R.css; x.lineWidth = 5; x.stroke(); icon(x, c.id, 96, 88, 50, R.css); if (it.max > 1) for (let q = 0; q < it.max; q++) { x.fillStyle = q < c.l ? R.css : 'rgba(255,255,255,.22)'; x.fillRect(96 - (it.max * 18 - 6) / 2 + q * 18, 152, 12, 8); }      // marks as pips, not words
  const b = $('partOk'); b.disabled = true; setTimeout(() => { b.disabled = false; if (state === 'card') try { b.focus({ preventScroll: true }); } catch (e) { } }, 450); show('part'); announce(`${R.n} part fitted: ${it.n}. ${it.d(c.l)}`); }
function closeCard() { if (state !== 'card' || performance.now() - cardAt < 400) return; cardQ.shift(); if (cardQ.length) openCard(); else { state = 'play'; show(''); lastT = performance.now(); } }
function rollItem(g, big) { const leg = g.parts >= 3 && g.t > 50, W = it => RAR[it.r].w * (it.r === 'l' && big ? 4 : 1), pool = ITEMS.filter(it => (g.lv[it.id] || 0) < it.max && (g.parts > 0 || it.r === 'r') && (it.r !== 'l' || leg)); if (!pool.length) return null; let t = 0; for (const it of pool) t += W(it); let r = Math.random() * t; for (const it of pool) { r -= W(it); if (r <= 0) return it.id; } return pool[0].id; }      // the first part of a run is always a new weapon
/* one small drawing per part, so it can be recognised on the card and in the row under the hull bar */
function icon(c, id, x, y, r, col) { c.save(); c.translate(x, y); c.scale(r, r); c.lineWidth = .16; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = col; c.fillStyle = col; const P = (...a) => { c.beginPath(); c.moveTo(a[0], a[1]); for (let i = 2; i < a.length; i += 2) c.lineTo(a[i], a[i + 1]); }, dot = (px, py, pr) => { c.beginPath(); c.arc(px, py, pr, 0, TAU); c.fill(); };
  if (id === 'hot') { P(-.3, .8, -.3, -.2, 0, -.85, .3, -.2, .3, .8); c.closePath(); c.fill(); P(-.75, -.3, -.6, -.7); c.stroke(); P(.75, -.3, .6, -.7); c.stroke(); }
  else if (id === 'belt') { for (const k of [-.6, 0, .6]) { P(k - .16, .7, k - .16, -.2, k, -.7, k + .16, -.2, k + .16, .7); c.closePath(); c.fill(); } }
  else if (id === 'cool') { for (let i = 0; i < 3; i++) { c.rotate(TAU / 6); P(0, -.85, 0, .85); c.stroke(); P(-.25, -.6, 0, -.4, .25, -.6); c.stroke(); P(-.25, .6, 0, .4, .25, .6); c.stroke(); } }
  else if (id === 'weld') { c.lineWidth = .34; P(0, -.7, 0, .7); c.stroke(); P(-.7, 0, .7, 0); c.stroke(); }
  else if (id === 'mortar') { c.beginPath(); c.arc(0, .7, .8, Math.PI * 1.08, Math.PI * 1.92); c.stroke(); dot(.76, .5, .26); P(-.9, .75, -.55, .2); c.lineWidth = .3; c.stroke(); }
  else if (id === 'coil') { P(.25, -.9, -.4, -.05, .15, -.05, -.3, .9); c.stroke(); P(.15, -.05, .6, -.05); c.stroke(); }
  else if (id === 'drone') { P(-.85, -.35, -.25, -.35); c.stroke(); P(.25, -.35, .85, -.35); c.stroke(); P(-.45, 0, 0, -.3, .45, 0, 0, .55); c.closePath(); c.fill(); }
  else if (id === 'burn') { c.beginPath(); c.moveTo(0, -.9); c.quadraticCurveTo(.9, .1, .35, .8); c.quadraticCurveTo(0, .95, -.35, .8); c.quadraticCurveTo(-.9, .1, 0, -.9); c.fill(); }
  else if (id === 'shock') { c.beginPath(); c.moveTo(0, -.85); c.lineTo(.7, -.5); c.quadraticCurveTo(.7, .5, 0, .9); c.quadraticCurveTo(-.7, .5, -.7, -.5); c.closePath(); c.stroke(); P(.1, -.4, -.2, .05, .2, .05, -.1, .5); c.stroke(); }
  else if (id === 'pierce') { P(-.9, 0, .5, 0); c.stroke(); P(.2, -.35, .85, 0, .2, .35); c.closePath(); c.fill(); c.lineWidth = .12; P(-.45, -.6, -.45, .6); c.stroke(); P(-.05, -.6, -.05, .6); c.stroke(); }
  else if (id === 'boom') { for (let i = 0; i < 8; i++) { c.rotate(TAU / 8); P(0, -.4, 0, -.9); c.stroke(); } dot(0, 0, .28); }
  else if (id === 'ichor') { c.beginPath(); c.moveTo(0, -.75); c.quadraticCurveTo(.6, .1, 0, .5); c.quadraticCurveTo(-.6, .1, 0, -.75); c.fill(); for (const a of [.5, 1.57, 2.64]) dot(Math.cos(a) * .85, Math.sin(a) * .5 + .35, .13); }
  else if (id === 'chain') { P(-.8, -.6, -.2, 0, -.8, .6); c.stroke(); P(-.2, -.6, .4, 0, -.2, .6); c.stroke(); c.lineWidth = .24; P(.8, -.7, .8, .7); c.stroke(); }
  else if (id === 'heart') { c.beginPath(); c.moveTo(0, .8); c.bezierCurveTo(-1.2, -.1, -.6, -1, 0, -.35); c.bezierCurveTo(.6, -1, 1.2, -.1, 0, .8); c.fill(); }
  else if (id === 'stride') { P(-.3, -.85, -.3, .2, .45, .2, .45, .5, -.6, .5, -.6, -.85); c.closePath(); c.fill(); c.beginPath(); c.arc(0, .55, .9, .15, Math.PI - .15); c.stroke(); }
  else if (id === 'reaper') { c.beginPath(); c.arc(.1, .15, .8, Math.PI * .95, Math.PI * 1.9); c.stroke(); P(.1, .15, .85, -.1); c.stroke(); P(-.7, .15, -.55, .85); c.stroke(); }
  else if (id === 'molt') { c.beginPath(); c.ellipse(0, .05, .62, .82, 0, 0, TAU); c.stroke(); P(-.55, -.1, -.2, .15, .05, -.2, .3, .1, .58, -.15); c.stroke(); }
  else if (id === 'graft') { c.beginPath(); c.moveTo(-.85, .7); c.quadraticCurveTo(-.7, -.6, .1, -.5); c.stroke(); dot(.3, -.45, .32); dot(.8, .1, .12); dot(.55, .5, .1); dot(.9, .65, .08); }
  else if (id === 'sear') { P(-.9, -.2, -.3, -.5, -.3, .5, -.9, .2); c.closePath(); c.fill(); P(0, -.5, .85, -.85); c.stroke(); P(.05, 0, .9, 0); c.stroke(); P(0, .5, .85, .85); c.stroke(); }
  c.restore(); }
function inBeam(g, x, z) { const dx = x - g.x, dz = z - g.z, d = Math.hypot(dx, dz); return d < 19 && d > .5 && (dx * Math.sin(g.lamp) + dz * Math.cos(g.lamp)) / d > (g.s.sear ? .72 : .8); }
function blast(x, z, r, dmg, col) { const g = G; g.blasts.push({ x, z, r, dmg, col: col || [1, .55, .15], t: .07 }); }       // goes off a moment later, so chains ripple instead of all landing at once
function doBlast(b) { const g = G; for (const e of g.en) { if (e.dead) continue; const dx = e.x - b.x, dz = e.z - b.z, d = Math.hypot(dx, dz) || 1; if (d < b.r + .5 * e.s) { e.kx += dx / d * 7; e.kz += dz / d * 7; hurtBug(e, b.dmg, dx / d, dz / d); } }
  const c = b.col; for (let i = 0; i < 9; i++) { const a = rand(0, TAU), v = rand(1, 5); part(0, b.x, rand(.4, 1), b.z, Math.sin(a) * v, rand(.5, 3), Math.cos(a) * v, rand(.2, .4), b.r * rand(.35, .6), c[0], c[1], c[2], .8, 0, 3, -1); } sparks(b.x, .6, b.z, 0, 0, 8, c[0], c[1], c[2], 9); mark(b.x, b.z, b.r * .8, b.r * .8, 0, 0, 0, 0, 0, .5, 8);
  DL.push({ x: b.x, z: b.z, sx: .4, sz: .4, rot: 0, kind: 1, r: c[0], g: c[1], b: c[2], a: .85, t: 0, life: .26, seed: 0, grow: b.r * 5 }); for (let i = 0; i < 3; i++) part(1, b.x + rand(-.5, .5) * b.r * .4, rand(.4, .9), b.z + rand(-.5, .5) * b.r * .4, rand(-.6, .6), rand(1, 2.2), rand(-.6, .6), rand(.8, 1.3), b.r * .3, .13, .12, .11, .4, 0, 1.2, b.r * .5);
  if (DB.length < 110) for (let i = 0; i < 3; i++) { const a = rand(0, TAU), v = rand(3, 7), sz = rand(.1, .24); debris(MESH.cube, b.x, .2, b.z, sz, sz * .6, sz, CONC, 0, Math.sin(a) * v, rand(5, 10), Math.cos(a) * v, rand(1.4, 2.2)); }
  g.pulse = { x: b.x, z: b.z, c, t: 1 }; g.trauma = Math.min(1, g.trauma + .04 + b.r * .035); sfx.blast(); }

/* ---------- nights: holding one opens the next, and each names what it adds ---------- */
const NIGHTS = [
  { say: 'Bugs and brood guards', hp: 1, cap: 0, spit: 0, guard: 55, pair: 200 * PACE, lull: .4, spd: 1, tok: 0 },
  { say: 'Spitters', hp: 1.12, cap: 0, spit: 3, guard: 55, pair: 200 * PACE, lull: .4, spd: 1, tok: 0 },
  { say: 'Guards in pairs', hp: 1.3, cap: 2, spit: 3, guard: 50, pair: 40, lull: .4, spd: 1, tok: 0 },
  { say: 'Faster, fewer lulls', hp: 1.45, cap: 3, spit: 4, guard: 50, pair: 40, lull: .65, spd: 1.1, tok: 1 },
  { say: 'Everything at once', hp: 1.65, cap: 5, spit: 5, guard: 42, pair: 0, lull: .7, spd: 1.14, tok: 2 },
];
let OPEN = 1, night = 1; try { OPEN = clamp(+(localStorage.getItem('ll4_night') || 1) | 0, 1, NIGHTS.length); night = OPEN; } catch (e) { }

/* ---------- state ---------- */
let state = 'title', G = null, lastT = 0, stick = null, dbtn = null; const keys = {};
const PT = [], DB = [], DL = [], TR = [];          // particles, debris, ground marks, tracers
function newGame(demo) {
  G = { demo, t: 0, kills: 0, hp: 100, x: 0, z: 0, vx: 0, vz: 0, pvx: 0, pvz: 0, head: demo ? .55 : 0, aim: demo ? .55 : 0, aimV: 0, lamp: demo ? .55 : 0, lampV: 0, phase: 0, py: HIP,
    feet: [0, 1].map(i => ({ x: (i ? -1 : 1) * HIPW, z: 0, y: 0, a: 0, sw: false, fx: 0, fz: 0 })),
    bob: S0(), lx: S0(), lz: S0(), roll: S0(), rec: S0(), kick: S0(), ram: S0(), crouch: S0(), antx: S0(), antz: S0(), fov: S0(), pitch: S0(),
    spin: 0, spinV: 0, fireT: 0, flash: 0, heat: 0, jet: 0, tgt: null, dash: null, dcd: 0, inv: 0, hurtT: 0, sinceHit: 9, trauma: 0, freeze: 0, boom: 0, dead: 0, smokeT: 0,
    cam: { x: 0, z: 0, d: demo ? .5 : 1 }, en: [], spawnT: 1.2, cap: null, muz: [-.6, 2.3, 1.7], lampP: [0, 2.9, 1], lampD: [0, -.2, 1],
    items: [], lv: {}, parts: 0, fresh: [], drops: [], fires: [], blasts: [], shells: [], bolts: [], drones: [], pulse: null, shotN: 0, sinceItem: 0, itemFx: 0, itemCol: [1, 1, 1], fireTick: 0, mortT: 1.5, coilT: 1, shieldT: 0, eliteT: 48, surged: -1, won: 0, lastDrop: 0, N: NIGHTS[night - 1], night, globs: [], pools: [], saidSpit: false, cues: [], allies: [], fitT: {}, gr: [0, 1, 2, 3, 4, 5, 6].map(S0), stage: 0, reapA: 0, graftT: 0, graftP: [0, 3, 0], molted: false, stompFx: 0, hot: 0, shotN2: 0, spinT: 0, lastShot: 9, ck: { x: 0, z: 0 }, fRot: 0, arcT: 0, weldT: 0, dip: 0, puffCd: 0, aimLean: 0, s: (() => { const b = baseStats(); b.dmg = b.pow * SHELL; return b; })() };
  if (demo) { G.feet[0].x = Math.cos(.55) * HIPW; G.feet[0].z = -Math.sin(.55) * HIPW; G.feet[1].x = -G.feet[0].x; G.feet[1].z = -G.feet[0].z; G.feet[0].a = G.feet[1].a = .55; }
  PT.length = DB.length = DL.length = TR.length = 0; cardQ.length = 0;
}
function announce(t) { const l = $('live'); if (!l) return; l.textContent = ''; setTimeout(() => { l.textContent = t; }, 40); }
function cap(txt, t) { const g = G; if (!g || g.demo) return; if (ST.caps) g.cap = { txt, t: t || 2.6 }; announce(txt); }

/* ---------- the pad: scattered cover, laid out by a hash so it is endless and always the same ---------- */
const CELL = 11, cells = new Map();
function getCell(cx, cz) { const key = cx + ',' + cz; let c = cells.get(key); if (c) return c; c = []; const h = hash2(cx, cz, 1), x = (cx + .2 + hash2(cx, cz, 2) * .6) * CELL, z = (cz + .2 + hash2(cx, cz, 3) * .6) * CELL, rot = hash2(cx, cz, 4) * TAU, v = hash2(cx, cz, 5);
  if (Math.hypot(x, z) > 7) { if (h < .13) c.push({ k: 'fire', x, z, r: .6, rot, v }); else if (h < .3) c.push({ k: 'pillar', x, z, r: .8, rot, v }); else if (h < .46) c.push({ k: 'rubble', x, z, r: 1.05, rot, v }); else if (h < .56) c.push({ k: 'crates', x, z, r: 1, rot, v }); }
  cells.set(key, c); return c; }
function pushOut(o, rad) { const cx = Math.floor(o.x / CELL), cz = Math.floor(o.z / CELL); for (let i = cx - 1; i <= cx + 1; i++) for (let j = cz - 1; j <= cz + 1; j++) for (const p of getCell(i, j)) { const dx = o.x - p.x, dz = o.z - p.z, d = Math.hypot(dx, dz), m = p.r + rad; if (d < m && d > 1e-4) { o.x = p.x + dx / d * m; o.z = p.z + dz / d * m; } } }

/* ---------- small things that fly ---------- */
function part(k, x, y, z, vx, vy, vz, life, size, r, g, b, a, grav, drag, grow, len) { if (PT.length < 650) PT.push({ k, x, y, z, vx, vy, vz, t: 0, life, size, r, g, b, a, grav: grav || 0, drag: drag || 0, grow: grow || 0, len: len || 0 }); }
function debris(mesh, x, y, z, sx, sy, sz, col, e, vx, vy, vz, life) { if (DB.length > 170) DB.shift(); DB.push({ mesh, x, y, z, sx, sy, sz, col, e, vx, vy, vz, ax: rand(0, TAU), ay: rand(0, TAU), wx: rand(-14, 14), wy: rand(-14, 14), t: 0, life, rad: Math.max(.04, Math.min(sx, sy, sz) * .5) }); }
function mark(x, z, sx, sz, rot, kind, r, g, b, a, life, seed) { if (DL.length > 130) DL.shift(); DL.push({ x, z, sx, sz, rot, kind, r, g, b, a, t: 0, life, seed: seed || 0 }); }
function sparks(x, y, z, dx, dz, n, r, g, b, spd) { for (let i = 0; i < n; i++) { const a = Math.atan2(dx, dz) + rand(-.9, .9), s = rand(.3, 1) * (spd || 9); part(2, x, y, z, Math.sin(a) * s, rand(1, 6), Math.cos(a) * s, rand(.12, .3), .05, r, g, b, 1, 22, 2, 0, .035); } }
function dust(x, z, n, spd, sz) { for (let i = 0; i < n; i++) { const a = rand(0, TAU), s = rand(.3, 1) * spd; part(1, x, rand(.1, .3), z, Math.sin(a) * s, rand(.3, 1.4), Math.cos(a) * s, rand(.5, 1), sz || .35, .2, .19, .17, .3, 0, 2.5, 1.3); } }

/* ---------- bugs ---------- */
const SHELLC = [.032, .028, .034], CLAWC = [.4, .34, .26], PALS = [[.5, .16, .03], [.46, .05, .04], [.52, .36, .07], [.34, .1, .03]];      // every bug is near-black chitin; one accent colour marks its plates
function morph(o) { const r = Math.random(); o.m = { ab: rand(.82, 1.28), lg: rand(.88, 1.22), w: rand(.88, 1.16), pal: Math.floor(Math.random() * PALS.length), spk: Math.random() < .35, mand: rand(.8, 1.5), ant: rand(.7, 1.3) }; o.kind = r < .4 ? 'rush' : r < .75 ? 'flank' : 'skirm'; o.ring = rand(2.3, 3.6); o.flipT = rand(1, 4); o.pace = rand(0, 1); o.run = true; return o; }
function spawnBug(x, z, kind) { const g = G, big = kind === 'big' || kind === true, spit = kind === 'spit', s = big ? 1.25 : spit ? .68 : rand(.6, .74), hp = 36 * (1 + g.t / 100 + (g.t / 260) ** 2) * g.N.hp * (big ? 12 : spit ? .8 : 1); g.en.push(morph({ x, z, a: Math.atan2(g.x - x, g.z - z), vx: 0, vz: 0, kx: 0, kz: 0, hp, s, big, spit, state: 'chase', st: 0, cd: big ? 1.5 : spit ? rand(1, 2) : rand(.2, 1), phase: Math.random(), legs: null, fl: S0(), rear: S0(), flash: 0, burnT: 0, cutT: 0, off: 0, lim: 0, bias: rand(-1, 1), ldx: 0, ldz: 1, la: 0, tx: 0, tz: 0, hitP: false, dead: false })); }
const COMPASS = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'], compass = a => COMPASS[((Math.round(a / (TAU / 8)) % 8) + 8) % 8];
/* The number alive has a ceiling that rises slowly, so a strong build means more kills, not a fuller screen.
   Each 40 seconds runs press, surge, lull. A brood guard arrives every 55 seconds and always drops a part. The run ends at six minutes. */
function spawnLogic(dt) { const g = G; if (g.demo || g.dead || g.won) return; const nt = g.N, cyc = g.t % 40, last = g.t > RUN - 36, lull = cyc > 32 && !last, wave = Math.floor(g.t / 40);
  let N = Math.min(20, 6 + g.t / 12) + nt.cap; if (lull) N *= nt.lull; if (last) N += 5; N = Math.round(N * ST.ecount); let alive = 0, spitters = 0; for (const e of g.en) { if (!e.big) alive++; if (e.spit) spitters++; }
  const ring = (a, r, kind) => { if (kind !== 'big' && g.en.length >= 30 + g.night) return; const p = { x: g.x + Math.sin(a) * r, z: g.z + Math.cos(a) * r }; pushOut(p, .8); spawnBug(p.x, p.z, kind); };      // never more on the pad than can be read
  g.spawnT -= dt; if (g.spawnT <= 0 && alive < N) { g.spawnT = last ? .18 : lerp(.5, .2, clamp(g.t / 240, 0, 1)); const mv = Math.hypot(g.vx, g.vz) > 2, spit = nt.spit && g.t > 30 && spitters < Math.min(nt.spit, 1 + g.t / 70) && Math.random() < .25;
    ring(mv && Math.random() < .5 ? Math.atan2(g.vx, g.vz) + rand(-1.1, 1.1) : rand(0, TAU), rand(19, 23), spit ? 'spit' : null); if (spit && !g.saidSpit) { g.saidSpit = true; cap('Spitters. A red ring marks where the acid will land.', 4); } }
  if (cyc > 26 && g.surged < wave) { g.surged = wave; const a = rand(0, TAU), n = Math.round(Math.min(7, 3 + g.t / 60) * ST.ecount); for (let i = 0; i < n; i++) ring(a + rand(-.35, .35), rand(19, 25)); if (g.night > 4) for (let i = 0; i < n; i++) ring(a + Math.PI + rand(-.35, .35), rand(19, 25)); g.cues.push({ a, t: 3.4 }); if (g.night > 4) g.cues.push({ a: a + Math.PI, t: 3.4 }); cap(g.night > 4 ? 'Swarms from two sides' : 'Swarm from the ' + compass(a)); sfx.swarm(); }
  g.eliteT -= dt; if (g.eliteT <= 0) { g.eliteT = nt.guard; const a = rand(0, TAU), two = g.t > nt.pair; ring(a, 21, 'big'); if (two) ring(a + 2.4, 21, 'big'); cap((two ? 'Two brood guards. They carry parts.' : 'Brood guard from the ' + compass(a) + '. It carries a part.')); sfx.swarm(); }
  if (last && !g.lastSaid) { g.lastSaid = true; cap('Last push.'); } }
function hurtBug(e, dmg, dx, dz, ram, heavy) { const g = G; if (e.dead) return; e.hp -= dmg; e.flash = .09;
  if (heavy) { const kb2 = e.big ? 1.2 : 4.5, px = e.x + dx * .4 * e.s, pz = e.z + dz * .4 * e.s; e.fl.v += e.big ? 4 : 10; e.kx += dx * kb2; e.kz += dz * kb2; g.trauma = Math.min(1, g.trauma + .03); sfx.thwack();       // a cannon shell: it goes in one side and takes things out the other
    for (let i = 0; i < 9; i++) part(0, px, rand(.4, .8) * e.s, pz, dx * rand(4, 13) + rand(-3, 3), rand(1, 6), dz * rand(4, 13) + rand(-3, 3), rand(.3, .6), rand(.14, .3), .3, .7, .08, .9, 17, .4, -.2);
    if (ST.gore) { for (let i = 0; i < 2; i++) debris(MESH.oct, px, rand(.4, .8), pz, rand(.16, .34) * e.s, rand(.08, .16), rand(.2, .4) * e.s, i ? SHELLC : e.big ? GUARDC2 : PALS[e.m.pal], -.8, dx * rand(6, 13) + rand(-3, 3), rand(3, 7), dz * rand(6, 13) + rand(-3, 3), rand(1.6, 2.6));
      if (e.hp > 0 && !e.ally && e.lim < (e.big ? 2 : 3)) { let i = Math.floor(Math.random() * 6), n = 0; while (e.off >> i & 1 && n++ < 6) i = (i + 1) % 6; if (!(e.off >> i & 1)) { e.off |= 1 << i; e.lim++; const L = e.legs && e.legs[i]; debris(MESH.spike, L ? L.x : e.x, .5, L ? L.z : e.z, .12 * e.s, 1.3 * e.s, .12 * e.s, SHELLC, -.8, dx * rand(4, 9) + rand(-4, 4), rand(5, 9), dz * rand(4, 9) + rand(-4, 4), rand(2, 3)); } }
      if (Math.random() < .6) mark(e.x + dx * rand(1, 2.4), e.z + dz * rand(1, 2.4), rand(.25, .5), rand(.5, 1), Math.atan2(dx, dz), 3, .03, .055, .012, .65, 16, rand(0, 9)); } } e.fl.v += (ram ? 16 : 7) * (e.big ? .4 : 1); const kb = (ram ? 24 : 2.6) * (e.big ? .2 : 1); e.kx += dx * kb; e.kz += dz * kb;
  sparks(e.x - dx * .3, .55, e.z - dz * .3, -dx, -dz, ram ? 10 : 3, .7, 1, .25, 8); sfx.hit();
  if (dx || dz) { for (let i = 0; i < (ram ? 6 : 2); i++) part(0, e.x + dx * .4 * e.s, .6 * e.s, e.z + dz * .4 * e.s, dx * rand(3, 8) + rand(-2, 2), rand(1.5, 4.5), dz * rand(3, 8) + rand(-2, 2), rand(.3, .5), rand(.12, .22), .3, .7, .08, .85, 16, .5, -.2); if (Math.random() < .18) mark(e.x + dx * rand(.8, 1.8), e.z + dz * rand(.8, 1.8), rand(.2, .45), rand(.2, .45), rand(0, TAU), 3, .03, .055, .012, .6, 14, rand(0, 9)); }      // the shot goes through: ichor sprays out the far side and spots the ground
  if (e.hp <= 0) killBug(e, dx, dz, ram, heavy); }
function killBug(e, dx, dz, ram, heavy) { const g = G, s = e.s, f = ram ? 2.1 : heavy ? 1.9 : 1; if (heavy && ST.gore) { mark(e.x + dx * 1.7 * s, e.z + dz * 1.7 * s, .75 * s, 2.3 * s, Math.atan2(dx, dz), 3, .03, .055, .012, .8, 26, rand(0, 9)); for (let i = 0; i < 4; i++) debris(MESH.oct, e.x, rand(.4, .9), e.z, rand(.16, .3) * s, rand(.12, .2) * s, rand(.16, .3) * s, [.14, .3, .04], .2, dx * rand(7, 15) + rand(-4, 4), rand(3, 8), dz * rand(7, 15) + rand(-4, 4), rand(1.5, 2.5)); g.trauma = Math.min(1, g.trauma + .04); } /* what is left goes down the line of fire */ e.dead = true; g.kills++; sfx.kill(); part(0, e.x, .7 * s, e.z, 0, 0, 0, .11, 2.4 * s, .7, 1, .4, .5, 0, 0, 4);
  if (!g.won) { g.sinceItem++; const want = g.parts ? (g.t - g.lastDrop > 20 ? clamp((g.sinceItem - 8) * .03, 0, 1) : 0) : clamp((g.sinceItem - 3) * .25, 0, 1), id = e.big || Math.random() < want ? rollItem(g, e.big) : null;      // a part roughly every twenty-odd seconds, plus one from each guard
    if (id) { g.sinceItem = 0; if (!e.big) g.lastDrop = g.t; g.drops.push({ k: 'item', id, x: e.x, z: e.z, t: 0 }); } if (e.big || (!id && Math.random() < .06)) g.drops.push({ k: 'fix', x: e.x + (id ? 1.2 : 0), z: e.z, t: 0 });
    if (g.s.leech && !g.dead) { g.hp = Math.min(g.s.maxhp, g.hp + g.s.leech); for (let i = 0; i < 3; i++) part(0, e.x, .8, e.z, (g.x - e.x) * 2.2 + rand(-1, 1), rand(1, 3), (g.z - e.z) * 2.2 + rand(-1, 1), .42, .32, .3, 1, .5, .9, 0, 0, -.4); }
    if (g.s.heart && !e.big && g.allies.length < 4 && Math.random() < .25) raise(e.x, e.z, e.s);
    if (g.s.ichor) blast(e.x, e.z, g.s.ichor === 1 ? 2.4 : 3.3, g.s.pow * (g.s.ichor === 1 ? 2.5 : 4), [.6, 1, .25]); if (ram && g.s.chain) g.dcd -= g.s.dashCd * .6; }
  if (e.big) { g.trauma = Math.min(1, g.trauma + .5); if (ST.hitstop && !g.won) g.freeze = Math.max(g.freeze, .11); dust(e.x, e.z, 14, 6, .8); DL.push({ x: e.x, z: e.z, sx: 1, sz: 1, rot: 0, kind: 1, r: .6, g: 1, b: .3, a: .9, t: 0, life: .4, seed: 0, grow: 16 }); g.pulse = { x: e.x, z: e.z, c: [.7, 1, .3], t: 1 };
    if (ST.gore) for (let i = 0; i < 10; i++) debris(i % 2 ? MESH.shell : MESH.oct, e.x + rand(-.8, .8), rand(.5, 1.4), e.z + rand(-.8, .8), rand(.4, .9), rand(.14, .3), rand(.5, 1), i % 3 ? GUARDC2 : GUARDF, -.7, rand(-9, 9), rand(6, 13), rand(-9, 9), rand(2.5, 4)); }       // a guard goes down like a building
  mark(e.x + dx * .4, e.z + dz * .4, rand(.9, 1.5) * s, rand(.9, 1.5) * s, rand(0, TAU), 3, .03, .055, .012, .75, 26, rand(0, 9));
  if (ST.gore) { const fl = (m, sx, sy, sz, col, em) => debris(m, e.x + rand(-.3, .3), rand(.4, .8), e.z + rand(-.3, .3), sx * s, sy * s, sz * s, col, em, dx * rand(3, 9) * f + rand(-3, 3), rand(4, 9) * (ram ? 1.3 : 1), dz * rand(3, 9) * f + rand(-3, 3), rand(2, 3.2));
    const ac = e.big ? GUARDC2 : e.spit ? SPITC2 : PALS[e.m.pal]; for (let i = 0; i < 5; i++) fl(i % 2 ? MESH.oct : MESH.shell, rand(.3, .6), rand(.12, .24), rand(.4, .8), i % 2 ? SHELLC : ac, -.8); fl(MESH.oct, .5, .26, .6, SHELLC, -.8); for (let i = 0; i < 6; i++) fl(MESH.spike, .11, 1.1, .11, SHELLC, -.8); if (!e.spit && !e.big) for (let i = 0; i < 2; i++) fl(MESH.blade, .9, 1.1, .9, CLAWC, 0); for (let i = 0; i < 4; i++) fl(MESH.oct, .16, .14, .16, [.16, .4, .04], .25); }
  for (let i = 0; i < 7; i++) part(0, e.x, .6, e.z, rand(-3, 3) + dx * 3, rand(1, 5), rand(-3, 3) + dz * 3, rand(.2, .4), rand(.3, .6), .35, .8, .1, .7, 12, 1, -.6); }
function bugHome(e, i, sp, out) { const side = i < 3 ? 1 : -1, row = i % 3, s = e.s, lx = side * (e.big ? 1.05 : 1.2 + (row === 1 ? .22 : 0)) * s * e.m.lg, lz = (1 - row) * .9 * s, c = Math.cos(e.a), sn = Math.sin(e.a); let x = e.x + lx * c + lz * sn, z = e.z - lx * sn + lz * c; if (sp > .6) { x += e.vx / sp * .33 * s; z += e.vz / sp * .33 * s; } out[0] = x; out[1] = z; return out; }
const _h = [0, 0]; let tokens = 0;
/* thralls: bugs the brood heart has raised. They run down the nearest bug and bite it, and fall apart after a few seconds */
function raise(x, z, sc) { G.allies.push(morph({ x, z, a: rand(0, TAU), vx: 0, vz: 0, kx: 0, kz: 0, hp: 1, s: sc, big: false, spit: false, ally: true, state: 'chase', st: 0, cd: 0, phase: Math.random(), legs: null, fl: S0(), rear: S0(), flash: 0, burnT: 0, cutT: 0, off: 0, lim: 0, bias: rand(-1, 1), ldx: 0, ldz: 1, la: 0, tx: 0, tz: 0, life: 9, bite: 0, born: 0, dead: false })); }
function updAlly(e, dt) { const g = G; e.life -= dt; e.born += dt; let best = null, bd = 16; for (const o of g.en) { if (o.dead) continue; const d = Math.hypot(o.x - e.x, o.z - e.z); if (d < bd) { bd = d; best = o; } }
  let mvx = 0, mvz = 0, face = e.a; if (best) { const ux = (best.x - e.x) / (bd || 1), uz = (best.z - e.z) / (bd || 1), reach = .8 * (e.s + best.s) + .3; face = Math.atan2(ux, uz); if (bd > reach) { mvx = ux * 6.4; mvz = uz * 6.4; } e.bite -= dt; if (bd < reach + .4 && e.bite <= 0) { e.bite = .4; e.fl.v -= 9; hurtBug(best, g.s.pow * 2.5, ux, uz); } }
  else { const dx = g.x - e.x, dz = g.z - e.z, d = Math.hypot(dx, dz) || 1; face = Math.atan2(dx, dz); if (d > 4) { mvx = dx / d * 5; mvz = dz / d * 5; } }
  bugMove(e, dt, mvx, mvz, face); if (e.life <= 0) { e.dead = true; for (let i = 0; i < 6; i++) part(0, e.x, .6, e.z, rand(-2, 2), rand(1, 4), rand(-2, 2), rand(.25, .45), rand(.3, .5), .3, .8, 1, .6, 8, 1, -.5); } }
function updBug(e, dt) { const g = G, dx = g.x - e.x, dz = g.z - e.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d; let mvx = 0, mvz = 0, face = Math.atan2(ux, uz); e.cd -= dt; e.st -= dt;
  if (e.spit) {       // keeps its distance and lobs acid at where you are heading; the landing spot is marked from the moment it winds up
    if (e.state === 'chase') { const spd = 4 * ST.espd * g.N.spd * (g.s.sear && inBeam(g, e.x, e.z) ? .65 : 1), sd = e.bias > 0 ? 1 : -1; if (d > 10.5) { mvx = ux * spd * (d > 14 ? 1.6 : 1); mvz = uz * spd * (d > 14 ? 1.6 : 1); } else if (d < 6) { mvx = -ux * 3; mvz = -uz * 3; } else { mvx = -uz * sd * 1.3; mvz = ux * sd * 1.3; }
      if (d < 12.5 && e.cd <= 0 && !g.dead && !g.demo && !g.won) { e.state = 'tell'; e.st = .75; let px = g.x + g.vx * .9 - e.x, pz = g.z + g.vz * .9 - e.z; const l = Math.hypot(px, pz) || 1, m = Math.min(l, 14); e.tx = e.x + px / l * m; e.tz = e.z + pz / l * m; e.la = Math.atan2(px, pz); sfx.tell(); } }
    else if (e.state === 'tell') { face = e.la; if (e.st <= 0) { e.state = 'rec'; e.st = .5; e.cd = rand(2.6, 3.6); g.globs.push({ x0: e.x, z0: e.z, x1: e.tx, z1: e.tz, t: 0, dur: .8 }); sfx.spit(); } }
    else { face = e.a; if (e.st <= 0) e.state = 'chase'; }
  } else if (e.state === 'chase') {
    e.pace -= dt; if (e.pace <= 0) { e.run = !e.run; e.pace = e.run ? rand(.5, 1.5) : rand(.06, .26); }      // they skitter: a run, a beat, a run
    e.flipT -= dt; if (e.flipT <= 0) { e.flipT = rand(2, 5); if (Math.random() < .5) e.bias = -e.bias; }
    if (d < (e.big ? 7.5 : e.kind === 'rush' ? 4.3 : 3.7) && e.cd <= 0 && !g.dead && !g.demo && !g.won && (e.big || tokens < Math.min(5, 2 + Math.floor(g.t / 70)) + g.N.tok)) { e.state = 'tell'; e.st = e.big ? .85 : TELL; if (!e.big) tokens++; const ld = rand(.35, .7), px = g.x + g.vx * ld - e.x, pz = g.z + g.vz * ld - e.z, l = Math.hypot(px, pz) || 1; e.ldx = px / l; e.ldz = pz / l; e.la = Math.atan2(e.ldx, e.ldz); sfx.tell(); }
    else { const spd = (e.big ? 3.3 : BUGV * (1 + Math.min(.3, g.t / 700))) * (1 - .08 * e.lim) * ST.espd * g.N.spd * (d > 13 ? 1.6 : 1) * (g.s.sear && inBeam(g, e.x, e.z) ? .65 : 1) * (e.big || d > 12 ? 1 : e.run ? 1.3 : .3), sd = e.bias > 0 ? 1 : -1, ring = e.big ? 2.7 : e.ring; let rad, tan;
      if (e.big) { rad = d > ring ? 1 : d < 2.1 ? -.6 : 0; tan = d > ring ? 0 : .45; }
      else if (e.kind === 'skirm') { const want = e.cd <= 0 ? ring : ring + 2.8; rad = clamp((d - want) * .8, -1, 1); tan = d < want + 3 ? .8 : .15; }       // hangs back on a ring, strafing, and darts in when it is ready
      else if (e.kind === 'flank') { const k = clamp((d - 1.5) / 7, 0, 1) * 1.15; rad = d > ring ? Math.cos(k) : d < 2.1 ? -.5 : 0; tan = d > ring ? Math.sin(k) : .6; }       // swings wide to come in from the side
      else { rad = d > ring ? 1 : d < 2 ? -.5 : 0; tan = d > ring ? Math.sin(g.t * 3 + e.bias * 9) * .4 * clamp((d - 2) / 6, 0, 1) : Math.sin(g.t * 4.5 + e.bias * 7) * .7; }       // comes straight in with a weave, then jitters at arm's length
      mvx = (ux * rad - uz * sd * tan) * spd; mvz = (uz * rad + ux * sd * tan) * spd; }
  } else if (e.state === 'tell') { face = e.la; if (e.st <= 0) { e.state = 'lunge'; e.st = e.big ? .5 : LUNGE_T; e.hitP = false; sfx.lunge(); } }
  else if (e.state === 'lunge') { face = e.la; const lv = e.big ? 20 : LUNGE_V; mvx = e.ldx * lv; mvz = e.ldz * lv; if (!e.hitP && d < (e.big ? 2.1 : 1.3)) { e.hitP = true; hurtPlayer(e.big ? 22 : 12, e.ldx, e.ldz); } if (e.st <= 0) { e.state = 'rec'; e.st = e.big ? 1.3 : .6; dust(e.x, e.z, e.big ? 8 : 3, e.big ? 4 : 2); } }
  else { face = e.a; if (e.st <= 0) { e.state = 'chase'; e.cd = e.big ? rand(1.6, 2.4) : rand(1.2, 2.4); } }
  bugMove(e, dt, mvx, mvz, face); }
function bugMove(e, dt, mvx, mvz, face) { const g = G;
  const k = 1 - Math.exp(-dt * (e.state === 'lunge' ? 30 : 9)); e.vx += (mvx - e.vx) * k; e.vz += (mvz - e.vz) * k; const kd = Math.exp(-dt * 7); e.kx *= kd; e.kz *= kd;
  e.x += (e.vx + e.kx) * dt; e.z += (e.vz + e.kz) * dt; pushOut(e, .5 * e.s); e.a += clamp(angDiff(e.a, face), -9 * dt, 9 * dt);
  spring(e.rear, e.state === 'tell' ? 1 : 0, 170, 15, dt); spring(e.fl, 0, 260, 17, dt); e.flash -= dt; e.burnT -= dt; e.cutT -= dt;
  // legs: two tripods, each foot stays planted on the ground until it is its turn to swing
  const sp = Math.hypot(e.vx, e.vz), st = 1.5 * e.s; if (!e.legs) { e.legs = []; for (let i = 0; i < 6; i++) { bugHome(e, i, 0, _h); e.legs.push({ x: _h[0], z: _h[1], y: 0, sw: false, fx: 0, fz: 0 }); } }
  let need = false; for (let i = 0; i < 6; i++) { const L = e.legs[i]; bugHome(e, i, 0, _h); if (L.sw || Math.hypot(L.x - _h[0], L.z - _h[1]) > .4 * e.s) need = true; }
  e.phase += Math.max(sp / st * dt, sp < .8 && need ? dt * 3.2 : 0);
  for (let i = 0; i < 6; i++) { const L = e.legs[i], row = i % 3, grp = (row + (i < 3 ? 0 : 1)) & 1, ph = (e.phase + grp * .5) % 1; bugHome(e, i, sp, _h);
    if (e.state === 'lunge') { L.x = _h[0] - e.ldx * .5; L.z = _h[1] - e.ldz * .5; L.y = .22; L.sw = false; continue; }                       // legs swept back in the leap
    if (e.state === 'tell' && row === 0) { L.x = _h[0] + Math.sin(e.a) * .3; L.z = _h[1] + Math.cos(e.a) * .3; L.y = (.55 + Math.sin(g.t * 26 + i) * .12) * e.rear.x; L.sw = false; continue; }   // front pair up and pawing
    if (ph < .5 && (sp > .8 || need)) { if (!L.sw) { L.sw = true; L.fx = L.x; L.fz = L.z; } const u = ph / .5, q = ease(u), ah = sp > .8 ? (1 - u) * .5 * st : 0; L.x = lerp(L.fx, _h[0] + e.vx / (sp || 1) * ah, q); L.z = lerp(L.fz, _h[1] + e.vz / (sp || 1) * ah, q); L.y = Math.sin(u * Math.PI) * .42 * e.s; }
    else { L.sw = false; L.y = 0; } }
}

/* ---------- the mech ---------- */
function shockwave(r, dmg) { const g = G; for (const e of g.en) { if (e.dead) continue; const ex = e.x - g.x, ez = e.z - g.z, d = Math.hypot(ex, ez) || 1; if (d < r) { const k = e.big ? 5 : 17; e.kx += ex / d * k; e.kz += ez / d * k; if (e.state === 'tell' && !e.big) { e.state = 'rec'; e.st = .6; } hurtBug(e, dmg, ex / d, ez / d); } }
  DL.push({ x: g.x, z: g.z, sx: 1, sz: 1, rot: 0, kind: 1, r: .4, g: .7, b: 1, a: .9, t: 0, life: .35, seed: 0, grow: r * 2.6 }); g.pulse = { x: g.x, z: g.z, c: [.4, .65, 1], t: 1 }; g.trauma = Math.min(1, g.trauma + .25); sfx.blast(); }
function hurtPlayer(d, dx, dz) { const g = G; if (g.inv > 0 || g.dead || g.demo || g.won) return;
  if (g.s.shock && g.shieldT <= 0) { g.shieldT = g.s.shock; g.inv = .5; shockwave(5.5, g.s.pow * 3); return; }       // the plating takes this one
  g.hp -= d * ST.dmg; g.inv = .45; g.hurtT = 1; g.sinceHit = 0; g.trauma = Math.min(1, g.trauma + .45); if (ST.hitstop) g.freeze = .06; g.rec.v -= 5; g.roll.v += rand(-4, 4); g.vx += dx * 5; g.vz += dz * 5; g.arcT = .55; g.dip = 1; g.crouch.v += 3;
  for (let i = 0; i < 3; i++) debris(MESH.cube, g.x + rand(-.5, .5), rand(1.8, 2.6), g.z + rand(-.5, .5), rand(.2, .4), .05, rand(.2, .4), i ? YEL : DRK, 0, dx * rand(2, 6) + rand(-4, 4), rand(4, 8), dz * rand(2, 6) + rand(-4, 4), rand(1.5, 2.4));
  sparks(g.x, 2, g.z, dx, dz, 12, 1, .7, .3, 10); sfx.hurt();
  if (g.hp <= 0 && g.s.molt && !g.molted) { g.molted = true; g.hp = g.s.maxhp * .5; g.inv = 1.6; shockwave(7.5, g.s.pow * 8); g.trauma = 1; g.crouch.v += 7; cap('The second shell is shed. Half your hull is back.', 4); for (let i = 0; i < 14; i++) debris(MESH.cube, g.x + rand(-.6, .6), rand(2, 3), g.z + rand(-.6, .6), rand(.3, .7), .07, rand(.3, .7), BONE, 0, rand(-9, 9), rand(4, 11), rand(-9, 9), rand(2, 3.5)); return; }
  if (g.hp <= 0) die(); else if (g.hp < 30) cap('Hull critical'); }
function die() { const g = G; g.hp = 0; g.dead = .001; g.dash = null; g.boom = 1; g.trauma = 1; sfx.boom(); cap('Wrecked'); mark(g.x, g.z, 3, 3, 0, 0, 0, 0, 0, .8, 60);
  for (let i = 0; i < 16; i++) debris(MESH.cube, g.x + rand(-.5, .5), rand(1.6, 2.8), g.z + rand(-.5, .5), rand(.2, .8), rand(.15, .5), rand(.2, .8), Math.random() < .6 ? YEL : DRK, 0, rand(-9, 9), rand(5, 14), rand(-9, 9), rand(3, 5));
  for (let i = 0; i < 40; i++) { const a = rand(0, TAU), s = rand(2, 13); part(0, g.x, rand(1.5, 2.6), g.z, Math.sin(a) * s, rand(1, 9), Math.cos(a) * s, rand(.4, 1), rand(.6, 1.6), 1, rand(.4, .7), .12, 1, 6, 2, -.6); } dust(g.x, g.z, 16, 7, .8); }
function startDash(dx, dz) { const g = G; if (!g || g.dash || g.dcd > 0 || g.dead || g.demo || state !== 'play') return; const l = Math.hypot(dx, dz); if (l < .01) { dx = Math.sin(g.head); dz = Math.cos(g.head); } else { dx /= l; dz /= l; }
  const B = DASH.burst * (g.s.chain ? 1.5 : 1); g.dash = { t: 0, dx, dz, hit: new Set(), skidded: false, B }; g.dcd = g.s.dashCd; g.inv = Math.max(g.inv, DASH.wind + B + .08); g.crouch.v += 5.5; g.fov.v += 2.4; g.trauma = Math.min(1, g.trauma + .22); sfx.dash();
  dust(g.x, g.z, 14, 6, .55); mark(g.x, g.z, 1.7, 1.7, 0, 0, 0, 0, 0, .55, 9); }
function stomp(f, side) { const g = G; g.bob.v -= 2.1; g.roll.v += side * 1.3; g.trauma = Math.min(1, g.trauma + .035); dust(f.x, f.z, 3, 1.8, .3); if (!g.demo) sfx.step();
  mark(f.x + Math.sin(f.a) * .1, f.z + Math.cos(f.a) * .1, .24, .44, f.a, 2, 0, 0, 0, .3, 10); { const c = Math.cos(g.aim), sn = Math.sin(g.aim), q = side * .4; part(1, g.x + q * c - .84 * sn, g.py + 2.1, g.z - q * sn - .84 * c, rand(-.3, .3), rand(2, 3), rand(-.3, .3), .8, .2, .2, .2, .21, .35, 0, 1.2, .7); }      // a print on the pad and a chuff from the stack
  if (g.s.stride && !g.demo && !g.dead) { g.stompFx = 1; g.bob.v -= 1; g.trauma = Math.min(1, g.trauma + .03); dust(f.x, f.z, 4, 3.5, .4); DL.push({ x: f.x, z: f.z, sx: .5, sz: .5, rot: 0, kind: 1, r: 1, g: .65, b: .2, a: .7, t: 0, life: .22, seed: 0, grow: 10 }); mark(f.x, f.z, .9, .9, rand(0, TAU), 3, 0, 0, 0, .45, 5, rand(0, 9));
    for (const e of g.en) { if (e.dead) continue; const ex = e.x - f.x, ez = e.z - f.z, d = Math.hypot(ex, ez) || 1; if (d < 2.5 + .4 * e.s) { e.kx += ex / d * (e.big ? 1 : 5); e.kz += ez / d * (e.big ? 1 : 5); hurtBug(e, g.s.pow * 1.6, ex / d, ez / d); } } } }
function gait(g, dt, burst) { const sp = Math.hypot(g.vx, g.vz), rx = Math.cos(g.head), rz = -Math.sin(g.head), ux = sp > .01 ? g.vx / sp : 0, uz = sp > .01 ? g.vz / sp : 0, mv = sp > 1.2;
  if (burst) { const d = g.dash, k = 1 - Math.exp(-dt * 40); for (let i = 0; i < 2; i++) { const f = g.feet[i], side = i ? -1 : 1, oz = i ? .7 : -.95, tx = g.x + d.dz * side * HIPW * 1.2 + d.dx * oz, tz = g.z - d.dx * side * HIPW * 1.2 + d.dz * oz; f.x += (tx - f.x) * k; f.z += (tz - f.z) * k; f.y = 0; f.sw = false; f.a = Math.atan2(d.dx, d.dz); } return; }   // braced and sliding
  let need = false; for (let i = 0; i < 2; i++) { const f = g.feet[i], side = i ? -1 : 1; if (f.sw || Math.hypot(f.x - g.x - rx * side * HIPW, f.z - g.z - rz * side * HIPW) > .42) need = true; }
  g.phase += mv ? sp / STRIDE * dt : need ? dt * 2.5 : 0; const lead = mv ? STRIDE * (1 - SWING) * .5 : 0;
  for (let i = 0; i < 2; i++) { const f = g.feet[i], side = i ? -1 : 1, ph = (g.phase + i * .5) % 1, hx = g.x + rx * side * HIPW + ux * lead, hz = g.z + rz * side * HIPW + uz * lead;
    if (ph < SWING && (mv || need)) { if (!f.sw) { f.sw = true; f.fx = f.x; f.fz = f.z; } const u = ph / SWING, q = ease(u), ah = mv ? (1 - u) * SWING * STRIDE : 0; f.x = lerp(f.fx, hx + ux * ah, q); f.z = lerp(f.fz, hz + uz * ah, q); f.y = Math.sin(u * Math.PI) * (mv ? .46 : .26); f.a += angDiff(f.a, g.head) * Math.min(1, dt * 16); }
    else if (f.sw) { f.sw = false; f.y = 0; stomp(f, side); } } }
function shoot(g) { const t = g.tgt, ox = g.x + g.muz[0], oy = g.muz[1], oz = g.z + g.muz[2]; let a = Math.atan2(t.x - ox, t.z - oz) + rand(-1, 1) * g.s.spread; const dx = Math.sin(a), dz = Math.cos(a), rx = Math.cos(g.aim), rz = -Math.sin(g.aim);
  const boomShot = g.s.boom && ++g.shotN % g.s.boom === 0; let left = g.s.pierce + 1, from = 0, ex = ox + dx * g.s.range, ez = oz + dz * g.s.range, dmg = g.s.dmg, hit = false;
  while (left-- > 0) { let best = null, bt = g.s.range; for (const e of g.en) { if (e.dead) continue; const bx = e.x - ox, bz = e.z - oz, tt = bx * dx + bz * dz; if (tt < from || tt > bt + 1) continue; const p2 = bx * bx + bz * bz - tt * tt, r = .66 * e.s; if (p2 < r * r) { const th = tt - Math.sqrt(r * r - p2); if (th < bt && th >= from) { bt = th; best = e; } } }
    if (!best) break; hit = true; ex = ox + dx * g.s.range; ez = oz + dz * g.s.range; hurtBug(best, dmg, dx, dz, false, true); dmg *= .65; if (boomShot) { blast(ox + dx * bt, oz + dz * bt, 2.3, g.s.pow * 2.5); left = 0; } from = bt + .7; if (left <= 0) { ex = ox + dx * bt; ez = oz + dz * bt; } }       // each bug it passes through takes a third off the shell
  if (hit && ST.hitstop) g.freeze = Math.max(g.freeze, .03);
  TR.push({ x0: ox, y0: oy, z0: oz, x1: ex, y1: .55, z1: ez, t: 0, dur: Math.max(.04, Math.hypot(ex - ox, ez - oz) / 115), hv: 1 });
  g.flash = 1; g.fRot = rand(0, TAU); g.spinT += TAU / 3; g.lastShot = 0; g.rec.v += 7; g.kick.v += 27; g.roll.v += rand(-2.2, 2.2); g.bob.v -= 1.4; g.trauma = Math.min(1, g.trauma + .09); g.vx -= dx * 1.25; g.vz -= dz * 1.25; g.ck.x = -dx * .42; g.ck.z = -dz * .42; sfx.shot();
  for (let i = 0; i < 4; i++) part(1, ox + dx * .4, oy, oz + dz * .4, dx * rand(2, 7) + rand(-1, 1), rand(.2, 1.4), dz * rand(2, 7) + rand(-1, 1), rand(.5, .9), .22, .55, .5, .44, .3, 0, 3, 1.3);
  for (const q of [-1, 1]) { part(2, ox, oy, oz, rx * q * rand(7, 11), rand(0, 1.5), rz * q * rand(7, 11), .09, .09, 1, .75, .35, 1, 0, 6, 0, .07); part(1, ox + rx * q * .3, oy, oz + rz * q * .3, rx * q * rand(2, 4), rand(.3, 1), rz * q * rand(2, 4), rand(.4, .7), .18, .5, .46, .4, .25, 0, 3, 1); }      // the muzzle brake vents to both sides
  debris(MESH.cyl, ox - dx * 1.1, oy + .05, oz - dz * 1.1, .1, .3, .1, BRASS, -.9, -rx * rand(3.5, 6) - dx * 1.5, rand(4.5, 7), -rz * rand(3.5, 6) - dz * 1.5, 3.5); }

function update(dt) { const g = G; g.t += dt;
  let ix = 0, iz = 0; if (!g.demo && !g.dead) { if (stick) { ix = stick.dx; iz = stick.dy; } if (keys.w || keys.arrowup) iz -= 1; if (keys.s || keys.arrowdown) iz += 1; if (keys.a || keys.arrowleft) ix -= 1; if (keys.d || keys.arrowright) ix += 1; const l = Math.hypot(ix, iz); if (l > 1) { ix /= l; iz /= l; } }
  // dash: a short windup, a thruster burst, then a skid
  let burst = false; if (g.dash) { const d = g.dash; d.t += dt; if (d.t < DASH.wind + d.B) { burst = d.t >= DASH.wind; const v = burst ? DASH.v : DASH.v * .3; g.vx = d.dx * v; g.vz = d.dz * v; } else { if (!d.skidded) { d.skidded = true; sfx.skid(); dust(g.x, g.z, 8, 4, .5); if (g.s.chain > 1) { blast(g.x, g.z, 4.6, g.s.pow * 6); DL.push({ x: g.x, z: g.z, sx: 1, sz: 1, rot: 0, kind: 1, r: 1, g: .6, b: .2, a: .9, t: 0, life: .3, seed: 0, grow: 14 }); g.crouch.v += 6; g.trauma = Math.min(1, g.trauma + .35); } } if (d.t > DASH.wind + d.B + DASH.rec) g.dash = null; } }
  if (!g.dash || g.dash.skidded) { const k = 1 - Math.exp(-dt * (g.dash ? 8 : 13)), v = g.s.speed; g.vx += (ix * v - g.vx) * k; g.vz += (iz * v - g.vz) * k; }
  if (g.dead) { g.vx *= Math.exp(-dt * 6); g.vz *= Math.exp(-dt * 6); }
  const ax = (g.vx - g.pvx) / dt, az = (g.vz - g.pvz) / dt; g.pvx = g.vx; g.pvz = g.vz; g.x += g.vx * dt; g.z += g.vz * dt; pushOut(g, 1); const sp = Math.hypot(g.vx, g.vz);
  if (sp > .8) g.head += clamp(angDiff(g.head, Math.atan2(g.vx, g.vz)), -dt * (g.dash ? 30 : 8.5), dt * (g.dash ? 30 : 8.5));
  g.jet += ((burst ? 1 : 0) - g.jet) * Math.min(1, dt * (burst ? 40 : 7));
  if (burst) { const d = g.dash, bx = g.x - d.dx * 1.2, bz = g.z - d.dz * 1.2;
    for (let i = 0; i < 3; i++) part(2, bx + rand(-.4, .4), rand(1.7, 2.1), bz + rand(-.4, .4), -d.dx * rand(8, 18) + rand(-2, 2), rand(-1, 2), -d.dz * rand(8, 18) + rand(-2, 2), rand(.12, .28), .09, 1, rand(.5, .8), .2, 1, 0, 3, 0, .05);
    part(1, bx, 1.6, bz, -d.dx * 3, 1, -d.dz * 3, .7, .5, .25, .23, .2, .3, 0, 2, 1.6);
    if (g.s.burn) { const lf = g.fires[g.fires.length - 1]; if (!lf || Math.hypot(lf.x - g.x, lf.z - g.z) > .9) g.fires.push({ x: g.x - d.dx * .6, z: g.z - d.dz * .6, t: g.s.burn }); }
    for (const e of g.en) { if (e.dead || d.hit.has(e)) continue; if (Math.hypot(e.x - g.x - d.dx * .9, e.z - g.z - d.dz * .9) < 1.9 + .4 * e.s) { d.hit.add(e); const ox = e.x - g.x, oz = e.z - g.z, side = Math.sign(ox * d.dz - oz * d.dx) || 1; hurtBug(e, g.s.ramDmg, d.dx * .85 + d.dz * side * .5, d.dz * .85 - d.dx * side * .5, true); g.trauma = Math.min(1, g.trauma + .3); if (ST.hitstop) g.freeze = Math.max(g.freeze, .055); sfx.ram(); } } }
  if (g.dash && sp > 8) for (const f of g.feet) { sparks(f.x, .08, f.z, -g.vx, -g.vz, 1, 1, .6, .2, 7); if (Math.random() < .5) part(1, f.x, .15, f.z, rand(-1, 1), rand(.4, 1.2), rand(-1, 1), .6, .3, .2, .19, .17, .28, 0, 2, 1.4); if (Math.random() < .6) mark(f.x, f.z, .13, .6, Math.atan2(g.vx, g.vz), 2, 0, 0, 0, .3, 7); }
  // aim and fire: the torso turns to the target on its own while the legs go where the thumb says
  g.fireTick -= dt; const tickNow = g.fireTick <= 0; if (tickNow) g.fireTick = .2;
  let near = null, nd = g.s.range * g.s.range; if (!g.dead && !g.demo) for (const e of g.en) { if (e.dead) continue; const d2 = (e.x - g.x) ** 2 + (e.z - g.z) ** 2 - (e.state === 'tell' || e.state === 'lunge' ? 12 : 0); if (d2 < nd) { nd = d2; near = e; } }
  if (g.tgt && (g.tgt.dead || (g.tgt.x - g.x) ** 2 + (g.tgt.z - g.z) ** 2 > g.s.range * g.s.range)) g.tgt = null;
  if (near && (!g.tgt || nd < ((g.tgt.x - g.x) ** 2 + (g.tgt.z - g.z) ** 2) * .55 - 2)) g.tgt = near; if (!near) g.tgt = null;
  const t = g.tgt; let aimT = g.aim, dT = 8; if (burst) aimT = Math.atan2(g.dash.dx, g.dash.dz); else if (t) { aimT = Math.atan2(t.x + t.vx * .05 - g.x, t.z + t.vz * .05 - g.z); dT = Math.hypot(t.x - g.x, t.z - g.z); } else if (g.demo) aimT = .55 + Math.sin(g.t * .5) * .5; else if (sp > 1) aimT = g.head;
  const da = angDiff(g.aim, aimT); g.aimV += (da * 230 - g.aimV * 30) * dt; g.aimV = clamp(g.aimV, -17, 17); g.aim += g.aimV * dt;
  g.lampV += (angDiff(g.lamp, g.aim) * 30 - g.lampV * 11) * dt; g.lampV = clamp(g.lampV, -3.6, 3.6); g.lamp += g.lampV * dt;      // the lamp is on its own swivel: it follows the gun, but a quick snap of the torso does not throw the light around
  spring(g.pitch, t ? Math.atan2(1.7, dT + .5) : .12, 120, 18, dt);
  g.spin += (g.spinT - g.spin) * Math.min(1, dt * 16); g.lastShot += dt; { const kd = Math.exp(-dt * 9); g.ck.x *= kd; g.ck.z *= kd; }
  if (t && !burst && Math.abs(da) < .3) { g.fireT -= dt; while (g.fireT <= 0 && g.tgt) { g.fireT += 1 / g.s.rate; shoot(g); if (g.tgt.dead) g.tgt = null; } } else g.fireT = Math.min(g.fireT, .1);
  if (!g.dead && !g.won && !g.demo) {
    if (g.s.mortar) { g.mortT -= dt; if (g.mortT <= 0) { const live = g.en.filter(e => !e.dead && (e.x - g.x) ** 2 + (e.z - g.z) ** 2 < 225), used = []; g.mortT = live.length ? 2.6 : .3;
      for (let k = 0; k < g.s.mortar && live.length; k++) { let best = null, bs = 0; for (const e of live) { if (used.some(u => Math.hypot(u.x - e.x, u.z - e.z) < 3.4)) continue; let n = e.big ? 3 : 1; for (const o of live) if (o !== e && Math.hypot(o.x - e.x, o.z - e.z) < 3) n++; if (n > bs) { bs = n; best = e; } }
        if (!best) break; used.push(best); g.shells.push({ x0: g.x + Math.cos(g.aim) * .84, y0: g.py + 2, z0: g.z - Math.sin(g.aim) * .84, x1: best.x + best.vx * .5, z1: best.z + best.vz * .5, t: -k * .12, dur: .8 }); }
      if (used.length) { sfx.mortar(); g.rec.v -= 3; g.bob.v -= 2; g.crouch.v += 2.5; g.trauma = Math.min(1, g.trauma + .08); const mx = g.x + Math.cos(g.aim) * .84, mz = g.z - Math.sin(g.aim) * .84; part(0, mx, g.py + 2.3, mz, 0, 1, 0, .1, 1.6, 1, .7, .3, .9, 0, 0, 3); for (let i = 0; i < 5; i++) part(1, mx, g.py + 2.3, mz, rand(-1.5, 1.5), rand(1, 3), rand(-1.5, 1.5), rand(.6, 1), .25, .3, .28, .26, .35, 0, 2, 1); } } }
    if (g.s.coil) { g.coilT -= dt; if (g.coilT <= 0) { const pts = [[g.x, g.py + 1.9, g.z - .3]], hit = []; let cx = g.x, cz = g.z, range = 8;
      while (hit.length < g.s.coil) { let best = null, bd = range; for (const e of g.en) { if (e.dead || hit.includes(e)) continue; const d = Math.hypot(e.x - cx, e.z - cz); if (d < bd) { bd = d; best = e; } } if (!best) break; hit.push(best); pts.push([best.x, .6 * best.s, best.z]); cx = best.x; cz = best.z; range = 5.5; }
      if (hit.length) { g.coilT = 1.05; g.bolts.push({ pts, t: .16 }); g.pulse = { x: pts[1][0], z: pts[1][2], c: [.4, .6, 1], t: .8 }; for (const e of hit) hurtBug(e, g.s.pow * 2.4, 0, 0); sfx.zap(); } else g.coilT = .15; } }
    while (g.drones.length < g.s.drone) g.drones.push({ x: g.x, y: 3, z: g.z, ft: rand(.1, .5), fl: 0, a: 0 });
    g.drones.forEach((d, i) => { const an = g.t * 1.5 + i * TAU / g.drones.length, k = 1 - Math.exp(-dt * 6); d.x += (g.x + Math.sin(an) * 2.8 - d.x) * k; d.z += (g.z + Math.cos(an) * 2.8 - d.z) * k; d.y = 3.1 + Math.sin(g.t * 3 + i * 2) * .15; d.ft -= dt; d.fl = Math.max(0, d.fl - dt * 12);
      if (d.ft <= 0) { let best = null, bd = 8.5; for (const e of g.en) { if (e.dead) continue; const q = Math.hypot(e.x - d.x, e.z - d.z); if (q < bd) { bd = q; best = e; } } if (best) { d.ft = .33; d.fl = 1; d.a = Math.atan2(best.x - d.x, best.z - d.z); const l = bd || 1; TR.push({ x0: d.x, y0: d.y - .1, z0: d.z, x1: best.x, y1: .55, z1: best.z, t: 0, dur: Math.max(.03, bd / 90), c: 1 }); hurtBug(best, g.s.pow, (best.x - d.x) / l, (best.z - d.z) / l); sfx.pew(); } else d.ft = .1; } });
    if (g.s.reaper) { g.reapA += dt * 4.2; for (let b = 0; b < 2; b++) { const a = g.reapA + b * Math.PI, ax = Math.sin(a), az = Math.cos(a); for (const e of g.en) { if (e.dead || e.cutT > 0) continue; const ex = e.x - g.x, ez = e.z - g.z, al = ex * ax + ez * az, pr = Math.abs(ex * az - ez * ax); if (al > 1.2 && al < 3.5 + .4 * e.s && pr < .5 + .45 * e.s) { e.cutT = .3; e.kx += az * 4; e.kz -= ax * 4; hurtBug(e, g.s.pow * 3, az, -ax); sparks(e.x, .7, e.z, az, -ax, 4, .9, 1, .5, 9); } } } }
    if (g.s.graft) { g.graftT -= dt; if (g.graftT <= 0) { let a = null, b = null, ad = 196, bd = 196; for (const e of g.en) { if (e.dead) continue; const d2 = (e.x - g.x) ** 2 + (e.z - g.z) ** 2; if (d2 < ad) { b = a; bd = ad; a = e; ad = d2; } else if (d2 < bd) { b = e; bd = d2; } } const tg = b || a;
      if (tg) { g.graftT = .45; const P = g.graftP, l = Math.hypot(tg.x - P[0], tg.z - P[2]) || 1; TR.push({ x0: P[0], y0: P[1], z0: P[2], x1: tg.x, y1: .55, z1: tg.z, t: 0, dur: Math.max(.04, l / 60), c: 2 }); hurtBug(tg, g.s.pow * 1.5, (tg.x - P[0]) / l, (tg.z - P[2]) / l); blast(tg.x, tg.z, 1.7, g.s.pow * 1.2, [.7, .9, .15]); sfx.spit(); } else g.graftT = .15; } }
    if (g.s.sear && tickNow) for (const e of g.en) if (!e.dead && inBeam(g, e.x, e.z) && (e.x - g.x) ** 2 + (e.z - g.z) ** 2 < 200) { hurtBug(e, g.s.pow * .5 * g.s.sear, 0, 0); e.burnT = .3; }
  }
  for (const e of g.allies) updAlly(e, dt); for (let i = g.allies.length - 1; i >= 0; i--) if (g.allies[i].dead) g.allies.splice(i, 1); if (g.dead || g.won) for (const e of g.allies) e.life = Math.min(e.life, .3);
  let stg = 0; for (let i = 1; i < 7; i++) { const on = g.parts >= GROW[i]; if (on) stg = i; spring(g.gr[i], on ? 1 : 0, 70, 9, dt); } if (stg > g.stage) { g.stage = stg; if (stg === 1) cap('The parts are taking hold.', 3.5); else if (stg === 4) cap('The machine is growing.', 3.5); else if (stg === 6) cap('There is not much machine left.', 3.5); }
  g.stompFx = Math.max(0, g.stompFx - dt * 5);
  for (let i = g.shells.length - 1; i >= 0; i--) { const sh = g.shells[i]; sh.t += dt; if (sh.t > 0 && Math.random() < dt * 40) { const u = sh.t / sh.dur; part(1, lerp(sh.x0, sh.x1, u), lerp(sh.y0, .3, u) + Math.sin(u * Math.PI) * 6, lerp(sh.z0, sh.z1, u), 0, .3, 0, .5, .2, .3, .28, .25, .35, 0, 1, .6); } if (sh.t >= sh.dur) { g.shells.splice(i, 1); blast(sh.x1, sh.z1, 3.1, g.s.pow * 5); } }
  for (let i = g.globs.length - 1; i >= 0; i--) { const b = g.globs[i]; b.t += dt; if (b.t >= b.dur) { g.globs.splice(i, 1); g.pools.push({ x: b.x1, z: b.z1, t: 3.6, seed: rand(0, 9) }); sfx.splat(); for (let k = 0; k < 8; k++) { const a = rand(0, TAU), v = rand(1, 4); part(0, b.x1, .3, b.z1, Math.sin(a) * v, rand(1, 4), Math.cos(a) * v, rand(.25, .45), rand(.3, .5), .7, .9, .15, .7, 10, 1, -.5); } if (Math.hypot(g.x - b.x1, g.z - b.z1) < 2) hurtPlayer(10, 0, 0); } }
  for (let i = g.pools.length - 1; i >= 0; i--) { const q = g.pools[i]; q.t -= dt; if (q.t <= 0) { g.pools.splice(i, 1); continue; } if (q.t > .4 && Math.hypot(g.x - q.x, g.z - q.z) < 1.8) hurtPlayer(6, 0, 0); if (Math.random() < dt * 5) part(0, q.x + rand(-1.2, 1.2), .15, q.z + rand(-1.2, 1.2), 0, rand(.8, 1.6), 0, .5, .22, .7, .9, .15, .5, 0, 1, -.2); }
  for (let i = g.bolts.length - 1; i >= 0; i--) { g.bolts[i].t -= dt; if (g.bolts[i].t <= 0) g.bolts.splice(i, 1); }
  g.shieldT -= dt;
  if (!g.demo && !g.dead && !g.won && g.t >= RUN) { g.won = .001; g.inv = 9; cap('Relief has arrived.'); sfx.win(); for (const e of g.en) { const ex = e.x - g.x, ez = e.z - g.z, d = Math.hypot(ex, ez) || 1; hurtBug(e, 1e9, ex / d, ez / d); } g.pulse = { x: g.x, z: g.z, c: [1, .9, .7], t: 1 }; }
  if (g.won) { g.won += dt; if (g.won > 2.4 && state === 'play') endGame(true); }
  if (whineG) { whineG.gain.value = state === 'play' ? g.heat * .018 : 0; whine.frequency.value = 48 + g.heat * 26; }
  // the body: planted feet, and springs for everything that should feel like mass
  gait(g, dt, burst);
  spring(g.lx, clamp(g.vx * .011 + ax * .0032, -.5, .5), 110, 13, dt); spring(g.lz, clamp(g.vz * .011 + az * .0032, -.5, .5), 110, 13, dt);
  spring(g.bob, 0, 190, 15, dt); spring(g.roll, 0, 150, 12, dt); spring(g.rec, 0, 200, 16, dt); spring(g.kick, 0, 230, 19, dt); spring(g.crouch, 0, 130, 13, dt); spring(g.fov, 0, 85, 11, dt); spring(g.ram, burst ? 1 : 0, 300, 22, dt);
  spring(g.antx, -ax * .004, 60, 5, dt); spring(g.antz, -az * .004, 60, 5, dt);
  g.flash = Math.max(0, g.flash - dt * 13); g.heat += ((g.lastShot < .5 && !g.dead ? 1 : 0) - g.heat) * Math.min(1, dt * 7); g.dcd -= dt; if (g.dcd <= 0 && g.dcd + dt > 0 && !g.demo) sfx.ready(); g.inv -= dt; g.hurtT = Math.max(0, g.hurtT - dt * 1.8); g.sinceHit += dt; g.boom = Math.max(0, g.boom - dt * 1.4);
  // heat in the barrels, arcs after a hit, weld sparks after a fitting, and what a damaged hull does
  const firing = g.heat > .5; g.hot = clamp(g.hot + (firing ? dt * .45 : -dt * .3), 0, 1); g.dip = Math.max(0, g.dip - dt * 4.5); g.arcT -= dt; g.weldT -= dt; g.puffCd -= dt;
  if (!g.dead && !g.demo) { const mxp = g.x + g.muz[0], mzp = g.z + g.muz[2], hk = g.hp / g.s.maxhp, ex = g.x - Math.sin(g.aim) * .8, ez = g.z - Math.cos(g.aim) * .8;
    if (!firing && g.hot > .15 && Math.random() < dt * g.hot * 26) part(1, mxp + rand(-.1, .1), g.muz[1], mzp + rand(-.1, .1), rand(-.2, .2), rand(.8, 1.6), rand(-.2, .2), rand(.6, 1), .12, .5, .48, .45, .3 * g.hot, 0, .8, .5);      // the barrels smoke as they cool
    if (g.arcT > 0 && Math.random() < dt * 45) part(2, g.x + rand(-.8, .8), g.py + rand(.4, 1.6), g.z + rand(-.8, .8), rand(-6, 6), rand(-2, 6), rand(-6, 6), rand(.06, .14), .05, .6, .8, 1, 1, 0, 2, 0, .04);
    if (g.weldT > 0 && Math.random() < dt * 60) part(2, g.x + rand(-.9, .9), g.py + rand(.3, 1.7), g.z + rand(-.9, .9), rand(-4, 4), rand(1, 6), rand(-4, 4), rand(.15, .35), .045, 1, .9, .6, 1, 20, 1.5, 0, .035);
    if (hk < .5 && Math.random() < dt * (1 - hk) * 14) part(1, ex + rand(-.3, .3), g.py + 1.5, ez + rand(-.3, .3), rand(-.4, .4), rand(1.4, 2.6), rand(-.4, .4), rand(.9, 1.5), .22, .07, .07, .075, .5, 0, .7, .8);
    if (hk < .3 && Math.random() < dt * 5) sparks(g.x + rand(-.6, .6), g.py + rand(.6, 1.4), g.z + rand(-.6, .6), rand(-1, 1), rand(-1, 1), 3, .7, .85, 1, 7);
    if (hk < .16 && Math.random() < dt * 22) part(0, ex + rand(-.3, .3), g.py + 1.2, ez + rand(-.3, .3), rand(-.3, .3), rand(1.6, 3), rand(-.3, .3), rand(.3, .5), rand(.3, .5), 1, rand(.4, .6), .1, .8, -1, .5, -.6);
    if (!g.dash && g.puffCd <= 0 && Math.hypot(ax, az) > 105) { g.puffCd = .35; g.jet = Math.max(g.jet, .4); dust(g.x, g.z, 4, 3, .35); noise(.12, .07, 1400, 'bandpass', 0, -700); } }      // a short correcting burst from the thrusters on a hard change of direction
  g.aimLean += ((g.tgt && !g.dead ? 1 : 0) - g.aimLean) * Math.min(1, dt * 2.5);
  g.smokeT -= dt; if (g.smokeT <= 0) { g.smokeT = g.dead ? .05 : .16; const c = Math.cos(g.aim), s = Math.sin(g.aim), k = Math.random() < .5 ? .4 : -.4;
    if (g.dead) { part(0, g.x + rand(-.4, .4), rand(1.2, 1.8), g.z + rand(-.4, .4), rand(-.5, .5), rand(2, 4), rand(-.5, .5), rand(.4, .8), rand(.5, 1), 1, rand(.35, .6), .1, .9, -2, 1, -.5); part(1, g.x, 2.2, g.z, rand(-.6, .6), rand(1.5, 3), rand(-.6, .6), 1.6, .6, .08, .08, .08, .5, 0, .6, .9); }
    else part(1, g.x + k * c - .9 * s, g.py + 1.75, g.z - k * s - .9 * c, rand(-.3, .3), rand(1, 1.8), rand(-.3, .3), 1.1, .16, .16, .16, .17, .22, 0, .8, .5); }
  if (g.dead) { g.dead += dt; if (g.dead > 1.9 && state === 'play') endGame(false); }
  // bugs
  tokens = 0; for (const e of g.en) if (!e.spit && !e.big && (e.state === 'tell' || e.state === 'lunge')) tokens++;
  for (const e of g.en) updBug(e, dt);
  for (let i = 0; i < g.en.length; i++) { const a = g.en[i]; if (a.dead) continue;
    for (let j = i + 1; j < g.en.length; j++) { const b = g.en[j]; if (b.dead) continue; const dx = b.x - a.x, dz = b.z - a.z, d2 = dx * dx + dz * dz, m = .85 * (a.s + b.s); if (d2 < m * m && d2 > 1e-6) { const d = Math.sqrt(d2), p = (m - d) * .5 / d; a.x -= dx * p; a.z -= dz * p; b.x += dx * p; b.z += dz * p; } }
    if (a.state !== 'lunge') { const dx = a.x - g.x, dz = a.z - g.z, d = Math.hypot(dx, dz), m = 1.45 + .65 * a.s; if (d < m && d > 1e-4) { a.x = g.x + dx / d * m; a.z = g.z + dz / d * m; } } }      // the mech shoulders them aside
  for (let i = g.en.length - 1; i >= 0; i--) if (g.en[i].dead) g.en.splice(i, 1);
  spawnLogic(dt);
  // fires burn whether or not anything is looking at them, but only the near ones are worth the particles
  const cx = Math.floor(g.x / CELL), cz = Math.floor(g.z / CELL); for (let i = cx - 2; i <= cx + 2; i++) for (let j = cz - 2; j <= cz + 2; j++) for (const p of getCell(i, j)) if (p.k === 'fire') { if (Math.random() < dt * 34) part(0, p.x + rand(-.22, .22), 1.05, p.z + rand(-.22, .22), rand(-.3, .3), rand(1.6, 3.2), rand(-.3, .3), rand(.35, .7), rand(.45, .75), 1, rand(.38, .6), .08, .8, -1.5, .5, -.7); if (Math.random() < dt * 2.5) part(2, p.x, 1.3, p.z, rand(-1, 1), rand(3, 5), rand(-1, 1), rand(.5, 1), .035, 1, .6, .2, 1, 3, .5, 0, .03); }
  // flying things
  for (let i = PT.length - 1; i >= 0; i--) { const p = PT[i]; p.t += dt; if (p.t >= p.life) { PT[i] = PT[PT.length - 1]; PT.pop(); continue; } const kd = Math.exp(-p.drag * dt); p.vx *= kd; p.vy = p.vy * kd - p.grav * dt; p.vz *= kd; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.y < .03 && p.grav > 0) { p.y = .03; p.vy *= -.35; p.vx *= .6; p.vz *= .6; } }
  for (let i = DB.length - 1; i >= 0; i--) { const b = DB[i]; b.t += dt; if (b.t >= b.life) { DB.splice(i, 1); continue; } b.vy -= 26 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; b.ax += b.wx * dt; b.ay += b.wy * dt; if (b.y < b.rad) { b.y = b.rad; if (b.vy < -2) { b.vy *= -.38; b.vx *= .6; b.vz *= .6; b.wx *= .5; b.wy *= .5; } else { b.vy = 0; b.vx *= Math.exp(-dt * 9); b.vz *= Math.exp(-dt * 9); b.wx *= Math.exp(-dt * 12); b.wy *= Math.exp(-dt * 12); } } }
  for (let i = DL.length - 1; i >= 0; i--) { const d = DL[i]; d.t += dt; if (d.grow) { d.sx += d.grow * dt; d.sz += d.grow * dt; } if (d.t >= d.life) DL.splice(i, 1); }
  for (let i = TR.length - 1; i >= 0; i--) { const r = TR[i]; r.t += dt; if (r.t >= r.dur && !r.done) { r.done = true; if (r.y1 < 1) { sparks(r.x1, r.y1, r.z1, r.x0 - r.x1, r.z0 - r.z1, r.hv ? 7 : 2, 1, .8, .4, r.hv ? 9 : 5); if (r.hv) dust(r.x1, r.z1, 3, 2.5, .3); } } if (r.t >= r.dur + (r.hv ? .13 : 0)) TR.splice(i, 1); }
  if (g.cap) { g.cap.t -= dt; if (g.cap.t <= 0) g.cap = null; }
  for (let i = g.cues.length - 1; i >= 0; i--) { g.cues[i].t -= dt; if (g.cues[i].t <= 0) g.cues.splice(i, 1); }
  // drops, fire on the ground, delayed blasts
  for (let i = g.drops.length - 1; i >= 0; i--) { const d = g.drops[i]; d.t += dt; const dx = g.x - d.x, dz = g.z - d.z, l = Math.hypot(dx, dz) || 1; if (!g.dead && l < g.s.magnet && d.t > .35) { const v = 16 * (1 - l / (g.s.magnet + 2)) + 4; d.x += dx / l * v * dt; d.z += dz / l * v * dt; }
    if (!g.dead && l < 1.3 && d.t > .35) { if (d.k === 'item') equip(d.id); else { g.hp = Math.min(g.s.maxhp, g.hp + 15); sfx.repair(); g.itemFx = .6; g.itemCol = [.3, 1, .5]; } g.drops.splice(i, 1); } else if (d.t > 45) g.drops.splice(i, 1); }
  const tick = tickNow;
  for (let i = g.fires.length - 1; i >= 0; i--) { const f = g.fires[i]; f.t -= dt; if (f.t <= 0) { g.fires.splice(i, 1); continue; } if (Math.random() < dt * 26) part(0, f.x + rand(-.4, .4), .2, f.z + rand(-.4, .4), rand(-.3, .3), rand(1.5, 3), rand(-.3, .3), rand(.3, .55), rand(.4, .7) * Math.min(1, f.t), 1, rand(.4, .6), .1, .8, -1, .5, -.7);
    if (tick) for (const e of g.en) if (!e.dead && Math.hypot(e.x - f.x, e.z - f.z) < 1.25) { hurtBug(e, g.s.pow * .9, 0, 0); e.burnT = .3; } }
  for (let i = g.blasts.length - 1; i >= 0; i--) { const b = g.blasts[i]; b.t -= dt; if (b.t <= 0) { g.blasts.splice(i, 1); doBlast(b); } }
  if (g.pulse) { g.pulse.t -= dt * 5; if (g.pulse.t <= 0) g.pulse = null; } g.itemFx = Math.max(0, g.itemFx - dt * 1.6);
}
/* camera and shake run on real time, so they stay alive through a hit-stop */
function camUpdate(dt) { const g = G; g.trauma = Math.max(0, g.trauma - dt * 1.4); const k = 1 - Math.exp(-dt * 7.5), tx = g.x + clamp(g.vx, -9, 9) * .16 + Math.sin(g.aim) * g.aimLean * 1.1, tz = g.z + clamp(g.vz, -9, 9) * .16 + Math.cos(g.aim) * g.aimLean * 1.1; g.cam.x += (tx - g.cam.x) * k; g.cam.z += (tz - g.cam.z) * k; g.cam.d += ((g.demo ? .5 : 1) - g.cam.d) * (1 - Math.exp(-dt * 3)); }

/* ---------- drawing ---------- */
const _H = [0, 0, 0], _K = [0, 0, 0], _A = [0, 0, 0], _B = [0, 0, 0], _P = [0, 0, 0], _F = [0, 0, 0];
function W0() { push(); M4.ident(STK[sp]); }
function xfd(x, y, z, o) { const m = STK[sp]; o[0] = m[0] * x + m[4] * y + m[8] * z; o[1] = m[1] * x + m[5] * y + m[9] * z; o[2] = m[2] * x + m[6] * y + m[10] * z; return o; }
function box(x, y, z, sx, sy, sz, col, e) { push(); T(x, y, z); draw(MESH.cube, sx, sy, sz, col, e); pop(); }
function fitK(g, id) { if (!g.lv[id]) return 0; const u = clamp((g.t - (g.fitT[id] || 0)) / .45, 0, 1), c = 1.70158; return Math.max(.001, 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2)); }      // a new fitting pops out and settles
function at(x, y, z, k) { push(); T(x, y, z); SCL(k); T(-x, -y, -z); }
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
function drawMech(g) {
  const hx = Math.sin(g.head), hz = Math.cos(g.head), rx = hz, rz = -hx, sp = Math.hypot(g.vx, g.vz), wk = clamp(sp / 6.4, 0, 1), burst = g.ram.x;
  let py = HIP + g.bob.x - Math.max(-.1, g.crouch.x) * .32 + Math.sin(g.t * 13) * .005 - g.heat * .07;      // it sits into the recoil while the gun runs
  for (let i = 0; i < 2; i++) { const f = g.feet[i], side = i ? -1 : 1, dh = Math.hypot(f.x - g.x - rx * side * HIPW, f.z - g.z - rz * side * HIPW); py = Math.min(py, Math.sqrt(Math.max(.5, REACH * REACH - dh * dh)) + f.y * .5 + .2); }
  g.py = py; const sway = Math.sin(g.phase * TAU) * .07 * wk, twist = Math.sin(g.phase * TAU) * .09 * wk;
  const G1 = clamp(g.gr[1].x, 0, 1.3), G2 = clamp(g.gr[2].x, 0, 1.3), G3 = clamp(g.gr[3].x, 0, 1.3), G4 = clamp(g.gr[4].x, 0, 1.3), G5 = clamp(g.gr[5].x, 0, 1.3), G6 = clamp(g.gr[6].x, 0, 1.3);      // how far the alien parts have taken over, in six stages
  const HULL = mix3(YEL, [.36, .17, .04], Math.min(1, G6) * .6), THIGH = mix3(YEL, CHITM, Math.min(1, G6) * .8), GUARD = mix3(YEL2, CHITM, Math.min(1, G2)), TEND = fitK(g, 'stride'); let k;
  decal(g.x, g.z, 1.5, 1.5, 0, 0, 0, 0, 0, .5);
  reset(); T(g.x + rx * sway, py, g.z + rz * sway); RX(g.lz.x); RZ(-g.lx.x); RY(g.head + twist);
  // pelvis
  box(0, 0, 0, .98, .36, .66, DRK, -.6); box(0, -.2, .04, .5, .24, .5, STL, -.7); box(0, .02, .36, .6, .2, .1, YEL2);
  push(); T(0, .26, 0); draw(MESH.cyl, 1.02, .2, 1.02, STL, -.8); pop();
  // legs: the feet are where the walk put them; the knees are solved to reach
  for (let i = 0; i < 2; i++) { const f = g.feet[i], side = i ? -1 : 1; xf(side * HIPW, -.06, 0, _H); _A[0] = f.x; _A[1] = f.y + .22; _A[2] = f.z; _P[0] = -hx; _P[1] = .3; _P[2] = -hz; ik2(_H, _A, L1, L2, _P, _K);
    seg(MESH.cube, _H, _K, .36, .46, THIGH, G6 > .5 ? -.6 : 0, [rx, 0, rz]); seg(MESH.cube, _K, _A, .22, .28, STL, -.7, [rx, 0, rz]);
    if (TEND > 0) { for (const o of [-.21, .21]) { for (let q = 0; q < 3; q++) { _B[q] = _H[q] + [rx, 0, rz][q] * o; _F[q] = _K[q] + [rx, 0, rz][q] * o; } seg(MESH.cyl, _B, _F, .15 * TEND, .15 * TEND, FLESH); } for (let q = 0; q < 3; q++) { _B[q] = _K[q] - [hx, 0, hz][q] * .2; _F[q] = _A[q] - [hx, 0, hz][q] * .14; } seg(MESH.cyl, _B, _F, .16 * TEND, .16 * TEND, FLESH); if (g.stompFx > 0 && !f.sw) glow(f.x, .25, f.z, 1.6 * g.stompFx, 1, .6, .2, .5 * g.stompFx); }       // titan tendons: cords of muscle down each leg
    for (let q = 0; q < 3; q++) { _B[q] = lerp(_H[q], _K[q], .3) - [hx, 0, hz][q] * .26; _F[q] = lerp(_K[q], _A[q], .5) - [hx, 0, hz][q] * .08; } seg(MESH.cyl, _B, _F, .09, .09, STL, -.9);     // the piston behind the knee
    for (let q = 0; q < 3; q++) { _B[q] = lerp(_K[q], _A[q], .25) + [hx, 0, hz][q] * .17; _F[q] = lerp(_K[q], _A[q], .8) + [hx, 0, hz][q] * .17; } seg(MESH.cube, _B, _F, .3 + .06 * G2, .08 + .04 * G2, GUARD, G2 > .5 ? -.6 : 0, [rx, 0, rz]);      // shin guard, chitin once the parts take hold
    W0(); T(_K[0], _K[1], _K[2]); RY(g.head); RZ(Math.PI / 2); draw(MESH.cyl, .36, .5, .36, DRK, -.7); pop();
    if (G2 > .02) { W0(); T(_K[0], _K[1], _K[2]); RY(g.head); RX(-1.0); SCL(G2); T(0, .34, 0); draw(MESH.cone, .22, .66, .22, BONE); pop(); }       // knee spur
    W0(); T(_H[0], _H[1], _H[2]); RY(g.head); RZ(Math.PI / 2); draw(MESH.cyl, .46, .34, .46, DRK, -.7); pop();
    W0(); T(f.x, f.y + .1, f.z); RY(f.a); RX(f.sw ? Math.sin((g.phase + i * .5) % 1 / SWING * Math.PI * 2) * .35 : 0); box(0, 0, .1, .5, .2, .9, DRK, -.6); box(0, .12, -.05, .34, .16, .4, STL, -.7); box(.14, -.02, .6, .17, .16, .32, YEL2); box(-.14, -.02, .6, .17, .16, .32, YEL2); box(0, -.02, -.42, .2, .16, .22, YEL2); if (G4 > .02) for (const o of [-.14, .14]) { push(); T(o, .0, .74); RX(Math.PI / 2 + .3); SCL(G4); T(0, .18, 0); draw(MESH.cone, .16, .42, .16, BONE); pop(); } if (TEND > 0) box(0, .2, .1, .46 * TEND, .1, .6 * TEND, BONE); pop();
    decal(f.x, f.z, .5, .68, f.a, 0, 0, 0, 0, .6 * (1 - Math.min(1, f.y * 2.2))); }
  if (g.dead) { glow(g.x, py + .5, g.z, 2.2 + Math.sin(g.t * 30) * .3, 1, .5, .12, .5); return; }
  // torso: turns to the target on its own ring, pitches with recoil, rolls when a foot lands
  T(0, .36, 0); RY(g.aim - g.head - twist); RX(-g.rec.x * .3 + burst * .22); RZ(g.roll.x * .04 + clamp(g.aimV, -17, 17) * .007);      // shudders with the gun, and leans into its own turns
  box(0, .56, .04, 1.32, .96, 1.12, HULL); box(0, .16, .5, 1.0, .3, .34, DRK, -.6);                         // cab and chin
  box(-.08, .78, .61, .9, .17, .05, [.9, .5, .12], .55); box(-.08, .92, .65, 1.04, .1, .2, YEL2); box(-.08, .64, .63, 1.04, .08, .1, DRK); box(.3, .4, .62, .5, .3, .06, YEL2); box(-.36, .42, .62, .3, .22, .05, DRK);          // a visor slit under a hood, patched plating below
  box(0, 1.08, -.05, .7, .1, .7, YEL2); box(.66, .56, .1, .05, .5, .7, DRK); box(-.66, .56, .1, .05, .5, .7, DRK);
  box(.44, 1.1, .3, .34, .1, .34, DRK); push(); T(.44, 1.18, .3); RY(angDiff(g.aim, g.lamp)); draw(MESH.cyl, .2, .14, .2, STL, -.8);       // the one big work lamp, bolted on off-centre, on a swivel
    push(); T(0, .12, .16); RX(Math.PI / 2 - .5); draw(MESH.cyl, .42, .3, .42, DRK, -.7); T(0, .15, 0); draw(MESH.cyl, .33, .03, .33, g.s.sear ? [1, .7, .35] : [1, .92, .75], 3); pop();
    if (g.s.sear) { box(0, .42, .16, .58, .08, .62, CHITM, -.6); box(.28, .2, .1, .06, .4, .5, CHIT, -.6); box(-.28, .2, .1, .06, .4, .5, CHIT, -.6); }
    xf(0, .08, .34, _B); glow(_B[0], _B[1], _B[2], .7, 1, .9, .7, .75); xf(0, .06, .66, g.lampP); xfd(0, -.62, 1, g.lampD); pop();
  box(0, .58, -.76, 1.08, .84, .5, DRK, -.6); box(0, .9, -1.03, .8, .12, .06, STL); box(0, .66, -1.03, .8, .12, .06, STL); box(0, .42, -1.03, .8, .12, .06, STL);                // engine and its grille
  for (const k of [-1, 1]) { push(); T(k * .4, 1.3, -.84); draw(MESH.cyl, .15, .8, .15, STL, -.8); T(0, .36, 0); draw(MESH.cyl, .19, .1, .19, RUST); pop();
    push(); T(k * .3, .34, -1.06); RX(-Math.PI / 2); draw(MESH.cyl, .34, .26, .34, STL, -.8); if (g.s.burn) { T(0, .14, 0); draw(MESH.cyl, .4, .05, .4, [.6, .2, .04], .5); T(0, -.14, 0); } if (g.jet > .03) { const L = (1.5 + Math.sin(g.t * 90 + k) * .25) * g.jet; T(0, .1 + L / 2, 0); draw(MESH.cone, .3, L, .3, [1, .55, .15], 5 * g.jet); T(0, -L * .2, 0); draw(MESH.cone, .15, L * .55, .15, [.8, .9, 1], 7 * g.jet); } pop(); }
  if (g.jet > .03) { xf(0, .34, -1.5, _B); glow(_B[0], _B[1], _B[2], 2.4 * g.jet, 1, .6, .25, .7 * g.jet); }
  xf(-.52, 1.1, -.4, _A); _B[0] = _A[0] + g.antx.x; _B[1] = _A[1] + 1.25; _B[2] = _A[2] + g.antz.x; seg(MESH.cyl, _A, _B, .035, .035, DRK); if (Math.sin(g.t * 5) > .3) glow(_B[0], _B[1], _B[2], .3, 1, .15, .1, .9);    // whip antenna with a beacon
  box(.84, .78, .02, .4, .5, .62, YEL); box(-.84, .78, .02, .4, .5, .62, YEL); box(.84, 1.05, .02, .44, .06, .66, DRK); box(-.84, 1.05, .02, .44, .06, .66, DRK);                 // shoulders
  if (g.s.shock) { const e = g.shieldT <= 0 ? 2.6 : .15; box(.86, 1.1, .02, .3, .04, .5, [.3, .6, 1], e); box(-.86, 1.1, .02, .3, .04, .5, [.3, .6, 1], e); box(0, .3, .7, .9, .3, .07, STL, -.8); box(0, .3, .74, .7, .05, .02, [.3, .6, 1], e); if (g.shieldT <= 0) decal(g.x, g.z, 2.1, 2.1, 0, 1, .3, .6, 1, .35, .012); }
  if (g.s.boom) box(-.98, .98, -.1, .26, .22, .4, [.5, .08, .04]); if (g.lv.belt) box(-.98, .34, -.2, .3, .3, .5, BRASS, -.9);
  if (g.s.mortar) { at(.86, 1.1, -.18, fitK(g, 'mortar')); push(); T(.86, 1.36, -.18); RX(-.45); draw(MESH.cyl, .34, .86, .34, DRK, -.7); T(0, .44, 0); draw(MESH.cyl, .4, .08, .4, STL, -.8); pop(); box(.86, 1.12, -.2, .5, .14, .5, YEL2); pop(); }
  if (g.s.coil) { at(0, 1.1, -.5, fitK(g, 'coil')); push(); T(0, 1.5, -.5); draw(MESH.cyl, .1, .9, .1, STL, -.8); const e = .8 + Math.max(0, 1 - (1.05 - g.coilT) * 5) * 3; for (const q of [-.3, -.18, -.06, .06, .18]) { push(); T(0, q, 0); draw(MESH.cyl, .26, .07, .26, BRASS, -.9); pop(); } T(0, .5, 0); draw(MESH.sph, .3, .3, .3, [.25, .5, 1], e); xf(0, 0, 0, _B); glow(_B[0], _B[1], _B[2], .6 + e * .15, .4, .6, 1, .35); pop(); pop(); }
  // the rest of what has been fitted
  if ((k = fitK(g, 'cool')) > 0) { at(0, .5, -.8, k); for (const q of [-1, 1]) { box(q * .6, .52, -.8, .1, .7, .1, STL, -.8); box(q * .66, .52, -.8, .03, .6, .05, [.3, .8, 1], 1.4); } pop(); }
  if ((k = fitK(g, 'weld')) > 0) { at(-.5, .2, -.9, k); push(); T(-.5, .24, -1.1); draw(MESH.cyl, .26, .44, .26, [.12, .3, .16], -.6); T(0, .24, 0); draw(MESH.cyl, .12, .08, .12, [.3, 1, .5], 1.5); pop(); pop(); }
  if ((k = fitK(g, 'ichor')) > 0) { at(0, .7, -.8, k); for (const q of [-1, 1]) { const pu = 1 + Math.sin(g.t * 4 + q) * .08; push(); T(q * .62, .74, -.82); draw(MESH.sph, .42 * pu, .5 * pu, .46 * pu, [.22, .42, .04], .45); pop(); } pop(); }
  if ((k = fitK(g, 'heart')) > 0) { const bt = Math.pow(Math.max(0, Math.sin(g.t * 6.5)), 6), pu = 1 + bt * .16; at(0, .9, -1.0, k); push(); T(0, .94, -1.14); draw(MESH.sph, .66 * pu, .7 * pu, .56 * pu, [.5, .05, .04], .22 + bt * .8); pop(); for (const q of [-1, 1]) { xf(q * .2, 1.1, -1.0, _A); xf(q * .5, 1.06, -.3, _B); seg(MESH.cyl, _A, _B, .09, .09, FLESH); } pop(); xf(0, .94, -1.34, _B); glow(_B[0], _B[1], _B[2], 1.6 + bt, 1, .2, .12, (.25 + bt * .35) * Math.min(1, k)); }      // the brood heart beats
  if (g.s.molt && !g.molted && (k = fitK(g, 'molt')) > 0) { at(0, 1.1, 0, k); box(0, 1.16, -.05, .96, .09, 1.0, BONE); box(.86, 1.13, .02, .56, .09, .74, BONE); box(-.86, 1.13, .02, .56, .09, .74, BONE); box(.7, .62, -.04, .07, .6, .8, BONE); box(-.7, .62, -.04, .07, .6, .8, BONE); pop(); }
  if ((k = fitK(g, 'graft')) > 0) { at(-.6, 1.1, -.5, k); xf(-.6, 1.1, -.5, _A); xf(-.78, 1.85, -.4, _K); xf(-.7, 1.9, .3, _F); seg(MESH.cube, _A, _K, .16, .18, CHIT2, -.5); seg(MESH.cube, _K, _F, .13, .15, CHIT, -.5); const pu = 1 + Math.max(0, 1 - (.45 - g.graftT) * 6) * .3; push(); T(-.7, 1.9, .42); draw(MESH.sph, .36 * pu, .34 * pu, .44 * pu, [.4, .55, .07], .55); pop(); xf(-.7, 1.9, .66, g.graftP); pop(); }
  if ((k = fitK(g, 'reaper')) > 0) for (let b = 0; b < 2; b++) { const a = g.reapA + b * Math.PI, ax = Math.sin(a), az = Math.cos(a); xf(b ? -.45 : .45, .95, -.75, _A); _F[0] = g.x + ax * 1.5 * k; _F[1] = 1.55; _F[2] = g.z + az * 1.5 * k; _P[0] = 0; _P[1] = 1; _P[2] = 0; ik2(_A, _F, 1.35, 1.35, _P, _K); seg(MESH.cube, _A, _K, .15, .17, FLESH); seg(MESH.cube, _K, _F, .12, .14, BONE);
    _B[0] = g.x + ax * 3.6 * k; _B[1] = .75; _B[2] = g.z + az * 3.6 * k; seg(MESH.cone, _F, _B, .55, .07, BONE, 0, [0, 1, 0]); sprite(PADD, _B[0] - az * .7, .8, _B[2] + ax * .7, .3, 0, az * .9, 0, -ax * .9, .9, .95, .8, .18); }
  // what has grown: chitin, cords, sacs, spines, ribs, and in the end a face
  if (G1 > .02) { at(.68, .5, -.1, G1); push(); T(.68, .52, -.12); RX(.12); draw(MESH.cube, .08, .56, .66, CHITM, -.6); pop(); push(); T(.7, .3, .28); RX(-.2); draw(MESH.cube, .07, .3, .34, CHIT, -.6); pop(); pop();
    at(-.2, 1.06, -.3, G1); push(); T(-.22, 1.09, -.3); RY(.3); draw(MESH.cube, .56, .07, .46, CHITM, -.6); pop(); pop(); for (const q of [-1, 1]) { xf(q * .34, 1.02, -.72, _A); xf(q * .8, 1.02, -.12, _B); seg(MESH.cyl, _A, _B, .07 * G1, .07 * G1, FLESH); } }
  if (G2 > .02) for (const q of [-1, 1]) { const pu = (1 + Math.sin(g.t * 3.3 + q * 2) * .1) * G2; push(); T(q * .3, .78, -1.06); draw(MESH.sph, .34 * pu, .36 * pu, .3 * pu, [.22, .45, .05], .45); pop(); }
  if (G3 > .02) { for (const q of [-1, 1]) { at(q * .86, 1.08, .02, G3); for (let i = 0; i < 3; i++) { push(); T(q * (.84 + i * .03), 1.12 + i * .035, .26 - i * .25); RX(-.22); RZ(-q * .16); draw(MESH.cube, .62 - i * .05, .09, .36, CHITM, -.7); pop(); } for (const z of [-.2, .22]) { push(); T(q * .98, 1.2, z); RZ(-q * .7); T(0, .2, 0); draw(MESH.cone, .15, .46, .15, BONE); pop(); } pop(); }
    xf(.5, 1.1, -.42, _A); _B[0] = _A[0] + g.antx.x * 1.4 + Math.sin(g.t * 2.1) * .12; _B[1] = _A[1] + G3; _B[2] = _A[2] + g.antz.x * 1.4 + .25; seg(MESH.cyl, _A, _B, .05, .05, FLESH); glow(_B[0], _B[1], _B[2], .28, .5, 1, .2, .7); }
  if (G4 > .02) for (let i = 0; i < 4; i++) { const z = .3 - i * .38, h = (.34 + i * .07) * G4; push(); T(-.16, 1.1, z); RX(-.45); T(0, h / 2, 0); draw(MESH.cone, .17, h, .22, BONE); pop(); }
  if (G5 > .02) { for (const q of [-1, 1]) for (const z of [.3, -.02, -.34]) { xf(q * .5, 1.06, z, _A); xf(q * .76, .62, z + .04, _K); xf(q * .62, .12, z + .1, _F); seg(MESH.cube, _A, _K, .08 * G5, .1 * G5, BONE); seg(MESH.cube, _K, _F, .07 * G5, .09 * G5, BONE); }
    const bt = 1 + Math.pow(Math.max(0, Math.sin(g.t * 4)), 4) * .12; push(); T(0, .1, .66); draw(MESH.sph, .5 * G5 * bt, .42 * G5 * bt, .4 * G5 * bt, [.3, .45, .06], .5); pop(); xf(0, .1, .9, _B); glow(_B[0], _B[1], _B[2], 1.1 * G5, .6, .9, .15, .3); }
  if (G6 > .02) { for (const q of [-1, 1]) { push(); T(q * .26, .26, .7); RY(q * (.25 + Math.abs(Math.sin(g.t * 2.4)) * .3)); RX(Math.PI / 2 + .35); SCL(G6); T(0, .28, 0); draw(MESH.cone, .15, .6, .12, BONE); pop(); }
    for (let i = 0; i < 4; i++) { push(); T(-.2 - i * .13, .98 + (i % 2) * .09, .64); draw(MESH.sph, .1 * G6, .1 * G6, .08 * G6, [.75, 1, .2], 2.5); pop(); } }
  // right arm: the rotary gun. The barrels really turn and the whole gun kicks back on a spring.
  push(); T(-.98, .62, .12); RX(g.pitch.x + Math.sin(g.phase * TAU * 2) * .035 * wk - g.kick.x * .05); T(0, 0, -clamp(g.kick.x, -.3, 1.6) * .27);
    box(0, 0, .22, .36, .42, .78, DRK, -.6); box(0, .24, .2, .2, .08, .5, YEL2); push(); T(.02, -.04, -.26); RZ(Math.PI / 2); draw(MESH.cyl, .62, .3, .62, YEL2); pop(); box(.2, .0, .0, .1, .2, .5, BRASS, -.9);
    push(); T(0, -.02, .62); RZ(g.spin); for (let q = 0; q < 3; q++) { push(); RZ(q * TAU / 3); T(0, .15, .5); RX(Math.PI / 2); draw(MESH.cyl, .17, 1.06, .17, g.hot > .05 ? mix3(STL, [1, .3, .05], g.hot) : STL, g.hot > .05 ? g.hot * 1.5 : -.9); T(0, .5, 0); draw(MESH.cyl, .22, .14, .22, DRK, -.7); pop(); }       // three heavy barrels; the cluster turns one place for each shell
      for (const z of [.1, .5]) { push(); T(0, 0, z); RX(Math.PI / 2); draw(MESH.cyl, .5, .08, .5, DRK, -.7); pop(); } pop();
    if ((k = fitK(g, 'hot')) > 0) { for (const z of [.9, 1.16]) { push(); T(0, -.02, z); RX(Math.PI / 2); draw(MESH.cyl, .56 * k, .09, .56 * k, [.5, .12, .03], .3 + g.heat * 2.2); pop(); } }       // heat collars that glow while the cannon runs
    if ((k = fitK(g, 'pierce')) > 0) { push(); T(0, -.38, .7); RX(Math.PI / 2); SCL(k); T(0, .75, 0); draw(MESH.cone, .13, 1.5, .13, BONE); pop(); }
    xf(0, -.02, 1.62, _B); g.muz[0] = _B[0] - g.x; g.muz[1] = _B[1]; g.muz[2] = _B[2] - g.z;
    if (g.flash > .05) { const f = g.flash; glow(_B[0], _B[1], _B[2], 2.6 * f + .4, 1, .8, .4, f); xfd(0, 0, 1, _F); sprite(PADD, _B[0] + _F[0] * 1.0, _B[1] + _F[1] * 1.0, _B[2] + _F[2] * 1.0, .5 * f, 0, _F[0] * 1.5, _F[1] * 1.5, _F[2] * 1.5, 1, .75, .35, f); for (const q of [-1, 1]) { xfd(q, .1, .1, _F); sprite(PADD, _B[0] + _F[0] * .6, _B[1] + _F[1] * .6, _B[2] + _F[2] * .6, .3 * f, 0, _F[0] * .8, _F[1] * .8, _F[2] * .8, 1, .7, .3, f * .9); }
      for (let q = 0; q < 3; q++) { const a = g.fRot + q * TAU / 3, cx = Math.cos(a) * .5, cy = Math.sin(a) * .5; xfd(cx, cy, .35, _F); sprite(PADD, _B[0] + _F[0] * .6, _B[1] + _F[1] * .6, _B[2] + _F[2] * .6, .2 * f, 0, _F[0] * .7, _F[1] * .7, _F[2] * .7, 1, .7, .3, f * .8); } }       // a three-pointed flash that turns from shot to shot
  pop();
  // left arm: the ram plate. It hangs at the side and punches out in front for a dash.
  const r = clamp(g.ram.x, -.2, 1.25), sw = Math.sin(g.phase * TAU) * .14 * wk;
  xf(.98, .66, 0, _A); xf(lerp(1.06, .7, r), lerp(.16, .5, r), lerp(.12, .62, r) + sw, _K); xf(lerp(1.08, .05, r), lerp(.0, .52, r), lerp(.5, 1.28, r) + sw, _F);
  seg(MESH.cube, _A, _K, .26, .28, DRK, -.6); seg(MESH.cube, _K, _F, .22, .24, STL, -.7);
  push(); T(lerp(1.2, .0, r), lerp(.02, .5, r), lerp(.5, 1.4, r) + sw); RY(lerp(1.38, 0, r)); RX(lerp(0, -.12, r));
    draw(MESH.cube, 1.36, 1.1, .13, YEL); box(0, .52, .03, 1.4, .1, .2, STL, -.8); box(0, -.52, .06, 1.4, .12, .26, STL, -.8); for (const q of [-.36, 0, .36]) { push(); T(q, 0, .07); RZ(.6); draw(MESH.cube, .13, 1.0, .02, DRK); pop(); } if ((k = fitK(g, 'chain')) > 0) for (const q of [-.44, 0, .44]) { push(); T(q, .24, .08); RX(Math.PI / 2); SCL(k); T(0, .26, 0); draw(MESH.cone, .2, .52, .2, BONE); pop(); } pop();
}
/* Bugs are drawn from flat-faced shapes so they read as hard, sharp chitin. Each kind has its own outline from above:
   the stalker is all legs and two raised scythes; the spitter is a lit sac on a small frame; the guard is a broad shield with horns and a tapering plated back. */
function drawBug(e, g) { const al = e.ally, big = e.big, spit = e.spit, m = e.m, s = e.s * (al ? Math.min(1, e.born * 3) * Math.min(1, e.life * 3 + .2) : 1), tell = e.state === 'tell', lunge = e.state === 'lunge', hitF = e.flash > 0, E = hitF ? (ST.flash ? .3 : .8) : ST.contrast ? .3 : -.5, Eh = E > 0 ? E : -.4;
  const C = hitF ? [.3, .2, .12] : al ? ALLYC : ST.contrast ? [.26, .2, .3] : big ? GUARDC : SHELLC, C2 = hitF ? C : al ? ALLYC2 : spit ? SPITC2 : big ? GUARDC2 : PALS[m.pal], CL = hitF ? C : al ? [.3, .6, .7] : CLAWC, w = m.w, ab = m.ab, lg = m.lg, ph = e.phase * TAU, sp = Math.hypot(e.vx, e.vz), mv = clamp(sp / 3, 0, 1), r = clamp(e.rear.x, 0, 1.2);
  const by = ((big ? .58 : .64) + Math.sin(ph * 2) * .035 * mv + r * .1 + (lunge ? .12 : 0)) * s, ca = Math.cos(e.a), sa = Math.sin(e.a), wag = Math.sin(ph) * .16 * mv + Math.sin(g.t * 2.3 + e.bias * 9) * .05, hd = clamp(angDiff(e.a, Math.atan2(g.x - e.x, g.z - e.z)), -.7, .7);
  const eyeC = tell ? [1, .25, .1] : al ? [.3, .9, 1] : big ? [1, .5, .1] : spit ? [.8, 1, .2] : [.75, 1, .2], glowC = al ? [.2, .8, 1] : big ? [1, .45, .08] : [.55, .9, .12];
  decal(e.x, e.z, (big ? 1.5 : 1.1) * s * w, (big ? 2 : 1.6) * s, e.a, 0, 0, 0, 0, .55); if (al) decal(e.x, e.z, 1.3 * s, 1.3 * s, 0, 1, .3, .85, 1, .5, .012);
  if (tell && spit) { const k = 1 - e.st / .75, hc = ST.contrast; decal(e.tx, e.tz, 1.9, 1.9, 0, 1, 1, hc ? .8 : .12, hc ? .6 : .05, (hc ? .6 : .4) + k * .4, .012); }
  else if (tell) { const k = 1 - e.st / (big ? .85 : TELL), hc = ST.contrast, LANE = big ? 10.8 : LUNGE_T * LUNGE_V + .8; decal(e.x + e.ldx * LANE / 2, e.z + e.ldz * LANE / 2, big ? 1.25 : .62, LANE / 2, e.la, 2, hc ? 1 : .95, hc ? .8 : .1, hc ? .6 : .04, (hc ? .5 : .3) + k * .4, .01); }
  reset(); T(e.x, by, e.z); RY(e.a + Math.sin(ph) * .06 * mv); RZ(Math.sin(ph) * .07 * mv); T(0, 0, -e.fl.x * .22); RX(-r * (big ? .12 : .32) - e.fl.x * .12);
  if (big) {      // brood guard
    draw(MESH.shell, 1.05 * s * w, .5 * s, 1.3 * s, C, E);
    for (let i = 0; i < 3; i++) { const k = 1 - i * .2; push(); T(0, (.2 + i * .05) * s, (-.35 - i * .55) * s); RY(wag * (.3 + i * .3)); RX(.16 + i * .06); draw(MESH.shell, 1.15 * k * s * w, .42 * k * s, 1.0 * k * s, C2, Eh); push(); T(0, .2 * k * s, -.1 * s); RX(-.6); T(0, .2 * s, 0); draw(MESH.spike, .2 * k * s, .5 * k * s, .2 * k * s, CL, 0); pop(); for (const q of [-1, 1]) { push(); T(q * .42 * k * s * w, .08 * s, 0); draw(MESH.oct, .1 * s, .12 * s, .5 * k * s, glowC, 1.3 + Math.sin(g.t * 4 + i) * .4); pop(); } pop(); }
    push(); T(0, .02 * s, .72 * s); RY(hd * .5); RX(.2 + r * .3); draw(MESH.shell, 1.25 * s * w, .56 * s, 1.15 * s, GUARDF, Eh);       // a low armoured head it lowers to ram with: a brow plate, a horn, a tusk at each corner
      push(); T(0, .2 * s, .12 * s); RX(-.3); draw(MESH.oct, 1.5 * s * w, .16 * s, .7 * s, C2, Eh); pop(); push(); T(0, .16 * s, .34 * s); RX(Math.PI / 2 - .45); T(0, .42 * s, 0); draw(MESH.spike, .24 * s, .95 * s, .24 * s, CL, 0); pop();
      for (const q of [-1, 1]) { push(); T(q * .5 * s * w, -.08 * s, .3 * s); RY(q * .25); RX(Math.PI / 2); RY(-q * Math.PI / 2); T(0, .4 * s, 0); draw(MESH.blade, 1.5 * s, .9 * s, 1.3 * s, CL, 0); pop(); push(); T(q * .34 * s * w, .06 * s, .46 * s); draw(MESH.oct, .13 * s, .09 * s, .13 * s, eyeC, tell ? 4 : 2.6); pop(); xf(q * .34 * s * w, .06 * s, .5 * s, _B); glow(_B[0], _B[1], _B[2], (tell ? .9 : .5) * s, eyeC[0], eyeC[1], eyeC[2], .5); } pop();
  } else {
    draw(MESH.shell, .64 * s * w, .36 * s, 1.05 * s, C, E); push(); T(0, .13 * s, .16 * s); RX(-.14); draw(MESH.oct, .6 * s * w, .16 * s, .66 * s, C2, Eh); pop();       // thorax, with the one coloured plate
    if (spit) { const pu = 1 + (tell ? Math.sin(g.t * 30) * .05 + .14 : Math.sin(g.t * 3 + e.bias * 9) * .04); push(); T(0, .5 * s, -.7 * s); RX(.4 + r * .5); draw(MESH.shell, 1.15 * s * pu, 1.05 * s * pu, 1.5 * s * pu, [.55, .72, .08], hitF ? E : tell ? 1.5 : .55); draw(MESH.oct, 1.24 * s * pu, .1 * s, 1.6 * s * pu, C, E); draw(MESH.oct, .1 * s, 1.14 * s * pu, 1.6 * s * pu, C, E);       // the acid sac, held in two dark bands
        push(); T(0, .3 * s, .62 * s); RX(Math.PI / 2 - .5); T(0, .2 * s, 0); draw(MESH.spike, .2 * s, .5 * s, .2 * s, CL, 0); pop(); pop(); xf(0, .6 * s, -.8 * s, _B); glow(_B[0], _B[1], _B[2], (tell ? 2.4 : 1.5) * s, .7, .9, .15, tell ? .5 : .22); }
    else { const a = s * ab; push(); T(0, .1 * s, -.42 * s); RY(wag); RX(.3 + r * .2); T(0, 0, -.52 * a); draw(MESH.shell, .58 * a * w, .44 * a, 1.35 * a, C, E);       // abdomen: long, tipped up, a ridge of spikes and two lit slits
        for (let i = 0; i < (m.spk ? 3 : 2); i++) { push(); T(0, .18 * a, (.26 - i * .3) * a); RX(-.55); T(0, .15 * a, 0); draw(MESH.spike, .13 * a, (.3 + i * .08) * a, .13 * a, C2, Eh); pop(); }
        for (const q of [-1, 1]) { push(); T(q * .22 * a * w, .04 * a, -.02 * a); draw(MESH.oct, .07 * a, .12 * a, .62 * a, glowC, 1.2 + Math.sin(g.t * 5 + e.bias * 20) * .45); pop(); } pop(); }
    push(); T(0, -.07 * s, .62 * s); RY(hd); RX(.3 - r * .3); draw(MESH.oct, .5 * s * w, .26 * s, .62 * s, C, E);       // a wedge of a head that turns to watch you
      for (const q of [-1, 1]) { for (let j = 0; j < 2; j++) { push(); T(q * (.15 + j * .07) * s, .06 * s, (.13 - j * .15) * s); draw(MESH.oct, .11 * s, .08 * s, .13 * s, eyeC, tell ? 4 : 2.6); pop(); } xf(q * .17 * s, .07 * s, .16 * s, _B); glow(_B[0], _B[1], _B[2], (tell ? .7 : .36) * s, eyeC[0], eyeC[1], eyeC[2], .5);
        push(); T(q * .12 * s, -.05 * s, .24 * s); RY(q * (.3 + (tell ? .45 : Math.abs(Math.sin(g.t * 9 + e.bias * 7)) * .25))); RX(Math.PI / 2); RY(-q * Math.PI / 2); T(0, .22 * s * m.mand, 0); draw(MESH.blade, .9 * s, .46 * s * m.mand, .8 * s, CL, 0); pop();
        xf(q * .1 * s, .1 * s, .22 * s, _A); xf(q * (.36 + Math.sin(g.t * 5 + e.bias * 9 + q) * .1) * s, (.5 + Math.sin(g.t * 3.7 + e.bias * 5 + q * 2) * .1) * s, .85 * s * m.ant, _F); seg(MESH.cyl, _A, _F, .022 * s, .022 * s, C2, Eh); } pop();
    if (!spit) for (const q of [-1, 1]) { const wb = Math.sin(ph + q) * .05 * mv, k2 = lunge ? 0 : r, ex = lunge ? .45 : lerp(.62, .88, k2), ey = lunge ? .42 : lerp(.5, 1.05, k2) + wb, ez = lunge ? .95 : lerp(.6, .32, k2), tx = lunge ? .12 : lerp(.42, .72, k2), ty = lunge ? -.15 : lerp(-.28, 1.62, k2), tz = lunge ? 1.95 : lerp(1.22, 1.0, k2);       // the scythes: folded while it walks, thrown up and wide before a lunge, driven forward in it
        xf(q * .28 * s * w, .05 * s, .4 * s, _A); xf(q * ex * s, ey * s, ez * s, _K); xf(q * tx * s, ty * s, tz * s, _F); seg(MESH.taper, _A, _K, .17 * s, .17 * s, C, E); seg(MESH.blade, _K, _F, 1.0 * s, 1.15 * s, CL, 0, [0, 1, 0]); }
  }
  if (e.burnT > 0) { glow(e.x, .9 * s, e.z, 1.3 * s, 1, .5, .12, .45); if (Math.random() < .5) part(0, e.x + rand(-.4, .4) * s, .7 * s, e.z + rand(-.4, .4) * s, 0, rand(1.5, 3), 0, .3, .4 * s, 1, .5, .1, .7, -1, .5, -.6); }
  const l1 = (big ? .85 : spit ? .8 : .95) * s * lg, l2 = (big ? 1.2 : spit ? 1.25 : 1.5) * s * lg, th = big ? 1.7 : 1;       // legs: a thick thigh up to a high knee, then a long spike to the ground
  for (let i = 0; i < 6; i++) { const L = e.legs && e.legs[i]; if (!L) break; if (e.off >> i & 1) continue; const side = i < 3 ? 1 : -1, row = i % 3; xf(side * .28 * s * w, -.02 * s, (1 - row) * .32 * s, _H); _F[0] = L.x; _F[1] = L.y; _F[2] = L.z; _P[0] = side * ca * .6; _P[1] = 1; _P[2] = -side * sa * .6; ik2(_H, _F, l1, l2, _P, _K);
    seg(MESH.taper, _H, _K, .15 * th * s, .15 * th * s, C, E); seg(MESH.spike, _K, _F, .11 * th * s, .11 * th * s, C, E); W0(); T(_K[0], _K[1], _K[2]); draw(MESH.oct, .12 * th * s, .12 * th * s, .12 * th * s, big ? C2 : C, Eh); pop(); }
}
function drawProp(p, g) { reset(); T(p.x, 0, p.z); RY(p.rot);
  if (p.k === 'fire') { push(); T(0, .5, 0); draw(MESH.cyl, .82, 1, .82, RUST); T(0, .5, 0); draw(MESH.cyl, .9, .07, .9, DRK); T(0, .02, 0); draw(MESH.cyl, .7, .04, .7, [1, .45, .1], 3); pop(); glow(p.x, 1.25, p.z, 1.7 + Math.sin(g.t * 17 + p.v * 9) * .2, 1, .5, .15, .5); decal(p.x, p.z, 1, 1, 0, 0, 0, 0, 0, .5); }
  else if (p.k === 'pillar') { const h = 2.4 + p.v * 2.2; box(0, .16, 0, 1.4, .32, 1.4, CONC); box(0, h / 2, 0, .98, h, .98, CONC); push(); T(.08, h + .14, -.05); RX(.25); RZ(-.2); draw(MESH.cube, .8, .5, .74, CONC); pop(); push(); T(-.2, h + .5, .2); RZ(.3); draw(MESH.cyl, .05, .9, .05, RUST); pop(); push(); T(.25, h + .4, -.1); RZ(-.5); RX(.3); draw(MESH.cyl, .05, .8, .05, RUST); pop(); box(0, 1.1, .5, .7, .16, .02, YEL2); decal(p.x, p.z, 1.3, 1.3, 0, 0, 0, 0, 0, .55); }
  else if (p.k === 'rubble') { for (let i = 0; i < 5; i++) { const a = i * 1.9 + p.v * 5, r = i ? .55 : 0, sz = .5 + hash2(i, p.v * 99, 7) * .7; push(); T(Math.cos(a) * r, sz * .3, Math.sin(a) * r); RY(a * 2); RX(hash2(i, p.v * 77, 8) * .7); draw(MESH.cube, sz, sz * .6, sz * .8, i % 2 ? CONC : [.2, .19, .18]); pop(); } push(); T(.2, .5, 0); RZ(.9); RY(1); draw(MESH.cyl, .05, 1.5, .05, RUST); pop(); decal(p.x, p.z, 1.5, 1.5, 0, 0, 0, 0, 0, .5); }
  else { const O = [.13, .17, .1]; box(-.3, .46, 0, .92, .92, .92, O); box(-.3, .46, .47, .94, .14, .02, YEL2); box(.62, .4, .1, .8, .8, .8, O); push(); T(-.1, 1.26, .05); RY(.4); draw(MESH.cube, .76, .7, .76, O); T(0, 0, .39); draw(MESH.cube, .78, .12, .02, YEL2); pop(); decal(p.x, p.z, 1.5, 1.3, p.rot, 0, 0, 0, 0, .5); }
}
const SC = { cam: [0, 0, 0], at: [0, 0, 0], fov: .8, focus: [0, 0, 0], spotP: [0, 0, 0], spotD: [0, 0, 1], spotC: [0, 0, 0], spotCos: [.74, .92], spotFov: 1.62, lights: [], ambS: [0, 0, 0], ambG: [0, 0, 0], moonD: [-.4, .75, .5], moonC: [0, 0, 0], fogC: [.003, .004, .007], rim: [.1, .14, .24], fogR: [15, 27], exposure: 1.25 };
function shakeN(t, s) { const x = Math.sin(t * 12.9898 + s * 78.233) * 43758.5453; return (x - Math.floor(x)) * 2 - 1; }
function render() { const g = G; if (!GLOK) return; const fires = [];
  const cx = Math.floor(g.cam.x / CELL), cz = Math.floor(g.cam.z / CELL); for (let i = cx - 2; i <= cx + 2; i++) for (let j = cz - 3; j <= cz + 2; j++) for (const p of getCell(i, j)) { drawProp(p, g); if (p.k === 'fire') fires.push(p); }
  drawMech(g); for (const e of g.en) drawBug(e, g); for (const e of g.allies) drawBug(e, g);
  for (const d of g.drops) { const y = .75 + Math.sin(d.t * 3) * .12, k = Math.min(1, d.t * 4) * Math.min(1, (45 - d.t) * .5), c = d.k === 'item' ? RAR[ITEM[d.id].r].col : [.3, 1, .5]; reset(); T(d.x, y, d.z); RY(d.t * 1.8); RX(.5);
    if (d.k === 'item') { draw(MESH.cube, .5 * k, .5 * k, .5 * k, DRK, -.8); draw(MESH.cube, .54 * k, .15 * k, .54 * k, c, 2.2); draw(MESH.cube, .15 * k, .54 * k, .54 * k, c, 2.2); } else draw(MESH.cyl, .32 * k, .5 * k, .32 * k, c, 1.6);
    if (d.k === 'item' && ITEM[d.id].r === 'l') { sprite(PADD, d.x, 3.2, d.z, .5, 0, 0, 3, 0, c[0], c[1], c[2], .4 * k); glow(d.x, y, d.z, 3 + Math.sin(d.t * 5) * .4, c[0], c[1], c[2], .35 * k); }      // a legendary part stands in a column of light
    glow(d.x, y, d.z, (d.k === 'item' ? 1.9 : 1.2) * k, c[0], c[1], c[2], .45); decal(d.x, d.z, .95, .95, 0, 1, c[0], c[1], c[2], .55 * k, .01); decal(d.x, d.z, .5, .5, 0, 0, 0, 0, 0, .5 * k); }
  for (const sh of g.shells) { if (sh.t < 0) continue; const u = sh.t / sh.dur, x = lerp(sh.x0, sh.x1, u), y = lerp(sh.y0, .3, u) + Math.sin(u * Math.PI) * 6, z = lerp(sh.z0, sh.z1, u); reset(); T(x, y, z); draw(MESH.sph, .34, .34, .34, DRK, -.8); glow(x, y, z, .8, 1, .6, .2, .7); decal(sh.x1, sh.z1, 3.1, 3.1, 0, 1, 1, .65, .15, .25 + u * .45, .012); decal(x, z, .35, .35, 0, 0, 0, 0, 0, .4); }
  for (const b of g.bolts) { const a = Math.min(1, b.t / .08); for (let i = 1; i < b.pts.length; i++) { const A = b.pts[i - 1], B = b.pts[i]; let px = A[0], py = A[1], pz = A[2]; for (let k = 1; k <= 4; k++) { const u = k / 4, j = k < 4 ? .45 : 0, qx = lerp(A[0], B[0], u) + rand(-j, j), qy = lerp(A[1], B[1], u) + rand(-j, j), qz = lerp(A[2], B[2], u) + rand(-j, j); sprite(PADD, (px + qx) / 2, (py + qy) / 2, (pz + qz) / 2, .11, 0, (qx - px) / 2, (qy - py) / 2, (qz - pz) / 2, .6, .8, 1, a); px = qx; py = qy; pz = qz; } glow(B[0], B[1], B[2], 1.1, .5, .7, 1, .6 * a); } }
  for (const d of g.drones) { reset(); T(d.x, d.y, d.z); RY(d.a); draw(MESH.cube, .4, .18, .5, DRK, -.7); box(0, -.02, .26, .14, .1, .08, [.3, .9, 1], 2.5); for (const k of [-1, 1]) { push(); T(k * .34, .1, 0); draw(MESH.cyl, .46, .03, .46, STL, -.8); pop(); box(k * .2, .04, 0, .3, .05, .08, STL); } glow(d.x, d.y, d.z + .1, .5 + d.fl * .6, .3, .9, 1, .5 + d.fl * .4); decal(d.x, d.z, .4, .4, 0, 0, 0, 0, 0, .3); }
  for (const b of g.globs) { const u = b.t / b.dur, x = lerp(b.x0, b.x1, u), y = .8 + Math.sin(u * Math.PI) * 5, z = lerp(b.z0, b.z1, u), hc = ST.contrast; reset(); T(x, y, z); draw(MESH.sph, .42, .42, .42, [.65, .85, .12], 1.6); glow(x, y, z, 1.1, .7, .9, .15, .6); decal(b.x1, b.z1, 1.9, 1.9, 0, 1, 1, hc ? .8 : .12, hc ? .6 : .05, .9, .012); decal(b.x1, b.z1, 1.9 * u, 1.9 * u, 0, 0, 1, .1, .04, .3, .011); decal(x, z, .4, .4, 0, 0, 0, 0, 0, .4); }
  for (const q of g.pools) { const k = Math.min(1, q.t * 1.5), hc = ST.contrast; decal(q.x, q.z, 2.3, 2.3, q.seed, 3, .5, .65, .08, .6 * k, .011, q.seed); decal(q.x, q.z, 1.85, 1.85, 0, 1, 1, hc ? .8 : .15, hc ? .6 : .05, (hc ? .9 : .55) * k, .013); }
  for (const f of g.fires) decal(f.x, f.z, 1.2, 1.2, 0, 0, 1, .4, .06, .32 * Math.min(1, f.t), .01);
  if (g.itemFx > 0 && !g.dead) { const c = g.itemCol, k = g.itemFx; glow(g.x, 2, g.z, 3 + (1 - k) * 5, c[0], c[1], c[2], .5 * k); decal(g.x, g.z, 1.5 + (1 - k) * 4, 1.5 + (1 - k) * 4, 0, 1, c[0], c[1], c[2], .8 * k, .01); }
  for (const b of DB) { const k = Math.min(1, (b.life - b.t) * 3); reset(); T(b.x, b.y, b.z); RY(b.ay); RX(b.ax); draw(b.mesh, b.sx * k, b.sy * k, b.sz * k, b.col, b.e); }
  for (const d of DL) decal(d.x, d.z, d.sx, d.sz, d.rot, d.kind, d.r, d.g, d.b, d.a * Math.min(1, (d.life - d.t) * .6), 0, d.seed);
  for (const p of PT) { const f = 1 - p.t / p.life, s = Math.max(.01, p.size + p.grow * p.t); if (p.k === 1) sprite(PSMK, p.x, p.y, p.z, s, s, 0, 0, 0, p.r, p.g, p.b, p.a * f); else if (p.k === 2) sprite(PADD, p.x, p.y, p.z, s, 0, p.vx * p.len, p.vy * p.len, p.vz * p.len, p.r, p.g, p.b, p.a * f); else sprite(PADD, p.x, p.y, p.z, s, s, 0, 0, 0, p.r, p.g, p.b, p.a * f); }
  for (const r of TR) { const u = r.t / r.dur, dx = r.x1 - r.x0, dy = r.y1 - r.y0, dz = r.z1 - r.z0, l = Math.hypot(dx, dy, dz) || 1, hl = Math.min(1.5, l * .3) / l;
    if (r.hv) { const h = Math.min(1, u), fa = u > 1 ? 1 - (r.t - r.dur) / .13 : 1, k2 = Math.min(2.2, l * .4) / l; sprite(PADD, r.x0 + dx * h * .5, r.y0 + dy * h * .5, r.z0 + dz * h * .5, .09, 0, dx * h * .5, dy * h * .5, dz * h * .5, 1, .7, .4, .3 * fa); if (u < 1) { sprite(PADD, r.x0 + dx * u, r.y0 + dy * u, r.z0 + dz * u, .5, 0, dx * k2, dy * k2, dz * k2, 1, .55, .2, .4); sprite(PADD, r.x0 + dx * u, r.y0 + dy * u, r.z0 + dz * u, .17, 0, dx * k2, dy * k2, dz * k2, 1, .95, .75, 1); glow(r.x0 + dx * u, r.y0 + dy * u, r.z0 + dz * u, .9, 1, .8, .5, .5); } continue; } if (r.c === 2) sprite(PADD, r.x0 + dx * u, r.y0 + dy * u, r.z0 + dz * u, .16, 0, dx * hl * .5, dy * hl * .5, dz * hl * .5, .7, .95, .15, 1); else if (r.c) sprite(PADD, r.x0 + dx * u, r.y0 + dy * u, r.z0 + dz * u, .06, 0, dx * hl, dy * hl, dz * hl, .3, .9, 1, 1); else sprite(PADD, r.x0 + dx * u, r.y0 + dy * u, r.z0 + dz * u, .07, 0, dx * hl, dy * hl, dz * hl, 1, .85, .5, 1); }
  // lights: the lamp, a soft fill so the mech never vanishes, then whatever is burning or firing.
  // The pad is close to black outside them; the brightness setting lifts it.
  const br = ST.bright + (ST.contrast ? .25 : 0), L = SC.lights; L.length = 0; const on = g.dead ? 0 : 1;
  L.push({ p: [g.x, 4.2, g.z + 1.5], c: [.2 * on + br * .55, .19 * on + br * .55, .2 * on + br * .6], r: 7.5 + br * 7 });
  if (g.heat > .05) { const f = g.heat * (ST.flash ? .6 : 1) * (.9 + Math.sin(g.t * 47) * .06) + (ST.flash ? 0 : g.flash * .45); L.push({ p: [g.x + g.muz[0], g.muz[1] + .3, g.z + g.muz[2]], c: [2.6 * f, 1.7 * f, .7 * f], r: 8.5 }); }      // a steady glow while the gun runs: a light that blinked per shot would strobe
  if (g.jet > .05) L.push({ p: [g.x - Math.sin(g.aim) * 1.8, 1.6, g.z - Math.cos(g.aim) * 1.8], c: [6 * g.jet, 3 * g.jet, 1 * g.jet], r: 10 });
  if (g.boom > 0 || g.dead) L.push({ p: [g.x, 2.5, g.z], c: [9 * g.boom + (g.dead ? 2.4 + Math.sin(g.t * 23) * .5 : 0), 4 * g.boom + (g.dead ? .9 : 0), 1 * g.boom], r: 13 });
  if (g.pulse) { const k = g.pulse.t, c = g.pulse.c; L.push({ p: [g.pulse.x, 1.5, g.pulse.z], c: [c[0] * 5 * k, c[1] * 5 * k, c[2] * 5 * k], r: 9 }); }
  if (g.fires.length) { const f = g.fires[g.fires.length >> 1], k = Math.min(1, f.t); L.push({ p: [f.x, 1.3, f.z], c: [3.6 * k, 1.5 * k, .4 * k], r: 9 }); }
  let nd = null; for (const d of g.drops) if (d.k === 'item' && (!nd || (d.x - g.x) ** 2 + (d.z - g.z) ** 2 < (nd.x - g.x) ** 2 + (nd.z - g.z) ** 2)) nd = d; if (nd && L.length < 5) { const c = RAR[ITEM[nd.id].r].col; L.push({ p: [nd.x, 1.6, nd.z], c: [c[0] * 1.6, c[1] * 1.6, c[2] * 1.6], r: 6 }); }
  fires.sort((a, b) => (a.x - g.x) ** 2 + (a.z - g.z) ** 2 - (b.x - g.x) ** 2 - (b.z - g.z) ** 2); for (const p of fires) { if (L.length >= 6) break; const fl = .85 + Math.sin(g.t * 13 + p.v * 20) * .1 + Math.sin(g.t * 31 + p.v * 7) * .06; L.push({ p: [p.x, 1.9, p.z], c: [5.2 * fl, 2.1 * fl, .5 * fl], r: 12.5 }); }
  const sh = g.trauma * g.trauma * ST.shake, tt = performance.now() / 1000 * 32, d = 31 * g.cam.d, P = 54 * Math.PI / 180, sx = sh * .55 * shakeN(tt, 1), sz = sh * .55 * shakeN(tt, 2);
  const kx = g.ck.x * Math.min(1, ST.shake), kz = g.ck.z * Math.min(1, ST.shake); SC.cam[0] = g.cam.x + sx + kx; SC.cam[1] = Math.sin(P) * d; SC.cam[2] = g.cam.z + Math.cos(P) * d + sz + kz; SC.at[0] = g.cam.x + sx * .6 + sh * .3 * shakeN(tt, 3) + kx; SC.at[1] = 1.2; SC.at[2] = g.cam.z - 2.2 * g.cam.d + sz * .6 + kz; SC.fov = .8 + g.fov.x * .09;
  SC.focus[0] = g.x; SC.focus[2] = g.z; SC.spotP = g.lampP; const ld = g.lampD, ll = Math.hypot(ld[0], ld[1], ld[2]) || 1; SC.spotD[0] = ld[0] / ll; SC.spotD[1] = ld[1] / ll; SC.spotD[2] = ld[2] / ll;
  const sr = g.s.sear, lk = on * (1 - (ST.flash ? .15 : .55) * g.dip) /* a hit makes the lamp dip for a moment */; SC.spotC[0] = (sr ? 5.8 : 4.7) * lk; SC.spotC[1] = (sr ? 3.5 : 4.2) * lk; SC.spotC[2] = (sr ? 1.6 : 3.4) * lk; SC.spotCos[0] = sr ? .64 : .74; SC.spotCos[1] = sr ? .88 : .92; SC.spotFov = sr ? 1.9 : 1.62; SC.ambS[0] = .005 + br * .13; SC.ambS[1] = .008 + br * .14; SC.ambS[2] = .015 + br * .17; SC.ambG[0] = SC.ambG[1] = SC.ambG[2] = .003 + br * .055; SC.moonC[0] = .012 + br * .11; SC.moonC[1] = .019 + br * .11; SC.moonC[2] = .036 + br * .12; SC.fogR[0] = 10.5 + br * 14; SC.fogR[1] = 20 + br * 20;
  renderScene(SC, glc.width, glc.height); hud();
}

/* ---------- HUD: a thin 2D layer over the 3D view ---------- */
const dashBtn = () => { const r = 40 * ST.btn; return { x: ST.hand === 'left' ? 24 + r : W - 24 - r, y: H - 96 - r, r }; };
const stickBase = () => ({ x: ST.hand === 'left' ? W - 88 : 88, y: H - 150 });
const pauseBtn = () => ({ x: W - 34, y: SAFE + 36, r: 22 });
const FONT = 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
function toScr(x, y, z) { const w = VP[3] * x + VP[7] * y + VP[11] * z + VP[15]; if (w <= .01) return null; return [((VP[0] * x + VP[4] * y + VP[8] * z + VP[12]) / w * .5 + .5) * W, (1 - ((VP[1] * x + VP[5] * y + VP[9] * z + VP[13]) / w * .5 + .5)) * H]; }
function hud() { const g = G; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); if (state !== 'play') return; const ts = ST.text, hc = ST.contrast;
  { const v = ctx.createRadialGradient(W / 2, H * .52, H * .3, W / 2, H * .52, H * .74), a = Math.max(0, .62 - ST.bright * .6 - (ST.contrast ? .25 : 0)); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${a})`); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); }      // the dark closes in at the edges
  if (g.hurtT > 0 || g.hp < 30) { const a = Math.max(g.hurtT * (ST.flash ? .3 : .55), g.hp < 30 && !g.dead ? .22 + (ST.flash ? 0 : Math.sin(g.t * 6) * .08) : 0), gr = ctx.createRadialGradient(W / 2, H / 2, H * .25, W / 2, H / 2, H * .62); gr.addColorStop(0, 'rgba(200,20,10,0)'); gr.addColorStop(1, `rgba(200,20,10,${a})`); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); }
  // a swarm is coming: the dark at that edge of the screen turns red for a few seconds
  for (const c of g.cues) { const ux = Math.sin(c.a), uy = Math.cos(c.a), t = Math.min(ux ? (W / 2) / Math.abs(ux) : 1e9, uy ? (H / 2) / Math.abs(uy) : 1e9), ex = W / 2 + ux * t, ey = H / 2 + uy * t, k = Math.min(1, c.t) * Math.min(1, (3.4 - c.t) * 3) * (ST.flash ? .8 : .75 + Math.sin(performance.now() / 160) * .25), gr = ctx.createRadialGradient(ex, ey, 0, ex, ey, W * .42); gr.addColorStop(0, `rgba(255,40,20,${(hc ? .6 : .38) * k})`); gr.addColorStop(1, 'rgba(255,40,20,0)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); }
  for (const d of g.drops) { if (d.k !== 'item' || ITEM[d.id].r === 'c') continue; const sc = toScr(d.x, .8, d.z); if (sc && sc[0] > 10 && sc[0] < W - 10 && sc[1] > SAFE + 44 && sc[1] < H - 10) continue;       // a better part lying off screen: a diamond in its colour at the edge, with an arrow toward it
    const R = RAR[ITEM[d.id].r], leg = ITEM[d.id].r === 'l', dx = d.x - g.x, dy = d.z - g.z, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, m = 26, t = Math.min(ux > 0 ? (W - m - W / 2) / ux : ux < 0 ? (m - W / 2) / ux : 1e9, uy > 0 ? (H - m - H / 2) / uy : uy < 0 ? (SAFE + 70 - H / 2) / uy : 1e9), k = leg ? 1.35 : 1, bob = ST.flash ? 0 : Math.sin(performance.now() / 200) * 3;
    ctx.save(); ctx.translate(W / 2 + ux * (t + bob), H / 2 + uy * (t + bob)); ctx.rotate(Math.atan2(uy, ux)); ctx.scale(k, k); ctx.lineJoin = 'round'; ctx.fillStyle = R.css; ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(4, -8); ctx.lineTo(4, 8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(1, 0); ctx.lineTo(-7, -8); ctx.lineTo(-15, 0); ctx.lineTo(-7, 8); ctx.closePath(); ctx.fill(); ctx.stroke(); if (leg) { ctx.strokeStyle = R.css; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(-7, 0, 13, 0, TAU); ctx.stroke(); } ctx.restore(); }
  // hull
  const bw = Math.min(150, W * .34), bh = hc ? 12 : 8, bx = 14, by = SAFE + 18, k = clamp(g.hp / g.s.maxhp, 0, 1); ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4); ctx.fillStyle = k < .3 ? '#ff4a2e' : '#f2b01e'; ctx.fillRect(bx, by, bw * k, bh); ctx.strokeStyle = hc ? '#fff' : 'rgba(230,223,208,.5)'; ctx.lineWidth = 1; ctx.strokeRect(bx - 1.5, by - 1.5, bw + 3, bh + 3);
  ctx.font = `600 ${11 * ts}px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#e6dfd0'; if (ST.nums) ctx.fillText(Math.ceil(g.hp), bx + bw + 8, by - 2);
  ctx.textAlign = 'center'; ctx.font = `600 ${18 * ts}px ${FONT}`; { const lastP = g.t > RUN - 36 && !g.won; ctx.font = `600 ${(lastP ? 22 + (ST.flash ? 0 : Math.sin(g.t * 6) * 2) : 18) * ts}px ${FONT}`; ctx.fillStyle = lastP ? '#ff6a4a' : '#e6dfd0'; ctx.fillText(fmtT(Math.max(0, Math.ceil((RUN - g.t) / PACE))), W / 2, SAFE + 14); }      // the clock is the only words on screen; it swells and reddens for the last push
  const P = pauseBtn(); ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.arc(P.x, P.y, P.r, 0, TAU); ctx.fill(); ctx.fillStyle = '#e6dfd0'; ctx.fillRect(P.x - 7, P.y - 8, 5, 16); ctx.fillRect(P.x + 2, P.y - 8, 5, 16);
  // dash button, with its recharge as a ring
  const B = dashBtn(), rdy = g.dcd <= 0, cdk = clamp(1 - g.dcd / g.s.dashCd, 0, 1); ctx.fillStyle = rdy ? 'rgba(242,176,30,.1)' : 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.arc(B.x, B.y, B.r, 0, TAU); ctx.fill(); ctx.lineWidth = hc ? 5 : 3; ctx.strokeStyle = 'rgba(230,223,208,.25)'; ctx.stroke();
  ctx.strokeStyle = rdy ? '#f2b01e' : '#a8a294'; ctx.beginPath(); ctx.arc(B.x, B.y, B.r, -Math.PI / 2, -Math.PI / 2 + TAU * cdk); ctx.stroke(); ctx.fillStyle = rdy ? '#f2b01e' : '#a8a294'; ctx.font = `700 ${12 * Math.min(ts, 1.5)}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; if (!rdy && ST.nums) ctx.fillText(Math.max(0, g.dcd).toFixed(1), B.x, B.y); else { ctx.strokeStyle = rdy ? '#f2b01e' : '#a8a294'; ctx.globalAlpha = rdy ? .8 : .4; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; for (const q of [-6, 4]) { ctx.beginPath(); ctx.moveTo(B.x + q - 4, B.y - 8); ctx.lineTo(B.x + q + 4, B.y); ctx.lineTo(B.x + q - 4, B.y + 8); ctx.stroke(); } ctx.globalAlpha = 1; }
  if (dbtn && dbtn.d > 12) { ctx.strokeStyle = '#f2b01e'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(B.x, B.y); ctx.lineTo(B.x + dbtn.ux * (B.r + 14), B.y + dbtn.uy * (B.r + 14)); ctx.stroke(); }
  const sb = stick ? { x: stick.ox, y: stick.oy } : ST.fixed ? stickBase() : null; if (sb) { ctx.strokeStyle = hc ? 'rgba(255,255,255,.8)' : 'rgba(230,223,208,.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sb.x, sb.y, 62, 0, TAU); ctx.stroke(); const kx = stick ? stick.ux * Math.min(stick.d, 62) : 0, ky = stick ? stick.uy * Math.min(stick.d, 62) : 0; ctx.fillStyle = hc ? 'rgba(255,255,255,.7)' : 'rgba(230,223,208,.4)'; ctx.beginPath(); ctx.arc(sb.x + kx, sb.y + ky, 24, 0, TAU); ctx.fill(); }
  if (g.cap) { const fs = 15 * Math.min(ts, 1.5); ctx.font = `600 ${fs}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const lines = []; let cur = ''; for (const w of g.cap.txt.split(' ')) { const nx = cur ? cur + ' ' + w : w; if (ctx.measureText(nx).width > W - 56 && cur) { lines.push(cur); cur = w; } else cur = nx; } lines.push(cur);
    const lh = fs * 1.35, bw2 = Math.max(...lines.map(l => ctx.measureText(l).width)) + 24, y0 = SAFE + 96 * Math.max(1, ts * .8); ctx.fillStyle = 'rgba(0,0,0,.78)'; ctx.fillRect(W / 2 - bw2 / 2, y0 - lh * .7, bw2, lh * lines.length + lh * .4); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, y0 + i * lh)); }
}

/* ---------- screens ---------- */
function show(id) {
  for (const s of document.querySelectorAll('.scr')) s.classList.toggle('on', s.id === id); const el = id ? $(id) : null; cv.style.visibility = id ? 'hidden' : 'visible';      // the HUD layer is only there during play
  if (el) { el.scrollTop = 0; const f = el.querySelector('[data-autofocus]:not([disabled])') || el.querySelector('button:not([disabled]),input,select'); if (f) setTimeout(() => { try { f.focus({ preventScroll: true }); } catch (e) { } }, 30); }
  else if (document.activeElement && document.activeElement !== document.body) { try { document.activeElement.blur(); } catch (e) { } }
}
function startGame() { if (!GLOK) return; initAudio(); const cam = G ? G.cam : null; newGame(false); if (cam) G.cam.d = cam.d; state = 'play'; show(''); lastT = performance.now();
  const carry = FOUND.filter(id => ITEM[id].r !== 'l'); if (carry.length) equip(pick(carry), 'Carried over'); else announce('Run started. Drag to walk. The gun fires on its own.'); }      // one part you have found before comes with you
const partLi = id => { const it = ITEM[id], l = G.lv[id]; return `<li><b style="color:${RAR[it.r].css}">${it.n}</b> <span class="rr">${RAR[it.r].n}${it.max > 1 ? ' · ' + MK[l] : ''}</span><br>${it.d(l)}</li>`; };
function nightUI() { const sel = $('night'); sel.innerHTML = ''; for (let i = 1; i <= OPEN; i++) { const o = document.createElement('option'); o.value = i; o.textContent = 'Night ' + i; if (i === night) o.selected = true; sel.appendChild(o); } $('nightSay').textContent = NIGHTS[night - 1].say; $('againBtn').textContent = 'Start night ' + night; $('startBtn').textContent = 'Start night ' + night; }
$('night').addEventListener('change', e => { night = clamp(+e.target.value | 0, 1, OPEN); nightUI(); });
function titleInfo() { nightUI(); let w = 0; try { w = +(localStorage.getItem('ll4_wins') || 0); } catch (e) { } let played = false; try { played = localStorage.getItem('ll4_best') !== null; } catch (e) { } $('howTo').hidden = played; $('found').textContent = FOUND.length || w ? `Parts ${FOUND.length}/${ITEMS.length}` + (w ? ` · Nights held ${w}` : '') : ''; }      // the how-to is only there until the first run is over
function endGame(win) { const g = G; state = 'over'; stick = null; dbtn = null; cardQ.length = 0; const t = Math.min(g.t, RUN) / PACE; let best = 0, wins = 0; try { best = +(localStorage.getItem('ll4_best') || 0); wins = +(localStorage.getItem('ll4_wins') || 0); if (t > best) localStorage.setItem('ll4_best', Math.floor(t)); if (win) localStorage.setItem('ll4_wins', ++wins); } catch (e) { } $('overT').textContent = win ? 'Night ' + g.night + ' held' : 'Wrecked'; let opened = 0; if (win && g.night === OPEN && OPEN < NIGHTS.length) { OPEN++; opened = OPEN; night = OPEN; try { localStorage.setItem('ll4_night', OPEN); } catch (e) { } } else if (win && g.night < OPEN) night = g.night + 1;
  $('stats').innerHTML = `<b>${fmtT(t)}</b> · <b>${g.kills}</b> kills` + (best > t ? `<br>Best ${fmtT(best)}` : '') + (opened ? `<br><b>Night ${opened}</b> open: ${NIGHTS[opened - 1].say}` : '');
  const row = $('overParts'); row.innerHTML = ''; for (const id of g.items) { const it = ITEM[id], cnv = document.createElement('canvas'), R = RAR[it.r]; cnv.width = cnv.height = 88; cnv.setAttribute('role', 'img'); cnv.setAttribute('aria-label', it.n + (it.max > 1 ? ', ' + MK[g.lv[id]] : '') + (g.fresh.includes(id) ? ', new' : '')); const x = cnv.getContext('2d'); x.fillStyle = 'rgba(0,0,0,.6)'; x.beginPath(); x.arc(44, 40, 34, 0, TAU); x.fill(); x.strokeStyle = R.css; x.lineWidth = g.fresh.includes(id) ? 5 : 2.5; x.stroke(); icon(x, id, 44, 40, 19, R.css); x.fillStyle = R.css; if (it.max > 1) for (let q = 0; q < g.lv[id]; q++) x.fillRect(44 - (g.lv[id] * 12 - 4) / 2 + q * 12, 79, 8, 6); row.appendChild(cnv); }      // what was fitted, as a row of icons; new kinds have a heavy ring
  titleInfo(); announce($('overT').textContent + '. ' + $('stats').innerText.replace(/\n+/g, '. ')); show('over'); }
function togglePause() { if (state === 'card') return; if (state === 'play') { state = 'paused'; stick = null; dbtn = null; $('build').innerHTML = G.items.length ? G.items.map(partLi).join('') : '<li>No parts fitted yet.</li>'; announce('Paused'); show('pause'); } else if (state === 'paused') { if (cardQ.length) openCard(); else { state = 'play'; show(''); lastT = performance.now(); } } }
$('startBtn').onclick = startGame; $('againBtn').onclick = startGame; $('resumeBtn').onclick = togglePause; $('quitBtn').onclick = () => { if (state === 'paused') endGame(false); }; $('partOk').onclick = closeCard;

const pct = v => v + '%';
const SCHEMA = [
  { g: 'Motion & flashing', note: 'Nothing in the game strobes. These options go further.', items: [
    { k: 'shake', t: 'range', l: 'Screen shake', min: 0, max: 100, step: 10, sc: 100, fmt: pct, d: 'Camera shake from footsteps, gunfire, dashes and hits.' },
    { k: 'hitstop', t: 'toggle', l: 'Hit-stop', d: 'A very brief slow-down when a dash rams something or you are hit.' },
    { k: 'flash', t: 'toggle', l: 'Reduce flashing', d: 'Softer hit flashes and no pulsing when the hull is low.' },
    { k: 'gore', t: 'toggle', l: 'Remains', d: 'Dead bugs break into pieces that lie on the ground for a few seconds.' } ] },
  { g: 'Vision & text', items: [
    { k: 'bright', t: 'range', l: 'Darkness brightness', min: 0, max: 100, step: 10, sc: 100, fmt: pct, d: 'Lifts the dark so you can see further outside the lamp.' },
    { k: 'contrast', t: 'toggle', l: 'High-contrast mode', d: 'Paler bugs that glow, bolder lunge lanes, thicker bars.' },
    { k: 'text', t: 'select', l: 'Text size', opts: [[1, '100%'], [1.25, '125%'], [1.5, '150%'], [2, '200%']], d: 'Menus and the in-game display.' },
    { k: 'nums', t: 'toggle', l: 'Show numbers', d: 'Hull and dash recharge as numbers.' },
    { k: 'cards', t: 'toggle', l: 'Stop to show new parts', d: 'The game stops and shows a card the first time a part is fitted in a run. When off, a caption is shown instead.' },
    { k: 'caps', t: 'toggle', l: 'Event captions', d: 'Off by default. Turn on for a line of text when a swarm or a brood guard arrives or a part goes up a mark. Always sent to screen readers.' } ] },
  { g: 'Audio & haptics', items: [
    { k: 'vol', t: 'range', l: 'Master volume', min: 0, max: 100, step: 5, sc: 100, fmt: pct }, { k: 'sfxv', t: 'range', l: 'Effects volume', min: 0, max: 100, step: 5, sc: 100, fmt: pct }, { k: 'musv', t: 'range', l: 'Music volume', min: 0, max: 100, step: 5, sc: 100, fmt: pct },
    { k: 'haptics', t: 'toggle', l: 'Vibration', d: 'A short buzz on a dash, a ram and a hit.' } ] },
  { g: 'Controls', items: [
    { k: 'hand', t: 'select', l: 'Dash button side', opts: [['right', 'Right'], ['left', 'Left']], d: 'A fixed joystick uses the opposite corner.' },
    { k: 'btn', t: 'select', l: 'Button size', opts: [[1, 'Normal'], [1.25, 'Large'], [1.5, 'Extra large']] },
    { k: 'fixed', t: 'toggle', l: 'Fixed joystick', d: 'The joystick stays in one corner instead of appearing where you touch.' },
    { k: 'dead', t: 'range', l: 'Joystick dead zone', min: 2, max: 24, step: 2, fmt: v => v + ' px', d: 'How far to move your thumb before you start walking.' } ] },
  { g: 'Assists', note: 'Change these at any time, including mid-run.', items: [
    { k: 'tscale', t: 'select', l: 'Game speed', opts: [[1, '100%'], [.85, '85%'], [.7, '70%'], [.55, '55%']], d: 'Slows everything, including the bugs.' },
    { k: 'dmg', t: 'select', l: 'Damage taken', opts: [[1, '100%'], [.75, '75%'], [.5, '50%'], [.25, '25%']] },
    { k: 'espd', t: 'select', l: 'Bug speed', opts: [[1, '100%'], [.85, '85%'], [.7, '70%']] },
    { k: 'ecount', t: 'select', l: 'Number of bugs', opts: [[1, '100%'], [.75, '75%'], [.5, '50%']] } ] },
];
function applySettings() { document.documentElement.style.setProperty('--ts', ST.text); applyAudio(); }
function settingsChanged() { saveSettings(); applySettings(); }
function buildSettings() {
  const root = $('setBody'); root.innerHTML = '';
  for (const grp of SCHEMA) {
    const fs = document.createElement('fieldset'), lg = document.createElement('legend'); lg.textContent = grp.g; fs.appendChild(lg);
    if (grp.note) { const n = document.createElement('p'); n.className = 'note'; n.textContent = grp.note; fs.appendChild(n); }
    for (const it of grp.items) {
      const id = 's_' + it.k, row = document.createElement('div'); row.className = 'row'; let desc = null;
      if (it.d) { desc = document.createElement('small'); desc.id = id + '_d'; desc.textContent = it.d; }
      if (it.t === 'toggle') { const lab = document.createElement('label'), inp = document.createElement('input'), sp2 = document.createElement('span'); inp.type = 'checkbox'; inp.id = id; inp.checked = !!ST[it.k]; if (desc) inp.setAttribute('aria-describedby', desc.id); inp.addEventListener('change', () => { ST[it.k] = inp.checked; settingsChanged(); }); sp2.textContent = it.l; lab.append(inp, sp2); row.appendChild(lab); }
      else if (it.t === 'range') { const lab = document.createElement('label'), out = document.createElement('output'), inp = document.createElement('input'); lab.className = 'lb'; lab.htmlFor = id; lab.textContent = it.l + ' '; out.htmlFor = id; lab.appendChild(out); inp.type = 'range'; inp.id = id; inp.min = it.min; inp.max = it.max; inp.step = it.step; const sc = it.sc || 1; inp.value = Math.round(ST[it.k] * sc); const upd = () => { out.textContent = it.fmt(+inp.value); inp.setAttribute('aria-valuetext', it.fmt(+inp.value)); }; upd(); if (desc) inp.setAttribute('aria-describedby', desc.id); inp.addEventListener('input', () => { ST[it.k] = +inp.value / sc; upd(); settingsChanged(); }); row.append(lab, inp); }
      else { const lab = document.createElement('label'), sel = document.createElement('select'); lab.className = 'lb'; lab.htmlFor = id; lab.textContent = it.l; sel.id = id; it.opts.forEach(([v, name], i) => { const o = document.createElement('option'); o.value = i; o.textContent = name; if (v === ST[it.k]) o.selected = true; sel.appendChild(o); }); if (desc) sel.setAttribute('aria-describedby', desc.id); sel.addEventListener('change', () => { ST[it.k] = it.opts[+sel.value][0]; settingsChanged(); }); row.append(lab, sel); }
      if (desc) row.appendChild(desc); fs.appendChild(row);
    }
    root.appendChild(fs);
  }
}
let setReturn = 'title';
function openSettings(from) { setReturn = from; buildSettings(); show('settings'); }
function closeSettings() { show(setReturn); }
function preset(o, msg) { Object.assign(ST, o); settingsChanged(); buildSettings(); announce(msg); }
$('setBtn1').onclick = () => openSettings('title'); $('setBtn2').onclick = () => openSettings('pause'); $('setBtn3').onclick = () => openSettings('over'); $('setBack').onclick = closeSettings;
$('preCalm').onclick = () => preset({ shake: 0, hitstop: false, flash: true }, 'Calm preset applied');
$('preVis').onclick = () => preset({ contrast: true, bright: .4, text: 1.25, nums: true, caps: true }, 'High-visibility preset applied');
$('preReset').onclick = () => { ST = defaultSettings(); settingsChanged(); buildSettings(); announce('Settings reset to device defaults'); };

/* ---------- input: one thumb to walk, a button to dash (tap it, or drag it to aim) ---------- */
function dashAuto() { const g = G; if (stick && (stick.dx || stick.dy)) startDash(stick.dx, stick.dy); else if (Math.hypot(g.vx, g.vz) > 1) startDash(g.vx, g.vz); else startDash(0, 0); }
function keyDash() { let ix = 0, iz = 0; if (keys.w || keys.arrowup) iz -= 1; if (keys.s || keys.arrowdown) iz += 1; if (keys.a || keys.arrowleft) ix -= 1; if (keys.d || keys.arrowright) ix += 1; if (ix || iz) startDash(ix, iz); else dashAuto(); }
addEventListener('keydown', e => { const k = e.key.toLowerCase(); keys[k] = true; if (state === 'play' && ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  if ((k === 'shift' || k === ' ') && state === 'play' && !e.repeat) keyDash();
  if ((k === 'p' || k === 'escape') && $('settings').classList.contains('on')) { closeSettings(); e.preventDefault(); } else if (k === 'p' || k === 'escape') togglePause();
  if (k === 'm') { muted = !muted; applyAudio(); announce(muted ? 'Sound off' : 'Sound on'); } });
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; if (state === 'play') togglePause(); });
addEventListener('keydown', e => { if (state === 'card' && e.key === 'Escape') closeCard(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') togglePause(); });
cv.addEventListener('pointerdown', e => { if (state !== 'play') return; const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, B = dashBtn(), P = pauseBtn(); try { cv.setPointerCapture(e.pointerId); } catch (er) { }
  if (Math.hypot(x - P.x, y - P.y) < P.r + 10) { togglePause(); return; }
  if (!dbtn && Math.hypot(x - B.x, y - B.y) < B.r * 1.25) { dbtn = { id: e.pointerId, ux: 0, uy: 0, d: 0, used: false }; return; }
  if (stick) return; if (ST.fixed) { const b = stickBase(); if (Math.hypot(x - b.x, y - b.y) > 120) return; stick = { id: e.pointerId, ox: b.x, oy: b.y, dx: 0, dy: 0, ux: 0, uy: 0, d: 0 }; return; }
  stick = { id: e.pointerId, ox: x, oy: y, dx: 0, dy: 0, ux: 0, uy: 0, d: 0 }; });
cv.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  if (dbtn && e.pointerId === dbtn.id) { const B = dashBtn(), dx = x - B.x, dy = y - B.y, d = Math.hypot(dx, dy); dbtn.d = d; if (d > 12) { dbtn.ux = dx / d; dbtn.uy = dy / d; } if (d > 36 && !dbtn.used) { dbtn.used = true; startDash(dbtn.ux, dbtn.uy); } return; }
  if (!stick || e.pointerId !== stick.id) return; const RM = 62; let dx = x - stick.ox, dy = y - stick.oy, d = Math.hypot(dx, dy);
  if (d > RM) { if (ST.fixed) { dx = dx / d * RM; dy = dy / d * RM; } else { stick.ox += dx / d * (d - RM); stick.oy += dy / d * (d - RM); dx = x - stick.ox; dy = y - stick.oy; } d = Math.hypot(dx, dy) || 1; }
  const on = d > ST.dead ? 1 : 0, ux = dx / (d || 1), uy = dy / (d || 1); stick.dx = ux * on; stick.dy = uy * on; stick.ux = ux; stick.uy = uy; stick.d = d; });
const endPtr = e => { if (dbtn && e.pointerId === dbtn.id) { if (!dbtn.used && state === 'play') { if (dbtn.d > 14) startDash(dbtn.ux, dbtn.uy); else dashAuto(); } dbtn = null; return; } if (stick && e.pointerId === stick.id) stick = null; };
cv.addEventListener('pointerup', endPtr); cv.addEventListener('pointercancel', endPtr); cv.addEventListener('contextmenu', e => e.preventDefault());

/* ---------- loop ---------- */
let emaDt = 16.7, lastQ = 0, fpsN = 0, fpsT = 0; const fpsEl = $('fps'), showFps = /[?&]fps/.test(location.search); if (showFps) fpsEl.style.display = 'block';
function step(dt) { const g = G; if (state !== 'play' && state !== 'title') return; let ts = PACE * (state === 'play' ? ST.tscale : 1); if (g.freeze > 0) { g.freeze -= dt; ts *= .06; } update(Math.max(1e-4, dt * ts)); camUpdate(dt); }
function frame(now) {
  requestAnimationFrame(frame); const raw = now - lastT, dt = clamp((raw || 0) / 1000, 0, .05); lastT = now;
  if (raw < 100 && raw > 0) { emaDt = emaDt * .96 + raw * .04; if (now - lastQ > 2500 && emaDt > 21 && Q > .5) { Q = Math.max(.5, Q - .17); lastQ = now; emaDt = 16.7; resize(); } }     // drop resolution rather than frames
  if (showFps) { fpsN++; if (now - fpsT > 500) { fpsEl.textContent = Math.round(fpsN * 1000 / (now - fpsT)) + ' fps  q' + Q.toFixed(2) + '  bugs ' + G.en.length + '  ' + glc.width + 'x' + glc.height; fpsN = 0; fpsT = now; } }
  step(dt); render();
}
/* hooks for automated checks: step the game by a fixed amount and read its state as text */
window.advanceTime = ms => { for (let t = 0; t < ms; t += 1000 / 60) step(1 / 60); render(); };
window.render_game_to_text = () => { const g = G; return JSON.stringify({ state, night: g.night, items: g.items.map(id => id + g.lv[id]), drops: g.drops.length, t: +g.t.toFixed(2), hp: Math.round(g.hp), kills: g.kills, pos: [+g.x.toFixed(2), +g.z.toFixed(2)], vel: [+g.vx.toFixed(2), +g.vz.toFixed(2)], dash: g.dash ? +g.dash.t.toFixed(2) : null, dashCd: +Math.max(0, g.dcd).toFixed(2), target: !!g.tgt, bugs: g.en.map(e => ({ x: +e.x.toFixed(1), z: +e.z.toFixed(1), st: e.state, hp: Math.round(e.hp) })) }); };

applySettings(); resize(); newGame(true); titleInfo(); cv.style.visibility = 'hidden';
try { GLOK = initGL(glc); } catch (e) { GLOK = false; console.error(e); }
if (!GLOK) { show('nogl'); } else requestAnimationFrame(t => { lastT = t; frame(t); });
