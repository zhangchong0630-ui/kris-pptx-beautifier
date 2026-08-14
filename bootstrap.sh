#!/usr/bin/env bash
# bootstrap.sh — install runtime dependencies for kris-pptx-beautifier so it can
# run outside a Codex runtime.
#
# Public npm packages are installed locally. @oai/artifact-tool is a PRIVATE
# package (not on the public npm registry), so it is symlinked from a Codex
# runtime when one is present; otherwise you must provide it yourself.
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_MODULES="$SKILL_DIR/node_modules"
mkdir -p "$NODE_MODULES"

# 1. Write package.json if missing.
if [ ! -f "$SKILL_DIR/package.json" ]; then
  cat > "$SKILL_DIR/package.json" <<'JSON'
{
  "name": "kris-pptx-beautifier",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "description": "HTML-first same-brand PPTX beautifier skill (see SKILL.md)",
  "dependencies": {
    "playwright": "^1.45.0",
    "jszip": "^3.10.1",
    "pngjs": "^7.0.0"
  }
}
JSON
fi

# 2. Install public npm packages when any is missing.
if [ ! -d "$NODE_MODULES/playwright" ] || [ ! -d "$NODE_MODULES/jszip" ] || [ ! -d "$NODE_MODULES/pngjs" ]; then
  echo "Installing playwright, jszip, pngjs..."
  (cd "$SKILL_DIR" && npm install --no-audit --no-fund)
fi

# 3. @oai/artifact-tool is private on npm; reuse a Codex runtime when available.
if [ ! -d "$NODE_MODULES/@oai/artifact-tool" ]; then
  CODEX_MODULES="${CODEX_RUNTIME_NODE_MODULES:-$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules}"
  if [ -d "$CODEX_MODULES/@oai/artifact-tool" ]; then
    echo "Linking @oai/artifact-tool from $CODEX_MODULES..."
    mkdir -p "$NODE_MODULES/@oai"
    ln -sfn "$CODEX_MODULES/@oai/artifact-tool" "$NODE_MODULES/@oai/artifact-tool"
  else
    echo "NOTE: @oai/artifact-tool is a private package and was not found." >&2
    echo "Provide it manually, or set PPTX_BEAUTIFIER_NODE_MODULES to a directory that contains it." >&2
  fi
fi

# 4. Optional: Playwright Chromium (only needed when no system Chrome/Edge exists).
echo "If no system Chrome/Edge is available, run: npx playwright install chromium"

echo
echo "Done. Point the runtime at these modules with:"
echo "  export PPTX_BEAUTIFIER_NODE_MODULES=$NODE_MODULES"
