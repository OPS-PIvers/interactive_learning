# CLAUDE.md - Icon Components (`src/client/components/icons`)

This directory contains all the custom SVG icon components used in the application.

## Purpose
By centralizing all icon components in this directory, we ensure consistency and reusability. Each icon is a separate React component.

## Usage
- Icons are imported directly into other components.
- When creating a new icon, it should be a functional React component that returns an SVG element.
- Icons should be designed to be scalable and styled with CSS. Use `className` to allow for easy styling.
- Ensure that all icons have appropriate accessibility attributes, such as `aria-hidden="true"` if they are purely decorative, or a `title` element if they convey meaning.
- Follow the existing naming convention (e.g., `ArrowDownIcon.tsx`).
