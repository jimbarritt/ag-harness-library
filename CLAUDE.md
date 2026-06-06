# Agentic Engineering Harness Library

This repo authors and releases **harnesses** — small, self-contained sets of files that a
person drops into an empty folder, fires up Claude Code, and gets an AI-driven build loop.
The repo is the workshop; the artefact is a flat zip a user unzips and runs. Keep those two
things distinct at all times.

## Source layout

```
src/
  ios/          ← iOS app builder harness (the first and currently only harness)
  common/       ← shared blocks, extracted here when two harnesses need the same content
doc/
  arch/         ← architecture notes and design briefs
  adr/          ← architecture decision records
  planning/     ← this repo's own task list and session-resume state (see below)
```

Each harness dir (`src/ios/`, future `src/web/`, etc.) holds the full source for that
harness: markdown files, TypeScript scripts, templates, and a `package.json`. The files are
mixed by nature — don't try to enforce a single-type convention on the directory.

If a second iOS harness variant ever appears, add a further level: `src/ios/app-builder/`,
`src/ios/game-builder/`. Don't pre-create that structure.

## What a harness contains

- `CLAUDE.md` — instructions Claude Code reads when running *inside* the harness drop
- `plan.md` / `acceptance.md` — delta-based planning docs the build loop reads
- `preflight.ts` — checks prerequisites before the build loop starts
- `session-log.ts` — captures the Claude Code JSONL transcript at delta boundaries
- `package.json` — pnpm config pointing at the scripts above
- `README.md` — user-facing setup instructions
- `gitignore.template` — becomes `.gitignore` in the consumer repo

## The seam: workshop vs artefact

The source tree uses references, subdirectories, and shared blocks freely — nothing here is
meant to be run directly as a harness. The build step flattens a harness into `dist/<name>/`
(all files at root, includes resolved), and the release step zips that and attaches it to a
GitHub release. Users only ever see the flat zip.

**Never tell a user to clone this repo and run a harness from `src/`.** They unzip the
artefact into an empty folder.

## Build and release

Build and release are driven by `just` recipes (see `justfile` at the repo root, to be
created). The model is:

1. `just build ios` — flattens `src/ios/` (resolving any `common/` includes) into `dist/ios/`
2. `just zip ios` — zips `dist/ios/` into `dist/ios-<version>.zip`
3. `just release ios` — attaches the zip to a versioned GitHub release

Versioning is per-harness (e.g. `ios-v0.2.0`) so an iOS change doesn't bump the web artefact.
The version is stamped into the artefact (a line in the generated `CLAUDE.md` or a `VERSION`
file in the drop).

The `justfile` and `dist/` do not exist yet — building them is on the task list.

## Session resume

`doc/planning/plan.md` is the source of truth for where work on **this library** stands.
Read it at the start of any session and type **continue** to pick up where things left off.

(Note: `src/ios/plan.md` is a different file — it's the resume state *inside* the iOS harness
drop, for whoever is using that harness to build an app. Don't confuse the two.)

## Conventions

- **Language:** British English throughout — code, comments, docs (e.g. "initialise", "artefact").
- **Scripts:** TypeScript, run with `pnpm` + `tsx`. No plain JS.
- **Formatting:** 2-space indent, no semicolons in markdown code blocks unless the language requires it.
- **Never edit `dist/` by hand.** It is generated; changes there will be overwritten.
- **ADRs:** Record significant architectural decisions in `doc/adr/` using `adr-log`.
