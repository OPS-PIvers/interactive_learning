# Jules Tasks - Mobile Editor Enhancement

## Overview
This document contains tasks to bring the mobile editor experience in line with the desktop editor functionality. The mobile editor currently uses `MobileEditorModal` with limited capabilities compared to the full-featured `HotspotEditorModal` used on desktop.

**Key Files Context:**
- `src/client/components/MobileEditorModal.tsx` - Current limited mobile editor
- `src/client/components/HotspotEditorModal.tsx` - Full-featured desktop editor (reference)
- `src/client/components/InteractiveModule.tsx` - Main container component
- `src/shared/types.ts` - Type definitions for all interaction types

## 🚨 CRITICAL: TDZ (Temporal Dead Zone) ERROR PREVENTION

**EVERY TASK MUST FOLLOW THESE RULES TO PREVENT TDZ ERRORS:**

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

---
### Task: Add toggle to both desktop and mobile hotspot editor to display hotspot during event - COMPLETE
**Can run in parallel with other foundation tasks**
- When toggled on, when the user clicks on the hotspot or the hotspot is active in the timeline, the hotspot itself remains visible.
- When toggled off, the hotspot itself is invisible when active (whether the user has clicked on the hotspot or it is the active hotspot in the timeline).

## 🔵 FOUNDATION TASKS (Start Here)

### Task: Create Mobile-Optimized UI Components Library - COMPLETE
**Can run in parallel with other foundation tasks**

Create reusable mobile UI components that will be used across all event editing interfaces.

**Files to create:**
- `src/client/components/mobile/MobileSlider.tsx`
- `src/client/components/mobile/MobileToggle.tsx` 
- `src/client/components/mobile/MobileColorPicker.tsx`
- `src/client/components/mobile/MobileShapeSelector.tsx`
- `src/client/components/mobile/MobileMediaUpload.tsx`

**TDZ Prevention for this task:**
- ⚠️ These are base components - NO imports from other mobile components (avoid circular dependencies)
- ⚠️ Only import from React, shared types, and existing non-mobile components
- ⚠️ Initialize all useState with complete default values
- ⚠️ Use TypeScript interfaces declared BEFORE component declarations

**Requirements:**
- Large touch-friendly controls (minimum 44px touch targets)
- Smooth animations and haptic feedback where appropriate
- Consistent styling with existing mobile theme
- TypeScript interfaces for all props
- Support for controlled/uncontrolled patterns

**Example MobileSlider implementation:**
```typescript
interface MobileSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  className?: string;
}

export const MobileSlider: React.FC<MobileSliderProps> = ({
  label, value, min, max, step = 1, unit = '', onChange, className = ''
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <span className="text-sm text-gray-400">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-8 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb"
      />
    </div>
  );
};
```

---

### Task: Expand Mobile Event Type Definitions (✅ Completed)
**Can run in parallel with UI components**

Update the mobile editor to support all interaction types available on desktop.

**Files to modify:**
- `src/client/components/MobileEditorModal.tsx`

**TDZ Prevention for this task:**
- ⚠️ CRITICAL: This modifies existing file - check ALL existing imports first
- ⚠️ Add new imports at TOP of file in correct order
- ⚠️ Do NOT modify existing state initialization - only ADD new state
- ⚠️ Test that existing functionality still works after changes

**Current state:** Only 7 basic interaction types supported
**Target state:** All 17+ interaction types from `InteractionType` enum

**Implementation:**
1. Replace the limited `INTERACTION_TYPES` array with complete set from desktop
2. Add icons and mobile-friendly labels for each type
3. Group related types into categories for better mobile UX
4. Add touch-friendly event type selector grid

**Required changes:**
```typescript
const MOBILE_INTERACTION_TYPES = [
  // Visual Effects
  { 
    category: 'Visual Effects',
    types: [
      { value: InteractionType.SPOTLIGHT, label: 'Spotlight', icon: '💡', description: 'Highlight specific area' },
      { value: InteractionType.PAN_ZOOM, label: 'Pan & Zoom', icon: '🔍', description: 'Focus on area' },
      { value: InteractionType.PULSE_HOTSPOT, label: 'Pulse', icon: '💓', description: 'Animate hotspot' },
    ]
  },
  // Media Content  
  { 
    category: 'Media',
    types: [
      { value: InteractionType.SHOW_VIDEO, label: 'Video', icon: '🎥', description: 'Play video file' },
      { value: InteractionType.SHOW_AUDIO_MODAL, label: 'Audio', icon: '🎵', description: 'Play audio' },
      { value: InteractionType.SHOW_IMAGE_MODAL, label: 'Image', icon: '🖼️', description: 'Show image' },
      { value: InteractionType.SHOW_YOUTUBE, label: 'YouTube', icon: '📺', description: 'Play YouTube video' },
    ]
  },
  // Interactive
  {
    category: 'Interactive',
    types: [
      { value: InteractionType.SHOW_TEXT, label: 'Text Modal', icon: '💬', description: 'Show text popup' },
      { value: InteractionType.QUIZ, label: 'Quiz', icon: '❓', description: 'Ask question' },
    ]
  }
];
```

