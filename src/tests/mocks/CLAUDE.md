# CLAUDE.md - Mocks (`src/tests/mocks`)

This directory contains mock objects and functions used in the tests.

## Purpose
Mocks are used to isolate the code being tested and to simulate the behavior of external dependencies, such as Firebase. This allows for more reliable and faster tests.

## Key Files
- **`firebaseAnalytics.ts`**: A mock implementation of the Firebase Analytics API.

## Usage
- When writing tests that have external dependencies, use the mock objects in this directory to simulate the behavior of those dependencies.
- Mocks should be as simple as possible and only implement the functionality that is required for the tests.
- Follow the existing patterns for creating and using mocks.
