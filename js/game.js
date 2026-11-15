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
const DEF = { shake: 1, hitstop: true, flash: false, gore: true, bright: 0, contrast: false, text: 1, nums: false, caps: false, vol: 1, sfxv: 1, musv: 1, haptics: true, hand: 'right', btn: 1, fixed: false, dead: 8, tscale: 1, dmg: 1, espd: 1, ecount: 1 };
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

/* ---------- sound: everything is synthesised ----------
   Effects go out dry and through a short, dark reverb. Under them runs a bed that follows how much danger the walker is in:
   wind, a low drone, a dissonant layer that fades up, and a heartbeat that quickens. */
let AC = null, master = null, sfxBus = null, musBus = null, noiseBuf = null, muted = false, whine = null, whineG = null, lastHitSnd = 0, amb = null, danger = 0;
function initAudio() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain(); sfxBus = AC.createGain(); musBus = AC.createGain();
    const comp = AC.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 5; master.connect(comp); comp.connect(AC.destination);
    sfxBus.connect(master); musBus.connect(master);
    const len = Math.floor(AC.sampleRate * 1.9), ir = AC.createBuffer(2, len, AC.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); let lp = 0; for (let i = 0; i < len; i++) { const k = i / len; lp += ((Math.random() * 2 - 1) - lp) * (.5 - k * .35); d[i] = lp * Math.pow(1 - k, 2.6); } }
    const conv = AC.createConvolver(), send = AC.createGain(), ret = AC.createGain(); conv.buffer = ir; send.gain.value = .3; ret.gain.value = .9; sfxBus.connect(send); send.connect(conv); conv.connect(ret); ret.connect(master);
    noiseBuf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate); const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    whine = AC.createOscillator(); whine.type = 'sawtooth'; whine.frequency.value = 60; const wl = AC.createBiquadFilter(); wl.type = 'lowpass'; wl.frequency.value = 900; whineG = AC.createGain(); whineG.gain.value = 0; whine.connect(wl); wl.connect(whineG); whineG.connect(sfxBus); whine.start();
    const osc = (type, f, dest) => { const o = AC.createOscillator(); o.type = type; o.frequency.value = f; o.connect(dest); o.start(); return o; };
    const wind = AC.createBufferSource(), wf = AC.createBiquadFilter(), wg = AC.createGain(), lfoG = AC.createGain(); wind.buffer = noiseBuf; wind.loop = true; wf.type = 'bandpass'; wf.frequency.value = 320; wf.Q.value = .7; wg.gain.value = 0; wind.connect(wf); wf.connect(wg); wg.connect(musBus); wind.start(); lfoG.gain.value = 170; osc('sine', .07, lfoG); lfoG.connect(wf.frequency);
    const df = AC.createBiquadFilter(), dg = AC.createGain(); df.type = 'lowpass'; df.frequency.value = 130; dg.gain.value = 0; osc('sawtooth', 41.2, df); osc('sawtooth', 41.55, df); osc('sawtooth', 61.9, df); df.connect(dg); dg.connect(musBus); dg.connect(send);
    const tg = AC.createGain(); tg.gain.value = 0; osc('sine', 110, tg); osc('sine', 116.5, tg); osc('triangle', 220.8, tg); tg.connect(musBus); tg.connect(send);
    amb = { wg, df, dg, tg }; applyAudio(); startPulse();
  } catch (e) { AC = null; }
}
function applyAudio() { if (!AC) return; master.gain.value = muted ? 0 : .5 * ST.vol; sfxBus.gain.value = ST.sfxv; musBus.gain.value = ST.musv; }
function tone(f, d, type, v, slide, at) { if (!AC || muted) return; at = at || AC.currentTime; const o = AC.createOscillator(), g = AC.createGain(); o.type = type || 'square'; o.frequency.setValueAtTime(f, at); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), at + d); g.gain.setValueAtTime(v || .1, at); g.gain.exponentialRampToValueAtTime(.001, at + d); o.connect(g); g.connect(sfxBus); o.start(at); o.stop(at + d + .03); }
function noise(d, v, fc, type, at, sweep) { if (!AC || muted) return; at = at || AC.currentTime; const s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const f = AC.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.setValueAtTime(fc || 1200, at); if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(40, fc + sweep), at + d); const g = AC.createGain(); g.gain.setValueAtTime(v || .2, at); g.gain.exponentialRampToValueAtTime(.001, at + d); s.connect(f); f.connect(g); g.connect(sfxBus); s.start(at, Math.random()); s.stop(at + d + .03); }
/* a voice with a wobbling pitch: screeches, chitters, the brood mother's horn */
function fm(fc, fmod, idx, d, v, at, slide) { if (!AC || muted) return; at = at || AC.currentTime; const c = AC.createOscillator(), m = AC.createOscillator(), mg = AC.createGain(), g = AC.createGain(); m.frequency.value = fmod; mg.gain.value = idx; m.connect(mg); mg.connect(c.frequency); c.frequency.setValueAtTime(fc, at); if (slide) c.frequency.exponentialRampToValueAtTime(Math.max(30, fc + slide), at + d); g.gain.setValueAtTime(v, at); g.gain.exponentialRampToValueAtTime(.001, at + d); c.connect(g); g.connect(sfxBus); c.start(at); m.start(at); c.stop(at + d + .03); m.stop(at + d + .03); }
/* struck metal: a few partials that are not in tune with each other */
function clank(f, d, v, at) { for (const m of [1, 2.76, 5.4]) tone(f * m, d / (1 + m * .25), 'square', v / m, 0, at); }
const vr = () => .92 + Math.random() * .16;
const buzz = ms => { if (ST.haptics && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) { } };
const sfx = {
  shot() { const t = AC && AC.currentTime; tone(105 * vr(), .26, 'sine', .3, -66); tone(60, .3, 'sine', .16, -18); tone(210 * vr(), .08, 'sawtooth', .07, -140); noise(.2, .24, 1500 * vr(), 'lowpass', 0, -1300); noise(.035, .16, 6500, 'highpass'); clank(1300 * vr(), .05, .03, t + .11); tone(2300 * vr(), .025, 'triangle', .02, 0, t + .45); tone(3100, .02, 'triangle', .012, 0, t + .5); },
  thwack() { noise(.11, .32, 900 * vr(), 'lowpass', 0, -650); noise(.05, .12, 2600, 'bandpass', 0, -1500); tone(140 * vr(), .08, 'sawtooth', .09, -85); },
  hit() { const n = performance.now(); if (n - lastHitSnd < 45) return; lastHitSnd = n; noise(.05, .1, 1500 * vr(), 'bandpass', 0, -900); },
  kill() { noise(.2, .24, 700 * vr(), 'lowpass', 0, -520); tone(190 * vr(), .13, 'sawtooth', .06, -130); fm(520 * vr(), 90, 300, .12, .035, 0, -300); },
  step() { const t = AC && AC.currentTime; tone(58 * vr(), .11, 'sine', .26, -22); noise(.08, .12, 260, 'lowpass'); clank(420 * vr(), .05, .035); noise(.12, .025, 4200, 'highpass', t + .05); },
  dash() { noise(.5, .4, 400, 'bandpass', 0, 3600); tone(62, .4, 'sawtooth', .2, 260); tone(44, .34, 'sine', .4, -16); noise(.2, .18, 7000, 'highpass'); buzz(18); },
  skid() { noise(.3, .18, 2400, 'highpass', 0, -1500); tone(900 * vr(), .2, 'sawtooth', .02, -500); },
  ram() { tone(50, .28, 'sine', .5, -24); noise(.24, .45, 650, 'lowpass', 0, -480); clank(260 * vr(), .12, .1); buzz(30); },
  hurt() { const t = AC && AC.currentTime; clank(180 * vr(), .25, .16); noise(.3, .36, 500, 'lowpass', 0, -300); tone(86, .3, 'sawtooth', .16, -46); tone(740, .08, 'square', .04, 0, t + .12); buzz(40); },
  tell() { fm(700 * vr(), 55, 420, .32, .06, 0, 500); noise(.3, .05, 2600, 'bandpass', 0, 2400); },
  lunge() { fm(1200 * vr(), 80, 600, .14, .05, 0, -700); noise(.14, .1, 2400, 'bandpass', 0, -1800); },
  ready() { const t = AC && AC.currentTime; clank(880, .08, .035); tone(1320, .1, 'triangle', .04, 0, t + .05); },
  swarm() { const t = AC && AC.currentTime; tone(48, .9, 'sine', .22, -8); for (let i = 0; i < 6; i++) fm(900 + Math.random() * 600, 70, 500, .18, .035, t + i * .07, 300); },
  item(r) { const t = AC && AC.currentTime; clank(520, .12, .08); if (r === 'l') { [262, 392, 523, 659, 784, 1047].forEach((f, i) => tone(f, .5, 'triangle', .1, 0, t + i * .09)); tone(65, .9, 'sine', .3, -10); buzz(60); return; } const b = r === 'e' ? 523 : r === 'r' ? 440 : 392, n = r === 'e' ? 4 : r === 'r' ? 3 : 2; for (let i = 0; i < n; i++) tone(b * [1, 1.25, 1.5, 2][i], .22, 'triangle', .09, 0, t + .05 + i * .08); buzz(25); },
  repair() { const t = AC && AC.currentTime; tone(520, .1, 'sine', .08, 260); tone(780, .14, 'sine', .06, 0, t + .08); },
  spit() { fm(300 * vr(), 40, 200, .22, .07, 0, 400); noise(.2, .1, 900, 'bandpass', 0, 900); },
  splat() { noise(.28, .22, 560, 'lowpass', 0, -340); noise(.5, .035, 5200, 'highpass'); },
  mortar() { const t = AC && AC.currentTime; tone(130, .2, 'sine', .4, -80); noise(.14, .25, 480, 'lowpass'); tone(1400, .6, 'sine', .012, -800, t + .1); },
  zap() { noise(.14, .16, 3400, 'highpass', 0, -1600); fm(1400 * vr(), 220, 900, .1, .05, 0, -900); },
  pew() { tone(660 * vr(), .05, 'square', .03, -320); noise(.03, .04, 5000, 'highpass'); },
  win() { const t = AC && AC.currentTime; [196, 294, 392, 494, 587].forEach((f, i) => tone(f, 1.2, 'triangle', .08, 0, t + i * .14)); tone(49, 1.6, 'sine', .3, -4); },
  blast() { tone(72, .3, 'sine', .34, -36); noise(.36, .36, 1000, 'lowpass', 0, -850); noise(.06, .14, 5000, 'highpass'); },
  boss() { fm(55, 27, 60, 1.7, .28, 0, -10); tone(82, 1.3, 'sawtooth', .1, -22); noise(1.3, .12, 800, 'bandpass', 0, 900); buzz(80); },
  boom() { noise(.9, .5, 900, 'lowpass', 0, -800); tone(52, .8, 'sine', .45, -30); clank(120, .5, .12); buzz(120); },
  ric() { const n = performance.now(); if (n - lastHitSnd < 60) return; lastHitSnd = n; clank(900 * vr(), .09, .06); tone(2400 * vr(), .12, 'sine', .03, 1500); },
  /* the yard's klaxon: n two-tone hoots, the last one sagging as the power does */
  alarm(n) { const t = AC && AC.currentTime; if (!t) return; for (let i = 0; i < n; i++) { const last = i === n - 1; tone(i % 2 ? 392 : 523, .3, 'square', .05, last ? -160 : 0, t + i * .36); tone(i % 2 ? 196 : 261, .3, 'sawtooth', .04, last ? -80 : 0, t + i * .36); } },
  chit() { noise(.014, .04, 5200 + Math.random() * 2600, 'highpass'); },
  burrow() { noise(.5, .2, 180, 'lowpass'); tone(40, .5, 'sine', .2, -8); clank(140 * vr(), .2, .05); },
};
/* the bed follows the walker's danger; the heartbeat is scheduled a little ahead so it never stutters */
function audioTick(g, dt) { if (!AC || !amb) return; let near = 0; for (const e of g.en) if (!e.dead && (e.x - g.x) ** 2 + (e.z - g.z) ** 2 < 100) near++;
  const want = state !== 'play' || g.demo ? 0 : clamp(near / 12 + (g.hp < 35 ? .35 : 0) + (g.bossUp ? .5 : 0) + tokens * .06, 0, 1); danger += (want - danger) * Math.min(1, dt * 1.2);
  const on = state === 'play' || state === 'title' || state === 'choose' ? 1 : .4, t = AC.currentTime;
  amb.wg.gain.setTargetAtTime((.05 + danger * .03) * on, t, .2); amb.dg.gain.setTargetAtTime((.07 + danger * .05) * on, t, .2); amb.df.frequency.setTargetAtTime(110 + danger * 240, t, .3); amb.tg.gain.setTargetAtTime(danger * danger * .035 * on, t, .3);
  if (state === 'play' && near && Math.random() < dt * Math.min(near, 10) * 1.3) sfx.chit(); }
function startPulse() { let next = AC.currentTime + .5;
  setInterval(() => { if (!AC) return; while (next < AC.currentTime + .3) { if (!muted && state === 'play' && G && !G.dead && !G.won) { const v = .1 + danger * .22, o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(54, next); o.frequency.exponentialRampToValueAtTime(34, next + .16); g.gain.setValueAtTime(v, next); g.gain.exponentialRampToValueAtTime(.001, next + .18); g.gain.setValueAtTime(v * .65, next + .19); g.gain.exponentialRampToValueAtTime(.001, next + .36); o.connect(g); g.connect(musBus); o.start(next); o.stop(next + .4); }
      next += lerp(1.25, .46, danger); } }, 100); }

/* ---------- tuning ---------- */
let HIP = 1.85, HIPW = 1.4, L1 = 1.2, L2 = 1.25, REACH = 2.38, STRIDE = 4.3, SWING = .42;       // the rig. let, not const, so a blockout can try other proportions
const DASH = { wind: .08, burst: .2, rec: .3, v: 31 };
const BUGV = 4.5, TELL = .5, LUNGE_T = .3, LUNGE_V = 17, LANE = LUNGE_T * LUNGE_V + .8, PACE = .9, RUN = 180 * PACE;      // the whole game runs at nine tenths speed; RUN is when the brood mother comes, in game seconds: five real minutes in; the night ends when she dies. (Old note: a run lasts six real minutes)
const YEL = [.78, .47, .05], YEL2 = [.5, .3, .04], DRK = [.055, .06, .07], STL = [.24, .25, .28], RUST = [.24, .1, .045], CONC = [.3, .29, .27], BRASS = [.8, .55, .15];
/* FB scales every shake that is not the cannon. Shake is the square of this build-up, so .7 is about half the movement. */
const FB = .7, SHELL = 3.8, CHITM = [.12, .042, .022], GROW = [0, 2, 4, 7, 10, 13, 17], FLESH = [.32, .07, .06], ALLYC = [.03, .07, .1], ALLYC2 = [.06, .26, .36], GUARDC = [.04, .034, .034], GUARDC2 = [.1, .078, .064], GUARDF = [.075, .06, .052], SPITC = [.12, .13, .05], SPITC2 = [.3, .32, .1], CHIT = [.05, .032, .03], CHIT2 = [.26, .085, .03], BONE = [.6, .52, .4], ICH = [.32, .75, .08];

/* ---------- salvage: ten cards in five exclusive pairs ----------
   A salvage crate stops the game and offers the two cards of one pair. Hardware fills at most three slots, from four
   pairs, so one role goes unfilled every run. The fifth pair is a living organ: stronger, with a stated price, and it can
   be refused. Every card says what changes, what it is best against, and what it costs. Nothing multiplies everything:
   each weapon has its own numbers, written here once. */
const CARDS = [
  { id: 'pen', grp: 'cannon', n: 'Penetrator Kit', does: 'Shells pass through three bugs and through a brood guard\'s armour.', best: 'Lines of bugs, and guards head-on.', cost: 'No blast: little help against a spread-out pack.', f: s => { s.pierce = 3; s.ap = 1; } },
  { id: 'breach', grp: 'cannon', n: 'Breach Shell', does: 'Every shell bursts where it hits.', best: 'Tight packs.', cost: 'Fires a fifth slower and stops at the first bug.', f: s => { s.burst = 1; s.pierce = 0; s.rate *= .8; } },
  { id: 'mortar', grp: 'support', n: 'Shoulder Mortar', does: 'Lobs a shell into the thickest group every three seconds.', best: 'Groups at a distance.', cost: 'Cannot land within four paces of you.', f: s => { s.mortar = 1; } },
  { id: 'coil', grp: 'support', n: 'Arc Coil', does: 'Lightning jumps through four bugs close to you and breaks a spitter\'s wind-up.', best: 'Being crowded, and spitters.', cost: 'Reaches barely past the ram.', f: s => { s.coil = 4; } },
  { id: 'ramc', grp: 'dash', n: 'Ram Charger', does: 'A bigger, toothed ram head on a second cylinder. The ram goes half as far again, and a kill gives half of it back.', best: 'Reaching one that is stuck, and crushing it.', cost: 'A longer ram is a longer slide when you miss.', f: s => { s.chain = 1; } },
  { id: 'burn', grp: 'dash', n: 'Burn Exhaust', does: 'Twin burners. The ram leaves a wall of fire behind you for three and a half seconds.', best: 'Cutting off whatever is behind you.', cost: 'The ram goes no further.', f: s => { s.burn = 3.5; } },
  { id: 'lamp', grp: 'utility', n: 'Lamp Focus', does: 'A tight, hot beam. Bugs caught in it take two fifths more from the cannon.', best: 'One dangerous target.', cost: 'You see much less to either side.', f: s => { s.focus = 1; } },
  { id: 'plate', grp: 'utility', n: 'Reactive Plate', does: 'Stops one hit every ten seconds and throws nearby bugs back.', best: 'Mistakes, and being surrounded.', cost: 'Heavy: you walk a little slower.', f: s => { s.shock = 10; s.speed *= .92; } },
  { id: 'graft', grp: 'organ', n: 'Spitter Graft', does: 'A grown limb spits acid at a second target, and the pool burns bugs.', best: 'Holding a lane while the cannon is busy.', cost: 'The machine turns sluggish: slow to get moving, slow to turn.', f: s => { s.graft = 1; s.accel = 5.5; s.turn = 4.2; } },
  { id: 'molt', grp: 'organ', n: 'Emergency Molt', does: 'Once, the hit that would wreck you sheds a shell: a blast, and two fifths of your hull.', best: 'Surviving one bad mistake.', cost: 'After it, the cannon fires at half speed for twelve seconds.', f: s => { s.molt = 1; } },
];
const CARD = {}; for (const c of CARDS) CARD[c.id] = c; const ITEM = CARD, HW_SLOTS = 3, ICONID = { pen: 'pierce', breach: 'boom', ramc: 'chain', lamp: 'sear', plate: 'shock' }, GRPNAME = { cannon: 'Cannon', support: 'Heavy support', dash: 'Dash', utility: 'Utility', organ: 'Alien organ' };
const baseStats = () => ({ pow: 12, dmg: 0, rate: 2.2, range: 11, speed: 6, accel: 9, turn: 4.5, dashCd: 2.4, maxhp: 100, ramDmg: 110, pierce: 1, spread: .02, magnet: 5, ap: 0, burst: 0, focus: 0, mortar: 0, coil: 0, burn: 0, shock: 0, chain: 0, molt: 0, graft: 0, leech: 0, drone: 0, boom: 0, ichor: 0, sear: 0, heart: 0, stride: 0, reaper: 0 });
function recalc(g) { const s = baseStats(); for (const id of g.items) CARD[id].f(s); s.dmg = s.pow * SHELL; g.s = s; }
let offer = null, offerAt = 0;
/* the next hardware pair, in the order this run's seed shuffled them; null when the slots are full */
function nextPair(g) { if (g.items.filter(id => CARD[id].grp !== 'organ').length >= HW_SLOTS) return null; for (const grp of g.order) if (!g.items.some(id => CARD[id].grp === grp)) return CARDS.filter(c => c.grp === grp); return null; }
function openChoice(kind) { const g = G, cards = kind === 'organ' ? CARDS.filter(c => c.grp === 'organ') : nextPair(g); if (!cards) { g.hp = Math.min(g.s.maxhp, g.hp + 15); sfx.repair(); return; }
  offer = { kind, cards }; offerAt = performance.now(); state = 'choose'; stick = null; dbtn = null; const org = kind === 'organ';
  $('chT').textContent = org ? 'Alien organ' : cards[0].grp === 'dash' ? 'Salvage: the ram' : 'Salvage: ' + GRPNAME[cards[0].grp].toLowerCase(); $('chSub').textContent = org ? 'It is alive. Graft one on, or leave it.' : 'Fit one. The other is gone.'; $('choose').classList.toggle('org', org); $('chNo').hidden = !org;
  cards.forEach((c, i) => { const b = $('ch' + i), col = org ? '#b6e04a' : '#f2b01e'; b.querySelector('.nm').textContent = c.n; b.querySelector('.does').textContent = c.does; b.querySelector('.best').textContent = c.best; b.querySelector('.cost').textContent = c.cost; const x = b.querySelector('canvas').getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, 96, 96); x.strokeStyle = col; x.lineWidth = 3; x.beginPath(); x.arc(48, 48, 44, 0, TAU); x.stroke(); icon(x, ICONID[c.id] || c.id, 48, 48, 26, col); b.disabled = true; });
  $('chNo').disabled = true; setTimeout(() => { if (state !== 'choose') return; $('ch0').disabled = $('ch1').disabled = $('chNo').disabled = false; try { $('ch0').focus({ preventScroll: true }); } catch (e) { } }, 450);       // a moment before it will take a tap, so the thumb that was steering cannot choose by accident
  show('choose'); announce((org ? 'Alien organ. Graft one on, or leave it. ' : 'Salvage. Fit one of two. ') + cards.map((c, i) => `Option ${i + 1}: ${c.n}. ${c.does} Best against: ${c.best} Cost: ${c.cost}`).join(' ')); }
function choose(i) { if (state !== 'choose' || !offer || performance.now() - offerAt < 400) return; const g = G, c = i < 0 ? null : offer.cards[i]; if (i >= 0 && !c) return; g.choices.push(c ? c.id : 'declined'); offer = null; state = 'play'; show(''); lastT = performance.now();
  if (!c) { announce('Left it.'); return; } g.items.push(c.id); recalc(g); g.fitT[c.id] = g.t; g.weldT = .8; g.crouch.v += 4.5; g.itemFx = 1; g.itemCol = c.grp === 'organ' ? [.6, .9, .2] : [1, .7, .15]; sfx.item(c.grp === 'organ' ? 'e' : 'r'); announce(c.n + ' fitted.'); }
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
function inBeam(g, x, z) { const dx = x - g.x, dz = z - g.z, d = Math.hypot(dx, dz); return d < 19 && d > .5 && (dx * Math.sin(g.lamp) + dz * Math.cos(g.lamp)) / d > (g.s.focus ? .9 : .8); }
function blast(x, z, r, dmg, col) { const g = G; g.blasts.push({ x, z, r, dmg, col: col || [1, .55, .15], t: .07 }); }       // goes off a moment later, so chains ripple instead of all landing at once
function doBlast(b) { const g = G; for (const e of g.en) { if (e.dead) continue; const dx = e.x - b.x, dz = e.z - b.z, d = Math.hypot(dx, dz) || 1; if (d < b.r + .5 * e.s) { e.kx += dx / d * 7; e.kz += dz / d * 7; hurtBug(e, b.dmg, dx / d, dz / d); } }
  const c = b.col; for (let i = 0; i < 9; i++) { const a = rand(0, TAU), v = rand(1, 5); part(0, b.x, rand(.4, 1), b.z, Math.sin(a) * v, rand(.5, 3), Math.cos(a) * v, rand(.2, .4), b.r * rand(.35, .6), c[0], c[1], c[2], .8, 0, 3, -1); } sparks(b.x, .6, b.z, 0, 0, 8, c[0], c[1], c[2], 9); mark(b.x, b.z, b.r * .8, b.r * .8, 0, 0, 0, 0, 0, .5, 8);
  DL.push({ x: b.x, z: b.z, sx: .4, sz: .4, rot: 0, kind: 1, r: c[0], g: c[1], b: c[2], a: .85, t: 0, life: .26, seed: 0, grow: b.r * 5 }); for (let i = 0; i < 3; i++) part(1, b.x + rand(-.5, .5) * b.r * .4, rand(.4, .9), b.z + rand(-.5, .5) * b.r * .4, rand(-.6, .6), rand(1, 2.2), rand(-.6, .6), rand(.8, 1.3), b.r * .3, .13, .12, .11, .4, 0, 1.2, b.r * .5);
  if (DB.length < 110) for (let i = 0; i < 3; i++) { const a = rand(0, TAU), v = rand(3, 7), sz = rand(.1, .24); debris(MESH.cube, b.x, .2, b.z, sz, sz * .6, sz, CONC, 0, Math.sin(a) * v, rand(5, 10), Math.cos(a) * v, rand(1.4, 2.2)); }
  g.pulse = { x: b.x, z: b.z, c, t: 1 }; g.trauma = Math.min(1, g.trauma + (.04 + b.r * .035) * FB); sfx.blast(); }

