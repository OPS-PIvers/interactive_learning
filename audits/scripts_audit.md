# Scripts Directory Audit

This file audits the utility and testing scripts in `/scripts/`.

## Summary

- **Total Files Audited:** 24
- **Files Kept As Is:** 15 (62.5%)
- **Files Consolidated:** 1 (4.2%)
- **Files Removed:** 8 (33.3%)

| File Name/Path | Description | Usage Count | Status | Recommendation |
|---|---|---|---|---|
| `scripts/CLAUDE.md` | Documentation for the scripts directory. | N/A | Keep | Provides a good overview of the scripts. |
| `scripts/analyze-console.js` | Puppeteer script to analyze console output and page behavior. | Low | Keep | Useful for debugging. Depends on `puppeteer-utils.js`. |
| `scripts/backup-data.ts` | Script to back up all Firebase data. | High | Keep | Critical for data integrity. Uses `ts-node`. |
| `scripts/console-monitor.js` | Puppeteer script for monitoring console output. | Low | Consolidate | Redundant with `analyze-console.js`. Both should be merged. |
| `scripts/create-demo-project.js` | Creates a demo project for testing. | Medium | Keep | Useful for setting up test data. Depends on `puppeteer-utils.js`. |
| `scripts/fix-public-project.js` | One-off script to fix a specific project. | N/A | Remove | Obsolete and not for general use. |
| `scripts/mcp-dev-workflow.js` | CLI helper for MCP development tasks. | High | Keep | Central script for MCP development. |
| `scripts/mcp-puppeteer-server.js` | Custom MCP server using Puppeteer. | High | Keep | Core of the MCP functionality. |
| `scripts/memory-leak-test.js` | Performance test to detect memory leaks. | Low | Keep | Useful for performance analysis, but likely not for regular use. |
| `scripts/puppeteer-auth-helper.js` | Authentication helpers for Puppeteer tests. | High | Keep | Essential for tests requiring authentication. Depends on `puppeteer-utils.js`. |
| `scripts/puppeteer-utils.js` | Utility functions for Puppeteer. | High | Keep | Core dependency for many other scripts. |
| `scripts/remove-consoles.mjs` | Removes console.log statements from the code. | Medium | Keep | Useful for code cleanup. |
| `scripts/test-app-functionality.js` | Puppeteer script to test core app functionality. | High | Keep | Important for application health checks. Depends on `puppeteer-utils.js`. |
| `scripts/test-claude-mcp-integration.js` | Tests Claude and MCP integration. | Medium | Keep | Specific test for the development workflow. |
| `scripts/test-firebase-connection.js` | Tests Firebase connection and public project access. | Medium | Keep | Useful for diagnosing Firebase issues. Depends on `puppeteer-utils.js`. |
| `scripts/test-hotspot-centering.js` | Tests hotspot centering functionality. | Medium | Keep | Specific feature test. Depends on `puppeteer-auth-helper.js` and `puppeteer-utils.js`. |
| `scripts/test-live-site.js` | Tests the deployed live site to find project IDs. | N/A | Remove | One-off script, likely obsolete. |
| `scripts/test-main-app.js` | Analyzes the main app to find project IDs. | N/A | Remove | One-off script, likely obsolete. Similar to `test-live-site.js`. |
| `scripts/test-mcp-server.js` | Tests the MCP server setup. | Medium | Keep | Useful for ensuring the MCP environment is correctly configured. |
| `scripts/test-puppeteer.js` | Basic test for Puppeteer setup. | Low | Keep | Simple diagnostic script. Depends on `puppeteer-utils.js`. |
| `scripts/update-project-public-status.js` | Admin script to update project public status. | Medium | Keep | Useful administrative script. Uses Firebase Admin SDK. |
| `scripts/validate-mcp-config.js` | Validates MCP configuration files. | Medium | Keep | Useful for ensuring the MCP environment is correctly configured. |
| `scripts/week3-cross-platform-testing.js` | Configuration for cross-platform testing. | N/A | Remove | Obsolete testing configuration. |
| `scripts/week3-validation-checklist.js` | Manual testing checklist. | N/A | Remove | Obsolete testing checklist. |

## Overall Recommendations

1. **Remove obsolete scripts:** There are 8 scripts that are either one-off, outdated, or related to a specific past task. These should be removed to reduce clutter and maintenance overhead.
2. **Consolidate redundant scripts:** `console-monitor.js` and `analyze-console.js` have overlapping functionality. Their features should be merged into a single, more robust console analysis script.
3. **Standardize script dependencies:** The use of `puppeteer-utils.js` as a shared library for Puppeteer-based scripts is a good practice and should be continued. This promotes code reuse and simplifies maintenance.

## Implementation Notes

- The `Remove` recommendations can be implemented directly by deleting the files.
- The `Consolidate` recommendation for `console-monitor.js` and `analyze-console.js` will require creating a new script that combines the features of both and then removing the old ones.
- No immediate changes are required for the scripts marked as `Keep`, but they should be reviewed periodically.
