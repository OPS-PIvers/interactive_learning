# CLAUDE.md - ExpliCoLearning

## Project Overview
Modern interactive web application for creating hotspot-based multimedia learning walkthroughs. The app has been rebuilt from a complex slide-based architecture to a simplified, focused hotspot system that executes real effects when users interact with elements. Built with React and TypeScript, using a mobile-first responsive design.

**Core Innovation**: Real-time effect execution system that actually makes interactions work - no more "fake" interactions that just log to console. Click a hotspot and see spotlight effects, text displays, videos, quizzes, and more. The app has migrated from an over-engineered 31,000+ line slide system to a clean, maintainable hotspot-focused architecture.

## Development Commands
- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once (required before commits)
- `npm run test:ui` - Run tests with UI
- `npm run preview` - Preview production build locally

## Core Architecture

### Hotspot-Focused System
- **HotspotWalkthrough** - Core data model for interactive learning experiences
- **WalkthroughHotspot** - Individual interactive hotspots with effects and content
- **ResponsivePosition** - Fixed pixel positioning with desktop/tablet/mobile breakpoints
- **Unified Responsive Design**: CSS-first approach, no JavaScript device branching
- **Z-Index Management**: Centralized system in `zIndexLevels.ts`
- **Touch-First**: Designed for touch interactions that work with mouse/keyboard

### Component Architecture  
- **HotspotViewer** (`src/client/components/viewers/HotspotViewer.tsx`) - Core viewer for hotspot walkthroughs
- **HotspotElement** (`src/client/components/hotspot/HotspotElement.tsx`) - Individual interactive hotspots
- **HotspotEditor** (`src/client/components/hotspot/HotspotEditor.tsx`) - Visual editing interface
- **HotspotCanvas** (`src/client/components/hotspot/HotspotCanvas.tsx`) - Drag-and-drop canvas
- **ResponsiveModal** - Unified modal system for all device types

### Data Flow
1. User interacts with HotspotElement (click, hover, touch)
2. HotspotElement triggers its configured effect
3. Effect system creates real DOM elements and animations
4. Effects auto-cleanup after duration or user dismissal
5. WalkthroughSequencer manages hotspot ordering and flow

## Key Dependencies
- **React 18.3.1** with TypeScript
- **Vite** for build tooling and dev server  
- **Firebase 10.14.1** for backend (Firestore + Storage)
- **Tailwind CSS** for responsive styling
- **lodash.debounce** for performance optimization
- **react-router-dom 6.25.1** for client-side routing
- **@playwright/test 1.55.0** for primary browser testing
- **Puppeteer 24.14.0** for MCP server integration
- **Vitest** for testing framework with React Testing Library

## Current File Structure
```
src/
├── client/                 # Frontend application (React)
│   ├── components/         # React components (86 TypeScript files)
│   │   ├── hotspot/        # Hotspot-specific components
│   │   │   ├── HotspotElement.tsx      # Individual hotspot component
│   │   │   ├── HotspotEditor.tsx       # Visual hotspot editor
│   │   │   ├── HotspotCanvas.tsx       # Drag-and-drop canvas
│   │   │   ├── HotspotPropertiesPanel.tsx # Properties editor
│   │   │   └── WalkthroughSequencer.tsx # Sequence management
│   │   ├── viewers/        # Viewer components
│   │   │   └── HotspotViewer.tsx       # Main hotspot viewer
│   │   ├── responsive/     # Unified responsive modal components  
│   │   ├── shared/         # Error boundaries and loading states
│   │   ├── auth/          # Authentication components
│   │   ├── dashboard/     # Dashboard and project management
│   │   ├── modals/        # Modal dialog components
│   │   ├── upload/        # File upload components
│   │   ├── feedback/      # User feedback components
│   │   └── ui/            # Reusable UI components
│   ├── hooks/             # Custom React hooks (device detection for calculations only)
│   ├── utils/             # Client-side utilities (centralized z-index, layout management)
│   ├── pages/             # Page-level components
│   ├── services/          # API and service layer
│   └── contexts/          # React context providers
├── lib/                   # Firebase integration and backend logic
├── shared/                # Types and data models (hotspot-focused architecture)
│   ├── hotspotTypes.ts    # Core hotspot data models
│   ├── baseTypes.ts       # Base interfaces and types
│   └── hotspotStylePresets.ts # Styling presets
└── tests/                 # Vitest test suite with React Testing Library
```

