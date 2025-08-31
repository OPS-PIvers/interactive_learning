# GEMINI.md - Gemini AI Context for ExpliCoLearning

## Purpose
This document provides Gemini AI with essential context for the ExpliCoLearning project. All Gemini AI interactions must follow the unified responsive architecture principles documented here.

**CRITICAL**: This application uses 100% unified responsive architecture. Device-specific JavaScript branching is STRICTLY FORBIDDEN.

## Project Overview

ExpliCoLearning is an interactive web application for creating hotspot-based multimedia training walkthroughs with unified responsive design across all devices. The application features a mobile-first design with comprehensive touch gesture support and accessibility features.

**Architecture Evolution**: The app has been rebuilt from a complex 31,000+ line slide-based system to a focused, maintainable hotspot-centric architecture with simplified data models and streamlined components.

### Core Features:

*   **Hotspot-Based Content Creation:** Users can create interactive hotspot walkthroughs with multimedia content and effects.
*   **Unified Responsive Design:** Single components that adapt to mobile/desktop through CSS-only responsive design (NO device-specific JavaScript branching).
*   **Visual Drag-and-Drop Editor:** Hotspot editor with intuitive canvas for positioning interactive elements.
*   **Real Effect System:** Working spotlight, text, tooltip, and video effects that execute in real-time.
*   **Centralized Z-Index Management:** All components use centralized z-index system from `zIndexLevels.ts`.
*   **Modal Layout Constraint System:** Unified modal constraint system preventing toolbar overlap with responsive positioning.
*   **Firebase Integration:** Backend services for authentication, data storage, and file management.

## Technology Stack

### Frontend:

*   **Framework:** React 18.3.1 with TypeScript
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS (CSS-first responsive design)
*   **State Management:** React useState with callback patterns
*   **Routing:** React Router DOM 6.25.1
*   **Performance:** lodash.debounce for optimization
*   **Utilities:** classnames for conditional styling

### Backend & Database:

*   **Backend Services:** Firebase 10.14.1
*   **Database:** Firestore (NoSQL) with transactions
*   **File Storage:** Firebase Storage with security rules
*   **Hosting:** Firebase Hosting
*   **Authentication:** Firebase Auth with development bypass for testing

### Development & Testing:

*   **Testing Framework:** Vitest with React Testing Library
*   **Type Checking:** TypeScript ~5.7.2
*   **Linting:** ESLint (project configured)
*   **Browser Automation:** Dual approach with @playwright/test 1.55.0 and Puppeteer 24.14.0
*   **MCP Integration:** Playwright MCP (primary) + Puppeteer MCP server (@hisma/server-puppeteer)
*   **Bundle Analysis:** rollup-plugin-visualizer for performance optimization

## Project Structure

*   `src/client/`: Contains all the client-side application code.
    *   `components/`: React components (86 TypeScript files - unified responsive components).
        *   `hotspot/`: Hotspot-specific components (HotspotElement, HotspotEditor, HotspotCanvas, etc.).
        *   `viewers/`: Viewer components (HotspotViewer for walkthrough playback).
        *   `responsive/`: Unified responsive modal components (NO separate mobile/desktop).
        *   `auth/`: Authentication components.
        *   `dashboard/`: Dashboard and project management.
        *   `shared/`: Error boundaries and loading states.
        *   `touch/`: Touch gesture handling components.
        *   `ui/`: Reusable UI components.
    *   `hooks/`: Custom React hooks for responsive behavior (device detection for calculations only).
    *   `utils/`: Utility functions (centralized z-index management, layout constraints).
    *   `pages/`: Page-level components.
    *   `services/`: API and service layer.
    *   `contexts/`: React context providers.
*   `src/lib/`: Core application logic, including Firebase integration and data handling.
    *   `firebaseApi.ts`: Interacts with Firebase services.
    *   `authContext.tsx`: Manages user authentication state.
*   `src/shared/`: Types and data models shared between different parts of the application.
    *   `hotspotTypes.ts`: Core hotspot-based architecture interfaces.
    *   `baseTypes.ts`: Base interfaces and types (ResponsivePosition, BackgroundMedia, etc.).
    *   `hotspotStylePresets.ts`: Styling presets and theme system.
