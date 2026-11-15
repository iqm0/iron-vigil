# Last Light: the single-night slice

> **Superseded.** After a recording of this slice was reviewed, the game was cut back to one encounter and rebuilt round a new walker and a single enemy. See [`DIRECTION.md`](DIRECTION.md). This file describes the build on the `redesign-slice` branch.

What was built from the redesign brief ([`redesign-pack/`](redesign-pack/MASTER_REDESIGN_BRIEF.md)) and the visual kit ([`visual-kit/`](visual-kit/ART_AND_WORLD_BIBLE.md)), what was changed or left out and why, and what is still unproven.

**Status: implemented and machine-checked. Not playtested, not run on a phone.** Everything below marked *checked* was checked in headless Chromium by scripted tests, bots, or by looking at frames. Nothing here is evidence about how it feels.

The build before the redesign is on the branch `baseline-pre-redesign`.

## 1. Audit: the proposals against the code

**Feasible as proposed, and done**

| Proposal | Where | Checked by |
|---|---|---|
| Ten cards in five exclusive pairs, three hardware slots and one organ | `CARDS`, `nextPair`, `openChoice`, `choose` in `js/game.js` | `tests/checks.js` |
| Salvage opens a two-option panel; no auto-fit, no rarities, no marks | `#choose` in `index.html` | frames at 360 and 412 wide; axe-core, no violations |
| Each card states what changes, best against, cost | `does` / `best` / `cost` on every card | read on the panel at 360 px |
| No global damage multiplier | no card touches `pow`; fire-rate, cooldown and heal-on-kill parts removed | check "no card multiplies base power" |
| Growth only from an organ; steel does not fall off | `g.gr` driven by an installed organ, `BIO = { molt, graft }` | checks "hardware alone grows nothing", "an organ does" |
| Dash as an interrupt: 2.4 s cooldown, safe only during the burst | `startDash`, `baseStats.dashCd` | checks |
| Ram staggers a guard and interrupts its wind-up | dash block in `update` | check |
| Ram closes a burrow for a while | `b.shut = 18` | checks |
| Guard: armoured front, open flank and back, stagger after a charge | `hurtBug`, `e.stag` | checks (35 / 100 / 160 / 100 with penetrators) |
| Mother in two phases with a visible change | `e.ph`, `drawBug` | checks, frames |
| One bounded yard with landmarks, replacing the hashed pad | `YARD`, `PROPS`, `SITES`, `drawYard` | frames |
| Deterministic seed | `setSeed`, `?seed=` | check |
| Authored props with collision from the same data (guide §5) | `PROPS` is both what is drawn and what `pushOut` collides with | bot runs |
| One custom convex mesh registered once (guide §2) | `scuteMesh` → `MESH.scute` in `js/engine.js` | frames |
| Instance counts in the frame counter (ENG-02) | `STATS` in `js/engine.js`, shown with `?fps` | stress script: about 280 instances at the start, 700 to 1000 at the peak of a staged fight with seventeen bugs and the mother, in ten batches |

**Adopted with a correction**

| Proposal | What was done instead | Why |
|---|---|---|
| "2-of-3 selection" (brief §1) and "2 curated options" (brief §3) | Two options | The brief's own systemic fix says two unless three is tested at 360 px. Two fit with room; three would need smaller text. |
| Auto-pickup opens the panel | The crate is not drawn toward you; you walk onto it | So the stop comes when the player chooses, not mid-dodge. Repair cells are still drawn in. |
| Night one ends on an elite guard, mother later (art bible, stage table) | Night one ends on the two-phase mother | The master brief's Gate 2 asks for her in the first slice, and there is only one night. Noted as a conflict between the two documents. |
| Start at a central workshop with entries all round (bible map, guide `STAGES` sample) | Garage and silo on the north edge, burrows on the west, east and south | The camera looks north from above. A building's lit face only shows if it faces south, and a tall thing on the north edge hides nothing behind it. Entry points are six fixed sites, not zones. |
| Wedge cab from an extruded mesh, pilot as "a lit window shape" | Box-built cab with an open roll cage and a modelled helmet | The brief asks for the pilot "visibly inside"; from 54° above a roofed cab hides them. Kept as the smaller change; a wedge mesh is still open (see backlog). |
| Ambient fill so the lamp is "not the basic ability to see enemies" | Darkness kept; fog pushed out a little; landmarks carry their own lights | The owner asked earlier for dark with strong contrast. Whether bugs outside the beam read well enough on a phone is unverified. The *Darkness brightness* setting still lifts it. |
| Lamp Focus as weak-point reveal | Bugs in the tight beam take 40% more from the cannon | Same intent (a tool for one dangerous target, no passive area damage) with no new system. |
| Spitter Graft cost: slower heat recovery or less ram mobility (bible) | Slower acceleration and turning (brief) | There is no heat system to tax. |
| Five species names (Hookrunner, Acid Carrier, Bulwark, Cathedral) | Outlines reworked toward those roles; player-facing names unchanged | Names are not on screen during play. |
| `extrudedXZ` sample code | `scuteMesh`, built with the engine's existing `facet` helper | The sample hand-rolls winding; `facet` already orients faces outward for convex shapes. Same output contract. |
| Separate agents on branches | One integrator, patches applied in sequence | The brief itself says `js/game.js` must not be edited concurrently. It is one 160 kB file; parallel agents would have collided on every patch. |