## Architecture Evolution
- **From Slides to Hotspots**: Migrated from complex 31,000+ line slide-based system to focused hotspot walkthroughs
- **Simplified Data Models**: `HotspotWalkthrough` and `WalkthroughHotspot` replace complex slide architecture
- **Unified Responsive Design**: Single components that adapt across all devices via CSS
- **Preserved Core Functionality**: Real effect execution system maintained from original architecture  
- **Clean Codebase**: Down to 86 TypeScript files from hundreds in the original system

## Component Conventions
- **Naming**: PascalCase with descriptive prefixes (no `Mobile*`/`Desktop*` - unified components only)
- **Props**: TypeScript interfaces for all component props (never use `any`)
- **Exports**: Default exports for components, named exports for utilities
- **Cleanup**: Implement proper cleanup in useEffect hooks with dependency arrays
- **Architecture**: Compound component patterns for modals, editors, and viewers
- **Responsive Design**: CSS-only responsive design using Tailwind breakpoints (`sm:`, `md:`, `lg:`)
- **STRICT RULE - NO DEVICE BRANCHING**: NEVER use JavaScript for device-specific UI logic (`isMobile`, `window.innerWidth`, `isDesktop` checks are FORBIDDEN)
- **Z-Index Integration**: Always use centralized z-index values from `zIndexLevels.ts`
- **Accessibility**: Include proper ARIA attributes and use accessibility hooks
- **State**: Use `useCallback` and `useMemo` for performance optimization
- **Imports**: Direct imports over barrel exports for better tree-shaking
- **Touch-First Design**: Design for touch interactions that also work with mouse/keyboard

## Viewer Architecture

### Unified Toolbar Architecture
The application uses unified toolbar components that adapt automatically to all screen sizes:

**ViewerFooterToolbar.tsx** - Primary navigation interface for the viewer experience
- **CSS-Only Responsive Design:** Single component using Tailwind breakpoints for layout adaptation
- **Z-Index Integration:** Uses centralized z-index system (TOOLBAR: 9999)
- **Timeline Navigation:** Slide navigation controls with visual progress indicators
- **Mode Controls:** Switch between viewing modes ("Explore", "Guided Tour")
- **Accessibility:** ARIA labels, keyboard navigation, and shortcuts modal

**Editor Toolbars** - Consistent editing interface across all screen sizes
- **SlideEditorToolbar.tsx:** Modern slide-based editing toolbar with responsive CSS design
- **EditorToolbar.tsx:** Legacy editor toolbar (being phased out in favor of SlideEditorToolbar)
- **Z-Index Compliance:** All toolbars use centralized z-index values for proper layering

## Slide-Based Architecture
- **SlideDeck** interface defines collection of interactive slides with metadata
- **InteractiveSlide** interface for individual slides with elements, transitions, and layout
- **SlideElement** interface for slide elements (hotspots, text, media, shapes) with responsive positioning
- **ResponsivePosition** system with desktop/tablet/mobile breakpoints using fixed pixel positioning
- **ElementInteraction** system for element-based interactions and effects
- **SlideTransition** interface for navigation and animation between slides
- **Migration Support**: Automatic migration from legacy hotspot-based system to slide architecture
- **Backward Compatibility**: Legacy timeline events supported alongside new slide system

## Working Interaction System

### Creating Interactive Hotspots
```typescript
// Hotspots use the simplified WalkthroughHotspot interface
const hotspot: WalkthroughHotspot = {
  id: 'hotspot-1',
  type: 'hotspot',
  position: { 
    desktop: { x: 100, y: 100, width: 50, height: 50 },
    tablet: { x: 80, y: 80, width: 40, height: 40 },
    mobile: { x: 50, y: 50, width: 30, height: 30 }
  },
  content: {
    title: 'Interactive Hotspot',
    description: 'Click to see spotlight effect'
  },
  interaction: {
    trigger: 'click',
    effect: {
      type: 'spotlight',
      duration: 3000,
      parameters: { shape: 'circle' }
    }
  },
  style: {
    color: '#3b82f6',
    pulseAnimation: true,
    size: 'medium',
    hideAfterTrigger: false
  },
  sequenceIndex: 0
};
```

