# CLAUDE.md - Tests (`src/tests`)

This directory contains all the test files for the application, written using Vitest.

## Purpose
The tests in this directory are crucial for ensuring the quality, correctness, and stability of the application. They are organized into subdirectories based on the type of testing being performed.

## Directory Structure
- **`buildIntegrity/`**: Tests that check the integrity of the build process and the overall code structure.
- **`coreFunctionality/`**: Tests for the core features of the application, such as the slide editing workflow.
- **`integration/`**: Integration tests that verify the interaction between different parts of the application, including Firebase integration.
- **`mobile-ux/`**: Tests that focus on the mobile user experience and responsive behavior.
- **`mocks/`**: Mock objects and functions used in the tests.

## Testing Guidelines
- **Run Tests Before Committing**: Always run the tests using `npm run test:run` before committing any changes.
- **Write Tests for New Features**: Any new feature should be accompanied by a corresponding set of tests.
- **Follow Existing Patterns**: When writing new tests, follow the patterns and conventions used in the existing test files.
- **Use Mocks**: Use the mock objects in the `mocks/` directory to isolate the code being tested and avoid dependencies on external services like Firebase.
- **Critical Tests**: Pay special attention to the tests in `buildIntegrity/` and `coreFunctionality/`, as they cover the most critical parts of the application.