---

## 🟢 EVENT SETTINGS TASKS (✅ Completed)

### Task: Create Mobile Spotlight Settings Component (✅ Completed)
**Parallel task - independent of other event settings**

Create mobile-optimized settings for spotlight/highlight events.

**Files to create:**
- `src/client/components/mobile/MobileSpotlightSettings.tsx`

**TDZ Prevention for this task:**
- ⚠️ Import mobile UI components created in foundation phase (MobileSlider, etc.)
- ⚠️ Check that foundation UI components are completed BEFORE starting this
- ⚠️ Initialize all spotlight-related state with complete default objects
- ⚠️ Use optional chaining when accessing event properties: `event?.spotlightWidth || 120`

**Features needed:**
- Spotlight size slider (50-300px range)
- Shape selector (circle/rectangle with visual preview)
- Opacity slider (0.1-1.0 range)
- Dim percentage slider (0-90% range)
- Position controls (X/Y coordinates)
- Real-time preview of changes

**Reference:** `src/client/components/SpotlightSettings.tsx` for desktop implementation

---

### Task: Create Mobile Pan/Zoom Settings Component (✅ Completed)
**Parallel task - independent of other event settings**

Create mobile-optimized settings for pan and zoom events.

**Files to create:**
- `src/client/components/mobile/MobilePanZoomSettings.tsx`

**TDZ Prevention for this task:**
- ⚠️ Import mobile UI components (MobileSlider, etc.) - ensure foundation components completed first
- ⚠️ Initialize pan/zoom state with complete defaults: `{ targetX: 50, targetY: 50, zoom: 2 }`
- ⚠️ Use optional chaining: `event?.zoomLevel || 2`

**Features needed:**
- Zoom level slider (1x to 5x)
- Target position controls (X/Y with visual positioning)
- Duration slider for animation (500ms to 5000ms)
- Easing options (linear, ease-in, ease-out, ease-in-out)
- Preview button to test zoom behavior

**Reference:** `src/client/components/PanZoomSettings.tsx` for desktop implementation

---

### Task: Create Mobile Media Settings Component (✅ Completed)
**Parallel task - independent of other event settings**

Create mobile-optimized settings for video, audio, image, and YouTube events.

**Files to create:**
- `src/client/components/mobile/MobileMediaSettings.tsx`

**TDZ Prevention for this task:**
- ⚠️ Import MobileMediaUpload component - ensure foundation components completed first
- ⚠️ Initialize media state with defaults: `{ mediaType: 'image', url: '', autoPlay: false }`
- ⚠️ Use optional chaining: `event?.mediaUrl || ''`

**Features needed:**
- Media type selector (Video/Audio/Image/YouTube)
- File upload interface for local media
- URL input for external media and YouTube
- YouTube start/end time controls
- Modal size and position controls
- Auto-play toggle
- Volume controls for audio/video

**Reference:** Desktop media handling in `HotspotEditorModal.tsx`

---

### Task: Create Mobile Quiz Settings Component (✅ Completed)
**Parallel task - independent of other event settings**

Create mobile-optimized settings for quiz/question events.

**Files to create:**
- `src/client/components/mobile/MobileQuizSettings.tsx`

**TDZ Prevention for this task:**
- ⚠️ Initialize quiz state with complete structure: `{ question: '', options: [''], correctAnswer: 0 }`
- ⚠️ Use optional chaining: `event?.quizQuestion || ''`
- ⚠️ Ensure options array always has at least one item

**Features needed:**
- Question text input (large text area)
- Multiple choice answer management (add/remove/reorder)
- Correct answer selector
- Explanation text (optional)
- Quiz modal position and size controls
- Answer shuffle toggle

**Reference:** Quiz handling patterns from existing codebase

---

### Task: Create Mobile Text Settings Component (✅ Completed)
**Parallel task - independent of other event settings**

Create mobile-optimized settings for text modal events.

