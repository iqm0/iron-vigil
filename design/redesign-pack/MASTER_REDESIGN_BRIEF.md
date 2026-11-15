# LAST LIGHT — REDESIGN DIRECTIVE & MULTI-AGENT PRODUCTION PLAN
**Version:** 1.0 | **Date:** 15 November 2026 | **Status:** Design proposal, not approved implementation

## 0. The mandate
Conduct a ruthless product/game-design redesign of Last Light. Improve the *experience*, not merely the quantity of content. Remove weak, redundant, passive and thematically incoherent features. Preserve the strengths of the current one-thumb 3D survivors prototype. Use the underlying principles of *Suits* (Love, Death & Robots, S1E4)—homemade industrial machines, vulnerable human pilots, recognisable places worth defending, disproportionate insectoid threats and a desperate last stand—but establish original machine/creature shapes and original world design; do not reproduce specific copyrighted art.

**Design thesis:** A battered, human-piloted utility walker defends an isolated agricultural power outpost at night. It salvages machines to stay alive and can deliberately graft living alien organs onto itself for dangerous power. The best runs feel like a desperate series of choices, not five minutes of passive DPS inflation.

**Non-negotiables**
- Portrait mobile, one-thumb movement with one contextual dash/ram action; automatic main weapon fire remains.
- Procedural WebGL2 geometry, low overhead; no unapproved imported models, new framework, backend, multiplayer or open world.
- Fast restart, short readable encounters, credible industrial weight, accessibility options retained.
- Reuse and refactor existing systems before introducing another content category.
- Avoid presenting this design as playtested: recommendations come from the supplied 50 captures, supplied README and public source/README; there has not been hands-on real-phone testing by this reviewer.

**Sources and baseline:** `https://github.com/iqm0/iron-vigil` (`README.md`, `js/game.js`, `js/engine.js`) and supplied screenshot ZIP. Current public README describes five 5-minute nights plus a brood mother, 19 parts, a 1.5s base dash cooldown, 6 stages of alien overgrowth tied to *all* part acquisitions, and procedural rendering. These are moving-source observations, re-check at implementation.

## 1. Diagnosed defects (CUT / CHANGE / ADD)
| Area | Current diagnosis | CUT | CHANGE | ADD | Priority |
|---|---|---|---|---|---|
| Core fantasy | Unclear whom/what walker defends | Anonymous endless concrete pad | Make isolated agricultural relay/farm repair-yard legible | Outpost beacon, barn/workshop silhouette, damaged fencing and warning systems | P0 |
| Core action | Main gun auto-fires; move + dash are most decisions | Any third full-time action button | Make dash a situational interrupt, not invincible spam | Weak-point/target-priority cues and ram-to-close-burrow interaction | P0 |
| Reward model | Automatically picked-up random parts dictate build | Automatic fitting of every roll | Salvage triggers a short 2-of-3 selection | Hardware vs biological branch, exclusive variants, limited slots | P0 |
| Power escalation | Passive multipliers, many secondary autocannons | Redundant DPS and healing snowball | Upgrades alter HOW attacks behave and HOW player moves | Trade-offs, categories, clear combination rules | P0 |
| Alien growth | Six growth stages count all parts, no cost | Cosmetic stage gating by hardware pickups | Growth only from living alien modifications | Small 0–3 contamination meter; visible mechanical effects, drawbacks | P0 |
| Pacing | Five-minute identical-stage loop, same boss per night | Repeating identical boss five times | Build ~3–4 minute slice for first test; tune later | Short arc: warning, first escalation, choice, crisis, boss | P0 |
| Combat readability | Thin near-black figures, overlaid warnings, busy build | Unbounded simultaneous effects | Prioritise outline/contrast/telegraph hierarchy | Threat-specific audio and colour+shape cues | P0 |
| Mech | Looks like small boxy wheeled/drone robot at gameplay scale | Random top-mounted gadgets/ball clusters | Heavy cabin, shoulders, hydraulic legs, protective ram, readable firing limb | Pilot silhouette, asymmetric repairs, purposeful hardpoints | P0 |
| Enemy design | Stalkers highly similar despite variation; boss visually busy | Cosmetic random palette variants as content | Unique attack-role silhouette for each species | Optional burrower behaviour through existing holes, distinct boss phases | P1 |
| Environment | Endless generic concrete with props like green crates | Arbitrary rubble/identical repeating tiles | Bounded memorable arena with lanes and meaningful cover | Repair yard, grain-handling structure, broken light circuit, field edge | P0 |
| Camera | Small hero amidst big dark areas, telegraphs compete | Excessive emptiness; gratuitous camera shakes | Mobile-first camera zoom and exposure | Test phone-size captures and threat markers | P0 |
| HUD | Elegant minimalism but no clarity on parts, risks | Unnecessary text and end-screen icon noise | Put contextual information near action | Threat alerts, choice cards, organ risk, clear dash state | P0 |
| Audio | Procedural effects; no verified phone listening | Constant undifferentiated noise | Strong machine/alien/audio priority layers | Directional warning cues, alarm and mechanical struggle | P1 |
| Tech | Mostly hand-written game.js; no real mobile validation | Engine rewrite or heavy post-processing | Separate data from systems as touched, avoid enormous merge conflicts | Phone benchmark, deterministic seed/test harness, screenshot regression | P0 |