/* ---------- the shearback: one predator, done properly ----------
   Long, low, four thick legs, two bone blades longer than its body. It circles at seven metres in sprints and dead stops. Then:
   ANTICIPATION 0.72 s: it stops, drops its rear, and throws both blades out wide. The pose is the warning; the lane on the ground shows only for the last third of a second, when the line is locked.
   STRIKE 0.2 s: a five-metre pounce, blades scissoring shut.  RECOVERY 0.9 s: blades buried in the ground, body stretched out. This is the opening.
   It takes nine shells. Each one shoves it back half a metre and twists the struck shoulder away, but never stops a wind-up: only the ram does that.
   At a bit over half health it loses a blade, which spins off and sticks in the ground; at a quarter, the other.
   RAM while it circles: a third of its health, thrown four metres, a tumble. RAM during its wind-up: flipped on its back for 1.8 s, a blade snapped. RAM while it is stuck, down or under half: crushed. */
const SHEAR = { hp: 410, tell: .72, lock: .34, pounce: .2, pv: 25, stuck: .9, dmg: 14 }, PLUM = [.03, .034, .058], PLUM2 = [.052, .058, .098], PLUMD = [.022, .024, .04], BLADEC = [.84, .79, .64];
const SS = 1.25, SH_HOME = [[1.2, 1.0], [-1.2, 1.0], [1.2, -.95], [-1.2, -.95]], popc = a => (a & 1) + (a >> 1 & 1);
function spawnShear(x, z, a) { const g = G, e = { shear: true, x, z, a, vx: 0, vz: 0, kx: 0, kz: 0, hp: SHEAR.hp, mhp: SHEAR.hp, s: 1.7, state: 'emerge', st: 1.5, cd: rand(1.4, 2.2), arms: 3, flinch: 0, fa: 0, pose: 0, strike: 0, flip: 0, bias: Math.random() < .5 ? -1 : 1, sprint: .8, pause: .4, ldx: 0, ldz: 1, la: 0, hitP: false, flash: 0, phase: Math.random(), legs: null, dead: false, stag: 0, emer: 0, big: false, locked: false }; g.en.push(e); return e; }
function shearLose(e, dx, dz) { const g = G, c = Math.cos(e.a), sn = Math.sin(e.a), side = dx * c - dz * sn > 0 ? 2 : 1, bit = e.arms & side ? side : e.arms & 1 ? 1 : 2; if (!(e.arms & bit)) return; e.arms &= ~bit; const q = bit === 1 ? 1 : -1, bx = e.x + c * q * 1.2, bz = e.z - sn * q * 1.2;
  debris(MESH.blade, bx, 1.4, bz, 2.2, 2.4, 3.7, BLADEC, 0, dx * 5 + c * q * 4, 8, dz * 5 - sn * q * 4, .75); g.relics.push({ x: bx + dx * 3.2 + c * q * 2.6, z: bz + dz * 3.2 - sn * q * 2.6, rot: rand(0, TAU), t: -.72, life: 9 }); sparks(bx, 1.2, bz, dx, dz, 6, 1, .9, .7, 9); sfx.ric(); }       /* a blade shears off at the elbow, spins away and sticks upright where it lands */
function hurtShear(e, dmg, dx, dz, ram, heavy) { const g = G; let crushed = false; e.flash = .09;
  if (ram) { const open = e.state === 'stuck' || e.state === 'down' || e.hp < e.mhp * .5; if (g.dash) g.dash.slow = .45; if (ST.hitstop) g.freeze = Math.max(g.freeze, open ? .09 : .07); g.trauma = Math.min(1, g.trauma + .4 * FB); g.crouch.v += 6; dust(e.x, e.z, 8, 5, .6);
    if (open) { e.hp = 0; crushed = true; } else if (e.state === 'tell') { e.state = 'down'; e.st = 1.8; e.cd = 1.2; e.hp -= e.mhp * .2; e.kx += dx * 12; e.kz += dz * 12; e.locked = false; shearLose(e, dx, dz); }
    else { e.hp -= e.mhp * .35; e.state = 'tumble'; e.st = .6; e.cd = 1.2; e.kx += dx * 28; e.kz += dz * 28; } }
  else { e.hp -= dmg * (e.state === 'down' ? 2 : e.state === 'stuck' ? 1.5 : 1); if (heavy) { e.kx += dx * 4.6; e.kz += dz * 4.6; e.flinch = .16; e.fa = dx * Math.cos(e.a) - dz * Math.sin(e.a) > 0 ? 1 : -1; sfx.thwack();
      const px = e.x - dx * .5, pz = e.z - dz * .5; sparks(px, 1.1, pz, -dx, -dz, 7, 1, .85, .55, 11); part(0, px, 1.1, pz, 0, 0, 0, .1, 1.9, 1, .8, .5, .9, 0, 0, 3); for (let i = 0; i < 3; i++) part(0, px, rand(.7, 1.1), pz, dx * rand(3, 9) + rand(-2, 2), rand(1, 4), dz * rand(3, 9) + rand(-2, 2), rand(.25, .4), rand(.12, .2), .12, .07, .1, .8, 15, .4, -.2);
      if (ST.gore) debris(MESH.oct, px, 1, pz, rand(.2, .34), rand(.08, .14), rand(.24, .4), PLUM, -.7, dx * rand(5, 10) + rand(-3, 3), rand(3, 7), dz * rand(5, 10) + rand(-3, 3), rand(1.4, 2.2)); } }
  if (e.hp > 0) { const want = e.hp < e.mhp * .25 ? 0 : e.hp < e.mhp * .58 ? 1 : 2; while (popc(e.arms) > want) shearLose(e, dx, dz); return; }
  /* dead: what is left is carried down the line of the hit and stays there for a while */
  e.dead = true; g.kills++; if (crushed) g.crushed++; sfx.kill(); g.corpses.push({ x: e.x, z: e.z, a: e.a, vx: dx * (ram ? 5 : 9), vz: dz * (ram ? 5 : 9), t: 0, flat: crushed, arms: e.arms, roll: Math.random() < .5 ? -1 : 1 });
  if (crushed) { sfx.boom(); for (let i = 0; i < 7; i++) debris(i % 2 ? MESH.oct : MESH.shell, e.x + rand(-.6, .6), rand(.4, 1), e.z + rand(-.6, .6), rand(.25, .5), rand(.1, .2), rand(.3, .6), i % 3 ? PLUM : PLUMD, -.7, dx * rand(2, 9) + rand(-6, 6), rand(4, 9), dz * rand(2, 9) + rand(-6, 6), rand(1.6, 2.6)); }
  if (ST.gore) mark(e.x + dx * .8, e.z + dz * .8, crushed ? 2.2 : 1.3, crushed ? 2.2 : 1.9, Math.atan2(dx, dz), 3, .06, .035, .05, .55, 7, rand(0, 9)); g.enc.last = e; }
function updShear(e, dt) { const g = G, dx = g.x - e.x, dz = g.z - e.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d, lame = popc(e.arms) === 0 ? .6 : 1; let mvx = 0, mvz = 0, face = Math.atan2(ux, uz), turn = 7; e.flash -= dt; e.flinch = Math.max(0, e.flinch - dt);       /* e.st and e.cd are counted down by updBug before it hands over */
  if (e.state === 'emerge') { mvx = ux * 3.4; mvz = uz * 3.4; if (e.st <= 0) e.state = 'stalk'; }
  else if (e.state === 'stalk') { e.sprint -= dt; if (e.sprint < -e.pause) { e.sprint = rand(.7, 1.2); e.pause = rand(.3, .55); if (Math.random() < .3) e.bias = -e.bias; }
    if (e.sprint > 0) { const v = 5.6 * lame * ST.espd, rad = d > 6.4 ? 1 : d < 4.8 ? -.8 : 0, tan = rad ? .5 : 1; mvx = (ux * rad - uz * e.bias * tan) * v; mvz = (uz * rad + ux * e.bias * tan) * v; }
    let busy = 0; for (const o of g.en) if (o.shear && (o.state === 'tell' || o.state === 'pounce')) busy++;
    if (d < 7.6 && e.cd <= 0 && busy < g.enc.cap && !g.dead && !g.won && !g.demo) { e.state = 'tell'; e.st = SHEAR.tell; e.locked = false; sfx.tell(); } }
  else if (e.state === 'tell') { turn = 9; if (!e.locked && e.st <= SHEAR.lock) { e.locked = true; const px = g.x + g.vx * .1 - e.x, pz = g.z + g.vz * .1 - e.z, l = Math.hypot(px, pz) || 1; e.ldx = px / l; e.ldz = pz / l; e.la = Math.atan2(e.ldx, e.ldz); } if (e.locked) face = e.la;
    if (e.st <= 0) { e.state = 'pounce'; e.st = SHEAR.pounce; e.hitP = false; sfx.lunge(); } }
  else if (e.state === 'pounce') { face = e.la; turn = 30; mvx = e.ldx * SHEAR.pv; mvz = e.ldz * SHEAR.pv; e.vx = mvx; e.vz = mvz; const al = dx * e.ldx + dz * e.ldz, lat = Math.abs(dx * e.ldz - dz * e.ldx); if (!e.hitP && al > -1 && al < 6.4 && lat < 1.75) { e.hitP = true; hurtPlayer(popc(e.arms) ? SHEAR.dmg : 10, e.ldx, e.ldz); } if (al < 6.1 && al > 0 && lat < 2.4) {       /* it hits what is on its line, and only that: one step to the side is enough */ e.vx = e.vz = mvx = mvz = 0; e.st = Math.min(e.st, .03); }
    if (e.st <= 0) { e.state = 'stuck'; e.st = popc(e.arms) ? SHEAR.stuck : .5; e.vx = e.vz = 0; dust(e.x + e.ldx * 2, e.z + e.ldz * 2, 6, 3, .4); if (popc(e.arms)) { sparks(e.x + e.ldx * 2.6, .1, e.z + e.ldz * 2.6, -e.ldx, -e.ldz, 6, 1, .85, .6, 8); mark(e.x + e.ldx * 2.4, e.z + e.ldz * 2.4, .12, 1.0, e.la, 2, 0, 0, 0, .5, 8); } } }
  else { face = e.a; if (e.st <= 0) { e.cd = Math.max(e.cd, rand(2.4, 3.4)); e.state = 'stalk'; e.sprint = .9; } }       /* stuck, tumbling, or on its back */
  e.stag = e.state === 'stuck' || e.state === 'down' ? Math.max(.01, e.st) : 0;
  const k = 1 - Math.exp(-dt * 9); e.vx += (mvx - e.vx) * k; e.vz += (mvz - e.vz) * k; const kd = Math.exp(-dt * 7); e.kx *= kd; e.kz *= kd; e.x += (e.vx + e.kx) * dt; e.z += (e.vz + e.kz) * dt; pushOut(e, 1.1); e.a += clamp(angDiff(e.a, face), -turn * dt, turn * dt);
  e.pose += ((e.state === 'tell' ? 1 : 0) - e.pose) * Math.min(1, dt * (e.state === 'tell' ? 7 : 12)); e.strike += ((e.state === 'pounce' || e.state === 'stuck' ? 1 : 0) - e.strike) * Math.min(1, dt * (e.state === 'pounce' ? 26 : 7)); e.flip += ((e.state === 'down' ? 1 : 0) - e.flip) * Math.min(1, dt * 9);
  /* four planted feet, stepping in diagonal pairs */
  const c = Math.cos(e.a), sn = Math.sin(e.a), sp = Math.hypot(e.vx, e.vz), home = (i, o) => { const h = SH_HOME[i]; o[0] = e.x + h[0] * c + h[1] * sn + (sp > .6 ? e.vx / sp * .4 : 0); o[1] = e.z - h[0] * sn + h[1] * c + (sp > .6 ? e.vz / sp * .4 : 0); return o; };
  if (!e.legs) { e.legs = []; for (let i = 0; i < 4; i++) { home(i, _h); e.legs.push({ x: _h[0], z: _h[1], y: 0, sw: false, fx: 0, fz: 0 }); } }
  let need = false; for (let i = 0; i < 4; i++) { home(i, _h); const L = e.legs[i]; if (L.sw || Math.hypot(L.x - _h[0], L.z - _h[1]) > .5) need = true; } e.phase += Math.max(sp / 2.4 * dt, sp < .8 && need ? dt * 3.4 : 0);
  for (let i = 0; i < 4; i++) { const L = e.legs[i], ph = (e.phase + (i === 0 || i === 3 ? 0 : .5)) % 1; home(i, _h);
    if (e.state === 'pounce') { L.x = _h[0] - e.ldx * .7; L.z = _h[1] - e.ldz * .7; L.y = .3; L.sw = false; continue; }
    if (ph < .5 && (sp > .8 || need)) { if (!L.sw) { L.sw = true; L.fx = L.x; L.fz = L.z; } const u = ph / .5, q = ease(u), ah = sp > .8 ? (1 - u) * .6 : 0; L.x = lerp(L.fx, _h[0] + e.vx / (sp || 1) * ah, q); L.z = lerp(L.fz, _h[1] + e.vz / (sp || 1) * ah, q); L.y = Math.sin(u * Math.PI) * .45; }
    else { L.sw = false; L.y = 0; } } }
const _S = [0, 0, 0];
function shearArms(a, arms, pose, strike, t, C, eb) { const c = Math.cos(a), sn = Math.sin(a), op = pose * (1 - strike); for (const q of [1, -1]) { const bit = q === 1 ? 1 : 2; xf(q * .36, .12, .85, _A); if (!(arms & bit)) { xf(q * .6, .3, .6, _K); seg(MESH.taper, _A, _K, .28, .28, C, -.5); continue; }
    const qv = op * Math.sin(t * 44 + q) * .06, kx = lerp(lerp(.78, 1.2, pose), .6, strike), ky = lerp(lerp(.5, 1.05, pose), .45, strike), kz = lerp(lerp(.35, .8, pose), 1.8, strike), fx = lerp(lerp(.3, 3.3, pose), -.5, strike) + qv, fy = lerp(lerp(.66, 1.75, pose), -.1, strike), fz = lerp(lerp(-2.1, 2.1, pose), 3.95, strike);
    xf(q * kx, ky, kz, _K); xf(q * fx, fy, fz, _F); _S[0] = lerp(c * q, sn, op); _S[1] = .25; _S[2] = lerp(-sn * q, c, op); seg(MESH.taper, _A, _K, .36, .36, C, -.5); seg(MESH.blade, _K, _F, 2.4, 4.4, BLADEC, eb, _S); W0(); T(_K[0], _K[1], _K[2]); draw(MESH.oct, .4, .4, .4, C, -.5); pop(); } }       /* the blade's broad face is turned up to the camera: along the flank at rest, spread flat when it opens */
function drawShear(e, g) { const hit = e.flash > 0, C = hit ? [.5, .34, .4] : PLUM, C2 = hit ? C : PLUM2, tell = e.state === 'tell', stuck = e.state === 'stuck', fl = e.flinch / .16, c = Math.cos(e.a), sn = Math.sin(e.a), em = e.state === 'emerge' ? clamp(1 - e.st / 1.5, 0, 1) : 1;
  decal(e.x, e.z, 1.7, 2.9, e.a, 0, 0, 0, 0, .62);
  if (tell && e.locked) { const hc = ST.contrast, a = (hc ? .95 : .8); decal(e.x + e.ldx * 3.6, e.z + e.ldz * 3.6, 1.7, 3.6, e.la, 2, 1, hc ? .8 : .1, hc ? .6 : .05, hc ? .5 : .2 + .1 * Math.sin(g.t * 30), .012); }       /* the lane: one soft band as wide as what it will hit, and only once the line is locked */
  const by = (.98 - e.pose * .1 - e.strike * .28 - e.flip * .35) * SS; reset(); T(e.x - sn * e.flinch * 1.2, by, e.z - c * e.flinch * 1.2); RY(e.a + e.fa * fl * .32); RZ(e.flip * Math.PI * .97 + e.fa * fl * .12); RX(-e.pose * .2 + e.strike * .24); SCL(SS);
  draw(MESH.shell, .8, .62, 1.6, C, -.5); push(); T(0, .3, .1); RX(-.06); draw(MESH.scute, 1.25, 1.2, 1.9, C2, -.6); pop();       /* thorax and the plate over it */
  push(); T(0, -.04, 1.15); RY(clamp(angDiff(e.a, Math.atan2(g.x - e.x, g.z - e.z)), -.5, .5) * (1 - e.strike)); RX(.22); draw(MESH.oct, .62, .38, 1.0, C2, -.5); for (const q of [-1, 1]) { push(); T(q * .17, .1, .26); draw(MESH.oct, .1, .07, .12, [1, .7, .2], tell ? 4 : 2); pop(); } pop();       /* a wedge of a head */
  { const wag = Math.sin(g.t * 3 + e.phase * 6) * .14 * (1 - e.strike) + e.fa * fl * .3; push(); T(0, .02, -.7); RY(wag); RX(-e.strike * .5 + e.pose * .3); T(0, 0, -.5); draw(MESH.shell, .66, .32, 1.2, C, -.5); T(0, 0, -.5); RY(wag); RX(-e.strike * .3); T(0, 0, -.45); draw(MESH.shell, .46, .22, 1.0, C2, -.5); T(0, 0, -.6); RX(Math.PI / -2); draw(MESH.spike, .26, .8, .14, BLADEC, 0); pop(); }       /* a long flat tail; it stands up when the blades go in */
  shearArms(e.a, e.arms, e.pose, e.strike, g.t, C, e.pose * (1 - e.strike) * .35 + (tell && e.locked ? 1.3 : 0));
  if (!e.legs) return; for (let i = 0; i < 4; i++) { const L = e.legs[i], side = i % 2 ? -1 : 1, fwd = i < 2 ? 1 : -1; xf(side * .34, -.12, fwd * .6, _H); _F[0] = L.x; _F[1] = L.y; _F[2] = L.z; _P[0] = side * c * .8; _P[1] = 1; _P[2] = -side * sn * .8; ik2(_H, _F, .95 * SS, 1.3 * SS, _P, _K); seg(MESH.taper, _H, _K, .4, .4, C, -.5); seg(MESH.spike, _K, _F, .32, .32, PLUMD, -.5); W0(); T(_K[0], _K[1], _K[2]); draw(MESH.oct, .34, .34, .34, C2, -.5); pop(); } }
function drawCorpse(c, g) { const u = Math.min(1, c.t / .28), fade = Math.min(1, (7 - c.t) * 1.2), G0 = [.1, .075, .09], G1 = [.14, .1, .12]; decal(c.x, c.z, 1.7, 2.7, c.a, 0, 0, 0, 0, .5 * fade);       /* belly up, legs curled like a fist, the colour gone out of it */
  reset(); T(c.x, (c.flat ? .2 : .52) - (1 - fade) * .8, c.z); RY(c.a); SCL(SS); if (c.flat) { draw(MESH.shell, 1.5, .2, 2.2, G0, -.3); draw(MESH.scute, 1.6, .5, 2.2, G1, -.3); for (let i = 0; i < 4; i++) { push(); RY(i * 1.57 + .6); T(0, 0, 1.0); RX(.2); draw(MESH.spike, .2, .2, 1.1, G0, -.3); pop(); } return; }
  RZ(c.roll * u * Math.PI * .96); draw(MESH.shell, .8, .62, 1.6, G0, -.3); push(); T(0, .3, .1); draw(MESH.scute, 1.25, 1.2, 1.9, G1, -.3); pop(); push(); T(0, -.04, 1.15); RX(.5); draw(MESH.oct, .62, .38, 1.0, G1, -.3); pop(); push(); T(0, .02, -1.2); RX(.3); draw(MESH.shell, .66, .32, 1.2, G0, -.3); T(0, 0, -.9); RX(.3); draw(MESH.shell, .46, .22, 1.0, G1, -.3); pop();
  for (let i = 0; i < 4; i++) { const side = i % 2 ? -1 : 1, fwd = i < 2 ? 1 : -1, cu = u * .9; xf(side * .34, -.12, fwd * .6, _A); xf(side * lerp(.95, .7, cu), lerp(-.5, -.75, cu), fwd * lerp(.8, .5, cu), _K); xf(side * lerp(1.1, .15, cu), lerp(-.9, -.55, cu), fwd * lerp(.9, .3, cu), _F); seg(MESH.taper, _A, _K, .38, .38, G0, -.3); seg(MESH.spike, _K, _F, .3, .3, G0, -.3); }
  shearArms(c.a, c.arms, 0, .55 * u, 0, G0, 0); }
/* ---------- the encounter: three waves of shearbacks out of the crop, one, then two, then three ---------- */
function lurk(g) { let best = null, bs = -1; for (let i = 0; i < 8; i++) { const side = Math.floor(Math.random() * 3), x = side === 0 ? YARD.x0 + .4 : side === 1 ? YARD.x1 - .4 : rand(YARD.x0 + 3, YARD.x1 - 3), z = side === 2 ? YARD.z1 - .4 : rand(YARD.z0 + 6, YARD.z1 - 2), d = Math.hypot(x - g.x, z - g.z); let sc = -Math.abs(d - 12) - Math.max(0, z - g.z - 4) * 1.5; for (const l of g.lurks) sc -= Math.max(0, 8 - Math.hypot(l.x - x, l.z - z)); for (const e of g.en) sc -= Math.max(0, 6 - Math.hypot(e.x - x, e.z - z)); if (sc > bs || !best) { bs = sc; best = { x, z }; } }
  best.t = 1.9; best.a = Math.atan2(g.x - best.x, g.z - best.z); g.lurks.push(best); g.cues.push({ a: Math.atan2(best.x - g.x, best.z - g.z), t: 2.6 }); sfx.chit(); sfx.tell(); }
function encounter(dt) { const g = G, E = g.enc; if (g.demo || g.dead || g.won) return;
  for (let i = g.lurks.length - 1; i >= 0; i--) { const l = g.lurks[i]; l.t -= dt; if (l.t <= 0) { spawnShear(l.x, l.z, l.a); g.lurks.splice(i, 1); } }
  for (let i = E.queue.length - 1; i >= 0; i--) { E.queue[i] -= dt; if (E.queue[i] <= 0) { E.queue.splice(i, 1); lurk(g); } }
  const clear = !g.en.length && !g.lurks.length && !E.queue.length; if (!clear) return;
  if (E.wave === 0) { E.due -= dt; if (E.due <= 0) { E.wave = 1; E.queue.push(0); cap('Something is in the crop.', 3); } return; }
  if (E.wave === 1 && !E.dropped) { E.dropped = true; const c = E.last || g; g.drops.push({ k: 'salv', x: clamp(c.x, YARD.x0 + 2, YARD.x1 - 2), z: clamp(c.z, YARD.z0 + 2, YARD.z1 - 2), t: 0 }); E.wait = 14; }
  E.wait -= dt; if (g.drops.some(d => d.k === 'salv') && E.wait > 0) return;       /* the next wave holds while the salvage lies there, but not for ever */
  if (E.wave === 1) { E.wave = 2; E.queue.push(2.2, 5.5); E.wait = 0; }
  else if (E.wave === 2) { E.wave = 3; E.queue.push(3, 6, 9.5); g.drops.push({ k: 'fix', x: (E.last || g).x, z: (E.last || g).z, t: 0 }); }
  else if (E.wave === 3) { E.wave = 4; E.cap = 2; E.queue.push(2.5, 5, 8); g.drops.push({ k: 'fix', x: (E.last || g).x, z: (E.last || g).z, t: 0 }); }       /* only in the last wave may two come at once */
  else if (E.wave === 4) { g.won = .001; sfx.win(); cap('The yard is held.', 4); } }

/* ---------- nights: holding one opens the next, and each names what it adds ---------- */
const NIGHTS = [{ say: '', hp: 1, cap: 0, spit: 3, guard: 60, pair: 1e9, lull: .4, spd: 1, tok: 0 }];      // one finished night first; more only when each adds a new problem
let OPEN = 1, night = 1, SEED = +(new URLSearchParams(location.search).get('seed')) || 0; const RAND0 = Math.random;
/* a run can be repeated exactly: ?seed=7 in the address, or setSeed(7) from a test */
function setSeed(n) { SEED = n | 0; } function applySeed() { if (!SEED) { Math.random = RAND0; return; } let x = (SEED * 2654435761) >>> 0; Math.random = () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; }; }

