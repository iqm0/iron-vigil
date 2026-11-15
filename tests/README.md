# Tests

Everything here runs in headless Chromium through Playwright, with WebGL2 on SwiftShader. Nothing here measures frame rate, and nothing here can tell you how the game feels.

```bash
node tests/checks.js
```
Thirty rule checks on the encounter: a seed repeats; nine shells kill, each a shove, none cancels a wind-up; blades come off at set health; the line locks when the blades rise; standing in it costs hull and stepping off it does not; one attacker at a time until the last wave; what the ram does at each stage; a miss leaves the walker sliding with the cannon down; the one salvage choice; four waves and nine animals.

```bash
node tests/approved-slice-checks.js
```
Eleven checks on the changes approved after the concept validation: the camera looks down at 38 degrees from 30 m with the walker low in the frame; the animal is at 75%; a tap on the ram goes at what the cannon tracks; the ram gives no invulnerability; a pinned animal in front and in range gets a 2 m closing step and nothing else does; a cancelled touch does not fire the ram; the walker casts no shadow of its own from its lamp.

```bash
node tests/behaviour.js
node tests/behaviour.js --camera=46
```
Thirty-nine checks of what happens, each driving the game and reading the result: the dodge from a standstill after 250, 350 and 1000 ms of reaction time, from eight sides; the leap giving the same result at 30, 60 and 120 steps a second, covering the same ground, never hitting twice; damage landing in the ram's wind-up, burst and recovery; what a tap on the ram goes at; the closing step, including losing it when the animal pulls free; the cue for a wind-up that is off the screen or under a control, for both hands; the resolution policy; real touch sequences with two and three fingers, a cancelled touch and a lost window; and the graphics context being taken away and given back.

```bash
node tests/mutants.js
```
Breaks nineteen rules on purpose, one at a time, in a throwaway copy, and reports whether the check meant to guard each one fails. A check that passes against its mutant proves nothing. Takes about ten minutes.

```bash
node tests/dodge.js
```
Measurements, not pass or fail: how late a sidestep from rest can begin and still avoid damage, or avoid touching the animal at all, at normal and assisted speed; which wrong moves are punished; where the edge of the hit is and whether the frame rate moves it.

```bash
node tests/matrix.js
```
The game at six screen sizes and pixel ratios, including on its side: it draws, the walker and the ram button are on screen, turning the screen and turning it back breaks nothing, and hiding the page pauses it, lets go of the stick, and resumes without the walker drifting. It prints frame times from the software renderer so that a change which doubles the work is noticed; they are not phone frame times.

What these do not prove: `checks.js` and `approved-slice-checks.js` mostly read state after scripted steps, and a few read constants (they say so in their names). Nothing here involves a person's eyes or thumbs, real reaction times are an assumption fed in, and every frame is drawn by a software renderer, so no timing here says anything about a phone.

```bash
node tests/sim.js 3
```
Whole runs by three bots from fixed seeds: one that dodges and rams anything stuck, one that dodges and never rams, one that never moves. One line of JSON per run, with peak drawn instances. As of the review follow-up (the leap covering its full length at every frame rate), the bot that never moves dies in all three runs, the bot that dodges is hit once in three runs, and the bot that rams crushes eight or nine of nine without being hit. A bot reacts on the frame the line appears, so the last two say the rules allow a perfect run, not that a person will have one.

```bash
node tests/shots.js
```
Eighteen staged frames at 412×880 and 360×780, written to `tests/out/` (not committed). A selection is in `screenshots/`.

```bash
node design/blockouts/sheet.js
```
Renders the three walker blockouts and the walker in the game as flat black silhouettes and lit, in four poses, at the game's camera.

Hooks the game exposes: `setSeed(n)`, `advanceTime(ms)`, `render_game_to_text()`. `?seed=7` in the address repeats a run; `?camera=46` uses the steeper camera for comparison; `?fps` shows the frame counter and what each frame drew.
