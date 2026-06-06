#!/usr/bin/env bash
# Watch the GitHub Actions release workflow for a given tag.
# Usage: ./watch-release.sh [tag]
# If no tag is given, uses the most recent git tag.

set -euo pipefail

tag="${1:-$(git describe --tags --abbrev=0 2>/dev/null)}"

if [ -z "$tag" ]; then
  echo "  error: no tag provided and none found in git history" >&2
  exit 1
fi

echo ""
echo "  Watching release workflow for tag: $tag"
echo ""

spinner=(⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏)
i=0
run_id=""

while [ -z "$run_id" ]; do
  printf "\r  ${spinner[$((i % 10))]} waiting for workflow run to appear..."
  run_id=$(gh run list \
    --workflow=release.yml \
    --limit=10 \
    --json databaseId,headBranch \
    | jq -r --arg tag "$tag" '.[] | select(.headBranch == $tag) | .databaseId' \
    | head -1)
  i=$((i + 1))
  sleep 2
done

printf "\r  ✓ found run %-40s\n" "$run_id"
echo ""

gh run watch "$run_id" --exit-status
