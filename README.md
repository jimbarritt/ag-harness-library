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

---

## Development

### Prerequisites

- [`just`](https://github.com/casey/just) — `brew install just`
- [`jq`](https://jqlang.github.io/jq/) — `brew install jq`
- [`gh`](https://cli.github.com/) — `brew install gh`

### Repo structure

```
src/
  ios/          ← iOS harness source files
  common/       ← shared blocks (extracted here when needed)
doc/
  arch/         ← architecture notes
  adr/          ← architecture decision records
  planning/     ← task list and session-resume state
```

### Releasing a harness

Releases are triggered by git tags. The `just bump` recipe handles the version bump, commit,
and tag in one step.

```sh
# Bump the minor version of the iOS harness
just bump ios minor     # or: major, patch

# Push the commit and tag to trigger the GitHub Actions release
just push-tags
```

The action zips `src/<harness>/`, stamps the version into the artefact, and publishes it as
a GitHub release. The tag format is `<harness>-v<semver>`, e.g. `ios-v0.2.0`.

Version is stored in `src/<harness>/.meta` and stamped into the artefact at build time.

### Session resume

`doc/planning/plan.md` tracks current work on this library. Type **continue** in a new
Claude Code session to pick up where things left off.
