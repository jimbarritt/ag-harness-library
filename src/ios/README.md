# iOS App Build Harness

A drop-in starter for building a native iOS app with Claude Code driving an
interactive build → run → verify → fix loop against the iOS Simulator.

## Quick start

1. Unzip these files into an empty folder.
2. Open Claude Code in that folder: `claude`
3. Type: **"Let's build an iOS app"**

That's it. It sets itself up, scaffolds a clean app, checks it builds and runs, and hands
back to you to start adding features.

Afterwards, day-to-day commands (needs `just` — `brew install just`):
- `just run-local` — build and run in the Simulator
- `just deploy-local <device-udid>` — install on a connected iPhone (needs code signing)
- `just publish` — archive and upload to App Store Connect (needs a paid Apple Developer account)

## How to use

1. Unzip these files into an empty directory. It does **not** need to be a git repo yet.
2. In that folder, start Claude Code interactively: `claude`
3. Say: **"Right, let's build an iOS app."**

Claude will:
- set up the repo — `git init`, create `ops/local/` and `doc/planning/`, and move the
  scripts and planning docs into place (Step 0),
- run preflight and stop if prerequisites are missing,
- scaffold from scratch via XcodeGen (`project.yml` → `.xcodeproj`),
- build, install, and launch on the Simulator,
- verify against `doc/planning/acceptance.md` (XCUITest + screenshot),
- loop until green, commit, snapshot the session log, update the plan, and hand back to you.

## Files (as shipped — a flat set, all at the directory root)

- `CLAUDE.md` — the loop the agent follows. The brain of the harness.
- `preflight.ts` — prerequisite checks (Xcode, simulators, toolchain).
- `session-log.ts` — snapshots the session transcript for analysis.
- `acceptance.md` — the target for the current delta (Delta 0 = clean scaffold).
- `plan.md` — master plan + always-current resume state. A fresh session + "continue" resumes from here.
- `package.json` — pnpm + tsx for the TypeScript scripts (paths point at `ops/local/`).
- `.gitignore` — keeps the generated `.xcodeproj` and build output out of git.

On first run the harness moves itself into a canonical layout: scripts to `ops/local/`,
`plan.md` + `acceptance.md` to `doc/planning/`, and session logs to `doc/session-logs/`.
Everything after that reads/writes those canonical paths. The move and `git init` are
idempotent, so the same Step 0 runs safely on every later session too.

To run preflight by hand *before* the agent has set things up, call the root file
directly: `pnpm install && pnpm exec tsx preflight.ts`.

## Cost note

Keep it **interactive**. Running the loop via `claude -p` / headless / the Agent SDK
bills against a separate API-rate credit pool (from 15 June 2026), not your subscription.

## Limits

Preflight detects a missing Xcode but can't install it (App Store / `xcodes` job).
The Simulator can't verify the Action Button, lock screen, or Foundation Models —
those are device-gated checkpoints, flagged by the agent rather than faked.
