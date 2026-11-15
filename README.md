# Last Light

A portrait, one-thumb action game in real 3D. Night on a farm: a house with its lights on, a machine shed, a relay mast. You are the mechanic in an open bucket on the corner of a two-legged loader with a cannon for one arm and a pile-driver for the other. Things with blades longer than their bodies are coming out of the crop.

| | | | |
|---|---|---|---|
| ![It throws its blades wide](screenshots/05_wind_up_blades_wide.png) | ![The line is locked](screenshots/06_lane_locked.png) | ![Blades stuck in the ground](screenshots/07_blades_stuck.png) | ![Rammed and crushed](screenshots/11_rammed_and_crushed.png) |

Static site, no build step and no libraries: `index.html`, `js/engine.js` (a small WebGL2 renderer) and `js/game.js`. Add `?fps` to the URL for a frame counter and `?seed=7` to repeat a run.

**This is one encounter, about a minute long, and nothing else.** An earlier and larger version (a three-minute night, four kinds of enemy, ten modules) was cut back to this after a recording showed it still looked and played like a prototype. Why, what was compared, and what was chosen are in [`design/DIRECTION.md`](design/DIRECTION.md). **Nobody has played this version and it has not run on a phone.**

## How it plays

- **Drag anywhere** to walk. The cannon picks its own target and fires: a heavy shell about twice a second. Each one shoves the animal back and twists it; it takes nine.
- **Watch the animal, not the ground.** It circles with its blades folded. When it stops and throws both blades out wide, it is about to pounce. A third of a second before it goes, two thin red lines show its line. Step off the line.
- After a pounce its **blades are stuck in the ground** for nearly a second. That is the opening.
- **Ram** with the button (tap, or drag to aim). Ram one that is stuck and it is crushed. Ram one in its wind-up and it goes over on its back with a blade snapped. Ram one that is just circling and it is thrown and hurt. A ram that hits nothing leaves you sliding with the cannon down.
- Four waves: one, two, three, three. Eyes show in the crop before each one walks out, and the dark at that edge of the screen turns red. Only one may attack at a time until the last wave.
- The first kill leaves **salvage**: walk onto it and choose one of two versions of the ram. Ram Charger fits a bigger toothed head and goes further; Burn Exhaust fits twin burners and leaves a wall of fire.
- Keyboard: WASD or arrows, Space or Shift to ram, 1 / 2 on the choice, P or Esc to pause, M to mute.

## What is on screen

The hull bar, four dots for the waves, a pause button and the ram ring. Everything else is in the world. The end screen says whether the yard was held, how long it took, how many you crushed and how many you shot, and what you fitted.

## How it is drawn

- Everything solid is an instance of one of ten small flat-shaded meshes. The walker was chosen from three blockouts judged as black silhouettes at gameplay scale ([`design/blockouts/mech-silhouettes.png`](design/blockouts/mech-silhouettes.png)) and uses three values only: one body colour, a near-black frame, and the lit bucket.
- The camera is a wide lens 21 metres out and 50 degrees up, facing north, so near things are large and the house, shed and silo stand behind the fight.
- Light: the walker's lamp (a real spotlight with a shadow map), a cool flood on the relay mast, warm light from the house and the shed, a cool back light so the tops of things have form, and fog that goes to deep teal, never black.
- The ground is one shader: a dirt yard worn pale in the middle, a concrete apron at the shed door, a gravel track with ruts running out through the gate, a grass verge, and ploughed soil with furrows.
- Nothing is keyframed. Feet are planted and step when the body has moved far enough; knees are solved to reach them. Recoil, lean, the ram and the animal's poses are springs and blends driven by the same state the rules use.
- The 3D view is capped at 1.5 million pixels and drops its resolution, never its frame rate, if the device falls behind.

## Sound

Everything is synthesised in the browser. Nothing new was made for this version: the animal reuses the old screech, lunge and ricochet. It needs a pass by someone who can hear it.

## Accessibility

In **Settings & accessibility** on the title, pause and end screens, saved on the device. Defaults follow `prefers-reduced-motion` and `prefers-contrast`.

- **Motion and flashing:** screen shake, hit-stop, reduce flashing, remains on or off. The gun lights the scene with a steady glow, not a flash per shot.
- **Vision and text:** darkness brightness, high-contrast mode (paler glowing bugs, bolder lunge lanes, thicker bars), text size up to 200%, numbers for hull and dash, and event captions (off by default).
- **Audio and haptics:** master, effects and ambience volume, vibration.
- **Controls:** dash button side and size, fixed or floating joystick, dead zone.
- **Assists:** game speed down to 55%, damage taken, bug speed, number of bugs. Changeable mid-run.
- **Menus:** semantic dialogs, keyboard operable, focus managed, events and pickups announced to screen readers. The title, settings, pause, salvage choice and end screens pass axe-core (WCAG 2.2 AA and best practice) with no violations.

Not done: the action itself is visual and is not playable by screen reader; there is no key remapping; it has not been tested with disabled players.

## Tests

In [`tests/`](tests/README.md): 31 scripted rule checks, whole runs by three kinds of bot from fixed seeds, and a set of staged frames at 412×880 and 360×780.

## Status

Checked in headless Chromium only, by scripted checks, bots and looking at frames. **Not played by a person, not run on a phone.** Stills cannot show weight or timing; one timing bug in this version was invisible in frames and was caught by a check. [`design/DIRECTION.md`](design/DIRECTION.md) lists what is unverified and what to look at first.

Branches: `redesign-slice` is the larger three-minute version this replaced; `baseline-pre-redesign` is the five-night game before that. Skills used while designing are in [`.claude/skills/`](.claude/skills/README.md).

## Earlier versions

- [`flare/`](flare/): the previous 2D build using sprites from the FLARE project (CC-BY-SA 3.0, see [`flare/CREDITS.md`](flare/CREDITS.md)).
- [`legacy/`](legacy/): the first prototype.