/* ---------- state ---------- */
let state = 'title', G = null, lastT = 0, stick = null, dbtn = null; const keys = {};
const PT = [], DB = [], DL = [], TR = [];          // particles, debris, ground marks, tracers
function newGame(demo) {
  if (!demo) applySeed();
  G = { demo, t: 0, kills: 0, hp: 100, x: START.x, z: START.z, vx: 0, vz: 0, pvx: 0, pvz: 0, head: demo ? .55 : 0, aim: demo ? .55 : 0, aimV: 0, lamp: demo ? .55 : 0, lampV: 0, gunA: demo ? .55 : 0, gunV: 0, gunT: 0, phase: 0, py: HIP,
    feet: [0, 1].map(i => ({ x: START.x + (i ? -1 : 1) * HIPW, z: START.z, y: 0, a: 0, sw: false, fx: 0, fz: 0 })),
    hk: S0(), tw: S0(), crushed: 0, corpses: [], relics: [], lurks: [], enc: { wave: 0, due: 2.2, queue: [], cap: 1, dropped: false, wait: 0 }, bob: S0(), lx: S0(), lz: S0(), roll: S0(), rec: S0(), kick: S0(), ram: S0(), crouch: S0(), antx: S0(), antz: S0(), fov: S0(), pitch: S0(),
    spin: 0, spinV: 0, fireT: 0, flash: 0, heat: 0, jet: 0, tgt: null, dash: null, dcd: 0, inv: 0, hurtT: 0, sinceHit: 9, trauma: 0, freeze: 0, boom: 0, dead: 0, smokeT: 0,
    cam: { x: START.x, z: START.z, d: demo ? .5 : 1 }, en: [], spawnT: 1.2, cap: null, muz: [-.6, 2.3, 1.7], lampP: [0, 2.9, 1], lampD: [0, -.2, 1],
    items: [], lv: {}, parts: 0, fresh: [], choices: [], order: ['dash'], salv: 0, organSeen: false, weakT: 0, closed: 0, guards: 0, drops: [], fires: [], blasts: [], shells: [], bolts: [], drones: [], pulse: null, shotN: 0, sinceItem: 0, itemFx: 0, itemCol: [1, 1, 1], fireTick: 0, mortT: 1.5, coilT: 1, shieldT: 0, eliteT: 76, surged: -1, won: 0, lastDrop: 0, burrows: SITES.map((q, i) => ({ x: q[0], z: q[1], i, on: false, ever: false, shut: 0, pulse: 0, rot: hash2(i, 3, 7) * TAU, born: 0, big: 0 })), siteOrder: [0].concat([1, 2, 3, 4, 5].map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(v => v[1])), sitesOn: 0, power: 1, bossUp: false, bossE: null, bossDead: false, bossX: 0, bossZ: 0, shed: false, N: NIGHTS[night - 1], night, globs: [], pools: [], saidSpit: false, cues: [], allies: [], fitT: {}, gr: [0, 1, 2, 3, 4, 5, 6].map(S0), stage: 0, reapA: 0, graftT: 0, graftP: [0, 3, 0], molted: false, stompFx: 0, bulk: 1, hot: 0, shotN2: 0, spinT: 0, lastShot: 9, ck: { x: 0, z: 0 }, ix: 0, iz: 0, lookX: 0, lookZ: 0, fRot: 0, arcT: 0, weldT: 0, dip: 0, puffCd: 0, aimLean: 0, s: (() => { const b = baseStats(); b.dmg = b.pow * SHELL; return b; })() };
  if (demo) { G.feet[0].x = START.x + Math.cos(.55) * HIPW; G.feet[0].z = START.z - Math.sin(.55) * HIPW; G.feet[1].x = START.x - Math.cos(.55) * HIPW; G.feet[1].z = START.z + Math.sin(.55) * HIPW; G.feet[0].a = G.feet[1].a = .55; }
  PT.length = DB.length = DL.length = TR.length = 0; offer = null;
}
function announce(t) { const l = $('live'); if (!l) return; l.textContent = ''; setTimeout(() => { l.textContent = t; }, 40); }
function cap(txt, t) { const g = G; if (!g || g.demo) return; if (ST.caps) g.cap = { txt, t: t || 2.6 }; announce(txt); }

/* ---------- Farm Relay 09 ----------
   A fenced machinery yard round a power relay, with fields on three sides. The garage and the grain silo stand along the north edge, where the camera
   sees their faces and nothing can hide behind them. Bugs come up through the concrete at six places along the fence. Each place has a warning lamp,
   and each can be rammed shut for a while. Everything standing in the yard is something to steer by, to put between you and a charge, or to protect. */
const YARD = { x0: -12, x1: 12, z0: -16, z1: 12 }, GAR = { x: 6.5, z: -16.6 }, HOUSE = { x: -6.5, z: -16.8 }, SILO = { x: 11.5, z: -27.5 }, RELAY = { x: -1, z: -8 }, START = { x: 6.5, z: -11 };
const SITES = [];
/* Four things to read, all on the north side where the camera sees their faces: the farmhouse with its lit windows, the machine shed you walk out of, the silo behind it,
   and the relay mast in front of both, which is what is being held and which floods the yard with the only cool light. Everything else is ground:
   a dirt yard, a track out through the south gate, standing crop along the west, a road down the east. The fight happens in the open south of the mast. */
const PROPS = [
  { k: 'relay', x: RELAY.x, z: RELAY.z, r: 2.9, rot: 0, v: .3 },
  { k: 'fire', x: 1.4, z: -14.8, r: .6, rot: 0, v: .2 },
  { k: '', x: GAR.x - 4.6, z: GAR.z + 3.2, r: .35 }, { k: '', x: GAR.x + 4.6, z: GAR.z + 3.2, r: .35 }, { k: '', x: HOUSE.x - 1.4, z: HOUSE.z + 1.1, r: 1.5 }, { k: '', x: HOUSE.x + 1.4, z: HOUSE.z + 1.1, r: 1.5 },
];
function pushOut(o, rad) { for (const p of PROPS) { const dx = o.x - p.x, dz = o.z - p.z, m = p.r + rad; if (Math.abs(dx) > m || Math.abs(dz) > m) continue; const d = Math.hypot(dx, dz); if (d < m && d > 1e-4) { o.x = p.x + dx / d * m; o.z = p.z + dz / d * m; } }
  o.x = clamp(o.x, YARD.x0 + rad, YARD.x1 - rad); o.z = clamp(o.z, YARD.z0 + rad, YARD.z1 - rad); }
/* the fence, span by span, and the crop rows beyond it: worked out once */
const FENCE = [], CROPS = []; (() => { const F = .7, add = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 3)); for (let i = 0; i < n; i++) { const ax = lerp(x0, x1, i / n), az = lerp(z0, z1, i / n), bx = lerp(x0, x1, (i + 1) / n), bz = lerp(z0, z1, (i + 1) / n); FENCE.push({ ax, az, mx: (ax + bx) / 2, mz: (az + bz) / 2, rot: Math.atan2(bx - ax, bz - az), len: L / n, last: i === n - 1, v: hash2(Math.round(ax * 7), Math.round(az * 7), 9) }); } };
  add(YARD.x0 - F, YARD.z1 + F, GAR.x - 2.2, YARD.z1 + F); add(GAR.x + 2.2, YARD.z1 + F, YARD.x1 + F, YARD.z1 + F); add(YARD.x1 + F, YARD.z1 + F, YARD.x1 + F, YARD.z0 - 1);       /* a low fence along the south, open at the gate, and up the east side along the road */
  const crop = (x, z, i, j, tall) => CROPS.push({ x: x + (hash2(i, j, 21) - .5) * .4, z: z + (hash2(i, j, 22) - .5) * .4, h: (tall ? 1.9 : 1.1) + hash2(i, j, 23) * .7, rot: hash2(i, j, 24) * TAU, v: hash2(i, j, 25), w: tall ? .8 : .55 });
  for (let r = 0; r < 4; r++) for (let i = 0; i < 44; i++) crop(YARD.x0 - 1.5 - r * 1.05, YARD.z0 - 6 + i * 1.0, i, r, true);       /* standing crop along the west: the wall they come out of */
  for (let r = 0; r < 3; r++) { for (let i = 0; i < 34; i++) crop(YARD.x0 - 5 + i * 1.05, YARD.z1 + 2.2 + r * 1.3, i, r + 10, false); for (let i = 0; i < 36; i++) crop(YARD.x1 + 5 + r * 1.3, YARD.z0 - 6 + i * 1.05, i, r + 20, false); } })();
function openSite(g, b) { b.on = b.ever = true; b.shut = 0; b.born = 0; b.pulse = 1; sfx.burrow(); dust(b.x, b.z, 10, 5, .6); for (let i = 0; i < 6; i++) debris(MESH.cube, b.x + rand(-.8, .8), .3, b.z + rand(-.8, .8), rand(.2, .6), rand(.1, .2), rand(.2, .5), CONC, 0, rand(-5, 5), rand(4, 9), rand(-5, 5), rand(1.5, 2.5)); g.cues.push({ a: Math.atan2(b.x - g.x, b.z - g.z), t: 3 }); }

/* ---------- small things that fly ---------- */
function part(k, x, y, z, vx, vy, vz, life, size, r, g, b, a, grav, drag, grow, len) { if (PT.length < 650) PT.push({ k, x, y, z, vx, vy, vz, t: 0, life, size, r, g, b, a, grav: grav || 0, drag: drag || 0, grow: grow || 0, len: len || 0 }); }
function debris(mesh, x, y, z, sx, sy, sz, col, e, vx, vy, vz, life) { if (DB.length > 170) DB.shift(); DB.push({ mesh, x, y, z, sx, sy, sz, col, e, vx, vy, vz, ax: rand(0, TAU), ay: rand(0, TAU), wx: rand(-14, 14), wy: rand(-14, 14), t: 0, life, rad: Math.max(.04, Math.min(sx, sy, sz) * .5) }); }
function mark(x, z, sx, sz, rot, kind, r, g, b, a, life, seed) { if (DL.length > 130) DL.shift(); DL.push({ x, z, sx, sz, rot, kind, r, g, b, a, t: 0, life, seed: seed || 0 }); }
function sparks(x, y, z, dx, dz, n, r, g, b, spd) { for (let i = 0; i < n; i++) { const a = Math.atan2(dx, dz) + rand(-.9, .9), s = rand(.3, 1) * (spd || 9); part(2, x, y, z, Math.sin(a) * s, rand(1, 6), Math.cos(a) * s, rand(.12, .3), .05, r, g, b, 1, 22, 2, 0, .035); } }
function dust(x, z, n, spd, sz) { for (let i = 0; i < n; i++) { const a = rand(0, TAU), s = rand(.3, 1) * spd; part(1, x, rand(.1, .3), z, Math.sin(a) * s, rand(.3, 1.4), Math.cos(a) * s, rand(.5, 1), sz || .35, .2, .19, .17, .3, 0, 2.5, 1.3); } }

/* ---------- bugs ---------- */
const SHELLC = [.032, .028, .034], CLAWC = [.4, .34, .26], HOOKC = [.62, .56, .44], PALS = [[.5, .16, .03], [.46, .05, .04], [.52, .36, .07], [.34, .1, .03]];      // every bug is near-black chitin; one accent colour marks its plates
function morph(o) { const r = Math.random(); o.m = { ab: rand(.82, 1.28), lg: rand(.88, 1.22), w: rand(.88, 1.16), pal: Math.floor(Math.random() * PALS.length), spk: Math.random() < .35, mand: rand(.8, 1.5), ant: rand(.7, 1.3) }; o.kind = r < .4 ? 'rush' : r < .75 ? 'flank' : 'skirm'; o.ring = rand(2.3, 3.6); o.flipT = rand(1, 4); o.pace = rand(0, 1); o.run = true; return o; }
function spawnBug(x, z, kind) { const g = G, boss = kind === 'boss', big = kind === 'big' || kind === true || boss, spit = kind === 'spit', s = boss ? 2 : big ? 1.25 : spit ? .68 : rand(.6, .74), hp = 36 * (1 + g.t / 450) * g.N.hp * (boss ? 46 : big ? 12 : spit ? .8 : 1); g.en.push(morph({ x, z, a: Math.atan2(g.x - x, g.z - z), vx: 0, vz: 0, kx: 0, kz: 0, hp, mhp: hp, s, big, spit, boss, atk: '', seq: 0, vol: null, emer: 0, emer0: 1, stag: 0, ricT: 0, ph: 1, state: 'chase', st: 0, cd: big ? 1.5 : spit ? rand(1, 2) : rand(.2, 1), phase: Math.random(), legs: null, fl: S0(), rear: S0(), flash: 0, burnT: 0, cutT: 0, off: 0, lim: 0, bias: rand(-1, 1), ldx: 0, ldz: 1, la: 0, tx: 0, tz: 0, hitP: false, dead: false })); }
const COMPASS = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'], compass = a => COMPASS[((Math.round(a / (TAU / 8)) % 8) + 8) % 8];
/* The number alive has a ceiling that rises slowly, so a strong build means more kills, not a fuller screen.
   Each 40 seconds runs press, surge, lull. A brood guard arrives every 55 seconds and always drops a part. The run ends at six minutes. */
/* the open site nearest that direction. A site the walker is standing on, or one rammed shut, gives nothing */
function burrow(g, a) { let best = null, bs = 1e9; for (const b of g.burrows) { if (!b.on || b.shut > 0) continue; const dx = b.x - g.x, dz = b.z - g.z, d = Math.hypot(dx, dz); if (d < 6.5) continue; const sc = Math.abs(angDiff(a, Math.atan2(dx, dz))) + Math.max(0, d - 22) * .08; if (sc < bs) { bs = sc; best = b; } } return best; }
function spawnLogic(dt) { const g = G; if (g.demo || g.dead || g.won) return; const nt = g.N, cyc = g.t % 36, last = g.t > RUN - 24 && !g.bossUp, lull = cyc > 29 && !last && g.t > 40, wave = Math.floor(g.t / 36);
  /* the arc: a few lone stalkers, then packs; spitters from the first minute; a guard at 1:25 and 2:20; a breath, then her */
  const want = g.t < 1.5 ? 0 : g.t < 9 ? 1 : g.t < 30 ? 2 : g.t < 62 ? 3 : g.t < 100 ? 4 : g.t < 135 ? 5 : 6; if (g.sitesOn < want) { const b = g.burrows[g.siteOrder[g.sitesOn++]]; openSite(g, b); if (g.sitesOn === 1) cap('Something is coming up under the west fence.', 4); }       /* the fence gives way one place at a time */
  let N = g.t < 18 ? 2 : Math.min(10, 3 + g.t / 13); if (lull) N *= nt.lull; if (last) N += 3; if (g.bossUp) N = 4; let alive = 0, spitters = 0, guard = false; for (const e of g.en) { if (!e.big) alive++; else if (!e.boss) guard = true; if (e.spit) spitters++; } if (guard) N = Math.min(N, 7); N = Math.round(N * ST.ecount);       /* a guard in the yard thins the pack, so there is room to get round it */
  const ring = (a, r, kind) => { if (kind !== 'big' && kind !== 'boss' && g.en.length >= 19) return; const hv = kind === 'big' || kind === 'boss'; let b = burrow(g, a); if (!b && kind === 'boss') { b = g.burrows.reduce((m, q) => (q.x - g.x) ** 2 + (q.z - g.z) ** 2 > (m.x - g.x) ** 2 + (m.z - g.z) ** 2 ? q : m); openSite(g, b); } if (!b) return; spawnBug(b.x + rand(-.5, .5), b.z + rand(-.5, .5), kind); const e = g.en[g.en.length - 1]; e.emer = e.emer0 = hv ? .95 : .55; b.pulse = 1; dust(b.x, b.z, hv ? 9 : 2, hv ? 5 : 2.5, .4); if (hv) { g.trauma = Math.min(1, g.trauma + .12 * FB); b.big = 1; } };
  g.spawnT -= dt; if (g.spawnT <= 0 && alive < N) { g.spawnT = g.t < 18 ? 3.2 : last ? .25 : lerp(.7, .3, clamp(g.t / 130, 0, 1)); const mv = Math.hypot(g.vx, g.vz) > 2, spit = nt.spit && g.t > 52 && spitters < (g.t > 115 ? 3 : 2) && Math.random() < .28;
    ring(mv && Math.random() < .5 ? Math.atan2(g.vx, g.vz) + rand(-1.1, 1.1) : rand(0, TAU), rand(19, 23), spit ? 'spit' : null); if (spit && !g.saidSpit) { g.saidSpit = true; cap('Spitters. A red ring marks where the acid will land.', 4); } }
  if (!g.bossUp && g.t >= RUN) { g.bossUp = true; const a = Math.hypot(g.vx, g.vz) > 2 ? Math.atan2(g.vx, g.vz) : rand(0, TAU); ring(a, 20, 'boss'); g.bossE = g.en[g.en.length - 1]; g.cues.push({ a: Math.atan2(g.bossE.x - g.x, g.bossE.z - g.z), t: 3.4 }); cap('The brood mother is here. The lights are going. Kill her.', 4); sfx.boss(); sfx.alarm(6); }
  if (g.bossUp) return;
  if (cyc > 22 && g.surged < wave && g.t > 30) { g.surged = wave; const a = rand(0, TAU), n = Math.round(Math.min(5, 3 + g.t / 70) * ST.ecount); for (let i = 0; i < n; i++) ring(a + rand(-.3, .3), rand(19, 25)); g.cues.push({ a, t: 3.4 }); cap('Swarm from the ' + compass(a)); sfx.swarm(); }
  g.eliteT -= dt; if (g.eliteT <= 0) { g.eliteT = nt.guard; const a = rand(0, TAU); ring(a, 21, 'big'); g.cues.push({ a, t: 3.4 }); cap('Brood guard from the ' + compass(a) + '.'); sfx.swarm(); }
  if (last && !g.lastSaid) { g.lastSaid = true; cap('Last push.'); } }
function hurtBug(e, dmg, dx, dz, ram, heavy) { const g = G; if (e.dead) return; if (e.shear) return hurtShear(e, dmg, dx, dz, ram, heavy);
  /* a guard, and the mother before she breaks, are armoured in front: shells from ahead mostly glance off unless they are penetrators. Staggered, or hit from the flank or behind, they take it all, and more */
  if (e.big && heavy && (!e.boss || e.ph < 2)) { if (e.stag > 0) dmg *= 1.6; else if (!g.s.ap && -(dx * Math.sin(e.a) + dz * Math.cos(e.a)) > .3) { dmg *= e.boss ? .5 : .35; e.ricT = .12; sparks(e.x - dx * e.s * .7, .9 * e.s, e.z - dz * e.s * .7, -dx, -dz, 5, 1, .85, .5, 11); sfx.ric(); } }
  if (e.boss && e.ph === 2) dmg *= 1.25;
  e.hp -= dmg; e.flash = .09;
  if (heavy) { const kb2 = e.big ? 1.2 : 4.5, px = e.x + dx * .4 * e.s, pz = e.z + dz * .4 * e.s; e.fl.v += e.big ? 4 : 10; e.kx += dx * kb2; e.kz += dz * kb2; sfx.thwack();       // a cannon shell: it goes in one side and takes things out the other
    for (let i = 0; i < 9; i++) part(0, px, rand(.4, .8) * e.s, pz, dx * rand(4, 13) + rand(-3, 3), rand(1, 6), dz * rand(4, 13) + rand(-3, 3), rand(.3, .6), rand(.14, .3), .3, .7, .08, .9, 17, .4, -.2);
    if (ST.gore) { for (let i = 0; i < 2; i++) debris(MESH.oct, px, rand(.4, .8), pz, rand(.16, .34) * e.s, rand(.08, .16), rand(.2, .4) * e.s, i ? SHELLC : e.big ? GUARDC2 : PALS[e.m.pal], -.8, dx * rand(6, 13) + rand(-3, 3), rand(3, 7), dz * rand(6, 13) + rand(-3, 3), rand(1.6, 2.6));
      if (e.hp > 0 && !e.ally && !e.boss && e.lim < (e.big ? 2 : 3)) { let i = Math.floor(Math.random() * 6), n = 0; while (e.off >> i & 1 && n++ < 6) i = (i + 1) % 6; if (!(e.off >> i & 1)) { e.off |= 1 << i; e.lim++; const L = e.legs && e.legs[i]; debris(MESH.spike, L ? L.x : e.x, .5, L ? L.z : e.z, .12 * e.s, 1.3 * e.s, .12 * e.s, SHELLC, -.8, dx * rand(4, 9) + rand(-4, 4), rand(5, 9), dz * rand(4, 9) + rand(-4, 4), rand(2, 3)); } }
      if (Math.random() < .6) mark(e.x + dx * rand(1, 2.4), e.z + dz * rand(1, 2.4), rand(.25, .5), rand(.5, 1), Math.atan2(dx, dz), 3, .03, .055, .012, .65, 16, rand(0, 9)); } } e.fl.v += (ram ? 16 : 7) * (e.big ? .4 : 1); const kb = (ram ? 24 : 2.6) * (e.big ? .2 : 1); e.kx += dx * kb; e.kz += dz * kb;
  sparks(e.x - dx * .3, .55, e.z - dz * .3, -dx, -dz, ram ? 10 : 3, .7, 1, .25, 8); sfx.hit();
  if (dx || dz) { for (let i = 0; i < (ram ? 6 : 2); i++) part(0, e.x + dx * .4 * e.s, .6 * e.s, e.z + dz * .4 * e.s, dx * rand(3, 8) + rand(-2, 2), rand(1.5, 4.5), dz * rand(3, 8) + rand(-2, 2), rand(.3, .5), rand(.12, .22), .3, .7, .08, .85, 16, .5, -.2); if (Math.random() < .18) mark(e.x + dx * rand(.8, 1.8), e.z + dz * rand(.8, 1.8), rand(.2, .45), rand(.2, .45), rand(0, TAU), 3, .03, .055, .012, .6, 14, rand(0, 9)); }      // the shot goes through: ichor sprays out the far side and spots the ground
  if (e.hp <= 0) killBug(e, dx, dz, ram, heavy); }
function killBug(e, dx, dz, ram, heavy) { const g = G, s = e.s, f = ram ? 2.1 : heavy ? 1.9 : 1; if (heavy && ST.gore) { mark(e.x + dx * 1.7 * s, e.z + dz * 1.7 * s, .75 * s, 2.3 * s, Math.atan2(dx, dz), 3, .03, .055, .012, .8, 26, rand(0, 9)); for (let i = 0; i < 4; i++) debris(MESH.oct, e.x, rand(.4, .9), e.z, rand(.16, .3) * s, rand(.12, .2) * s, rand(.16, .3) * s, [.14, .3, .04], .2, dx * rand(7, 15) + rand(-4, 4), rand(3, 8), dz * rand(7, 15) + rand(-4, 4), rand(1.5, 2.5)); } /* what is left goes down the line of fire */ e.dead = true; g.kills++; sfx.kill(); part(0, e.x, .7 * s, e.z, 0, 0, 0, .11, 2.4 * s, .7, 1, .4, .5, 0, 0, 4);
  if (e.boss) { g.bossDead = true; g.bossX = e.x; g.bossZ = e.z; }
  if (!g.won && !e.boss) { const at = [16, 52, 104][g.salv];       // salvage comes at set points in the night, not by luck: three crates from the first kill after each mark, and one organ from the first guard
    if (at !== undefined && g.t >= at && !e.big && nextPair(g) && !g.drops.some(d => d.k === 'salv')) { g.salv++; g.drops.push({ k: 'salv', x: e.x, z: e.z, t: 0 }); }
    else if (e.big && !g.organSeen) { g.organSeen = true; g.drops.push({ k: 'organ', x: e.x, z: e.z, t: 0 }); }
    if (e.big || Math.random() < .07) g.drops.push({ k: 'fix', x: e.x + 1.2, z: e.z, t: 0 });
    if (ram && g.s.chain && g.dash && !g.dash.back) { g.dash.back = true; g.dcd -= g.s.dashCd * .5; } }
  if (e.big) { g.trauma = Math.min(1, g.trauma + (.5) * FB); if (ST.hitstop && !g.won) g.freeze = Math.max(g.freeze, .055); dust(e.x, e.z, 14, 6, .8); DL.push({ x: e.x, z: e.z, sx: 1, sz: 1, rot: 0, kind: 1, r: .6, g: 1, b: .3, a: .9, t: 0, life: .4, seed: 0, grow: 16 }); g.pulse = { x: e.x, z: e.z, c: [.7, 1, .3], t: 1 };
    if (ST.gore) for (let i = 0; i < 10; i++) debris(i % 2 ? MESH.shell : MESH.oct, e.x + rand(-.8, .8), rand(.5, 1.4), e.z + rand(-.8, .8), rand(.4, .9), rand(.14, .3), rand(.5, 1), i % 3 ? GUARDC2 : GUARDF, -.7, rand(-9, 9), rand(6, 13), rand(-9, 9), rand(2.5, 4)); }       // a guard goes down like a building
  mark(e.x + dx * .4, e.z + dz * .4, rand(.9, 1.5) * s, rand(.9, 1.5) * s, rand(0, TAU), 3, .03, .055, .012, .75, 26, rand(0, 9));
  if (ST.gore) { const fl = (m, sx, sy, sz, col, em) => debris(m, e.x + rand(-.3, .3), rand(.4, .8), e.z + rand(-.3, .3), sx * s, sy * s, sz * s, col, em, dx * rand(3, 9) * f + rand(-3, 3), rand(4, 9) * (ram ? 1.3 : 1), dz * rand(3, 9) * f + rand(-3, 3), rand(2, 3.2));
    const ac = e.big ? GUARDC2 : e.spit ? SPITC2 : PALS[e.m.pal]; for (let i = 0; i < 5; i++) fl(i % 2 ? MESH.oct : MESH.shell, rand(.3, .6), rand(.12, .24), rand(.4, .8), i % 2 ? SHELLC : ac, -.8); fl(MESH.oct, .5, .26, .6, SHELLC, -.8); for (let i = 0; i < 6; i++) fl(MESH.spike, .11, 1.1, .11, SHELLC, -.8); if (!e.spit && !e.big) for (let i = 0; i < 2; i++) fl(MESH.blade, .9, 1.1, .9, CLAWC, 0); for (let i = 0; i < 4; i++) fl(MESH.oct, .16, .14, .16, [.16, .4, .04], .25); }
  for (let i = 0; i < 7; i++) part(0, e.x, .6, e.z, rand(-3, 3) + dx * 3, rand(1, 5), rand(-3, 3) + dz * 3, rand(.2, .4), rand(.3, .6), .35, .8, .1, .7, 12, 1, -.6); }
