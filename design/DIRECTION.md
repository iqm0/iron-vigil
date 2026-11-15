# Last Light: one encounter, done properly

Written after the owner watched a recording of the single-night slice and said it still looked and played like a prototype: no visual hierarchy, no physical impact, no interesting exchange. The instruction was to stop adding, compare concrete alternatives before building, and make one 60 to 90 second encounter that is demonstrably better.

**Status: built and machine-checked. Nobody has played it. It has not run on a phone.** The frames in [`../screenshots/`](../screenshots/) are from a headless browser. Whether it feels heavy, whether the wind-up reads in motion, and whether it is fun are not things this document can claim.

## How the direction was chosen

Five specialists reviewed the same frames independently, without seeing each other's notes or mine: art direction and mech, combat and animation, creatures, camera and lighting, environment. Their findings, briefly, and what was done with each.

| Critic | Sharpest finding | Decision |
|---|---|---|
| Art direction | "The plan view is a square. The legs are hidden. The weapons are accessories. Nothing dominates. The yellow is not the mech's own." | Three blockouts built and judged as flat black shapes at gameplay scale ([`blockouts/mech-silhouettes.png`](blockouts/mech-silhouettes.png)). Three values only. Yellow taken off the gantry, the relay cabinet and the floor. |
| Combat and animation | "Nothing survives a hit: every shot is a kill, so there is no hit reaction to see. The hull never recoils. A missed ram costs nothing." | One enemy that takes nine shells and visibly reacts to each. Hull shoved back and twisted by every shot. The ram costs speed on impact and time on a miss. |
| Creatures | "Anything under a third of the walker reads as litter. Wire legs. The tells are red decals; the pose change is invisible." | One animal about three quarters of the walker's length, four thick legs, two blades longer than its body, with a wind-up pose that changes its outline from an I to a Y. |
| Camera and lighting | "A telephoto: no scale gradient, mostly roofs. Fog to black, so dark things sit on dark ground against black. The key points away from the hero." | Wider lens, lower and closer (50°, 21 m, 66° field of view). A cool back key so tops have form. Deep teal fog, never black. A warm light on the walker's camera side. Headlamp cut by a third. |
| Environment | "One material. No dwelling. A cage. The world stops at the fence. The field reads as a black spike pit." | A farmhouse with lit windows, the shed, the silo and the relay mast on the north side. Dirt yard, track, verge and lit furrows painted by the ground shader. Fences on two sides only; standing crop on the west. Trailer, wreck, crates, extra floodlights, burrow lamps and painted border removed. |

### The mech: three silhouettes, one chosen

| | Plan view | For | Against |
|---|---|---|---|
| Long Gun | An arrow on a bar | The cleanest read of where it aims | It is all gun. The pilot and the ram disappear. |
| **Lopsided** | An L | Gun arm, ram and pilot stay readable from every side; the asymmetry tells you which way it faces even from behind | Legs partly under the body, fixed by taking the Crab's wider stance |
| Crab | A wide bar with a clock hand | The legs are the outline | A squat gun platform, not a piloted machine; symmetric, so facing is ambiguous |

Lopsided was chosen (the art critic picked the same concept independently), with the hips moved out onto a boom so both legs show, and the Long Gun's barrel length.

## What the encounter is

Four waves out of the crop: one animal, then two, three, three. Nine in all. Eyes show in the crop for two seconds before each one walks out. One salvage choice after the first kill, between two versions of the ram. Bots finish it in 55 to 64 seconds; a person will take longer.

**The animal** (working name: shearback) circles at six to seven metres in sprints and dead stops, blades folded along its flanks.

| Beat | Length | What you see | What it means |
|---|---|---|---|
| Wind-up | 0.72 s | It stops, drops its rear, throws both blades out wide and they quiver | Get ready to move. Shells will not stop it; the ram will. |
| Lane | last 0.34 s of that | Two thin red lines down the ground | The line is locked. Step off it. |
| Pounce | 0.2 s | Five metres, blades scissoring shut | Hits only what is on the line. |
| Stuck | 0.9 s | Blades buried, body stretched out, tail up | The opening. Shells do half as much again. A ram crushes it outright. |

It takes nine shells. Each shoves it back about half a metre and twists the struck shoulder away. At a bit over half health a blade shears off, spins away and stays stuck upright in the yard; at a quarter, the other. It dies carried down the line of fire, rolls belly-up with its legs curled, and lies there for seven seconds.

**The ram** is the signature action. Against an animal that is circling: a third of its health, thrown four metres, a tumble. During its wind-up: flipped on its back for 1.8 seconds with a blade snapped, taking double. While it is stuck, on its back or under half health: crushed flat, with the walker losing more than half its speed on impact. A ram that connects comes back 0.8 seconds sooner. A ram that hits nothing leaves the walker sliding for 0.6 seconds with no steering to speak of and the cannon down.

**The cannon** fires 2.2 heavy shells a second (was 3). Each shot shoves the whole hull back over its planted feet and twists the torso off the gun side. No camera shake, as before.

**The walker** strides 4.3 metres a step (was 3.1), accelerates more slowly, and the legs turn at about half the old rate; the torso still turns fast.

**The choice** changes the machine visibly: Ram Charger fits a larger toothed head and a second brass cylinder; Burn Exhaust fits two wide burners.

## What was cut or shelved for this

Spitters, the brood guard, the brood mother, burrows, eight of the ten cards, both organs, the three-minute clock. Their code is still in `js/game.js` and unreachable; the previous build is on the branch `redesign-slice`. They come back only when this encounter has been played and is good.

## Effects budget

- Lane: two thin lines, only once locked. No filled red shapes.
- Hits: three dark particles and one chip. No green. Blood marks are dark, matte, and gone in seven seconds.
- Muzzle flash: half the size, half the time.
- Hurt: red at the screen edge only.
- Peak load in bot runs: about 480 drawn instances (the single-night slice peaked near 1000).

## Evidence

- `node tests/checks.js`: 31 rule checks pass, including "stepping off the lane once it shows is enough" and "standing in the lane costs hull".
- `node tests/sim.js 3`: a bot that dodges and rams finishes in 55 to 58 s with 52 to 98 hull; one that dodges and never rams, 60 to 64 s; one that never moves is wrecked in the last wave, three runs of three.
- `node tests/shots.js`: 36 frames at 412×880 and 360×780, no page errors.
- A timing bug was found by the checks, not by eye: the animal's timers were being counted down twice, so its wind-up was half as long as designed. Frames taken before that fix looked fine. This is a reminder of how little stills prove about timing.

## Not verified

1. Anything on a phone: frame rate, touch, whether the thumb covers what matters. The view is deeper and wider than before, which costs fill rate.
2. Weight. Recoil, stride and inertia were built to the animator's numbers and have only been seen as stills.
3. Whether 0.34 seconds of lane is enough for a person. It is enough for a bot.
4. Difficulty. It was eased once on bot results alone.
5. Sound. Nothing new was added for the animal beyond reusing the old screech, lunge and ricochet sounds.
6. Bots still take four to seven hits a run even when dodging. A hit costs 14 of 100 hull and two repair cells drop, so that is survivable, but it may mean the lane is too hard to leave.

## What to look at first on a phone

1. Can you tell at a glance which arm is the gun and which way the walker faces?
2. Does the wind-up read as a threat before the red lines appear?
3. Does stepping aside feel possible, or do you need the ram to dodge?
4. Does ramming a stuck one feel like the best thing in the game?
5. Does the cannon feel heavier or just slower?
