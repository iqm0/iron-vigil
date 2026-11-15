# LAST LIGHT — Procedural 3D Visual Development Kit

This supplements the existing `last_light_agent_pack.zip` redesign directive. **Nothing here has been merged into the game.** These are original proposed art concepts and source-aware execution instructions. The standalone asset lab is an experimental WebGL2 preview, not a game build or tested production renderer.

## Files
- `ART_AND_WORLD_BIBLE.md` — Mech, 3 enemy classes, Brood Mother, guns, environment, night-by-night design, silhouette tests.
- `WEBGL2_IMPLEMENTATION_GUIDE.md` — Actual engine structure and functions, custom geometry generator example, model hierarchy, level architecture, WebGL2/mobile performance strategies.
- `AGENT_EXECUTION_TICKETS.md` — Agent tasks, source ownership, acceptance tests and merge order.
- `CONCEPT_MESH_VIEWER.html` — Single-file procedural WebGL2 model viewer showing interactive first-pass blockouts for player, enemies, guns and relay environment. Open in a modern WebGL2-capable browser; use dropdown, drag, scroll, camera views and silhouette mode. No dependencies or internet requests. The JavaScript passes `node --check`; 3D rendering could not be tested inside this container because its headless browser reports WebGL2 unavailable. Test in a real browser before using as a visual baseline.

## Important source constraints
The current repo is a static, no-build, vanilla WebGL2 project. Its render pipeline is `meshBuilder → makeMesh → draw/seg → renderScene`, with procedural IK. These files intentionally recommend keeping that architecture rather than requiring Blender/GLTF/Three.js, though authoring models in Blender may be revisited later as a separate decision.

## Handoff order
1. Director approves silhouette sheets, 1 mission map and visible hardpoints.
2. ENG implements new convex mesh factories in `js/engine.js` behind an option/flag; no runtime generation.
3. MECH and ENEMY make one hero asset each at playable scale, preserving existing rigs.
4. COM integrates physical poses with actual hits, muzzle, attack state.
5. ENV builds one compact designed relay yard; QA tests lighting and touch in phone browser.
6. QA provides performance/readability evidence. Only then expand to nights 2–5.