function bugHome(e, i, sp, out) { const side = i < 3 ? 1 : -1, row = i % 3, s = e.s, lx = side * (e.big ? 1.05 : 1.2 + (row === 1 ? .22 : 0)) * s * e.m.lg, lz = (1 - row) * .9 * s, c = Math.cos(e.a), sn = Math.sin(e.a); let x = e.x + lx * c + lz * sn, z = e.z - lx * sn + lz * c; if (sp > .6) { x += e.vx / sp * .33 * s; z += e.vz / sp * .33 * s; } out[0] = x; out[1] = z; return out; }
const _h = [0, 0]; let tokens = 0;
/* thralls: bugs the brood heart has raised. They run down the nearest bug and bite it, and fall apart after a few seconds */
function raise(x, z, sc) { G.allies.push(morph({ x, z, a: rand(0, TAU), vx: 0, vz: 0, kx: 0, kz: 0, hp: 1, s: sc, big: false, spit: false, ally: true, state: 'chase', st: 0, cd: 0, phase: Math.random(), legs: null, fl: S0(), rear: S0(), flash: 0, burnT: 0, cutT: 0, off: 0, lim: 0, emer: 0, emer0: 1, bias: rand(-1, 1), ldx: 0, ldz: 1, la: 0, tx: 0, tz: 0, life: 9, bite: 0, born: 0, dead: false })); }
function updAlly(e, dt) { const g = G; e.life -= dt; e.born += dt; let best = null, bd = 16; for (const o of g.en) { if (o.dead) continue; const d = Math.hypot(o.x - e.x, o.z - e.z); if (d < bd) { bd = d; best = o; } }
  let mvx = 0, mvz = 0, face = e.a; if (best) { const ux = (best.x - e.x) / (bd || 1), uz = (best.z - e.z) / (bd || 1), reach = .8 * (e.s + best.s) + .3; face = Math.atan2(ux, uz); if (bd > reach) { mvx = ux * 6.4; mvz = uz * 6.4; } e.bite -= dt; if (bd < reach + .4 && e.bite <= 0) { e.bite = .4; e.fl.v -= 9; hurtBug(best, g.s.pow * 2.5, ux, uz); } }
  else { const dx = g.x - e.x, dz = g.z - e.z, d = Math.hypot(dx, dz) || 1; face = Math.atan2(dx, dz); if (d > 4) { mvx = dx / d * 5; mvz = dz / d * 5; } }
  bugMove(e, dt, mvx, mvz, face); if (e.life <= 0) { e.dead = true; for (let i = 0; i < 6; i++) part(0, e.x, .6, e.z, rand(-2, 2), rand(1, 4), rand(-2, 2), rand(.25, .45), rand(.3, .5), .3, .8, 1, .6, 8, 1, -.5); } }
function updBug(e, dt) { const g = G, dx = g.x - e.x, dz = g.z - e.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d; let mvx = 0, mvz = 0, face = Math.atan2(ux, uz); e.cd -= dt; e.st -= dt;
  if (e.shear) return updShear(e, dt);
  if (e.emer > 0) { e.emer -= dt; bugMove(e, dt, 0, 0, face); return; }       // still climbing out
  if (e.boss) {       // the brood mother. Phase one: armoured, she charges and slams, and stands open after each charge. At half she breaks: no more charging, her sac swells and is laid bare, and she plants herself to spit and hatch.
    if (e.ph === 1 && e.hp < e.mhp * .5) { e.ph = 2; e.state = 'rec'; e.st = 1.6; e.stag = 1.6; e.cd = 1; e.seq = 0; g.trauma = Math.min(1, g.trauma + .5 * FB); if (ST.hitstop) g.freeze = Math.max(g.freeze, .1); sfx.boss(); cap('Her armour breaks. The sac is open.', 3.5); for (let i = 0; i < 12; i++) debris(i % 2 ? MESH.shell : MESH.oct, e.x + rand(-1.5, 1.5), rand(.8, 2), e.z + rand(-1.5, 1.5), rand(.5, 1), rand(.15, .3), rand(.5, 1), GUARDC2, -.7, rand(-8, 8), rand(5, 11), rand(-8, 8), rand(2.5, 4)); }
    if (e.state === 'chase') { const sd = e.bias > 0 ? 1 : -1; if (e.ph === 1) { if (d > 8) { const v = d > 11 ? 6.2 : 3.6; mvx = ux * v; mvz = uz * v; } else if (d < 4.4) { mvx = -ux * 1.5; mvz = -uz * 1.5; } else { mvx = -uz * sd * 1.4; mvz = ux * sd * 1.4; } } else if (d > 6.5) { mvx = ux * 3; mvz = uz * 3; }
      if (e.cd <= 0 && d < 15 && !g.dead && !g.won) { const k = e.seq++; e.atk = e.ph === 1 ? (d < 5 ? 'slam' : 'charge') : d < 4.6 ? 'slam' : k % 2 ? 'birth' : 'volley'; e.state = 'tell'; e.la = face; sfx.tell();
        if (e.atk === 'charge') { e.st = 1; const px = g.x + g.vx * .5 - e.x, pz = g.z + g.vz * .5 - e.z, l = Math.hypot(px, pz) || 1; e.ldx = px / l; e.ldz = pz / l; e.la = Math.atan2(e.ldx, e.ldz); }
        else if (e.atk === 'volley') { e.st = .9; const cx = g.x + g.vx * .9, cz = g.z + g.vz * .9, n = 5, a0 = rand(0, TAU); e.vol = [[cx, cz]]; for (let i = 0; i < n; i++) e.vol.push([cx + Math.sin(a0 + i / n * TAU) * 3.4, cz + Math.cos(a0 + i / n * TAU) * 3.4]); }
        else e.st = e.atk === 'birth' ? .8 : .85; } }
    else if (e.state === 'tell') { face = e.la; if (e.st <= 0) {
        if (e.atk === 'charge') { e.state = 'lunge'; e.st = .62; e.hitP = false; sfx.lunge(); }
        else { e.state = 'rec'; e.st = e.atk === 'slam' ? 1 : .7; e.cd = e.ph === 2 ? 1.1 : 1.6;
          if (e.atk === 'volley') { for (const v of e.vol) g.globs.push({ x0: e.x, z0: e.z, x1: v[0], z1: v[1], t: 0, dur: .9 }); e.vol = null; sfx.spit(); }
          else if (e.atk === 'birth') { for (let i = 0; i < 3; i++) spawnBug(e.x - Math.sin(e.a) * 2.4 + rand(-1.5, 1.5), e.z - Math.cos(e.a) * 2.4 + rand(-1.5, 1.5)); dust(e.x - Math.sin(e.a) * 2.4, e.z - Math.cos(e.a) * 2.4, 8, 4, .5); sfx.swarm(); }
          else { if (d < 5.5) hurtPlayer(22, ux, uz); DL.push({ x: e.x, z: e.z, sx: 1, sz: 1, rot: 0, kind: 1, r: 1, g: .3, b: .1, a: .9, t: 0, life: .3, seed: 0, grow: 17 }); dust(e.x, e.z, 14, 7, .7); g.trauma = Math.min(1, g.trauma + .3 * FB); sfx.blast(); } } } }
    else if (e.state === 'lunge') { face = e.la; mvx = e.ldx * 22; mvz = e.ldz * 22; if (!e.hitP && d < 2.9) { e.hitP = true; hurtPlayer(26, e.ldx, e.ldz); } if (e.st <= 0) { e.state = 'rec'; e.st = 1.7; e.stag = 1.7; e.cd = 1.6; dust(e.x, e.z, 10, 5, .6); } }
    else { face = e.a; if (e.st <= 0) e.state = 'chase'; }
    bugMove(e, dt, mvx, mvz, face); return; }
  if (e.spit) {       // keeps its distance and lobs acid at where you are heading; the landing spot is marked from the moment it winds up
    if (e.state === 'chase') { const spd = 4 * ST.espd * g.N.spd * (g.s.sear && inBeam(g, e.x, e.z) ? .65 : 1), sd = e.bias > 0 ? 1 : -1; if (d > 10.5) { mvx = ux * spd * (d > 14 ? 1.6 : 1); mvz = uz * spd * (d > 14 ? 1.6 : 1); } else if (d < 6) { mvx = -ux * 3; mvz = -uz * 3; } else { mvx = -uz * sd * 1.3; mvz = ux * sd * 1.3; }
      if (d < 12.5 && e.cd <= 0 && !g.dead && !g.demo && !g.won) { e.state = 'tell'; e.st = .75; let px = g.x + g.vx * .9 - e.x, pz = g.z + g.vz * .9 - e.z; const l = Math.hypot(px, pz) || 1, m = Math.min(l, 14); e.tx = e.x + px / l * m; e.tz = e.z + pz / l * m; e.la = Math.atan2(px, pz); sfx.tell(); } }
    else if (e.state === 'tell') { face = e.la; if (e.st <= 0) { e.state = 'rec'; e.st = .5; e.cd = rand(2.6, 3.6); g.globs.push({ x0: e.x, z0: e.z, x1: e.tx, z1: e.tz, t: 0, dur: .8 }); sfx.spit(); } }
    else { face = e.a; if (e.st <= 0) e.state = 'chase'; }
  } else if (e.state === 'chase') {
    e.pace -= dt; if (e.pace <= 0) { e.run = !e.run; e.pace = e.run ? rand(.5, 1.5) : rand(.06, .26); }      // they skitter: a run, a beat, a run
    e.flipT -= dt; if (e.flipT <= 0) { e.flipT = rand(2, 5); if (Math.random() < .5) e.bias = -e.bias; }
    if (d < (e.big ? 7.5 : e.kind === 'rush' ? 4.3 : 3.7) && e.cd <= 0 && !g.dead && !g.demo && !g.won && (e.big || tokens < (g.t < 90 ? 2 : 3) + g.N.tok)) { e.state = 'tell'; e.st = e.big ? .85 : TELL; if (!e.big) tokens++; const ld = rand(.35, .7), px = g.x + g.vx * ld - e.x, pz = g.z + g.vz * ld - e.z, l = Math.hypot(px, pz) || 1; e.ldx = px / l; e.ldz = pz / l; e.la = Math.atan2(e.ldx, e.ldz); sfx.tell(); }
    else { const spd = (e.big ? 3.3 : BUGV * (1 + Math.min(.3, g.t / 700))) * (1 - .08 * e.lim) * ST.espd * g.N.spd * (d > 13 ? 1.6 : 1) * (g.s.sear && inBeam(g, e.x, e.z) ? .65 : 1) * (e.big || d > 12 ? 1 : e.run ? 1.3 : .3), sd = e.bias > 0 ? 1 : -1, ring = e.big ? 2.7 : e.ring; let rad, tan;
      if (e.big) { rad = d > ring ? 1 : d < 2.1 ? -.6 : 0; tan = d > ring ? 0 : .45; }
      else if (e.kind === 'skirm') { const want = e.cd <= 0 ? ring : ring + 2.8; rad = clamp((d - want) * .8, -1, 1); tan = d < want + 3 ? .8 : .15; }       // hangs back on a ring, strafing, and darts in when it is ready
      else if (e.kind === 'flank') { const k = clamp((d - 1.5) / 7, 0, 1) * 1.15; rad = d > ring ? Math.cos(k) : d < 2.1 ? -.5 : 0; tan = d > ring ? Math.sin(k) : .6; }       // swings wide to come in from the side
      else { rad = d > ring ? 1 : d < 2 ? -.5 : 0; tan = d > ring ? Math.sin(g.t * 3 + e.bias * 9) * .4 * clamp((d - 2) / 6, 0, 1) : Math.sin(g.t * 4.5 + e.bias * 7) * .7; }       // comes straight in with a weave, then jitters at arm's length
      mvx = (ux * rad - uz * sd * tan) * spd; mvz = (uz * rad + ux * sd * tan) * spd; }
  } else if (e.state === 'tell') { face = e.la; if (e.st <= 0) { e.state = 'lunge'; e.st = e.big ? .5 : LUNGE_T; e.hitP = false; sfx.lunge(); } }
  else if (e.state === 'lunge') { face = e.la; const lv = e.big ? 20 : LUNGE_V; mvx = e.ldx * lv; mvz = e.ldz * lv; if (!e.hitP && d < (e.big ? 2.1 : 1.3)) { e.hitP = true; hurtPlayer(e.big ? 18 : 11, e.ldx, e.ldz); } if (e.st <= 0) { e.state = 'rec'; e.st = e.big ? 1.5 : .6; if (e.big) e.stag = 1.5; dust(e.x, e.z, e.big ? 8 : 3, e.big ? 4 : 2); } }      // a guard that has spent its charge stands open for a moment
  else { face = e.a; if (e.st <= 0) { e.state = 'chase'; e.cd = e.big ? rand(1.6, 2.4) : rand(1.2, 2.4); } }
  bugMove(e, dt, mvx, mvz, face); }