*   `scripts/`: Node.js scripts for administrative tasks, such as data backups.
*   `firebase.json`: Configuration for Firebase deployment and services.
*   `vite.config.ts`: Configuration for the Vite development server and build process.
*   `package.json`: Defines project scripts, dependencies, and metadata.

## Getting Started

### Prerequisites:

*   Node.js (version 18+)
*   A Firebase project

### Key Scripts:

*   `npm run dev`: Starts development server on port 3000
*   `npm run build`: Build for production
*   `npm run test`: Run tests in watch mode
*   `npm run test:run`: Run tests once (required before commits)
*   `npm run test:ui`: Run tests with UI
*   `npm run preview`: Preview production build locally
*   `npm run deploy`: Builds and deploys to Firebase Hosting
*   `npm run backup`: Executes data backup script

### Critical Testing Commands:

*   `npm run test:run -- ReactErrorDetection`: Runs comprehensive React error detection tests
    *   Validates no React Hook Error #310 violations
    *   Checks for Temporal Dead Zone (TDZ) errors  
    *   Ensures proper component lifecycle management
    *   Verifies hook order compliance
    *   Tests memory leak prevention
    *   **Slide Architecture Validation**: Tests ensure slide components properly handle ResponsivePosition calculations
*   **Required:** Must pass before any component changes are committed

### MCP Integration Commands:

*   `npm run mcp:workflow`: Run comprehensive Puppeteer MCP workflow tests
*   `npm run mcp:validate`: Validate Puppeteer MCP server configuration
*   `npm run mcp:demo`: Run Puppeteer MCP demonstration workflow
*   `npm run test:auth`: Test authentication system with Puppeteer automation
*   **Playwright MCP**: Available directly via Claude Code interface (no npm scripts needed)

## STRICT ARCHITECTURAL RULES FOR GEMINI AI

### 🚫 ABSOLUTELY FORBIDDEN PATTERNS
```typescript
// ❌ NEVER DO - Device-specific JavaScript branching
const isMobile = window.innerWidth < 768;
const { isMobile } = useIsMobile(); // This hook doesn't exist!
const height = isMobile ? '64px' : '56px';
if (deviceType === 'mobile') { /* render mobile UI */ }

// ❌ NEVER DO - Separate Mobile/Desktop components
import MobileComponent from './MobileComponent';
import DesktopComponent from './DesktopComponent';
return isMobile ? <MobileComponent /> : <DesktopComponent />;

// ❌ NEVER DO - Hardcoded z-index values
className="z-[70]" // Use Z_INDEX_TAILWIND constants
style={{ zIndex: 999 }} // Use centralized system
```

### ✅ REQUIRED UNIFIED PATTERNS
```typescript
// ✅ CORRECT - CSS-first responsive design
<div className="h-16 py-2 md:h-14 md:py-0">
  <button className="w-11 h-11 md:w-9 md:h-9">
    <Icon className="w-5 h-5 md:w-4 md:h-4" />
  </button>
</div>

// ✅ CORRECT - Single unified component
const UnifiedComponent: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row">
      <div className="p-4 md:p-6">
        {/* Content adapts via CSS only */}
      </div>
    </div>
  );
};

// ✅ CORRECT - Centralized z-index
import { Z_INDEX_TAILWIND } from '../utils/zIndexLevels';
<Modal className={Z_INDEX_TAILWIND.MODAL} />
```

### Device Detection - MATHEMATICAL USE ONLY
```typescript
// ✅ CORRECT - Mathematical calculations only
const { deviceType, viewportInfo } = useDeviceDetection();
const canvasWidth = viewportInfo.width * 0.8; // Math calculation OK
const dragBounds = calculateDragBounds(deviceType); // Position calculation OK

// ❌ FORBIDDEN - Device detection for UI rendering
const { deviceType } = useDeviceDetection();
return deviceType === 'mobile' ? <MobileUI /> : <DesktopUI />; // NEVER DO THIS
```

### Unified Responsive Design Rules
- **Single Components**: One component adapts to all screen sizes via CSS
- **CSS-First Design**: Tailwind breakpoints (`sm:`, `md:`, `lg:`) exclusively
- **No JavaScript Branching**: Device detection only for mathematical calculations
- **Centralized Z-Index**: Always use values from `zIndexLevels.ts`
- **Touch-First Design**: Design for touch interactions that also work with mouse/keyboard

