# CLAUDE.md - Scripts Directory

This directory contains utility and automation scripts for the ExpliCoLearning project.

## Purpose
The scripts in this directory are used for various development, testing, and maintenance tasks. They are not part of the main application bundle but are essential for the development workflow.

### Key Script Categories:
- **Testing (`test-*.js`)**: Scripts for running various tests, including functionality tests, MCP integration tests, and connection tests.
- **Automation (`mcp-*.js`, `puppeteer-*.js`)**: Scripts for browser automation using Playwright and Puppeteer.
- **Project Management (`create-demo-project.js`, `update-project-public-status.js`)**: Scripts for managing project data and status.
- **Maintenance (`remove-consoles.mjs`, `backup-data.ts`)**: Scripts for code cleanup and data backup.

## Important Files
- `test-app-functionality.js`: Runs core functionality tests.
- `mcp-dev-workflow.js`: Script for the MCP development workflow.
- `puppeteer-auth-helper.js`: Helper script for Puppeteer authentication.
- `backup-data.ts`: Script for backing up project data.

## Usage
These scripts are typically run from the command line using `node` or as part of `npm` scripts defined in `package.json`.

**Note:** When modifying scripts in this directory, ensure they are compatible with the project's overall architecture and do not introduce any patterns forbidden by the root `AGENTS.md` file.
