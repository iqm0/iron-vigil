# Last Light

A portrait, one-thumb survivors game. You walk a lantern-headed stove on legs through the dark and hold out for six minutes, until dawn.

**The one idea:** the gun only hits what the light touches. Your lamp swings to the nearest bug by itself, so where you stand decides what gets lit, and what is left in the dark is coming for you faster than you can run.

Single static file (`index.html`), no build step, no assets, no fonts. Everything is flat vector art drawn live on a canvas. Add `?fps` to the URL for a frame counter.

The earlier, much larger prototype (pre-rendered 3D sprites, lanes, garage) is kept at [`legacy/`](legacy/) for reference.

## How it plays

- **Drag anywhere** to walk. **Dash** with the button (drag it to aim, or tap). Keyboard: WASD or arrows, Space or Shift to dash, P to pause.
- The **lamp** is a hard-edged cone. Bugs inside it are shown in full, slowed, and can be shot. Bugs outside it are silhouettes with red eyes, move faster than you, and cannot be shot.
- Burning oil drums and flares are light too. Fighting near a fire is safer.
- **Red hatching on the ground is an attack about to land.** Step out of it or dash through.
- Kills drop teal shards. Enough shards gives a choice of three upgrades. Each upgrade also patches a little hull.
- In the last half minute the light spreads outward from the rig. That is dawn.

## Bugs

Three shapes you can tell apart by outline alone.

| Bug | Shape | What it does |
|---|---|---|
| **Skitter** | Low and wide | Rushes you, then crouches and lunges along a marked lane. It stands still before and after, which is when to shoot it |
| **Spitter** | Tall and thin | Hangs back and lobs acid at where you are heading. The landing spot is marked |
| **Brute** | Big and round | Lowers its horn and charges down a long marked lane, flattening its own swarm on the way. It reels afterwards and takes double damage |

## Upgrades

Twelve, and each one changes something you can see.

- **Gun:** Twin Barrels, Slug Rounds, Auto-Loader, Drill Tips
- **Lamp:** Wide Lens, Long Throw, Scorch Lens (the lamp burns), Fast Servos, Flare Mortar (lights up bugs hiding in the dark)
- **Rig:** Hot Dash, Riveted Plating, Magnet Coil

## Look

Nine flat colours, an ink outline, no gradients and no blur. Light is two hard steps: lit ground and its edge. Things in the light are drawn in colour, things at the edge are dimmed, things in the dark are black shapes with eyes. Attack marks are hatched so they do not depend on colour, and pickups are the only teal thing on screen.

## Accessibility

In **Settings & accessibility** on the title, pause and end screens, saved on the device. Defaults follow `prefers-reduced-motion` and `prefers-contrast`.

- **Motion and flashing:** screen shake, hit-stop, reduce flashing, effects density, ink splats on or off. Nothing strobes by default.
- **Vision and text:** night brightness, high-contrast mode (pale outlines on bugs in the dark, pale bold attack marks, thicker bars), text size up to 200%, numbers for hull and dash, edge arrows for off-screen brutes and spitters, event captions.
- **Audio and haptics:** master, effects and music volume, vibration.
- **Controls:** dash button side and size, fixed or floating joystick, dead zone.
- **Assists:** game speed down to 55%, damage taken, bug speed, number of bugs. Changeable mid-run.
- **Menus:** semantic dialogs, keyboard operable, focus managed, events announced to screen readers. The title, settings, pause, upgrade and end screens pass axe-core (WCAG 2.2 AA and best practice) with no violations.

Not done: the action itself is visual and is not playable by screen reader; there is no key remapping; it has not been tested with disabled players.

## Status

Difficulty was tuned against scripted bots, not people. A bot that wanders into the swarm dies in about a minute and a half; a careful bot with a quarter-second reaction delay reaches dawn in roughly three runs out of five. Frame rate on real phones has not been measured.
