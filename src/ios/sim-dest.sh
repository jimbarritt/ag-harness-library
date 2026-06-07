#!/usr/bin/env bash
# Output the UDID of the best available iPhone simulator.
#
# Usage:
#   ops/local/sim-dest.sh          # best available iPhone (by iOS version), no booting
#   ops/local/sim-dest.sh --boot   # use already-booted iPhone if one exists,
#                                  # else pick best available, boot it, and open Simulator
#
# Exits non-zero if no iPhone simulator is found.

set -euo pipefail

boot=false
[[ "${1:-}" == "--boot" ]] && boot=true

if $boot; then
  # Use an already-booted iPhone if available
  udid=$(xcrun simctl list devices booted -j | python3 -c '
import sys, json
d = json.load(sys.stdin)
booted = [i["udid"] for v in d["devices"].values() for i in v if i.get("state") == "Booted" and "iPhone" in i["name"]]
print(booted[0] if booted else "")
')
  if [ -n "$udid" ]; then
    echo "$udid"
    exit 0
  fi
fi

# Pick the newest available iPhone simulator (sorted by iOS version, then name)
udid=$(xcrun simctl list devices available -j | python3 -c '
import sys, json, re
d = json.load(sys.stdin)
iphones = []
for rt, devs in d["devices"].items():
    m = re.search(r"iOS-(\d+)-(\d+)", rt)
    if not m: continue
    ver = (int(m.group(1)), int(m.group(2)))
    for dev in devs:
        if "iPhone" in dev["name"]:
            iphones.append((ver, dev["name"], dev["udid"]))
iphones.sort()
print(iphones[-1][2] if iphones else "")
')

if [ -z "$udid" ]; then
  echo "error: no iPhone simulator available — open Xcode > Settings > Components to install one" >&2
  exit 1
fi

if $boot; then
  xcrun simctl boot "$udid" 2>/dev/null || true
  open -a Simulator
fi

echo "$udid"
