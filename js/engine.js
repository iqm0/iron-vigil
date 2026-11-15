'use strict';
/* =====================================================================
   A small WebGL2 renderer for rigid-part characters.
   Everything solid is an instance of one of four meshes (bevelled cube, cylinder, cone, sphere).
   One spotlight with a shadow map (the headlamp), six point lights, soft particles and ground decals.
   ===================================================================== */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const ease = u => u * u * (3 - 2 * u);
function hash2(x, y, s) { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul((s | 0) + 11, 1274126177); h = Math.imul(h ^ (h >>> 13), 1103515245); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }

/* ---------- matrices (column-major) ---------- */
const M4 = {
  ident(o) { o.fill(0); o[0] = o[5] = o[10] = o[15] = 1; return o; },
  mul(o, a, b) { for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3]; return o; },
  persp(o, fovy, asp, n, f) { const t = 1 / Math.tan(fovy / 2); o.fill(0); o[0] = t / asp; o[5] = t; o[10] = (f + n) / (n - f); o[11] = -1; o[14] = 2 * f * n / (n - f); return o; },
  look(o, ex, ey, ez, ax, ay, az, ux, uy, uz) { let zx = ex - ax, zy = ey - ay, zz = ez - az, l = Math.hypot(zx, zy, zz) || 1; zx /= l; zy /= l; zz /= l;
    let xx = uy * zz - uz * zy, xy = uz * zx - ux * zz, xz = ux * zy - uy * zx; l = Math.hypot(xx, xy, xz) || 1; xx /= l; xy /= l; xz /= l; const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    o[0] = xx; o[1] = yx; o[2] = zx; o[3] = 0; o[4] = xy; o[5] = yy; o[6] = zy; o[7] = 0; o[8] = xz; o[9] = yz; o[10] = zz; o[11] = 0; o[12] = -(xx * ex + xy * ey + xz * ez); o[13] = -(yx * ex + yy * ey + yz * ez); o[14] = -(zx * ex + zy * ey + zz * ez); o[15] = 1; return o; },
};
/* a matrix stack for building characters: T/RX/RY/RZ act in the local frame, draw() emits an instance */
const STK = []; for (let i = 0; i < 24; i++) STK.push(new Float32Array(16)); let sp = 0; M4.ident(STK[0]);
function reset() { sp = 0; M4.ident(STK[0]); }
function push() { STK[sp + 1].set(STK[sp]); sp++; }
function pop() { sp--; }
function T(x, y, z) { const m = STK[sp]; m[12] += m[0] * x + m[4] * y + m[8] * z; m[13] += m[1] * x + m[5] * y + m[9] * z; m[14] += m[2] * x + m[6] * y + m[10] * z; }
function RY(a) { const m = STK[sp], c = Math.cos(a), s = Math.sin(a); for (let i = 0; i < 3; i++) { const x = m[i], z = m[8 + i]; m[i] = x * c - z * s; m[8 + i] = x * s + z * c; } }
function RX(a) { const m = STK[sp], c = Math.cos(a), s = Math.sin(a); for (let i = 0; i < 3; i++) { const y = m[4 + i], z = m[8 + i]; m[4 + i] = y * c + z * s; m[8 + i] = -y * s + z * c; } }
function RZ(a) { const m = STK[sp], c = Math.cos(a), s = Math.sin(a); for (let i = 0; i < 3; i++) { const x = m[i], y = m[4 + i]; m[i] = x * c + y * s; m[4 + i] = -x * s + y * c; } }
function SCL(k) { const m = STK[sp]; for (let i = 0; i < 11; i++) if (i % 4 !== 3) m[i] *= k; }
function xf(x, y, z, o) { const m = STK[sp]; o = o || [0, 0, 0]; o[0] = m[0] * x + m[4] * y + m[8] * z + m[12]; o[1] = m[1] * x + m[5] * y + m[9] * z + m[13]; o[2] = m[2] * x + m[6] * y + m[10] * z + m[14]; return o; }

/* ---------- meshes ---------- */
function meshBuilder() { const P = [], N = []; const tri = (a, b, c, na, nb, nc) => { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2], cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
    const n = na || [cx, cy, cz]; if (cx * n[0] + cy * n[1] + cz * n[2] < 0) { const t = b; b = c; c = t; const tn = nb; nb = nc; nc = tn; }
    let fl = na; if (!fl) { const l = Math.hypot(cx, cy, cz) || 1; fl = [cx / l, cy / l, cz / l]; if (fl[0] * n[0] + fl[1] * n[1] + fl[2] * n[2] < 0) fl = [-fl[0], -fl[1], -fl[2]]; }
    P.push(...a, ...b, ...c); N.push(...(na || fl), ...(nb || fl), ...(nc || fl)); };
  const quad = (a, b, c, d, n) => { tri(a, b, c, n, n, n); tri(a, c, d, n, n, n); }; return { P, N, tri, quad }; }
