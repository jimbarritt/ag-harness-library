# iOS App Build Harness

You are building a **native iOS app** by driving an interactive build → run → verify → fix loop against the **iOS Simulator**, on this Mac. Work autonomously within this session: keep iterating until the acceptance criteria pass, then commit.

## Hard rules

1. **Interactive only.** This session runs under the Claude subscription. Never shell out to `claude -p`, the Agent SDK, or headless mode — those bill separately at API rates. All iteration happens inside this interactive session.
2. **Never hand-edit `.xcodeproj`.** The project is generated from `project.yml` by XcodeGen. To change project structure, edit `project.yml` and regenerate.
3. **Don't proceed on a failed preflight.** If prerequisites are missing, stop and report exactly what's missing and how to fix it.
4. **Scripts in TypeScript, run with pnpm.** Any helper tooling you add is `.ts`, invoked via pnpm.
5. **Stop at delta boundaries.** When a delta's acceptance criteria pass and you've committed, **stop and wait for my explicit go-ahead** before starting the next delta. Do not begin the next delta on your own. Override: if I've said to run through, run multiple deltas, or not to stop, then keep going without pausing until I say otherwise. Within a single delta, iterate freely — the checkpoint is only at the boundary between deltas.
6. **Always leave the repo resumable.** `doc/planning/plan.md` must be kept current so any session can terminate and be picked up by a fresh session. Update it after each milestone and **always before you stop or end your turn at a stopping point** — never leave the repo in a state where the next session can't tell what to do next.

## Resuming — start here every session

Your **first action in any session** is to read `plan.md` (it's at the repo root on a
fresh unzip, or `doc/planning/plan.md` once the repo has been set up). It records the
current delta, what was last done, and the single next step.

- If I type **continue**, resume from the "Next step" in `plan.md` (respecting the
  delta-boundary stop in Hard rule 5 — if the next step is a new delta, confirm with me first).
- If the file says a delta is mid-flight, pick up exactly where it left off.
- Then proceed to Step 0.

## Step 0 — Set up the repo, then preflight (always first)

The harness ships as a **flat set of files** in an empty, not-yet-initialised directory
(the zip is meant to be unzipped and run). Your first job is to make the repo canonical.
This whole block is idempotent — safe to run every session:

```bash
# 1. Initialise git if needed (a fresh unzip is not yet a repo)
[ -d .git ] || git init

# 2. Harness scripts -> ops/local/
mkdir -p ops/local
for f in preflight.ts session-log.ts; do
  [ -f "$f" ] && mv "$f" ops/local/ || true
  [ -f "scripts/$f" ] && mv "scripts/$f" ops/local/ || true
done
rmdir scripts 2>/dev/null || true

# 3. Planning docs -> doc/planning/ ; create the logs dir
mkdir -p doc/planning doc/session-logs
for f in plan.md acceptance.md; do
  [ -f "$f" ] && mv "$f" doc/planning/ || true
done
```

`package.json` already points at `ops/local/…`, so once the moves are done the scripts
resolve correctly. Then run preflight:

```bash
pnpm install
pnpm preflight
```

If preflight exits non-zero, stop. Report the failed checks and their remediation. Do not scaffold or build until preflight passes.

## Step 1 — Confirm app identity

Derive the app name and bundle ID from the current directory name, then confirm with the
user before proceeding. Do this once per fresh harness — skip if `plan.md` already records
confirmed values.

```bash
dirname=$(basename "$PWD")   # e.g. "my-cool-app"
```

From `dirname`, derive:
- **Display name** — title-case each word (split on `-` and `_`): `my-cool-app` → `My Cool App`
- **Bundle ID** — `com.example.<dirname>` as a starting point (the user will need to replace `com.example` with their real organisation prefix)

Present the defaults and ask for confirmation before any scaffolding:

> I'll use the following values — let me know if you'd like to change anything:
>
> - **Display name:** My Cool App
> - **Bundle ID:** com.example.my-cool-app *(replace `com.example` with your org prefix)*
>
> Shall I proceed with these?

Wait for the user's response. Record the confirmed values in `doc/planning/plan.md` under
a "App identity" section so they survive across sessions and don't need to be asked again.

Use these confirmed values everywhere: `project.yml`, the generated `justfile`, `ExportOptions.plist`, and any Swift source that references the app name.

## Step 2 — Read the spec

Read `doc/planning/acceptance.md`. That file defines the current acceptance criteria. The app is "done" for this iteration only when every criterion there is satisfied and verified. If the spec defines a handoff message for completion, deliver it verbatim when the delta is done.