**Not adopted**

| Proposal | Why not |
|---|---|
| Gate 0 phone baseline: FPS and a filmed session | No phone here. Open. |
| Gate 3 playtests, QA-02, the "three new players can name the site" tests | Need people. Sheet below. |
| Extract `js/models/*.js` | No build step and one hot file; splitting it mid-redesign risked more than it bought. Worth doing next, when nothing else is moving. |
| Harvester, pump station, crane, cable troughs | The slice has garage, gantry, relay, silo and auger, fuel trailer, dead walker, floodlights, fence, crops. More props before a playtest is polish before proof. |
| Nights two to five, stage table | Brief: single night only until Gate 3 passes. `NIGHTS` is one entry. |
| Volatile Ichor, second organ tier, Burrower enemy | Marked post-slice in the brief. |
| `tellProgress` as a new shared field (guide §4) | The rigs already read the same state the decals do (`e.state`, `e.st`, `e.rear`). No rename without a need. |

## 2. Backlog

Ranked within each group. File is `js/game.js` unless noted.

**CUT (done):** Hot Loads, Belt Feeder, Coolant Lines, Field Welder's heal-on-kill, Sentry Drone, Brood Heart, Titan Tendons, Reaper Limbs, Volatile Ichor, Searing Lamp's burn aura; rarities and marks; the found-parts collection; four of five nights and the night selector; growth stages three to six; the endless hashed pad, pillars and rubble; stalker palette variants and antennae; the mother's crown of spikes.

**CUT (code still present, unreachable):** the ally system behind Brood Heart (`raise`, `updAlly`), the stride stomp, a few unused stat keys and icons. Harmless; remove in the file split.

**KEEP:** one-thumb control, auto-aim cannon on its own pivot, planted-foot gait and IK, the lamp as the only shadow light, lunge lanes and acid rings, the attacker limit, all accessibility settings, `advanceTime` and `render_game_to_text`.