function cubeMesh(bv) {   // a unit cube with every edge and corner cut, so each box catches light on its rim
  const B = meshBuilder(), h = .5, i = .5 - bv, ax = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  const pt = (a, sa, b, sb, c, sc, ha, hb, hc) => { const p = [0, 0, 0]; p[a] = sa * ha; p[b] = sb * hb; p[c] = sc * hc; return p; };
  for (let a = 0; a < 3; a++) { const b = (a + 1) % 3, c = (a + 2) % 3;
    for (const s of [-1, 1]) { const n = [0, 0, 0]; n[a] = s; B.quad(pt(a, s, b, -1, c, -1, h, i, i), pt(a, s, b, 1, c, -1, h, i, i), pt(a, s, b, 1, c, 1, h, i, i), pt(a, s, b, -1, c, 1, h, i, i), n);        // faces
      for (const t of [-1, 1]) { const n2 = [0, 0, 0]; n2[a] = s * .7071; n2[b] = t * .7071; B.quad(pt(a, s, b, t, c, -1, h, i, i), pt(a, s, b, t, c, 1, h, i, i), pt(a, s, b, t, c, 1, i, h, i), pt(a, s, b, t, c, -1, i, h, i), n2); } } }   // edges
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) { const n = [sx * .577, sy * .577, sz * .577]; B.tri([sx * h, sy * i, sz * i], [sx * i, sy * h, sz * i], [sx * i, sy * i, sz * h], n, n, n); }   // corners
  return B; }
function cylMesh(n, topR) {   // axis Y, radius .5; topR = 0 makes a cone
  const B = meshBuilder(), sl = (1 - topR) * .5;
  for (let k = 0; k < n; k++) { const a0 = k / n * TAU, a1 = (k + 1) / n * TAU, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    const p0 = [c0 * .5, -.5, s0 * .5], p1 = [c1 * .5, -.5, s1 * .5], q0 = [c0 * .5 * topR, .5, s0 * .5 * topR], q1 = [c1 * .5 * topR, .5, s1 * .5 * topR], nn = a => { const l = Math.hypot(1, sl); return [Math.cos(a) / l, sl / l, Math.sin(a) / l]; };
    B.tri(p0, p1, q1, nn(a0), nn(a1), nn(a1)); if (topR > 0) { B.tri(p0, q1, q0, nn(a0), nn(a1), nn(a0)); B.tri([0, .5, 0], q0, q1, [0, 1, 0], [0, 1, 0], [0, 1, 0]); }
    B.tri([0, -.5, 0], p1, p0, [0, -1, 0], [0, -1, 0], [0, -1, 0]); }
  return B; }
function sphMesh(nu, nv) { const B = meshBuilder(), p = (u, v) => { const th = v * Math.PI, ph = u * TAU; return [Math.sin(th) * Math.cos(ph) * .5, Math.cos(th) * .5, Math.sin(th) * Math.sin(ph) * .5]; }, nr = q => [q[0] * 2, q[1] * 2, q[2] * 2];
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = p(i / nu, j / nv), b = p((i + 1) / nu, j / nv), c = p((i + 1) / nu, (j + 1) / nv), d = p(i / nu, (j + 1) / nv); if (j > 0) B.tri(a, b, c, nr(a), nr(b), nr(c)); if (j < nv - 1) B.tri(a, c, d, nr(a), nr(c), nr(d)); }
  return B; }

/* faceted meshes for living things: every face is flat, so chitin reads as hard plates with sharp edges, not as balls */
function facet(B, a, b, c) { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2], nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, mx = a[0] + b[0] + c[0], my = a[1] + b[1] + c[1], mz = a[2] + b[2] + c[2]; if (nx * mx + ny * my + nz * mz < 0) B.tri(a, c, b); else B.tri(a, b, c); }      // wound so the face looks away from the middle of the shape
function octMesh() { const B = meshBuilder(), X = [.5, 0, 0], x = [-.5, 0, 0], Y = [0, .5, 0], y = [0, -.5, 0], Z = [0, 0, .5], z = [0, 0, -.5]; for (const a of [X, x]) for (const b of [Y, y]) for (const c of [Z, z]) facet(B, a, b, c); return B; }
function spindleMesh(n, prof) { const B = meshBuilder(), ring = k => { const [zz, r] = prof[k], o = []; for (let i = 0; i < n; i++) { const a = (i + (k % 2) * .5) / n * TAU; o.push([Math.cos(a) * r, Math.sin(a) * r, zz]); } return o; };      // a seed shape turned on its long axis, each ring half a step round from the last so the faces are triangles
  for (let k = 0; k < prof.length - 1; k++) { const A = ring(k), C = ring(k + 1), o = k % 2; for (let i = 0; i < n; i++) { const j = (i + 1) % n; if (prof[k][1] === 0) facet(B, A[0], C[i], C[j]); else if (prof[k + 1][1] === 0) facet(B, A[i], A[j], C[0]); else { const p = o ? i : (i + n - 1) % n, q = o ? j : i; facet(B, A[i], A[j], C[o ? i : i]); facet(B, A[o ? j : i], C[q], C[p]); } } } return B; }
