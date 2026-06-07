# Harness Library — plan & session-resume state

The task list and current pointer for work on this library. Read this at the start of any
session; type **continue** to pick up from the "Currently working on" entry.

If this file and the repo state ever disagree, trust the repo and update this file.

---

## Currently working on

**Task 5 — Release next iOS harness version.** All improvements applied to `src/ios/`.
Next step: `just bump ios minor` then `just push-tags` to release `ios-v0.2.0`.

---

## Task list

- [x] **Task 0 — Settle source layout.** Decided on `src/<platform>/` (dropped the `md/` grouping level). iOS harness files moved to `src/ios/`.
- [x] **Task 1 — Repo foundations.** CLAUDE.md, README.md, and this plan written.
- [x] **Task 2 — Release pipeline.** Tag-triggered GitHub Actions workflow (`release.yml`), `just bump <harness> <level>` recipe, `src/ios/.meta` version file, ADR 0002 written.
- [x] **Task 3 — iOS harness improvements.** All applied to `src/ios/`:
  1. Simulator selected dynamically via `ops/local/sim-dest.sh` (sorts by iOS version, guards against empty).
  2. `GENERATE_INFOPLIST_FILE: YES` added to `project.yml` template in CLAUDE.md Step 3.
  3. Screenshots captured from within XCUITest via `XCTAttachment` + `xcresulttool` extraction.
  4. Bundle ID sanitisation — three naming rules (display name, product name, bundle ID segment).
  5. `gitignore.template` pre-canned and renamed in Step 0.
  6. `python3` hard check added to preflight.
  7. SwiftUI XCUITest element query guidance added (`descendants` not `otherElements`).
  8. Agent no longer commits — hands off to user with exact commands in the Delta 0 message.
  9. Steps reordered: session log → update plan → hand off (commit last, done by user).
  10. `HARNESS_VERSION` stamped into `plan.md` by preflight, then moved to `doc/`.
- [ ] **Task 4 — Release ios-v0.2.0.** Run `just bump ios minor` then `just push-tags`.
- [ ] **Task 5 — Test ios-v0.2.0.** Run the harness in a fresh directory and review the session log.
- [ ] **Task 6 — Common block extraction.** Once a second harness exists, identify shared content and extract into `src/common/`. Not yet — YAGNI.

---

## Decisions made

- Source layout: `src/<platform>/` — no middle grouping level. Add `src/<platform>/<variant>/` only when two variants of the same platform exist.
- Build tool: `just` recipes (not a standalone build script).
- Versioning: per-harness tags (e.g. `ios-v0.2.0`). Tag-triggered releases — no auto-bump on every commit.
- Version stamped into the artefact so consumer repos record which harness version seeded them.
- Agent never commits in Delta 0 — commit is user's responsibility, instructions delivered in handoff message.
- Simulator selection via `ops/local/sim-dest.sh` (bash, not a just recipe — just is for build/deploy interactions).
