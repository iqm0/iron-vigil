# Codex takeover baseline — 15 November 2026

Base: `01e21b39f46e5c399e7d938e336ae9bb247df996`, fetched from `origin/main`.
The checkout was clean, with no changes since the handoff snapshot. The GitHub
search returned no open pull requests. Work is isolated on
`codex/last-light-vertical-slice`; main has not been modified.

## Decision

**No-go for expanding the encounter.** This change set establishes verification
and capture infrastructure. It delivers no visual or gameplay improvement, and
does not complete the requested vertical slice. ANVIL, the organic Hook Stalker,
animation, sound and human/device quality gates remain outstanding.

## Changes

- Explicit `LAST_LIGHT_CHROMIUM` override for managed Chromium installations.
- Optional ephemeral loopback HTTP serving, including each mutant's own checkout;
  pinned Playwright Chromium and file URLs remain the defaults.
- Baseline runner retains complete output, exits, timings and environment metadata
  for all nine documented commands. It continues after a failing command and
  returns nonzero if any command fails or reports errors.
- Rule checks and capture/measurement scripts return nonzero on page errors;
  mutation baselines now reject launch crashes rather than interpreting absent
  `FAIL` lines as a passing unbroken game.
- Portrait real-time keyboard recording with separate wall and game clocks.
- Full deterministic bot replay exporter: 60 Hz simulation, 15 fps image sampling
  and playback, with final outcome, frame count and peak-instance metadata.

Files: `tests/browser.js`, `baseline.js`, `record.js`, `replay.js`, existing test
entry points and `tests/README.md`. Gameplay, engine, tuning, camera, scenery and
art are unchanged. Version A ram behaviour is preserved; no arbitrary nerf was
introduced.

## Source and visual gaps

| Priority | Evidence | Next minimal step |
|---|---|---|
| Critical | `drawMech()` still uses yellow `MBODY`, a corner bucket, three long barrels and the earlier proportions. Both portrait captures visibly confirm this. | Build the approved hardened Bonnet/Cornhead articulated asset; validate phone silhouettes before switching it on by default. |
| Critical | `drawShear()` and `shearArms()` still draw the earlier narrow thorax and broad sideways blade wind-up, rather than the approved organic haunches/head and forward raised picks. | Produce one organic stalker asset at the approved scale, preserving explicit collision geometry. |
| High | Existing foot state/IK is implemented; this alone does not prove planted motion. Ram feet explicitly slide in the current code. | Review acceleration, turns, stopping and ram bracing in a correctly timed replay; add contact/collider overlays during asset integration. |
| High | Synthesised sound is inherited; no listening or human timing test was conducted. | Author and listen to distinct tell, leap, pin and crush feedback after the visible exchange reads. |
| High | No first-time player, disabled-player or phone session is available. Bots react on the first warning frame. | Observe real warning → dodge → counterattack sessions and one lower-capability phone. |
| Medium | The farm landmarks are visible in current captures; their readability during crowded combat and thumb occlusion remains a human judgement. | Recheck composition after larger approved hero geometry is integrated, retaining both camera angles. |

## Evidence and reproducibility

See `tests/README.md` for capture commands. Default generated outputs are ignored
under `tests/out/`; preserve the baseline directory before producing an after set.
The delivery packet includes raw logs and metadata. No before/after art comparison
is claimed: there is no after asset yet.

Environment: Linux, Node v24.22.1, Debian Chromium 156.0.8078.79,
Playwright 1.62.1, SwiftShader WebGL2, loopback HTTP. Browser processes require execution outside the
workspace sandbox here. No physical device, mobile OS/browser or subjective audio
coverage. Tests exercising touch use synthetic browser events.

Initial `node tests/checks.js` exited 1 because Playwright's pinned headless shell
was absent. A system-browser attempt exited 1 because managed policy blocks file
URLs. An in-sandbox system-browser launch also failed on process socket access.
The explicit system-browser + HTTP configuration resolves those infrastructure
failures without changing the game.

`tests/record.js` exited 1 on its first attempt because the matching Playwright
FFmpeg binary was absent. After installing revision 1011 it completed both
viewports without page errors. Approximately 74 seconds of wall time advanced
only 12–17 seconds of game simulation. These are partial keyboard-run recordings,
not full encounters and not evidence of intended real-time movement quality.
`tests/replay.js` exists to make full, correctly sampled simulation films instead.

Software timing figures from the viewport matrix are unsuitable as performance
comparisons: recording work overlapped part of that run. No phone FPS is claimed.

## Publishing limitation