function prismMesh(n, r0, r1) { const B = meshBuilder(), P = (i, yy, r) => { const a = i / n * TAU; return [Math.cos(a) * r, yy, Math.sin(a) * r]; }; for (let i = 0; i < n; i++) { const a = P(i, -.5, r0), b = P(i + 1, -.5, r0), c = P(i + 1, .5, r1), d = P(i, .5, r1); if (r1 > 0) { facet(B, a, b, c); facet(B, a, c, d); facet(B, [0, .5, 0], d, c); } else facet(B, a, b, [0, .5, 0]); facet(B, [0, -.5, 0], a, b); } return B; }
/* a flat-faced plate from a convex outline in XZ (+Z forward), the top face drawn in a little so the edges catch the light: armour scutes */
function scuteMesh(outline, h, inset) { const B = meshBuilder(), n = outline.length, lo = outline.map(p => [p[0], -h / 2, p[1]]), hi = outline.map(p => [p[0] * inset, h / 2, p[1] * inset]); for (let i = 1; i < n - 1; i++) { facet(B, hi[0], hi[i], hi[i + 1]); facet(B, lo[0], lo[i], lo[i + 1]); } for (let i = 0; i < n; i++) { const j = (i + 1) % n; facet(B, lo[i], lo[j], hi[j]); facet(B, lo[i], hi[j], hi[i]); } return B; }
function bladeMesh() { const B = meshBuilder(), st = []; for (let k = 0; k <= 4; k++) { const u = k / 4, yy = u - .5, zc = .34 * u * u, hw = .2 * (1 - u * u) + .0, th = .07 * (1 - u * .8); st.push(k === 4 ? [[0, yy, zc]] : [[th, yy, zc], [0, yy, zc + hw], [-th, yy, zc], [0, yy, zc - hw * .55]]); }      // a hooked claw with a sharp inner and outer edge
  const tri = (a, b, c) => { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2], nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, cy2 = (a[1] + b[1] + c[1]) / 3, u2 = cy2 + .5, zc = .34 * u2 * u2, mx = (a[0] + b[0] + c[0]) / 3, mz = (a[2] + b[2] + c[2]) / 3 - zc; if (nx * mx + nz * mz < 0) B.tri(a, c, b); else B.tri(a, b, c); };
  for (let k = 0; k < 4; k++) for (let i = 0; i < 4; i++) { const a = st[k][i], b = st[k][(i + 1) % 4]; if (k === 3) tri(a, b, st[4][0]); else { tri(a, b, st[k + 1][(i + 1) % 4]); tri(a, st[k + 1][(i + 1) % 4], st[k + 1][i]); } } B.tri(st[0][0], st[0][2], st[0][1]); B.tri(st[0][0], st[0][3], st[0][2]); return B; }

