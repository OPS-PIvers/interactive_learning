# AGENTS.md - AI Agent Instructions for Unified Architecture

## Purpose
This file provides instructions for AI agents working on the ExpliCoLearning project. All agents must read this file to understand the unified responsive architecture, prohibited patterns, and development requirements.

**CRITICAL**: This application uses 100% unified responsive architecture. Device-specific JavaScript branching is STRICTLY FORBIDDEN.

## Project Context

Interactive web application for creating slide-based multimedia training modules with unified responsive design across all devices.

### Tech Stack
- React 18.3.1 + TypeScript + Vite
- Firebase 11.9.1 (Firestore + Storage)
- Tailwind CSS styling (CSS-first responsive design)
- Vitest testing
- Key deps: @dnd-kit/core, lodash.debounce, framer-motion

## Essential Commands
```bash
# Always run tests before committing
npm run test:run

# Development server
npm run dev

# Production build
npm run build

# MCP testing and validation (Playwright)
npm run mcp:validate
npm run auth:test
```

## STRICT ARCHITECTURAL RULES

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

## Before Making Changes
1. **Read CLAUDE.md first** - contains essential unified architecture principles
2. **Check existing unified patterns** in similar components
3. **Verify dependencies** exist in package.json
4. **Run tests** to ensure current state works
5. **NEVER create Mobile*/Desktop* components** - use unified responsive design

## Code Standards

### Unified Responsive Design
```typescript
// ✅ CORRECT - CSS-only responsive behavior
interface UnifiedComponentProps {
  title: string;
  onAction: () => void;
}

const UnifiedComponent: React.FC<UnifiedComponentProps> = ({ title, onAction }) => {
  return (
    <div className="bg-white p-4 md:p-6 lg:p-8">
      <h2 className="text-lg md:text-xl lg:text-2xl font-bold">
        {title}
      </h2>
      <button 
        onClick={onAction}
        className="w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 
                   text-white rounded-lg transition-colors"
      >
        Action
      </button>
    </div>
  );
};
```

### Hook Usage Rules
```typescript
// ✅ CORRECT - Device detection for MATHEMATICAL CALCULATIONS ONLY
const { deviceType, viewportInfo } = useDeviceDetection();
const canvasWidth = viewportInfo.width * 0.8; // Math calculation OK
const dragBounds = calculateDragBounds(deviceType); // Position calculation OK

// ❌ FORBIDDEN - Device detection for UI rendering
const { deviceType } = useDeviceDetection();
return deviceType === 'mobile' ? <MobileUI /> : <DesktopUI />; // NEVER DO THIS

// ✅ CORRECT - Layout constraints for positioning calculations
const { constraints } = useLayoutConstraints();
const modalTop = constraints.safeArea.top; // Math calculation OK
```

### TypeScript Standards
- **Strict types**: All props need interfaces, avoid `any` types
- **Functional components**: with hooks only
- **Proper cleanup**: Implement useEffect cleanup with dependency arrays
- **Centralized z-index**: Always use values from `zIndexLevels.ts`
- **Accessibility**: Include ARIA attributes for all interactive elements

## Current File Structure
```
src/
├── client/                     # Frontend application (React)
│   ├── components/            # React components (unified responsive design)
│   │   ├── SlideBasedInteractiveModule.tsx  # Main slide module container
│   │   ├── SlideBasedViewer.tsx            # Slide presentation viewer
│   │   ├── SlideEditorToolbar.tsx          # Modern unified editor toolbar
│   │   ├── ViewerFooterToolbar.tsx         # Unified viewer navigation
│   │   ├── UnifiedPropertiesPanel.tsx      # Unified element properties
│   │   ├── animations/        # Animation and transition components
│   │   ├── icons/            # Custom icon components  
│   │   ├── interactions/     # Interaction system components
│   │   ├── responsive/       # Unified responsive modal components
│   │   │   ├── ResponsiveModal.tsx          # Base unified modal
│   │   │   ├── ResponsiveBackgroundModal.tsx
│   │   │   └── ResponsiveInsertModal.tsx
│   │   ├── slides/          # Slide-specific components
│   │   │   ├── UnifiedSlideEditor.tsx       # Main slide editor
│   │   │   ├── ResponsiveCanvas.tsx         # Unified drag-drop canvas
│   │   │   ├── SlideViewer.tsx             # Individual slide viewer
│   │   │   └── effects/     # Slide effect components
│   │   ├── touch/           # Touch gesture handling components
│   │   ├── ui/              # Reusable UI components
│   │   ├── views/           # Page-level view components
│   │   └── shared/          # Error boundaries and loading states
│   ├── hooks/               # Custom React hooks (17 files)
│   │   ├── useDeviceDetection.ts       # Device type detection (MATH ONLY)
│   │   ├── useLayoutConstraints.ts     # Modal constraint system
│   │   ├── useViewportHeight.ts        # Viewport management
│   │   ├── useTouchGestures.ts         # Touch handling
│   │   ├── useScreenReaderAnnouncements.ts # Accessibility
│   │   └── useUnifiedEditorState.ts    # Unified editor state
│   ├── utils/               # Client-side utilities (34 files)
│   │   ├── ModalLayoutManager.ts       # Modal constraint system
│   │   ├── zIndexLevels.ts            # Centralized z-index management
│   │   ├── touchUtils.ts              # Touch event utilities
│   │   └── viewportUtils.ts           # Viewport calculations
│   └── styles/             # CSS and styling files
├── lib/                    # Core logic, Firebase utilities
├── shared/                 # Types and shared logic
│   ├── slideTypes.ts       # Slide-based architecture interfaces
│   ├── types.ts           # Core TypeScript interfaces
│   └── migrationUtils.ts  # Legacy-to-slide conversion
└── tests/                 # Test files (Vitest)
```

