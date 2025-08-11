# CLAUDE.md - Responsive Components (`src/client/components/responsive`)

This directory contains components that are fundamental to the application's unified responsive design, particularly for modals and layout.

## Purpose
These components provide the building blocks for creating a consistent and responsive user experience across all devices. They encapsulate the logic for adapting to different screen sizes and device capabilities using a CSS-first approach.

## Key Files
- **`ResponsiveModal.tsx`**: The base component for all modal dialogs in the application. It adapts its layout and behavior based on screen size using CSS.
- **`ResponsiveHeader.tsx`**: A header component that adjusts its layout for different screen sizes.
- **`ResponsiveToolbar.tsx`**: A toolbar component that is designed to be used in a responsive layout.

## Architectural Principles
- **Unified Responsive Design**: The components in this directory are the cornerstone of the application's unified responsive architecture. They **must not** contain any JavaScript-based device detection for UI rendering.
- **CSS-First**: All responsive behavior is handled through Tailwind CSS breakpoints.
- **Layout Constraints**: These components often work in conjunction with the `useLayoutConstraints` hook to ensure that they are positioned correctly and do not overlap with other UI elements, especially on smaller screens.
- **Accessibility**: All components are designed to be fully accessible, with proper focus management and keyboard navigation.
