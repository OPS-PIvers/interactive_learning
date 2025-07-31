# CLAUDE.md - ExpliCoLearning

## Project Overview
Interactive web application for creating slide-based multimedia training modules with element-based learning experiences. Users can create multi-slide presentations, add interactive elements (hotspots, text, media, shapes) with responsive positioning, and create interactive learning sequences. The application features a mobile-first design with comprehensive touch gesture support and accessibility features.

**Architecture Migration**: The app has migrated from complex coordinate systems to a predictable slide-based architecture with fixed positioning and responsive breakpoints.

## Development Commands
- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once (required before commits)
- `npm run test:ui` - Run tests with UI
- `npm run preview` - Preview production build locally

## Architecture Context
- **Main Components**: `src/client/components/SlideBasedEditor.tsx` and `src/client/components/SlideBasedViewer.tsx` - Core containers for slide-based editing and viewing
- **Slide Editor**: `src/client/components/slides/SlideEditor.tsx` - Visual drag-and-drop editor with responsive positioning
- **Dual Mode System**: Clean separation between slide-based editing and viewing with enhanced component architecture
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
- **dnd-kit** for accessible drag-and-drop functionality
- **Framer Motion** for smooth animations and transitions
- **Tailwind CSS** for styling
- **lodash.debounce** for performance optimization
- **react-router-dom** for client-side routing

## File Structure Patterns
```
src/
├── client/
│   ├── components/          # 130+ React components
│   │   ├── slides/         # 14 slide-specific components including effects/
│   │   ├── mobile/         # 14 mobile-specific components
│   │   ├── desktop/        # 6 desktop modal components  
│   │   ├── icons/          # 24 custom icon components
│   │   ├── interactions/   # 3 interaction system components
│   │   ├── animations/     # 3 animation and transition components
│   │   └── shared/         # Error boundaries and loading states
│   ├── hooks/              # 19 custom hooks
│   ├── utils/              # 22 utility modules
│   ├── contexts/           # React context providers
│   └── styles/             # CSS modules and stylesheets
├── lib/                    # Firebase integration and core utilities
├── shared/                 # Types, slide architecture, and migration logic
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

## Viewer Architecture

### ViewerFooterToolbar.tsx
The `ViewerFooterToolbar.tsx` component is the primary user interface for navigating and controlling the viewer experience. It is a highly configurable component that adapts its layout and functionality based on the device (mobile or desktop) and the current viewing mode.

**Key Features:**
- **Responsive Design:** Provides distinct layouts for mobile and desktop screens to ensure an optimal user experience on any device.
- **Timeline Navigation:** Includes controls for moving between slides, as well as a visual progress indicator with clickable dots.
- **Step-Based Navigation:** Supports step-by-step navigation within a slide's timeline.
- **Mode Controls:** Allows users to switch between different viewing modes, such as "Explore" and "Guided Tour."
- **Accessibility:** Designed with accessibility in mind, featuring ARIA labels, keyboard navigation, and a shortcuts modal.

## Slide-Based Architecture
- **SlideDeck** interface defines collection of interactive slides with metadata
- **InteractiveSlide** interface for individual slides with elements, transitions, and layout
- **SlideElement** interface for slide elements (hotspots, text, media, shapes) with responsive positioning
- **ResponsivePosition** system with desktop/tablet/mobile breakpoints using fixed pixel positioning
- **ElementInteraction** system for element-based interactions and effects
- **SlideTransition** interface for navigation and animation between slides
- **Migration Support**: Automatic migration from legacy hotspot-based system to slide architecture
- **Backward Compatibility**: Legacy timeline events supported alongside new slide system

## Working with Slide Elements
- Elements use fixed pixel positioning with responsive breakpoints (desktop/tablet/mobile)
- Use `ResponsivePosition` interface for consistent cross-device positioning
- dnd-kit drag-and-drop API for accessible element positioning within slide canvas
- Element editing uses slide-specific property panels with device-responsive controls
- **Mobile Editing**: `MobilePropertiesPanel` component with touch-optimized controls
- **Element Types**: Support for hotspots, text, media, and shape elements
- **Device Detection**: `useDeviceDetection()` hook for responsive positioning calculations
- **Canvas System**: Slide editor canvas with visual drag-and-drop interface

## Testing Guidelines
- Use Vitest for unit tests
- Test files located in `src/tests/`
- Run `npm run test:run` before committing
- All tests must pass for PR approval

### Viewer Component Testing
As of Phase 4 of the viewer cleanup, all major viewer components now have comprehensive test coverage. The test for `ViewerFooterToolbar.tsx` can be found in `src/tests/ViewerFooterToolbar.test.tsx`. This test suite covers all functionality of the component, including responsive behavior and accessibility.

### Critical Error Detection Tests
- `npm run test:run -- ReactErrorDetection` - Run React error detection tests
- Tests for React Hook Error #310, TDZ errors, and component violations
- Must pass before any component changes are committed
- Validates proper hook order and component lifecycle management
- **Slide Architecture Validation**: Tests ensure slide components properly handle ResponsivePosition calculations

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
- **Device Detection**: `useDeviceDetection()` for responsive positioning and viewport calculations
- **Mobile Detection**: `useIsMobile()` with debounced resize handling for device-specific rendering
- **Touch Gestures**: `useTouchGestures` with momentum physics and gesture coordination  
- **Performance**: `useIntersectionObserver` for efficient rendering of large slide collections
- **Accessibility**: `useScreenReaderAnnouncements` with live regions
- **Cleanup**: Always include proper dependency arrays and cleanup functions
- **State Optimization**: Use `useCallback` and `useMemo` to prevent unnecessary re-renders

## TypeScript Best Practices
- **Strict Types**: Use strict TypeScript interfaces, avoid `any` type
- **Slide Types**: Use `SlideDeck`, `InteractiveSlide`, `SlideElement` interfaces from `slideTypes.ts`
- **Position Types**: Use `ResponsivePosition` and `FixedPosition` for element positioning
- **Component Props**: Define clear interfaces for all component props
- **Device Types**: Use `DeviceType` enum for responsive behavior
- **Migration Support**: Include data migration utilities for legacy-to-slide conversion
- **Type Guards**: Implement type guards for runtime type checking

## Performance Optimization
- **Debouncing**: Use `lodash.debounce` for input handling and resize events
- **Memory Management**: Implement proper cleanup in useEffect hooks
- **Image Optimization**: Use appropriate image formats and loading strategies
- **Touch Events**: Coordinate between user gestures and automated events
- **Bundle Size**: Use direct imports for better tree-shaking

## Puppeteer MCP Integration
The project includes comprehensive Puppeteer MCP integration for automated browser testing and interaction. The system provides multiple authentication methods and robust error handling for reliable automated testing.

### MCP Servers Available
- **puppeteer-hisma**: Professional-grade Puppeteer MCP server (v0.6.5)
- **puppeteer-custom**: Project-specific custom server with enhanced utilities
- **MCP Tools**: `puppeteer_navigate`, `puppeteer_screenshot`, `puppeteer_click`, `puppeteer_fill`, `puppeteer_evaluate`, `puppeteer_login`, `puppeteer_logout`, `puppeteer_auth_status`

### Authentication Methods
- **Development Bypass**: Set `VITE_DEV_AUTH_BYPASS=true` in `.env.local` for instant authentication
- **Test Credentials**: Use `TEST_USER_EMAIL=test@localhost.dev` and `TEST_USER_PASSWORD=TestPassword123!`
- **MCP Login**: Use `mcp__puppeteer-*__puppeteer_login` with `method: "bypass"` parameter
- **Session Management**: Bypass injects mock user data into browser session storage

### Environment Configuration
```bash
# Development Bypass
VITE_DEV_AUTH_BYPASS=true
VITE_DEV_USER_EMAIL=dev@localhost
VITE_DEV_USER_NAME=Development User

