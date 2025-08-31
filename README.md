# ExpliCoLearning - Interactive Hotspot Training Application

Modern web application for creating interactive, hotspot-based multimedia training walkthroughs. The project has been completely rebuilt from a complex slide-based system into a focused, maintainable hotspot-centric architecture.

## 🎯 Project Goal

Build a modern, mobile-first web application for creating interactive hotspot-based learning experiences with real-time effects, unified responsive design, and comprehensive browser automation testing.

## ✅ Architecture Rebuild - COMPLETE

The application has been successfully rebuilt with:
- **Simplified Architecture:** Migrated from 31,000+ line slide system to focused hotspot model
- **Clean Data Models:** `HotspotWalkthrough` and `WalkthroughHotspot` interfaces replace complex slide structures
- **Unified Responsive Design:** Single components adapt across all devices using CSS-first approach
- **Real Effect System:** Maintained working spotlight, text, tooltip, and video effects
- **Reduced Codebase:** Down to 86 TypeScript files for better maintainability

## 🏗️ Core Architecture

### Technology Stack
- **Frontend:** React 18.3.1 with TypeScript and Vite
- **Backend:** Firebase 10.14.1 (Firestore + Storage)
- **Styling:** Tailwind CSS with unified responsive design
- **Testing:** Vitest with React Testing Library
- **Automation:** Dual approach with Playwright MCP (@playwright/test 1.55.0) and Puppeteer 24.14.0

### Core Components
- **HotspotViewer:** Main viewer for interactive hotspot walkthroughs
- **HotspotEditor:** Visual drag-and-drop editor with canvas
- **WalkthroughSequencer:** Manages hotspot ordering and guided tours
- **ResponsiveModal:** Unified modal system across all devices
- **Real Effects System:** Spotlight, text, tooltip, and video effects that actually work

## 🚀 Current Features

The application now includes:
- **Interactive Hotspot Editor:** Visual drag-and-drop interface for creating hotspot walkthroughs
- **Walkthrough Viewer:** Plays back interactive hotspot experiences with real effects
- **Dashboard:** Project management with create/edit/share functionality
- **Authentication:** Firebase Auth with development bypass for testing
- **Responsive Design:** Works seamlessly across mobile, tablet, and desktop
- **Browser Automation:** Dual testing approach with Playwright MCP and Puppeteer integration

## 🛠️ Development

To get started with the development environment:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run the test suite
npm run test:run

# Build the project
npm run build

# Run browser automation tests (Puppeteer)
npm run test:auth

# Validate Puppeteer MCP server
npm run mcp:validate

# Playwright MCP tools available via Claude Code interface
```