/* ---------- shaders ---------- */
const GLSL_LIGHT = `
precision highp float; precision highp sampler2DShadow;
uniform vec3 uCam, uFocus, uSpotP, uSpotD, uSpotC, uAmbS, uAmbG, uMoonD, uMoonC, uFogC; uniform vec2 uSpotK, uFogR; uniform mat4 uSpotVP; uniform sampler2DShadow uSh;
uniform vec4 uPL[6]; uniform vec3 uPC[6], uRim; uniform float uExp;
vec3 lightAll(vec3 P, vec3 N, vec3 alb, float sp) {
  vec3 V = normalize(uCam - P), c = alb * mix(uAmbG, uAmbS, N.y * .5 + .5) + alb * uMoonC * max(dot(N, uMoonD), 0.);
  vec3 L = uSpotP - P; float d = length(L); L /= d; float cone = smoothstep(uSpotK.x, uSpotK.y, dot(-L, uSpotD));
  if (cone > 0.) { float at = cone / (1. + d * d * .012) * smoothstep(46., 26., d); vec4 q = uSpotVP * vec4(P + N * .07, 1.); vec3 s = q.xyz / q.w * .5 + .5; float ts = 1. / 1024., sh = 0.;
    sh += texture(uSh, vec3(s.xy + vec2(-ts, -ts), s.z - .0012)); sh += texture(uSh, vec3(s.xy + vec2(ts, -ts), s.z - .0012)); sh += texture(uSh, vec3(s.xy + vec2(-ts, ts), s.z - .0012)); sh += texture(uSh, vec3(s.xy + vec2(ts, ts), s.z - .0012)); sh *= .25;
    float nl = max(dot(N, L), 0.); vec3 H = normalize(L + V); c += uSpotC * at * sh * (alb * nl + sp * pow(max(dot(N, H), 0.), 36.) * nl); }
  for (int i = 0; i < 6; i++) { vec3 Lp = uPL[i].xyz - P; float dp = length(Lp); float at = max(1. - dp / uPL[i].w, 0.); at *= at; if (at > 0.) { Lp /= dp; float nl = max(dot(N, Lp), 0.) * .85 + .15; vec3 H = normalize(Lp + V); c += uPC[i] * at * (alb * nl + sp * pow(max(dot(N, H), 0.), 24.) * .6); } }
  float rim = pow(1. - max(dot(N, V), 0.), 3.) * clamp(N.y * .7 + .45, 0., 1.); c += uRim * rim * (.35 + sp);
  return c; }
vec3 finish(vec3 c, vec3 P) { float f = smoothstep(uFogR.x, uFogR.y, length(P.xz - uFocus.xz)); c = mix(c, uFogC, f); c = 1. - exp(-c * uExp); return pow(c, vec3(.4545)); }
`;
const VS_LIT = `#version 300 es
layout(location=0) in vec3 aP; layout(location=1) in vec3 aN; layout(location=2) in mat4 iM; layout(location=6) in vec4 iC;
uniform mat4 uVP; out vec3 vP, vN; out vec4 vC;
void main() { vec4 w = iM * vec4(aP, 1.); vP = w.xyz; vec3 c0 = iM[0].xyz, c1 = iM[1].xyz, c2 = iM[2].xyz; vN = normalize(c0 * (aN.x / dot(c0, c0)) + c1 * (aN.y / dot(c1, c1)) + c2 * (aN.z / dot(c2, c2))); vC = iC; gl_Position = uVP * w; }`;
const FS_LIT = `#version 300 es
${GLSL_LIGHT}
in vec3 vP, vN; in vec4 vC; out vec4 o;
void main() { vec3 N = normalize(vN); float e = max(vC.a, 0.), sp = vC.a < 0. ? -vC.a : .35; vec3 c = lightAll(vP, N, vC.rgb, sp) + vC.rgb * e; o = vec4(finish(c, vP), 1.); }`;
const VS_DEPTH = `#version 300 es
layout(location=0) in vec3 aP; layout(location=2) in mat4 iM; uniform mat4 uVP; void main() { gl_Position = uVP * iM * vec4(aP, 1.); }`;
const FS_DEPTH = `#version 300 es
precision mediump float; void main() { }`;
const GT = 28;   // the ground texture repeats every 28 units (four slabs)
const VS_GROUND = `#version 300 es
layout(location=0) in vec2 aP; uniform mat4 uVP; uniform vec3 uCenter; out vec3 vP;
void main() { vP = vec3(aP.x * 90. + uCenter.x, 0., aP.y * 90. + uCenter.z); gl_Position = uVP * vec4(vP, 1.); }`;
const FS_GROUND = `#version 300 es
${GLSL_LIGHT}
uniform sampler2D uGA, uGN; uniform vec4 uYard, uApron, uTrack; in vec3 vP; out vec4 o;
float inside(vec4 r, vec2 p) { return max(max(r.x - p.x, p.x - r.y), max(r.z - p.y, p.y - r.w)); }       // below zero inside the rectangle (x0, x1, z0, z1)
void main() { vec2 uv = vP.xz / ${GT}.; vec4 a = texture(uGA, uv); vec2 n = texture(uGN, uv).rg * 2. - 1.; float big = clamp((texture(uGA, uv * .17 + .37).r - .3) * 5., 0., 1.), mid = clamp((texture(uGA, uv * .61).g - .28) * 5., 0., 1.);
  /* A farmyard, not a slab: packed dirt worn pale where it is walked on, a concrete apron only at the shed door, a gravel track with two ruts running out through the gate,
     a road down the east side, a grass verge, and ploughed soil beyond with its furrows running north to south. No detail smaller than a bug. */
  float dy = inside(uYard, vP.xz), ap = 1. - smoothstep(-.25, .25, inside(uApron, vP.xz)), tx = abs(vP.x - uTrack.x), tr = (1. - smoothstep(uTrack.y - .35, uTrack.y + .35, tx)) * step(uApron.w - .5, vP.z), rut = 1. - smoothstep(.1, .34, abs(tx - .8));
  float rd = 1. - smoothstep(1.4, 1.9, abs(vP.x - uTrack.z)), verge = smoothstep(-.5, .3, dy + (mid - .5) * .6), soil = smoothstep(1.3, 2.1, dy + (big - .5)), fur = sin(vP.x * 3.9 + sin(vP.z * .21) * .7);
  vec3 dirt = vec3(.125, .115, .1) * (.8 + .45 * big) * (1. + .22 * smoothstep(-3., -9., dy)), grav = vec3(.17, .167, .16) * (.82 + .3 * mid) * (1. - .4 * rut), grass = vec3(.05, .072, .034) * (.7 + .6 * mid), earth = vec3(.075, .058, .042) * (.75 + .4 * big) * (.8 + .2 * fur);
  vec3 alb = mix(dirt, grav, tr); alb = mix(alb, grass, verge); alb = mix(alb, earth, soil); alb = mix(alb, grav, rd * verge); alb = mix(alb, a.rgb * a.rgb, ap);
  float sp = mix(.03, a.a, ap); n = mix(n * .2, n, ap); n = mix(n, vec2(-cos(vP.x * 3.9 + sin(vP.z * .21) * .7) * .5, 0.), soil * (1. - rd));
  vec3 N = normalize(vec3(n.x, 1., n.y)); o = vec4(finish(lightAll(vP, N, alb, sp), vP), 1.); }`;