## 2. Desired first-run experience
**00:00–00:20:** Start beside illuminated relay/hangar, hear a failing alarm, see a trapped pilot/protective structure and understand where the threat comes from. The walker appears *heavy*. First enemy is isolated and readable. Cannon fires with visible recoil and enemy reaction.

**00:20–01:00:** First cluster and clear lunge warning. Ram interrupts an enemy or closes an active burrow. One salvage choice between differentiated hardware systems; no hidden auto-upgrade. Teach one idea, then let the player use it.

**01:00–02:00:** New enemy threatens the player's preferred pattern (spitter forces movement; guard demands flank/interrupt). Outpost lighting changes during a wave but the ground remains legible. Introduce a risky alien organ as an *option*.

**02:00–03:00:** Decisions compound: a penetration build handles lines, a mortar build handles groups, a ram build exploits openings. A brief lull frames the next risk. Avoid merely raising raw HP.

**~03:00–04:00:** Brood Mother arrives with two clearly distinct phases, an objective-linked event, and a readable counterplay window. It dies, living technology visually sheds and leaves hardware worn; outpost is visibly safer/damaged according to play. The time target is a *prototype hypothesis*, not a final commitment.

**Player verbs:** MOVE, RAM, CHOOSE, ADAPT. Any new verb must earn its screen-space and mental load.

## 3. Upgrade audit — all 19 current parts
**Audit principle:** A part earns a slot only if it (a) enables an identifiable playstyle, (b) creates a visible, legible event, (c) interacts with a counterable threat, and (d) cannot be replaced with the same effect plus a larger number. `KEEP` means preserve the design intent, not necessarily the exact stat.

