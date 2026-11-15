# LAST LIGHT — WEBGL2 GEOMETRY / RIG / PERFORMANCE IMPLEMENTATION GUIDE
Version 1.0 · source-aware implementation, not a ready-applied patch.

## 0. Why keep the existing renderer
Verified public source `https://github.com/iqm0/iron-vigil`:
- `js/engine.js`: WebGL2, `meshBuilder()` with flat normals; mesh factory `makeMesh()`; current primitive library `MESH.cube`, `cyl`, `cone`, `sph`, `oct`, `shell`, `taper`, `spike`, `blade`; `reset/push/pop/T/RX/RY/RZ`, instanced `draw(mesh, sx, sy, sz, col, emissive)`; `seg` for oriented limb beams and `ik2` for knees; global `renderScene` uses instanced buffers; `SH=1024` shadow map; `MAXI=1400` **per-mesh instance slots**, not triangle capacity.
- `js/game.js`: `drawMech(g)` from around line 470, `drawBug(e,g)` around line 562; `drawProp` around line 601, `getCell` from around line 199; `render()` emits props, burrows, mech and enemies; `HIP = 1.5` and Y-up, ground XZ, local +Z forward. Renderer has no imported meshes, no library and no build step.
- The game's lighting is deliberately dark; missing silhouettes and inadequate world identity are not solved by polygon count alone.

**Do not move to Three.js by default.** That means replacing shader, shadow, material, effect and instance assumptions while invalidating regression checks. An optional future Blender -> glTF import should be justified with actual benefit and an engine integration plan. `GLTFLoader` belongs to Three.js; do not copy it into this vanilla renderer as if it worked directly.

## 1. Asset production pattern (3 levels)
A) **10 existing primitives** for joints, screws, piston rods, simple bodies and fragments. Cheapest and already batched by mesh.
B) **3–6 new custom, convex, flat-shaded reusable shapes**: cab wedge, canopy wedge, guard plate, bladder, mandible, heavy barrel muzzle. These become `MESH.*` registered once in `initGL()`.
C) **Rigid hierarchical assemblies** in `drawMech`, `drawBug`, `drawProp`. Link parts by parent transform; only articulate relevant pivots. Animation modifies joint transforms each frame. Never regenerate vertex arrays per animation frame.

## 2. Code skeleton — add one custom rigid mesh
`meshBuilder()` already returns `{P,N,tri,quad}`; `makeMesh(B)` uploads the positions/normals and configures VAO + per-instance attributes. The mesh triangles are **non-indexed** in the current renderer: preserve that contract unless changing `makeMesh()` and the draw loop together.

Add to engine's mesh factories (before `initGL()`). Convex points are XZ footprint with +Z forward. The routine below normalises to CCW XZ. It triangulates top and bottom as a fan: do not feed it concave polygons.

```js
function extrudedXZ(outline, yLo = -0.5, yHi = 0.5) {
  const B = meshBuilder();
  const pts = outline.map(p => [p[0], p[1]]);
  let area2 = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i+1) % pts.length];
    area2 += a[0] * b[1] - b[0] * a[1];
  }
  if (area2 < 0) pts.reverse();
  const V = (i, y) => [pts[i][0], y, pts[i][1]];
  for (let i = 1; i < pts.length - 1; i++) {
    B.tri(V(0,yHi), V(i,yHi), V(i+1,yHi), [0,1,0], [0,1,0], [0,1,0]);
    B.tri(V(0,yLo), V(i+1,yLo), V(i,yLo), [0,-1,0], [0,-1,0], [0,-1,0]);
  }
  for (let i = 0; i < pts.length; i++) {
    const j = (i+1) % pts.length;
    const dx = pts[j][0]-pts[i][0], dz=pts[j][1]-pts[i][1];
    const len = Math.hypot(dx,dz) || 1;
    const n = [dz/len,0,-dx/len];
    B.quad(V(i,yLo),V(j,yLo),V(j,yHi),V(i,yHi),n);
  }
  return B;
}
```

Register meshes **once** inside the existing `initGL` after primitive creation:

```js
MESH.reclaimerCab = makeMesh(extrudedXZ([
  [-0.72,-0.44],[0.72,-0.44],[0.97,0.18],
  [0.72,0.62],[-0.72,0.62],[-0.97,0.18]
], -0.38, 0.38));
MESH.guardShield = makeMesh(extrudedXZ([
  [-0.8,-0.45],[0.8,-0.45],[1.02,0.15],
  [0.5,0.65],[-0.5,0.65],[-1.02,0.15]
], -0.14,0.14));
```

Use them in game art draw function **within the existing local body transform**:

