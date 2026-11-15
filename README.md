# Last Light

A portrait, one-thumb survivors game in real 3D. You drive a yellow scrap walker with a work lamp, a rotary gun and a ram plate, on a dark concrete pad full of large bugs. Runs last until the hull gives out.

Static site, no build step and no libraries: `index.html`, `js/engine.js` (a small WebGL2 renderer) and `js/game.js`. Add `?fps` to the URL for a frame counter.

## How it plays

- **Hold the pad for six minutes**, until relief arrives. The clock at the top counts down.
- **Drag anywhere** to walk. The gun picks its own targets and fires while you move: the torso turns to the target on its own ring while the legs go where your thumb says.
- **Dash** with the button (tap it, or drag it to aim). The thrusters fire, the ram plate comes forward, and anything in the way is thrown aside. You cannot be hurt during the burst.
- **A red lane on the ground is a lunge about to land.** A bug rears up, the lane shows where it will go, and half a second later it leaps. Lunges are aimed at where you are heading, so change direction or dash across. Amber rings are your own mortar shells coming down.
- Only a few bugs may attack at once. The rest circle and wait.
- **The number of bugs alive has a ceiling** that rises slowly (6 at the start, 20 by the third minute). A strong build gets more kills, not a fuller screen. Every 40 seconds runs press, swarm, lull.
- **A brood guard** (large, bone-plated) arrives about every 55 seconds. It charges down a long wide lane, and it always drops a part and a repair cell.
- Keyboard: WASD or arrows, Space or Shift to dash, P or Esc to pause, M to mute.

## Parts

The walker starts bare. Bugs drop a part roughly every twenty-odd seconds, and each brood guard drops one. Parts bolt themselves on when you walk near them. Green cells repair the hull.

The first time a part is fitted in a run, the game stops and shows a card with its icon, name and what it does. Finding the same part again raises its mark and shows a caption. Fitted parts sit in a row under the hull bar, with a pip per mark, and are listed with their effects on the pause and end screens.

Rarity is the part's role: common parts tune what you have, rare parts are new weapons you can see firing, epic parts change a rule.

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

The first part of a run is always a rare one. Kinds of part you have found are remembered on the device, and each new run starts with one of them, picked at random.

## How it is drawn and animated

- Everything solid is an instance of one of four meshes (bevelled box, cylinder, cone, sphere), lit per pixel. The work lamp is a real spotlight with a shadow map; fires, the gun and the thrusters are point lights.
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

Difficulty is a guess. Scripted players that keep moving and pick up parts finish the six minutes almost unhurt; one that stands still dies in under a minute. The previous tuning, which a person found overwhelming after two minutes, was survivable for the same scripts, so they are a poor guide and the numbers were deliberately moved toward easy.

`window.advanceTime(ms)` and `window.render_game_to_text()` exist for automated checks. Skills used while designing this are in [`.claude/skills/`](.claude/skills/README.md).

## Earlier versions

- [`flare/`](flare/): the previous 2D build using sprites from the FLARE project (CC-BY-SA 3.0, see [`flare/CREDITS.md`](flare/CREDITS.md)).
- [`legacy/`](legacy/): the first prototype.
