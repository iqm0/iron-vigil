# Tests

All three run in headless Chromium through Playwright, with WebGL2 on SwiftShader. Nothing here measures frame rate, and nothing here can tell you how the game feels.

```bash
node tests/checks.js
```
Thirty-one rule checks on the encounter: a seed repeats; nine shells kill, each a shove, none cancels a wind-up; blades come off at set health; the lane appears only for the last third of a second; standing in it costs hull and stepping off it does not; one attacker at a time until the last wave; what the ram does at each stage; a miss leaves the walker sliding with the cannon down; the one salvage choice; four waves and nine animals.

```bash
node tests/sim.js 3
```
Whole runs by three bots from fixed seeds: one that dodges and rams anything stuck, one that dodges and never rams, one that never moves. One line of JSON per run, with peak drawn instances.

```bash
node tests/shots.js
```
Eighteen staged frames at 412×880 and 360×780, written to `tests/out/` (not committed). A selection is in `screenshots/`.

```bash
node design/blockouts/sheet.js
```
Renders the three walker blockouts and the walker in the game as flat black silhouettes and lit, in four poses, at the game's camera.

Hooks the game exposes: `setSeed(n)`, `advanceTime(ms)`, `render_game_to_text()`. `?seed=7` in the address repeats a run; `?fps` shows the frame counter and what each frame drew.