**REWORK (done):** dash; brood guard; brood mother; mortar (dead zone inside four paces, three-second cadence); arc coil (short reach, four jumps, breaks a spitter's wind-up); piercing and breaching as an exclusive pair; reactive plate; lamp; both organs; walker silhouette; guard and mother outlines; end screen; pause list.

**ADD (done):** choice panel; six burrow sites with warning lamps; relay beacon that shows the state of the night; floodlights that sag for a swarm and nearly fail for the mother; yard klaxon; seed; `tests/`.

**OPEN, in order:**
1. Phone run: does it start, what frame rate, do the tells sit clear of the thumb. (QA)
2. First playtests with the sheet below. (QA)
3. Difficulty, from those. Bots win about half their runs; that says little about people.
4. Stalker outline. It was only sharpened (longer pale hooks, one accent colour). It is still small and thin at 40 px. (drawBug)
5. Wedge cab mesh, if the cab still reads as boxes on a phone. (`js/engine.js`, `drawMech`)
6. Guard planting itself to shield a spitter (bible). Would be a new behaviour; only if the guard proves too simple.
7. Split `js/game.js` into data, systems and models, and delete the unreachable code.
8. Audio pass by ear: nobody has listened to the klaxon, the ricochet, or the quieter cannon.

## 3. The night, minute by minute

Game time runs at nine tenths of clock time; these are clock times.

| Clock | Burrows open | Bugs alive (cap) | Event | What it teaches |
|---|---|---|---|---|
| 0:00 | 0 → 1 (west) | 2 | Klaxon; first breach; lone stalkers | Where they come from; the cannon; the lunge lane |
| 0:10 | 2 | 2 | | |
| 0:20 | 2 | 4 → | First salvage on the first kill after 0:18; packs | A choice |
| 0:30 | 3 | 5 | First swarm call; floodlights sag | Red edge cue |
| 1:00 | 3 | 7 | Second salvage; spitters | Rings; moving on purpose |
| 1:10 | 4 | 8 | | |
| 1:25 | 4 | 7 while it lives | First guard; drops the organ | Armour; ram to stagger; a risky option |
| 1:55 | 5 | 10 | Third salvage | The build is set |
| 2:30 | 6 | 7 while it lives | Second guard | Use what you chose |
| 2:35 | 6 | 13 | Last push | |
| 3:00 | 6 | 4 | Brood mother; lights nearly out; beacon red | Phase one: dodge the charge, shoot her while she recovers. Phase two: go in |

Every 36 seconds has a lull of seven from the second cycle on. No interval longer than twenty seconds is without something arriving, except the lulls.

## 4. Interfaces

```js
// a card (data only; fit is the one place its numbers live)
{ id, grp: 'cannon'|'support'|'dash'|'utility'|'organ', n, does, best, cost, f: stats => {} }

// the yard: what is drawn is what collides
YARD  = { x0, x1, z0, z1 }                       // walkable bounds; the camera stops inside them
PROPS = [{ k, x, z, r, rot, v }]                 // k '' = collider only
SITES = [[x, z]]                                 // burrow sites; state lives in g.burrows[i]
g.burrows[i] = { x, z, on, ever, shut, pulse }   // shut > 0: caved in, counting down

// a bug, the fields the rig and the rules share
e.state  'chase' | 'tell' | 'lunge' | 'rec'      // e.st counts the state down
e.stag   > 0: staggered, open, cannon prefers it
e.ph     1 | 2 (mother)
e.atk    'charge' | 'slam' | 'volley' | 'birth' (mother)
```

Shots leave from `GUNX`, `GUNZ`, `GUNL`, the same constants the cannon is drawn with, so the shell and the barrel agree without reading back from the renderer.

## 5. Evidence

- `node tests/checks.js`: 25 of 25 pass.
- `node tests/shots.js`: 34 frames, no page errors.
- axe-core on title, both choice panels, pause, settings and end screen at 360×780: no violations.
- Bots, latest batch (see `tests/README.md` for what they are): eight runs, two bots × two seeds × both sides of every pair. Six finished the night. Runs lasted 3:10 to 3:40 on the clock; the mother took 29 to 60 seconds, reaching her second phase after 12 to 25; guards died in 8 to 17 seconds. The two losses were at 1:30 and 2:40, both before she arrived. Bots took 24 to 45 hits a run, far more than a person should, because they do not step off lanes well. An idle bot is wrecked in about 1:15. Earlier batches at harder settings won three to four of eight; the settings were eased twice on that evidence alone, which is weak evidence.
- The pack's `CONCEPT_MESH_VIEWER.html` was opened in a WebGL2-capable headless browser: all eight models render with no errors ([`visual-kit/concept_viewer_rendered.png`](visual-kit/concept_viewer_rendered.png)). Its blockouts were used for their role ideas (shield in front and soft back for the guard, a dominant bladder, a long two-part mother), not as geometry: the game's existing faceted rigs are further along.

## 6. The brief's definition of done

| # | Criterion | State |
|---|---|---|
| 1 | Testers can say what they protect within a minute | Built for (garage, 09 plate, relay beacon, fence). **Needs people.** |
| 2 | Three enemy classes recognised by outline | Guard and spitter are distinct in frames; stalker is the weakest. **Needs people.** |
| 3 | Players can explain the ram and show one deliberate interruption | The rule exists and is checked. **Needs people.** |
| 4 | Two choices per run that change behaviour | Three hardware choices and one organ every run. Checked that they fire; **whether they feel different needs people.** |
| 5 | Players can state the organ's advantage and cost before accepting | Both are on the card; both are real (checked). **Needs people.** |
| 6 | Two contrasting builds complete the slice | Bots have finished it with penetrator + mortar + lamp, mortar + ram charger + lamp or plate, and breach + coil + plate + molt. Bots only. |
| 7 | Boss has readable openings; deaths feel fair | Phases and stagger windows exist. **Needs people.** |
| 8 | Full run works on a touch device, performance measured | **Not done.** |
| 9 | No regression in settings, controls, pause, reduced motion, high contrast | Settings screen and pause audited; the high-contrast and reduced-flash code paths were kept. Not re-tested by hand on a device. |
| 10 | A tester wants to replay for the decisions | **Needs people.** |

## 7. First playtest sheet

Five to eight people who have not seen it, on their own phones, portrait. Say nothing first. One run, then a second if they ask.

Write down, per person:
1. Phone and browser. Does it start? Roughly how smooth (add `?fps` to the address for the counter)?
2. After one minute, ask: what are you protecting? Where do they come from?
3. Time of the first salvage pick. Did they read the cards? Which did they take, and why, in their words?
4. Did they ram anything on purpose? A guard? A burrow? Could they say what the warning lamps mean?
5. The organ: took it or left it? Can they say what it cost them?
6. Each death: what killed them, and did they think it was fair?
7. Show a still of the three bugs in grey: can they name what each one does?
8. Did the dash button or their thumb ever cover something they needed to see?
9. Anything they tried to do that the game did not let them.
10. Unprompted: do they start another run?

Cut whatever confuses people before adding anything.
