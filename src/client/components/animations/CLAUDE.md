# CLAUDE.md - Animation Components (`src/client/components/animations`)

This directory contains components responsible for handling animations and transitions within the application.

## Purpose
The components in this directory use `framer-motion` to create smooth and performant animations. They are designed to be reusable and easy to integrate with other components.

## Key Files
- **`AnimationPresets.tsx`**: Defines a set of reusable animation presets that can be applied to different elements.
- **`ElementAnimations.tsx`**: Provides animations for individual slide elements.
- **`SlideTransitions.tsx`**: Handles the transition animations between slides.

## Usage
- When adding new animations, consider creating a new preset in `AnimationPresets.tsx` if it's likely to be reused.
- Ensure that all animations are performant and do not cause jank, especially on mobile devices.
- Use the `motion` component from `framer-motion` to create animatable elements.
- Adhere to the unified responsive design principles; animations should work smoothly across all screen sizes.
