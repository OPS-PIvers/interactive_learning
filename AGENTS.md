# AGENTS.md - Jules AI Instructions

## Purpose
This file provides instructions for Jules AI (Google Labs async coding agent) working on this Interactive Learning Hub project. Jules reads this file to understand project context, patterns, and requirements.

## Project Context for Jules

// Interactive web application for creating multimedia training modules with hotspot-based learning experiences

### Tech Stack
- React 18.3.1 + TypeScript + Vite
- Firebase 11.9.1 (Firestore + Storage) 
- Tailwind CSS styling
- Vitest testing
- Key deps: react-dnd, lodash.debounce

## Essential Commands
// Always run tests before committing
npm run test:run

// Development server
npm run dev

// Production build  
npm run build

// MCP testing and validation
npm run mcp:workflow test
npm run mcp:validate
npm run auth:test

## Before Making Changes
// Read CLAUDE.md first - contains essential project architecture
// Check existing patterns in similar components
// Verify dependencies exist in package.json
// Run tests to ensure current state works

## Code Standards for Jules

// Use strict TypeScript - all props need interfaces, avoid `any` types
// Functional components with hooks only
// Implement proper useEffect cleanup
// Use custom hooks for complex logic (see src/client/hooks/)
// Mobile/desktop split with useIsMobile() hook
// Include ARIA attributes for accessibility

## File Structure
```
.github/          # GitHub Actions workflows
scripts/          # Utility scripts (e.g., backup-data.ts)
src/
├── client/       # Frontend application (React)
│   ├── components/     # React components (~40 files)
│   │   ├── InteractiveModule.tsx    # Main app container
│   │   ├── HotspotEditorModal.tsx   # Primary hotspot editor
│   │   ├── ImageEditCanvas.tsx      # Image editing canvas
│   │   ├── Mobile*/                 # Mobile-specific components
│   │   └── icons/                   # Icon components
│   ├── hooks/          # Custom React hooks (5 files)
│   │   ├── useIsMobile.ts           # Mobile detection
│   │   ├── useTouchGestures.ts      # Touch handling
│   │   └── useScreenReaderAnnouncements.ts  # Accessibility
│   ├── utils/          # Client-side utility functions (5 files)
│   │   ├── touchUtils.ts            # Touch event utilities
│   │   └── mobileUtils.ts           # Mobile-specific utilities
│   └── styles/         # CSS and styling files
├── lib/              # Core logic, Firebase utilities (5 files)
│   ├── firebaseApi.ts           # Firebase integration
│   ├── firebaseConfig.ts        # Firebase configuration
│   └── safeMathUtils.ts         # Mathematical utilities
├── shared/           # Types and logic shared between client/server
│   ├── types.ts                 # TypeScript interfaces
│   └── InteractionPresets.ts    # Event system presets
└── tests/            # Test files (Vitest)
    ├── safeMathUtils.test.ts
    └── eventSystem.test.ts

# Key Configuration Files
AGENTS.md         # Instructions for AI agents (this file)
CLAUDE.md         # Project architecture overview
README.md         # Main project documentation
firebase.json     # Firebase hosting and services configuration
firestore.rules   # Firestore security rules
storage.rules     # Firebase Storage security rules
package.json      # Project dependencies and scripts
tsconfig.json     # TypeScript configuration
vite.config.ts    # Vite build configuration
vitest.config.ts  # Vitest test runner configuration
```

## Naming Conventions
// Components: PascalCase (InteractiveModule.tsx)
// Hooks: camelCase with 'use' prefix (useIsMobile.ts)
// Utilities: camelCase (safeMathUtils.ts)
// Types/Interfaces: PascalCase (InteractionType)

## Key Architecture Points

// Main component: src/client/components/InteractiveModule.tsx
// State management: React useState with complex interdependencies
// Touch handling: useTouchGestures for pan/zoom, separate pointer events for hotspots  
// Modal system: HotspotEditorModal and EnhancedModalEditorToolbar

## Mobile Development
// Always use useIsMobile() hook for responsive behavior
// Implement debounced inputs for performance
// Coordinate touch gestures between pan/zoom and hotspot interactions
// Test touch interactions thoroughly

## Firebase Integration
// Use Firestore for data storage
// Firebase Storage for images/media
// Implement transactions for data consistency
// Always include proper error handling for network operations
// Use Firebase emulator for local development

## MCP Integration & Browser Automation
// Puppeteer MCP servers configured: puppeteer-hisma and puppeteer-custom
// Authentication bypass available: VITE_DEV_AUTH_BYPASS=true
// Test credentials: TEST_USER_EMAIL=test@localhost.dev

### MCP Development Workflow
// Validate MCP configuration before testing
npm run mcp:validate