## Browser Automation & MCP Integration

The project uses a dual browser automation approach:
- **Playwright MCP** (@playwright/test 1.55.0): Primary automation via Claude Code interface
- **Puppeteer MCP** (24.14.0 with @hisma/server-puppeteer): Custom server integration

### Playwright MCP Features (Primary):
*   **Cross-Browser Support:** Chromium, Firefox, and WebKit testing
*   **Device Emulation:** Mobile devices like "iPhone 15", "Pixel 5"
*   **Full MCP Tool Suite:** Available directly via Claude Code interface
*   **Advanced Testing:** Screenshots, accessibility snapshots, network monitoring

### Puppeteer MCP Features (Legacy Support):
*   **Authentication Testing:** Automated login flows with development bypass integration
*   **Workflow Validation:** End-to-end testing of hotspot creation and playback
*   **Custom Scripts:** npm run commands for specific testing scenarios
*   **Screenshot Capture:** Visual regression testing capabilities

### Browser Testing Support:
*   **Multi-Engine:** Playwright supports Chromium, Firefox, WebKit
*   **Device Testing:** Mobile and desktop viewport testing across both systems
*   **Authentication Flows:** Automated testing with development bypass integration

### Authentication Methods:
*   **Development Bypass:** Set `VITE_DEV_AUTH_BYPASS=true` for instant authentication during testing
*   **Test Credentials:** Pre-configured test user accounts for realistic testing scenarios
*   **Session Management:** Bypass injects mock user data into browser session storage

### Testing Scripts:
*   `npm run mcp:validate` - Validate Puppeteer MCP server configuration
*   `npm run test:auth` - Test authentication workflows with Puppeteer
*   `npm run mcp:demo` - Run Puppeteer MCP demonstration
*   **Playwright MCP** - Available directly via Claude Code interface (no scripts needed)

### MCP Best Practices for Gemini AI:
- **Single Action Per Call**: Limit each MCP call to one specific action
- **State Verification**: Always verify expected state after each action
- **Timeout Management**: Set appropriate timeouts (5-30 seconds)
- **Loop Prevention**: Avoid recursive task chains
- **Auth First**: Always establish bypass authentication before other actions
- **Work Chunking**: Break tasks into small, discrete steps
- **Screenshot Verification**: Take screenshots between major steps
- **Browser Diversity**: Test critical flows across all three engines
- **Device Testing**: Include both desktop and mobile viewports
- **Wait Strategies**: Use `browser_wait_for` instead of fixed delays
- **Accessibility**: Leverage `browser_snapshot` for accessibility validation

### Environment Configuration
```bash
# Playwright Settings
PLAYWRIGHT_TEST_URL=http://localhost:3000
PLAYWRIGHT_BROWSER=chromium
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_DEVICE="Desktop Chrome"

# Development Bypass
VITE_DEV_AUTH_BYPASS=true
VITE_DEV_USER_EMAIL=dev@localhost
VITE_DEV_USER_NAME=Development User

# Test Credentials  
TEST_USER_EMAIL=test@localhost.dev
TEST_USER_PASSWORD=TestPassword123!
TEST_USER_DISPLAY_NAME=Test User
```

## Hotspot-Based Architecture Overview

### Core Hotspot System  
The application has been rebuilt from complex slide systems to a simplified hotspot-based architecture:

*   **HotspotWalkthrough Interface**: Collection of interactive hotspots with background media and sequencing
*   **WalkthroughHotspot Interface**: Individual hotspot elements with position, content, interactions, and styling
*   **ResponsivePosition System**: Fixed pixel positioning with desktop/tablet/mobile breakpoints
*   **HotspotInteraction System**: Click/hover triggers with real effect execution

### Key Architecture Components

