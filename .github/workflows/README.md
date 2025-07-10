# Claude Code GitHub Actions Setup

## Overview
This workflow automates PR review, testing, fixes, and merging using Claude Code.

## Required Setup

### 1. GitHub App Installation
Install the Claude GitHub app to your repository (no API key needed with Claude Pro):
- Go to your repository settings
- Navigate to GitHub Apps
- Install the Claude Code app
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions

### 2. Repository Settings
Enable write permissions in your repository:
1. Go to Settings > Actions > General
2. Scroll down to "Workflow permissions"
3. Select "Read and write permissions" 
4. Check "Allow GitHub Actions to create and approve pull requests"
5. Click "Save"

### 3. Branch Protection Rules
Configure branch protection for `main`:
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Include administrators in restrictions

## Workflow Features

### Automatic PR Review
- Reviews all PRs against project standards in CLAUDE.md
- Checks TypeScript types, tests, security, accessibility
- Makes necessary fixes and commits them to the PR branch

### Testing Integration
- Runs tests before and after Claude fixes
- Ensures build succeeds before merge
- Continues with fixes if initial tests fail

### Auto-merge
- Automatically merges PRs when all checks pass
- Uses squash merge with descriptive commit message
- Deletes feature branch after successful merge

### Comment Triggers
- Use `@claude` in PR comments to trigger specific actions
- Claude responds with requested changes and improvements

## Usage

1. Create a pull request as usual
2. The workflow automatically triggers on PR creation/updates
3. Claude reviews, fixes issues, and runs tests
4. If everything passes, the PR is automatically merged
5. Feature branch is deleted after merge

## Manual Override
To prevent auto-merge, add `[skip-merge]` to your PR title.