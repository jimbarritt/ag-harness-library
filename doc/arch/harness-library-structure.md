# Harness library — design summary

A single repository that authors all harnesses and publishes each as a versioned,
self-contained zip artefact.

---

## What a harness is

A harness is a small set of files (markdown + TypeScript scripts + templates) that a person
drops into an empty folder and runs via an interactive Claude Code session ("let's build an
app"). The agent sets up the repo and drives a build → run → verify → fix loop against a
platform-specific toolchain, stopping at delta boundaries and keeping the repo resumable.

The first harness is the **iOS app builder** (in `src/ios/`). Its content splits into two kinds:

- **Harness-agnostic:** the delta methodology, `plan.md` / `acceptance.md` conventions, the
  resume / "continue" protocol, the session-log mechanism, the interactive-only billing rule,
  and the checkpoint / stop-at-delta rules.
- **Platform-specific:** preflight checks, the scaffold tool (XcodeGen), `simctl` / `devicectl`
  usage, and the justfile recipes (`run-local`, `deploy-local`, `publish`).

That split motivates a future `src/common/` layer — not extracted yet (YAGNI).

---

## Source layout

```
src/
  ios/          ← iOS app builder harness
  common/       ← shared blocks, extracted when a second harness needs them
```

If multiple iOS harness variants emerge, add a further level: `src/ios/app-builder/`,
`src/ios/game-builder/`. Don't pre-create it.

---

## The model: source → build → release

Not a template repo you clone. A source repo that **builds** flat artefacts and **publishes**
them as versioned zips (GitHub releases). The zip is the contract; users only ever see the
flat "unzip and go" drop. Flattening happens at build time.

### Source

Authoring layout — nothing runs from here, so it can use subdirectories and references freely.

### Build

`just build <harness>` takes a harness id, merges `src/common/` (when it exists) with
`src/<harness>/` (resolving includes into final flat content), and emits:

```
dist/ios/   →  CLAUDE.md, preflight.ts, session-log.ts, plan.md, acceptance.md,
               package.json, README.md, .gitignore   (all flat at root)
```

A version is stamped into the artefact (a line in `CLAUDE.md` or a `VERSION` file) so a
consumer repo records which harness version seeded it.

### Release

`just zip <harness>` zips `dist/<harness>/`.
`just release <harness>` attaches it to a versioned GitHub release.

Versioning is per-harness (e.g. `ios-v0.2.0`) so an iOS change doesn't bump other artefacts.

---

## The seam

The monorepo is the workshop; the artefact is the flat drop. You cannot run a harness from
inside `src/` — it isn't flat and it's already inside a repo. The build step is what produces
the runnable, standalone, flattened drop. Any shared content must be resolved during build,
never shipped as a live reference.

---

## Open decisions

1. **How `common` merges with platform-specific** — leaning toward named blocks that are
   concatenated into the final files. No implementation yet; defer until a second harness exists.

2. **Include syntax** — if/when includes are needed, pick a lightweight marker
   (e.g. `<!-- include: common/delta-protocol.md -->`) rather than a full templating engine.