| Existing part | Decision | Why / proposed replacement |
|---|---|---|
| Hot Loads | **CUT from run drops** | Flat +35% damage per mark; makes every weapon uniformly better and compounds all auto systems. Balance damage by baseline or physical cannon variant instead. |
| Belt Feeder | **CUT as generic multiplier** | +30% firing speed per mark is another uninteresting auto-DPS ramp. Optional later **Overdrive Feed**: bursts then visible heat/recovery; not pure haste. |
| Coolant Lines | **CUT from loot pool** | Pure dash-cooldown reduction encourages spam; dash already has a ~1.5s base cooldown. Tune baseline dash instead. |
| Field Welder | **REWORK / conditional** | Every kill heals means a strong build becomes harder to kill. Replace with capped recovery from guard armour, repair cells or a situational heavy takedown. No unlimited kill-to-heal loop. |
| Shoulder Mortar | **KEEP / REWORK** | Distinct group-control weapon. Make shell landing and area visible; give a deliberate cadence and a defensive weakness at point-blank range. Cap at one meaningful enhancement rather than 3 duplicate shell counts. |
| Arc Coil | **KEEP / REWORK** | Distinct close-chain role. Short range and limited arcs; optional brief spitter interrupt; no omnidirectional screen clear. Countered by dispersed threats. |
| Sentry Drone | **CUT** | Extra independent auto-fire dilutes the single industrial walker fantasy, creates VFX clutter and requires little judgement. Revisit only if a new playstyle demonstrably needs it. |
| Afterburner | **MERGE into dash branch** | Fire trail is readable but passive after using an already-powerful dash. Choose against Ram Charger as an exclusive dash specialisation. |
| Shock Plating | **KEEP / REWORK** | Strong visible defensive identity. Breakable frontal armour/one saved hit with unmistakable cooldown and vulnerability elsewhere; limit synergies. |
| Piercing Rounds | **KEEP as weapon branch** | Give the cannon identity against lines/armour. Remove infinite penetration; exclusive with explosive shells. |
| Breaching Rounds | **KEEP as weapon branch** | An alternative to Piercing Rounds for clustered enemies; remove hidden every-fourth-shot bookkeeping where possible; use clear burst pattern/visible shells. |
| Volatile Ichor | **REWORK as mutation (P1)** | Interesting crowd-chain fantasy, but chain reactions may trivialise mobs. Make it a visible organic choice with low, constrained trigger rate/radius and a drawback. |
| Ram Charger | **KEEP / REWORK** | Enhances the most intentional player verb. Use defined charge windows/interrupt/impact; cap recharge-on-kill loops; exclusive with fire-trail branch. |
| Searing Lamp | **KEEP / REWORK** | Most promising environmental synergy. Focused beam reveals vulnerable points or briefly hinders selected threats; do not grant a broad unattended damage aura. |
| Brood Heart | **CUT for vertical slice** | Raising allied bugs adds AI/visual clutter and weakens hostile swarm identification. Candidate for a future distinct summoner mode only after tests. |
| Titan Tendons | **CUT** | Automatic footstep damage rewards wandering and may undermine spacing; undermines machine weight by turning stepping into magical area damage. Keep purely physical stomp VFX instead. |
| Reaper Limbs | **CUT for vertical slice** | Constant scythes obscure silhouette, create passive orbital DPS and compete with heavy-machine fantasy. Could return as high-cost mutation after distinct role is proven. |
| Second Shell | **KEEP / REWORK** | Dramatic one-time survival moment, but a free 50% HP rescue is too dominant if unconditionally offered. Make a visible once-per-run emergency mutation with one specific post-molt drawback; balance via tests. |
| Spitter Graft | **KEEP / REWORK** | Clear organic identity. Give alien spit distinctive arc/impact/colour, modest area role, tangible cost (e.g. reduced machine acceleration), exclusive with one comparable module. |

**Recommended initial pool: nine meaningful options, not nineteen.**
- **Cannon (choose one):** Penetrator Kit OR Breach Shell.
- **Heavy support (choose one):** Shoulder Mortar OR Arc Coil.
- **Dash (choose one):** Ram Charger OR Burn Exhaust (derived from Afterburner).
- **Utility:** Lamp Focus (derived from Searing Lamp) OR Reactive Plate (derived from Shock Plating).
- **Alien mutation:** Spitter Graft OR Emergency Molt. (Offer as a distinct high-risk branch, not blended into ordinary hardware rarity.)

This is **ten candidate cards across four groups plus a mutation group**, with mutually exclusive choices. The player should equip *at most three hardware modules and one biological organ in the first playable slice*. That is a hypothesis to test, not a mandatory final cap. Note: a ten-card catalogue does not mean all ten can be equipped. Reserve Field Welder as outpost repair interaction / tuning; Volatile Ichor as first post-slice test. Avoid common/rare/epic/legendary as a substitute for functional roles.

**Systemic fixes:**
1. Auto-pickup salvage should open a quick pause-and-choose panel with 2 curated options (3 only if well-tested on 360px screens). No recurring interruption for rank upgrades; visible part attachment animation after choice.
2. Draw choices from compatible/available slots; never offer unusable combinations or maxed upgrades. Make exclusivity explicit in data and UI.
3. Use deterministic offer seeds so designers and QA can repeat builds.
4. Normalize damage so multiplying `s.pow` does not accidentally scale *every* independent weapon. Define weapon-specific coefficients/roles; cap lifesteal, infinite pierce, chained AOE and invulnerable dash cycles.
5. Give each upgrade a 1-sentence **what changes**, **what it is best against**, **what it costs** description. If the second and third are blank, redesign it.
6. A visual part must map to a mechanical change. Hardware parts remain industrial yellow/steel; living alien parts are unmistakably chitinous and alive.

