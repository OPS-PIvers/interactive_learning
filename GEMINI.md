# Gemini Codebase Context: Interactive Learning Hub

This document provides context for the "Interactive Learning Hub" codebase.

## Project Overview

The Interactive Learning Hub is a web application designed for creating and delivering interactive multimedia training modules. It allows content creators to build engaging educational experiences by placing interactive hotspots on images and guiding learners through timeline-driven sequences.

### Core Features:

*   **Interactive Content Creation:** Users can add clickable hotspots to images, embedding rich media like videos, audio, and quizzes.
*   **Timeline-Based Learning:** A timeline builder allows for the creation of step-by-step learning experiences with over 17 different interaction types.
*   **Multi-Device Support:** The application is designed to be responsive, with optimized experiences for both desktop and mobile devices.
*   **Real-time Collaboration:** The Firebase backend enables real-time data synchronization.

## Technology Stack

### Frontend:

*   **Framework:** React 18 with TypeScript
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS
*   **State Management:** React Hooks and Context API
*   **Routing:** React Router
*   **Drag and Drop:** @dnd-kit

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
    *   `components/`: Reusable React components.
    *   `hooks/`: Custom React hooks for shared logic.
    *   `utils/`: Utility functions.
    *   `styles/`: Global and component-specific styles.
*   `src/lib/`: Core application logic, including Firebase integration and data handling.
    *   `firebaseApi.ts`: Interacts with Firebase services.
    *   `authContext.tsx`: Manages user authentication state.
*   `src/shared/`: Types, interfaces, and data structures shared between different parts of the application.
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
