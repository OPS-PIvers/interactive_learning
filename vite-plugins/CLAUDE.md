# CLAUDE.md - Vite Plugins (`vite-plugins`)

This directory contains custom Vite plugins for the project.

## Purpose
Vite plugins are used to extend the functionality of the Vite build tool. The plugins in this directory are used for tasks such as detecting temporal dead zones (TDZ) in the code.

## Key Files
- **`tdz-detection.js`**: A Vite plugin to detect and warn about temporal dead zones.

## Usage
- When creating a new Vite plugin, it should be placed in this directory.
- Plugins should be well-documented and have a clear purpose.
- Follow the Vite plugin API when creating new plugins.
