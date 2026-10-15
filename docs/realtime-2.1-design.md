# Realtime restoration and world feedback — 2026-10-15

The player rejected the hex campaign and explicitly requested the previous realtime game, less predictable events, meaningful mainland responses, more time, a weekly progress bar, and retention of the readable right-side country status interface. The implementation stays in the existing game and reuses its art and stories.

- Default entry uses the 1.11 realtime command chain. Archive the independent hex entry at `counteroffensive/hex.html` and retain its separate storage.
- `world-dynamics.js` wraps the existing world core. Default pace is 0.5 simulation seconds per real second, with an explicit 2x option. One week is 30 simulation seconds. Preparation has no fixed week deadline.
- Fresh openers come from eligible authored starters; seeded timing varies for both starters and followups. Already scheduled old-save stories are preserved.
- Mainland intent follows player state, announces a 6–12 simulation second lead, then changes actual diplomacy, exposure, funds or map forces. No spontaneous peacetime invasion. A 50-fund peacetime action can cancel an unexecuted response; already spawned forces remain.
- `campaign-ui.js/css` provide the persistent desktop country rail and the weekly timeline. Mobile rail is collapsible. Map canvas is physically resized on desktop, preventing the rail from masking its hit targets.
- v8 saves contain the seeded campaign state, deadlines and response history. v7 keys are read without overwriting them. Native mainland ground forces pass the existing naval save decoder with canonical paths and bounded strength.

Verification covers simulated pace, pause, random eligibility, reaction delay/effects, de-escalation, save replay and invalid import. Browser validation must separately check actual input, readable bounds, event artwork, movement, mainland units, import/export and the public release. Tests do not establish player enjoyment or human play duration.