function bugMove(e, dt, mvx, mvz, face) { const g = G;
  const k = 1 - Math.exp(-dt * (e.state === 'lunge' ? 30 : 9)); e.vx += (mvx - e.vx) * k; e.vz += (mvz - e.vz) * k; const kd = Math.exp(-dt * 7); e.kx *= kd; e.kz *= kd;
  e.x += (e.vx + e.kx) * dt; e.z += (e.vz + e.kz) * dt; pushOut(e, .5 * e.s); e.a += clamp(angDiff(e.a, face), -9 * dt, 9 * dt);
  spring(e.rear, e.state === 'tell' ? 1 : 0, 170, 15, dt); spring(e.fl, 0, 260, 17, dt); e.flash -= dt; e.burnT -= dt; e.cutT -= dt; e.stag -= dt; e.ricT -= dt;
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
/* the brood mother kept the grown parts alive. When she dies they die: the chitin, the sacs and the organs fall off the walker and it is a bare machine again */
function shed(g) { g.shed = true; g.crouch.v += 7; sfx.kill(); sfx.splat(); cap('What grew on the machine dies and falls away.', 3.5); const n = 8 + g.stage * 5 + g.items.filter(id => BIO[id]).length * 4, M = [MESH.shell, MESH.oct, MESH.spike, MESH.blade], Cs = [CHITM, CHITM, BONE, FLESH, [.2, .4, .05]];
  for (let i = 0; i < n; i++) { const a = rand(0, TAU), v = rand(2, 7), m = M[i % 4], sz = rand(.25, .7); debris(m, g.x + Math.sin(a) * .6, g.py + rand(.2, 1.6), g.z + Math.cos(a) * .6, sz * rand(.5, 1), m === MESH.spike || m === MESH.blade ? sz * 1.6 : sz * rand(.3, .6), sz, Cs[i % 5], i % 5 === 4 ? .3 : -.6, Math.sin(a) * v, rand(2, 7), Math.cos(a) * v, rand(3, 4.5)); }
  for (let i = 0; i < 36; i++) { const a = rand(0, TAU), v = rand(1, 6); part(0, g.x, g.py + rand(.3, 1.6), g.z, Math.sin(a) * v, rand(1, 6), Math.cos(a) * v, rand(.4, .8), rand(.15, .35), .3, .7, .08, .9, 15, .5, -.2); } mark(g.x, g.z, 2.6, 2.6, rand(0, TAU), 3, .03, .055, .012, .8, 40, rand(0, 9)); }
const BIO = { molt: 1, graft: 1 };
function shockwave(r, dmg) { const g = G; for (const e of g.en) { if (e.dead) continue; const ex = e.x - g.x, ez = e.z - g.z, d = Math.hypot(ex, ez) || 1; if (d < r) { const k = e.big ? 5 : 17; e.kx += ex / d * k; e.kz += ez / d * k; if (e.state === 'tell' && !e.big) { e.state = 'rec'; e.st = .6; } hurtBug(e, dmg, ex / d, ez / d); } }
  DL.push({ x: g.x, z: g.z, sx: 1, sz: 1, rot: 0, kind: 1, r: .4, g: .7, b: 1, a: .9, t: 0, life: .35, seed: 0, grow: r * 2.6 }); g.pulse = { x: g.x, z: g.z, c: [.4, .65, 1], t: 1 }; g.trauma = Math.min(1, g.trauma + (.25) * FB); sfx.blast(); }
function hurtPlayer(d, dx, dz) { const g = G; if (g.inv > 0 || g.dead || g.demo || g.won) return;
  if (g.s.shock && g.shieldT <= 0) { g.shieldT = g.s.shock; g.inv = .5; shockwave(5, g.s.pow * 3); return; }       // the plating takes this one
  g.hp -= d * ST.dmg; g.inv = .45; g.hurtT = 1; g.sinceHit = 0; g.trauma = Math.min(1, g.trauma + (.45) * FB); if (ST.hitstop) g.freeze = .03; g.rec.v -= 5; g.roll.v += rand(-4, 4); g.vx += dx * 5; g.vz += dz * 5; g.arcT = .55; g.dip = 1; g.crouch.v += 3;
  for (let i = 0; i < 3; i++) debris(MESH.cube, g.x + rand(-.5, .5), rand(1.8, 2.6), g.z + rand(-.5, .5), rand(.2, .4), .05, rand(.2, .4), i ? YEL : DRK, 0, dx * rand(2, 6) + rand(-4, 4), rand(4, 8), dz * rand(2, 6) + rand(-4, 4), rand(1.5, 2.4));
  sparks(g.x, 2, g.z, dx, dz, 12, 1, .7, .3, 10); sfx.hurt();
  if (g.hp <= 0 && g.s.molt && !g.molted) { g.molted = true; g.hp = g.s.maxhp * .4; g.inv = 1.6; g.weakT = 12; shockwave(7, g.s.pow * 8); g.trauma = FB; g.crouch.v += 7; cap('The shell is shed. The cannon is slow for a while.', 4); for (let i = 0; i < 14; i++) debris(MESH.cube, g.x + rand(-.6, .6), rand(2, 3), g.z + rand(-.6, .6), rand(.3, .7), .07, rand(.3, .7), BONE, 0, rand(-9, 9), rand(4, 11), rand(-9, 9), rand(2, 3.5)); return; }
  if (g.hp <= 0) die(); else if (g.hp < 30) cap('Hull critical'); }
function die() { const g = G; g.hp = 0; g.dead = .001; g.dash = null; g.boom = 1; g.trauma = FB; sfx.boom(); cap('Wrecked'); mark(g.x, g.z, 3, 3, 0, 0, 0, 0, 0, .8, 60);
  for (let i = 0; i < 16; i++) debris(MESH.cube, g.x + rand(-.5, .5), rand(1.6, 2.8), g.z + rand(-.5, .5), rand(.2, .8), rand(.15, .5), rand(.2, .8), Math.random() < .6 ? YEL : DRK, 0, rand(-9, 9), rand(5, 14), rand(-9, 9), rand(3, 5));
  for (let i = 0; i < 40; i++) { const a = rand(0, TAU), s = rand(2, 13); part(0, g.x, rand(1.5, 2.6), g.z, Math.sin(a) * s, rand(1, 9), Math.cos(a) * s, rand(.4, 1), rand(.6, 1.6), 1, rand(.4, .7), .12, 1, 6, 2, -.6); } dust(g.x, g.z, 16, 7, .8); }
function startDash(dx, dz) { const g = G; if (!g || g.dash || g.dcd > 0 || g.dead || g.demo || state !== 'play') return; const l = Math.hypot(dx, dz); if (l < .01) { dx = Math.sin(g.head); dz = Math.cos(g.head); } else { dx /= l; dz /= l; }
  const B = DASH.burst * (g.s.chain ? 1.5 : 1); g.dash = { t: 0, dx, dz, hit: new Set(), skidded: false, B, back: false }; g.dcd = g.s.dashCd; g.inv = Math.max(g.inv, DASH.wind + B); g.crouch.v += 5.5; g.fov.v += 1.2; g.trauma = Math.min(1, g.trauma + (.22) * FB); sfx.dash();
  dust(g.x, g.z, 14, 6, .55); mark(g.x, g.z, 1.7, 1.7, 0, 0, 0, 0, 0, .55, 9); }
function stomp(f, side) { const g = G; g.bob.v -= 3.4; g.roll.v += side * 1.8; g.trauma = Math.min(1, g.trauma + (.035) * FB); dust(f.x, f.z, 3, 1.8, .3); if (!g.demo) sfx.step();
  mark(f.x + Math.sin(f.a) * .1, f.z + Math.cos(f.a) * .1, .6, .85, f.a, 0, 0, 0, 0, .2, 8); { const c = Math.cos(g.aim), sn = Math.sin(g.aim), q = side * .4; part(1, g.x + q * c - .84 * sn, g.py + 2.1, g.z - q * sn - .84 * c, rand(-.3, .3), rand(2, 3), rand(-.3, .3), .8, .2, .2, .2, .21, .35, 0, 1.2, .7); }      // a print on the pad and a chuff from the stack
  if (g.s.stride && !g.demo && !g.dead) { g.stompFx = 1; g.bob.v -= 1; g.trauma = Math.min(1, g.trauma + (.03) * FB); dust(f.x, f.z, 4, 3.5, .4); DL.push({ x: f.x, z: f.z, sx: .5, sz: .5, rot: 0, kind: 1, r: 1, g: .65, b: .2, a: .7, t: 0, life: .22, seed: 0, grow: 10 }); mark(f.x, f.z, .9, .9, rand(0, TAU), 3, 0, 0, 0, .45, 5, rand(0, 9));
    for (const e of g.en) { if (e.dead) continue; const ex = e.x - f.x, ez = e.z - f.z, d = Math.hypot(ex, ez) || 1; if (d < 2.5 + .4 * e.s) { e.kx += ex / d * (e.big ? 1 : 5); e.kz += ez / d * (e.big ? 1 : 5); hurtBug(e, g.s.pow * 1.6, ex / d, ez / d); } } } }
function gait(g, dt, burst) { const sp = Math.hypot(g.vx, g.vz), rx = Math.cos(g.head), rz = -Math.sin(g.head), ux = sp > .01 ? g.vx / sp : 0, uz = sp > .01 ? g.vz / sp : 0, mv = sp > 1.2;
  if (burst) { const d = g.dash, k = 1 - Math.exp(-dt * 40); for (let i = 0; i < 2; i++) { const f = g.feet[i], side = i ? -1 : 1, oz = i ? .7 : -.95, tx = g.x + d.dz * side * HIPW * 1.2 + d.dx * oz, tz = g.z - d.dx * side * HIPW * 1.2 + d.dz * oz; f.x += (tx - f.x) * k; f.z += (tz - f.z) * k; f.y = 0; f.sw = false; f.a = Math.atan2(d.dx, d.dz); } return; }   // braced and sliding
  let need = false; for (let i = 0; i < 2; i++) { const f = g.feet[i], side = i ? -1 : 1; if (f.sw || Math.hypot(f.x - g.x - rx * side * HIPW, f.z - g.z - rz * side * HIPW) > .42) need = true; }
  g.phase += mv ? sp / STRIDE * dt : need ? dt * 2.5 : 0; const lead = mv ? STRIDE * (1 - SWING) * .5 : 0;
  for (let i = 0; i < 2; i++) { const f = g.feet[i], side = i ? -1 : 1, ph = (g.phase + i * .5) % 1, hx = g.x + rx * side * HIPW + ux * lead, hz = g.z + rz * side * HIPW + uz * lead;
    if (ph < SWING && (mv || need)) { if (!f.sw) { f.sw = true; f.fx = f.x; f.fz = f.z; } const u = ph / SWING, q = ease(u), ah = mv ? (1 - u) * SWING * STRIDE : 0; f.x = lerp(f.fx, hx + ux * ah, q); f.z = lerp(f.fz, hz + uz * ah, q); f.y = Math.sin(u * Math.PI) * (mv ? .46 : .26); f.a += angDiff(f.a, g.head) * Math.min(1, dt * 16); }
    else if (f.sw) { f.sw = false; f.y = 0; stomp(f, side); } } }
function shoot(g) { const t = g.tgt, ca = Math.cos(g.aim), sa = Math.sin(g.aim), ox = g.x + GUNX * ca + GUNZ * sa + Math.sin(g.gunA) * GUNL, oy = g.muz[1], oz = g.z - GUNX * sa + GUNZ * ca + Math.cos(g.gunA) * GUNL; let a = g.gunA + rand(-1, 1) * g.s.spread;      // the shell starts at the muzzle, a barrel's length out from the pivot
  const dx = Math.sin(a), dz = Math.cos(a), rx = Math.cos(g.gunA), rz = -Math.sin(g.gunA);
  const boomShot = g.s.burst; let left = g.s.pierce + 1, from = 1.2 - GUNL, ex = ox + dx * g.s.range, ez = oz + dz * g.s.range, dmg = g.s.dmg * (g.s.focus && inBeam(g, t.x, t.z) ? 1.4 : 1), hit = false;
  while (left-- > 0) { let best = null, bt = g.s.range; for (const e of g.en) { if (e.dead) continue; const bx = e.x - ox, bz = e.z - oz, tt = bx * dx + bz * dz; if (tt < from || tt > bt + 1) continue; const p2 = bx * bx + bz * bz - tt * tt, r = .66 * e.s; if (p2 < r * r) { const th = tt - Math.sqrt(r * r - p2); if (th < bt && th >= from) { bt = th; best = e; } } }
    if (!best) break; hit = true; ex = ox + dx * g.s.range; ez = oz + dz * g.s.range; hurtBug(best, dmg, dx, dz, false, true); dmg *= .65; if (boomShot) { blast(ox + dx * bt, oz + dz * bt, 1.9, g.s.dmg * .55); left = 0; } from = bt + .7; if (left <= 0) { ex = ox + dx * bt; ez = oz + dz * bt; } }       // each bug it passes through takes a third off the shell
    TR.push({ x0: ox, y0: oy, z0: oz, x1: ex, y1: .55, z1: ez, t: 0, dur: Math.max(.04, Math.hypot(ex - ox, ez - oz) / 115), hv: 1 });
  g.flash = 1; g.fRot = rand(0, TAU); g.spinT += TAU / 3; g.lastShot = 0; g.rec.v += 7; g.kick.v += 27; g.roll.v += rand(-2.2, 2.2); g.bob.v -= .9; g.hk.v += 12; g.tw.v += 9; sfx.shot();       /* the whole hull is shoved back over its planted feet and twists off the gun side */
  for (let i = 0; i < 4; i++) part(1, ox + dx * .4, oy, oz + dz * .4, dx * rand(2, 7) + rand(-1, 1), rand(.2, 1.4), dz * rand(2, 7) + rand(-1, 1), rand(.5, .9), .22, .55, .5, .44, .3, 0, 3, 1.3);
  for (const q of [-1, 1]) { part(2, ox, oy, oz, rx * q * rand(7, 11), rand(0, 1.5), rz * q * rand(7, 11), .09, .09, 1, .75, .35, 1, 0, 6, 0, .07); part(1, ox + rx * q * .3, oy, oz + rz * q * .3, rx * q * rand(2, 4), rand(.3, 1), rz * q * rand(2, 4), rand(.4, .7), .18, .5, .46, .4, .25, 0, 3, 1); }      // the muzzle brake vents to both sides
  debris(MESH.cyl, ox - dx * 1.1, oy + .05, oz - dz * 1.1, .1, .3, .1, BRASS, -.9, -rx * rand(3.5, 6) - dx * 1.5, rand(4.5, 7), -rz * rand(3.5, 6) - dz * 1.5, 3.5); }

function update(dt) { const g = G; g.t += dt;
  let ix = 0, iz = 0; if (!g.demo && !g.dead) { if (stick) { ix = stick.dx; iz = stick.dy; } if (keys.w || keys.arrowup) iz -= 1; if (keys.s || keys.arrowdown) iz += 1; if (keys.a || keys.arrowleft) ix -= 1; if (keys.d || keys.arrowright) ix += 1; const l = Math.hypot(ix, iz); if (l > 1) { ix /= l; iz /= l; } }
  g.ix = ix; g.iz = iz;
  // dash: a short windup, a thruster burst, then a skid
  let burst = false; if (g.dash) { const d = g.dash; d.t += dt; if (d.t < DASH.wind + d.B) { burst = d.t >= DASH.wind; const v = (burst ? DASH.v : DASH.v * .12) * (d.slow || 1); g.vx = d.dx * v; g.vz = d.dz * v; } else { if (!d.skidded) { d.skidded = true; d.miss = d.hit.size === 0; if (!d.miss) g.dcd -= .8; sfx.skid(); dust(g.x, g.z, 8, 4, .5);       /* a ram that connects comes back sooner; one that hits nothing leaves the walker sliding with the cannon down */ if (g.s.chain > 1) { blast(g.x, g.z, 4.6, g.s.pow * 6); DL.push({ x: g.x, z: g.z, sx: 1, sz: 1, rot: 0, kind: 1, r: 1, g: .6, b: .2, a: .9, t: 0, life: .3, seed: 0, grow: 14 }); g.crouch.v += 6; g.trauma = Math.min(1, g.trauma + (.35) * FB); } } if (d.t > DASH.wind + d.B + (d.miss ? .6 : .2)) g.dash = null; } }
  if (!g.dash || g.dash.skidded) { const k = 1 - Math.exp(-dt * (g.dash ? (g.dash.miss ? 2.2 : 8) : g.s.accel)), v = g.s.speed; g.vx += (ix * v - g.vx) * k; g.vz += (iz * v - g.vz) * k; }
  if (g.dead) { g.vx *= Math.exp(-dt * 6); g.vz *= Math.exp(-dt * 6); }
  const ax = (g.vx - g.pvx) / dt, az = (g.vz - g.pvz) / dt; g.pvx = g.vx; g.pvz = g.vz; g.x += g.vx * dt; g.z += g.vz * dt; pushOut(g, 1.3); const sp = Math.hypot(g.vx, g.vz);
  if (sp > .8) g.head += clamp(angDiff(g.head, Math.atan2(g.vx, g.vz)), -dt * (g.dash ? 30 : g.s.turn), dt * (g.dash ? 30 : g.s.turn));
  g.jet += ((burst ? 1 : 0) - g.jet) * Math.min(1, dt * (burst ? 40 : 7));
  if (burst) { const d = g.dash, bx = g.x - d.dx * 1.2, bz = g.z - d.dz * 1.2;
    for (let i = 0; i < 3; i++) part(2, bx + rand(-.4, .4), rand(1.7, 2.1), bz + rand(-.4, .4), -d.dx * rand(8, 18) + rand(-2, 2), rand(-1, 2), -d.dz * rand(8, 18) + rand(-2, 2), rand(.12, .28), .09, 1, rand(.5, .8), .2, 1, 0, 3, 0, .05);
    part(1, bx, 1.6, bz, -d.dx * 3, 1, -d.dz * 3, .7, .5, .25, .23, .2, .3, 0, 2, 1.6);
    if (g.s.burn) { const lf = g.fires[g.fires.length - 1]; if (!lf || Math.hypot(lf.x - g.x, lf.z - g.z) > .9) g.fires.push({ x: g.x - d.dx * .6, z: g.z - d.dz * .6, t: g.s.burn }); }
    for (const e of g.en) { if (e.dead || d.hit.has(e)) continue; if (Math.hypot(e.x - g.x - d.dx * 1.7, e.z - g.z - d.dz * 1.7) < 1.7 + .4 * e.s) { d.hit.add(e); const ox = e.x - g.x, oz = e.z - g.z, side = Math.sign(ox * d.dz - oz * d.dx) || 1;
        if (e.big) { e.stag = e.boss ? .9 : 1.9; if (!e.boss || e.state === 'tell') { e.state = 'rec'; e.st = e.stag; e.vol = null; if (e.boss) e.cd = 1.2; } }       // ramming a guard knocks it out of whatever it was doing and leaves it open
        hurtBug(e, g.s.ramDmg, d.dx * .85 + d.dz * side * .5, d.dz * .85 - d.dx * side * .5, true); g.trauma = Math.min(1, g.trauma + (.3) * FB); if (ST.hitstop) g.freeze = Math.max(g.freeze, .028); sfx.ram(); } }
    for (const b of g.burrows) { if (!b.on || b.shut > 0 || Math.hypot(b.x - g.x, b.z - g.z) > 2.7) continue; b.shut = 18; b.pulse = 0; g.closed++; for (const e of g.en) if (e.emer > 0 && Math.hypot(e.x - b.x, e.z - b.z) < 2.6) hurtBug(e, 1e6, d.dx, d.dz, true);       // ramming an open burrow caves it in: nothing comes out of it for eighteen seconds
      dust(b.x, b.z, 16, 6, .7); for (let q = 0; q < 6; q++) debris(MESH.cube, b.x + rand(-1, 1), .3, b.z + rand(-1, 1), rand(.3, .7), rand(.12, .2), rand(.3, .6), CONC, 0, rand(-5, 5), rand(4, 9), rand(-5, 5), rand(2, 3)); g.trauma = Math.min(1, g.trauma + .3 * FB); if (ST.hitstop) g.freeze = Math.max(g.freeze, .05); g.crouch.v += 5; sfx.burrow(); sfx.blast(); if (!g.saidShut) { g.saidShut = true; cap('Burrow caved in. It will not stay shut.', 3.5); } } }
  if (g.dash && sp > 8) for (const f of g.feet) { sparks(f.x, .08, f.z, -g.vx, -g.vz, 1, 1, .6, .2, 7); if (Math.random() < .5) part(1, f.x, .15, f.z, rand(-1, 1), rand(.4, 1.2), rand(-1, 1), .6, .3, .2, .19, .17, .28, 0, 2, 1.4); if (Math.random() < .6) mark(f.x, f.z, .13, .6, Math.atan2(g.vx, g.vz), 2, 0, 0, 0, .3, 7); }
  // aim and fire: the torso turns to the target on its own while the legs go where the thumb says
  g.fireTick -= dt; const tickNow = g.fireTick <= 0; if (tickNow) g.fireTick = .2;
  let near = null, nd = g.s.range * g.s.range; if (!g.dead && !g.demo) for (const e of g.en) { if (e.dead) continue; const d2 = (e.x - g.x) ** 2 + (e.z - g.z) ** 2 - (e.state === 'tell' || e.state === 'lunge' ? 12 : 0); if (d2 < nd) { nd = d2; near = e; } }
  if (g.tgt && (g.tgt.dead || (g.tgt.x - g.x) ** 2 + (g.tgt.z - g.z) ** 2 > g.s.range * g.s.range)) g.tgt = null;
  if (near && (!g.tgt || nd < ((g.tgt.x - g.x) ** 2 + (g.tgt.z - g.z) ** 2) * .55 - 2)) g.tgt = near; if (!near) g.tgt = null;
  for (const e of g.en) if (e.big && e.stag > 0 && !e.dead && e.emer <= 0 && (e.x - g.x) ** 2 + (e.z - g.z) ** 2 < g.s.range * g.s.range) { g.tgt = e; break; }       // a staggered guard is the opening: the cannon takes it
  const t = g.tgt; let aimT = g.aim, dT = 8; if (burst) aimT = Math.atan2(g.dash.dx, g.dash.dz); else if (t) { aimT = Math.atan2(t.x + t.vx * .05 - g.x, t.z + t.vz * .05 - g.z); dT = Math.hypot(t.x - g.x, t.z - g.z); } else if (g.demo) aimT = .55 + Math.sin(g.t * .5) * .5; else if (sp > 1) aimT = g.head;
  const da = angDiff(g.aim, aimT); g.aimV += (da * 230 - g.aimV * 30) * dt; g.aimV = clamp(g.aimV, -17, 17); g.aim += g.aimV * dt;
  /* the cannon is on its own pivot at the shoulder. It lays itself on the target from where it actually sits, and a shell leaves along the barrel, never at an angle to it */
  { const ca = Math.cos(g.aim), sa = Math.sin(g.aim), px = g.x + GUNX * ca + GUNZ * sa, pz = g.z - GUNX * sa + GUNZ * ca; g.gunT = t && !burst ? Math.atan2(t.x - px, t.z - pz) : g.aim;
    g.gunV += (angDiff(g.gunA, g.gunT) * 420 - g.gunV * 41) * dt; g.gunV = clamp(g.gunV, -26, 26); g.gunA += g.gunV * dt; g.gunA = g.aim + clamp(angDiff(g.aim, g.gunA), -1.15, 1.15); }
  g.lampV += (angDiff(g.lamp, g.aim) * 30 - g.lampV * 11) * dt; g.lampV = clamp(g.lampV, -3.6, 3.6); g.lamp += g.lampV * dt;      // the lamp is on its own swivel: it follows the gun, but a quick snap of the torso does not throw the light around
  spring(g.pitch, t ? Math.atan2(1.7, dT + .5) : .12, 120, 18, dt);
  g.spin += (g.spinT - g.spin) * Math.min(1, dt * 16); g.lastShot += dt; { const kd = Math.exp(-dt * 9); g.ck.x *= kd; g.ck.z *= kd; }
  if (t && !burst && !(g.dash && g.dash.miss) && Math.abs(angDiff(g.gunA, g.gunT)) < .16 && Math.abs(angDiff(g.aim, g.gunT)) < 1.15) { g.fireT -= dt; while (g.fireT <= 0 && g.tgt) { g.fireT += 1 / (g.s.rate * (g.weakT > 0 ? .5 : 1)); g.gunA = g.gunT; g.gunV = 0; shoot(g); if (g.tgt.dead) g.tgt = null; } } else g.fireT = Math.min(g.fireT, .1);
  if (!g.dead && !g.won && !g.demo) {
    if (g.s.mortar) { g.mortT -= dt; if (g.mortT <= 0) { const live = g.en.filter(e => { const d2 = (e.x - g.x) ** 2 + (e.z - g.z) ** 2; return !e.dead && d2 < 121 && d2 > 16; }), used = []; g.mortT = live.length ? 3 : .3;
      for (let k = 0; k < g.s.mortar && live.length; k++) { let best = null, bs = 0; for (const e of live) { if (used.some(u => Math.hypot(u.x - e.x, u.z - e.z) < 3.4)) continue; let n = e.big ? 3 : 1; for (const o of live) if (o !== e && Math.hypot(o.x - e.x, o.z - e.z) < 3) n++; if (n > bs) { bs = n; best = e; } }
        if (!best) break; used.push(best); g.shells.push({ x0: g.x + Math.cos(g.aim) * 1.1, y0: g.py + 2.6, z0: g.z - Math.sin(g.aim) * 1.1, x1: best.x + best.vx * .5, z1: best.z + best.vz * .5, t: -k * .12, dur: .8 }); }
      if (used.length) { sfx.mortar(); g.rec.v -= 3; g.bob.v -= 2; g.crouch.v += 2.5; g.trauma = Math.min(1, g.trauma + (.08) * FB); const mx = g.x + Math.cos(g.aim) * 1.1, mz = g.z - Math.sin(g.aim) * 1.1; part(0, mx, g.py + 2.9, mz, 0, 1, 0, .1, 1.6, 1, .7, .3, .9, 0, 0, 3); for (let i = 0; i < 5; i++) part(1, mx, g.py + 2.3, mz, rand(-1.5, 1.5), rand(1, 3), rand(-1.5, 1.5), rand(.6, 1), .25, .3, .28, .26, .35, 0, 2, 1); } } }
    if (g.s.coil) { g.coilT -= dt; if (g.coilT <= 0) { const pts = [[g.x - Math.sin(g.aim) * .7, g.py + 1.7, g.z - Math.cos(g.aim) * .7]], hit = []; let cx = g.x, cz = g.z, range = 4.6;
      while (hit.length < g.s.coil) { let best = null, bd = range; for (const e of g.en) { if (e.dead || hit.includes(e)) continue; const d = Math.hypot(e.x - cx, e.z - cz); if (d < bd) { bd = d; best = e; } } if (!best) break; hit.push(best); pts.push([best.x, .6 * best.s, best.z]); cx = best.x; cz = best.z; range = 3.4; }
      if (hit.length) { g.coilT = 1.2; g.bolts.push({ pts, t: .16 }); g.pulse = { x: pts[1][0], z: pts[1][2], c: [.4, .6, 1], t: .8 }; for (const e of hit) { if (e.spit && e.state === 'tell') { e.state = 'rec'; e.st = .9; e.cd = 2; } hurtBug(e, g.s.pow * 2.4, 0, 0); } sfx.zap(); } else g.coilT = .15; } }
    if (g.s.graft) { g.graftT -= dt; if (g.graftT <= 0) { let a = null, b = null, ad = 100, bd = 100; for (const e of g.en) { if (e.dead) continue; const d2 = (e.x - g.x) ** 2 + (e.z - g.z) ** 2; if (d2 < ad) { b = a; bd = ad; a = e; ad = d2; } else if (d2 < bd) { b = e; bd = d2; } } const tg = b || a;
      if (tg) { g.graftT = 1.5; const P = g.graftP, l = Math.hypot(tg.x - P[0], tg.z - P[2]) || 1; TR.push({ x0: P[0], y0: P[1], z0: P[2], x1: tg.x, y1: .55, z1: tg.z, t: 0, dur: Math.max(.04, l / 60), c: 2 }); hurtBug(tg, g.s.pow * 2, (tg.x - P[0]) / l, (tg.z - P[2]) / l); g.fires.push({ x: tg.x, z: tg.z, t: 3, acid: 1 }); sfx.spit(); sfx.splat(); } else g.graftT = .15; } }
  }
  for (const e of g.allies) updAlly(e, dt); for (let i = g.allies.length - 1; i >= 0; i--) if (g.allies[i].dead) g.allies.splice(i, 1); if (g.dead || g.won) for (const e of g.allies) e.life = Math.min(e.life, .3);
  let stg = 0; for (let i = 1; i < 7; i++) { const on = i <= 2 && g.items.some(id => CARD[id].grp === 'organ') && !g.shed; if (on) stg = i; spring(g.gr[i], on ? 1 : 0, 70, 9, dt); } g.stage = stg;
  g.stompFx = Math.max(0, g.stompFx - dt * 5);
  for (let i = g.shells.length - 1; i >= 0; i--) { const sh = g.shells[i]; sh.t += dt; if (sh.t > 0 && Math.random() < dt * 40) { const u = sh.t / sh.dur; part(1, lerp(sh.x0, sh.x1, u), lerp(sh.y0, .3, u) + Math.sin(u * Math.PI) * 6, lerp(sh.z0, sh.z1, u), 0, .3, 0, .5, .2, .3, .28, .25, .35, 0, 1, .6); } if (sh.t >= sh.dur) { g.shells.splice(i, 1); blast(sh.x1, sh.z1, 3.1, g.s.pow * 5); } }
  for (let i = g.globs.length - 1; i >= 0; i--) { const b = g.globs[i]; b.t += dt; if (b.t >= b.dur) { g.globs.splice(i, 1); g.pools.push({ x: b.x1, z: b.z1, t: 3.6, seed: rand(0, 9) }); sfx.splat(); for (let k = 0; k < 8; k++) { const a = rand(0, TAU), v = rand(1, 4); part(0, b.x1, .3, b.z1, Math.sin(a) * v, rand(1, 4), Math.cos(a) * v, rand(.25, .45), rand(.3, .5), .7, .9, .15, .7, 10, 1, -.5); } if (Math.hypot(g.x - b.x1, g.z - b.z1) < 2) hurtPlayer(10, 0, 0); } }
  for (let i = g.pools.length - 1; i >= 0; i--) { const q = g.pools[i]; q.t -= dt; if (q.t <= 0) { g.pools.splice(i, 1); continue; } if (q.t > .4 && Math.hypot(g.x - q.x, g.z - q.z) < 1.8) hurtPlayer(6, 0, 0); if (Math.random() < dt * 5) part(0, q.x + rand(-1.2, 1.2), .15, q.z + rand(-1.2, 1.2), 0, rand(.8, 1.6), 0, .5, .22, .7, .9, .15, .5, 0, 1, -.2); }
  for (let i = g.bolts.length - 1; i >= 0; i--) { g.bolts[i].t -= dt; if (g.bolts[i].t <= 0) g.bolts.splice(i, 1); }
  g.power += ((g.dead ? 0 : g.won ? 1 : g.bossUp ? .3 : g.cues.length ? .55 : 1) - g.power) * Math.min(1, dt * (g.won ? .8 : 3));       /* the floodlights sag when a swarm is called and all but fail while the mother is in the yard */
  g.shieldT -= dt; g.weakT -= dt; for (const b of g.burrows) { b.pulse = Math.max(0, b.pulse - dt * 1.6); b.born += dt; if (b.shut > 0) { b.shut -= dt; if (b.shut <= 0) { b.born = 0; b.pulse = 1; sfx.burrow(); dust(b.x, b.z, 9, 5, .5); } continue; } if (b.on && Math.random() < dt * .8) part(1, b.x + rand(-.5, .5), .2, b.z + rand(-.5, .5), 0, rand(.4, .9), 0, 1.4, .3, .1, .14, .06, .25, 0, .5, .5); }
  if (g.bossDead && !g.won) { g.won = .001; g.inv = 99; sfx.win(); cap('She is dead.', 3); if (ST.hitstop) g.freeze = .12; g.trauma = Math.min(1, g.trauma + .6 * FB); for (const e of g.en) { const ex = e.x - g.bossX, ez = e.z - g.bossZ, d = Math.hypot(ex, ez) || 1; hurtBug(e, 1e9, ex / d, ez / d); }
    for (let i = 0; i < 6; i++) g.blasts.push({ x: g.bossX + rand(-2.5, 2.5), z: g.bossZ + rand(-2.5, 2.5), r: rand(2.5, 4), dmg: 0, col: [.6, 1, .25], t: .1 + i * .16 }); }
  if (g.won) { g.won += dt; const org = g.items.some(id => BIO[id]); if (org && g.won > 1.5 && !g.shed) shed(g); if (g.won > (org ? 4.4 : 3) && state === 'play') endGame(true); }      // only what was alive falls off; steel stays bolted on
  if (whineG) { whineG.gain.value = state === 'play' ? g.heat * .018 : 0; whine.frequency.value = 48 + g.heat * 26; }
  audioTick(g, dt);
  // the body: planted feet, and springs for everything that should feel like mass
  gait(g, dt, burst);
  spring(g.lx, clamp(g.vx * .011 + ax * .0032, -.5, .5), 110, 13, dt); spring(g.lz, clamp(g.vz * .011 + az * .0032, -.5, .5), 110, 13, dt);
  spring(g.hk, 0, 160, 14, dt); spring(g.tw, 0, 200, 14, dt); spring(g.bob, 0, 190, 15, dt); spring(g.roll, 0, 150, 12, dt); spring(g.rec, 0, 200, 16, dt); spring(g.kick, 0, 230, 19, dt); spring(g.crouch, 0, 130, 13, dt); spring(g.fov, 0, 85, 11, dt); spring(g.ram, burst ? 1 : 0, 300, 22, dt);
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
  encounter(dt);
  for (let i = g.corpses.length - 1; i >= 0; i--) { const c = g.corpses[i]; c.t += dt; c.x += c.vx * dt; c.z += c.vz * dt; const kd = Math.exp(-dt * 4.5); c.vx *= kd; c.vz *= kd; if (c.t > 7) g.corpses.splice(i, 1); } for (let i = g.relics.length - 1; i >= 0; i--) { const r = g.relics[i]; r.t += dt; if (r.t > r.life) g.relics.splice(i, 1); }
  // fires burn whether or not anything is looking at them, but only the near ones are worth the particles
  for (const p of PROPS) if (p.k === 'fire' && Math.abs(p.x - g.cam.x) < 14 && Math.abs(p.z - g.cam.z + 6) < 22) { if (Math.random() < dt * 34) part(0, p.x + rand(-.22, .22), 1.05, p.z + rand(-.22, .22), rand(-.3, .3), rand(1.6, 3.2), rand(-.3, .3), rand(.35, .7), rand(.45, .75), 1, rand(.38, .6), .08, .8, -1.5, .5, -.7); if (Math.random() < dt * 2.5) part(2, p.x, 1.3, p.z, rand(-1, 1), rand(3, 5), rand(-1, 1), rand(.5, 1), .035, 1, .6, .2, 1, 3, .5, 0, .03); }
  // flying things
  for (let i = PT.length - 1; i >= 0; i--) { const p = PT[i]; p.t += dt; if (p.t >= p.life) { PT[i] = PT[PT.length - 1]; PT.pop(); continue; } const kd = Math.exp(-p.drag * dt); p.vx *= kd; p.vy = p.vy * kd - p.grav * dt; p.vz *= kd; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.y < .03 && p.grav > 0) { p.y = .03; p.vy *= -.35; p.vx *= .6; p.vz *= .6; } }
  for (let i = DB.length - 1; i >= 0; i--) { const b = DB[i]; b.t += dt; if (b.t >= b.life) { DB.splice(i, 1); continue; } b.vy -= 26 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; b.ax += b.wx * dt; b.ay += b.wy * dt; if (b.y < b.rad) { b.y = b.rad; if (b.vy < -2) { b.vy *= -.38; b.vx *= .6; b.vz *= .6; b.wx *= .5; b.wy *= .5; } else { b.vy = 0; b.vx *= Math.exp(-dt * 9); b.vz *= Math.exp(-dt * 9); b.wx *= Math.exp(-dt * 12); b.wy *= Math.exp(-dt * 12); } } }
  for (let i = DL.length - 1; i >= 0; i--) { const d = DL[i]; d.t += dt; if (d.grow) { d.sx += d.grow * dt; d.sz += d.grow * dt; } if (d.t >= d.life) DL.splice(i, 1); }
  for (let i = TR.length - 1; i >= 0; i--) { const r = TR[i]; r.t += dt; if (r.t >= r.dur && !r.done) { r.done = true; if (r.y1 < 1) { sparks(r.x1, r.y1, r.z1, r.x0 - r.x1, r.z0 - r.z1, r.hv ? 7 : 2, 1, .8, .4, r.hv ? 9 : 5); if (r.hv) dust(r.x1, r.z1, 3, 2.5, .3); } } if (r.t >= r.dur + (r.hv ? .13 : 0)) TR.splice(i, 1); }
  if (g.cap) { g.cap.t -= dt; if (g.cap.t <= 0) g.cap = null; }
  for (let i = g.cues.length - 1; i >= 0; i--) { g.cues[i].t -= dt; if (g.cues[i].t <= 0) g.cues.splice(i, 1); }
  // drops, fire on the ground, delayed blasts
  for (let i = g.drops.length - 1; i >= 0; i--) { const d = g.drops[i]; d.t += dt; const dx = g.x - d.x, dz = g.z - d.z, l = Math.hypot(dx, dz) || 1; if (!g.dead && d.k === 'fix' && l < g.s.magnet && d.t > .35) { const v = 16 * (1 - l / (g.s.magnet + 2)) + 4; d.x += dx / l * v * dt; d.z += dz / l * v * dt; }
    if (!g.dead && l < 1.5 && d.t > .35) { if (d.k === 'salv' || d.k === 'organ') openChoice(d.k === 'organ' ? 'organ' : 'hw'); else { g.hp = Math.min(g.s.maxhp, g.hp + 25); sfx.repair(); g.itemFx = .6; g.itemCol = [.3, 1, .5]; } g.drops.splice(i, 1); } else if (d.t > 45 && d.k === 'fix') g.drops.splice(i, 1); }      // salvage waits to be walked onto, so the choice comes when you decide to take it
  const tick = tickNow;
  for (let i = g.fires.length - 1; i >= 0; i--) { const f = g.fires[i]; f.t -= dt; if (f.t <= 0) { g.fires.splice(i, 1); continue; } if (f.acid) { if (Math.random() < dt * 8) part(0, f.x + rand(-1, 1), .15, f.z + rand(-1, 1), 0, rand(.8, 1.6), 0, .5, .22, .7, .9, .15, .5, 0, 1, -.2); } else if (Math.random() < dt * 26) part(0, f.x + rand(-.4, .4), .2, f.z + rand(-.4, .4), rand(-.3, .3), rand(1.5, 3), rand(-.3, .3), rand(.3, .55), rand(.4, .7) * Math.min(1, f.t), 1, rand(.4, .6), .1, .8, -1, .5, -.7);
    if (tick) for (const e of g.en) if (!e.dead && Math.hypot(e.x - f.x, e.z - f.z) < (f.acid ? 1.6 : 1.25)) { hurtBug(e, g.s.pow * .9, 0, 0); if (!f.acid) e.burnT = .3; } }
  for (let i = g.blasts.length - 1; i >= 0; i--) { const b = g.blasts[i]; b.t -= dt; if (b.t <= 0) { g.blasts.splice(i, 1); doBlast(b); } }
  if (g.pulse) { g.pulse.t -= dt * 5; if (g.pulse.t <= 0) g.pulse = null; } g.itemFx = Math.max(0, g.itemFx - dt * 1.6);
}
/* camera and shake run on real time, so they stay alive through a hit-stop */
function camUpdate(dt) { const g = G; g.trauma = Math.max(0, g.trauma - dt * 1.4); const k = 1 - Math.exp(-dt * 7.5), kl = 1 - Math.exp(-dt * 3); g.lookX += (g.ix * g.s.speed - g.lookX) * kl; g.lookZ += (g.iz * g.s.speed - g.lookZ) * kl; /* the camera frames the exchange, not just the walker: it leans toward whichever animal is winding up, pouncing or stuck, or else the nearest, so the pose that matters is never off the edge of the screen. It leans slowly, so it pans and never jerks */
  let th = null, tw = 14 * 14; if (!g.demo && !g.dead) for (const e of g.en) { if (e.dead) continue; const d2 = (e.x - g.x) ** 2 + (e.z - g.z) ** 2, w = e.state === 'tell' || e.state === 'pounce' || e.state === 'stuck' || e.state === 'down' ? d2 * .3 : d2; if (w < tw) { tw = w; th = e; } }
  const c = g.cam, kf = 1 - Math.exp(-dt * 2.6); c.fx = (c.fx || 0) + ((th ? clamp((th.x - g.x) * .42, -2.6, 2.6) : 0) - (c.fx || 0)) * kf; c.fz = (c.fz || 0) + ((th ? clamp((th.z - g.z) * .3, -2.2, 2.6) : 0) - (c.fz || 0)) * kf;
  const tx = g.x + g.lookX * .1 + c.fx, tz = g.z + g.lookZ * .1 + c.fz; g.cam.x += ((g.demo ? tx : clamp(tx, YARD.x0 + 4.5, YARD.x1 - 4.5)) - g.cam.x) * k; g.cam.z += ((g.demo ? tz : clamp(tz, YARD.z0 + 5, YARD.z1 - 3)) - g.cam.z) * k; g.cam.d += ((g.demo ? .5 : 1) - g.cam.d) * (1 - Math.exp(-dt * 3)); }

