#!/usr/bin/env bash
set -euo pipefail

SKILL_NAME="eleven-stt"
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="$HOME/.openclaw/skills/$SKILL_NAME"

printf 'Installing %s into %s
' "$SKILL_NAME" "$TARGET_DIR"

mkdir -p "$TARGET_DIR"

rsync -a --delete --exclude='.git' --exclude='node_modules' "$SKILL_DIR/" "$TARGET_DIR/"

cd "$TARGET_DIR"

if command -v npm >/dev/null 2>&1; then
  printf 'Installing npm dependencies (production only)...
'
  npm install --production >/dev/null 2>&1 && printf 'npm dependencies installed
'
else
  printf 'npm not found; please run "npm install --production" in %s manually
' "$TARGET_DIR"
fi

if [ -f "$HOME/.openclaw/config.yaml" ]; then
  if ! grep -q "elevenlabs_stt" "$HOME/.openclaw/config.yaml"; then
    cat <<EOF
Add your ElevenLabs API key to config.yaml to finish setup:

config:
  keys:
    elevenlabs_stt: YOUR_API_KEY_HERE

EOF
  fi
else
  cat <<EOF
Create ~/.openclaw/config.yaml and add your API key:

config:
  keys:
    elevenlabs_stt: YOUR_API_KEY_HERE

EOF
fi

printf '%s installation complete.
' "$SKILL_NAME"
