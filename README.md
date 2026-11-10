# Last Light

A portrait, mobile-first isometric survivors game: a mechanic in a scrap-built rig vs. an alien swarm, one thumb.
Drag anywhere to steer. Everything else is automatic: the **right arm** is the only gun, the **left arm** is a compact hydraulic cleaver that chops when bugs get close, and the rig pounds the ground when the swarm closes in.
Survive until dawn (8:00).

Single static file (`index.html`), no build step, no assets. Sprites are pre-rendered at load by a small software 3D renderer.
Add `?fps` to the URL for an fps counter.

**Controls:** drag anywhere to steer; the dash is its own button (drag it in a direction, or tap). WASD/arrows + Space/Shift + P on keyboard.

## Builds

You pick a **rig** (the right-arm weapon) at the start, then spend level-ups across four **lanes**. Level-ups are slow (about eight in a full night), so each one matters.

| Lane | Basics | Keystones (pick one; the others close) |
|---|---|---|
| **GUN** (right arm) | Hot Loads, Quick Feed | **Rotary Cannon** (spin-up gatling, ricochet, Hellstorm) · **Breach Cannon** (scattergun, slugs, Dragon's Breath) · **Burner Torch** (flamethrower, napalm, Conflagration) |
| **BLADE** (left arm) | Whetstone, Servo Elbow | **Executioner** (heavy chops, executes, Guillotine shockwaves) · **Whirlwind** (full-circle spin, Gyro Drive, Bladestorm) · **Thermal Edge** (burning blade, fire crescents, Sunblade) |
| **CHASSIS** (legs, engine) | Hydraulic Rams, Fuel Injectors | **Juggernaut** (shoulder-charge dash, Ram Plates, Earthbreaker) · **Skirmisher** (double dash, adrenaline, Phantom Drive) · **Overdrive Core** (automatic redline, Heat Exchange, Meltdown) |
| **BULWARK** (hull, loot) | Welded Plating, Magnet Rig | **Reactive Armor** (blast on hit, thorns, Bastion) · **Field Repair** (double heal, drones, Second Wind) · **Salvager** (double loot, Pack Rat, Black Market) |

Each keystone has two more steps (a branch upgrade, then a capstone). The level-up screen shows the lane, the tier, and what a keystone closes off; offers lean toward lanes you have invested in. Reroll costs scrap. The pause screen shows your build and what is next in each lane.

## The night

Eight minutes, scripted. A trickle of skitters is punctuated by events with a radio warning: **runners** (fast, in lines), **spitters** (hold back and lob acid), **bloaters** (swell and burst; pop them at range, or next to a crowd), **elites** (armored, frenzied or volatile; bigger loot), and two **Hive Guardians** (charge with a red lane telegraph, summon, spit volleys). A guardian drops a free upgrade. Surges ring you in at set times.

## Why come back

- **Parts**: every run banks parts from scrap, kills, guardians and time, win or lose. Spend them in the **Garage** on small permanent upgrades (five levels each).
- **Goals**: a checklist (survive 3:30, destroy a guardian, finish a capstone, discover synergies...) that pays parts and **unlocks the Breach Cannon and Burner Torch rigs**.
- **Synergies**: twelve named bonuses unlocked by pairing keystones from different lanes (Torch + Thermal Edge = Pyromania, Breach + Juggernaut = Door Kicker, Whirlwind + Field Repair = Vampiric Spin...). Level-up cards flag when a keystone would complete one; the pause screen lists the recipes you are one keystone away from.
- **Heat**: win a night to unlock Heat 1-5 (tougher, more numerous bugs, more parts).

## Loot

Bugs drop **scrap** (rerolls, and fuel for Pack Rat), **ammo** crates (gatling and scattergun), **fuel** cans (torch, blade fire, dash, overdrive) and the odd **repair kit**, each with its own silhouette. Drops lean toward what you are running low on. Running dry has consequences: an empty gatling sputters, an empty torch goes out.

## Fire

Flames, jets, burning bugs, muzzle flashes and the hot blade are real light sources: they cut holes in the dark, wash the ground in orange and warm-tint every sprite near them (the rig, bugs, gibs-free props), with shadows pushed away from the nearest fire.

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