## Naming Conventions
- **Components**: PascalCase, unified responsive (UnifiedComponent.tsx)
- **Hooks**: camelCase with 'use' prefix (useDeviceDetection.ts)
- **Utilities**: camelCase (viewportUtils.ts)
- **Types/Interfaces**: PascalCase (ResponsivePosition)
- **NO Mobile*/Desktop* prefixes** - unified components only

## Key Architecture Points

### Unified Responsive System
- **Single Components**: One component adapts to all screen sizes via CSS
- **CSS-First Design**: Tailwind breakpoints (`sm:`, `md:`, `lg:`) exclusively
- **No JavaScript Branching**: Device detection only for mathematical calculations
- **Constraint System**: Unified modal positioning preventing toolbar overlap

### Slide-Based Architecture
```typescript
// Core interfaces from slideTypes.ts
interface SlideDeck {
  id: string;
  title: string;
  slides: InteractiveSlide[];
  settings: DeckSettings;
}

interface InteractiveSlide {
  id: string;
  title: string;
  elements: SlideElement[];
  backgroundMedia?: BackgroundMedia;
  layout: SlideLayout;
}

interface SlideElement {
  id: string;
  type: 'hotspot' | 'text' | 'media' | 'shape';
  position: ResponsivePosition;
  content: ElementContent;
  interactions: ElementInteraction[];
  style: ElementStyle;
}
```

### Responsive Positioning System
```typescript
// All elements use ResponsivePosition for cross-device compatibility
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

## Device Detection - MATHEMATICAL USE ONLY

### Correct Usage Pattern
```typescript
// ✅ CORRECT - Mathematical calculations only
const { deviceType, viewportInfo } = useDeviceDetection();

// Calculate canvas dimensions
const canvasWidth = viewportInfo.width * 0.8;
const canvasHeight = viewportInfo.height * 0.6;

// Calculate drag boundaries
const dragBounds = {
  minX: 0,
  maxX: canvasWidth - elementWidth,
  minY: 0,
  maxY: canvasHeight - elementHeight
};

// Get responsive position for current device
const currentPosition = element.position[deviceType] || element.position.desktop;
```

### Forbidden Usage Pattern
```typescript
// ❌ FORBIDDEN - UI rendering decisions
const { deviceType } = useDeviceDetection();

// NEVER do conditional rendering based on device
if (deviceType === 'mobile') {
  return <MobileComponent />;
} else {
  return <DesktopComponent />;
}

// NEVER do device-specific styling
const styles = deviceType === 'mobile' 
  ? { fontSize: '14px' } 
  : { fontSize: '16px' };
```

## Modal System - Unified Architecture

### ResponsiveModal Usage
```typescript
// ✅ CORRECT - Unified modal that adapts to all devices
import { ResponsiveModal } from '../responsive/ResponsiveModal';
import { Z_INDEX_TAILWIND } from '../utils/zIndexLevels';

const MyModal: React.FC = () => {
  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Modal Title"
      type="properties"      // 'standard' | 'properties' | 'confirmation' | 'fullscreen'
      size="medium"         // 'small' | 'medium' | 'large'
      position="auto"       // Auto-detects best position per device
      className={Z_INDEX_TAILWIND.MODAL}
    >
      <div className="p-4 md:p-6">
        {/* Content adapts via CSS breakpoints */}
      </div>
    </ResponsiveModal>
  );
};
```

### Layout Constraints
```typescript
// ✅ CORRECT - Use constraint system for positioning calculations
const { constraints, styles } = useLayoutConstraints({
  type: 'modal',
  preventToolbarOverlap: true,
  respectKeyboard: true
});

// Apply calculated styles (mathematical positioning)
<div style={styles.container}>
  {/* Modal content */}
</div>
```

## Firebase Integration
- **Firestore**: for data storage with transactions
- **Firebase Storage**: for images/media with security rules
- **Authentication**: with development bypass for testing
- **Emulator**: required for local development
- **Error Handling**: proper async/await patterns with try/catch

## MCP Integration & Browser Automation

The project uses Microsoft Playwright MCP for comprehensive cross-browser testing and automation.

### Authentication Setup
```bash
# Development bypass in .env.local
VITE_DEV_AUTH_BYPASS=true
VITE_DEV_USER_EMAIL=dev@localhost
VITE_DEV_USER_NAME=Development User

# Test credentials
TEST_USER_EMAIL=test@localhost.dev  
TEST_USER_PASSWORD=TestPassword123!

