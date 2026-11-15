# Last Light

A portrait, one-thumb survivors game in real 3D. You drive a yellow scrap walker with a work lamp, a heavy three-barrel cannon and a ram plate, on a dark concrete pad full of large bugs. A night lasts five minutes, then the brood mother comes and you have to kill her.

Static site, no build step and no libraries: `index.html`, `js/engine.js` (a small WebGL2 renderer) and `js/game.js`. Add `?fps` to the URL for a frame counter.

## How it plays

- **Hold out for five minutes**; the clock at the top counts down to the brood mother. **Kill her** to end the night. Holding a night opens the next one.
- **The brood mother** has four attacks, each marked on the ground before it lands: a charge down a wide lane, a volley of acid rings, a slam ring around her, and a clutch of stalkers from her brood sac. She speeds up below half health. Her health is the red bar at the top.
- **Drag anywhere** to walk. The cannon picks its own targets and fires while you move: the torso turns to the target on its own ring while the legs go where your thumb says. It sits on its own pivot at the shoulder and lays itself on the target, so a shell always leaves straight along the barrel. It fires three heavy shells a second and reaches about as far as the lamp shows, so bugs come into view and close in before they die. A shell kills the first bugs outright, tears a leg off one it does not kill, and carries on through into the next bug with a third less force. Its weight is shown on the walker and on the bugs; it does not shake the screen.
- **Dash** with the button (tap it, or drag it to aim). The thrusters fire, the ram plate comes forward, and anything in the way is thrown aside. You cannot be hurt during the burst.
- **A red lane on the ground is a lunge about to land.** A bug rears up, the lane shows where it will go, and half a second later it leaps. Lunges are aimed at where you are heading, so change direction or dash across. Amber rings are your own mortar shells coming down.
- **A red ring is acid about to land** (from night two). Spitters keep their distance and lob it at where you are heading; the pool stays for a few seconds.
- Only a few bugs may attack at once. The rest circle and wait.
- **The number of bugs alive has a ceiling** that rises slowly (6 at the start, 20 by the third minute). A strong build gets more kills, not a fuller screen. Every 40 seconds runs press, swarm, lull.
- **A brood guard** (large, with a plated back and a horned head it lowers to ram) arrives about every 55 seconds. It charges down a long wide lane, and it always drops a part and a repair cell.
- Keyboard: WASD or arrows, Space or Shift to dash, P or Esc to pause, M to mute.

## What is on screen

During play: the hull bar, the clock, a pause button and the dash ring. Nothing else is written or labelled. A swarm arriving turns the dark at that edge of the screen red for a few seconds. Everything else is in the world: lunge lanes and acid rings on the ground, parts glowing where they fall, new fittings appearing on the walker, a damaged hull smoking and sparking.

## Bugs

All three kinds are drawn from flat-faced shapes, so they read as hard chitin with sharp edges, and each has its own outline from above.

- **Stalkers** are mostly legs: a small dark body, high knees, a tail tipped up with a ridge of spikes, and two scythes they carry folded, throw up and wide before a lunge, and drive forward in it. Each one differs in build and in the one accent colour on its plates. They come at you three ways: straight in with a weave, wide round the side, or hanging back on a ring and darting in. They move in runs and beats.
- **Spitters** are a lit sac of acid on a small frame.
- **Brood guards** have a broad horned head and a plated, spined back that tapers behind.

## Nights

| Night | What it adds |
|---|---|
| 1 | Bugs and brood guards |
| 2 | Spitters |
| 3 | Brood guards in pairs, tougher bugs |
| 4 | Faster bugs, shorter lulls, more lunging at once |
| 5 | Everything at once, swarms from two sides |

You can replay any night you have opened from the title screen.

## Parts

The walker starts bare. Bugs drop a part roughly every twenty-odd seconds, and each brood guard drops one. Parts bolt themselves on when you walk near them. Green cells repair the hull.

The first time a part is fitted in a run, the game stops and shows a card: its icon, its name, a few words, and a pip for each mark. Finding the same part again raises its mark with no interruption; you see it on the walker. What is fitted is listed on the pause screen and shown as a row of icons on the end screen.

A rare, epic or legendary part lying off screen has a diamond in its colour at the edge of the screen, with an arrow toward it.

Rarity is the part's role: common parts tune what you have, rare parts are new weapons you can see firing, epic parts change a rule, and legendary parts are alien organs with an effect nothing else has. Legendary parts have a single mark and cannot be raised. They do not appear before the first minute, sit in a column of gold light when dropped, and are more likely from a brood guard.

