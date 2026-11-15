# Final validation before modelling

Four comparisons, as asked, and nothing else. **No new walker variants, no game changes, nothing modelled.** Everything is the round-three Bonnet + Cornhead ANVIL and the organic HOOK STALKER, drawn as blockouts with the game's renderer.

- [`validate-mech.png`](validate-mech.png): the walker at the size it is played at
- [`validate-scale.png`](validate-scale.png): the stalker at full size and at 75%
- [`validate-camera.png`](validate-camera.png): 38° against 46°, with ranges and measurements
- [`validate-collision.mp4`](validate-collision.mp4): the pounce, the miss, the pinned blades, the ram (11 seconds: once in real time, once at quarter speed). [`validate-collision-frames.png`](validate-collision-frames.png) is six frames from it.

What none of this is: played. Nobody has held a phone. The clip is scripted, not driven by a thumb, and it has no sound. The numbers below are measured from the renders; the judgements are mine.

## One correction first

In rounds two and three I said the pulled-back camera gave about 23 pixels to the metre, 18 m of ground across the screen, and a walker 28% of the screen wide. That was measured at the point the camera looks at, which is 7.5 m beyond the walker. **Where the walker actually stands it is 28 pixels to the metre, 14.6 m across, and the walker's body is 35% of the screen wide.** The space either side of it is about 4.7 m, not 7. Everything below uses the corrected figures.

## 1. Walker personality against cartoon proportions

**Verdict: the shape is sound and reads as heavy. The face, as approved, does tip toward a toy at gameplay size. One treatment of the same machine fixes most of it.**

At the game camera the body is 144 px across and about 100 px tall on a 412-wide screen; with the forearms forward it is about 230 px corner to corner.

What holds up:

- **The flat shapes are dense.** No thin parts, no gaps, wider than tall from all three headings. Facing the camera you can tell the two arms apart in outline: one ends in a block with barrels, the other in a toothed bar.
- **It does not read as light.** The feet are the widest thing at the bottom of the shape and they show from every heading.
- **The rider reads.** The roll bar and the head are visible from all three headings, including from behind.

What does not:

- **From this camera the legs mostly vanish under the body.** When it faces the camera it is a tractor body with arms and feet, not obviously a walker. That is the camera, not the design, and it is why the walk has to carry it. A still cannot.
- **The nose is a face.** Two round lit lamps either side of a striped grille under a pale hood: at this size that is a friendly tractor.
- **The off-white hood top is the largest bright surface on the machine,** in the middle of it. Bright and clean reads as plastic.
- **The helmet is a white ball.** At about 14 px across it is a toy figure's head.
- **The top surfaces are big, flat and one colour.** From above that is most of what you see.

The second phone frame and the middle row of cut-outs are the same machine with four changes: the lamps boxed in and one of them dead, a welded bar guard over the grille and a bar across the nose, the hood top in bare steel, and a smaller helmet behind low side plates. Same body, same proportions, and an outline that is all but unchanged. I also darkened the paint a step; at this size that made almost no visible difference, so I would not rely on it.

**My read:** the treated face is clearly the better of the two at gameplay size. It still says tractor and it no longer smiles. I would carry these into modelling as requirements, not as a new variant:

1. Lamps are equipment, not eyes: housed, unequal, one working.
2. The grille is guarded.
3. No large pale surface on top. Pale is kept for the rider and the striker tips.
4. The rider is a person in a dull helmet, not a white sphere.
5. Top surfaces are broken up and dirtied, because the top is what the camera sees.

## 2. Enemy scale

**Verdict: 75%.**

Same camera, same three positions, twice: approaching (9 to 19 m out) and closed in (6 to 10 m).

| | Full size | 75% |
|---|---|---|
| Tip of blade to tail | 10 m | 7.5 m |
| Across the hind legs | 4 m | 3 m |
| Knee height | 2.9 m | 2.2 m |
| Side-on, share of screen width | 68% | 51% |
| Three approaching, share of the whole screen | 4.9% | 3.4% |
| Three closed in, share of the whole screen | 7.3% | 5.2% |
| The walker, for comparison | 6.3% | 6.3% |
| Distance it pounces from, if that scales with it | 10.4 m | 7.8 m |

- **At full size, three closed in leave nowhere to step.** Their blades and legs touch the walker and each other. There is no gap to dodge into, so the dodge the whole fight is built on would not exist.
- **At full size, one animal side-on is two thirds of the screen wide.** Two of the three are cut by the screen edge even while approaching.
- **At 75% it is still the bigger body.** 7.5 m long against a walker 5.1 m wide, its back above a person's head, blades as long as a person is tall. Closed in, there is ground visible between all four bodies.
- **At 75% the whole pounce fits on the screen.** The screen shows 7.3 m either side of the walker. A full-size stalker launches from 10.4 m, which to the side is off screen. At 75% it launches from 7.8 m, at the edge.

What 75% costs: the far one, 19 m out, is about 35 px tall and starts to read as an insect, not a threat. I think that is acceptable, because by the time it matters it is closer. Whether it is *frightening* at 75% is not something a still can settle; that comes from how fast it arrives and what happens when it lands.

## 3. Camera readability: 38° against 46°

**Verdict: 38° holds, narrowly. The two are much closer than they look, and the real limit is the same for both: the width of a phone.**

Identical walker, four stalkers (one behind and to the left), light, and 412 × 880 screen. The walker is placed at the same height on screen for both, so the only difference is the angle.