// Test authentication system 
npm run auth:test

// Run MCP demonstration
npm run mcp:demo

// Debug MCP server issues
npm run mcp:workflow debug-hisma

### Authentication Setup for Testing
// Quick development bypass in .env.local:
VITE_DEV_AUTH_BYPASS=true
VITE_DEV_USER_EMAIL=dev@localhost
VITE_DEV_USER_NAME=Development User

// Test user credentials:
TEST_USER_EMAIL=test@localhost.dev
TEST_USER_PASSWORD=TestPassword123!

### MCP Usage Patterns
// Claude can use these MCP tools for browser automation:
// puppeteer_navigate, puppeteer_screenshot, puppeteer_click, 
// puppeteer_fill, puppeteer_login, puppeteer_logout, puppeteer_auth_status

// Example Claude commands:
// "Navigate to localhost:3000, login with bypass method, test hotspots"
// "Screenshot the mobile version after setting mobile viewport"
// "Test authentication flow: login, verify, logout"

## Event System
// Follow InteractionType enum for hotspot events
// Use TimelineEventData interface for timeline events
// Reference InteractionPresets for UI metadata
// Events execute in sequence based on timeline steps

## Testing Requirements
// Write unit tests for all new utilities and hooks
// Test components with user interactions
// Verify mobile-specific behaviors
// Test Firebase integration with mocked services
// ALWAYS run npm run test:run before committing

### Critical React Error Detection
// Must run before any component changes are committed
npm run test:run -- ReactErrorDetection

// This test validates:
// - No React Hook Error #310 violations
// - No Temporal Dead Zone (TDZ) errors
// - No component lifecycle violations
// - Proper hook order maintenance
// - Memory leak prevention

## Security & Performance
// Never commit API keys or secrets
// Validate all user inputs
// Use Firebase security rules appropriately
// Sanitize file uploads
// Use lodash.debounce for expensive operations
// Implement lazy loading for large images
// Use React.memo for expensive components
// Monitor bundle size with build process

## Common Prompts for Jules

// Refactor {specific component} to use TypeScript interfaces
// Add unit tests for {specific hook or utility}
// Fix mobile responsiveness issue in {specific component}
// Implement {specific feature} following existing patterns
// Debug {specific error} in Firebase integration
// Add accessibility features to {specific component}
// Optimize performance of {specific expensive operation}

## Known Issues & Patterns
// Large image files impact performance
// Touch gesture coordination between pan/zoom and hotspot interaction
// Firebase emulator setup required for local development
// Complex state interdependencies in main component
// Use VS Code with TypeScript extensions
// Use Firebase emulator for local development
// Use React Developer Tools for debugging
// Use Vitest UI for test debugging

## Documentation Guidelines
// Update CLAUDE.md when changing core architecture
// Update this file when changing development workflows
// Document complex business logic with comments
// Explain non-obvious technical decisions
// Add TODO comments for known technical debt
// Use JSDoc for public APIs

## Restrictions for Jules
// Do NOT create new files in root directory
// Do NOT modify package.json dependencies without verification
// Do NOT change core Firebase configuration
// Do NOT remove existing accessibility features
// Do NOT break mobile responsiveness
// Do NOT skip test writing for new features
// ASK BEFORE major architectural changes
// ASK BEFORE adding new dependencies

## Success Criteria
// All tests passing
// TypeScript compilation without errors
// No console errors in development
// Accessible to screen readers
// Responsive on mobile devices
// Performance within acceptable ranges

## Final Checklist
// Tests written and passing
// TypeScript compilation successful
// Mobile responsiveness verified
// Accessibility features intact
// Performance impact assessed
// Documentation updated if needed

---

## 🚨 CRITICAL: TDZ (Temporal Dead Zone) ERROR PREVENTION

**EVERY DEVELOPMENT TASK MUST FOLLOW THESE RULES TO PREVENT TDZ ERRORS:**

### Import/Export Order Rules:
```typescript
// ✅ CORRECT ORDER:
// 1. React imports first
import React, { useState, useEffect, useCallback } from 'react';
// 2. Third-party imports
import { DndProvider } from 'react-dnd';
// 3. Internal types and interfaces
import { HotspotData, TimelineEventData, InteractionType } from '../../shared/types';
// 4. Internal components (no circular imports!)
import { MobileSlider } from './MobileSlider';
// 5. Relative imports last
import './styles.css';

// ❌ NEVER DO:
import { ComponentThatImportsThis } from './ComponentThatImportsThis'; // Circular!
```