/* ---------- drawing ---------- */
const _H = [0, 0, 0], _K = [0, 0, 0], _A = [0, 0, 0], _B = [0, 0, 0], _P = [0, 0, 0], _F = [0, 0, 0];
function W0() { push(); M4.ident(STK[sp]); }
function xfd(x, y, z, o) { const m = STK[sp]; o[0] = m[0] * x + m[4] * y + m[8] * z; o[1] = m[1] * x + m[5] * y + m[9] * z; o[2] = m[2] * x + m[6] * y + m[10] * z; return o; }
function box(x, y, z, sx, sy, sz, col, e) { push(); T(x, y, z); draw(MESH.cube, sx, sy, sz, col, e); pop(); }
function fitK(g, id) { if (!g.items.includes(id) || (g.shed && BIO[id])) return 0; const u = clamp((g.t - (g.fitT[id] || 0)) / .45, 0, 1), c = 1.70158; return Math.max(.001, 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2)); }      // a new fitting pops out and settles
function at(x, y, z, k) { push(); T(x, y, z); SCL(k); T(-x, -y, -z); }
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
/* The walker. Chosen from three blockouts as a flat black shape (design/blockouts): the right arm is the gun and outweighs everything, the left is a short
   pile-driver carried low, and the mechanic sits in an open bucket on the front-left corner as the counterweight. From above it is an L, so which way it
   faces and which arm is which can be read at any angle. The hips are on a boom wider than the body, so both legs show.
   Three values only: one body colour, a near-black frame, and the lit bucket. */
const MBODY = [.86, .5, .05], MFRAME = [.05, .055, .065], MSKIN = [.6, .58, .52], MPANEL = [1, .6, .2], NAVY = [.06, .085, .14], GUNX = -1.35, GUNZ = -.1, GUNL = 4.3;
function drawMech(g) {
  const hx = Math.sin(g.head), hz = Math.cos(g.head), rx = hz, rz = -hx, sp = Math.hypot(g.vx, g.vz), wk = clamp(sp / 6, 0, 1), burst = g.ram.x, FW = [hx, 0, hz], RT = [rx, 0, rz];
  let py = HIP + g.bob.x - Math.max(-.1, g.crouch.x) * .34 - g.heat * .05;
  for (let i = 0; i < 2; i++) { const f = g.feet[i], side = i ? -1 : 1, dh = Math.hypot(f.x - g.x - rx * side * HIPW, f.z - g.z - rz * side * HIPW); py = Math.min(py, Math.sqrt(Math.max(.5, REACH * REACH - dh * dh)) + f.y * .5 + .2); }
  g.py = py; g.bulk = 1; const sway = Math.sin(g.phase * TAU) * .11 * wk, twist = Math.sin(g.phase * TAU) * .07 * wk, hk = g.hk.x * .2, gx = Math.sin(g.gunA), gz = Math.cos(g.gunA); let k;
  decal(g.x, g.z, 2.5, 2.5, 0, 0, 0, 0, 0, .6);
  reset(); T(g.x + rx * sway - gx * hk, py, g.z + rz * sway - gz * hk); RX(g.lz.x); RZ(-g.lx.x); RY(g.head + twist);
  box(0, 0, 0, HIPW * 2 + .5, .46, .8, MFRAME, -.6); box(0, .02, .42, 1.3, .3, .1, MBODY); push(); T(0, .3, 0); draw(MESH.cyl, 1.15, .24, 1.15, MFRAME, -.8); pop();       /* the hip boom */
  for (let i = 0; i < 2; i++) { const f = g.feet[i], side = i ? -1 : 1; xf(side * HIPW, -.06, 0, _H); _A[0] = f.x; _A[1] = f.y + .26; _A[2] = f.z; _P[0] = -hx; _P[1] = .3; _P[2] = -hz; ik2(_H, _A, L1, L2, _P, _K);
    seg(MESH.cube, _H, _K, .54, .68, MBODY, 0, RT); seg(MESH.cube, _K, _A, .38, .44, MFRAME, -.7, RT);
    for (let q = 0; q < 3; q++) { _B[q] = lerp(_H[q], _K[q], .25) - FW[q] * .42; _F[q] = lerp(_K[q], _A[q], .5) - FW[q] * .12; } seg(MESH.cyl, _B, _F, .15, .15, MFRAME, -.9);       /* the piston behind the knee */
    W0(); T(_K[0], _K[1], _K[2]); RY(g.head); RZ(Math.PI / 2); draw(MESH.cyl, .62, .7, .62, MFRAME, -.7); pop();
    W0(); T(_H[0], _H[1], _H[2]); RY(g.head); RZ(Math.PI / 2); draw(MESH.cyl, .7, .5, .7, MFRAME, -.7); pop();
    W0(); T(f.x, f.y + .13, f.z); RY(f.a); RX(f.sw ? Math.sin((g.phase + i * .5) % 1 / SWING * Math.PI * 2) * .3 : 0); box(0, 0, .12, 1.0, .28, 1.6, MFRAME, -.6); box(0, .16, .1, .84, .1, 1.3, MBODY); box(0, .0, .96, 1.0, .24, .22, MBODY); pop();
    decal(f.x, f.z, .75, 1.0, f.a, 0, 0, 0, 0, .62 * (1 - Math.min(1, f.y * 2.2))); }
  if (g.dead) { glow(g.x, py + .5, g.z, 2.4 + Math.sin(g.t * 30) * .3, 1, .5, .12, .5); return; }
  // torso: turns to the target on the hip ring, pitches with recoil, twists off the gun side with each shell
  T(0, .42, 0); RY(g.aim - g.head - twist + g.tw.x * .17); RX(-g.rec.x * .3 + burst * .2); RZ(g.roll.x * .04 + clamp(g.aimV, -17, 17) * .006);
  box(0, .65, -.2, 1.5, 1.0, 1.4, MBODY); box(0, 1.17, -.2, 1.2, .06, 1.1, MFRAME, -.6); box(.1, .7, -1.15, 1.25, .9, .62, MFRAME, -.6); for (const y of [.5, .75, 1.0]) box(.1, y, -1.47, 1.0, .1, .04, MBODY);       /* core, deck, engine */
  push(); T(.55, 1.65, -1.2); draw(MESH.cyl, .26, 1.1, .26, MFRAME, -.8); pop();       /* one stack */
  for (const q of [-1, 1]) { push(); T(.1 + q * .36, .45, -1.5); RX(-Math.PI / 2); k = g.s.burn ? fitK(g, 'burn') : 0; draw(MESH.cyl, .4 + k * .2, .3 + k * .2, .4 + k * .2, MFRAME, -.8); if (k > 0) { T(0, .2, 0); draw(MESH.cyl, .7 * k, .1, .7 * k, [.8, .25, .05], .7 + g.jet * 3); T(0, -.2, 0); } if (g.jet > .03) { const L = (1.7 + Math.sin(g.t * 90 + q) * .25) * g.jet; T(0, .1 + L / 2, 0); draw(MESH.cone, .36, L, .36, [1, .55, .15], 5 * g.jet); T(0, -L * .2, 0); draw(MESH.cone, .18, L * .55, .18, [.8, .9, 1], 7 * g.jet); } pop(); }
  if (g.jet > .03) { xf(.1, .45, -2.1, _B); glow(_B[0], _B[1], _B[2], 2.6 * g.jet, 1, .6, .25, .7 * g.jet); }
  /* the bucket: an open tub on the front-left corner with the mechanic in it, a hoop over, the panel lit in front */
  box(.55, .45, .9, 1.15, .7, 1.05, MBODY); box(.55, .52, .9, .9, .66, .8, MFRAME);
  { const bobp = Math.sin(g.phase * TAU * 2) * .02 * wk, lookA = clamp(angDiff(g.aim, g.gunA), -.6, .6) * .6 - .25; box(.55, .55, .58, .6, .8, .14, MFRAME); box(.55, .68 + bobp, .78, .58, .5, .36, [.09, .1, .13]); push(); T(.55, 1.1 + bobp, .82); RY(lookA); draw(MESH.sph, .44, .44, .46, MSKIN, -.7); box(0, 0, .2, .3, .1, .06, [.9, .6, .2], 1.2); pop();
    for (const q of [-1, 1]) { xf(.55 + q * .3, .8 + bobp, .88, _A); xf(.55 + q * .36, .62, 1.22, _B); seg(MESH.cube, _A, _B, .13, .13, [.09, .1, .13]); } box(.55, .5, 1.3, .7, .12, .1, MPANEL, 1.4); }
  for (const q of [0, 1.1]) { xf(q, .6, .42, _A); xf(q, 1.3, .42, _B); seg(MESH.cube, _A, _B, .15, .15, MBODY); } xf(0, 1.3, .42, _A); xf(1.1, 1.3, .42, _B); seg(MESH.cube, _A, _B, .15, .15, MBODY);
  box(-.1, .98, 1.5, .36, .1, .36, MFRAME); push(); T(-.1, 1.06, 1.5); RY(angDiff(g.aim, g.lamp)); draw(MESH.cyl, .24, .14, .24, MFRAME, -.8);       /* the work lamp on its swivel, on the front corner of the hull ahead of everything, so the walker does not stand in its own light */
    push(); T(0, .14, .2); RX(Math.PI / 2 - .5); draw(MESH.cyl, .52, .34, .52, MFRAME, -.7); T(0, .17, 0); draw(MESH.cyl, .42, .03, .42, [1, .92, .75], 3); pop(); xf(0, .1, .42, _B); glow(_B[0], _B[1], _B[2], .42, 1, .9, .7, .5); xf(0, .08, .76, g.lampP); xfd(0, -.72, 1, g.lampD); pop();
  // the gun arm: a breech the size of the core, a drum behind the shoulder, three barrels as long as the walker is tall
  box(-.95, .85, -.1, .5, .5, .5, MFRAME); push(); T(GUNX, .85, GUNZ); push(); T(0, 0, -1.0); RZ(Math.PI / 2); draw(MESH.cyl, 1.2, .72, 1.2, MBODY); T(0, .38, 0); draw(MESH.cyl, .8, .06, .8, MFRAME); pop();
    RY(angDiff(g.aim, g.gunA)); RX(g.pitch.x + Math.sin(g.phase * TAU * 2) * .03 * wk - g.kick.x * .05); T(0, 0, -clamp(g.kick.x, -.3, 1.6) * .33);
    box(0, 0, 0, 1.0, 1.0, 1.4, MFRAME, -.6); box(0, .53, 0, .8, .08, 1.2, MBODY); box(.53, .05, -.1, .06, .4, .7, BRASS, -.9);
    push(); T(0, 0, 1.35); RX(Math.PI / 2); draw(MESH.cyl, .98, 1.4, .98, MBODY); pop();       /* the shroud */
    push(); T(0, 0, 2.55); RZ(g.spin); for (let q = 0; q < 3; q++) { push(); RZ(q * TAU / 3); T(0, .22, 0); RX(Math.PI / 2); draw(MESH.cyl, .32, 3.3, .32, g.hot > .05 ? mix3(MFRAME, [1, .3, .05], g.hot * .4) : MFRAME, g.hot > .05 ? g.hot * .5 : -.9); pop(); } pop();
    for (const z of [2.6, 4.12]) { push(); T(0, 0, z); RX(Math.PI / 2); draw(MESH.cyl, z > 4 ? .92 : .8, z > 4 ? .34 : .14, z > 4 ? .92 : .8, MFRAME, -.7); pop(); }
    xf(0, 0, GUNL, _B); g.muz[0] = _B[0] - g.x; g.muz[1] = _B[1]; g.muz[2] = _B[2] - g.z;
    if (g.flash > .2) { const f = Math.min(1, (g.flash - .2) * 1.6); glow(_B[0], _B[1], _B[2], 2.2 * f + .3, 1, .8, .4, f); xfd(0, 0, 1, _F); sprite(PADD, _B[0] + _F[0] * 1.0, _B[1] + _F[1] * 1.0, _B[2] + _F[2] * 1.0, .55 * f, 0, _F[0] * 1.6, _F[1] * 1.6, _F[2] * 1.6, 1, .75, .35, f); for (const q of [-1, 1]) { xfd(q, .1, .1, _F); sprite(PADD, _B[0] + _F[0] * .5, _B[1] + _F[1] * .5, _B[2] + _F[2] * .5, .22 * f, 0, _F[0] * .6, _F[1] * .6, _F[2] * .6, 1, .7, .3, f * .9); } }       /* a short flash, smaller than what it is aimed at */
  pop();
  // the ram: a short pile-driver with a square head, carried low on the left. It punches across the front in a dash. Ram Charger fits a bigger toothed head and a second cylinder
  const r = clamp(g.ram.x, -.2, 1.25), rc = fitK(g, 'ramc'), hs = 1.4 + rc * .7, hxp = lerp(1.85, .3, r), hzp = 2.3 + r * 1.5;
  box(1.2, .78, -.1, .8, .7, .8, MBODY); xf(1.45, .75, -.05, _A); xf(lerp(1.85, 1.2, r), .5, .8 + r * .5, _K); seg(MESH.cube, _A, _K, .66, .72, MFRAME, -.6); xf(hxp, .1, hzp - .15, _F); seg(MESH.cube, _K, _F, .42, .42, MFRAME, -.9); xf(1.0, .95, -.4, _B); seg(MESH.cyl, _B, _K, .2, .2, MBODY);
  if (rc > 0) { xf(1.3, 1.0, -.5, _B); seg(MESH.cyl, _B, _F, .26 * rc, .26 * rc, BRASS, -.9); push(); T(1.3, 1.15, -.6); RX(Math.PI / 2); draw(MESH.cyl, .5 * rc, 1.0 * rc, .5 * rc, MBODY); pop(); }
  push(); T(hxp, .1, hzp); draw(MESH.cube, hs, hs, .5, MBODY); T(0, 0, .28); draw(MESH.cube, hs + .1, hs + .1, .1, MFRAME, -.8); if (rc > 0) for (const qx of [-1, 0, 1]) for (const qy of [-1, 0, 1]) { push(); T(qx * .5 * rc, qy * .5 * rc, .05); RX(Math.PI / 2); T(0, .16, 0); draw(MESH.spike, .3 * rc, .4 * rc, .3 * rc, BRASS, -.9); pop(); } pop();
}
/* Bugs are drawn from flat-faced shapes so they read as hard, sharp chitin. Each kind has its own outline from above, and the outline says what it does:
   the stalker is all legs and two long pale hooks; the spitter is a lit bladder on a small frame; the guard is a wide grey shield in front and a pale soft back;
   the mother is long: a narrow armoured head, ribs, two great scythes, and a brood sac slung off to one side. */
