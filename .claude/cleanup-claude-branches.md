# Claude Code Branch Cleanup Guide

## Quick Reference for Cleaning Up Claude-Generated Branches

### Prerequisites
- SSH authentication is already set up (completed on 2025-12-15)
- Remote uses SSH: `git@github.com:travismillerdesign/travismillerdesign-v5.git`

### Step 1: List all Claude branches
```bash
git branch -a | grep 'remotes/origin/claude/'
```

### Step 2: Delete them from remote
Single command to delete all Claude branches:
```bash
# First, get the list of branch names (without the remotes/origin/ prefix)
CLAUDE_BRANCHES=$(git branch -r | grep 'origin/claude/' | sed 's|origin/||' | tr '\n' ' ')

# Then delete them all at once
git push origin --delete $CLAUDE_BRANCHES
```

Or delete them individually if preferred:
```bash
git push origin --delete claude/branch-name-here
```

### Step 3: Clean up local references
```bash
git fetch --prune origin
```

### Alternative: One-liner for everything
```bash
git branch -r | grep 'origin/claude/' | sed 's|origin/||' | xargs -I {} git push origin --delete {} && git fetch --prune origin
```

## Notes
- All Claude Code branches follow the pattern: `claude/description-XXXXX`
- The SSH key is stored at: `~/.ssh/id_ed25519`
- Email used: travismillerdes@gmail.com
- Repository owner: travismillerdesign
- Repository name: travismillerdesign-v5

## Troubleshooting
If SSH authentication fails:
```bash
ssh -T git@github.com  # Test GitHub SSH connection
ssh-add -l              # List loaded SSH keys
ssh-add ~/.ssh/id_ed25519  # Re-add key if needed
```