### Effect Types That Actually Work
- **spotlight**: Dark overlay with highlighted area + optional message
- **text**: Floating text boxes with custom styling
- **tooltip**: Quick popup messages
- **video**: Modal video players (YouTube supported)
- **quiz**: Interactive question modals with multiple choice

### Hotspot System
- **HotspotWalkthrough**: Container for multiple related hotspots with background media
- **WalkthroughHotspot**: Individual interactive hotspot with effects and content
- **WalkthroughSequencer**: Manages hotspot ordering and guided tour functionality
- **ResponsivePosition**: Fixed pixel positioning that adapts across device breakpoints

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

## Modal Layout Constraint System
The application features a comprehensive modal layout constraint system that prevents modal dialogs from overlapping with fixed toolbars across all device types.

### Key Components
- **useLayoutConstraints Hook** (`src/client/hooks/useLayoutConstraints.ts`)
  - Unified constraint system for safe modal positioning
  - Uses `useDeviceDetection` and `useViewportHeight` for responsive behavior
  - Provides `useModalConstraints` and `useConstraintAwareSpacing` specialized hooks
  - Device-aware z-index management and CSS variable generation

- **ModalLayoutManager Class** (`src/client/utils/ModalLayoutManager.ts`)
  - Centralized utility for modal positioning and constraint calculations
  - Placement validation and responsive behavior
  - Support for standard, properties, confirmation, fullscreen, and drawer modal types

- **ResponsiveModal Component** (`src/client/components/responsive/ResponsiveModal.tsx`)
  - Unified modal supporting both desktop and mobile layouts
  - Integrated with constraint system for consistent positioning
  - Uses centralized z-index system from `zIndexLevels.ts`

### Z-Index Management System
- **Centralized Z-Index** (`src/client/utils/zIndexLevels.ts`)
  - Single source of truth for all z-index values across the application
  - Organized hierarchically to prevent layering conflicts
  - Provides both numeric values (`Z_INDEX`) and Tailwind classes (`Z_INDEX_TAILWIND`)
  - Unified values work on all devices including iOS Safari
  - Values up to 11000 for emergency overlays

### Features
- **Toolbar Overlap Prevention**: Systematic prevention of modal-toolbar conflicts
- **Unified Z-Index Management**: Centralized system eliminates hardcoded values
- **CSS-Based Responsive Layout**: Automatic responsive adjustments using Tailwind breakpoints
- **Safe Area Handling**: Respects device safe areas using CSS env() variables
- **Progressive Enhancement**: Touch-first design that enhances for keyboard/mouse
- **Cross-Platform Compatibility**: Works consistently across all browsers and devices

## Firebase Integration
- Firestore for data storage
- Firebase Storage for images/media
- Use transactions for data consistency
- Implement proper error handling for network operations

## Development Workflow

### Adding New Effects
1. Add effect type to `SlideEffectType` in `slideTypes.ts`
2. Create parameter interface (e.g., `MyEffectParameters`)
3. Add handler method to `EffectExecutor` class
4. Test across devices

### Responsive Design Rules
- **CSS-Only**: Use Tailwind classes (`sm:`, `md:`, `lg:`) for responsive behavior
- **No JS Branching**: Never use `isMobile` or `window.innerWidth` for UI rendering
- **Device Detection**: Only for mathematical calculations (drag boundaries, canvas size)
- **Touch-First**: Design for touch, enhance for mouse/keyboard

### Effect Development
```typescript
// In EffectExecutor.ts
private async executeMyEffect(effect: SlideEffect): Promise<void> {
  const params = effect.parameters as MyEffectParameters;
  
  // Create DOM elements
  const element = document.createElement('div');
  element.style.cssText = `
    position: fixed;
    z-index: ${Z_INDEX.MODAL_CONTENT};
    /* your styles */
  `;
  
  this.container.appendChild(element);
  
  // Store for cleanup
  this.activeEffects.set(effect.id, {
    element,
    type: 'my_effect',
    cleanup: () => element.remove()
  });
}
```

