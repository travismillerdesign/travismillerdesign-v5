#!/bin/bash
# Setup script for git hooks
# Run this once after cloning the repo: bash setup-hooks.sh

echo "Setting up git hooks..."

# Copy pre-commit hook
cp hooks/pre-commit .git/hooks/pre-commit

# Make it executable
chmod +x .git/hooks/pre-commit

echo "✅ Git hooks installed successfully!"
echo "The pre-commit hook will now run tests before each commit."
echo "To skip the hook, use: git commit --no-verify"
