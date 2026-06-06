# Harness library — just recipes
# Requires: just, jq, git, gh

# Bump the version of a harness and tag for release.
# Usage: just bump <harness> <level>
# Example: just bump ios minor
bump harness level:
    #!/usr/bin/env bash
    set -euo pipefail
    meta="src/{{harness}}/.meta"
    if [ ! -f "$meta" ]; then
      echo "error: $meta not found — is '{{harness}}' a valid harness?"
      exit 1
    fi
    version=$(jq -r '.version' "$meta")
    IFS='.' read -r major minor patch <<< "$version"
    case "{{level}}" in
      major) major=$((major + 1)); minor=0; patch=0 ;;
      minor) minor=$((minor + 1)); patch=0 ;;
      patch) patch=$((patch + 1)) ;;
      *)     echo "error: level must be major, minor, or patch"; exit 1 ;;
    esac
    new="$major.$minor.$patch"
    jq --arg v "$new" '.version = $v' "$meta" > "$meta.tmp" && mv "$meta.tmp" "$meta"
    git add "$meta"
    git commit -m "chore: bump {{harness}} to v$new"
    git tag "{{harness}}-v$new"
    echo ""
    echo "  Bumped {{harness}} to v$new — run: just push-tags"
    echo ""

# Show the current version of a harness.
# Usage: just version <harness>
version harness:
    @jq -r '"{{harness}} v" + .version' "src/{{harness}}/.meta"

# Push commits and all tags to origin. Run after `just bump`.
push-tags:
    git push && git push --tags