# Test Credentials  
TEST_USER_EMAIL=test@localhost.dev
TEST_USER_PASSWORD=TestPassword123!
TEST_USER_DISPLAY_NAME=Test User

# Puppeteer Settings
PUPPETEER_TEST_URL=http://localhost:3000
PUPPETEER_HEADLESS=true
```

### Development Scripts
- `npm run mcp:workflow test` - Run comprehensive MCP tests
- `npm run mcp:validate` - Validate MCP configuration
- `npm run mcp:demo` - Run demonstration workflow
- `npm run auth:test` - Test authentication system
- `npm run auth:demo` - Run authentication demo

### Puppeteer MCP Best Practices
- **Single Action Per Call**: Limit each MCP call to one specific action (navigate, click, fill, etc.)
- **State Verification**: Always verify expected state after each action before proceeding  
- **Timeout Management**: Set appropriate timeouts (5-30 seconds) for each operation
- **Loop Prevention**: Avoid recursive task chains; use explicit step-by-step workflows
- **Auth First**: Always establish bypass authentication before attempting other actions
- **Work Chunking**: Break Puppeteer tasks into small, discrete steps to avoid infinite loops
- **Error Recovery**: Implement timeouts and fallbacks for each Puppeteer action
- **Screenshot Verification**: Take screenshots between major steps to verify progress
- **Task Isolation**: Complete one specific task before moving to the next
- **Error Boundaries**: Wrap Puppeteer sequences in try-catch blocks with recovery strategies

### Common Usage Patterns
```bash
# Basic testing workflow
claude "Navigate to localhost:3000, authenticate with bypass method, screenshot the dashboard, and test main features"

# Authentication flow testing  
claude "Test complete auth flow: check status, login with test credentials, verify authentication, then logout"

# Feature testing with screenshots
claude "Login to app, navigate to interactive module editor, test creating hotspots, screenshot each step"