function drawBug(e, g) { if (e.shear) return drawShear(e, g); const al = e.ally, big = e.big, spit = e.spit, m = e.m, s = e.s * (al ? Math.min(1, e.born * 3) * Math.min(1, e.life * 3 + .2) : e.emer > 0 ? lerp(1, .25, ease(e.emer / e.emer0)) : 1), tell = e.state === 'tell', lunge = e.state === 'lunge', hitF = e.flash > 0, E = hitF ? (ST.flash ? .3 : .8) : ST.contrast ? .3 : -.5, Eh = E > 0 ? E : -.4;
  const C = hitF ? [.3, .2, .12] : al ? ALLYC : ST.contrast ? [.26, .2, .3] : big ? GUARDC : SHELLC, C2 = hitF ? C : al ? ALLYC2 : spit ? SPITC2 : big ? GUARDC2 : PALS[0], CL = hitF ? C : al ? [.3, .6, .7] : CLAWC, w = m.w, ab = m.ab, lg = m.lg, ph = e.phase * TAU, sp = Math.hypot(e.vx, e.vz), mv = clamp(sp / 3, 0, 1), r = clamp(e.rear.x, 0, 1.2);
  const by = ((big ? .58 : .64) + Math.sin(ph * 2) * .035 * mv + r * .1 + (lunge ? .12 : 0)) * s, ca = Math.cos(e.a), sa = Math.sin(e.a), wag = Math.sin(ph) * .16 * mv + Math.sin(g.t * 2.3 + e.bias * 9) * .05, hd = clamp(angDiff(e.a, Math.atan2(g.x - e.x, g.z - e.z)), -.7, .7);
  const eyeC = tell ? [1, .25, .1] : al ? [.3, .9, 1] : e.boss ? [1, .2, .08] : big ? [1, .5, .1] : spit ? [.8, 1, .2] : [.75, 1, .2], glowC = al ? [.2, .8, 1] : big ? [1, .45, .08] : [.55, .9, .12];
  decal(e.x, e.z, (big ? 1.5 : 1.1) * s * w, (big ? 2 : 1.6) * s, e.a, 0, 0, 0, 0, .55); if (al) decal(e.x, e.z, 1.3 * s, 1.3 * s, 0, 1, .3, .85, 1, .5, .012);
  if (tell && spit) { const k = 1 - e.st / .75, hc = ST.contrast; decal(e.tx, e.tz, 1.9, 1.9, 0, 1, 1, hc ? .8 : .12, hc ? .6 : .05, (hc ? .6 : .4) + k * .4, .012); }
  else if (tell && e.boss && e.atk !== 'charge') { const hc = ST.contrast, R = hc ? .8 : .12, B = hc ? .6 : .05, k = 1 - e.st / .9; if (e.atk === 'slam') { decal(e.x, e.z, 5.5, 5.5, 0, 1, 1, R, B, .5 + k * .4, .012); decal(e.x, e.z, 5.5 * k, 5.5 * k, 0, 0, 1, .1, .04, .28, .011); } else if (e.vol) for (const v of e.vol) decal(v[0], v[1], 1.9, 1.9, 0, 1, 1, R, B, .45 + k * .4, .012); }
  else if (tell) { const k = 1 - e.st / (e.boss ? 1 : big ? .85 : TELL), hc = ST.contrast, LANE = e.boss ? 14.4 : big ? 10.8 : LUNGE_T * LUNGE_V + .8; decal(e.x + e.ldx * LANE / 2, e.z + e.ldz * LANE / 2, e.boss ? 1.9 : big ? 1.25 : .62, LANE / 2, e.la, 2, hc ? 1 : .95, hc ? .8 : .1, hc ? .6 : .04, (hc ? .5 : .3) + k * .4, .01); }
  const stg = e.stag > 0 ? Math.min(1, e.stag * 3) : 0; if (stg > 0) { glow(e.x, 1.3 * s, e.z, 3.2 * s, 1, .6, .15, .22 + Math.sin(g.t * 16) * .08); if (Math.random() < .4) part(2, e.x + rand(-.8, .8) * s, rand(.6, 1.4) * s, e.z + rand(-.8, .8) * s, rand(-3, 3), rand(2, 5), rand(-3, 3), .25, .05, 1, .8, .4, 1, 14, 1, 0, .04); }       // staggered: it sags and sparks, and is open to everything
  reset(); T(e.x, by - stg * .14 * s, e.z); RY(e.a + Math.sin(ph) * .06 * mv); RZ(Math.sin(ph) * .07 * mv + stg * Math.sin(g.t * 13) * .06); T(0, 0, -e.fl.x * .22); RX(-r * (big ? .12 : .32) - e.fl.x * .12 + stg * .16);
  if (big && !e.boss) {      // brood guard: everything it has is in front. The shield turns shells; behind it the back is pale and soft
    const open = stg, low = tell ? r : 0, SOFT = hitF ? C : [.5, .34, .3];
    draw(MESH.shell, 1.25 * s * w, .46 * s, 1.5 * s, C, E);
    push(); T(0, .2 * s, -.62 * s); draw(MESH.shell, 1.05 * s * w, .5 * s, 1.15 * s, SOFT, hitF ? E : .18 + Math.sin(g.t * 3 + e.bias * 9) * .08 + open * .5); pop();       /* the soft back */
    for (const q of [-1, 1]) { push(); T(q * .34 * s * w, .34 * s, -.3 * s); RZ(-q * (.25 + open * .9)); RX(.1); T(q * .2 * s, 0, -.2 * s); draw(MESH.scute, .9 * s * w, 1.2 * s, 1.5 * s, C2, Eh); pop(); }       /* two wing plates half over it; staggered, they hang open */
    push(); T(0, (.3 - low * .16 - open * .2) * s, .7 * s); RY(hd * .4); RX(.62 + low * .3 + open * .5);       /* the shield: carried high, dropped as it commits, dragging when it is staggered */
      draw(MESH.scute, 2.05 * s * w, 2.0 * s, 1.95 * s, GUARDF, Eh); push(); T(0, .15 * s, -.08 * s); draw(MESH.scute, 1.2 * s * w, 1.3 * s, 1.1 * s, C2, Eh); pop();
      for (const q of [-1, 1]) { push(); T(q * .92 * s * w, 0, .16 * s); RY(q * .5); RX(Math.PI / 2); T(0, .3 * s, 0); draw(MESH.spike, .26 * s, .8 * s, .26 * s, CL, 0); pop();
        push(); T(q * .4 * s * w, -.18 * s, .62 * s); draw(MESH.oct, .16 * s, .1 * s, .16 * s, eyeC, tell ? 4 : 2.6); pop(); xf(q * .4 * s * w, -.18 * s, .68 * s, _B); glow(_B[0], _B[1], _B[2], (tell ? 1 : .5) * s, eyeC[0], eyeC[1], eyeC[2], .5); } pop();
    if (e.ricT > 0) { xf(0, .4 * s, 1.1 * s, _B); glow(_B[0], _B[1], _B[2], 1.6 * s, 1, .9, .6, .7); }
  } else if (big) {      // the brood mother
    const p2 = e.ph === 2, un = p2 ? 1 : 0, bp = (p2 ? 1.3 : 1) * (e.atk === 'birth' && tell ? 1.25 + Math.sin(g.t * 26) * .06 : 1 + Math.sin(g.t * 2.4) * .05), SAC = [.5, .16, .05];
    draw(MESH.shell, 1.0 * s * w, .5 * s, 1.9 * s, C, E);       /* a long thorax */
    for (let i = 0; i < 4; i++) for (const q of [-1, 1]) { push(); T(q * .3 * s * w, .16 * s, (.5 - i * .42) * s); RY(q * (.2 + un * .5)); RZ(-q * (1.0 - un * .7)); T(0, .42 * s, 0); draw(MESH.blade, 1.1 * s, .95 * s, 1.0 * s, p2 ? CL : C2, p2 ? 0 : Eh); pop(); }       /* ribs: folded down over her sides as armour; in her second phase they stand open */
    if (!p2) for (let i = 0; i < 2; i++) { push(); T(0, .34 * s, (.5 - i * .8) * s); RX(.1); draw(MESH.scute, 1.5 * s * w, 1.3 * s, 1.5 * s, GUARDF, Eh); pop(); }       /* back plates, until they break off */
    push(); T(0, .06 * s, 1.25 * s); RY(hd * .5); RX(.25 + r * .25); draw(MESH.oct, .7 * s * w, .44 * s, 1.5 * s, C, E); if (!p2) { push(); T(0, .2 * s, -.1 * s); RX(.5); draw(MESH.scute, 1.2 * s * w, 1.2 * s, 1.7 * s, GUARDF, Eh); pop(); }       /* a narrow head under a brow plate */
      for (const q of [-1, 1]) { push(); T(q * .2 * s * w, .1 * s, .5 * s); draw(MESH.oct, .13 * s, .09 * s, .13 * s, eyeC, tell ? 4 : 2.6); pop(); xf(q * .2 * s * w, .1 * s, .56 * s, _B); glow(_B[0], _B[1], _B[2], (tell ? .9 : .5) * s, eyeC[0], eyeC[1], eyeC[2], .5); push(); T(q * .2 * s, -.1 * s, .6 * s); RY(q * .3); RX(Math.PI / 2); RY(-q * Math.PI / 2); T(0, .3 * s, 0); draw(MESH.blade, 1.0 * s, .6 * s, .9 * s, CL, 0); pop(); } pop();
    push(); T(.42 * s, .55 * s, -1.55 * s); RY(-.3); RX(.25); draw(MESH.shell, 1.5 * s * bp, 1.15 * s * bp, 1.8 * s * bp, SAC, hitF ? E : .5 + (bp - 1) * 3 + un * .5); if (!p2) { draw(MESH.oct, 1.6 * s * bp, .1 * s, 1.9 * s * bp, C, E); draw(MESH.oct, .1 * s, 1.24 * s * bp, 1.9 * s * bp, C, E); } pop(); xf(.42 * s, .65 * s, -1.6 * s, _B); glow(_B[0], _B[1], _B[2], 3.2 * s * bp, 1, .4, .1, .22 + un * .16);       /* the brood sac, slung off to one side: banded in dark chitin until she breaks, bare and swollen after */
    for (const q of [-1, 1]) { const k2 = lunge ? 0 : r, ex = lunge ? .7 : lerp(1.0, 1.3, k2), ey = lunge ? .5 : lerp(.7, 1.5, k2), ez = lunge ? 1.4 : lerp(1.0, .7, k2), tx = lunge ? .3 : lerp(.7, 1.1, k2), ty = lunge ? -.2 : lerp(-.4, 2.3, k2), tz = lunge ? 2.9 : lerp(2.0, 1.7, k2); xf(q * .4 * s * w, .1 * s, .7 * s, _A); xf(q * ex * s, ey * s, ez * s, _K); xf(q * tx * s, ty * s, tz * s, _F); seg(MESH.taper, _A, _K, .26 * s, .26 * s, C, E); seg(MESH.blade, _K, _F, 1.6 * s, 1.9 * s, CL, 0, [0, 1, 0]); }       /* two great scythes */
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
        } pop();
    if (!spit) for (const q of [-1, 1]) { const wb = Math.sin(ph + q) * .05 * mv, k2 = lunge ? 0 : r, ex = lunge ? .45 : lerp(.62, .88, k2), ey = lunge ? .42 : lerp(.5, 1.05, k2) + wb, ez = lunge ? .95 : lerp(.6, .32, k2), tx = lunge ? .12 : lerp(.5, .9, k2), ty = lunge ? -.15 : lerp(-.28, 1.9, k2), tz = lunge ? 2.3 : lerp(1.5, 1.1, k2);       // the scythes: folded while it walks, thrown up and wide before a lunge, driven forward in it
        xf(q * .28 * s * w, .05 * s, .4 * s, _A); xf(q * ex * s, ey * s, ez * s, _K); xf(q * tx * s, ty * s, tz * s, _F); seg(MESH.taper, _A, _K, .19 * s, .19 * s, C, E); seg(MESH.blade, _K, _F, 1.35 * s, 1.5 * s, HOOKC, hitF ? 0 : .12, [0, 1, 0]); }
  }
  if (e.burnT > 0) { glow(e.x, .9 * s, e.z, 1.3 * s, 1, .5, .12, .45); if (Math.random() < .5) part(0, e.x + rand(-.4, .4) * s, .7 * s, e.z + rand(-.4, .4) * s, 0, rand(1.5, 3), 0, .3, .4 * s, 1, .5, .1, .7, -1, .5, -.6); }
  const l1 = (big ? .85 : spit ? .8 : .95) * s * lg, l2 = (big ? 1.2 : spit ? 1.25 : 1.5) * s * lg, th = e.boss ? 1.7 : big ? 2.3 : 1;       // legs: a thick thigh up to a high knee, then a long spike to the ground
  for (let i = 0; i < 6; i++) { const L = e.legs && e.legs[i]; if (!L) break; if (e.off >> i & 1) continue; const side = i < 3 ? 1 : -1, row = i % 3; xf(side * .28 * s * w, -.02 * s, (1 - row) * .32 * s, _H); _F[0] = L.x; _F[1] = L.y; _F[2] = L.z; _P[0] = side * ca * .6; _P[1] = 1; _P[2] = -side * sa * .6; ik2(_H, _F, l1, l2, _P, _K);
    seg(MESH.taper, _H, _K, .15 * th * s, .15 * th * s, C, E); seg(MESH.spike, _K, _F, .11 * th * s, .11 * th * s, C, E); W0(); T(_K[0], _K[1], _K[2]); draw(MESH.oct, .12 * th * s, .12 * th * s, .12 * th * s, big ? C2 : C, Eh); pop(); }
}
const poleOn = (p, t) => { const n = Math.sin(t * .7 + p.v * 40) + Math.sin(t * 1.9 + p.v * 17) * .6, pw = G ? G.power : 1; return (n > 1.25 ? 0 : n > 1.05 ? .35 : 1) * (pw < .99 ? pw * (.6 + .4 * Math.sin(t * 31 + p.v * 50)) : 1); };      // mostly on; now and then it sags or drops out, slowly
function drawProp(p, g) { reset(); T(p.x, 0, p.z); RY(p.rot);
  if (p.k === 'fire') { push(); T(0, .5, 0); draw(MESH.cyl, .82, 1, .82, RUST); T(0, .5, 0); draw(MESH.cyl, .9, .07, .9, DRK); T(0, .02, 0); draw(MESH.cyl, .7, .04, .7, [1, .45, .1], 3); pop(); glow(p.x, 1.25, p.z, 1.7 + Math.sin(g.t * 17 + p.v * 9) * .2, 1, .5, .15, .5); decal(p.x, p.z, 1, 1, 0, 0, 0, 0, 0, .5); }
  else if (p.k === 'relay') { const NAVY = [.05, .075, .12], bk = g.dead ? 0 : g.bossUp && !g.won ? (Math.sin(g.t * 11) > 0 ? 1 : .12) : .55 + .45 * Math.pow(Math.max(0, Math.sin(g.t * 2.4)), 4), bc = g.bossUp && !g.won ? [1, .12, .06] : [1, .62, .12];       // the thing being held: two transformers on a plinth, a mast, and a beacon that says it is alive
    box(0, .16, 0, 5.4, .32, 4.2, CONC); for (const q of [-1, 1]) { box(-1.15, 1.3, q * .98, 2.3, 1.95, 1.5, NAVY, -.5); for (let f = -2; f <= 2; f++) box(-1.15 + f * .46, 1.25, q * 1.78, .1, 1.5, .16, STL, -.7); for (const f of [-.6, 0, .6]) { push(); T(-1.15 + f, 2.6, q * .98); draw(MESH.cyl, .2, .7, .2, [.55, .5, .42]); T(0, .4, 0); draw(MESH.cyl, .3, .08, .3, STL, -.8); pop(); } }
    box(1.6, 1.05, 1.2, 1.3, 1.8, 1.1, [.13, .17, .16]); box(0, 7.0, .5, .9, .2, .5, DRK); box(0, 6.88, .5, .7, .04, .4, [.75, .9, 1], 3 * (g.dead ? 0 : g.power)); box(1.6, 1.5, 1.76, .8, .34, .03, DRK); box(1.38, 1.5, 1.78, .16, .12, .03, g.dead ? DRK : [.3, 1, .5], 2.2); box(1.82, 1.5, 1.78, .16, .12, .03, bc, bk * 2.5); box(1.6, .6, 1.76, 1.1, .1, .03, DRK);
    push(); T(1.5, 0, -1.0); for (const qx of [-1, 1]) for (const qz of [-1, 1]) { push(); T(qx * .42, 4.4, qz * .42); RZ(qx * .06); RX(-qz * .06); draw(MESH.cube, .11, 8.8, .11, STL, -.7); pop(); } for (const y of [2.2, 4.4, 6.6]) { const w = 1.05 - y * .07; box(0, y, 0, w, .08, w, STL, -.7); } box(0, 7.4, 0, 3.4, .12, .12, STL, -.7); for (const q of [-1.6, 1.6]) { push(); T(q, 7.1, 0); draw(MESH.cyl, .16, .5, .16, [.55, .5, .42]); pop(); }
    box(0, 8.9, 0, .5, .3, .5, DRK); push(); T(0, 9.3, 0); RY(g.t * 3); draw(MESH.oct, .62, .62, .62, bc, bk * 3.2); xf(0, 0, 0, _B); pop(); pop(); glow(_B[0], _B[1], _B[2], 1.6 + bk * 1.6, bc[0], bc[1], bc[2], .25 + bk * .5); p.by = _B[1]; p.bk = bk; p.bc = bc;
    decal(p.x, p.z, 3.3, 2.8, 0, 0, 0, 0, 0, .55); }
  else if (p.k === 'trailer') { const TK = [.36, .35, .33]; push(); T(0, 1.3, 0); RZ(Math.PI / 2); draw(MESH.cyl, 1.5, 4.3, 1.5, TK, -.8); for (const q of [-1.7, 0, 1.7]) { push(); T(0, q, 0); draw(MESH.cyl, 1.57, .12, 1.57, DRK, -.6); pop(); } pop();       // a fuel trailer: a tank on four wheels, something solid to put between you and a charge
    box(0, .5, 0, 4.8, .14, 1.1, DRK, -.6); box(-3, .5, 0, 1.6, .09, .12, STL, -.7); for (const qx of [-1.3, 1.3]) for (const qz of [-.72, .72]) { push(); T(qx, .42, qz); RX(Math.PI / 2); draw(MESH.cyl, .84, .3, .84, [.03, .03, .035]); pop(); } push(); T(.4, 2.1, 0); draw(MESH.cyl, .5, .16, .5, STL, -.8); pop(); push(); T(-.6, 1.3, .77); RZ(Math.PI / 4); draw(MESH.cube, .5, .5, .03, [.6, .09, .04]); pop(); box(-.6, 1.3, .79, .1, .3, .02, [.9, .8, .6]);
    decal(p.x, p.z, 2.9, 1.3, 0, 2, 0, 0, 0, .6); }
  else if (p.k === 'wreck') { const R1 = [.3, .2, .06], R2 = [.16, .08, .04]; push(); T(0, .62, 0); RZ(.5 + p.v * .4); RX(.15); draw(MESH.cube, 1.3, .95, 1.1, R1); box(0, .1, .58, .8, .2, .05, DRK); box(.2, -.6, .2, .9, .3, .6, DRK, -.6); pop();       // a walker like yours, on its side and long dead
    push(); T(-.9, .3, .5); RZ(1.2); draw(MESH.cube, .3, 1.3, .36, R2); pop(); push(); T(.7, .14, -.8); RY(.7); RZ(1.5); draw(MESH.cube, .22, 1.1, .26, STL, -.7); pop(); push(); T(1.1, .5, .4); RZ(-.3); draw(MESH.cyl, .2, 1.0, .2, STL, -.8); pop(); for (const q of [[-.4, 1.1, .1], [.3, .9, -.4]]) { push(); T(q[0], q[1], q[2]); RX(-.4); draw(MESH.spike, .16, .5, .16, CHITM, -.6); pop(); } decal(p.x, p.z, 2, 2, 0, 0, 0, 0, 0, .55); }
  else if (p.k === 'pole') { box(0, .15, 0, .5, .3, .5, CONC); push(); T(0, 2.6, 0); RZ(.06 + p.v * .08); draw(MESH.cyl, .12, 5.2, .12, STL, -.7); T(.5, 2.5, 0); draw(MESH.cube, 1.1, .1, .12, STL, -.7); T(.5, -.14, 0); draw(MESH.cube, .5, .16, .34, DRK); const on = poleOn(p, g.t); T(0, -.1, 0); draw(MESH.cube, .4, .04, .26, [.75, .9, 1], on * 3); xf(0, -.2, 0, _B); pop(); if (on > .05) glow(_B[0], _B[1], _B[2], 1.2, .7, .85, 1, .5 * on); decal(p.x, p.z, .6, .6, 0, 0, 0, 0, 0, .5); }       // a floodlight that has not quite died
  else { const O = [.13, .17, .1]; box(-.3, .46, 0, .92, .92, .92, O); box(-.3, .46, .47, .94, .14, .02, YEL2); box(.62, .4, .1, .8, .8, .8, O); push(); T(-.1, 1.26, .05); RY(.4); draw(MESH.cube, .76, .7, .76, O); T(0, 0, .39); draw(MESH.cube, .78, .12, .02, YEL2); pop(); decal(p.x, p.z, 1.5, 1.3, p.rot, 0, 0, 0, 0, .5); }
}
const GALV = [.3, .31, .3], CORR = [.15, .085, .05], CROPC = [.085, .125, .045], WALL = [.135, .13, .12], CLAP = [.23, .225, .21], ROOFC = [.085, .07, .065], GANT = [.15, .18, .22], WOOD = [.17, .12, .08], WARM = [1, .72, .36];
/* everything that stands at the edge of the yard */
function drawYard(g, lamps) { const cx = g.cam.x, cz = g.cam.z, t = g.t, lit = g.dead ? .15 : 1, near = (x, z, m) => Math.abs(x - cx) < 15 + (m || 0) && z > cz - 48 && z < cz + 13 + (m || 0);
  if (near(HOUSE.x, HOUSE.z, 8)) { reset(); T(HOUSE.x, 0, HOUSE.z);       // the farmhouse: somebody lives here. Two lit windows, a door, a porch lamp throwing a warm pool on the dirt
    box(0, 2.1, -3.2, 9.4, 4.2, 6, CLAP); for (let i = 0; i < 4; i++) box(0, .9 + i * .9, -.18, 9.44, .05, .06, [.25, .24, .22]); push(); T(0, 5.05, -1.4); RX(.62); draw(MESH.cube, 10.2, .22, 4.4, ROOFC, -.3); pop(); box(2.9, 5.7, -3.0, .8, 1.7, .8, [.2, .12, .09]);
    for (const q of [-2.9, 2.9]) { box(q, 2.25, -.14, 1.8, 1.5, .06, WARM, 2 * lit); box(q, 2.25, -.1, .08, 1.5, .04, CLAP); box(q, 2.25, -.1, 1.8, .08, .04, CLAP); box(q, 1.42, -.06, 2.0, .1, .2, CLAP); }
    box(0, 1.4, -.14, 1.15, 2.4, .06, [.1, .07, .05]); box(0, 2.82, -.13, 1.15, .32, .05, WARM, 1.5 * lit); box(0, 3.2, .2, 1.9, .08, .8, ROOFC); box(.95, 2.95, -.02, .2, .22, .2, [1, .85, .6], 3 * lit);
    box(0, .14, .9, 5.2, .28, 2.0, WOOD); box(0, .07, 2.2, 1.7, .14, .6, WOOD); for (const q of [-1, 1]) { box(q * 2.5, .75, 1.8, .12, 1.0, .12, WOOD); box(q * 1.75, 1.2, 1.8, 1.6, .08, .1, WOOD); }
    lamps.push({ k: 'lamp', x: HOUSE.x + .9, y: 2.9, z: HOUSE.z + 1.7, c: [2.6 * lit, 1.5 * lit, .62 * lit], r: 9 }); }
  if (near(GAR.x, GAR.z, 8)) { reset(); T(GAR.x, 0, GAR.z);       // the machine shed: open door, work light, the gantry the walker hangs from between shifts
    box(-5.8, 2.6, -3.4, .4, 5.2, 7.2, WALL); box(5.8, 2.6, -3.4, .4, 5.2, 7.2, WALL); box(0, 2.6, -6.9, 12, 5.2, .4, WALL); box(-4.8, 1.95, 0, 2.4, 3.9, .4, WALL); box(4.8, 1.95, 0, 2.4, 3.9, .4, WALL); box(0, 4.55, 0, 12, 1.3, .4, WALL);
    push(); T(0, 5.45, -3.4); RX(.07); draw(MESH.cube, 12.8, .22, 8.2, CORR, -.4); for (let i = -5; i <= 5; i++) box(i * 1.1, .14, 0, .12, .1, 8.2, [.1, .06, .04]); pop();
    push(); T(0, 3.95, -.1); RZ(Math.PI / 2); draw(MESH.cyl, .5, 7.2, .5, STL, -.7); pop(); box(0, 3.62, .12, 6.8, .1, .1, [1, .8, .5], 3.2 * lit);
    box(-2.2, .5, -2.2, 2.6, 1, 1, [.14, .1, .07]); box(-2.2, 1.06, -2.2, 2.8, .1, 1.1, STL, -.7); box(2.4, .6, -2.4, 1.1, 1.2, .8, [.11, .1, .09]);
    box(4.8, 2.5, .22, 1.2, .8, .05, WARM, 1.5 * lit); box(4.8, 2.5, .25, .08, .8, .03, WALL); box(4.8, 2.5, .25, 1.2, .08, .03, WALL);
    for (const q of [-1, 1]) { box(q * 4.6, 2.8, 3.2, .3, 5.6, .3, GANT); box(q * 4.6, .12, 3.2, .7, .24, .7, DRK); push(); T(q * 4.6, 4.6, 1.6); RX(.78); draw(MESH.cube, .14, 4.4, .14, GANT); pop(); } box(0, 5.7, 3.2, 9.9, .34, .4, GANT);
    box(1.4, 5.4, 3.2, .7, .3, .6, DRK); box(1.4, 4.3, 3.2, .05, 2, .05, STL, -.8); push(); T(1.4, 3.2, 3.2); RZ(Math.PI); draw(MESH.blade, .5, .6, .5, STL, -.8); pop();
    lamps.push({ k: 'lamp', x: GAR.x, y: 3.3, z: GAR.z + 1.2, c: [2.8 * lit, 1.65 * lit, .65 * lit], r: 11 }); }
  if (near(SILO.x, SILO.z, 10)) { reset(); T(SILO.x, 0, SILO.z); push(); T(0, 5.2, 0); draw(MESH.cyl, 6.4, 10.4, 6.4, GALV, -.6); for (const y of [-3.6, -1.2, 1.2, 3.6]) { push(); T(0, y, 0); draw(MESH.cyl, 6.52, .14, 6.52, [.16, .16, .16], -.5); pop(); } T(0, 6.3, 0); draw(MESH.cone, 6.9, 2.3, 6.9, GALV, -.6); pop(); box(-1.2, 5.2, 3.16, .5, 10.2, .08, STL, -.7); }
  for (const f of FENCE) { if (!near(f.mx, f.mz)) continue; reset(); T(f.ax, 0, f.az); RY(f.rot); push(); RZ((f.v - .5) * .12); box(0, .65, 0, .14, 1.3, .14, WOOD); pop(); for (const y of [.5, 1.05]) box(0, y, f.len / 2, .035, .035, f.len, [.2, .2, .2], -.6); if (f.last) box(0, .65, f.len, .14, 1.3, .14, WOOD); }
  for (const c of CROPS) { if (Math.abs(c.x - cx) > 13 || c.z < cz - 40 || c.z > cz + 12) continue; reset(); T(c.x, 0, c.z); RY(c.rot); RZ(.07 + Math.sin(t * 1.3 + c.x * .7 + c.z * .4) * .05); T(0, c.h / 2, 0); draw(MESH.spike, c.w, c.h, c.w * .4, CROPC, -.15); if (c.v > .4) { RY(1.6); draw(MESH.spike, c.w * .85, c.h * .8, c.w * .35, CROPC, -.15); } }
}
const SC = { cam: [0, 0, 0], at: [0, 0, 0], fov: .8, focus: [0, 0, 0], spotP: [0, 0, 0], spotD: [0, 0, 1], spotC: [0, 0, 0], spotCos: [.74, .92], spotFov: 1.62, lights: [], ambS: [0, 0, 0], ambG: [0, 0, 0], moonD: [-.45, .62, -.64], moonC: [0, 0, 0], fogC: [.005, .0095, .014], rim: [.3, .38, .56], fogR: [15, 27], exposure: 1.25 };
const YARDV = [YARD.x0, YARD.x1, YARD.z0 - 16, YARD.z1], APRONV = [GAR.x - 6.6, GAR.x + 6.6, YARD.z0 - 1.5, YARD.z0 + 6.2], TRACKV = [GAR.x, 1.7, YARD.x1 + 2.9, 0];
function shakeN(t, s) { const x = Math.sin(t * 12.9898 + s * 78.233) * 43758.5453; return (x - Math.floor(x)) * 2 - 1; }
function render() { const g = G; if (!GLOK) return; const fires = [];
  for (const p of PROPS) { if (!p.k || Math.abs(p.x - g.cam.x) > 18 || p.z < g.cam.z - 46 || p.z > g.cam.z + 13) continue; drawProp(p, g); if (p.k === 'fire' || p.k === 'pole') fires.push(p); else if (p.k === 'relay') fires.push({ k: 'lamp', x: p.x + 1.5, y: 6.6, z: p.z + 2.5, c: [1.5 * g.power, 2.0 * g.power, 2.7 * g.power], r: 19, far: 1 }); }       /* the flood on the mast: the one cool light, and it marks out where the fight is */
  drawYard(g, fires);
  for (const b of g.burrows) { if (!b.ever) continue; const R = b.big ? 1.9 : 1.45;
    if (b.shut > 0) { const warn = b.shut < 3 ? 1 - b.shut / 3 : 0, sh = warn * .06; decal(b.x, b.z, R * 1.25, R * 1.25, 0, 0, 0, 0, 0, .8, .004);       // caved in: a heap of broken slab. In its last three seconds it starts to shake and glow through the cracks
      for (let i = 0; i < 9; i++) { const a = b.rot + i * 2.4, hh = hash2(i, b.i, 5), rr = i < 3 ? .25 : R * (.45 + hh * .45); reset(); T(b.x + Math.sin(a) * rr + rand(-sh, sh), .16 + (i < 3 ? .34 : 0) + hh * .12, b.z + Math.cos(a) * rr + rand(-sh, sh)); RY(a * 1.7); RX((hh - .5) * .9); RZ((hash2(i, b.i, 6) - .5) * .7); draw(MESH.cube, .7 + hh * .6, .2, .5 + hh * .5, i % 3 ? CONC : [.2, .19, .18]); }
      if (warn > 0) { glow(b.x, .5, b.z, 2.2 * warn, .45, .9, .2, .5 * warn * (.6 + .4 * Math.sin(g.t * 20))); decal(b.x, b.z, R * 1.4, R * 1.4, 0, 1, .45, .9, .2, .5 * warn, .008); } continue; }
    const k = Math.min(1, b.born * 2.5); decal(b.x, b.z, R * k, R * k, 0, 0, 0, 0, 0, .97, .004); decal(b.x, b.z, R * .7 * k, R * .7 * k, 0, 0, .2, .5, .06, .22 + b.pulse * .5, .006); decal(b.x, b.z, R * 1.5, R * 1.5, 0, 1, .45, .9, .2, .1 + b.pulse * .3, .005);       // an open burrow: a black hole with something lit far down it, ringed by the slabs it broke through
    for (let i = 0; i < 7; i++) { const a = b.rot + i * TAU / 7, hh = hash2(i, b.rot * 100, 3); reset(); T(b.x + Math.sin(a) * R * 1.02, .1, b.z + Math.cos(a) * R * 1.02); RY(a + hh); RX(-.5 - hh * .5); draw(MESH.cube, (.7 + hh * .5) * k, .16, (.5 + hh * .4) * k, i % 3 ? CONC : [.2, .19, .18]); if (i % 3 === 0) { reset(); T(b.x + Math.sin(a + .4) * R * .8, .2, b.z + Math.cos(a + .4) * R * .8); RZ(Math.cos(a) * .5); RX(-Math.sin(a) * .5); draw(MESH.spike, .2 * k, .7 * k, .2 * k, CHITM, -.6); } }
    if (b.pulse > .03) glow(b.x, .5, b.z, 2.6 * b.pulse, .45, .9, .2, .45 * b.pulse); }
  for (const c of g.corpses) drawCorpse(c, g); for (const r of g.relics) { if (r.t < 0) continue; const k = Math.min(1, (r.life - r.t) * 2); reset(); T(r.x, 1.3 * k, r.z); RY(r.rot); RZ(.3); RX(Math.PI); draw(MESH.blade, 2.4, 3.0 * k, 4.4, [.62, .58, .47], -.3); decal(r.x, r.z, .5, .5, 0, 0, 0, 0, 0, .5); }
  for (const l of g.lurks) { const k = Math.min(1, (1.9 - l.t) * 3) * (.6 + .4 * Math.sin(g.t * 9 + l.x)); for (const q of [-1, 1]) glow(l.x + Math.cos(l.a) * q * .18, 1.0, l.z - Math.sin(l.a) * q * .18, .34, 1, .7, .2, .9 * k); }       /* eyes in the crop before it comes out */
  drawMech(g); for (const e of g.en) drawBug(e, g); for (const e of g.allies) drawBug(e, g);
  for (const d of g.drops) { const y = .75 + Math.sin(d.t * 3) * .12, k = Math.min(1, d.t * 4) * (d.k === 'fix' ? Math.min(1, (45 - d.t) * .5) : 1), c = d.k === 'salv' ? [1, .68, .12] : d.k === 'organ' ? [.6, .9, .15] : [.3, 1, .5]; reset(); T(d.x, y, d.z); RY(d.t * 1.8);
    if (d.k === 'salv') { RX(.4); draw(MESH.cube, .62 * k, .5 * k, .62 * k, YEL2); draw(MESH.cube, .66 * k, .12 * k, .66 * k, DRK, -.7); draw(MESH.cube, .2 * k, .54 * k, .2 * k, c, 1.6); sprite(PADD, d.x, 2.6, d.z, .34, 0, 0, 2.2, 0, c[0], c[1], c[2], .28 * k); }       // a salvage crate, with a beam so it is found
    else if (d.k === 'organ') { const pu = 1 + Math.sin(d.t * 6) * .1; draw(MESH.shell, .6 * k * pu, .6 * k * pu, .8 * k * pu, [.3, .45, .06], .6); draw(MESH.oct, .7 * k, .08, .86 * k, CHITM, -.6); sprite(PADD, d.x, 2.6, d.z, .34, 0, 0, 2.2, 0, c[0], c[1], c[2], .28 * k); }       // a living organ, pulsing
    else { RX(.5); draw(MESH.cyl, .32 * k, .5 * k, .32 * k, c, 1.6); }
    glow(d.x, y, d.z, (d.k === 'fix' ? 1.2 : 2) * k, c[0], c[1], c[2], .45); decal(d.x, d.z, .95, .95, 0, 1, c[0], c[1], c[2], .55 * k, .01); decal(d.x, d.z, .5, .5, 0, 0, 0, 0, 0, .5 * k); }
  for (const sh of g.shells) { if (sh.t < 0) continue; const u = sh.t / sh.dur, x = lerp(sh.x0, sh.x1, u), y = lerp(sh.y0, .3, u) + Math.sin(u * Math.PI) * 6, z = lerp(sh.z0, sh.z1, u); reset(); T(x, y, z); draw(MESH.sph, .34, .34, .34, DRK, -.8); glow(x, y, z, .8, 1, .6, .2, .7); decal(sh.x1, sh.z1, 3.1, 3.1, 0, 1, 1, .65, .15, .25 + u * .45, .012); decal(x, z, .35, .35, 0, 0, 0, 0, 0, .4); }
  for (const b of g.bolts) { const a = Math.min(1, b.t / .08); for (let i = 1; i < b.pts.length; i++) { const A = b.pts[i - 1], B = b.pts[i]; let px = A[0], py = A[1], pz = A[2]; for (let k = 1; k <= 4; k++) { const u = k / 4, j = k < 4 ? .45 : 0, qx = lerp(A[0], B[0], u) + rand(-j, j), qy = lerp(A[1], B[1], u) + rand(-j, j), qz = lerp(A[2], B[2], u) + rand(-j, j); sprite(PADD, (px + qx) / 2, (py + qy) / 2, (pz + qz) / 2, .11, 0, (qx - px) / 2, (qy - py) / 2, (qz - pz) / 2, .6, .8, 1, a); px = qx; py = qy; pz = qz; } glow(B[0], B[1], B[2], 1.1, .5, .7, 1, .6 * a); } }
  for (const b of g.globs) { const u = b.t / b.dur, x = lerp(b.x0, b.x1, u), y = .8 + Math.sin(u * Math.PI) * 5, z = lerp(b.z0, b.z1, u), hc = ST.contrast; reset(); T(x, y, z); draw(MESH.sph, .42, .42, .42, [.65, .85, .12], 1.6); glow(x, y, z, 1.1, .7, .9, .15, .6); decal(b.x1, b.z1, 1.9, 1.9, 0, 1, 1, hc ? .8 : .12, hc ? .6 : .05, .9, .012); decal(b.x1, b.z1, 1.9 * u, 1.9 * u, 0, 0, 1, .1, .04, .3, .011); decal(x, z, .4, .4, 0, 0, 0, 0, 0, .4); }
  for (const q of g.pools) { const k = Math.min(1, q.t * 1.5), hc = ST.contrast; decal(q.x, q.z, 2.3, 2.3, q.seed, 3, .5, .65, .08, .6 * k, .011, q.seed); decal(q.x, q.z, 1.85, 1.85, 0, 1, 1, hc ? .8 : .15, hc ? .6 : .05, (hc ? .9 : .55) * k, .013); }
  for (const f of g.fires) if (f.acid) decal(f.x, f.z, 1.9, 1.9, f.x, 3, .45, .62, .08, .55 * Math.min(1, f.t), .011, f.x); else decal(f.x, f.z, 1.2, 1.2, 0, 0, 1, .4, .06, .32 * Math.min(1, f.t), .01);
  if (g.itemFx > 0 && !g.dead) { const c = g.itemCol, k = g.itemFx; glow(g.x, 2, g.z, 3 + (1 - k) * 5, c[0], c[1], c[2], .5 * k); decal(g.x, g.z, 1.5 + (1 - k) * 4, 1.5 + (1 - k) * 4, 0, 1, c[0], c[1], c[2], .8 * k, .01); }
  for (const b of DB) { const k = Math.min(1, (b.life - b.t) * 3); reset(); T(b.x, b.y, b.z); RY(b.ay); RX(b.ax); draw(b.mesh, b.sx * k, b.sy * k, b.sz * k, b.col, b.e); }
  for (const d of DL) decal(d.x, d.z, d.sx, d.sz, d.rot, d.kind, d.r, d.g, d.b, d.a * Math.min(1, (d.life - d.t) * .6), 0, d.seed);
  for (const p of PT) { const f = 1 - p.t / p.life, s = Math.max(.01, p.size + p.grow * p.t); if (p.k === 1) sprite(PSMK, p.x, p.y, p.z, s, s, 0, 0, 0, p.r, p.g, p.b, p.a * f); else if (p.k === 2) sprite(PADD, p.x, p.y, p.z, s, 0, p.vx * p.len, p.vy * p.len, p.vz * p.len, p.r, p.g, p.b, p.a * f); else sprite(PADD, p.x, p.y, p.z, s, s, 0, 0, 0, p.r, p.g, p.b, p.a * f); }
  for (const r of TR) { const u = r.t / r.dur, dx = r.x1 - r.x0, dy = r.y1 - r.y0, dz = r.z1 - r.z0, l = Math.hypot(dx, dy, dz) || 1, hl = Math.min(1.5, l * .3) / l;
    if (r.hv) { const h = Math.min(1, u), fa = u > 1 ? 1 - (r.t - r.dur) / .13 : 1, k2 = Math.min(2.2, l * .4) / l; sprite(PADD, r.x0 + dx * h * .5, r.y0 + dy * h * .5, r.z0 + dz * h * .5, .2, 0, dx * h * .5, dy * h * .5, dz * h * .5, 1, .7, .4, .3 * fa); if (u < 1) { sprite(PADD, r.x0 + dx * u, r.y0 + dy * u, r.z0 + dz * u, 1.0, 0, dx * k2, dy * k2, dz * k2, 1, .55, .2, .55); sprite(PADD, r.x0 + dx * u, r.y0 + dy * u, r.z0 + dz * u, .4, 0, dx * k2, dy * k2, dz * k2, 1, .95, .75, 1); glow(r.x0 + dx * u, r.y0 + dy * u, r.z0 + dz * u, .9, 1, .8, .5, .5); } continue; } if (r.c === 2) sprite(PADD, r.x0 + dx * u, r.y0 + dy * u, r.z0 + dz * u, .16, 0, dx * hl * .5, dy * hl * .5, dz * hl * .5, .7, .95, .15, 1); else if (r.c) sprite(PADD, r.x0 + dx * u, r.y0 + dy * u, r.z0 + dz * u, .06, 0, dx * hl, dy * hl, dz * hl, .3, .9, 1, 1); else sprite(PADD, r.x0 + dx * u, r.y0 + dy * u, r.z0 + dz * u, .07, 0, dx * hl, dy * hl, dz * hl, 1, .85, .5, 1); }
  // lights: the lamp, a soft fill so the mech never vanishes, then whatever is burning or firing.
  // The pad is close to black outside them; the brightness setting lifts it.
  const br = ST.bright + (ST.contrast ? .25 : 0), L = SC.lights; L.length = 0; const on = g.dead ? 0 : 1;
  L.push({ p: [g.x + .6, 4.8, g.z + 3.2], c: [.6 * on + br * .55, .44 * on + br * .55, .26 * on + br * .6], r: 7.5 + br * 7 });
  if (g.heat > .05) { const f = g.heat * .3 + g.flash * (ST.flash ? .35 : 2.2); L.push({ p: [g.x + g.muz[0], g.muz[1] + .5, g.z + g.muz[2]], c: [2.8 * f, 1.8 * f, .7 * f], r: 11 }); }      // a steady glow while the gun runs: a light that blinked per shot would strobe
  if (g.jet > .05) L.push({ p: [g.x - Math.sin(g.aim) * 2.6, 1.2, g.z - Math.cos(g.aim) * 2.6], c: [2.6 * g.jet, 1.3 * g.jet, .45 * g.jet], r: 9 });
  if (g.boom > 0 || g.dead) L.push({ p: [g.x, 2.5, g.z], c: [9 * g.boom + (g.dead ? 2.4 + Math.sin(g.t * 23) * .5 : 0), 4 * g.boom + (g.dead ? .9 : 0), 1 * g.boom], r: 13 });
  if (g.pulse) { const k = g.pulse.t, c = g.pulse.c; L.push({ p: [g.pulse.x, 1.5, g.pulse.z], c: [c[0] * 5 * k, c[1] * 5 * k, c[2] * 5 * k], r: 9 }); }
  if (g.fires.length) { const f = g.fires[g.fires.length >> 1], k = Math.min(1, f.t); L.push({ p: [f.x, 1.3, f.z], c: [3.6 * k, 1.5 * k, .4 * k], r: 9 }); }
  let nd = null; for (const d of g.drops) if (d.k !== 'fix' && (!nd || (d.x - g.x) ** 2 + (d.z - g.z) ** 2 < (nd.x - g.x) ** 2 + (nd.z - g.z) ** 2)) nd = d; if (nd && L.length < 5) { const c = nd.k === 'organ' ? [.6, .9, .15] : [1, .68, .12]; L.push({ p: [nd.x, 1.6, nd.z], c: [c[0] * 1.6, c[1] * 1.6, c[2] * 1.6], r: 6 }); }
  fires.sort((a, b) => (a.far ? -1e6 : (a.x - g.x) ** 2 + (a.z - g.z) ** 2) - (b.far ? -1e6 : (b.x - g.x) ** 2 + (b.z - g.z) ** 2)); for (const p of fires) { if (L.length >= 6) break; if (p.k === 'lamp') { L.push({ p: [p.x, p.y, p.z], c: p.c, r: p.r }); continue; } if (p.k === 'pole') { const on = poleOn(p, g.t); if (on > .05) L.push({ p: [p.x + Math.cos(p.rot) * 1, 4.6, p.z - Math.sin(p.rot) * 1], c: [1.5 * on, 1.9 * on, 2.5 * on], r: 11 }); continue; } const fl = .85 + Math.sin(g.t * 13 + p.v * 20) * .1 + Math.sin(g.t * 31 + p.v * 7) * .06; L.push({ p: [p.x, 1.9, p.z], c: [5.2 * fl, 2.1 * fl, .5 * fl], r: 12.5 }); }
  const sh = g.trauma * g.trauma * ST.shake, tt = performance.now() / 1000 * 32, d = 21 * g.cam.d, P = 44 * Math.PI / 180, sx = sh * .55 * shakeN(tt, 1), sz = sh * .55 * shakeN(tt, 2);
  const kx = g.ck.x * Math.min(1, ST.shake), kz = g.ck.z * Math.min(1, ST.shake); SC.cam[0] = g.cam.x + sx + kx; SC.cam[1] = Math.sin(P) * d; SC.cam[2] = g.cam.z + Math.cos(P) * d + sz + kz; SC.at[0] = g.cam.x + sx * .6 + sh * .3 * shakeN(tt, 3) + kx; SC.at[1] = 1.2; SC.at[2] = g.cam.z - 1.8 * g.cam.d + sz * .6 + kz; SC.fov = 1.15 + g.fov.x * .09;
  SC.focus[0] = g.x; SC.focus[2] = g.z; SC.spotP = g.lampP; const ld = g.lampD, ll = Math.hypot(ld[0], ld[1], ld[2]) || 1; SC.spotD[0] = ld[0] / ll; SC.spotD[1] = ld[1] / ll; SC.spotD[2] = ld[2] / ll;
  const sr = g.s.focus, lk = on * (1 - (ST.flash ? .15 : .55) * g.dip) /* a hit makes the lamp dip for a moment */; SC.spotC[0] = (sr ? 5 : 3.0) * lk; SC.spotC[1] = (sr ? 4.4 : 2.7) * lk; SC.spotC[2] = (sr ? 3.5 : 2.2) * lk; SC.spotCos[0] = sr ? .87 : .74; SC.spotCos[1] = sr ? .955 : .92; SC.spotFov = sr ? 1.2 : 1.62; SC.ambS[0] = .018 + br * .13; SC.ambS[1] = .028 + br * .14; SC.ambS[2] = .044 + br * .17; SC.ambG[0] = SC.ambG[1] = SC.ambG[2] = .01 + br * .055; SC.moonC[0] = .11 + br * .11; SC.moonC[1] = .135 + br * .11; SC.moonC[2] = .2 + br * .12; SC.fogR[0] = 17 + br * 14; SC.fogR[1] = 40 + br * 20; SC.yard = YARDV; SC.apron = APRONV; SC.track = TRACKV;
  renderScene(SC, glc.width, glc.height); hud();
}

