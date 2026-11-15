# Last Light

A portrait, one-thumb survivors game in real 3D. You drive a yellow scrap walker with a work lamp, a rotary gun and a ram plate, on a dark concrete pad full of large bugs. Runs last until the hull gives out.

Static site, no build step and no libraries: `index.html`, `js/engine.js` (a small WebGL2 renderer) and `js/game.js`. Add `?fps` to the URL for a frame counter.

## How it plays

- **Drag anywhere** to walk. The gun picks its own targets and fires while you move: the torso turns to the target on its own ring while the legs go where your thumb says.
- **Dash** with the button (tap it, or drag it to aim). The thrusters fire, the ram plate comes forward, and anything in the way is thrown aside. You cannot be hurt during the burst.
- **A red lane on the ground is a lunge about to land.** A bug rears up, the lane shows where it will go, and half a second later it leaps. Lunges are aimed at where you are heading, so change direction or dash across.
- Only a few bugs may attack at once. The rest circle and wait, so being surrounded is a warning, not an instant loss.
- Keyboard: WASD or arrows, Space or Shift to dash, P or Esc to pause, M to mute.

## Parts

The walker starts bare. Bugs sometimes drop a part, and it bolts itself on when you walk over it. Green cells repair the hull.

| Rarity | Parts |
|---|---|
| Common | Tungsten Rounds, Belt Feeder, Servo Grease, Weld Kit, Scrap Plating, Coolant Lines, Scrap Magnet |
| Rare | Piercing Rounds, Searing Lamp, Afterburner, Shock Plating |
| Epic | Breaching Rounds, Ram Charger, Volatile Light |

Parts you have found are remembered on the device. Each new run starts with one of them, picked at random.

## How it is drawn and animated

- Everything solid is an instance of one of four meshes (bevelled box, cylinder, cone, sphere), lit per pixel. The work lamp is a real spotlight with a shadow map; fires, the gun and the thrusters are point lights.
- Nothing is keyframed. Feet are planted on the ground and step when the body has moved far enough; knees are solved to reach them. Lean, recoil, the gun's kick, the ram arm and the antenna are springs. Bugs walk on two alternating tripods of legs the same way.
- The ground texture is painted once at start-up, so each frame costs two texture lookups for it.
- The 3D view is capped at 1.5 million pixels and drops its resolution, never its frame rate, if the device falls behind.

## Accessibility

In **Settings & accessibility** on the title, pause and end screens, saved on the device. Defaults follow `prefers-reduced-motion` and `prefers-contrast`.

- **Motion and flashing:** screen shake, hit-stop, reduce flashing, remains on or off. The gun lights the scene with a steady glow, not a flash per shot.
- **Vision and text:** darkness brightness, high-contrast mode (paler glowing bugs, bolder lunge lanes, thicker bars), text size up to 200%, numbers for hull and dash, event captions.
- **Audio and haptics:** master, effects and music volume, vibration.
- **Controls:** dash button side and size, fixed or floating joystick, dead zone.
- **Assists:** game speed down to 55%, damage taken, bug speed, number of bugs. Changeable mid-run.
- **Menus:** semantic dialogs, keyboard operable, focus managed, events and pickups announced to screen readers. The title, settings, pause, play and end screens pass axe-core (WCAG 2.2 AA and best practice) with no violations.

Not done: the action itself is visual and is not playable by screen reader; there is no key remapping; it has not been tested with disabled players.

## Status

Checked in headless Chromium only, by stepping the game and looking at frames, and by scripted players. It has not been played by a person or run on a phone, so frame rate on real devices and whether the difficulty is right are unknown. `window.advanceTime(ms)` and `window.render_game_to_text()` exist for automated checks.

## Earlier versions

- [`flare/`](flare/): the previous 2D build using sprites from the FLARE project (CC-BY-SA 3.0, see [`flare/CREDITS.md`](flare/CREDITS.md)).
- [`legacy/`](legacy/): the first prototype.
