# CLAUDE.md - Mobile UX Tests (`src/tests/mobile-ux`)

This directory contains tests that focus on the mobile user experience and responsive behavior of the application.

## Purpose
These tests are designed to ensure that the application provides a high-quality user experience on mobile devices. This includes testing the responsive layout, touch interactions, and performance on smaller screens.

## Key Files
- **`MobileUXResponsiveBehavior.test.tsx`**: Tests the responsive behavior of the application, ensuring that the layout adapts correctly to different screen sizes.
- **`PerformanceOptimization.test.tsx`**: Contains tests for performance optimizations, such as debounced inputs and throttled events.

## Testing Strategy
- These tests often involve simulating mobile viewports and touch events.
- They are crucial for verifying that the unified responsive architecture is working as intended.
- Performance tests in this directory help to ensure that the application is fast and responsive on mobile devices.
