# Enemy AI / Encounter Designer — Agent Handoff

**Tickets:** AI-01, AI-02

## Assignment
Define explicit tells, states, vulnerability and counterplay for Stalker, Spitter, Guard and Mother. No new mobs until differences are observable. Ensure enemy combinations are fair.

## Required deliverables
Four enemy state diagrams, counterplay scenarios, boss phase sheet, spawn director table, failure-case test matrix.

## Success gate
The work must directly improve player choice, legibility or world identity without adding unnecessary complexity. It must be objectively reviewed in a playable integrated build, not approved because it looks good in isolation.

### Shared instructions
- Read `../MASTER_REDESIGN_BRIEF.md` before starting. Preserve portrait one-thumb mobile and procedural WebGL2 scope.
- Explicitly state **CUT / KEEP / CHANGE / ADD** for your area. Avoid adding content until the base interaction is fun.
- Do **not** directly overwrite another agent's changes to `js/game.js` or `js/engine.js`. Agree a merge plan with Producer.
- Deliver no false statements: separate observed code/screenshot facts from recommendations and untested hypotheses.
- Every task must include an acceptance test at 360×780 and/or real phone when applicable, accessibility/performance notes and proof of function.
- Submit: proposal, minimal implementation (only when assigned), test evidence, risks, integration notes and any deletion decisions.