## 4. The signature system: living salvage
**Current problem:** `g.parts` increments on all part pickups and drives growth thresholds at 2/4/7/10/13/17. Therefore the machine becomes biologically overgrown even if it merely installs mechanical hardware; the transformation has no explicit mechanical price.

**Replacement for first slice:** an intentionally small contamination system.
- 0 mutation slots filled: industrial machine; no alien growth.
- 1 organ installed: visible local growth on chosen hardpoint; powerful identifiable new action or weapon; one stated drawback.
- 2+ organ designs are *future progression*, not required for the vertical slice. Do not create six growth thresholds before players like the first.
- Every organic offer is a meaningful trade: e.g., Spitter Graft gains short-range acid denial but makes acceleration poorer; Emergency Molt is an emergency escape but leaves the cannon temporarily weakened afterwards. These are hypotheses requiring balance tests.
- The final boss death triggers a memorable organic shedding moment; ordinary steel equipment does not magically fall off in the same way.
- Do not add a second permanent action button, hunger meter, parasite XP tree, or cleansing currency at this stage. A purge choice can be prototyped later only if players ask for agency to reverse a bad mutation.

## 5. Mech art and animation redesign
**Observed:** The current walker is a small yellow tub, open cage, lamp, barrel, frame, two legs. It reads as a compact remote industrial drone in the overhead screenshots. Repeated parts add antennae/coloured spheres/spikes, obscuring its original silhouette.

**Target silhouette:** broad protected chest/cabin (pilot visibly inside), narrow waist on two powerful inverted-knee legs, asymmetrical oversized cannon, opposite ram/loader arm, worklight array, exterior repair plates and hydraulic pistons. Its moving mass should be felt even in a 100px-tall portrait-phone sprite.

**CUT:** floating spheres as primary upgrade language; multiple tiny protrusions; random organic eye clusters on basic hardware; decorative piping without an identifiable function.

**CHANGE:** each major installation occupies an intentional hardpoint (shoulder, gun, chest, back, legs). Larger, fewer readable parts. Painted yellow/dusty navy industrial palette, grease/rust; simple hazard striping, welded plates and exposed fasteners. Recoil travels through torso and foot anchoring, not just muzzle flare. Footfall lifts, settles and leaves ground reaction. Ram shows front plate lock / upper-body brace / recovery.

**ADD:** readable pilot/cockpit silhouette, visible cooling/reload cues, damaged plate states, asymmetrical field repairs, mechanical/organic material difference. Test idle/move/fire/dash/hurt/molt at gameplay zoom, on device.

**Avoid:** copying exact *Suits* mech shapes or distinctive costume details; emulate utilitarian construction principles only.

## 6. Enemy art / combat design
| Role | Observation | New player-facing counterplay | Art priority |
|---|---|---|---|
| Stalker | Mostly identical thin spindly bodies with minor palette/build changes; under dark lighting hard to parse | Telegraph a directional leap; player side-steps, interrupts with ram, or uses cannon line | Bigger scythe arms, clear red/white prep pose, readable threat vector |
| Spitter | Light-green sac identifies it in bright screenshots but its range behaviour can be obscure | Keep distance, seek cover, or interrupt windup; acid persists in recognisable zone | Large asymmetric sac, high posture, distinct arc/impact indicator, contrasting hazard treatment |
| Brood Guard | Massive plated insect reads as larger stalker and charges straight; predictable at first glance | Expose flank/back weak point after charge; reward intentional ram timing and positioning | Shielded frontal plate, tusks, short thick legs, explicit stagger state |
| Brood Mother | Similar giant insect body and orange balloon-like egg sac; separate mechanics but repeated boss every night | Two clear phases: field-pattern charge, then burrow-spawn/sac vulnerability; predictable safe windows | Huge long body and recognisable egg rig; unique audio/attack silhouette, less decorative clutter |
| Burrows | Attractive spawn animation, otherwise largely background | Ram a burrow during its exposed phase to temporarily shut a lane (opt-in mechanic) | Functional crack ring, pulsing spawn warning, post-collapse change |

**CUT:** adding new enemy colours and HP multipliers as the main difficulty programme; cluttered simultaneous attack lanes; identical behaviour under different names.

**CHANGE:** every enemy should have one dominant movement pattern, one threat, one tell, one exploitable opening. Keep active attacker limit, but make the reason for a lull comprehensible. Stalker/Spitter/Guard/Mother are enough for the first slice.

