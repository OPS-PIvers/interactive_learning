# CLAUDE.md - Styles (`src/client/styles`)

This directory contains global CSS styles and configurations for the application.

## Purpose
This directory is for managing the application's overall look and feel. It includes global stylesheets, custom scrollbar styles, and high-contrast themes for accessibility.

## Key Files
- **`custom-scrollbar.css`**: Defines custom styles for scrollbars to ensure a consistent look across different browsers.
- **`high-contrast.css`**: Provides a high-contrast theme for improved accessibility.
- **`slide-components.css`**: Contains styles that are specific to the slide components.

## Usage
- Most of the application's styling is done using Tailwind CSS utility classes directly in the components. This directory should only be used for global styles that cannot be easily achieved with Tailwind.
- When adding new global styles, consider whether they can be implemented using Tailwind's configuration first.
- Avoid adding component-specific styles to this directory. Instead, use CSS modules or styled-components if necessary, or preferably, stick to Tailwind classes.
