# Agentic Engineering Harness Library

A library of harnesses for AI-driven build loops. Each harness is a small, self-contained set
of files you drop into an empty folder, fire up Claude Code, and say "let's build." The agent
scaffolds the rest, drives a build → run → verify → fix loop, and keeps the repo resumable
between sessions.

## Harnesses

| Harness | Status | What it builds |
|---------|--------|----------------|
| `ios`   | v0.1.0 | Native iOS app via XcodeGen + Simulator |

More harnesses (web, CLI, etc.) to follow.

## Using a harness

1. Download the latest release zip for your target harness from the [Releases](../../releases) page.
2. Create an empty folder and unzip into it.
3. Open Claude Code in that folder and follow the `README.md` inside the zip.

Do **not** clone this repo to use a harness — the source tree is for authoring, not for running.

## Repo structure

```
src/
  ios/          ← iOS harness source files
  common/       ← shared blocks (extracted here when needed)
doc/
  arch/         ← architecture notes
  adr/          ← architecture decision records
  planning/     ← task list and session-resume state
```

## Contributing / development

See `CLAUDE.md` for the repo conventions and build model.
