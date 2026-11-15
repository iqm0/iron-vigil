# Last Light

A portrait, one-thumb survivors game in real 3D. You drive a yellow scrap walker with a work lamp, a rotary gun and a ram plate, on a dark concrete pad full of large bugs. Runs last until the hull gives out.

Static site, no build step and no libraries: `index.html`, `js/engine.js` (a small WebGL2 renderer) and `js/game.js`. Add `?fps` to the URL for a frame counter.

## How it plays

- **Hold the pad for six minutes**, until relief arrives. The clock at the top counts down. Holding a night opens the next one.
- **Drag anywhere** to walk. The gun picks its own targets and fires while you move: the torso turns to the target on its own ring while the legs go where your thumb says.
- **Dash** with the button (tap it, or drag it to aim). The thrusters fire, the ram plate comes forward, and anything in the way is thrown aside. You cannot be hurt during the burst.
- **A red lane on the ground is a lunge about to land.** A bug rears up, the lane shows where it will go, and half a second later it leaps. Lunges are aimed at where you are heading, so change direction or dash across. Amber rings are your own mortar shells coming down.
- **A red ring is acid about to land** (from night two). Spitters keep their distance and lob it at where you are heading; the pool stays for a few seconds.
- Only a few bugs may attack at once. The rest circle and wait.
- **The number of bugs alive has a ceiling** that rises slowly (6 at the start, 20 by the third minute). A strong build gets more kills, not a fuller screen. Every 40 seconds runs press, swarm, lull.
- **A brood guard** (large, bone-plated) arrives about every 55 seconds. It charges down a long wide lane, and it always drops a part and a repair cell.
- Keyboard: WASD or arrows, Space or Shift to dash, P or Esc to pause, M to mute.

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

The first time a part is fitted in a run, the game stops and shows a card with its icon, name and what it does. Finding the same part again raises its mark and shows a caption. Fitted parts sit in a row under the hull bar, with a pip per mark, and are listed with their effects on the pause and end screens.

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

The first part of a run is always a rare one. Kinds of part you have found are remembered on the device, and each new run starts with one of them, picked at random (never a legendary one).

### The machine changes

Every part shows on the walker: the mortar tube on the shoulder, a brass-wound coil with a lit ball, heat collars on the gun that glow while it fires, coolant pipes, a bone spike under the barrels, horns on the ram plate, the heart beating on its back, the scythe limbs, the pale second shell until it is shed. A new fitting pops out and settles.

The parts come off bugs, and they take hold. The more you have fitted in a run, the more the walker grows over, in six stages (at 2, 4, 7, 10, 13 and 17 parts): chitin plates and cords of sinew, glowing sacs and knee spurs, shoulder carapace and a feeler, a ridge of spines and toe claws, ribs and a pulsing sac under the cab, and finally mandibles, a cluster of eyes and chitin legs.

## How it is drawn and animated

- Everything solid is an instance of one of four meshes (bevelled box, cylinder, cone, sphere), lit per pixel. The work lamp is a real spotlight with a shadow map; fires, the gun and the thrusters are point lights.
- The whole game runs at nine tenths speed. The torso snaps to a target quickly, but the lamp is on its own swivel and swings round slowly, so the light does not whip about.
- Nothing is keyframed. Feet are planted on the ground and step when the body has moved far enough; knees are solved to reach them. Lean, recoil, the gun's kick, the ram arm and the antenna are springs. Bugs walk on two alternating tripods of legs the same way.
- The ground texture is painted once at start-up, so each frame costs two texture lookups for it.
- The 3D view is capped at 1.5 million pixels and drops its resolution, never its frame rate, if the device falls behind.

## Accessibility

In **Settings & accessibility** on the title, pause and end screens, saved on the device. Defaults follow `prefers-reduced-motion` and `prefers-contrast`.

- **Motion and flashing:** screen shake, hit-stop, reduce flashing, remains on or off. The gun lights the scene with a steady glow, not a flash per shot.
- **Vision and text:** darkness brightness, high-contrast mode (paler glowing bugs, bolder lunge lanes, thicker bars), text size up to 200%, numbers for hull and dash, event captions, and whether the game stops to show a new part.
- **Audio and haptics:** master, effects and music volume, vibration.
- **Controls:** dash button side and size, fixed or floating joystick, dead zone.
- **Assists:** game speed down to 55%, damage taken, bug speed, number of bugs. Changeable mid-run.
- **Menus:** semantic dialogs, keyboard operable, focus managed, events and pickups announced to screen readers. The title, settings, pause, part card and end screens pass axe-core (WCAG 2.2 AA and best practice) with no violations.

Not done: the action itself is visual and is not playable by screen reader; there is no key remapping; it has not been tested with disabled players.

## Status

Checked in headless Chromium only, by stepping the game and looking at frames, and by scripted players. It has not been run on a phone, so frame rate on real devices is unknown.

Night one has been finished once by a person. Nights two to five are tuned against scripted players only, which are a poor guide: they finish nights one to three most of the time and are hit more on each.

`window.advanceTime(ms)` and `window.render_game_to_text()` exist for automated checks. Skills used while designing this are in [`.claude/skills/`](.claude/skills/README.md).

## Earlier versions

- [`flare/`](flare/): the previous 2D build using sprites from the FLARE project (CC-BY-SA 3.0, see [`flare/CREDITS.md`](flare/CREDITS.md)).
- [`legacy/`](legacy/): the first prototype.
