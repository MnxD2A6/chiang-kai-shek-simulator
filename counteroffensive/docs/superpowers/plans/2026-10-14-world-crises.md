# World Crises Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Make preparation a continuing sequence of world crises, diplomatic tradeoffs and a playable abstract secret research project.

**Architecture:** Add a deterministic world layer around operations-core. Keep authored event data separate from simulation and DOM presentation. Small integration hooks connect support, income, combat and saved endings to existing systems.

**Tech Stack:** Existing static HTML/CSS/JavaScript, Node built-in tests, GitHub Pages.

**Spec:** ../specs/2026-10-14-world-crises-design.md

## Global Constraints

- Zero new runtime dependencies; preserve existing combat and real geography.
- Three world UI tabs, maximum three choices per event, always a free choice.
- Abstract research only; no real weapon manufacture or surveillance evasion detail.
- New v7 save key; retain v3–v6 migration and original save keys.
- Browser tests use visible controls; do not inject game state or saves.

## Review Focus

- Reload while a major event is pending: same choices and pause persist, no double rewards.
- No money: decisions remain actionable and research pauses safely.
- Diplomacy changes during an overseas campaign: ships and armies remain valid, support loss is visible.
- Exposure can be reversed through a costly choice; nuclear use remains in history and has persistent consequences.
- Mobile and simultaneous game dialogs: objectives and choices remain reachable, time does not run behind a decision.

### Task 1: Event simulation and research

Files: create world-events.js, world-core.js, tests/world.test.cjs; modify strategy.js for support, sanctions and deterrence.

Interfaces: worldChoice(s, token, choice), worldAction(s, key, target), startResearch(s), researchMode(s, mode), publishDeterrent(s), nuclearStrike(s); wrapper createStrategic / step / encode / decode. F.worldEvents provides authored event metadata.

- [x] Write and run failing state-transition tests.
- [x] Implement authored branching events, world clocks, research, diplomacy and combat consequences.
- [x] Run the new rules tests and old regression suite; repair actual failures.

### Task 2: Player interface and game integration

Files: create world-ui.js, world-ui.css; modify index.html, app.js, strategy-ui.js, geo-map-view.js, scripts/build.cjs and package.json.

- [x] Add three-tab world panel, automatic event dialog and simple research controls.
- [x] Show consequences and pending followups; connect map countries and existing cooperation.
- [x] Integrate v7 storage, pause handling, special endings and map annotations.
- [x] Manually play a continuous story / research slice, including restore and narrow viewport.

### Task 3: Delivery

- [x] Run root tests and both builds, record actual-play evidence and limitations.
- [ ] Update README / QA, commit scoped files and publish to existing Pages site.
- [ ] Verify deployed run, public gameplay, key file bytes, mirror and archives.

Ruling: prior user authorization covers updating the existing GitHub Pages site. Each of34 events receives a unique original poster; the existing map art remains. Fresh final review found3 P2 defects; all reproduced and fixed. Root162 tests and both builds passed. Browser play reached02:24 research,03:18 negotiated ending; genuine exported save used for nuclear-use branch with3 intervention ships. Narrow390x844 event checked.
