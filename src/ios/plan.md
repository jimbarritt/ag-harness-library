# Plan & resume state

The master plan and single source of truth for "where are we, what's next." Kept current
at all times so any session can terminate and be resumed from a fresh session by typing
**continue**. If this file and the code ever disagree, trust git history and update this file.

## How deltas are organised
- The build proceeds in **deltas** — small, independently shippable increments.
- **Delta 0** is the clean scaffold: a building iOS app ready for feature development.
- Each delta after 0 is defined collaboratively, and **each gets its own sub-document**
  in `doc/planning/`, named `delta-<n>.md`, holding that delta's scope, acceptance
  criteria, decisions, and any device-gated items.
- This file (`plan.md`) is the index + roadmap + resume state.
- The **active delta's** acceptance criteria are mirrored into `doc/planning/acceptance.md`,
  which the build loop reads on every run.
- Never start a new delta autonomously — delta boundaries are stop points (Hard rule 5).

## Delta index
- [ ] **Delta 0 — clean scaffold.** Criteria in `acceptance.md`. *(current)*
- Further deltas: to be defined together, each in its own `delta-<n>.md`.

## Current delta
**Delta 0 — clean scaffold.** Status: not yet started.

## Last completed
- Nothing yet — fresh harness.

## Next step
- Run Delta 0: set up the repo (git init + canonical layout), scaffold a clean, building
  iOS app per `acceptance.md`, verify end to end, commit, then deliver the Delta 0 handoff message.

## Blockers / device-gated items waiting
- None yet.

## Known harness fixes identified, not yet applied
1. Pick the simulator dynamically instead of hard-coding a device name.
2. Default `GENERATE_INFOPLIST_FILE: YES` in the scaffolded `project.yml`.
3. Capture interaction-state screenshots from within the XCUITest, not via `simctl`.
