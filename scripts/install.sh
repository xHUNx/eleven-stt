#!/bin/bash

# Installation script for ElevenLabs Speech-to-Text Skill
# This script helps set up the skill in an OpenClaw environment

set -e

SKILL_NAME="eleven-stt"
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OPENCLAW_SKILLS_DIR="$HOME/.openclaw/skills"

echo "Installing $SKILL_NAME skill..."

# Check if OpenClaw skills directory exists
if [ ! -d "$OPENCLAW_SKILLS_DIR" ]; then
    echo "Creating OpenClaw skills directory..."
    mkdir -p "$OPENCLAW_SKILLS_DIR"
fi

# Copy skill to OpenClaw directory
SKILL_TARGET_DIR="$OPENCLAW_SKILLS_DIR/$SKILL_NAME"
if [ -d "$SKILL_TARGET_DIR" ]; then
    echo "Updating existing skill..."
    rm -rf "$SKILL_TARGET_DIR"
fi

cp -r "$SKILL_DIR" "$SKILL_TARGET_DIR"

echo "Skill installed successfully at $SKILL_TARGET_DIR"

# Check if config file exists and suggest adding API key
CONFIG_FILE="$HOME/.openclaw/config.yaml"
if [ -f "$CONFIG_FILE" ]; then
    if ! grep -q "elevenlabs_stt" "$CONFIG_FILE"; then
        echo ""
        echo "To complete the setup, add your ElevenLabs API key to your OpenClaw config:"
        echo ""
        echo "config.keys.elevenlabs_stt: YOUR_API_KEY_HERE"
        echo ""
    fi
else
    echo ""
    echo "To complete the setup, create a config file with your ElevenLabs API key:"
    echo "config.keys.elevenlabs_stt: YOUR_API_KEY_HERE"
    echo ""
fi

echo "Installation complete!"