# Acceptance criteria (active delta)

The build loop reads this file. It holds the criteria for the **current delta only**.
When a delta completes, the next delta's criteria are copied here from its sub-document
in `doc/planning/` (see `plan.md`).

---

## Current target: Delta 0 — clean scaffold

Purpose: produce a clean, building iOS app ready for feature development, and prove the
full write → build → run → verify → commit chain works end to end.

App name: `App` (a placeholder — rename once the app is defined).

### Criteria
1. The repo is git-initialised and the harness files are in canonical layout
   (scripts under `ops/local/`, planning docs under `doc/planning/`, `doc/session-logs/` present).
2. The app builds for the iOS Simulator with no errors.
3. On launch it shows a minimal placeholder screen (e.g. the app name centred).
4. A baseline XCUITest asserts the app launches and the root view exists.
5. A Simulator screenshot confirms the launch screen.
6. The project is generated from `project.yml` via XcodeGen; the `.xcodeproj` is git-ignored.
7. A `justfile` is generated with working `run-local`, `deploy-local`, and `publish` recipes (plus `ExportOptions.plist`), with the app name, scheme, and bundle id filled in. `run-local` is verified to launch the app in the Simulator.

### Done
When 1–5 pass: commit (`feat: clean iOS app scaffold`), update the resume state
(`plan.md`), then **stop** and deliver this handoff message to me verbatim:

> Ok, everything is scaffolded, ready for you to define the app. Try adding a simple
> feature like "Add a button to make the screen go pink" and check that the end-to-end
> harness is working. Then we can work together to define further deltas. The sky is the limit!
