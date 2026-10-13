# Direct command 1.3 — validation

2026-10-13. New runtime: direct-core.js over the geographic engine. No new services or runtime dependencies.

## Behavior
- Two independent starting armies, funded from existing reserves.
- Select map army / roster, then choose a city; continuous adjacent-grid route, automatic sea transport, attack and arrival guard.
- Selection, rerouting, per-unit hold, reinforcement and recruiting (up to six units).
- Nearby guarding soldiers absorb enemy attacks. Air strikes also affect independent home / transport troops.
- Victory requires controlling all three goal cities. Preparation still allows friendly movement.
- v4 saves retain routes and identities; v3 progress migrates without overwriting its original localStorage key. Legacy 1.1 unchanged.

## Verified
- 105 automated tests passed, including 11 new meaningful direct-command tests: independent movement, hold and retarget, pause, invalid orders, manpower conservation, transport identity and capture/arrival, save validation/migration, real guarding, three-city win and victory save roundtrip, air-strike shelter effect.
- Root Pages build and independent game build succeeded; git diff --check clean.
- Actual desktop browser: clicked map First Army then Kaohsiung, Second Army then Taipei; independently moved and arrived. Held and retargeted Second Army. Declared war, First Army traveled from Kaohsiung and captured Fuzhou, then guarded there; second remained independently at Taipei.
- Actual 390×844 browser layout: map army selection and Kaohsiung order; reload/continue preserved both units and the pending order. No captured warning/error console entries.
- Screenshots stored outside the published bundle in CounteroffensiveFront/qa/direct-command/.

Automated win is model evidence. Browser testing covers direct movement, attack and arrival, not a full human-played victory. These checks do not claim the player will find the game fun. Touch-device hardware and manual pinch/drag gestures were not tested.