**ADD:** threatening range bands, telegraph hierarchy, simultaneous-combination tests, sound cues, enemy spawn preview, stunned/readable recovery windows. If a new enemy adds no new decision, delete it.

## 7. Environment, camera and lighting
**Proposed arena: Farm Relay 09.** A concrete farm machinery/relay yard rather than an endless flat pad. The power station keeps the perimeter fence lit; the player's role is to hold the yard until dawn. This provides emotional stakes without requiring a second health bar in the first prototype.

**Three landmarks with actual function:**
1. **Service gantry/garage:** start/restart anchor, warm practical light, readable sense of human life; also helps players navigate.
2. **Field floodlight + power relay:** silhouettes incoming enemies; lights occasionally fail but base ambient remains readable. A repaired floodlight can be optional later; not a compulsory maintenance minigame.
3. **Breach fence / burrow lane:** spatial anticipation and strategic placement; active burrows can be rammed shut briefly.

**Secondary props:** one derelict walker used as storytelling, a fuel trailer or grain auger, broken machinery, fence sections, a few crop silhouettes, cables and power poles. Each should have either cover, sightline, navigation, storytelling or hazard function. Remove randomly scattered crates/pillars that do none of these.

**Lighting:** darkness for atmosphere; enough fill/rim to see enemies and attack tells outside worklamp. Industrial warm amber vs alien acid-green vs cool sky. Do not rely solely on red/green distinction. Use colour plus shape, animation and audio. Keep one spotlight renderer and inexpensive fills until phone profiling proves extra cost acceptable.

**Camera:** enlarge hero enough that changes are visible; keep threatened forward movement visible; limit top/bottom dead void; never hide a lunge tell under joystick or dash button. Benchmark on 360×780 and 412×880 phones. Test transparent overlays/readability at native resolution, not magnified reference-light crops.

## 8. Narrative and nights
**CUT:** five successive nights that largely increase HP, speed, numbers and paired guards without new player challenges. Keep existing progression code only as scaffolding.

**P0:** One finished night with a beginning, mid-point and outcome. Starting a run should immediately show *what is endangered* and *why the mech is here*. End screen states whether the relay held, visible mech damage/contamination and one meaningful build statistic—not a meaningless pile of icons.

**P1:** Three distinct night missions, not five numbered difficulty settings: (1) initial perimeter breach (introduce stalker/ram), (2) failing irrigation floodlights and spitters (visibility/positioning), (3) relay-wide assault and Mother (enemy combinations and boss). Reuse environments intelligently. Only expand to five if each adds a new tactical premise.

**Narrative tone:** practical people making ugly repairs under pressure, terse radio/warning lines, tragedy as a possibility, no lengthy cinematic exposition. An optional radio call and environment tell are enough.

## 9. UX, audio, performance and accessibility
**HUD:** Keep timer/hull/pause/dash. Add at most one context-sensitive cue for current equipment/mutation; use compact choice screen with mutually-exclusive cards. A new part card should teach a *decision*, not congratulate the player on receiving random loot. Clear warning shapes and contrast; labels and effects at smallest target phone resolution.

**Audio:** Layer heavy mechanical feet, servo strain, shell impact, distinct attack warnings, spitter projectile, impact during ram, radio siren, burst/failing light ambience. Lower continuous gun noise so distant cues can be heard. No copyrighted score or imitated dialogue from the reference episode.

**Performance / stability:** Preserve auto-resolution, quality settings, existing test functions (`window.advanceTime`, `window.render_game_to_text`). Add device FPS/CPU/GPU stress snapshots, deterministic spawn/part roll seed, restart/blur/loss-of-context tests, colour-blind tests and regression screenshots. Target 30 fps minimum on representative lower-end phone; aim for 60 fps where feasible; actual feasibility must be measured, never asserted.

## 10. Agent production structure
**Creative/Game Director (DIR):** owns vision, calls CUT/KEEP/CHANGE, resolves trade-offs. **Producer/Integrator (PROD):** creates tasks, blocks conflicting merges, runs gates. **Game Designer (SYS):** combat loop, upgrades, economy, objective. **Combat Engineer (COM):** feel, damage, dash and weapons. **Enemy AI Designer/Engineer (AI):** species behaviours and boss. **Mech Technical Artist (MECH):** model and rigs. **Environment/Lighting Artist (ENV):** world and camera. **UX/Accessibility (UX):** flow, controls, readable alerts. **Audio Designer (AUD):** soundscape. **Rendering/Platform Engineer (ENG):** WebGL2 quality/performance, module boundaries. **QA/Research (QA):** deterministic tests and human playtests.