# Playwright settings
PLAYWRIGHT_TEST_URL=http://localhost:3000
PLAYWRIGHT_BROWSER=chromium
PLAYWRIGHT_HEADLESS=true
```

### Playwright MCP Tools Available
- **Navigation**: `browser_navigate`, `browser_navigate_back`, `browser_navigate_forward`
- **Interaction**: `browser_click`, `browser_hover`, `browser_type`, `browser_press_key`
- **Forms**: `browser_select_option`, `browser_file_upload`
- **Viewport**: `browser_resize`, `browser_take_screenshot`
- **JavaScript**: `browser_evaluate` for custom script execution
- **Advanced**: `browser_drag`, `browser_snapshot` (accessibility tree)
- **Tab Management**: `browser_tab_new`, `browser_tab_close`, `browser_tab_list`, `browser_tab_select`
- **Debugging**: `browser_console_messages`, `browser_network_requests`

### Multi-Browser Support
- **Chromium**: Default browser (Chrome, Edge)
- **Firefox**: Mozilla Firefox engine
- **WebKit**: Safari browser engine
- **Device Emulation**: Mobile devices like "iPhone 15", "Pixel 5"

## Testing Requirements

### Critical Tests
```bash
# React error detection (must pass before commits)
npm run test:run -- ReactErrorDetection

# Build integrity tests
npm run test:run

# Type checking
npx tsc --noEmit
```

### Test Validation Checklist
- [ ] No device-specific conditional rendering
- [ ] All components use CSS-first responsive design
- [ ] No hardcoded z-index values
- [ ] Proper TypeScript interfaces
- [ ] Accessibility attributes present
- [ ] No circular imports

## Security & Performance
- **Never commit**: API keys, secrets, or credentials
- **Input validation**: All user inputs sanitized
- **File uploads**: Proper validation and compression
- **Performance**: debounced inputs, lazy loading, React.memo
- **Bundle optimization**: Direct imports, tree-shaking

## Development Workflow

### Creating New Components
```typescript
// ✅ CORRECT - Unified responsive component template
interface MyComponentProps {
  title: string;
  onAction: () => void;
  variant?: 'primary' | 'secondary';
}

const MyComponent: React.FC<MyComponentProps> = ({ 
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

export default MyComponent;
```

### Modifying Existing Components
1. **Check current patterns** in the component
2. **Maintain unified architecture** - no device-specific branching
3. **Use existing CSS classes** and responsive patterns
4. **Update TypeScript interfaces** if needed
5. **Test across all breakpoints** using browser dev tools
6. **Run test suite** before committing

## Common Development Tasks

### Adding Responsive Behavior
```typescript
// ✅ CORRECT - CSS-first responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div className="bg-white p-4 md:p-6 rounded-lg">
    <h3 className="text-base md:text-lg font-semibold">
      Card Title
    </h3>
    <p className="text-sm md:text-base text-gray-600 mt-2">
      Description text that adapts to screen size.
    </p>
  </div>
</div>
```

### Working with Modals
```typescript
// ✅ CORRECT - Use ResponsiveModal for all modal dialogs
import { ResponsiveModal } from '../responsive/ResponsiveModal';

const [isModalOpen, setIsModalOpen] = useState(false);

return (
  <>
    <button 
      onClick={() => setIsModalOpen(true)}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      Open Modal
    </button>
    
    <ResponsiveModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      title="Modal Title"
      type="standard"
      size="medium"
    >
      <div className="p-4 md:p-6">
        {/* Modal content */}
      </div>
    </ResponsiveModal>
  </>
);
```

## Restrictions for AI Agents

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

## Success Criteria
- All tests passing (`npm run test:run`)
- TypeScript compilation without errors
- No console errors in development
- Responsive behavior works across all breakpoints
- Accessibility features intact (screen readers, keyboard navigation)
- Performance within acceptable ranges
- Uses unified responsive architecture patterns

## Final Checklist
- [ ] Component uses CSS-first responsive design (no JavaScript device detection)
- [ ] TypeScript interfaces defined for all props
- [ ] Accessibility attributes included (ARIA labels, roles, etc.)
- [ ] Centralized z-index values used (from `zIndexLevels.ts`)
- [ ] Tests written and passing
- [ ] No hardcoded device-specific values
- [ ] Responsive behavior tested across breakpoints (sm, md, lg)
- [ ] No circular imports or dependency issues

---

## 🚨 Preventing Build Failures

To prevent regressions and ensure the application always remains in a deployable state, it is **mandatory** to run type checks before every commit. Future agents should consider implementing a pre-commit hook to automate this process.

### Recommended Pre-Commit Hook Setup

You can use a library like `husky` to set up a pre-commit hook.

1.  **Install husky:**
    ```bash
    npm install husky --save-dev
    ```
2.  **Activate hooks:**
    ```bash
    npx husky install
    ```
3.  **Add a pre-commit hook:**
    ```bash
    npx husky add .husky/pre-commit "npm run typecheck"
    ```

This will ensure that `npm run typecheck` is run automatically before every commit, catching TypeScript errors locally and preventing them from breaking the build and deploy workflow.

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