/* the ground is painted once into a repeating texture, so the per-frame cost is two lookups */
const VS_BAKE = `#version 300 es
layout(location=0) in vec2 aP; out vec2 vU; void main() { vU = aP * .5 + .5; gl_Position = vec4(aP, 0., 1.); }`;
const FS_BAKE = `#version 300 es
precision highp float; in vec2 vU; out vec4 o; uniform int uMode;
float h1(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float pn(vec2 p, float per) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); vec2 a = mod(i, per), b = mod(i + 1., per); return mix(mix(h1(a), h1(vec2(b.x, a.y)), f.x), mix(h1(vec2(a.x, b.y)), h1(b), f.x), f.y); }
float pf(vec2 p, float per) { return pn(p, per) * .5 + pn(p * 2. + 7., per * 2.) * .25 + pn(p * 4. + 3., per * 4.) * .125 + pn(p * 8., per * 8.) * .0625; }
float crackD(vec2 p) { return abs(pf(p * .5 + 3., 14.) - .47) + abs(pn(p * 2., 56.) - .5) * .22; }
float seamD(vec2 p) { vec2 s = abs(fract(p / 7. + .5) - .5) * 7.; return min(s.x, s.y); }
float height(vec2 p) { return pf(p * 2., 56.) * .5 + pn(p * 8., 224.) * .12 - (1. - smoothstep(0., .03, crackD(p))) * .9 - (1. - smoothstep(.03, .09, seamD(p))) * .6; }
void main() { vec2 p = vU * ${GT}.;
  if (uMode == 1) { float e = ${GT}. / 1024.; vec2 g = vec2(height(p - vec2(e, 0)) - height(p + vec2(e, 0)), height(p - vec2(0, e)) - height(p + vec2(0, e))); o = vec4(clamp(g * .55, -1., 1.) * .5 + .5, 0., 1.); return; }
  float big = pf(p / 7., 4.), mid = pf(p * .5 + 9., 14.), grit = pn(p * 8., 224.) * .5 + pn(p * 16., 448.) * .5;
  vec3 alb = mix(vec3(.085, .08, .078), vec3(.21, .19, .165), clamp(big * .9 + mid * .45 - .2, 0., 1.)); alb *= .72 + .5 * grit;
  float rust = smoothstep(.56, .72, pf(p * .25 + 30., 7.)); alb = mix(alb, vec3(.2, .09, .04), rust * .45);
  alb *= mix(.62, 1., smoothstep(0., .035, crackD(p))); float seam = smoothstep(.03, .09, seamD(p)); alb *= mix(.66, 1., seam);
  float oil = smoothstep(.6, .74, pf(p * .25 + 60., 7.)); alb = mix(alb, vec3(.022, .022, .028), oil * .75);
  vec2 q = p / 7.; float lane = step(abs(fract(q.x + .5) - .5), .012) * step(fract(q.y * 1.75), .5) * step(.5, pn(floor(q * vec2(1., 1.75)) + 5., 4.));      // worn paint dashes
  o = vec4(sqrt(alb), .06 + oil * .9 + (1. - seam) * .08); }`;
const VS_PART = `#version 300 es
layout(location=0) in vec2 aC; layout(location=1) in vec3 iP; layout(location=2) in vec2 iS; layout(location=3) in vec3 iA; layout(location=4) in vec4 iC;
uniform mat4 uVP; uniform vec3 uCam, uCamR, uCamU; out vec2 vU; out vec4 vC;
void main() { vec3 p; if (dot(iA, iA) > 0.) { vec3 side = normalize(cross(iA, uCam - iP)); p = iP + iA * aC.y + side * aC.x * iS.x; } else p = iP + uCamR * aC.x * iS.x + uCamU * aC.y * iS.y; vU = aC; vC = iC; gl_Position = uVP * vec4(p, 1.); }`;
const FS_PART = `#version 300 es
precision mediump float; in vec2 vU; in vec4 vC; out vec4 o;
void main() { float a = smoothstep(1., 0., length(vU)); a *= a; o = vec4(vC.rgb * a * vC.a, a * vC.a); }`;
const VS_DECAL = `#version 300 es
layout(location=0) in vec2 aC; layout(location=1) in vec4 iP; layout(location=2) in vec4 iK; layout(location=3) in vec4 iC;
uniform mat4 uVP; out vec2 vU; out vec4 vC; out float vK, vS;
void main() { vS = iK.w; float c = cos(iK.x), s = sin(iK.x); vec2 q = aC * iP.zw; vec3 p = vec3(iP.x + q.x * c + q.y * s, .03 + iK.z, iP.y - q.x * s + q.y * c); vU = aC; vC = iC; vK = iK.y; gl_Position = uVP * vec4(p, 1.); }`;
const FS_DECAL = `#version 300 es
precision mediump float; in vec2 vU; in vec4 vC; in float vK, vS; out vec4 o;
void main() { float d = length(vU), a;
  if (vK < .5) a = smoothstep(1., .25, d);                                   // soft disc (contact shadow, splat)
  else if (vK < 1.5) a = smoothstep(1., .9, d) * smoothstep(.72, .84, d) + smoothstep(1., .0, d) * .25;   // ring with a faint fill
  else if (vK < 2.5) { vec2 q = abs(vU); a = smoothstep(1., .85, q.x) * smoothstep(1., .8, q.y); }          // soft rectangle (a lane)
  else { float an = atan(vU.y, vU.x), r = .7 + .11 * sin(an * 2. + vS) + .08 * sin(an * 5. - vS * 2.) + .04 * sin(an * 9. + vS * 5.); a = smoothstep(r, r - .2, d); }   // a splat with ragged lobes
  o = vec4(vC.rgb * a * vC.a, a * vC.a); }`;

/* ---------- GL ---------- */
let gl = null; const PROG = {}, MESH = {}; let shadowFB = null, shadowTex = null, groundVAO = null, quadBuf = null, texGA = null, texGN = null;
const SH = 1024, MAXI = 1400; const STATS = { inst: 0, batches: 0, sprites: 0, decals: 0 };
function prog(vs, fs) { const p = gl.createProgram(); for (const [t, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) + '\n' + src.split('\n').slice(0, 6).join('\n')); gl.attachShader(p, s); }
  gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (let i = 0; i < n; i++) { const nm = gl.getActiveUniform(p, i).name.replace('[0]', ''); u[nm] = gl.getUniformLocation(p, nm); } p.u = u; return p; }
