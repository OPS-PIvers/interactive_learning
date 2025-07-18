# CLAUDE.md - Interactive Learning Hub

## Project Overview
Interactive web application for creating interactive multimedia training modules with hotspot-based learning experiences. Users can upload images, add interactive hotspots with various event types, and create timeline-based learning sequences.

## Development Commands
- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:ui` - Run tests with UI
- `npm run preview` - Preview production build locally

## Architecture Context
- **Main Component**: `src/client/components/InteractiveModule.tsx` - Core container handling editing and viewing modes
- **State Management**: React useState with complex interdependencies
- **Mobile Detection**: `useIsMobile()` hook drives conditional rendering throughout
- **Touch Handling**: `useTouchGestures` hook for pan/zoom, separate pointer events for hotspot interactions
- **Modal System**: `HotspotEditorModal` for editing, `EnhancedModalEditorToolbar` for settings
- **Accessibility**: `useScreenReaderAnnouncements` hook for comprehensive screen reader support

## Key Dependencies
- **React 18.3.1** with TypeScript
- **Vite** for build tooling and dev server
- **Firebase 11.9.1** for backend (Firestore + Storage)
- **react-dnd** for drag and drop functionality
- **Tailwind CSS** for styling
- **lodash.debounce** for performance optimization

## File Structure Patterns
```
src/
├── client/
│   ├── components/          # React components
│   ├── hooks/              # Custom React hooks  
│   ├── utils/              # Utility functions
│   └── styles/             # CSS files
├── lib/                    # Firebase and core utilities
├── shared/                 # Types and shared logic
└── tests/                  # Test files
```

## Component Conventions
- Use TypeScript interfaces for all props
- Implement proper cleanup in useEffect hooks
- Use custom hooks for complex logic (touch handling, accessibility)
- Separate mobile and desktop rendering logic
- Include proper ARIA attributes for accessibility

## Event System
- **InteractionType enum** defines available hotspot event types
- **TimelineEventData** interface for timeline events
- **InteractionPresets** provides UI metadata for each interaction type
- Events are executed in sequence based on timeline step

## Working with Hotspots
- Each hotspot has position coordinates as percentages
- Use `safeMathUtils.ts` for coordinate calculations
- Mobile and desktop have separate touch handling systems
- Hotspot editing uses modal system with context-specific panels

## Testing Guidelines
- Use Vitest for unit tests
- Test files located in `src/tests/`
- Run `npm run test:run` before committing
- All tests must pass for PR approval

### Critical Error Detection Tests
- `npm run test:run -- ReactErrorDetection` - Run React error detection tests
- Tests for React Hook Error #310, TDZ errors, and component violations
- Must pass before any component changes are committed
- Validates proper hook order and component lifecycle management

## Firebase Integration
- Firestore for data storage
- Firebase Storage for images/media
- Use transactions for data consistency
- Implement proper error handling for network operations

## Mobile Development Notes
- Use `useIsMobile()` hook for responsive behavior
- Implement debounced inputs for performance
- Provide proper touch feedback
- Test on actual mobile devices when possible

## Known Limitations
- Large image files may impact performance
- Touch gestures require careful coordination between pan/zoom and hotspot interaction
- Firebase emulator setup required for local development