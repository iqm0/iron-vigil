# LAST LIGHT — ORIGINAL ART, ENEMY, WEAPON & WORLD BIBLE
Version 1.0 · 15 Nov 2026 · Proposed concepts; NOT implemented. Companion to `../last_light_agent_pack/MASTER_REDESIGN_BRIEF.md`.

## Grounded baseline
Source: supplied screenshot ZIP (`last-light-screenshots/README.txt`, 50 PNGs), and publicly readable repository https://github.com/iqm0/iron-vigil at this review. Current game is portrait, one-thumb, hand-written WebGL2; uses instanced meshes, flat-faced alien forms, procedural feet and IK, one shadow-casting work lamp, ground decals, point lights, no imported models. Current visual cast: yellow biped walker with a 3-barrel cannon and ram plate; stalker, spitter, brood guard, brood mother; pad, burrows, barrel fires, pillars, floodlights, crates, wrecks.

This document proposes a change, not a claim about existing gameplay balance. Inspired by principles of industrial homemade working mechs and rural alien defence seen in *Suits* (Love, Death & Robots S1E4); create original silhouettes and artwork rather than copying models, colours, staging or creature identities from the episode.

## Artistic pillars and rules
1. HUMAN = built, repaired and purposeful. Plate overlap, bolts at plausible locations, massive load-bearing hinges, large actuation, visible cockpit, cable routes; no ornamental spikes.
2. ALIEN = biological, asymmetrical, motivated by a hunting purpose. Shell sections look grown, six legs move with predatory function, abdomen shape tells behaviour. Avoid 'generic sci-fi insect' and unnecessary antennae.
3. STAGE = recognisable agricultural industrial setting, still legible from above. Outpost silhouettes imply a former community; avoid generic crates/isolated road slab and random prop soup.
4. PHONE VIEW = silhouette is king. Test every object at the real in-game pixel size on a 360–412 CSS-pixel-wide display. HUD legibility and combat decals outrank small model detail.
5. COLOUR = functional, not decorative. Old yellow/orange + steel on machines; desaturated charcoal/bone on insects; single pale green biological glow for sacs; danger uses red/orange. Avoid giving every item a neon orb.
6. VALUE = subtle ambient exposure even away from player headlamp. Shadows create fear but never hide which direction the threat is coming from.

## World scale — starting dimensions, not final balancing
World coordinate: Y up; ground XZ; local +Z is forward, matching current `js/game.js`. Suggested scale: approximately 1 unit = 1 metre, for asset proportions only (the game has its own world units). Reclaimer total height ~3.1–3.6 units; hull width ~2.3–2.8; foot span ~2.3. Stalker body length ~1.7 and striking reach ~2.3. Spitter width ~1.4 and abdomen ~0.9 high. Guard footprint ~2.2 × 2.9 and low canopy ~1.4. Mother ~2.0–2.5 times the player footprint, NOT 2.5 times the screen height. Use screen-space previews to tune.

## Player mech — RECLAIMER-01: agricultural salvage walker
**Design story:** local technicians retrofitted an irrigation-maintenance chassis with a mining cannon and an impact ram. The pilot survives in a welded steel cab. There is no perfect symmetrical 'military robot' finish.

**Top-down readable massing:**
- 45% visual area: trapezoid/wedge cabin with reinforced tinted windshield, protective forward brow and two worklamps (one functional, one dead); cabin is the visual centre.
- 30% visual area: broad jointed legs with long flat boots, bright yellow shin sleeves; contact patches broad enough to register in darkness.
- 20% visual area: asymmetrical cannon (right) and shield/ram (left) which define its combat abilities.
- 5%: aerial, exhaust and wear details. Mount details should not add to the headline silhouette.

**Construction:** hull is a low-poly extruded wedge (front +Z broad, rear slightly narrower) with layered armour cheek panels. Cockpit is a custom 5- or 6-sided extruded footprint, dark flat glass and one simplified silhouette of an operator visible through the front on closeups (at gameplay size, use a lit window shape, not a fully modeled human). Hips are cylinders, leg structural beams tapered prisms, piston rods cylinders, shins tapered plates, oversized boots 2-bevelled boxes, ram a 2–3-layer welded wedge with outer ribs, cannon one thick breech with 3 recessed apertures. Rotate only the weapon assembly to targets, not the whole body.

**Must-read from 70–100 px mech height:** cabin, 2 legs, giant cannon, ram. Small text, bolts and cockpit pilot need only show in reference shots; do not rely on them for gameplay recognition.

**Motion:** existing foot placement/`ik2` remains; increase settle on planted foot, hips squat on recoil, barrel assembly recoils 0.1–0.2 world units and returns over 0.16–0.28s (tuning). Shield rams forward visibly as dash begins. Never add constant bouncing at idle. Cannon fire needs a mechanical kick, muzzle flash under 0.1s, one ejection event, bullet impact; do not make the whole screen shake continuously.