| Part | Rarity | Marks | What it does |
|---|---|---|---|
| Hot Loads | Common | 3 | Everything you fire hits 35% harder per mark |
| Belt Feeder | Common | 3 | The gun fires 30% faster per mark |
| Coolant Lines | Common | 3 | The dash recharges 25%, 45%, 60% faster |
| Field Welder | Common | 3 | Every kill mends 0.6 hull per mark |
| Shoulder Mortar | Rare | 3 | Lobs one, two or three shells into the thickest groups every few seconds |
| Arc Coil | Rare | 3 | About once a second, lightning jumps through up to 4, 6 or 9 bugs |
| Sentry Drone | Rare | 3 | One, two or three drones circle you and shoot on their own |
| Afterburner | Rare | 3 | The dash leaves a line of fire for 3, 4.5 or 6 seconds |
| Shock Plating | Rare | 3 | Blocks one hit every 9, 7 or 5 seconds and throws nearby bugs back |
| Piercing Rounds | Rare | 2 | Shots pass through two more bugs, then through all of them |
| Breaching Rounds | Epic | 2 | Every fourth, then every second, shot explodes |
| Volatile Ichor | Epic | 2 | Bugs burst when they die and hurt their neighbours |
| Ram Charger | Epic | 2 | A longer dash that recharges on ram kills; at mark two it ends in a slam |
| Searing Lamp | Epic | 2 | A wider lamp that burns and slows every bug in its beam |
| Brood Heart | Legendary | 1 | Some of the bugs you kill rise again and fight for you for a while; yours glow blue |
| Titan Tendons | Legendary | 1 | Every footfall cracks the ground and hurts everything near that foot |
| Reaper Limbs | Legendary | 1 | Two bone scythes grow from your back and sweep around you without stopping |
| Second Shell | Legendary | 1 | Once a night, the hit that would wreck you sheds the shell instead: a blast, and half your hull back |
| Spitter Graft | Legendary | 1 | A grown limb spits acid at a second target, and every hit splashes |

The first part of a run is always a rare one. Kinds of part you have found are remembered on the device. Every night starts bare.

### The machine changes

The walker starts as a bare frame: a cab on legs with a cannon, an open steel ram frame, no plating.

Every part shows on it: the mortar tube on the shoulder, a brass-wound coil with a lit ball, heat collars on the gun that glow while it fires, coolant pipes, a bone spike under the barrels, horns on the ram, the heart beating on its back, the scythe limbs, the pale second shell until it is shed. A new fitting pops out and settles.

The parts come off bugs, and they take hold. The more you have fitted in a night, the more the walker is overgrown, in six stages (at 2, 4, 7, 10, 13 and 17 parts): a chitin shield across the ram frame, plates and cords of sinew; glowing sacs, shin guards and knee spurs; shoulder carapace and a feeler; a ridge of spines, toe claws and a swaying tail; ribs, a pulsing sac under the cab and two small grasping arms; and finally mandibles, a cluster of eyes, chitin legs and a spined hump. The torso swells a little with each stage.

The brood mother is what keeps all of it alive. When she dies, the chitin, the sacs and the organs die with her and fall off, and what is left standing in the lamp is the bare machine again.

## How it is drawn and animated

- Everything solid is an instance of one of four meshes (bevelled box, cylinder, cone, sphere), lit per pixel. The work lamp is a real spotlight with a shadow map; fires, the gun and the thrusters are point lights.
- The whole game runs at nine tenths speed. The torso snaps to a target quickly, but the lamp is on its own swivel and swings round slowly, so the light does not whip about.
- The pad is close to black outside the lamp, the fires and whatever is firing; bugs in the dark show as eyes. The *Darkness brightness* setting lifts it.
- Every action fires several kinds of feedback at once. The gun heats its barrels, kicks, throws a flash that turns from shot to shot, and smokes as it cools; shots spray ichor out the far side. Footfalls leave prints and a chuff from the stacks. A hit throws plates off, sends arcs over the hull and dips the lamp, and a damaged hull smokes, sparks and then burns. Explosions throw a ring, smoke and chips of the pad.
- Nothing is keyframed. Feet are planted on the ground and step when the body has moved far enough; knees are solved to reach them. Lean, recoil, the gun's kick, the ram arm and the antenna are springs. Bugs walk on two alternating tripods of legs the same way.
- The ground texture is painted once at start-up, so each frame costs two texture lookups for it.
- The 3D view is capped at 1.5 million pixels and drops its resolution, never its frame rate, if the device falls behind.

## Accessibility

In **Settings & accessibility** on the title, pause and end screens, saved on the device. Defaults follow `prefers-reduced-motion` and `prefers-contrast`.

- **Motion and flashing:** screen shake, hit-stop, reduce flashing, remains on or off. The gun lights the scene with a steady glow, not a flash per shot.
- **Vision and text:** darkness brightness, high-contrast mode (paler glowing bugs, bolder lunge lanes, thicker bars), text size up to 200%, numbers for hull and dash, event captions (off by default), and whether the game stops to show a new part.
- **Audio and haptics:** master, effects and music volume, vibration.
- **Controls:** dash button side and size, fixed or floating joystick, dead zone.
- **Assists:** game speed down to 55%, damage taken, bug speed, number of bugs. Changeable mid-run.
- **Menus:** semantic dialogs, keyboard operable, focus managed, events and pickups announced to screen readers. The title, settings, pause, part card and end screens pass axe-core (WCAG 2.2 AA and best practice) with no violations.

Not done: the action itself is visual and is not playable by screen reader; there is no key remapping; it has not been tested with disabled players.

## Status

Checked in headless Chromium only, by stepping the game and looking at frames, and by scripted players. It has not been run on a phone, so frame rate on real devices is unknown.

Night one, in an earlier form without the brood mother, has been finished once by a person. Nights two to five are tuned against scripted players only, which are a poor guide: they finish nights one to three most of the time and are hit more on each.

`window.advanceTime(ms)` and `window.render_game_to_text()` exist for automated checks. Skills used while designing this are in [`.claude/skills/`](.claude/skills/README.md).

## Earlier versions

- [`flare/`](flare/): the previous 2D build using sprites from the FLARE project (CC-BY-SA 3.0, see [`flare/CREDITS.md`](flare/CREDITS.md)).
- [`legacy/`](legacy/): the first prototype.
