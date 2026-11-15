# Last Light

A portrait, one-thumb survivors game in the old isometric style. An armoured figure with a burning staff holds out in an antlion nest for six minutes, until dawn.

**The rule the game hangs on:** your staff only hits what stands in the light. You carry a circle of light, braziers give more, and everything outside it is faster than you and cannot be hit.

Static site: `index.html` plus the atlases in `assets/` (about 5 MB). No build step to play. Add `?fps` to the URL for a frame counter.

## Art and licence

All sprites, tiles and effects are from the open-source [FLARE](https://flarerpg.org/) project ([flareteam/flare-game](https://github.com/flareteam/flare-game)), licensed **CC-BY-SA 3.0**. They are pre-rendered isometric sprites in the Diablo II tradition. See [CREDITS.md](CREDITS.md) for attribution and what was used. Because the licence is share-alike, the files in `assets/` stay CC-BY-SA 3.0.

`tools/build_assets.py` repacks the FLARE sheets into the atlases (it needs the raw files from the FLARE repository and Pillow).

Two earlier versions are kept for reference: the first prototype under [`legacy/`](legacy/), and a flat vector version in the git history.

## How it plays

- **Drag anywhere** to walk. **Dash** with the button (drag it to aim, or tap). Keyboard: WASD or arrows, Space or Shift to dash, P to pause.
- **Let go to cast.** While you stand still the hero turns to the nearest ant inside the light and casts fire bolts. While you run, you do not cast. Ants in the light are slowed. Ants in the dark outrun you.
- **Red ground with a dashed edge is an attack about to land.** Step off it or dash through.
- Kills drop gold. Enough gold gives a choice of three boons. Each boon also mends a little life.
- The more ants are alive, the faster the whole swarm moves. Running without killing gets you run down.
- In the last half minute the light spreads outward. That is dawn.

## Ants

| Ant | What it does |
|---|---|
| **Ant** (small, green) | Rushes you, crouches, then lunges along a marked lane aimed at where you are heading. It stands still before and after |
| **Fire ant** (orange) | Hangs back and spits acid at where you are heading. The landing spot is marked |
| **Antlion** (large, dark) | Charges down a long marked lane, trampling its own swarm. It reels afterwards and takes double damage |

## Boons

- **Staff:** Forked Flame, Heavy Ember, Quick Hands, Lancing Fire, Bursting Bolts
- **Light:** Brighter Flame, Searing Light, Fire Nova
- **Body:** Light Feet, Tempered Plate, Greed

## Accessibility

In **Settings & accessibility** on the title, pause and end screens, saved on the device. Defaults follow `prefers-reduced-motion` and `prefers-contrast`.

- **Motion and flashing:** screen shake, hit-stop, reduce flashing, bodies on or off.
- **Vision and text:** darkness brightness, high-contrast mode (a lighter dark, pale bold attack marks, thicker bars), text size up to 200%, numbers for life and dash, edge arrows for off-screen antlions and fire ants, event captions.
- **Audio and haptics:** master, effects and music volume, vibration.
- **Controls:** dash button side and size, fixed or floating joystick, dead zone.
- **Assists:** game speed down to 55%, damage taken, ant speed, number of ants. Changeable mid-run.
- **Menus:** semantic dialogs, keyboard operable, focus managed, events announced to screen readers. The title, settings, pause, boon and end screens pass axe-core (WCAG 2.2 AA and best practice) with no violations.

Not done: the action itself is visual and is not playable by screen reader; there is no key remapping; it has not been tested with disabled players.

## Status

Difficulty was tuned against scripted bots, not people. Frame rate and load time on real phones have not been measured.
