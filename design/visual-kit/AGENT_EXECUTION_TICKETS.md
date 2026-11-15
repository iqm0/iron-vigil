# LAST LIGHT — AGENT EXECUTION TICKETS (VISUAL PRODUCTION)
Designed to feed into the prior multi-agent redesign plan. Read ART_AND_WORLD_BIBLE.md and WEBGL2_IMPLEMENTATION_GUIDE.md first. Don't claim tasks have been implemented unless code and captures prove it.

## Art Director: ART-01 / acceptance
Create original front/side/top three-view silhouette sheet for Reclaimer, Hookrunner, Acid Carrier, Bulwark and Cathedral. Run at 40, 70 and 100 pixel maximum height. Include part labels, functional pivot and colour/brightness thumbnails. Reject shapes resembling licensed Suits models. **Done when** director approves 5 distinguishable greyscale silhouettes and each shape communicates combat role.

## Technical Artist — Mech: MECH-01/02/03
1) **MECH-01** Replace current torso silhouette with trapezoid cabin; keep current `HIP`, walking IK and collision footprint initially. Document exact local coordinate pivots and guns. Screenshot bare machine at top/3-4/back, 100px high.
2) **MECH-02** Rebuild cannon and ram as physical mechanisms with recoil/breech/hydraulics. Require visual muzzle position to match actual shot. Compare dash on/off state frames. Avoid new action buttons.
3) **MECH-03** Build shoulder mount and one living mutation socket. Work with systems engineer to show one organ and its drawback. Capture bare/hardware/mutant states with silhouette overlay.
Dependencies: ENG-01 mesh registration, COM-01 animation state; tests on mobile default brightness.

## Technical Artist — Enemies: CREATURE-01/02/03
1) **CREATURE-01** Distinguish three base species in a 50px greyscale sheet; build replacement rigid geometry using existing `seg/ik2` and 1–3 custom meshes.
2) **CREATURE-02** Expose `tellProgress` to rig; implement scythes raised, organ inflation, shield-down telegraphs; coordinate with AI to keep same actual timing and damage windows.
3) **CREATURE-03** Two-part Brood Mother silhouette and proper phase transform; no new boss mechanics without combat approval.
Done when QA can identify class in muted/dark test and survive a telegraphed attack by reacting to animation.

## Environment artist: ENV-01/02/03
1) **ENV-01** Layout top-down 36×50 blockout around relay, safe start, 3 outside landmarks and 2 useful cover choices. Include collision bounds and enemy entry edges.
2) **ENV-02** Mesh kit: silo, repair bay, harvester, beacon, pump, fences, floodlight, broken machinery. Reuse and reorient common primitive kits, one bespoke hero prop per stage.
3) **ENV-03** Soil/furrow/asphalt bake plus ambient, rim and spotlight tests, respecting default accessibility overrides.
Done when three new players can name and locate the site/objective after one minute, combat remains readable outside the beam, props don't trap the walker.

## WebGL engineer: ENG-01/02/03
1) **ENG-01** Write `extrudedXZ` and (only if justified) one ring-profile/loft factory; register `MESH.reclaimerCab`, `guardShield`, `spitterBladder`, `queenRib`, `industrialBlade` at GL init once; verify normals, culling, context restore.
2) **ENG-02** Design rigid part/pose API that does NOT disrupt current `draw()`, `seg()`, `ik2()` and `MAXI`; add per-type instance counts to FPS debug and shadow-pass budgets.
3) **ENG-03** Define two authored stage layouts separate from hashed dressing. Define simple stage boundary collision and spawn masks. Preserve existing camera/pad until stage switch is opt-in.
Done when all old states still load, build remains no-library, and a mixed-enemy test runs without WebGL errors or large unbounded allocations.

## Combat/gameplay engineer: COM-ART-01
Convert physical weapon poses to gameplay signals: gun recoil, ram impact, guard weak point, spitter windup, mutation socket. Ensure damage and hitboxes reference game state not incidental visual mesh. Route actual muzzle world coordinates through existing `xf`. Done when hit visuals and bullets match and players can predict attack effect from rig.

## Producer + QA: QA-ART-01
Screenshot matrix: `[mech bare, cannon fire, ram impact, support fitted, organ fitted] × [ambient only, default dark, high contrast]`; `[stalker, spitter, guard, mother phase1/phase2] × [idle, windup, attack, recover]`; stage map full capture; 10/20 enemy stress. Record phone, browser, frame-time median + low-percentile, draw calls/instance counts, input response; capture sources on each ticket. Stop adding meshes if no measured value.

## Merge sequence
A. ENG-01 mesh factories → B. MECH-01 silhouette → C. CREATURE-01 role shapes → D. ENV-01 greybox → E. COM-ART-01 weapon sync → F. CREATURE-02 tells → G. ENV-03 lighting → H. QA-ART-01 phone audit. No concurrent direct changes to `game.js` without integrator ownership. Do not develop later stages until stage 1 passes.
