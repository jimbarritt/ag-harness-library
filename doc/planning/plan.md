# Harness Library — plan & session-resume state

The task list and current pointer for work on this library. Read this at the start of any
session; type **continue** to pick up from the "Currently working on" entry.

If this file and the repo state ever disagree, trust the repo and update this file.

---

## Currently working on

**Task 1 — Repo foundations**: CLAUDE.md written, README updated, this plan created.
Next step: create the root `justfile` with placeholder `build`, `zip`, and `release` recipes for the iOS harness.

---

## Task list

- [x] **Task 0 — Settle source layout.** Decided on `src/<platform>/` (dropped the `md/` grouping level). iOS harness files moved to `src/ios/`.
- [x] **Task 1 — Repo foundations.** CLAUDE.md, README.md, and this plan written.
- [ ] **Task 2 — Root justfile.** Create `justfile` with `build`, `zip`, and `release` recipes for the iOS harness. Start with stubs — flesh out the build logic next.
- [ ] **Task 3 — Build script.** Implement `just build ios`: flatten `src/ios/` into `dist/ios/` (copy files, resolve any `common/` includes, stamp version). Keep it simple — no includes exist yet so it's mostly a structured copy.
- [ ] **Task 4 — Release pipeline.** Implement `just zip ios` and `just release ios`. Wire up GitHub releases via `gh`.
- [ ] **Task 5 — iOS harness fixes.** Apply the three known fixes to `src/ios/` before the next release:
  1. Pick the simulator dynamically (not a hard-coded device name).
  2. Default `GENERATE_INFOPLIST_FILE: YES` in the scaffolded `project.yml`.
  3. Capture interaction-state screenshots from within XCUITest, not via `simctl`.
- [ ] **Task 6 — Common block extraction.** Once a second harness exists, identify shared content and extract into `src/common/`. Not yet — YAGNI.

---

## Decisions made

- Source layout: `src/<platform>/` — no middle grouping level. Add `src/<platform>/<variant>/` only when two variants of the same platform exist.
- Build tool: `just` recipes (not a standalone build script).
- Versioning: per-harness tags (e.g. `ios-v0.2.0`).
- Version stamped into the artefact so consumer repos record which harness version seeded them.