| | 38° | 46° |
|---|---|---|
| Ground either side of the walker | 7.3 m | 7.7 m |
| Ground either side, 20 m ahead | 12.1 m | 11.9 m |
| Pixels per metre in depth, at the walker | 20.9 | 22.2 |
| Pixels per metre in depth, 10 m ahead | 11.9 | 13.7 |
| Pixels per metre in depth, 20 m ahead | 7.7 | 9.3 |
| Ground seen ahead | to the haze | to the haze |
| Ground seen behind the walker | 9.8 m | 9.9 m |
| The walker's height on screen | 101 px | 81 px |
| A stalker's height on screen, 10 m ahead | 53 px | 49 px |
| Ground hidden behind the walker's body | 5.6 m | 4.0 m |
| Cannon ring (11 m) on screen | 29% | 34% |
| Ram ring (6 m) on screen / under a thumb | 100% / 8% | 100% / 9% |
| Walking ring (5 m) on screen / under a thumb | 100% / 0% | 100% / 0% |

**Visibility.** A draw. Both see to the haze ahead and about 10 m behind. 46° shows 0.4 m more to each side at the walker.

**Depth perception.** 46° is better, by 13 to 17% more pixels per metre ahead of the walker. At 38° a circle on the ground is squashed to 74% of its width; at 46°, 83%. Distances toward and away from the camera are harder to judge at 38°. The walker also hides 1.6 m more ground behind itself.

**Body readability.** 38° is better. The walker stands 25% taller on screen and shows its face and legs; the stalker's raised blades stand clear of its body. At 46° both flatten toward plan view. This is the reason to prefer 38°, and it bears directly on the toy question above: the more of the walker's side you see, the more it is a walker.

**Thumb obstruction.** Identical. At both angles the left control sits over ground from 4 m behind the walker and 3.4 m to its left; the right, 5 m behind and 4 m to the right. The stalker placed behind and to the left is entirely under the left thumb at both angles. No angle fixes that. It means **an attack from behind cannot be shown on the ground**; it needs another cue, or the fight should not come from there.

**The finding that matters more than the angle:** only about a third of the cannon's 11 m ring is on screen at either angle, because the screen is 14.6 m wide. Anything to the side beyond 7.3 m is invisible. That is the strongest argument for the 75% stalker.

## 4. Animated collision test

**Verdict: the exchange works and reads, but only with a longer warning than I had planned, and only if the ram is thrown by the torso, not the legs.**

### Timings in the clip

| | Duration | Notes |
|---|---|---|
| Wind-up | 0.90 s | The line locks **when the blades go up**, not later. The body's axis is the warning. |
| Pounce | 0.25 s | 5.5 m. The blades land on where the walker was at the lock. |
| Blades pinned | 0.90 s | |
| Walker | 5 m/s | A 3.2 m step, about 1.9 footfalls a second |
| Brake | 0.33 s | Begun as the animal leaves the ground |
| Ram: cock | 0.22 s | Pressed 0.2 s after the blades land. The left foot steps out as the arm goes back. |
| Ram: strike | 0.12 s | A 1.0 m lunge; the striker comes down on the neck |
| Hold on impact | 0.13 s | |
| Margin left on the pin | 0.36 s | The ram lands 0.54 s into the 0.9 s |

### What it showed

1. **My first timing failed.** With a 0.72 s wind-up and a 0.2 s pounce the walker had 0.92 s and moved 4.6 m, and the stalker landed against its arm. The walker is 5 m wide, but that is not the size that matters: its torso tracks the animal, so its forearms reach 3.4 m toward it. **It has to move about 5.5 m to be clear.** At 5 m/s that needs 1.1 s of warning. The clip uses 1.15 s.
2. **It cannot be dodged from a standstill** at these numbers. Either the fight keeps the walker moving, or only the hull counts as hit and the blades may clip an arm. That is a rule for the build to choose.
3. **The counter only works if the player starts braking as the animal jumps.** A player who waits to see the blades stick, then reacts, is about 7.5 m from it. The ram reaches 6 m. So either the ram carries its own closing step of about 2 m, or the pin lasts nearer 1.3 s. I would do the first: it is a ram.
4. **The legs cannot turn in time.** When the blades stuck, the animal was 110° round from where the walker was heading. The clip throws the ram on the slew ring, the torso turning at up to 150° a second while the legs brace. This agrees with the earlier finding that a tap should ram at what the cannon is tracking.
5. **The miss reads from the game camera.** The raised blades, the landing beside the walker and the blades in the ground are all visible at phone size in real time. The pounce itself is a quarter of a second; you see where it was and where it is.
6. **The impact reads in the close view and only adequately in the game view.** From above, the striker coming down is a small movement. In the build it will need the animal's reaction to sell it: the hold, the body going flat and being shoved a metre are what you actually see.

### What the clip does not prove

- **Feel.** Nothing is under a thumb.
- **Sound, shake, dust.** None, apart from two dust marks.
- **The stalker's gait.** It has no walk cycle; it slides during the stalk.
- **The walker's stop.** Its feet slip slightly as it goes from walking to braced.
- **The red outline is mine,** drawn so the locked line can be checked. It is not a proposal for game UI.

## Carried forward for the build, unchanged

1. The ram should crush only what is pinned, bounce off what is not, and never be a shield.
2. A shell hit has to stop the animal, turn it, or take something off it.
3. A tap rams at what the cannon tracks; a flick overrides.
4. The walk is slower in cadence with a visible drop and sway, and speed is tied to heading.

Added by this round:

5. The warning from lock to landing is at least 1.1 s, and the line locks when the blades rise.
6. The ram is a brace, a slew and a lunge that closes about 2 m by itself.
7. Nothing should attack from where the thumbs are without a cue that is not on the ground.

## What I need from you

1. Whether the treated face (the five points in section 1) goes into the modelling brief.
2. Stalker at 75%: yes or no.
3. Camera at 38°: confirmed or not.
4. Whether modelling is now authorised.