**Hardpoints (local offsets, Y-up, forward +Z; initial suggestions):** cannon [-1.1,+0.45,+0.35] (verify current side conventions; swap if necessary), ram [+1.1,+0.45,+0.45], lamp [0,+1.25,+0.55], shoulder support [+.8,+1.1,-.35], back utility [0,+.65,-.85], biological interface [0,+.5,-.6]. Only 1 shoulder support + 1 organ visible; never a Christmas tree of attachments.

**Modular visual states:** bare industrial; reinforced hardware (cable/housing mounted); one living organ with differentiated tissue and crossing tendons; compromised (organic texture/plates migrate to one mechanical subsystem). Tie every mutation to a mechanical drawback. Replace random orbs/spikes with few designed growths. The player should still recognise the same machine throughout.

## Enemy lineup — each silhouette = a different decision
| Unit | Silhouette / visual construction | Behaviour / tell | Counterplay | Art/rig complexity |
|---|---|---|---|---|
| STALKER / 'Hookrunner' | Narrow dark dart body; elongated offset forelimb hooks opened like calipers; 6 leg spikes grouped into 3 broad visible pairs; pale mandibular tip | Skitters on diagonal approach; plants rear feet, raises TWO hooks for 0.45–0.65s, leaps along committed lane | Sidestep perpendicular or ram while vulnerable; post-lunge recovery | 3 rigid core shells + 6 x 2-segment legs + 2 hook arms |
| SPITTER / 'Acid Carrier' | Near-circular swollen pale-green thoracic bladder over a low black 6-legged ring; short nozzle points at target; no large scythes | Stops, bladder inflates and tilts, enemy glows gradually (not a sudden projectile); acid telegraph appears on ground | Reposition before launch; high pressure if protected by guards | 1 custom bladder + 1 torso ring + 6 simple legs + 1 nozzle |
| BROOD GUARD / 'Bulwark' | Wide pentagonal forward shield, squat beetle body, short splayed legs mostly tucked inside hull; two obvious side horns; vulnerable pale membrane behind | Faces player and commits to a short rush or plants armour to shield spitter | Flank/back attack, interrupt by precise ram; tell is shield drop + red joint glow | 1 iconic custom wedge shield + 3 armor plates + 6 short legs |
| BROOD MOTHER / 'Cathedral' | Unmistakable long silhouette: narrow armoured head + broad ribbed thorax + off-centre segmented broodsac, 2 huge feeding scythes; avoid crown-of-spikes silhouette | Phase 1: charge + controlled acid volley; Phase 2: sac rupture/offspring calls + slam with safe angles. Distinct first- and second-phase outline | Move out of lanes, target exposed sac after major attack, exploit recovery windows | 5-7 core shells + 6 strong legs + 2 large articulated limbs + one sac with pulsing rings |

**Current design critiques tied to supplied images:** existing stalker variations are too visually similar; spitter's bright ball already signals ranged role but reads like a glowing item rather than organ; guard and boss share much of their head/leg vocabulary; brood mother is busy and sometimes hard to distinguish at gameplay size. Turn these into meaningful morphological differences, NOT more tiny decorative geometry.

**Rule:** add no fifth enemy type until a playtest can identify all three standard types at 25–60px tall without colour. If adding one later, choose a **Burrower** which attacks from behind with a visible soil swell and an interruptible emerging phase, not another faster stalker.

## Weapons — readable physical hardpoints, never generic particle emitters
| Weapon | Physical mesh | Action feedback | Actual role and limits |
|---|---|---|---|
| Main cannon | One massive angular breech, thick tri-bore housing / barrel shroud and exposed recoil rail, brass ejector | Slide 0.15 units back, orange flash then brass case tumble, hit creates mechanical crumple | Main line attack; piercing vs breaching shells exclusive |
| Ram / crusher | Tall triangular split steel impact plate with front bumper and hydraulic rails, attached to left arm | Plate locks forward, sparks and a short ground scuff, recoil on obstacle | Active charge, stagger, tactical counter |
| Shoulder mortar | 2-cell chunky drum atop shoulder, short angled tubes and recoil cradle | Barrel elevation, amber pre-impact ring, deliberate 'thump', then debris | Slow high-area attack vs packs, not continuous DPS beam |
| Arc coil | Two thick opposing electrodes built into rear-frame cage, industrial capacitor boxes | Brief electrical crackle + one or two visible arcs, lights dim momentarily | Close-range crowd disruption; limited reach and chains |
| Spitter graft | Ribbed living sac bolted into a back support, hose reaches a biological nozzle beside cannon | Sac visibly contracts before firing; acid is clearly enemy/ally distinguished by palette | Organic side-weapon traded for slower heat recovery or reduced ram mobility |
| Lamp focus | Protected rectangular lens and articulated shield, not floating orb | Cone narrows, beam brightens, joints visibly turn | Weak-spot revelation or type-specific interference, NOT passive AoE damage |

