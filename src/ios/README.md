# iOS App Build Harness

A drop-in starter for building a native iOS app with Claude Code driving an
interactive build → run → verify → fix loop against the iOS Simulator.

## Quick start

1. Unzip these files into an empty folder (the folder name becomes the default app name).
2. Open Claude Code: `claude`
3. Say: **"Let's build an iOS app."**

Claude sets up the repo, confirms the app name with you, scaffolds a clean app, builds
and runs it in the Simulator, verifies against acceptance criteria, and hands back to you
ready for feature development.

Day-to-day commands once scaffolded (requires `just` — `brew install just`):
- `just run-local` — build and run in the Simulator
- `just deploy-local <device-udid>` — install on a connected iPhone (needs code signing)
- `just publish` — archive and upload to App Store Connect (needs a paid Apple Developer account)

## Files (as shipped)

- `CLAUDE.md` — the instructions the agent follows. The brain of the harness.
- `preflight.ts` — prerequisite checks (Xcode, simulators, toolchain).
- `session-log.ts` — snapshots the session transcript for analysis.
- `sim-dest.sh` — outputs the UDID of the best available iPhone simulator (used internally by the build loop).
- `acceptance.md` — acceptance criteria for the current delta (Delta 0 = clean scaffold).
- `plan.md` — master plan and always-current resume state. A fresh session + **"continue"** resumes from here.
- `package.json` — pnpm + tsx for the TypeScript scripts.
- `gitignore.template` — renamed to `.gitignore` on first run, keeping the generated `.xcodeproj` and build output out of git.

On first run the harness moves itself into a canonical layout: scripts to `ops/local/`,
`plan.md` + `acceptance.md` to `doc/planning/`, and session logs to `doc/session-logs/`.
Everything after that reads/writes those canonical paths. The setup is idempotent — safe
to re-run on every session.

## Cost note

Keep it **interactive**. Running the loop via `claude -p` / headless / the Agent SDK
bills against a separate API-rate credit pool, not your subscription.

## Limits

Preflight detects a missing Xcode but can't install it (App Store / `xcodes` job).
The Simulator can't verify the Action Button, lock screen, or Foundation Models —
those are device-gated checkpoints, flagged by the agent rather than faked.
