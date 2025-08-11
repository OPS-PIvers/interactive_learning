# CLAUDE.md - Integration Tests (`src/tests/integration`)

This directory contains integration tests that verify the interaction between different parts of the application.

## Purpose
These tests are designed to ensure that the various parts of the application work together correctly. This includes testing the integration with external services like Firebase.

## Key Files
- **`FirebaseIntegration.test.ts`**: Tests the integration with Firebase, ensuring that data can be read from and written to Firestore and Firebase Storage correctly.
- **`ConcurrentOperations.test.ts`**: Tests how the application behaves when multiple operations are performed concurrently.

## Testing Strategy
- These tests often require a running Firebase emulator to work correctly.
- They may involve more complex setup and teardown procedures than unit tests.
- These tests are important for catching issues that may not be apparent when testing individual components in isolation.