**One weapon = one visible affordance**. Do not bolt all weapons on at once. Use explicit hardpoint occupancy and exclusivity; show rarity in UI not as excessive coloured glows.

## Environment — FACILITY 09: rural relay & agricultural repair site
**Current:** screenshot shows repeat concrete slab, mostly empty black beyond the torch, scattered props and isolated fire barrels; it has no clear location identity. A single featureless pad also makes repeated nights visually interchangeable.

**Main hero layout** (start with ~36 × 50 world units; test after camera fit):
```
  FIELD / BURROW EDGE         FIELD / BURROW EDGE
  //////// broken fence / cut harvest rows ////////

     [HARVESTER]       [SILO SHADOW]
        (cover)          (background)
                  . . . swarm lane . . .
      [CRANE]                           [BURROW]

                 [BEACON / RELAY]
                 [WORKSHOP / SAFE]
              PLAYER START / REPAIR BAY

    [POWER TRANSFORMER]       [PUMP STATION]
       hazard/cover             lamp/objective
```

**High-priority bespoke meshes:** relay mast with red beacon, agricultural harvester (clear curved grain blade), repair hangar/workshop as non-traversable silhouette on outside of active zone, irrigation pump, knee-high fencing, cable troughs, floodlight poles, buried cable access pits, broken down tractor, shallow furrows, broken sign. Reuse crates/ruins only if they have purpose; remove isolated concrete pillars without believable building context. All playable collision shapes must be visually trustworthy.

**Map composition:** one clear central landmark; 3 distinct outer landmark groupings, 2–3 combat lanes, 1 obvious boundary, 2 intentional points of cover. Props need visual rhythm: one hero setpiece per screenful, minor repeats near structures, outer farmland can fade into fog. Avoid maze or unplayable collision traps with one-thumb movement.

**Rendering:** keep existing baked ground material for pad, create 2–3 additional procedural material masks for soil, crop rows and oil/metal. Ground need not be fully 3D; furrows can be dark/shallow colour/normal bands, with a few raised 3D meshes near the player. Maintain an ambient sky/rim fill for silhouettes. The player lamp provides highlights and danger reveal, NOT basic ability to see enemies.

## Stage arc — replace five near-identical boss cycles with missions
All stages reuse 65–80% of the base kit as a design goal, not a measured asset ratio. Each changes one condition; preserve 1-thumb gameplay, don't build an open world.

| Night | Location & colour story | Main mechanic / decision | Featured enemies | Signature scene | Boss decision |
|---|---|---|---|---|---|
| 1 — Relay Blackout | Workshop concrete, dusty warm tungsten, distant field edge | Protect the relay beacon; learn ram interrupt; choose cannon branch | Stalker, intro spitter | A floodlight flashes before first major pack | End on a unique elite guard; save mother for later, or short teaser |
| 2 — Harvest Rows | Soil furrows, wrecked harvester, sodium lamp at edge | Cover creates safer movement paths but blocks long shooting lines | Stalker, spitter, more guard | Harvest machine blade becomes memorable landmark | Elite spitter guarded by bulwark |
| 3 — Pump Yard | Water channels, machinery, colder moonlight | Controlled puddle zones alter positioning; narrow crossings create tactical tension | Spitter, guard, stalker | Power surge briefly exposes hidden burrow entrances | Distinct armoured elite guard |
| 4 — Broken Perimeter | Fences, ruined machines, smoky dawn-red ambience | Multiple known burrows and timed crisis; use ram to disrupt breaches | Mixed roster | Perimeter fence collapses; lit workshop still visible far away | Brood Mother phase 1 / retreat (scripted, only if compelling) |
| 5 — Nursery Breach | Infested agricultural trench, living growth on machines | Biological mutation reaches climax, new arena hazard but same controls | All plus boss spawns | Mother emerges from soil beneath relay field | Full two-phase Mother finale, mutation shedding consequence |

**Minimum production:** stage 1 first. Only build stages 2–5 if stage 1 wins a player test. Initial delivery target: a 3–4 min playable vertical slice, not five polished nights.

## Gameplay/readability acceptance tests
- 3/3 common enemies identifiable without their colour (silhouette stills at 35–55px maximum dimension).
- The player mech and its equipped gun/ram recognisable at gameplay zoom and under ambient-only lighting.
- Enemy anticipation: lunge hook pose, inflated acid sac, shield-drop guard, Mother sac/torso movement communicated BEFORE a red decal appears.
- No more than one large weapon support + one organ mutation at a time; player's silhouette never disappears under parts.
- Major scenery remains locatable after moving one screen, and the player understands the site they are defending.
- Every asset has a purpose tied to a player decision or legible worldbuilding function. If a prop is neither, cut it.