**Files to create:**
- `src/client/components/mobile/MobileTextSettings.tsx`

**Features needed:**
- Rich text editor (bold, italic, lists)
- Text alignment controls
- Modal size and position controls
- Background color/transparency options
- Font size controls
- Preview functionality

---

## 🔴 EVENT PREVIEW SYSTEM (Depends on settings components)

### Task: Create Mobile Event Preview Engine (✅ Completed)
**Start after at least 2 event settings components are complete**

Build the preview system that allows users to test events on mobile.

**Files to create:**
- `src/client/components/mobile/MobileEventPreview.tsx`
- `src/client/components/mobile/MobilePreviewOverlay.tsx`

**Files to modify:**
- `src/client/components/MobileEditorModal.tsx`

**Features needed:**
- Full-screen preview mode for events
- Preview controls (play, pause, restart)
- Event-specific preview rendering for each interaction type
- Overlay controls that don't interfere with preview
- Exit preview functionality
- Performance optimization for smooth preview

**Implementation approach:**
1. Create preview renderer that can handle all event types
2. Add preview state management to MobileEditorModal
3. Add preview buttons to event cards
4. Implement event-specific preview logic
5. Add preview controls overlay

---

## 🟡 EVENT EDITOR INTEGRATION (Depends on settings + preview)

### Task: Create Comprehensive Mobile Event Editor (✅ Completed)
**Start after event settings and preview components are complete**

Replace the basic event creation with a full-featured mobile event editor.

**Files to create:**
- `src/client/components/mobile/MobileEventEditor.tsx`
- `src/client/components/mobile/MobileEventCard.tsx`

**Files to modify:**
- `src/client/components/MobileEditorModal.tsx`

