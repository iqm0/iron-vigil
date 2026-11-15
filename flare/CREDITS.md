# Credits

## Art

All sprites, tiles and visual effects in `assets/` (this folder) come from **FLARE** (Free Libre Action Roleplaying Engine), the `flare-game` project:
https://github.com/flareteam/flare-game — https://flarerpg.org/

They are licensed **Creative Commons Attribution-ShareAlike 3.0 Unported (CC-BY-SA 3.0)**:
https://creativecommons.org/licenses/by-sa/3.0/

The art was made by the FLARE art team, including Clint Bellanger (https://clintbellanger.net), Justin Jacobs, Stefan Beller, Brandon Morris, Justin Nichol, Jessica Cox, remaxim, rubberduck, Sarah Benalene, Holly Daniel, Blarumyrran and Scrittl, with additional open-licensed art from the contributors listed in FLARE's own `CREDITS.txt`.

What is used here, all from `mods/fantasycore` in that repository:

| In this game | FLARE source |
|---|---|
| The armoured hero | `images/avatar/male/` plate armour set and `greatstaff` |
| Ants, fire ants, antlions | `images/enemies/antlion_small.png`, `fire_ant.png`, `antlion.png` |
| Cave floor, stalagmites, rocks, mushrooms, crates | `images/tilesets/tileset_cave.png` |
| Brazier | `images/tilesets/tileset_dungeon.png` |
| Fire bolt, burst, sparks, acid spit, quake | `images/powers/` |
| Gold and potion | `images/loot/` |

### Changes made

The original sprite sheets were cropped to the animations this game uses, the hero's equipment layers were flattened into single frames, and everything was repacked into the WebP atlases in `assets/` by `tools/build_assets.py`. No artwork was redrawn or recoloured.

Because the licence is share-alike, the files in `assets/` are themselves licensed CC-BY-SA 3.0. If you reuse or modify them, keep this attribution and the same licence.

## Code

The game code in this folder (`index.html`, `tools/`) was written for this project and is not derived from FLARE's engine.

## Sound

All sound is synthesised in the browser at run time. There are no audio files.