## Step 3 — Scaffold (XcodeGen)

- Organise Swift sources under `Sources/` and tests under `Tests/`.
- Author/maintain a single `project.yml` describing the app target, the UI-test target, bundle id, deployment target, and schemes. Use the confirmed display name and bundle ID from Step 1.
- Generate a `justfile` at the repo root (see Appendix A) with the `run-local`, `deploy-local`, and `publish` recipes, filling in the confirmed app name, scheme, and bundle id. Also generate an `ExportOptions.plist` (Appendix B) for the `publish` recipe.
- Generate the project:

```bash
xcodegen generate
```

The generated `<App>.xcodeproj` is git-ignored. `project.yml` is the source of truth.

## Step 4 — Build

Use a fixed derived-data path so the built `.app` is at a predictable location:

```bash
xcodebuild \
  -project <App>.xcodeproj \
  -scheme <App> \
  -derivedDataPath ./build \
  build \
  -destination "$(xcrun simctl list devices available -j | python3 -c \
    'import sys,json;d=json.load(sys.stdin);iphones=[i for v in d["devices"].values() for i in v if "iPhone" in i["name"]];print("platform=iOS Simulator,id="+iphones[-1]["udid"] if iphones else "")')"
```

Built app: `./build/Build/Products/Debug-iphonesimulator/<App>.app`.
List available simulators if the destination fails: `xcrun simctl list devices available`.

## Step 5 — Run on the Simulator

```bash
udid=$(xcrun simctl list devices booted -j | python3 -c \
  'import sys,json;d=json.load(sys.stdin);x=[i["udid"] for v in d["devices"].values() for i in v if i.get("state")=="Booted"];print(x[0] if x else "")')
if [ -z "$udid" ]; then
  udid=$(xcrun simctl list devices available -j | python3 -c \
    'import sys,json;d=json.load(sys.stdin);c=[i for v in d["devices"].values() for i in v if "iPhone" in i["name"]];print(c[-1]["udid"] if c else "")')
  xcrun simctl boot "$udid"
  open -a Simulator
fi
xcrun simctl install "$udid" ./build/Build/Products/Debug-iphonesimulator/<App>.app
xcrun simctl launch "$udid" <bundle-id>
```

## Step 6 — Verify against acceptance criteria

Two complementary checks — both must be used:

1. **Machine gate (authoritative): XCUITest.** Encode each acceptance criterion as a UI test assertion (element exists, tap produces the expected state). Run:

   ```bash
   xcodebuild test \
     -project <App>.xcodeproj -scheme <App> \
     -derivedDataPath ./build \
     -destination "$(xcrun simctl list devices available -j | python3 -c \
       'import sys,json;d=json.load(sys.stdin);iphones=[i for v in d["devices"].values() for i in v if "iPhone" in i["name"]];print("platform=iOS Simulator,id="+iphones[-1]["udid"] if iphones else "")')"
   ```

2. **Eyeball:** capture a screenshot and view it to confirm the UI looks right:

   ```bash
   xcrun simctl io booted screenshot screenshot.png
   ```

   Then open `screenshot.png` and check it against the spec.

## Step 7 — Loop

On any failure: read the build errors / test output / screenshot, form a hypothesis, make the smallest fix (edit Swift or `project.yml`), then go back to Step 3/4. Repeat until Step 6 passes cleanly. Don't ask for help on routine build errors — resolve them in the loop. Do surface anything that needs a real device (see below).

## Step 8 — Commit

When acceptance criteria pass (the repo was already git-initialised in Step 0):

```bash
git add -A
git commit -m "<concise conventional message>"
```

Small, frequent commits at each green milestone are preferred over one big commit.

## Step 9 — Snapshot the session log

Before stopping at a delta boundary, capture the session transcript for analysis:

```bash
pnpm session-log
```

This copies Claude Code's own JSONL transcript (which is otherwise auto-deleted after 30 days) into `doc/session-logs/` and prints harness metrics (build attempts vs. successes, test runs, commits, duration). Commit the snapshot together with the delta:

```bash
git add doc/session-logs/ && git commit -m "chore: session log for delta <n>"
```

## Step 10 — Update the resume state (before you stop)

Update `doc/planning/plan.md` so the repo is left resumable (Hard rule 6): set the current
delta + status, what was just completed, the single **next step**, and any device-gated
blockers. When a new delta is defined, give it its own `doc/planning/delta-<n>.md` and
mirror its active criteria into `doc/planning/acceptance.md`. Commit:

```bash
git add doc/planning/ && git commit -m "chore: update resume state"
```

