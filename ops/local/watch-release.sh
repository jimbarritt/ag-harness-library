#!/usr/bin/env bash
# Watch the GitHub Actions release workflow for a given tag.
# Usage: ./watch-release.sh <tag>

set -euo pipefail

tag="${1:-}"
if [ -z "$tag" ]; then
  echo "  error: tag argument required" >&2
  exit 1
fi

echo ""
echo "  Watching release workflow for tag: $tag"
echo ""

spinner=('|' '/' '-' '\')
i=0
run_id=""

while [ -z "$run_id" ]; do
  idx=$((i % 4))
  printf "\r  [${spinner[$idx]}] waiting for workflow run to appear..."
  run_id=$(gh run list \
    --workflow=release.yml \
    --limit=10 \
    --json databaseId,headBranch,status \
    | jq -r --arg tag "$tag" \
        '.[] | select(.headBranch == $tag and .status != "completed") | .databaseId' \
    | head -1)
  i=$((i + 1))
  sleep 1
done

printf "\r  ✓ found run %-40s\n" "$run_id"
echo ""

gh run watch "$run_id" --exit-status