Git push returned HTTP 403 (`Permission ... denied`). The GitHub connector's
branch creation also returned HTTP 403 (`Resource not accessible by integration`).
No remote branch or PR was created. This is a GitHub access limitation, not a
sandbox approval rejection. Plugin permission inspection confirms GitHub already
allows actions in ChatGPT, but GitHub returned no accessible app installations.
The local commits and format-patch delivery can be
applied to a fresh branch based on the exact base above. Review the latest
`origin/main` before applying; do not reset or overwrite newer work.

## Commands actually run

Successful managed-browser commands use both
`LAST_LIGHT_CHROMIUM=/usr/bin/chromium` and `LAST_LIGHT_HTTP=1`.

- `node tests/baseline.js`: runs `checks.js`, `approved-slice-checks.js`,
  `behaviour.js`, `behaviour.js --camera=46`, `dodge.js`, `matrix.js`, `sim.js 3`,
  `shots.js tests/out/baseline/shots`, and `mutants.js`. Exact commands, elapsed
  times, exits and logs are retained in `results.json` in the evidence packet.
- `node tests/record.js`: both portrait keyboard recordings, exit 0 after encoder
  installation; both remained in play at the capture limit.
- `node tests/replay.js`: full bot films; see per-viewport JSON for completion and
  frame counts. The first exporter run emitted a Node listener-count warning;
  the final source uses `events.once` so backpressure listeners are removed.
- `node tests/mutants.js 'a shell'`: final mutation-harness smoke check, exit 0;
  all three unbroken suites pass and the flinch mutant is caught.
- `LAST_LIGHT_CHROMIUM=/does-not-exist node tests/mutants.js 'a shell'`: intentional
  infrastructure-failure check, exit 1; all baseline failures are reported and
  mutation testing aborts. Also attempted within the sandbox, where subprocess
  restrictions were reported; the clean failure result above was rerun outside it.
- `node --check` on all five new/changed harness modules and `git diff --check`:
  exit 0.

Observed bot results differ slightly from the historical README: the dodge-only
bot took no hits across three runs here. The ace bot won three runs with 8–9
crushes and zero hits; the stationary bot lost all three with seven kills.
No gameplay source changed, and this observation is not evidence for retuning.
A seed alone is not a guarantee of identical results across different render and
input schedules: the replay exporter renders more frequently than `sim.js`.


## Completed film evidence

Both full bot films completed successfully at 360×780 and 412×880. Each contains
829 frames at 15 fps (55.266667 seconds including simulated freezes), and reaches
the same final state: victory, nine kills, eight crushes, 100 hull. Sampled peak instances:
430. Both JSON files report zero page errors; independent FFmpeg decoding exits 0
and ffprobe confirms dimensions, rate and frame count. The game clock excluding
freezes reports 54.4813 seconds after applying PACE. Motion was inspected through
sampled film frames; no human real-time animation acceptance is claimed.

The staged screenshot run generated all 36 expected PNGs (18 at each viewport),
with zero page errors. Real-time recordings, complete bot films and staged frames
are separate evidence sets; none is labelled as a real-device playtest.


## Final baseline results

Every command below exited 0; no game page errors were reported.

| Command | Observed result |
|---|---|
| `node tests/checks.js` | 30/30 checks pass |
| `node tests/approved-slice-checks.js` | 11/11 checks pass |
| `node tests/behaviour.js` | 39/39 checks pass |
| `node tests/behaviour.js --camera=46` | 39/39 checks pass |
| `node tests/dodge.js` | Measurements complete; 250/350 ms sidesteps unharmed in 24/24 sampled cases each; no duplicate leap hits or disagreement across 20/30/60/120 Hz in the sampled crossing cases |
| `node tests/matrix.js` | All six viewport/DPR configurations pass |
| `node tests/sim.js 3` | Nine bot runs complete, zero page errors |
| `node tests/shots.js tests/out/baseline/shots` | All 36 PNGs generated, zero page errors |
| `node tests/mutants.js` | 19 caught, zero missed, zero problems; 737.9 seconds |

The complete run preceded the final mutation-runner reporting/cleanup extraction;
the final runner was then checked with the targeted flinch mutant and deliberate
browser-launch failure described above. No encounter rule or assertion was
changed. A fresh fetch after implementation still found main at the exact base.

To publish once repository write access is available, push the Codex branch and
open a draft PR using `design/reviews/BASELINE_PR.md` as its body. Do not merge by
default. To apply the delivery elsewhere, create a separate branch at the exact
base and run `git am last-light-baseline.patch`; inspect newer main changes before
rebasing. Patch application is independently verified in the delivery manifest.
