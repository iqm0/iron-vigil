# Tests

All three run in headless Chromium through Playwright, with WebGL2 on SwiftShader. Nothing here measures frame rate: software rendering says nothing about a phone.

```bash
node tests/checks.js
```
Twenty-five rule checks: seeds repeat, slots and exclusivity, no card multiplies base power, guard armour from the front, the back, staggered and with penetrators, the ram interrupting a wind-up, no invulnerability after the burst, burrows shutting and reopening, each organ's benefit and its cost, growth only with an organ, the mother's two phases.

```bash
node tests/sim.js kite,slow 2 1o
```
Whole runs played by bots, stepped by hand at 60 steps a second from fixed seeds. Arguments: bots (`idle`, `circle`, `kite`, `slow`), number of seeds, which card of each pair to take (`0`, `1`, `r` for random; add `o` to accept the organ). Prints one line of JSON per run. The bots do not flank and ram only burrows, so they are a floor on what a build can do, not a measure of difficulty.

```bash
node tests/shots.js
```
Seventeen staged frames at 412×880 and 360×780 from a fixed seed, written to `tests/out/` (not committed): title, start, salvage, both choice panels, a fitted module, a grown organ, the relay, a burrow open and shut, the guard walking and staggered, the mother in both phases, pause, and the end screen.

Hooks the game exposes for these: `setSeed(n)`, `advanceTime(ms)`, `render_game_to_text()` (state, seed, items, choices, the current offer, and what the last frame drew: instances, batches, sprites, decals). `?seed=7` in the address does the same as `setSeed(7)`; `?fps` shows the frame counter with the same draw counts.