function makeMesh(B) { const m = { n: 0, count: B.P.length / 3, inst: new Float32Array(MAXI * 20) }; m.vao = gl.createVertexArray(); gl.bindVertexArray(m.vao);
  for (const [loc, data] of [[0, B.P], [1, B.N]]) { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0); }
  m.ib = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, m.ib); gl.bufferData(gl.ARRAY_BUFFER, m.inst.byteLength, gl.DYNAMIC_DRAW);
  for (let i = 0; i < 5; i++) { gl.enableVertexAttribArray(2 + i); gl.vertexAttribPointer(2 + i, 4, gl.FLOAT, false, 80, i * 16); gl.vertexAttribDivisor(2 + i, 1); } gl.bindVertexArray(null); return m; }
function instVAO(fmt, max) {   // an instanced unit quad with the given per-instance float layout
  const o = { n: 0, stride: fmt.reduce((a, b) => a + b, 0) }; o.data = new Float32Array(max * o.stride); o.max = max; o.vao = gl.createVertexArray(); gl.bindVertexArray(o.vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  o.buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, o.buf); gl.bufferData(gl.ARRAY_BUFFER, o.data.byteLength, gl.DYNAMIC_DRAW); let off = 0;
  fmt.forEach((sz, i) => { gl.enableVertexAttribArray(1 + i); gl.vertexAttribPointer(1 + i, sz, gl.FLOAT, false, o.stride * 4, off * 4); gl.vertexAttribDivisor(1 + i, 1); off += sz; }); gl.bindVertexArray(null); return o; }
let PADD = null, PSMK = null, DEC = null;
function initGL(canvas) {
  gl = canvas.getContext('webgl2', { antialias: true, alpha: false, powerPreference: 'high-performance' }); if (!gl) return false;
  PROG.lit = prog(VS_LIT, FS_LIT); PROG.depth = prog(VS_DEPTH, FS_DEPTH); PROG.ground = prog(VS_GROUND, FS_GROUND); PROG.part = prog(VS_PART, FS_PART); PROG.decal = prog(VS_DECAL, FS_DECAL);
  MESH.cube = makeMesh(cubeMesh(.07)); MESH.cyl = makeMesh(cylMesh(14, 1)); MESH.cone = makeMesh(cylMesh(12, 0)); MESH.sph = makeMesh(sphMesh(14, 9));
  MESH.oct = makeMesh(octMesh()); MESH.shell = makeMesh(spindleMesh(7, [[-.5, 0], [-.28, .34], [.04, .5], [.32, .36], [.5, 0]])); MESH.taper = makeMesh(prismMesh(5, .5, .22)); MESH.spike = makeMesh(prismMesh(4, .5, 0)); MESH.blade = makeMesh(bladeMesh()); MESH.scute = makeMesh(scuteMesh([[-.5, -.28], [.5, -.28], [.52, .06], [.27, .36], [-.27, .36], [-.52, .06]], .16, .8));
  quadBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW);
  groundVAO = gl.createVertexArray(); gl.bindVertexArray(groundVAO); gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.bindVertexArray(null);
  PADD = instVAO([3, 2, 3, 4], 900); PSMK = instVAO([3, 2, 3, 4], 300); DEC = instVAO([4, 4, 4], 400);
  shadowTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, shadowTex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, SH, SH, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
  shadowFB = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFB); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, shadowTex, 0); gl.drawBuffers([gl.NONE]); gl.readBuffer(gl.NONE); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  // paint the ground
  PROG.bake = prog(VS_BAKE, FS_BAKE); const fb = gl.createFramebuffer(), ani = gl.getExtension('EXT_texture_filter_anisotropic'); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND); gl.useProgram(PROG.bake); gl.bindVertexArray(groundVAO);
  const bake = (size, mode) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); gl.viewport(0, 0, size, size); gl.uniform1i(PROG.bake.u.uMode, mode); gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); if (ani) gl.texParameterf(gl.TEXTURE_2D, ani.TEXTURE_MAX_ANISOTROPY_EXT, 4); return t; };
  texGA = bake(2048, 0); texGN = bake(1024, 1); gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.deleteFramebuffer(fb); gl.bindVertexArray(null);
  return true;
}

/* ---------- emit ---------- */
function draw(mesh, sx, sy, sz, col, e) { if (mesh.n >= MAXI) return; const m = STK[sp], a = mesh.inst, o = mesh.n * 20;
  a[o] = m[0] * sx; a[o + 1] = m[1] * sx; a[o + 2] = m[2] * sx; a[o + 3] = 0; a[o + 4] = m[4] * sy; a[o + 5] = m[5] * sy; a[o + 6] = m[6] * sy; a[o + 7] = 0; a[o + 8] = m[8] * sz; a[o + 9] = m[9] * sz; a[o + 10] = m[10] * sz; a[o + 11] = 0; a[o + 12] = m[12]; a[o + 13] = m[13]; a[o + 14] = m[14]; a[o + 15] = 1;
  a[o + 16] = col[0]; a[o + 17] = col[1]; a[o + 18] = col[2]; a[o + 19] = e || 0; mesh.n++; }
