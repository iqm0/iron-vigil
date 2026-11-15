# LAST LIGHT — CLAUDE HANDOFF: READ THIS FIRST

This is a consolidated planning, visual-design and technical execution package for the game **Last Light**. It combines both prior agent packs, the user-provided original screenshot references, and a standalone experimental WebGL2 blockout viewer. **No game source code is included in this ZIP and the redesign has not been implemented.**

## Your assignment
Act as game director and engineering integrator. Critically evaluate the existing implementation, using the files here as *design proposals*, not unchallengeable requirements. Prioritise fun, clarity, originality, and mobile performance over feature count. Organise work into specialist agents and produce code changes in the actual repository when available, one vertical slice at a time.

## Read in this order
1. `01_GAME_REDESIGN/MASTER_REDESIGN_BRIEF.md` — comprehensive diagnosis, CUT/KEEP/REWORK audit of all 19 existing upgrades, combat and progression redesign, production gates and decisions.
2. `02_VISUAL_WEBGL_PRODUCTION/ART_AND_WORLD_BIBLE.md` — original mech/enemy silhouettes, guns, props, stage ideas, art rules and scale.
3. `02_VISUAL_WEBGL_PRODUCTION/WEBGL2_IMPLEMENTATION_GUIDE.md` — source-aware mesh construction, hierarchies, procedural modelling and integration with existing renderer.
4. `02_VISUAL_WEBGL_PRODUCTION/AGENT_EXECUTION_TICKETS.md` — concrete roles, dependencies and tests for visual and engine work.
5. `01_GAME_REDESIGN/roles/` — 11 agent-specific game-design and implementation briefs.
6. `03_REFERENCES/last-light-screenshots/` — **user's original** 50 screenshots and their README, not invented reference images.
7. `02_VISUAL_WEBGL_PRODUCTION/CONCEPT_MESH_VIEWER.html` — standalone experimental geometry blockout; visually inspect before adopting. The concept viewer has not been validated with a WebGL2-capable test browser.

## Actual project repository
Reference repository in briefs: https://github.com/iqm0/iron-vigil . Treat all references to current implementation as dated observations (15 November 2026); inspect the latest checked-out source before making edits. Do **not** assume the repository has been included in this handoff.

## Immediate decision and execution protocol
- Start by checking repository status and structure, inventorying gameplay, geometry and rendering functions. Do not overwrite unrelated work.
- Establish baseline captures, tests and mobile FPS before changing game systems.
- Recommend and implement a **90-second playable first-stage vertical slice**: substantial pilot-operated industrial mech with cannon recoil + physical ram, readable Hookrunner and Acid Carrier enemies, authored Relay Yard, meaningful salvaged upgrade choice and one organic mutation with a cost.
- Separate gameplay state and collisions from rendered geometry. Keep WebGL2 procedural geometry unless measured evidence supports migration.
- No engine rewrite, imported packages, additional buttons, more bosses, or new currency loops without design justification.
- Work in distinct agent branches/tasks and merge in documented order to avoid `js/game.js` conflicts.
- Follow acceptance criteria, mobile visual readability checks and frame-time budgets in the supplied tickets.
- Record every deviation from the design documents with rationale and verification evidence.
- For contested decisions, present the smallest testable alternative, not scope expansion.

## Deliverables Claude should return
1. A concise audit of which proposals are feasible with the current code and which need correction.
2. A ranked CUT / KEEP / REWORK / ADD backlog with source references and file ownership.
3. Agent assignments and dependencies for P0 vertical slice.
4. Proposed geometry/module/data interfaces and concrete diffs where source access exists.
5. Screenshots or in-browser verification from a WebGL2-capable environment, plus phone performance results if available; otherwise explicitly flag unverified items.
6. A first playable build only after the integration gates pass.

## Copyright / visual direction
Inspired by the design principles of *Suits* (Love, Death & Robots S1E4): tangible improvised industrial machinery, human vulnerability, overwhelming insectoid threats and a community/outpost worth protecting. Produce **original** silhouettes, story, weapons, props and environments. Do not copy its character designs or shots.

## Source provenance
- `03_REFERENCES`: user-provided screenshots, unchanged.
- `01_GAME_REDESIGN`: prior critical review and agent directives.
- `02_VISUAL_WEBGL_PRODUCTION`: prior proposed art/technical implementation and prototype viewer.
- This handoff file: integration and reading instructions, not verified game-source findings.
