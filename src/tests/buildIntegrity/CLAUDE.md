# CLAUDE.md - Build Integrity Tests (`src/tests/buildIntegrity`)

This directory contains tests that verify the integrity of the build process and the overall code structure.

## Purpose
These tests are designed to catch issues that might not be caught by unit or integration tests, such as compilation errors, import/export problems, and compliance with React hook rules.

## Key Files
- **`ComponentCompilation.test.tsx`**: Verifies that all components compile without errors.
- **`ImportExportIntegrity.test.ts`**: Checks for issues with module imports and exports.
- **`ReactHooksCompliance.test.tsx`**: Ensures that all custom hooks comply with the rules of React hooks.
- **`TypeScriptIntegrity.test.ts`**: Checks for TypeScript compilation errors and other type-related issues.

## Importance
These tests are critical for maintaining the health of the codebase. They must all pass before any changes are committed.