/* a limb segment from A to B: the mesh's Y axis runs along it; ref says which way its "front" faces */
function seg(mesh, A, B, w, d, col, e, ref) { if (mesh.n >= MAXI) return; let yx = B[0] - A[0], yy = B[1] - A[1], yz = B[2] - A[2]; const len = Math.hypot(yx, yy, yz) || 1e-4; yx /= len; yy /= len; yz /= len; ref = ref || [0, 0, 1];
  let xx = ref[1] * yz - ref[2] * yy, xy = ref[2] * yx - ref[0] * yz, xz = ref[0] * yy - ref[1] * yx, l = Math.hypot(xx, xy, xz); if (l < 1e-4) { xx = 1; xy = 0; xz = 0; l = 1; } xx /= l; xy /= l; xz /= l; const zx = xy * yz - xz * yy, zy = xz * yx - xx * yz, zz = xx * yy - xy * yx;
  const a = mesh.inst, o = mesh.n * 20; a[o] = xx * w; a[o + 1] = xy * w; a[o + 2] = xz * w; a[o + 3] = 0; a[o + 4] = yx * len; a[o + 5] = yy * len; a[o + 6] = yz * len; a[o + 7] = 0; a[o + 8] = zx * d; a[o + 9] = zy * d; a[o + 10] = zz * d; a[o + 11] = 0;
  a[o + 12] = (A[0] + B[0]) / 2; a[o + 13] = (A[1] + B[1]) / 2; a[o + 14] = (A[2] + B[2]) / 2; a[o + 15] = 1; a[o + 16] = col[0]; a[o + 17] = col[1]; a[o + 18] = col[2]; a[o + 19] = e || 0; mesh.n++; }
/* two-bone IK: where the knee goes, given hip, foot and which way the knee should point */
function ik2(H, F, l1, l2, pole, o) { let dx = F[0] - H[0], dy = F[1] - H[1], dz = F[2] - H[2], d = Math.hypot(dx, dy, dz) || 1e-4; dx /= d; dy /= d; dz /= d; d = Math.min(d, l1 + l2 - .001);
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a)), pd = pole[0] * dx + pole[1] * dy + pole[2] * dz; let bx = pole[0] - dx * pd, by = pole[1] - dy * pd, bz = pole[2] - dz * pd; const bl = Math.hypot(bx, by, bz) || 1; bx /= bl; by /= bl; bz /= bl;
  o[0] = H[0] + dx * a + bx * h; o[1] = H[1] + dy * a + by * h; o[2] = H[2] + dz * a + bz * h; return o; }
function sprite(buf, x, y, z, w, h, ax, ay, az, r, g, b, a) { if (buf.n >= buf.max) return; const d = buf.data, o = buf.n * 12; d[o] = x; d[o + 1] = y; d[o + 2] = z; d[o + 3] = w; d[o + 4] = h; d[o + 5] = ax; d[o + 6] = ay; d[o + 7] = az; d[o + 8] = r; d[o + 9] = g; d[o + 10] = b; d[o + 11] = a; buf.n++; }
const glow = (x, y, z, s, r, g, b, a) => sprite(PADD, x, y, z, s, s, 0, 0, 0, r, g, b, a);
function decal(x, z, sx, sz, rot, kind, r, g, b, a, lift, seed) { if (DEC.n >= DEC.max) return; const d = DEC.data, o = DEC.n * 12; d[o] = x; d[o + 1] = z; d[o + 2] = sx; d[o + 3] = sz; d[o + 4] = rot; d[o + 5] = kind; d[o + 6] = lift || 0; d[o + 7] = seed || 0; d[o + 8] = r; d[o + 9] = g; d[o + 10] = b; d[o + 11] = a; DEC.n++; }

/* ---------- frame ---------- */
const VP = new Float32Array(16), VIEW = new Float32Array(16), PROJ = new Float32Array(16), SVP = new Float32Array(16), SV = new Float32Array(16), SPJ = new Float32Array(16);
const PLv = new Float32Array(24), PCv = new Float32Array(18);
function setLightUniforms(p, S) { const u = p.u; gl.uniform3fv(u.uCam, S.cam); gl.uniform3fv(u.uFocus, S.focus); gl.uniform3fv(u.uSpotP, S.spotP); gl.uniform3fv(u.uSpotD, S.spotD); gl.uniform3fv(u.uSpotC, S.spotC); gl.uniform2f(u.uSpotK, S.spotCos[0], S.spotCos[1]);
  gl.uniformMatrix4fv(u.uSpotVP, false, SVP); gl.uniform1i(u.uSh, 0); gl.uniform4fv(u.uPL, PLv); gl.uniform3fv(u.uPC, PCv); gl.uniform3fv(u.uAmbS, S.ambS); gl.uniform3fv(u.uAmbG, S.ambG); gl.uniform3fv(u.uMoonD, S.moonD); gl.uniform3fv(u.uMoonC, S.moonC); gl.uniform3fv(u.uFogC, S.fogC); gl.uniform2f(u.uFogR, S.fogR[0], S.fogR[1]); gl.uniform1f(u.uExp, S.exposure); gl.uniform3fv(u.uRim, S.rim); gl.uniformMatrix4fv(u.uVP, false, VP); }