### Work packets and handoff contracts
| ID | Owner | Required work | Dependencies | Acceptance criteria |
|---|---|---|---|---|
| DIR-01 | DIR | Sign design pillars, explicit removal list, reference mood board + original silhouette guardrails | None | One-page visual and design principles; every team rejects noncompliant features |
| PROD-01 | PROD | Baseline repo/tag, bug log, role file ownership, feature gates, integration plan | DIR-01 | One owner per shared file, rollback path and daily playable build |
| SYS-01 | SYS | Propose 3–4 min vertical slice arc, event timings, first-play learning beats | DIR-01 | Minute-by-minute objective and threat table, no dead interval >20 sec without deliberate lull |
| SYS-02 | SYS | Replace 19-part drops with 10 candidate cards + exclusions + slot rules | SYS-01 | Each choice names role, benefit, weakness; 2 viable builds verified |
| SYS-03 | SYS | Mutation risk/reward prototype (one organ stage) | SYS-02 | Distinct visible and systemic effect; can be declined; boss shedding makes sense |
| COM-01 | COM | Tune cannon impact, target selection, dash as interrupter; cap invulnerable spam | SYS-01 | Playable no-upgrade run is engaging; player can deliberately interrupt guard/lunge |
| COM-02 | COM | Implement weapon-role branches; stop flat global scaling | SYS-02 | Exclusive cannon/support/dash branches work with readable feedback |
| AI-01 | AI | Distinct stalker/spitter/guard roles, readable telegraphs and recoveries | COM-01, SYS-01 | Each enemy changes player movement decision; no undodgeable overlapping cues |
| AI-02 | AI | Mother 2-phase encounter / fair encounter director | AI-01 | 2 attacks recognisable by silhouette/tell; counterplay and safe windows |
| MECH-01 | MECH | New gameplay-scale silhouette, hardpoints and cockpit design | DIR-01 | Recognisable at 100px height in bright and default lighting |
| MECH-02 | MECH | Procedural weight, recoil, hit, ram and mutation animation | MECH-01, COM-01 | Each action communicates cause and mechanical consequence |
| ENV-01 | ENV | Farm Relay 09 layout, landmark hierarchy, occlusion test | DIR-01, SYS-01 | At least 3 memorable landmarks, no meaningless repeated pad |
| ENV-02 | ENV | Lighting / contrast / camera pass | ENV-01, AI-01 | Enemies, loot and tells identifiable at phone resolution and default brightness |
| UX-01 | UX | Upgrade choice panel and concise first-play cues | SYS-02 | 2 options legible at 360px; decision interaction fits portrait touch |
| UX-02 | UX | HUD, controls, damage warnings and accessibility regression | COM-01, AI-01 | No joystick/telegraph overlap; settings still functional |
| AUD-01 | AUD | Threat-priority sound hierarchy and industrial set | COM-01, AI-01 | 3 threat types distinguishable with screen partially obscured |
| ENG-01 | ENG | Add deterministic run seed, data-driven module definitions, performance counters | PROD-01 | Reproducible state, measured phone captures; no speculative engine rewrite |
| QA-01 | QA | Baseline + playtest questionnaire + telemetry events | PROD-01 | Manual and scripted tests; every high-impact change paired with evidence |
| QA-02 | QA | 5-player first-run test and balance matrix | Integrated vertical slice | Report first-use confusion, attack fairness, choices taken, loss causes, repeat intent |

### File and conflict ownership (adapt to actual repo state)
- `js/game.js` is shared/hot: **COM, AI and SYS must not edit it concurrently on the same branch.** PROD/ENG assign extraction points or queue integrations; each agent supplies a patch with tests.
- `js/engine.js`: ENG owns renderer and perf edits, MECH/ENV submit draw-specs or work via agreed draw functions, not competing direct merges.
- `index.html` and UI/CSS: UX primary owner; ENG reviews touch compatibility/accessibility.
- `README.md`: PROD documents final player-facing behaviour only after features land.
- `design/*`, `tests/*`, `screenshots/*`: separate files per agent; design proposals do not claim live implementation.