```js
function drawReclaimerCabLocal() { // call only inside drawMech's torso pivot
  push(); T(0, 0.78, 0.03);
  draw(MESH.reclaimerCab, 1.0, 1.0, 1.0, YEL2, 0);
  pop();
  // flat dark front window (canopy plate):
  box(0, 0.93, 0.49, 1.18, 0.30, 0.07, DRK, -0.5);
}
```

The above is a **sample mesh/assembly recipe**, not a drop-in visual replacement; validate space relative to existing body `drawMech` and avoid double drawing with its old cab geometry.

## 3. Procedural weapon attachment recipe
Create a component hierarchy per hardpoint; compute target orientation once for weapon axis; use parent `push/T/RY/...` then draw local models. Separate physical visual recoil from physics so bullets do not inherit a lagging barrel position. If a projectile is supposed to leave the physical muzzle, calculate `xf` at the actual posed barrel origin and pass that transform to projectile spawn or adjust visual target accordingly.

Minimum meaningful meshes for cannon: breech box, one 12-sided thick outer barrel, three recessed short bores, underside coil, a 2-beam recoil rail. Drive breech rearward and return. The current source already contains muzzle tracking; reuse and constrain its pose rather than drawing a contradictory cannon overlay.

```js
// PSEUDOCODE: inside the right-arm pivot after aim transform
push(); T(0, 0, -recoil * 0.17);
draw(MESH.cube, 0.66, 0.7, 1.05, DRK, -0.2); // breech
push(); T(0, 0.04, 0.73); RX(Math.PI/2);
draw(MESH.cyl, 0.46, 1.35, 0.46, STL, -0.3); pop();
// three muzzle rings and shell ejection become their own rigid children
pop();
```

Rotation needs confirmation for the actual local pivot: the current `cyl` primitive's long axis is Y; rotate it into local +Z as above. Pseudocode uses `recoil` already computed by the animation integrator, not defined as a global.

## 4. Enemy rig recipe
Root transform = enemy world translation and body yaw, as in existing `drawBug`. Chitin body is a small set of large nested shells (not dozens of tiny spikes). Legs: use existing `ik2(hip,foot,l1,l2,pole,knee)` and `seg(MESH.taper,..)` / `seg(MESH.spike,..)` to attach to planted foot locations. Each enemy needs a different *limb proportion* and *body outline*; simply scaling `e.s` is not an enemy redesign.

- Stalker: compress torso, space front hooks wide, sharpen head wedge, six leg links in pairs; pose hook joints from REST -> OPEN -> STRIKE -> RECOVER. Existing `state === 'tell'` can drive opening.
- Spitter: 5–7 flat-faceted bladder ring mesh + base skirt, link to `spit` timing and expand 8–18% during wind-up (tune in playtest); legs remain low so the sac is the silhouette.
- Guard: one custom broad front plate facing +Z, flexible small leg spread; expose a lighter `rearMembrane` child; track `e.a` and use guarded frontal damage. Weak point should only count if the combat programmer implements corresponding hurt logic.
- Mother: combine TWO different forms in one model: armour front and organ rear. When phase changes, unfold hinged ribs, expose sac and adjust secondary limbs. Don't scale every shape and add 30 spikes.

**AI/visual contract** (must be designed together):
```js
// example state data, proposal, not existing field names
{
  state: 'windup', attack: 'lunge',
  tellProgress: 0.0, // 0..1; animation and decal read same source
  weakpointOpen: false,
  staggerSeconds: 0
}
```
No danger decal without matching attack body animation, and no invisible immunity just because a boss is in a phase.

## 5. Stage architecture
Current `getCell(cx,cz)` generates endless, hashed props with `CELL=11`, and `pushOut()` collides with props. Do not attempt to fake a structured farm by adding more types to its single hash selector. Instead use two separate systems:

1. **Designed static landmarks**: deterministic arrays `{id, k, x,z, rot, radius, layer}` loaded by stage identifier and culled by distance. One shared `drawProp` or `drawLandmark` function. Collision uses the same data (with coarse circles or capsule/swept shape).
2. **Seeded procedural secondary dressing**: grass clumps, cable bundles, minor scrap and small ground cracks, derived from tile coordinates. Exclude authored gameplay lanes and safe spawn region by mask.

Example schema:
```js
const STAGES = {
  relay: {
    bounds: {minX:-18,maxX:18,minZ:-25,maxZ:25},
    props: [
      {id:'relay',k:'beacon',x:0,z:-4,rot:0,r:2,solid:true},
      {id:'hangar',k:'workshop',x:-10,z:16,rot:0.15,r:4,solid:true},
      {id:'pump',k:'pump',x:11,z:12,rot:-0.35,r:2,solid:true},
      {id:'harvester',k:'harvester',x:-12,z:-13,rot:0.5,r:3,solid:true}
    ],
    entryZones: [{x:0,z:-23,rx:10,rz:2}]
  }
};
```
These numbers are **initial composition proposals**. Current enemy spawns, camera and pathing may assume infinite plane; migrate carefully and test a full run. Implement objective UI and mechanics separately, so level generation does not silently change combat logic.

