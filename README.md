# Interactive Hotspot Onboarding Application

This repository contains the foundational codebase for an interactive hotspot onboarding application. The project has undergone a significant architectural refactoring (Phase 1) to simplify the codebase and establish a clean foundation for future development.

## 🎯 Project Goal

The goal is to build a modern, mobile-first web application for creating interactive, hotspot-based walkthroughs and learning experiences.

## ✅ Phase 1: Foundation Cleanup - COMPLETE

The initial phase of the rebuild is complete. This involved:
- **Removing Over-engineered Code:** A complex, slide-based architecture of over 31,000 lines was removed.
- **Architectural Simplification:** The data models, APIs, and component structure have been drastically simplified.
- **Establishing a Clean Foundation:** The codebase is now in a stable state, ready for the development of the core hotspot features in Phase 2.

## 🏗️ Core Architecture

The simplified architecture is built on the following key components:

- **React & TypeScript:** A modern frontend stack.
- **Vite:** For fast development and optimized builds.
- **Firebase:** For backend services including authentication and database (Firestore).
- **EffectExecutor:** A robust system for executing visual effects like spotlights and tooltips, which has been preserved from the old architecture.
- **Hotspot-Focused Data Model:** The new data model is centered around `HotspotWalkthroughs` and `WalkthroughHotspots`, providing a clear and concise structure.

## 🚀 Next Steps: Phase 2

Phase 2 will focus on building the core application functionality on top of this clean foundation, including:
- A simple editor for creating and managing hotspot walkthroughs.
- A viewer for playing back the interactive walkthroughs.
- Integration with Firebase for data persistence.

## 🛠️ Development

To get started with the development environment:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run the test suite
npm test

# Build the project
npm run build
```