## Custom Hook Patterns
- **Layout Calculations**: `useDeviceDetection()` and `useLayoutConstraints()` for mathematical positioning calculations ONLY - NEVER for UI rendering
- **STRICT LIMITATION**: Device detection hooks are ONLY for mathematical calculations (drag boundaries, canvas dimensions) - NEVER for conditional UI rendering
- **Viewport Management**: `useViewportHeight()` with CSS viewport unit support
- **Touch Gestures**: `useTouchGestures` with momentum physics for canvas interactions
- **Performance**: `useIntersectionObserver` for efficient rendering of large slide collections
- **Accessibility**: `useScreenReaderAnnouncements` with live regions
- **Cleanup**: Always include proper dependency arrays and cleanup functions
- **State Optimization**: Use `useCallback` and `useMemo` to prevent unnecessary re-renders
- **No UI Branching**: Device detection hooks are FORBIDDEN for conditional UI rendering - use CSS breakpoints instead

## TypeScript Best Practices
- **Strict Types**: Use strict TypeScript interfaces, avoid `any` type
- **Slide Types**: Use `SlideDeck`, `InteractiveSlide`, `SlideElement` interfaces from `slideTypes.ts`
- **Position Types**: Use `ResponsivePosition` and `FixedPosition` for element positioning
- **Component Props**: Define clear interfaces for all component props
- **Device Types**: Use `DeviceType` enum for responsive behavior
- **Migration Support**: Include data migration utilities for legacy-to-slide conversion
- **Type Guards**: Implement type guards for runtime type checking

## Testing Interactions

### Manual Testing
1. `npm run dev`
2. Create slides with interactive elements
3. Click hotspots - should see actual effects, not just console logs
4. Test on mobile: touch interactions should work smoothly
5. Test cleanup: effects should disappear after duration

### Build Verification
```bash
npm run typecheck  # Must pass
npm run test:run   # Must pass  
npm run build      # Must compile
```

### Core Working Features
- ✅ Click hotspots → Real spotlight effects
- ✅ Text elements → Show additional text
- ✅ Media elements → Play videos/audio
- ✅ Quiz interactions → Modal quizzes
- ✅ Effect cleanup → No memory leaks
- ✅ Mobile touch → Smooth interactions
- ✅ Cross-device → Consistent behavior

## Performance Optimization
- **Debouncing**: Use `lodash.debounce` for input handling and resize events
- **Memory Management**: Implement proper cleanup in useEffect hooks
- **Image Optimization**: Use appropriate image formats and loading strategies
- **Touch Events**: Coordinate between user gestures and automated events
- **Bundle Size**: Use direct imports for better tree-shaking

## Browser Automation - Dual Integration Approach
The project uses both Playwright and Puppeteer for comprehensive browser automation and testing:

### Playwright MCP Integration (Primary)
- **Microsoft Playwright MCP**: Official server using `@playwright/test@1.55.0`
- **Cross-browser Support**: Chromium, Firefox, and WebKit testing
- **MCP Tools Available**: Full suite of browser automation tools via Claude Code
- **Device Emulation**: Mobile and desktop viewport testing

### Puppeteer MCP Server (Legacy Support)  
- **@hisma/server-puppeteer**: Custom MCP server configuration
- **Scripts Available**: `npm run mcp:workflow`, `npm run mcp:validate`, `npm run mcp:demo`
- **Authentication Testing**: `npm run test:auth` for automated authentication flows

### Available Browser Automation Tools
- **Navigation**: `browser_navigate`, `browser_navigate_back`, `browser_navigate_forward`
- **Interaction**: `browser_click`, `browser_hover`, `browser_type`, `browser_press_key`
- **Forms**: `browser_select_option`, `browser_file_upload`
- **Viewport**: `browser_resize`, `browser_take_screenshot`
- **JavaScript**: `browser_evaluate` for custom script execution
- **Waiting**: `browser_wait_for` for dynamic content
- **Advanced**: `browser_drag`, `browser_snapshot` (accessibility tree)
- **Tab Management**: `browser_tab_new`, `browser_tab_close`, `browser_tab_list`, `browser_tab_select`
- **Debugging**: `browser_console_messages`, `browser_network_requests`

