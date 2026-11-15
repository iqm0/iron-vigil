# WebGL/Platform Engineer — Agent Handoff

**Tickets:** ENG-01

## Assignment
Provide clean but minimal interfaces for upgrades, camera and model variants; deterministic seed and performance tooling. No total engine rewrite; profile before adding lighting/shadow effects.

## Required deliverables
Small tested architecture patch, QA hooks, per-device FPS results, failure/restore tests, compatibility notes.

## Success gate
The work must directly improve player choice, legibility or world identity without adding unnecessary complexity. It must be objectively reviewed in a playable integrated build, not approved because it looks good in isolation.

### Shared instructions
- Read `../MASTER_REDESIGN_BRIEF.md` before starting. Preserve portrait one-thumb mobile and procedural WebGL2 scope.
- Explicitly state **CUT / KEEP / CHANGE / ADD** for your area. Avoid adding content until the base interaction is fun.
- Do **not** directly overwrite another agent's changes to `js/game.js` or `js/engine.js`. Agree a merge plan with Producer.
- Deliver no false statements: separate observed code/screenshot facts from recommendations and untested hypotheses.
- Every task must include an acceptance test at 360×780 and/or real phone when applicable, accessibility/performance notes and proof of function.
- Submit: proposal, minimal implementation (only when assigned), test evidence, risks, integration notes and any deletion decisions.
