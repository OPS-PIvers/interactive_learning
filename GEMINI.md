# Gemini Codebase Context: ExpliCoLearning

This document provides context for the "ExpliCoLearning" codebase.

## Project Overview

ExpliCoLearning is a web application designed for creating and delivering slide-based interactive multimedia training modules. It allows content creators to build engaging educational experiences by creating multi-slide presentations with interactive elements (hotspots, text, media, shapes) and responsive positioning across devices.

### Core Features:

*   **Slide-Based Content Creation:** Users can create multi-slide presentations with interactive elements including hotspots, text, media, and shapes.
*   **Responsive Element Positioning:** Elements use fixed pixel positioning with responsive breakpoints for desktop, tablet, and mobile devices.
*   **Visual Drag-and-Drop Editor:** Slide editor with native drag-and-drop API for precise element positioning within slide canvas.
*   **Interactive Element System:** Support for various element interactions and effects with device-responsive controls.
*   **Multi-Device Support:** Mobile-first design with comprehensive touch gesture support and device detection.
*   **Real-time Collaboration:** The Firebase backend enables real-time data synchronization.

## Technology Stack

### Frontend:

*   **Framework:** React 18 with TypeScript
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS
*   **State Management:** React Hooks and Context API
*   **Routing:** React Router
*   **Drag and Drop:** Native Drag API (migrated from @dnd-kit)

### Backend & Database:

*   **Backend Services:** Firebase
*   **Database:** Firestore (NoSQL)
*   **File Storage:** Firebase Storage
*   **Hosting:** Firebase Hosting

### Development & Testing:

*   **Testing Framework:** Vitest
*   **Type Checking:** TypeScript
*   **Linting:** ESLint (based on project configuration)
*   **Browser Automation:** Puppeteer MCP integration for automated testing

## Project Structure

*   `src/client/`: Contains all the client-side application code.
    *   `components/`: Reusable React components (80+ components).
        *   `slides/`: 7 slide-specific components for slide-based architecture.
        *   `mobile/`: 38 mobile-specific components with touch optimization.
        *   `desktop/`: 6 desktop modal components.
        *   `icons/`: 19 custom icon components.
        *   `shared/`: Error boundaries and loading states.
    *   `hooks/`: Custom React hooks for shared logic (14 hooks).
    *   `utils/`: Utility functions (22 utility modules).
    *   `styles/`: Global and component-specific styles.
*   `src/lib/`: Core application logic, including Firebase integration and data handling.
    *   `firebaseApi.ts`: Interacts with Firebase services.
    *   `authContext.tsx`: Manages user authentication state.
*   `src/shared/`: Types, slide architecture, and data structures shared between different parts of the application.
    *   `slideTypes.ts`: Core slide-based architecture interfaces (NEW).
    *   `types.ts`: Legacy types maintained for backward compatibility.
    *   `interactiveTypes.ts`: Interactive elements and viewer modes.
*   `scripts/`: Node.js scripts for administrative tasks, such as data backups.
*   `firebase.json`: Configuration for Firebase deployment and services.
*   `vite.config.ts`: Configuration for the Vite development server and build process.
*   `package.json`: Defines project scripts, dependencies, and metadata.

## Getting Started

### Prerequisites:

*   Node.js (version 18+)
*   A Firebase project

### Key Scripts:

*   `npm run dev`: Starts the Vite development server.
*   `npm run build`: Compiles the application for production.
*   `npm run test`: Runs the test suite using Vitest.
*   `npm run test:run`: Runs tests once (for CI/CD).
*   `npm run deploy`: Builds and deploys the application to Firebase Hosting.
*   `npm run backup`: Executes the data backup script.

### Critical Testing Commands:

*   `npm run test:run -- ReactErrorDetection`: Runs comprehensive React error detection tests
    *   Validates no React Hook Error #310 violations
    *   Checks for Temporal Dead Zone (TDZ) errors  
    *   Ensures proper component lifecycle management
    *   Verifies hook order compliance
    *   Tests memory leak prevention
    *   **Slide Architecture Validation**: Tests ensure slide components properly handle ResponsivePosition calculations
*   **Required:** Must pass before any component changes are committed

## Browser Automation & MCP Integration

The project includes Puppeteer Model Context Protocol (MCP) integration for automated browser testing and interaction.

### Available MCP Tools:
*   **Navigation:** `puppeteer_navigate` - Navigate to URLs
*   **Interaction:** `puppeteer_click`, `puppeteer_fill` - Interact with page elements
*   **Capture:** `puppeteer_screenshot` - Take page screenshots
*   **Authentication:** `puppeteer_login`, `puppeteer_logout` - Handle user authentication
*   **Evaluation:** `puppeteer_evaluate` - Execute JavaScript in browser context

### Authentication Methods:
*   **Development Bypass:** Set `VITE_DEV_AUTH_BYPASS=true` for instant authentication during testing
*   **Test Credentials:** Pre-configured test user accounts for realistic testing scenarios
*   **MCP Commands:** Automated authentication through MCP tools

### Testing Scripts:
*   `npm run mcp:validate` - Validate MCP server configuration
*   `npm run auth:test` - Test authentication workflows
*   `npm run mcp:demo` - Run demonstration of MCP capabilities

## Slide-Based Architecture Overview

### Core Slide System
The application has migrated from complex coordinate systems to a predictable slide-based architecture:

*   **SlideDeck Interface**: Collection of interactive slides with metadata and configuration
*   **InteractiveSlide Interface**: Individual slides containing elements, transitions, and layout information
*   **SlideElement Interface**: Elements within slides (hotspots, text, media, shapes) with responsive positioning
*   **ResponsivePosition System**: Fixed pixel positioning with desktop/tablet/mobile breakpoints

### Key Architecture Components

*   **SlideBasedEditor** (`src/client/components/SlideBasedEditor.tsx`): Main editing interface
*   **SlideBasedViewer** (`src/client/components/SlideBasedViewer.tsx`): Presentation and viewing interface  
*   **SlideEditor** (`src/client/components/slides/SlideEditor.tsx`): Visual drag-and-drop editor with canvas
*   **MobilePropertiesPanel** (`src/client/components/slides/MobilePropertiesPanel.tsx`): Touch-optimized property editing

### Responsive Positioning System
Elements use fixed pixel coordinates with responsive breakpoints:
```typescript
interface ResponsivePosition {
  desktop: FixedPosition;  // 1920x1080+ displays
  tablet: FixedPosition;   // 768-1919px displays  
  mobile: FixedPosition;   // <768px displays
}

interface FixedPosition {
  x: number;      // Exact pixel position from left
  y: number;      // Exact pixel position from top  
  width: number;  // Element width in pixels
  height: number; // Element height in pixels
}
```

### Migration & Backward Compatibility
*   **Automatic Migration**: Legacy hotspot-based projects automatically convert to slide format
*   **Data Preservation**: Existing timeline events and interactions are preserved during migration
*   **Legacy Support**: Backward compatibility maintained for existing projects while leveraging new architecture
