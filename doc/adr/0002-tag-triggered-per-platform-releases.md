# 2. Tag-triggered per-platform releases

Date: 2026-06-06

## Status

Accepted

## Context

The repo uses trunk-based development: small, frequent commits directly to main. We need
a release strategy for harness artefacts (versioned zips published to GitHub Releases).

The naive approach — auto-increment version and publish on every push to main — doubles
commit count (a version-bump commit per merge) and clutters the release list with
unintentional releases.

Harnesses version independently: an iOS change should not bump the web artefact.

## Decision

Releases are triggered by per-platform git tags, not by commits to main.

- Tags follow the pattern `<harness>-v<semver>`, e.g. `ios-v0.2.0`.
- The GitHub Actions workflow fires only on matching tags (`ios-v*`, `web-v*`, etc.).
- The `just bump <harness> <level>` recipe handles bumping `src/<harness>/.meta`,
  committing, and tagging locally. The developer then pushes both the commit and the tag
  to trigger the release.
- The version is stamped into the published artefact (`VERSION` file + header in `CLAUDE.md`)
  so consumer repos record which harness version seeded them.

## Consequences

- **Zero noise on main:** tags are pointers, not commits. Trunk stays clean.
- **Deliberate releases:** publishing requires an explicit `just bump` + push. This is a
  feature for a tooling library where users adopt content — releases should be intentional.
- **Per-harness provenance:** `ios-v0.2.0` tags resolve to an exact commit and tree.
- **SemVer semantics preserved:** major/minor/patch carry meaning for consumers tracking
  breaking changes in a template they copy.
- **Forward-compatible:** if release discipline ever proves fragile, `release-please` can
  be layered on top — it produces the same tags, so the workflow is unchanged.