### Component Declaration Rules:
```typescript
// ✅ CORRECT - Declare interfaces before components:
interface Props {
  value: string;
  onChange: (value: string) => void;
}

// ✅ CORRECT - Use const declarations for components:
const MyComponent: React.FC<Props> = ({ value, onChange }) => {
  // Component logic here
};

// ✅ CORRECT - Export after declaration:
export default MyComponent;

// ❌ NEVER DO - Function declarations can cause hoisting issues:
function MyComponent() { } // Avoid this pattern
```

### State Initialization Rules:
```typescript
// ✅ CORRECT - Initialize all state with proper defaults:
const [eventSettings, setEventSettings] = useState<EventSettings>({
  type: InteractionType.SHOW_TEXT,
  enabled: false,
  // Always provide complete initial state
});

// ✅ CORRECT - Use callback pattern for expensive initialization:
const [computedState, setComputedState] = useState(() => {
  return expensiveComputation();
});

// ❌ NEVER DO - Undefined initial state:
const [settings, setSettings] = useState<Settings>(); // TDZ risk!
```

### Hook Dependencies Rules:
```typescript
// ✅ CORRECT - List all dependencies:
useEffect(() => {
  if (hotspot && eventType) {
    updateEvent();
  }
}, [hotspot, eventType, updateEvent]); // All dependencies listed

// ✅ CORRECT - Use useCallback for functions used in dependencies:
const updateEvent = useCallback(() => {
  // function logic
}, [dependency1, dependency2]);

// ❌ NEVER DO - Missing dependencies:
useEffect(() => {
  updateEvent();
}, []); // Missing dependencies causes stale closures
```

### Variable Access Rules:
```typescript
// ✅ CORRECT - Check existence before access:
const handleUpdate = () => {
  if (selectedHotspot?.id) {
    processHotspot(selectedHotspot.id);
  }
};

// ✅ CORRECT - Use optional chaining:
const title = hotspot?.title || 'Default Title';

// ❌ NEVER DO - Access without checking:
const id = selectedHotspot.id; // TDZ error if selectedHotspot is undefined
```

### Component Integration Rules:
```typescript
// ✅ CORRECT - Always check props before rendering:
if (!isOpen || !hotspot) {
  return null;
}

// ✅ CORRECT - Provide fallbacks for undefined props:
const eventList = events || [];

// ❌ NEVER DO - Render without checking:
return <div>{hotspot.title}</div>; // TDZ error if hotspot is undefined
```

**VALIDATION CHECKLIST FOR EVERY TASK:**
- [ ] No circular imports between new and existing files
- [ ] All imports follow correct order (React → 3rd party → internal → relative)
- [ ] All state initialized with proper defaults
- [ ] All useEffect dependencies properly listed
- [ ] All props checked before use
- [ ] All optional chaining used where needed
- [ ] No access to variables before declaration
- [ ] All exports come after declarations

### TDZ Error Prevention Validation
**MUST be run after EVERY completed task**

**TDZ Testing Checklist:**
```bash
# 1. Build test - catches most TDZ errors
npm run build

# 2. TypeScript check
npm run type-check

# 3. Start dev server and check console
npm run dev
# Look for errors like:
# - "Cannot access 'X' before initialization"
# - "X is not defined"
# - "Cannot read property of undefined"

# 4. Test specific user flows:
# - Open mobile editor
# - Create new hotspot
# - Add different event types
# - Preview events
# - Switch between tabs
# - Save and reload

# 5. Check browser console for any errors during these flows
```

**Common TDZ Error Patterns to Check:**
- Components that don't render (blank screens)
- State that resets unexpectedly
- Functions that are undefined when called
- Import errors in dev tools
- Circular dependency warnings

**If TDZ errors found:**
1. Check import order in affected files
2. Verify all state has default values
3. Check for circular imports between components
4. Ensure all variables declared before use
5. Add optional chaining where needed

---

## ACTIVE TASKS

### Performance Optimization for Mobile (In Progress)
**Status:** Partial completion
**Files to modify:** All mobile components

**Remaining optimizations needed:**
- Virtual scrolling for long event lists (SKIPPED due to complexity with dnd-kit)
- Memory leak prevention (COMPLETED - code review found no leaks)
- Bundle size optimization (COMPLETED - analysis showed good chunking)

**Completed optimizations:**
- ✅ Lazy loading of event settings components
- ✅ Image optimization and lazy loading  
- ✅ Animation performance optimization

### Create Mobile Editor Test Suite (Pending)
**Status:** Not started
**Files to create:**
- `src/client/components/mobile/__tests__/`
- Test files for all mobile components

**Test coverage needed:**
- Unit tests for all mobile components
- Integration tests for event creation workflow
- Touch gesture testing
- Performance testing on various devices
- Accessibility testing
- Cross-browser mobile testing

---

// This is a complex interactive application with mobile-first design and accessibility requirements
// Always prioritize user experience and code maintainability over feature velocity