**Rendering performance:** use the existing procedural ground bake and add material masks rather than loading unique textures. Author big structures out of 5–15 rigid pieces rather than 150 boxes. Static world objects only submit when inside the camera margin. Give rear world silhouettes reduced visual contrast and no shadow if they don't intersect combat play. Culling should be simple and deterministic; don't overoptimise until benchmarked.

## 6. WebGL2 instancing and actual performance caution
Current `makeMesh` uploads non-indexed triangle positions/normals once and instance attributes (mat4 + colour/emissive = 20 floats). `draw()` and `seg()` append instance transforms and material colours. `renderScene()` then uploads and draws per-mesh batch. This already uses the essential strategy for many repeating limbs, plates and world props; `MAXI=1400` is an instance limit **for each mesh**. More detail in a single mesh increases per-instance vertices, and new mesh types add draw calls/shadow batches. Profile both.

**Target budgets (initial profiling hypotheses, not verified measured limits):**
- Mech: ~35–65 rigid parts, prefer <6 distinct mesh types plus 2–3 hero shapes.
- Stalker: ~16–25 parts; Spitter ~14–22; Guard ~16–25; boss ~35–65, maintain at 20 active enemies as first stress case.
- 1–2 shadow-casting key lights? No: the CURRENT engine has **one** shadow spotlight and six point-light positions; keep that. Do not add real-time shadows per floodlight. Bake/simulate additional stage lights or use emissive cues.
- Cap active smoke, organic particles, decals. Current per-system buffers are bounded; use those bounds and tune under phone capture.
- Start by measuring frame time, total submitted instances per mesh, per-frame JS time, actual device temperature, visible/culled prop count. Test at 360×800 CSS px and at 412×880; run with reduced-motion and higher-contrast settings.

## 7. Production pipeline — artist, technical artist, engineer
1. **2D black shape sheets** at phone size: 3 mech thumbnails, 3 variants per enemy, 2 stage map sketches. No finishing until shape tests pass.
2. **Greybox rigs** using `MESH.cube/cyl/shell` in current source; run live with the actual camera and lighting. Inspect animation while dozens of enemies approach.
3. **Custom mesh factories** for selected silhouette deficiencies (wedge cabin, guard plate, swollen sac, mandible). Register once in `initGL`, check face normals, right/left orientation and no backface holes.
4. **Parent/child hardpoints**: one owned function per visible attachment; preserve old moving skeleton. Add pose values linked to attack/dash/weak point state.
5. **Materials/lighting pass**: reduce bright green/red dots; improve ambient so core outlines can be understood in shadows; retain dramatic spot.
6. **Screen-space performance pass**: if a detail vanishes at gameplay zoom, remove it from rendered gameplay LOD, even if attractive in closeups.
7. **Deterministic test scenes**: fixed camera and seed, render bare mech, each weapon, each enemy in windup/recover states, both boss phases, 10/20 mixed-unit stress scenes, dark and high-contrast modes.
8. **Actual phone playtest**: examine 30 FPS floor goal on at least representative low/mid device, 60 FPS stretch goal. Do not claim performance from desktop WebGL alone.

## 8. Ownership / merge rules
- ENG owns `js/engine.js`: mesh factories, shader/performance and `initGL` mesh registration.
- MECH owns code patches intended for a future extracted `js/models/mech.js` (or a dedicated subsection of `game.js` integrated by ENG). Avoid rewriting the legacy mech and guns in competing commits.
- ENEMY owns `js/models/enemies.js` proposal/patch and animation state hooks, coordinating closely with AI.
- ENV owns stage `props` definitions and `drawLandmark`; PROD coordinates changes to `getCell` and collisions.
- COM owns weapon hardpoint and actual damage/counterplay hooks; don’t let artist drive damage stats with animation-only changes.
- QA owns a screenshot matrix and phone measurements. All files must work on the existing no-build static host unless change is explicitly approved.

## 9. Don't do these things
- Don't manually call WebGL draw methods from `drawBug()` or `drawMech()`; use existing batch emitters.
- Don't call `makeMesh` in the frame loop or for every enemy instance.
- Don't switch to Three.js because a Blender tutorial says so.
- Don't model every bolt, vent, pipe or leg tooth separately at gameplay resolution.
- Don't replace strong shadows with total black; silhouettes must remain readable.
- Don't create clever custom geometry without a test for consistent normals/winding.
- Don't throw away current working foot IK, projectile muzzle origins, accessibility or save flows.