### Multi-Browser Support
Playwright supports multiple browser engines:
- **Chromium**: Default browser, includes Chrome and Edge
- **Firefox**: Mozilla Firefox engine
- **WebKit**: Safari browser engine
- **Device Emulation**: Mobile devices like "iPhone 15", "Pixel 5"

### Authentication Methods
- **Development Bypass**: Set `VITE_DEV_AUTH_BYPASS=true` in `.env.local` for instant authentication
- **Test Credentials**: Use `TEST_USER_EMAIL=test@localhost.dev` and `TEST_USER_PASSWORD=TestPassword123!`
- **Session Management**: Bypass injects mock user data into browser session storage

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

### Cross-Browser Testing Workflow
```bash
# Test on multiple browsers
claude "Test login flow on Chromium, Firefox, and WebKit browsers"

# Mobile testing
claude "Test responsive design on iPhone 15 and Pixel 5 viewports"

# Performance testing
claude "Run accessibility snapshot and measure page load times"

# Cross-platform validation
claude "Test interactive hotspots on desktop and mobile browsers"
```

### Playwright MCP Best Practices
- **Single Action Per Call**: Limit each MCP call to one specific action (navigate, click, fill, etc.)
- **State Verification**: Always verify expected state after each action before proceeding  
- **Timeout Management**: Set appropriate timeouts (5-30 seconds) for each operation
- **Loop Prevention**: Avoid recursive task chains; use explicit step-by-step workflows
- **Auth First**: Always establish bypass authentication before attempting other actions
- **Work Chunking**: Break tasks into small, discrete steps to avoid infinite loops
- **Error Recovery**: Implement timeouts and fallbacks for each action
- **Screenshot Verification**: Take screenshots between major steps to verify progress
- **Task Isolation**: Complete one specific task before moving to the next
- **Error Boundaries**: Wrap automation sequences in try-catch blocks with recovery strategies
- **Browser Diversity**: Test critical flows across all three engines (Chromium, Firefox, WebKit)
- **Device Testing**: Include both desktop and mobile viewports
- **Wait Strategies**: Use `browser_wait_for` instead of fixed delays
- **Accessibility**: Leverage `browser_snapshot` for accessibility validation
- **Cross-Platform**: Validate behavior across different operating systems

## Playwright MCP Integration
The project now includes the Microsoft Playwright MCP server for comprehensive cross-browser testing and automation. Playwright offers superior browser support and more reliable automation compared to Puppeteer, with support for Chromium, Firefox, and WebKit browsers.

### MCP Server Configuration
- **Microsoft Playwright MCP**: Official server using `@playwright/mcp@latest`
- **Installation**: `claude mcp add playwright -s user -- npx @playwright/mcp@latest`
- **Status**: Automatically configured and connected in Claude Code

### Available Browser Automation Tools
- **Navigation**: `browser_navigate`, `browser_navigate_back`, `browser_navigate_forward`
- **Interaction**: `browser_click`, `browser_hover`, `browser_type`, `browser_press_key`
- **Forms**: `browser_select_option`, `browser_file_upload`
- **Viewport**: `browser_resize`, `browser_take_screenshot`
- **JavaScript**: `browser_evaluate` for custom script execution
- **Waiting**: `browser_wait_for` for dynamic content
- **Advanced**: `browser_drag`, `browser_snapshot` (accessibility tree)
- **Tab Management**: `browser_tab_new`, `browser_tab_close`, `browser_tab_list`, `browser_tab_select`
- **Debugging**: `browser_console_messages`, `browser_network_requests`

### Multi-Browser Support
Playwright supports multiple browser engines:
- **Chromium**: Default browser, includes Chrome and Edge
- **Firefox**: Mozilla Firefox engine
- **WebKit**: Safari browser engine
- **Device Emulation**: Mobile devices like "iPhone 15", "Pixel 5"

