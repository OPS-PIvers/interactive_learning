# CLAUDE.md - Interactive Learning Hub

## Project Overview
Interactive web application for creating interactive multimedia training modules with hotspot-based learning experiences. Users can upload images, add interactive hotspots with various event types, and create timeline-based learning sequences. The application features a mobile-first design with comprehensive touch gesture support and accessibility features.

## Development Commands
- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once (required before commits)
- `npm run test:ui` - Run tests with UI
- `npm run preview` - Preview production build locally

## Architecture Context
- **Main Component**: `src/client/components/InteractiveModule.tsx` - Core container handling editing and viewing modes
- **Dual Mode System**: Clean separation between `InteractiveEditor` and `InteractiveViewer` components
- **State Management**: React useState with callback patterns and complex interdependencies
- **Mobile-First Design**: Comprehensive mobile component library under `mobile/` directory
- **Mobile Detection**: `useIsMobile()` hook drives conditional rendering with debounced resize handling
- **Touch Handling**: `useTouchGestures` hook with momentum physics for pan/zoom coordination
- **Modal System**: Enhanced modals with mobile-specific variants and event editing capabilities
- **Accessibility**: `useScreenReaderAnnouncements` hook with live regions for screen reader support

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
│   ├── components/          # 70+ React components
│   │   ├── mobile/         # 38 mobile-specific components
│   │   ├── desktop/        # 6 desktop modal components  
│   │   ├── icons/          # 19 custom icon components
│   │   └── shared/         # Error boundaries and loading states
│   ├── hooks/              # 14 custom hooks
│   ├── utils/              # 22 utility modules
│   └── styles/             # CSS modules and stylesheets
├── lib/                    # Firebase integration and core utilities
├── shared/                 # Types, presets, and migration logic
└── tests/                  # Vitest test suite with error detection
```

## Component Conventions
- **Naming**: PascalCase with descriptive prefixes (`Mobile*`, `Desktop*`, `Enhanced*`)
- **Props**: TypeScript interfaces for all component props (never use `any`)
- **Exports**: Default exports for components, named exports for utilities
- **Cleanup**: Implement proper cleanup in useEffect hooks with dependency arrays
- **Architecture**: Compound component patterns for modals, editors, and viewers
- **Mobile-First**: Separate mobile and desktop rendering logic with mobile-specific components
- **Accessibility**: Include proper ARIA attributes and use accessibility hooks
- **State**: Use `useCallback` and `useMemo` for performance optimization
- **Imports**: Direct imports over barrel exports for better tree-shaking

## Event System
- **InteractionType enum** defines available hotspot event types with unified architecture
- **TimelineEventData** interface for timeline events with extensive properties
- **InteractionPresets** provides UI metadata for each interaction type
- **Event Execution**: Events are executed in sequence based on timeline step
- **Event Settings**: Modal editing for `PLAY_AUDIO`, `PLAY_VIDEO`, `PAN_ZOOM`, `SPOTLIGHT`, and `HIGHLIGHT_HOTSPOT`
- **Legacy Support**: Backward compatibility maintained while consolidating similar event types
- **Text Banner**: Optional text banner display for visual events with accessibility support

## Working with Hotspots
- Each hotspot has position coordinates as percentages for responsive layout
- Use `safeMathUtils.ts` for coordinate calculations and safe transforms
- Mobile and desktop have separate touch handling systems with gesture coordination
- Hotspot editing uses enhanced modal system with context-specific panels
- **Mobile Editing**: Specialized mobile hotspot editor with touch-optimized controls
- **Event Coordination**: Separate user gestures from automated event execution
- **Transform State**: Complex state management for pan/zoom operations with momentum physics

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
- **Mobile Detection**: Use `useIsMobile()` hook with debounced resize handling for responsive behavior
- **Performance**: Implement debounced inputs and throttled touch events for optimal performance
- **Touch Feedback**: Provide proper haptic feedback using `triggerHapticFeedback` utility
- **Mobile Components**: Use mobile-specific components under `mobile/` directory
- **Viewport Handling**: Use `useViewportHeight` hook for mobile viewport quirks
- **Keyboard Management**: Use `useMobileKeyboard` for keyboard interaction handling
- **Testing**: Test on actual mobile devices when possible, use mobile-specific test cases

## Custom Hook Patterns
- **Touch Gestures**: `useTouchGestures` with momentum physics and gesture coordination
- **Mobile Touch**: `useMobileTouchGestures` for simplified mobile touch handling
- **Performance**: `useIntersectionObserver` for efficient rendering of large lists
- **Accessibility**: `useScreenReaderAnnouncements` with live regions
- **Cleanup**: Always include proper dependency arrays and cleanup functions
- **State Optimization**: Use `useCallback` and `useMemo` to prevent unnecessary re-renders

## TypeScript Best Practices
- **Strict Types**: Use strict TypeScript interfaces, avoid `any` type
- **Event Types**: Use unified `InteractionType` enum with legacy support
- **Component Props**: Define clear interfaces for all component props
- **Utility Types**: Use Position, Size, Transform interfaces for geometric calculations
- **Migration Support**: Include data migration utilities for schema evolution
- **Type Guards**: Implement type guards for runtime type checking

## Performance Optimization
- **Debouncing**: Use `lodash.debounce` for input handling and resize events
- **Memory Management**: Implement proper cleanup in useEffect hooks
- **Image Optimization**: Use appropriate image formats and loading strategies
- **Touch Events**: Coordinate between user gestures and automated events
- **Bundle Size**: Use direct imports for better tree-shaking

## Known Limitations & Architecture Notes
- **Large Datasets**: Image files and large hotspot collections may impact performance
- **Touch Coordination**: Complex gesture coordination between pan/zoom and hotspot interaction
- **Firebase Setup**: Firebase emulator setup required for local development and testing
- **Legacy Support**: Maintaining backward compatibility while evolving the event system
- **Mobile Viewport**: iOS Safari viewport quirks require specialized handling