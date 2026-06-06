# Acceptance criteria (active delta)

The build loop reads this file. It holds the criteria for the **current delta only**.
When a delta completes, the next delta's criteria are copied here from its sub-document
in `doc/planning/` (see `plan.md`).

---

## Current target: Delta 0 — clean scaffold

Purpose: produce a clean, building iOS app ready for feature development, and prove the
full write → build → run → verify → commit chain works end to end.

The app name and bundle ID are confirmed with the user in Step 1 before scaffolding begins.

### Criteria
1. The repo is git-initialised and the harness files are in canonical layout
   (scripts under `ops/local/`, planning docs under `doc/planning/`, `doc/session-logs/` present).
2. App identity (display name and bundle ID) is confirmed with the user and recorded in `doc/planning/plan.md`.
3. The app builds for the iOS Simulator with no errors.
4. On launch it shows a minimal placeholder screen with the app name centred.
5. A baseline XCUITest asserts the app launches and the root view exists.
6. A Simulator screenshot confirms the launch screen.
7. The project is generated from `project.yml` via XcodeGen; the `.xcodeproj` is git-ignored.
8. A `justfile` is generated with working `run-local`, `deploy-local`, and `publish` recipes (plus `ExportOptions.plist`), with the confirmed app name, scheme, and bundle id filled in. `run-local` is verified to launch the app in the Simulator.

### Done
When 1–8 pass: commit (`feat: clean iOS app scaffold`), update the resume state
(`plan.md`), then **stop** and deliver this handoff message to me verbatim:

> Ok, everything is scaffolded, ready for you to define the app. Try adding a simple
> feature like "Add a button to make the screen go pink" and check that the end-to-end
> harness is working. Then we can work together to define further deltas. The sky is the limit!