### Configuration Options
```bash
# Browser selection
--browser chromium|firefox|webkit|msedge

# Device emulation
--device "iPhone 15"

# Viewport control
--viewport-size "1280,720"

# Performance options
--headless  # Run without UI (faster)
--isolated  # Clean browser profile
--no-sandbox  # For CI environments
```

### Environment Configuration
```bash
# Playwright Settings
PLAYWRIGHT_TEST_URL=http://localhost:3000
PLAYWRIGHT_BROWSER=chromium
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_DEVICE="Desktop Chrome"

# Development Bypass (same as Puppeteer)
VITE_DEV_AUTH_BYPASS=true
VITE_DEV_USER_EMAIL=dev@localhost
VITE_DEV_USER_NAME=Development User
```

### Cross-Browser Testing Workflow
```bash
# Test on multiple browsers
claude "Test login flow on Chromium, Firefox, and WebKit browsers"

# Mobile testing
claude "Test responsive design on iPhone 15 and Pixel 5 viewports"

# Performance testing
claude "Run accessibility snapshot and measure page load times"

# Cross-platform validation
claude "Test interactive hotspots on desktop and mobile browsers"
```

### Playwright vs Puppeteer Advantages
- **Multi-Browser Support**: Tests on Chromium, Firefox, and WebKit
- **Better Reliability**: More stable automation with better wait strategies
- **Mobile Testing**: Superior mobile device emulation
- **Accessibility**: Built-in accessibility tree snapshots
- **Performance**: Faster execution and better resource management
- **Modern APIs**: More intuitive and comprehensive automation APIs

### Best Practices
- **Browser Diversity**: Test critical flows across all three engines
- **Device Testing**: Include both desktop and mobile viewports
- **Wait Strategies**: Use `browser_wait_for` instead of fixed delays
- **Accessibility**: Leverage `browser_snapshot` for accessibility validation
- **Error Handling**: Check console messages and network requests for issues
- **Cross-Platform**: Validate behavior across different operating systems

### Advantages over Legacy Solutions
- **Multi-Browser Support**: Tests on Chromium, Firefox, and WebKit
- **Better Reliability**: More stable automation with better wait strategies
- **Mobile Testing**: Superior mobile device emulation
- **Accessibility**: Built-in accessibility tree snapshots
- **Performance**: Faster execution and better resource management
- **Modern APIs**: More intuitive and comprehensive automation APIs

## Legacy Code Cleanup Guidelines
The application is transitioning from separate mobile/desktop components to a unified responsive architecture. Claude Code should proactively identify and clean up legacy patterns:

### Deprecated Patterns to Remove
- **Separate Mobile/Desktop Components**: Components with `Mobile*` or `Desktop*` prefixes that duplicate functionality
- **Hardcoded Z-Index Values**: Replace with centralized `Z_INDEX` or `Z_INDEX_TAILWIND` constants
- **Device-Specific Directories**: Avoid creating new `mobile/` or `desktop/` component directories
- **Duplicate Responsive Logic**: Consolidate conditional rendering into unified components

### Preferred Modern Patterns
- **Unified Components**: Single components that use CSS-first responsive design with Tailwind breakpoints.
- **Centralized Z-Index**: Always use `zIndexLevels.ts` for layering
- **Responsive CSS**: Use Tailwind responsive classes and conditional className logic
- **Legacy Migration**: Convert deprecated components to unified responsive versions

### Code Janitor Priorities
1. **Identify duplicate mobile/desktop components** that can be unified
2. **Replace hardcoded z-index values** with centralized constants
3. **Remove unused legacy components** after migration
4. **Update import statements** to use unified components

## Known Limitations & Architecture Notes
- **Large Datasets**: Image files and large hotspot collections may impact performance
- **Touch Coordination**: Complex gesture coordination between pan/zoom and hotspot interaction
- **Firebase Setup**: Firebase emulator setup required for local development and testing
- **Mobile Viewport**: iOS Safari viewport quirks require specialized handling
- **Browser Automation**: Complex automation sequences require proper chunking and error handling
- **Legacy Components**: Some `Mobile*` components still exist and should be gradually replaced with unified responsive versions

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