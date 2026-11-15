The takeover baseline could not run in a managed Chromium environment because
the pinned Playwright browser was absent and system Chromium blocks file URLs.
This adds explicit browser selection and optional loopback HTTP, a full-suite
runner with retained logs/exits, and portrait recording/replay tools. Mutation
baselines now reject infrastructure crashes; rule checks return failing exits.

No gameplay or art changes are included. The approved ANVIL and Hook Stalker
assets remain the next required change set. See `CODEX_BASELINE.md` for evidence,
limitations and the remaining quality gates. No phone, human playtest or audio
validation is claimed.

Validation commands and raw results are in the accompanying baseline evidence
packet. Generated artifacts remain under ignored `tests/out/` directories.
