# Harness Library — plan & session-resume state

The task list and current pointer for work on this library. Read this at the start of any
session; type **continue** to pick up from the "Currently working on" entry.

If this file and the repo state ever disagree, trust the repo and update this file.

---

## Currently working on

Nothing active — ready for next task.

---

## Task list

- [x] **Task 0 — Settle source layout.** Decided on `src/<platform>/` (dropped the `md/` grouping level). iOS harness files moved to `src/ios/`.
- [x] **Task 1 — Repo foundations.** CLAUDE.md, README.md, and this plan written.
- [x] **Task 2 — Release pipeline.** Tag-triggered GitHub Actions workflow (`release.yml`), `just bump <harness> <level>` recipe, `src/ios/.meta` version file, ADR 0002 written.
- [ ] **Task 3 — iOS harness fixes.** Apply the three known fixes to `src/ios/` before the next release:
  1. Pick the simulator dynamically (not a hard-coded device name).
  2. Default `GENERATE_INFOPLIST_FILE: YES` in the scaffolded `project.yml`.
  3. Capture interaction-state screenshots from within XCUITest, not via `simctl`.
- [ ] **Task 4 — Common block extraction.** Once a second harness exists, identify shared content and extract into `src/common/`. Not yet — YAGNI.

---

## Decisions made

- Source layout: `src/<platform>/` — no middle grouping level. Add `src/<platform>/<variant>/` only when two variants of the same platform exist.
- Build tool: `just` recipes (not a standalone build script).
- Versioning: per-harness tags (e.g. `ios-v0.2.0`).
- Version stamped into the artefact so consumer repos record which harness version seeded them.
