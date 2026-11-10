# Last Light

A portrait, mobile-first isometric survivors game: a mechanic in a scrap-built rig vs. an alien swarm, one thumb.
Drag anywhere to steer. The autocannons fire on their own; a stomp and a thermal vent trigger automatically when the swarm closes in.
Survive until dawn (8:00).

Single static file (`index.html`), no build step, no assets. Sprites are pre-rendered at load by a small software 3D renderer.
Add `?fps` to the URL for an fps counter.

**Controls:** drag anywhere to steer. Push the stick out to its outer ring (hold the same direction) to dash; it has a cooldown.

## Accessibility

Built in from the start, not bolted on. Everything is in **Settings & accessibility** on the title and pause screens, saved on the device.
Defaults follow the device: `prefers-reduced-motion` turns off shake, hit-stop and zoom effects and reduces flashing and particles; `prefers-contrast: more` turns on high-contrast mode.

- **Photosensitivity:** no large-area strobing by default (muzzle light is a smoothed glow, not a per-shot pulse; per-enemy hit flashes are rate-limited; damage flicker is slow). "Reduce flashing" goes further.
- **Motion:** screen shake slider, hit-stop, camera zoom effects, effects density, gore on/off.
- **Vision:** brightness boost, high-contrast mode (bug outlines, bold shape-coded hazards), text size up to 200%, health/cooldown numbers, damage numbers on/off. Hazards and attacks use shape (dashed ring, double ring) as well as colour.
- **Hearing:** radio lines are always text on a dark plate, sound captions, off-screen threat arrows, a hit-direction arc, separate master/effects/music volume, vibration toggle.
- **Controls:** full-speed joystick with an adjustable dead zone, fixed or floating stick, dash button side and size, pause button, WASD/arrows + Space/Shift + P on keyboard.
- **Assists:** game speed (down to 55%), damage taken, bug speed, number of bugs. Changeable mid-run.
- **Menus:** semantic dialogs with focus management, keyboard operable, announced to screen readers; audited with axe-core (WCAG 2.2 AA + best practice) with no violations. Pinch-zoom is not blocked.

Not done: the real-time play itself is visual and is not screen-reader playable; there are no colour-palette remaps (cues don't rely on colour alone instead); keyboard remapping is not implemented; no testing with disabled players yet.