# Mobile responsive testing
claude "Set mobile viewport, navigate to app, authenticate, test touch interactions, screenshot mobile view"
```

## Known Limitations & Architecture Notes
- **Large Datasets**: Image files and large hotspot collections may impact performance
- **Touch Coordination**: Complex gesture coordination between pan/zoom and hotspot interaction
- **Firebase Setup**: Firebase emulator setup required for local development and testing
- **Mobile Viewport**: iOS Safari viewport quirks require specialized handling
- **Puppeteer Stability**: Complex automation sequences can become unstable; chunk work appropriately

## Claude Development Workflows

### Sub-Agent Usage Guidelines

#### When to Use Sub-Agents

Use specialized sub-agents when tasks match their expertise:

- **general-purpose**: Complex research, multi-step tasks, file searching when unsure of exact matches
- **data-scientist**: SQL queries, data analysis, BigQuery operations  
- **architect**: System design, new features, refactoring, code quality reviews
- **security-specialist**: Security analysis, vulnerability assessment, defensive tools
- **code-janitor**: Cleaning up old/unused code, removing deprecated features
- **debugger**: Error investigation, test failures, unexpected behavior
- **ui-designer**: Mobile-first responsive design, UI components, design system adherence
- **code-reviewer**: Code quality, security, maintainability reviews
- **performance-optimizer**: Performance bottlenecks, optimization opportunities

#### Sub-Agent Decision Flow

1. **Identify task type** - What category does this work fall into?
2. **Check complexity** - Is this a multi-step or specialized task?
3. **Match expertise** - Does a sub-agent specialize in this area?
4. **Launch agent** - Use the Task tool with appropriate sub-agent type
5. **Review results** - Validate and integrate sub-agent output

### Task Management Workflow

#### Before Starting Multi-Step Tasks

1. **Analyze the request** - Break down what needs to be accomplished
2. **Create task list** - Document all steps in `tasks.md` file (root level)
3. **Use TodoWrite tool** - Create structured todo list for tracking
4. **Begin execution** - Start with first high-priority task

#### During Task Execution

1. **Mark tasks in progress** - Update status when starting work
2. **Complete tasks incrementally** - Mark completed immediately after finishing
3. **Update tasks.md** - Document progress and any changes to scope
4. **Use sub-agents when appropriate** - Follow sub-agent guidelines above

#### After Task Completion

1. **Final tasks.md update** - Document completion and any follow-up needed
2. **Summary of work done** - Brief overview of accomplishments
3. **Note any architectural changes** - Important for future reference

### Task Documentation Format

#### tasks.md Structure (Root Level)
```markdown
# [Project/Feature Name]

## Overview
Brief description of the work being done.

## Current Status
- [✅] Completed items
- [🚧] In progress items  
- [⏳] Pending items

## Implementation Plan
Detailed breakdown of steps and approach.

## Notes
- Important decisions made
- Architecture changes
- Issues encountered and resolved
```

#### TodoWrite Integration
- Always use TodoWrite for tracking active work
- Keep todo list synchronized with tasks.md
- Mark tasks completed immediately when finished
- Add new tasks if scope changes during implementation

### Example Workflows

#### New Feature Development

1. **Research & Planning**
   ```
   - Use architect sub-agent for system design
   - Create tasks.md with implementation plan
   - Set up TodoWrite tracking
   ```

2. **Implementation**
   ```
   - Use ui-designer for UI components
   - Use code-reviewer after significant code changes
   - Update progress in tasks.md and TodoWrite
   ```

3. **Quality Assurance**
   ```
   - Use debugger for testing issues
   - Use performance-optimizer for bottlenecks
   - Use security-specialist for security review
   ```

#### Bug Investigation

1. **Diagnosis**
   ```
   - Use debugger sub-agent for error analysis
   - Document findings in tasks.md
   - Create focused todo list
   ```

2. **Resolution**
   ```
   - Implement fixes with appropriate sub-agents
   - Use code-reviewer for validation
   - Update documentation
   ```

#### Code Cleanup

1. **Assessment**
   ```
   - Use code-janitor for identifying cleanup opportunities
   - Document scope in tasks.md
   - Prioritize cleanup tasks
   ```

2. **Execution**
   ```
   - Systematic cleanup with progress tracking
   - Use architect for any structural changes
   - Update documentation as needed
   ```

### Best Practices

#### Sub-Agent Usage
- Provide detailed context and requirements
- Specify expected deliverables clearly
- Review output before proceeding
- Use multiple agents concurrently when appropriate

#### Task Management
- Break large tasks into smaller, trackable pieces
- Update progress frequently to maintain context
- Document decisions and rationale
- Keep tasks.md as a permanent record

#### Documentation
- Write for future developers (including future Claude sessions)
- Include context for why decisions were made
- Note any workarounds or technical debt
- Update architecture documentation when making structural changes

### Recovery from Interruption

If a session is interrupted:

1. **Check tasks.md** - Review the last documented state
2. **Review TodoWrite** - See what was in progress
3. **Assess current state** - What has been completed vs. documented
4. **Continue or adjust** - Pick up where left off or revise plan

This workflow ensures continuity across sessions and maintains a clear record of development progress.