*   **HotspotViewer** (`src/client/components/viewers/HotspotViewer.tsx`): Main viewer for hotspot walkthroughs
*   **HotspotEditor** (`src/client/components/hotspot/HotspotEditor.tsx`): Visual drag-and-drop editor interface
*   **HotspotCanvas** (`src/client/components/hotspot/HotspotCanvas.tsx`): Interactive canvas for hotspot positioning
*   **HotspotPropertiesPanel** (`src/client/components/hotspot/HotspotPropertiesPanel.tsx`): Properties editor for hotspot configuration
*   **WalkthroughSequencer** (`src/client/components/hotspot/WalkthroughSequencer.tsx`): Sequence management for guided tours
*   **HotspotElement** (`src/client/components/hotspot/HotspotElement.tsx`): Individual hotspot component
*   **ResponsiveModal** (`src/client/components/responsive/ResponsiveModal.tsx`): Base unified modal system

### Responsive Positioning System
Elements use fixed pixel coordinates with responsive breakpoints:
```typescript
interface ResponsivePosition {
  desktop: FixedPosition;  // 1024+ displays
  tablet: FixedPosition;   // 768-1023px displays  
  mobile: FixedPosition;   // <768px displays
}

interface FixedPosition {
  x: number;      // Exact pixel position from left
  y: number;      // Exact pixel position from top  
  width: number;  // Element width in pixels
  height: number; // Element height in pixels
}

// Core hotspot interfaces from hotspotTypes.ts
interface HotspotWalkthrough {
  id: string;
  title: string;
  description: string;
  backgroundMedia: BackgroundMedia;
  hotspots: WalkthroughHotspot[];
  sequence: string[];
  createdAt: number;
  updatedAt: number;
  isPublished: boolean;
  creatorId: string;
}

interface WalkthroughHotspot {
  id: string;
  type: 'hotspot';
  position: ResponsivePosition;
  content: HotspotContent;
  interaction: HotspotInteraction;
  style: HotspotStyle;
  sequenceIndex: number;
}
```

### Architecture Evolution
*   **Simplified Data Model**: Migrated from complex slide system to focused hotspot walkthroughs
*   **Preserved Functionality**: Real effect system and responsive design maintained
*   **Clean Codebase**: Reduced from 31,000+ lines to manageable 86 TypeScript files
*   **Modern Stack**: Updated dependencies and streamlined architecture

## Modal Layout Constraint System

The application features a comprehensive modal layout constraint system that prevents modal dialogs from overlapping with fixed toolbars across all device types.

### Key Components
*   **useLayoutConstraints Hook** (`src/client/hooks/useLayoutConstraints.ts`):
    *   Unified constraint system for safe modal positioning
    *   Uses `useDeviceDetection` and `useViewportHeight` for responsive behavior
    *   Provides `useModalConstraints` and `useConstraintAwareSpacing` specialized hooks
    *   Device-aware z-index management and CSS variable generation

*   **ModalLayoutManager Class** (`src/client/utils/ModalLayoutManager.ts`):
    *   Centralized utility for modal positioning and constraint calculations
    *   Placement validation and responsive behavior
    *   Support for standard, properties, confirmation, fullscreen, and drawer modal types

*   **ResponsiveModal Component** (`src/client/components/responsive/ResponsiveModal.tsx`):
    *   Unified modal supporting both desktop and mobile layouts
    *   Integrated with constraint system for consistent positioning
    *   Uses centralized z-index system from `zIndexLevels.ts`

### Features
*   **Toolbar Overlap Prevention**: Systematic prevention of modal-toolbar conflicts
*   **Unified Z-Index Management**: Centralized system eliminates hardcoded values using `zIndexLevels.ts`
*   **CSS-Based Responsive Layout**: Automatic responsive adjustments using Tailwind breakpoints
*   **Safe Area Handling**: Respects device safe areas using CSS env() variables
*   **Progressive Enhancement**: Touch-first design that enhances for keyboard/mouse
*   **Cross-Platform Compatibility**: Works consistently across all browsers and devices

### Device Detection System - MATHEMATICAL USE ONLY
*   **useDeviceDetection Hook**: For mathematical calculations only (canvas dimensions, drag boundaries)
*   **FORBIDDEN**: Never use for conditional UI rendering - use CSS breakpoints instead
*   **Viewport Management**: `useViewportHeight` with CSS viewport unit support
*   **Responsive Breakpoints**: Desktop (1024+), tablet (768-1023), mobile (<768)
*   **Touch Gestures**: `useTouchGestures` with momentum physics for canvas interactions
*   **Accessibility**: `useScreenReaderAnnouncements` with live regions