function renderScene(S, W, H) {
  // S: { cam[3], at[3], fov, focus[3], spotP, spotD, spotC, spotCos[2], lights[{p,c,r}], amb..., exposure }
  M4.persp(PROJ, S.fov, W / H, 1, 160); M4.look(VIEW, S.cam[0], S.cam[1], S.cam[2], S.at[0], S.at[1], S.at[2], 0, 1, 0); M4.mul(VP, PROJ, VIEW);
  const sd = S.spotD, upx = Math.abs(sd[1]) > .95 ? 1 : 0; M4.persp(SPJ, S.spotFov, 1, .6, 52); M4.look(SV, S.spotP[0], S.spotP[1], S.spotP[2], S.spotP[0] + sd[0], S.spotP[1] + sd[1], S.spotP[2] + sd[2], upx, 1 - upx, 0); M4.mul(SVP, SPJ, SV);
  PLv.fill(0); PCv.fill(0); S.lights.slice(0, 6).forEach((L, i) => { PLv[i * 4] = L.p[0]; PLv[i * 4 + 1] = L.p[1]; PLv[i * 4 + 2] = L.p[2]; PLv[i * 4 + 3] = L.r; PCv[i * 3] = L.c[0]; PCv[i * 3 + 1] = L.c[1]; PCv[i * 3 + 2] = L.c[2]; });
  const meshes = Object.values(MESH);
  for (const m of meshes) { gl.bindBuffer(gl.ARRAY_BUFFER, m.ib); gl.bufferSubData(gl.ARRAY_BUFFER, 0, m.inst, 0, m.n * 20); }
  // shadow pass: what the headlamp sees
  gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFB); gl.viewport(0, 0, SH, SH); gl.enable(gl.DEPTH_TEST); gl.depthMask(true); gl.disable(gl.BLEND); gl.clear(gl.DEPTH_BUFFER_BIT); gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(2, 4); gl.disable(gl.CULL_FACE);
  gl.useProgram(PROG.depth); gl.uniformMatrix4fv(PROG.depth.u.uVP, false, SVP); for (const m of meshes) if (m.n) { gl.bindVertexArray(m.vao); gl.drawArraysInstanced(gl.TRIANGLES, 0, m.count, m.n); }
  gl.disable(gl.POLYGON_OFFSET_FILL);
  // main pass
  gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H); { const sk = i => Math.pow(1 - Math.exp(-S.fogC[i] * S.exposure), .4545); gl.clearColor(sk(0), sk(1), sk(2), 1); }       /* past the edge of the ground is haze, not black */
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, shadowTex);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texGA); gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, texGN); gl.activeTexture(gl.TEXTURE0);
  gl.useProgram(PROG.ground); setLightUniforms(PROG.ground, S); gl.uniform1i(PROG.ground.u.uGA, 1); gl.uniform1i(PROG.ground.u.uGN, 2); gl.uniform3fv(PROG.ground.u.uCenter, S.focus); gl.uniform4fv(PROG.ground.u.uYard, S.yard || [-1e4, 1e4, -1e4, 1e4]); gl.uniform4fv(PROG.ground.u.uApron, S.apron || [0, 0, 0, 0]); gl.uniform4fv(PROG.ground.u.uTrack, S.track || [1e4, 0, 1e4, 0]); gl.bindVertexArray(groundVAO); gl.disable(gl.CULL_FACE); gl.drawArrays(gl.TRIANGLES, 0, 6);
  // decals lie on the ground: contact shadows, splats, attack marks
  if (DEC.n) { gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); gl.useProgram(PROG.decal); gl.uniformMatrix4fv(PROG.decal.u.uVP, false, VP); gl.bindVertexArray(DEC.vao); gl.bindBuffer(gl.ARRAY_BUFFER, DEC.buf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, DEC.data, 0, DEC.n * 12); gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, DEC.n); gl.depthMask(true); gl.disable(gl.BLEND); }
  gl.enable(gl.CULL_FACE); gl.useProgram(PROG.lit); setLightUniforms(PROG.lit, S); for (const m of meshes) if (m.n) { gl.bindVertexArray(m.vao); gl.drawArraysInstanced(gl.TRIANGLES, 0, m.count, m.n); }
  // particles: smoke first (alpha), then everything that glows (additive)
  gl.disable(gl.CULL_FACE); gl.enable(gl.BLEND); gl.depthMask(false); gl.useProgram(PROG.part); const u = PROG.part.u; gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform3fv(u.uCam, S.cam); gl.uniform3f(u.uCamR, VIEW[0], VIEW[4], VIEW[8]); gl.uniform3f(u.uCamU, VIEW[1], VIEW[5], VIEW[9]);
  for (const [B, add] of [[PSMK, false], [PADD, true]]) if (B.n) { gl.blendFunc(gl.ONE, add ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA); gl.bindVertexArray(B.vao); gl.bindBuffer(gl.ARRAY_BUFFER, B.buf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, B.data, 0, B.n * 12); gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, B.n); }
  gl.depthMask(true); gl.disable(gl.BLEND); gl.bindVertexArray(null);
  let ni = 0, nb = 0; for (const m of meshes) { ni += m.n; if (m.n) nb++; m.n = 0; } STATS.inst = ni; STATS.batches = nb; STATS.sprites = PADD.n + PSMK.n; STATS.decals = DEC.n; PADD.n = PSMK.n = DEC.n = 0;       // what this frame submitted, for the frame counter and the tests
}