## 11. Four-phase production plan and gates
**Gate 0 — Freeze and baseline:** archive current screenshots/settings, create reproducible seed, record FPS and a filmed 2–3 minute play session on at least one real phone. Deliver 1-page baseline facts plus top ten defects. **Do not refactor everything yet.**

**Gate 1 — Design spike:** creative outline, farm relay map thumbnail, new mech silhouette, 10-card catalogue, two threat/upgrade matchup diagrams. Select one high-risk prototype: upgrade choice + organic drawback. Gate review rejects features without a player decision. **Only approve a single-night scope.**

**Gate 2 — Vertical slice:** integrated new mech/arena/readability; stalker/spitter/guard + 2-phase mother; one meaningful ram interaction; deterministic 2-option upgrades (up to 3 hardware + 1 organ); no forced new currencies/menus. A full run start-to-finish must work on phone.

**Gate 3 — Playtest and cut:** 5–8 novice testers on real devices. Track time to understand objective, time to first meaningful choice, fairness, deaths by cause, build variety, silhouette recognition, input mistakes, FPS and desire to replay. Remove confusing systems before adding polish. Fix top 5 issues, then decide whether night 2/3 is warranted.

**Gate 4 — Content expansion (conditional):** only after Gate 3 passes, produce 2 additional mission variants; optional organic tier 2, a deliberately distinct extra enemy or player-controlled repair decision. Do not reinstate cut abilities without evidence they add a distinct playstyle.

## 12. Evidence-based definition of done
The first slice qualifies only when **all** of the following are true:
1. New testers can say *what they are protecting* within the first minute without reading the README.
2. Three enemy classes are recognised by silhouette/behaviour, not just colour, at default mobile settings.
3. Players can explain when to use the ram and demonstrate one intentional interruption, not just escape-spam.
4. A player makes at least two choices per run that lead to noticeably different combat or movement behaviour.
5. Players can describe the biological modification's advantage and disadvantage before accepting it; the mutation affects both visuals and mechanics.
6. At least two contrasting build approaches can complete the vertical slice at an appropriate difficulty. Neither is an automatic obvious winner.
7. The boss has visible phase/readable openings; players attribute deaths to their choices rather than hidden, overlapping or unreadable cues.
8. Full run works on touch device(s); target performance is checked on representative hardware with documented settings and limitations.
9. No regression in saved settings, mobile controls, pause/resume, reduced-motion and high-contrast modes.
10. An independent playtester wants to replay because of decisions and build possibility, not only for visual novelty. This is assessed from direct feedback, not assumed.

## 13. Autonomous-team working agreement — paste into every agent request
> You are the **[ROLE] agent** on Last Light. Read `MASTER_REDESIGN_BRIEF.md` and your role file. Preserve portrait, one-thumb gameplay, procedural WebGL2, original art and existing accessibility options. Challenge existing features; CUT weak features rather than accumulating systems. Scope your work to your assigned tickets and interfaces. Before changing shared code, coordinate ownership with Producer/Integrator. For each task submit: (1) issue and player impact, (2) precise proposed change and removals, (3) implementation/files, (4) objective acceptance test, (5) performance/accessibility impact, (6) screenshots or instrumentation demonstrating behaviour, (7) risks/dependencies. Do not claim real-device playtesting or an improvement without evidence. Do not add a mechanic that has no clear player decision, counterplay or emotional payoff.

## 14. Immediate order to agents
1. **Director + Producer:** approve/remove design pillars and cut list; freeze baseline.
2. **Systems + Combat + QA:** build a fun 90-second greybox loop using the *existing* assets; prove two genuine choices, dash counterplay and threat readability.
3. **Mech + Environment + UX:** independently prototype silhouette, farm relay and readable touch UI at gameplay zoom; do not start polishing dozens of assets.
4. **Enemy AI + Audio:** make one creature threatening in a fair and understandable way before adding any new species.
5. **Engineering:** create deterministic testing seams and profile real phones; optimise only measured bottlenecks.
6. **Integration gate:** merge one full playable short night; use external playtest to decide next changes.

**Final rule:** If a feature is impressive in a source-code list but doesn't produce a better player decision or memorable on-screen moment, remove it.
