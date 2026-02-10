#!/bin/bash

# Setup script for publishing ElevenLabs Speech-to-Text Skill to GitHub
# This script guides through the process of creating a GitHub repo and pushing the skill

echo "Setting up GitHub repository for ElevenLabs Speech-to-Text Skill..."

# Check if we're in the right directory
if [ ! -f "SKILL.md" ] || [ ! -f "README.md" ]; then
    echo "❌ Error: This script must be run from within the skill directory"
    exit 1
fi

echo "Current directory: $(pwd)"
echo "Skill files found ✓"

# Ask for GitHub username and repo name
read -p "Enter your GitHub username: " GITHUB_USER
REPO_NAME="eleven-stt"

echo ""
echo "This script will create a GitHub repository called: $GITHUB_USER/$REPO_NAME"
read -p "Continue? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

# Initialize git repo if not already initialized
if [ ! -d ".git" ]; then
    echo "Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit: ElevenLabs Speech-to-Text skill v0.1.1"
fi

# Add GitHub remote
GITHUB_URL="https://github.com/$GITHUB_USER/$REPO_NAME.git"
echo "Adding GitHub remote: $GITHUB_URL"
git remote add origin "$GITHUB_URL"

echo ""
echo "Repository setup complete!"
echo ""
echo "Next steps:"
echo "1. Go to https://github.com/new to create the repository $GITHUB_USER/$REPO_NAME"
echo "2. Push the code with: git push -u origin main"
echo ""
echo "Make sure you have GitHub CLI installed or proper credentials configured."
echo ""
echo "Repository is ready to be pushed to GitHub!"