## Unified Toolbar Architecture

The application uses unified toolbar components that adapt automatically to all screen sizes:

### ViewerFooterToolbar.tsx - Primary Navigation Interface
- **CSS-Only Responsive Design:** Single component using Tailwind breakpoints for layout adaptation
- **Z-Index Integration:** Uses centralized z-index system (TOOLBAR: 9999)
- **Timeline Navigation:** Slide navigation controls with visual progress indicators
- **Mode Controls:** Switch between viewing modes ("Explore", "Guided Tour")
- **Accessibility:** ARIA labels, keyboard navigation, and shortcuts modal

### Editor Toolbars - Consistent Editing Interface
- **SlideEditorToolbar.tsx:** Modern slide-based editing toolbar with responsive CSS design
- **EnhancedModalEditorToolbar.tsx:** Enhanced modal editing interface
- **Z-Index Compliance:** All toolbars use centralized z-index values for proper layering

### CRITICAL: No Separate Mobile/Desktop Toolbars
- **FORBIDDEN PATTERN:** Creating separate `MobileToolbar` and `DesktopToolbar` components
- **REQUIRED PATTERN:** Single unified toolbar with CSS-first responsive behavior

## Development Requirements for Gemini AI

### ABSOLUTE PROHIBITIONS
- **NO device-specific JavaScript branching** (`isMobile`, `window.innerWidth`, etc.)
- **NO separate Mobile*/Desktop* components** - unified design only
- **NO hardcoded z-index values** - use centralized system
- **NO conditional rendering based on device type**
- **NO modification of package.json** without verification
- **NO changes to core Firebase configuration**
- **NO removal of accessibility features**

### Required Practices
- **ALWAYS use CSS-first responsive design** with Tailwind breakpoints
- **ALWAYS use centralized z-index values** from `zIndexLevels.ts`
- **ALWAYS write TypeScript interfaces** for component props
- **ALWAYS include accessibility attributes** (ARIA labels, roles)
- **ALWAYS run tests** before committing changes
- **ASK BEFORE major architectural changes**

### TypeScript Component Template
```typescript
// ✅ CORRECT - Unified responsive component
interface ComponentProps {
  title: string;
  onAction: () => void;
  variant?: 'primary' | 'secondary';
}

const Component: React.FC<ComponentProps> = ({ 
  title, 
  onAction, 
  variant = 'primary' 
}) => {
  return (
    <div className="bg-white border rounded-lg p-4 md:p-6">
      <h3 className="text-lg md:text-xl font-semibold mb-4">
        {title}
      </h3>
      <button
        onClick={onAction}
        className={`w-full md:w-auto px-4 py-2 rounded-lg transition-colors ${
          variant === 'primary' 
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        }`}
      >
        Action
      </button>
    </div>
  );
};

export default Component;
```

### Success Criteria
- All tests passing (`npm run test:run`)
- TypeScript compilation without errors  
- No console errors in development
- Responsive behavior works across all breakpoints
- Accessibility features intact (screen readers, keyboard navigation)
- Uses unified responsive architecture patterns

### Final Checklist
- [ ] Component uses CSS-first responsive design (no JavaScript device detection)
- [ ] TypeScript interfaces defined for all props
- [ ] Accessibility attributes included (ARIA labels, roles, etc.)
- [ ] Centralized z-index values used (from `zIndexLevels.ts`)
- [ ] Tests written and passing
- [ ] No hardcoded device-specific values
- [ ] Responsive behavior tested across breakpoints (sm, md, lg)
- [ ] No circular imports or dependency issues

---

## 🚨 CRITICAL: Unified Architecture Enforcement

**This application uses 100% unified responsive architecture. Any violation of these principles will break the system's consistency and maintainability.**

### Before Every Change:
1. **Verify** no device-specific JavaScript branching
2. **Confirm** CSS-first responsive design only
3. **Check** centralized z-index usage
4. **Test** across all breakpoints
5. **Validate** TypeScript compilation
6. **Run** complete test suite

**Remember: One codebase, one responsive design system, zero device-specific branching.**