**TDZ Prevention for this task:**
- ⚠️ CRITICAL: This heavily modifies existing MobileEditorModal - BACKUP the file first
- ⚠️ Import ALL event settings components at top of file (check they're completed first)
- ⚠️ When modifying MobileEditorModal, preserve ALL existing state initialization
- ⚠️ Add new state AFTER existing state, with complete default values
- ⚠️ Test existing hotspot editing functionality after integration
- ⚠️ Use optional chaining for all event properties: `event?.type || InteractionType.SHOW_TEXT`

**Features needed:**
- Tabbed interface (Basic, Advanced, Preview)
- Event type selection with search/filter
- Integration with all event settings components
- Event reordering with touch-friendly drag & drop
- Event duplication functionality
- Batch operations (delete multiple, reorder multiple)
- Event validation and error handling

**Key implementation details:**
- Use React state to manage active tab
- Integrate all previously created settings components
- Add touch-friendly drag and drop for event reordering
- Include comprehensive form validation
- Add auto-save functionality to prevent data loss

---

## 🟠 TIMELINE INTEGRATION (Depends on event editor)

### Task: Enable Mobile Timeline Editing (✅ Completed)
**Start after event editor is functional**

Replace the disabled mobile timeline with full editing capabilities.

**Files to modify:**
- `src/client/components/HorizontalTimeline.tsx`
- `src/client/components/MobileEditorLayout.tsx`

**Files to create:**
- `src/client/components/mobile/MobileTimeline.tsx`
- `src/client/components/mobile/MobileTimelineStep.tsx`
- `src/client/components/mobile/MobileStepManager.tsx`

**TDZ Prevention for this task:**
- ⚠️ CRITICAL: Modifies core timeline components used throughout app
- ⚠️ BACKUP existing HorizontalTimeline.tsx before modification
- ⚠️ When modifying HorizontalTimeline, preserve existing desktop functionality
- ⚠️ Add mobile detection condition AROUND new code, don't replace existing code
- ⚠️ Test desktop timeline functionality after changes
- ⚠️ Import mobile timeline components ONLY within mobile-specific conditions
- ⚠️ Initialize all timeline-related state with proper defaults

**Current state:** Timeline editing disabled on mobile with message "Timeline editing is optimized for desktop"
**Target state:** Full timeline editing with mobile-optimized interface

**Implementation pattern:**
```typescript
// ✅ CORRECT way to modify HorizontalTimeline.tsx:
if (isMobile && isEditing) {
  return <MobileTimeline {...props} />; // New mobile component
}

// Keep existing desktop logic unchanged:
if (uniqueSortedSteps.length === 0 && !isEditing) {
  return null;
}
// ... rest of existing desktop logic
```

**Features needed:**
- Horizontal scrolling timeline with touch controls
- Step creation, editing, and deletion
- Step reordering with drag & drop
- Step duration controls
- Timeline playback controls
- Auto-progression settings
- Timeline export/import

---

### Task: Add Advanced Timeline Management (✅ Completed)
**Start after basic timeline editing is working**

Add advanced timeline features to match desktop functionality.

**Files to modify:**
- Components created in previous timeline task

**Features needed:**
- ✅ Bulk step operations
- ✅ Timeline templates
- ✅ Step copying between projects
- ✅ Timeline validation
- ✅ Performance optimization for long timelines
- ✅ Timeline analytics (step completion rates, etc.)

---

## 🟣 UI/UX POLISH (Can be done throughout)

### Task: Optimize Mobile Gesture Handling (✅ Completed)
**Can be done in parallel with other tasks**

Enhance the mobile experience with native mobile gestures and interactions.

**Files to modify:**
- `src/client/components/MobileEditorModal.tsx`
- `src/client/components/MobileEditorLayout.tsx`
- `src/client/hooks/useTouchGestures.ts`

**Features needed:**
- Swipe gestures for tab navigation
- Pull-to-refresh for event lists
- Pinch-to-zoom in preview mode
- Haptic feedback where appropriate
- Improved keyboard handling
- Better orientation change handling

---

### Task: Add Mobile-Specific Accessibility Features (✅ Completed)
**Can be done in parallel with other tasks**

Ensure the mobile editor meets accessibility standards.

**Files to modify:**
- All mobile components created in previous tasks

**Features needed:**
- Screen reader optimization
- Voice control support
- High contrast mode support
- Font scaling support
- Keyboard navigation for external keyboards
- Focus management for modals
- ARIA labels for all interactive elements

---

### Task: Performance Optimization for Mobile
**Should be done near the end**

Optimize the mobile editor for performance on lower-end devices.

**Files to modify:**
- All mobile components

**Optimizations needed:**
- Lazy loading of event settings components - **COMPLETED**
- Virtual scrolling for long event lists - **SKIPPED** (due to complexity with dnd-kit)
- Image optimization and lazy loading - **COMPLETED**
- Memory leak prevention - **COMPLETED** (code review found no leaks)
- Bundle size optimization - **COMPLETED** (analysis showed good chunking)
- Animation performance optimization - **COMPLETED**

---

## 🔧 TESTING & VALIDATION

### Task: Create Mobile Editor Test Suite
**Should be done alongside development**

Create comprehensive tests for mobile editor functionality.

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

### Task: TDZ Error Prevention Validation
**MUST be run after EVERY completed task**

Validate that no TDZ errors were introduced by changes.

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

## 📋 COMPLETION CRITERIA

**Phase 1 Complete When:**
- ✅ All 17+ interaction types available on mobile
- ✅ Mobile UI components library functional
- ✅ Event type selection working

**Phase 2 Complete When:**
- ✅ All event settings components created and functional (✅ Completed)
- ✅ Event preview system working for all event types
- ✅ Mobile event editor integrated and working

**Phase 3 Complete When:**
- ✅ Timeline editing fully functional on mobile
- ✅ Advanced timeline management features working
- ✅ Feature parity with desktop achieved

**Final Completion When:**
- ✅ All UI/UX polish complete
- ✅ Performance optimized
- ✅ Accessibility standards met
- ✅ Test suite passing
- ✅ Cross-device testing complete

---

## 📝 NOTES FOR JULES

**TDZ Error Prevention (CRITICAL):**
- ⚠️ Run `npm run build` after EVERY task to catch TDZ errors early
- ⚠️ NEVER modify existing state initialization - only ADD new state
- ⚠️ Always use optional chaining when accessing potentially undefined properties
- ⚠️ Import order matters: React → 3rd party → internal → relative
- ⚠️ Backup files before modifying existing components
- ⚠️ Test existing functionality after making changes

**General Guidelines:**
- Follow existing TypeScript patterns and interfaces
- Maintain consistency with existing mobile styling (use Tailwind classes from current codebase)
- Test on actual mobile devices when possible
- Prioritize touch-friendly interactions (44px minimum touch targets)
- Keep bundle size impact minimal
- Follow existing error handling patterns
- Use existing icon components where available
- Maintain backward compatibility with saved projects

**Before Starting Any Task:**
1. Review the TDZ prevention rules above
2. Check that prerequisite components are completed
3. Backup any files you'll be modifying
4. Run `npm run build` to establish baseline (should pass)

**After Completing Any Task:**
1. Run `npm run build` to check for TDZ errors
2. Test the specific functionality you added
3. Test that existing functionality still works
4. Check browser console for errors during testing