# SDD ledger — plan: 2026-10-15-hex-turns.md
Ruling: explicit user implementation/publication authorization takes precedence over repeated skill approval gates. Keep written design and plan reviewable, proceed inline. No new worktree is needed; dedicated publishing checkout was clean on its existing feature branch and is now on a new scoped branch.
Pre-flight: grid keys are strings shared by core/map/save; city display coords remain real while combat keys use hex centers. Event delays and project timers are integer turns, UI animation time never changes turn count.
Tasks 1–5: pending.

Tasks 1–3 implemented. 30 hex checks PASS. Fresh review identified carrier AP, unreachable sea highlights, free guard, incomplete save shape/canonical goals, duck income and old seconds/deterrence mismatch. Each reproduced RED then repaired GREEN. Empty ferries now spend their own AP to approach boarding; cities use building frame2. Native source remains in publishing branch; old realtime page unchanged.