A fresh session + me typing **continue** should be enough to pick up from here with no
other context. After this, **stop and wait for my go-ahead** (Hard rule 5) unless I've
told you to keep running.

## Things that CANNOT be verified here (flag, don't fake)

The Simulator cannot exercise these — if a criterion depends on one, build the code behind a protocol with a Simulator-safe mock, mark the criterion as **device-gated**, and tell me it needs a real-device checkpoint:

- Action Button / lock screen / Control Center / background-while-locked recording
- Foundation Models (on-device LLM) inference — unreliable/unavailable in the Simulator
- Anything requiring real entitlements, code signing, or App Store Connect

## When unsure about environment facts

Prefer checking current docs over guessing: Apple Developer docs for framework/Simulator behaviour, and the Claude Code docs for tooling. State assumptions you make.

---

## Appendix A — `justfile` to generate

Generate this at the repo root, replacing the variable values with the confirmed app name,
scheme, and bundle ID from Step 1. Requires `just` (`brew install just`).

```just
# justfile — generated by the harness
app       := "<display-name>"
scheme    := "<display-name>"
bundle_id := "<bundle-id>"
derived   := "./build"

# Regenerate the Xcode project from project.yml
generate:
    xcodegen generate

# Build + run in the iOS Simulator (uses a booted sim, else the newest available iPhone)
run-local: generate
    #!/usr/bin/env bash
    set -euo pipefail
    xcodebuild -project {{app}}.xcodeproj -scheme {{scheme}} \
      -destination 'generic/platform=iOS Simulator' -derivedDataPath {{derived}} build
    udid=$(xcrun simctl list devices booted -j | python3 -c 'import sys,json;d=json.load(sys.stdin);x=[i["udid"] for v in d["devices"].values() for i in v if i.get("state")=="Booted"];print(x[0] if x else "")')
    if [ -z "$udid" ]; then
      open -a Simulator
      udid=$(xcrun simctl list devices available -j | python3 -c 'import sys,json;d=json.load(sys.stdin);c=[i for v in d["devices"].values() for i in v if "iPhone" in i["name"]];print(c[-1]["udid"] if c else "")')
      xcrun simctl boot "$udid"
    fi
    xcrun simctl install "$udid" {{derived}}/Build/Products/Debug-iphonesimulator/{{app}}.app
    xcrun simctl launch "$udid" {{bundle_id}}

# Deploy to a connected iPhone. Requires code signing set up (a development team).
# Pass the device UDID, or run with no arg to list connected devices.
deploy-local device="":
    #!/usr/bin/env bash
    set -euo pipefail
    if [ -z "{{device}}" ]; then
      echo "Connected devices:"; xcrun devicectl list devices; \
      echo "Re-run: just deploy-local <device-udid>"; exit 1
    fi
    xcodebuild -project {{app}}.xcodeproj -scheme {{scheme}} \
      -destination 'generic/platform=iOS' -derivedDataPath {{derived}} \
      -allowProvisioningUpdates build
    xcrun devicectl device install app --device "{{device}}" \
      {{derived}}/Build/Products/Debug-iphoneos/{{app}}.app
    xcrun devicectl device process launch --device "{{device}}" {{bundle_id}}

# Archive, export, and UPLOAD to App Store Connect.
# Requires: paid Apple Developer Program, code signing, and an ASC API key
# (set ASC_KEY_ID and ASC_ISSUER_ID; .p8 key in ~/.appstoreconnect/private_keys/).
# This only uploads the binary — creating the app record, metadata, screenshots,
# submitting for review, and releasing are done in App Store Connect (or via
# `fastlane deliver`) and are NOT scriptable end-to-end.
publish:
    #!/usr/bin/env bash
    set -euo pipefail
    xcodebuild -project {{app}}.xcodeproj -scheme {{scheme}} \
      -destination 'generic/platform=iOS' \
      -archivePath {{derived}}/{{app}}.xcarchive -allowProvisioningUpdates archive
    xcodebuild -exportArchive -archivePath {{derived}}/{{app}}.xcarchive \
      -exportPath {{derived}}/export -exportOptionsPlist ExportOptions.plist
    xcrun altool --upload-app -f {{derived}}/export/{{app}}.ipa -t ios \
      --apiKey "$ASC_KEY_ID" --apiIssuer "$ASC_ISSUER_ID"
    @echo "Uploaded to App Store Connect. Finish metadata, review and release there."
```

## Appendix B — `ExportOptions.plist` to generate

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store-connect</string>
    <key>destination</key>
    <string>export</string>
</dict>
</plist>
```