/* ---------- HUD: a thin 2D layer over the 3D view ---------- */
const dashBtn = () => { const r = 40 * ST.btn; return { x: ST.hand === 'left' ? 24 + r : W - 24 - r, y: H - 96 - r, r }; };
const stickBase = () => ({ x: ST.hand === 'left' ? W - 88 : 88, y: H - 150 });
const pauseBtn = () => ({ x: W - 34, y: SAFE + 36, r: 22 });
const FONT = 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
function toScr(x, y, z) { const w = VP[3] * x + VP[7] * y + VP[11] * z + VP[15]; if (w <= .01) return null; return [((VP[0] * x + VP[4] * y + VP[8] * z + VP[12]) / w * .5 + .5) * W, (1 - ((VP[1] * x + VP[5] * y + VP[9] * z + VP[13]) / w * .5 + .5)) * H]; }
function hud() { const g = G; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); if (state !== 'play') return; const ts = ST.text, hc = ST.contrast;
  { const v = ctx.createRadialGradient(W / 2, H * .52, H * .3, W / 2, H * .52, H * .74), a = Math.max(0, .2 - ST.bright * .6 - (ST.contrast ? .25 : 0)); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${a})`); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); }      // the dark closes in at the edges
  if (g.hurtT > 0 || g.hp < 30) { const a = Math.max(g.hurtT * (ST.flash ? .22 : .4), g.hp < 30 && !g.dead ? .18 + (ST.flash ? 0 : Math.sin(g.t * 6) * .06) : 0), gr = ctx.createRadialGradient(W / 2, H / 2, H * .43, W / 2, H / 2, H * .72);       /* red at the edges of the screen only: it must not tint the fight */ gr.addColorStop(0, 'rgba(200,20,10,0)'); gr.addColorStop(1, `rgba(200,20,10,${a})`); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); }
  // a swarm is coming: the dark at that edge of the screen turns red for a few seconds
  for (const c of g.cues) { const ux = Math.sin(c.a), uy = Math.cos(c.a), t = Math.min(ux ? (W / 2) / Math.abs(ux) : 1e9, uy ? (H / 2) / Math.abs(uy) : 1e9), ex = W / 2 + ux * t, ey = H / 2 + uy * t, k = Math.min(1, c.t) * Math.min(1, (3.4 - c.t) * 3) * (ST.flash ? .8 : .75 + Math.sin(performance.now() / 160) * .25), gr = ctx.createRadialGradient(ex, ey, 0, ex, ey, W * .42); gr.addColorStop(0, `rgba(255,40,20,${(hc ? .6 : .38) * k})`); gr.addColorStop(1, 'rgba(255,40,20,0)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); }
  for (const d of g.drops) { if (d.k === 'fix') continue; const sc = toScr(d.x, .8, d.z); if (sc && sc[0] > 10 && sc[0] < W - 10 && sc[1] > SAFE + 44 && sc[1] < H - 10) continue;       // salvage or an organ lying off screen: a diamond at the edge with an arrow toward it
    const col = d.k === 'organ' ? '#b6e04a' : '#f2b01e', dx = d.x - g.x, dy = d.z - g.z, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, m = 26, t = Math.min(ux > 0 ? (W - m - W / 2) / ux : ux < 0 ? (m - W / 2) / ux : 1e9, uy > 0 ? (H - m - H / 2) / uy : uy < 0 ? (SAFE + 70 - H / 2) / uy : 1e9), bob = ST.flash ? 0 : Math.sin(performance.now() / 200) * 3;
    ctx.save(); ctx.translate(W / 2 + ux * (t + bob), H / 2 + uy * (t + bob)); ctx.rotate(Math.atan2(uy, ux)); ctx.scale(1.2, 1.2); ctx.lineJoin = 'round'; ctx.fillStyle = col; ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(4, -8); ctx.lineTo(4, 8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); if (d.k === 'organ') ctx.arc(-7, 0, 8, 0, TAU); else { ctx.moveTo(1, 0); ctx.lineTo(-7, -8); ctx.lineTo(-15, 0); ctx.lineTo(-7, 8); ctx.closePath(); } ctx.fill(); ctx.stroke(); ctx.restore(); }
  // hull
  const bw = Math.min(150, W * .34), bh = hc ? 12 : 8, bx = 14, by = SAFE + 18, k = clamp(g.hp / g.s.maxhp, 0, 1); ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4); ctx.fillStyle = k < .3 ? '#ff4a2e' : '#f2b01e'; ctx.fillRect(bx, by, bw * k, bh); ctx.strokeStyle = hc ? '#fff' : 'rgba(230,223,208,.5)'; ctx.lineWidth = 1; ctx.strokeRect(bx - 1.5, by - 1.5, bw + 3, bh + 3);
  ctx.font = `600 ${11 * ts}px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#e6dfd0'; if (ST.nums) ctx.fillText(Math.ceil(g.hp), bx + bw + 8, by - 2);
  ctx.textAlign = 'center'; ctx.font = `600 ${18 * ts}px ${FONT}`; if (!g.bossUp) { for (let i = 0; i < 4; i++) { const done = g.enc.wave > i + 1 || g.won, now = g.enc.wave === i + 1 && !g.won; ctx.beginPath(); ctx.arc(W / 2 - 27 + i * 18, SAFE + 21, now ? 6 : 4.5, 0, TAU); ctx.fillStyle = done ? '#f2b01e' : now ? '#e6dfd0' : 'rgba(230,223,208,.28)'; ctx.fill(); if (ST.contrast) { ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke(); } } }
  else if (g.bossE && !g.bossE.dead) { const x0 = bx + bw + 18, w2 = W - 64 - x0, y0 = SAFE + 19, k2 = clamp(g.bossE.hp / g.bossE.mhp, 0, 1); ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x0 - 2, y0 - 2, w2 + 4, 11); ctx.fillStyle = '#d8301c'; ctx.fillRect(x0, y0, w2 * k2, 7); ctx.strokeStyle = hc ? '#fff' : 'rgba(230,223,208,.5)'; ctx.lineWidth = 1; ctx.strokeRect(x0 - 1.5, y0 - 1.5, w2 + 3, 10); }
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
function startGame() { if (!GLOK) return; initAudio(); const cam = G ? G.cam : null; newGame(false); if (cam) G.cam.d = cam.d; state = 'play'; show(''); lastT = performance.now(); sfx.alarm(4);
  announce('Drag to walk. The cannon fires on its own. When one of them throws its blades wide, get off its line, then ram it while its blades are stuck in the ground.'); }
const partLi = id => { const c = CARD[id]; return `<li><b class="${c.grp === 'organ' ? 'org' : ''}">${c.n}</b> <span class="rr">${GRPNAME[c.grp]}</span><br>${c.does}<br><span class="rr">Cost</span> ${c.cost}</li>`; };
function titleInfo() { let w = 0, played = false; try { w = +(localStorage.getItem('ll5_wins') || 0); played = localStorage.getItem('ll5_best') !== null; } catch (e) { } $('howTo').hidden = played; $('found').textContent = w ? `Relay held ${w} ${w === 1 ? 'time' : 'times'}` : ''; }      // the how-to is only there until the first run is over
function endGame(win) { const g = G; state = 'over'; stick = null; dbtn = null; offer = null; const t = g.t / PACE; let best = 0, wins = 0; try { best = +(localStorage.getItem('ll5_best') || 0); wins = +(localStorage.getItem('ll5_wins') || 0); if (t > best) localStorage.setItem('ll5_best', Math.floor(t)); if (win) localStorage.setItem('ll5_wins', ++wins); } catch (e) { }
  $('overT').textContent = win ? 'Yard held' : 'Yard lost'; const build = g.items.map(id => CARD[id].n).join(' · ') || 'Bare machine';
  $('stats').innerHTML = `<b>${fmtT(t)}</b> · <b>${g.crushed}</b> crushed · <b>${g.kills - g.crushed}</b> shot · hull <b>${Math.max(0, Math.round(g.hp))}</b><br>${build}`;
  titleInfo(); announce(`${$('overT').textContent}. ${fmtT(t)}. ${g.crushed} crushed with the ram, ${g.kills - g.crushed} shot. Hull ${Math.max(0, Math.round(g.hp))}. Fitted: ${build}.`); show('over'); }
function togglePause() { if (state === 'choose') return; if (state === 'play') { state = 'paused'; stick = null; dbtn = null; $('build').innerHTML = G.items.length ? G.items.map(partLi).join('') : '<li>No parts fitted yet.</li>'; announce('Paused'); show('pause'); } else if (state === 'paused') { state = 'play'; show(''); lastT = performance.now(); } }
$('startBtn').onclick = startGame; $('againBtn').onclick = startGame; $('resumeBtn').onclick = togglePause; $('quitBtn').onclick = () => { if (state === 'paused') endGame(false); }; $('ch0').onclick = () => choose(0); $('ch1').onclick = () => choose(1); $('chNo').onclick = () => choose(-1);

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
    { k: 'caps', t: 'toggle', l: 'Event captions', d: 'Off by default. Turn on for a line of text when a swarm or a brood guard arrives or a part goes up a mark. Always sent to screen readers.' } ] },
  { g: 'Audio & haptics', items: [
    { k: 'vol', t: 'range', l: 'Master volume', min: 0, max: 100, step: 5, sc: 100, fmt: pct }, { k: 'sfxv', t: 'range', l: 'Effects volume', min: 0, max: 100, step: 5, sc: 100, fmt: pct }, { k: 'musv', t: 'range', l: 'Ambience and heartbeat volume', min: 0, max: 100, step: 5, sc: 100, fmt: pct },
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
addEventListener('keydown', e => { if (state !== 'choose') return; if (e.key === '1') choose(0); else if (e.key === '2') choose(1); else if (e.key === '3' && offer && offer.kind === 'organ') choose(-1); });
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
  if (showFps) { fpsN++; if (now - fpsT > 500) { fpsEl.textContent = Math.round(fpsN * 1000 / (now - fpsT)) + ' fps  q' + Q.toFixed(2) + '  bugs ' + G.en.length + '  ' + glc.width + 'x' + glc.height + '  inst ' + STATS.inst + ' in ' + STATS.batches + '  spr ' + STATS.sprites + '  dec ' + STATS.decals; fpsN = 0; fpsT = now; } }
  step(dt); render();
}
/* hooks for automated checks: step the game by a fixed amount and read its state as text */
window.advanceTime = ms => { for (let t = 0; t < ms; t += 1000 / 60) step(1 / 60); render(); };
window.render_game_to_text = () => { const g = G; return JSON.stringify({ state, seed: SEED, drawn: STATS, items: g.items, choices: g.choices, offer: offer ? offer.cards.map(c => c.id) : null, closed: g.closed, drops: g.drops.length, t: +g.t.toFixed(2), hp: Math.round(g.hp), kills: g.kills, pos: [+g.x.toFixed(2), +g.z.toFixed(2)], vel: [+g.vx.toFixed(2), +g.vz.toFixed(2)], dash: g.dash ? +g.dash.t.toFixed(2) : null, dashCd: +Math.max(0, g.dcd).toFixed(2), target: !!g.tgt, bugs: g.en.map(e => ({ x: +e.x.toFixed(1), z: +e.z.toFixed(1), st: e.state, hp: Math.round(e.hp) })) }); };

applySettings(); resize(); newGame(true); titleInfo(); cv.style.visibility = 'hidden';
try { GLOK = initGL(glc); } catch (e) { GLOK = false; console.error(e); }
if (!GLOK) { show('nogl'); } else requestAnimationFrame(t => { lastT = t; frame(t); });
