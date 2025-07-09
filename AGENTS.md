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
src/
├── client/
│   ├── components/     # React components
│   ├── hooks/         # Custom React hooks  
│   ├── utils/         # Utility functions
│   └── styles/        # CSS files
├── lib/               # Firebase and core utilities
├── shared/            # Types and shared logic
└── tests/             # Test files
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

// This is a complex interactive application with mobile-first design and accessibility requirements
// Always prioritize user experience and code maintainability over feature velocity