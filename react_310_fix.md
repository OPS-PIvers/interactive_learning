# React Error #310 Troubleshooting Guide

## 🚨 Error Overview
**React Error #310**: "Rendered more hooks than during the previous render"

This error occurs when React hooks are called conditionally or in different orders between component renders, violating the Rules of Hooks.

## 🔍 Root Cause Analysis

Based on the codebase analysis, the error occurs when clicking "View" or "Edit" on a module because:

1. **Conditional Hook Calls**: Different hooks being called based on `isEditing` prop
2. **Inconsistent Component Structure**: Different rendering paths for mobile vs desktop
3. **Dynamic Hook Order**: Components mount/unmount causing hook order changes

## 🎯 Primary Fix Locations

### 1. **InteractiveModule.tsx** - Main Culprit
**File**: `src/client/components/InteractiveModule.tsx`
**Issues**:
- Hooks called conditionally based on `isEditing` prop
- Different component structures for editing vs viewing modes
- Mobile vs desktop conditional rendering affects hook order

**Fix Strategy**:
```typescript
// ❌ WRONG: Conditional hooks
const InteractiveModule: React.FC<InteractiveModuleProps> = ({ isEditing, ...props }) => {
  if (isEditing) {
    const [editingState] = useState(null); // ❌ Hook called conditionally
  }
  
  const isMobile = useIsMobile();
  if (isMobile) {
    const [mobileState] = useState(null); // ❌ Hook called conditionally
  }
}

// ✅ CORRECT: Always call hooks in same order
const InteractiveModule: React.FC<InteractiveModuleProps> = ({ isEditing, ...props }) => {
  // Always declare all hooks
  const [editingState] = useState(null);
  const [mobileState] = useState(null);
  const isMobile = useIsMobile();
  
  // Use conditional logic after hooks
  const activeEditingState = isEditing ? editingState : null;
  const activeMobileState = isMobile ? mobileState : null;
}
```

### 2. **App.tsx** - Conditional Rendering Issue
**File**: `src/client/components/App.tsx`
**Issues**:
- Different InteractiveModule mounting paths for mobile/desktop editing
- Modal wrapper conditionally affects hook execution

**Fix Strategy**:
```typescript
// ❌ WRONG: Different component trees
{selectedProject && (
  <>
    {isEditingMode ? (
      isMobile ? (
        <div className="fixed inset-0 z-50 bg-slate-900">
          <InteractiveModule /> {/* Different hook context */}
        </div>
      ) : (
        <Modal>
          <InteractiveModule /> {/* Different hook context */}
        </Modal>
      )
    ) : (
      <div className="fixed inset-0 z-50 bg-slate-900">
        <InteractiveModule /> {/* Different hook context */}
      </div>
    )}
  </>
)}

// ✅ CORRECT: Consistent component tree
{selectedProject && (
  <InteractiveModuleWrapper
    isEditingMode={isEditingMode}
    isMobile={isMobile}
    selectedProject={selectedProject}
    onClose={handleCloseModal}
    onSave={handleSaveProjectData}
  />
)}
```

### 3. **MobileEditorLayout.tsx** - Dynamic Hook Calls
**File**: `src/client/components/MobileEditorLayout.tsx`
**Issues**:
- Hooks called in different order based on props
- Conditional useEffect dependencies

## 🛠️ Step-by-Step Implementation Plan

### Phase 1: Fix Hook Order Issues (Critical)

#### Step 1.1: Update InteractiveModule.tsx
```typescript
// At the top of the component, ALWAYS call all hooks
const InteractiveModule: React.FC<InteractiveModuleProps> = (props) => {
  // ✅ ALWAYS declare ALL hooks first, unconditionally
  const isMobile = useIsMobile();
  const [backgroundImage, setBackgroundImage] = useState<string | undefined>(props.initialData.backgroundImage);
  const [hotspots, setHotspots] = useState<HotspotData[]>(props.initialData.hotspots);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEventData[]>(props.initialData.timelineEvents);
  const [moduleState, setModuleState] = useState<'idle' | 'learning'>(props.isEditing ? 'learning' : 'idle');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [imageLoading, setImageLoading] = useState(false);
  const [positionCalculating, setPositionCalculating] = useState(false);
  const [isModeSwitching, setIsModeSwitching] = useState(false);
  
  // Mobile editing states - ALWAYS declare even if not editing
  const [activeMobileEditorTab, setActiveMobileEditorTab] = useState<MobileEditorActiveTab>('properties');
  const [editingHotspot, setEditingHotspot] = useState<HotspotData | null>(null);
  
  // Editor-specific states - ALWAYS declare
  const [editingZoom, setEditingZoom] = useState<number>(1);
  const [imageNaturalDimensions, setImageNaturalDimensions] = useState<{width: number, height: number} | null>(null);
  
  // All other hooks...
  
  // ✅ Use conditional logic AFTER all hooks are declared
  const shouldShowMobileEditor = props.isEditing && isMobile;
  const shouldShowDesktopEditor = props.isEditing && !isMobile;
  
  // Rendering logic can be conditional, hooks cannot
  if (shouldShowMobileEditor) {
    return <MobileEditorLayoutComponent />;
  }
  
  if (shouldShowDesktopEditor) {
    return <DesktopEditorComponent />;
  }
  
  return <ViewerComponent />;
};
```

#### Step 1.2: Create Wrapper Component for App.tsx
```typescript
// Create new file: src/client/components/InteractiveModuleWrapper.tsx
interface InteractiveModuleWrapperProps {
  selectedProject: Project;
  isEditingMode: boolean;
  isMobile: boolean;
  onClose: () => void;
  onSave: (projectId: string, data: InteractiveModuleState) => void;
}

const InteractiveModuleWrapper: React.FC<InteractiveModuleWrapperProps> = ({
  selectedProject,
  isEditingMode,
  isMobile,
  onClose,
  onSave
}) => {
  // ✅ ALWAYS call the same hooks in the same order
  const [isModalOpen, setIsModalOpen] = useState(true);
  
  // ✅ Determine wrapper type without affecting hook order
  const WrapperComponent = useMemo(() => {
    if (isEditingMode && !isMobile) {
      return Modal; // Desktop editing uses modal
    }
    return Fragment; // Mobile editing and viewing use full-screen
  }, [isEditingMode, isMobile]);
  
  const wrapperProps = useMemo(() => {
    if (isEditingMode && !isMobile) {
      return {
        isOpen: isModalOpen,
        onClose: onClose,
        title: selectedProject.title
      };
    }
    return {};
  }, [isEditingMode, isMobile, isModalOpen, onClose, selectedProject.title]);
  
  return (
    <div className="fixed inset-0 z-50 bg-slate-900">
      <WrapperComponent {...wrapperProps}>
        <InteractiveModule
          key={`${selectedProject.id}-${isEditingMode}`}
          initialData={selectedProject.interactiveData}
          isEditing={isEditingMode}
          onSave={(data) => onSave(selectedProject.id, data)}
          onClose={onClose}
          projectName={selectedProject.title}
          projectId={selectedProject.id}
        />
      </WrapperComponent>
    </div>
  );
};
```

#### Step 1.3: Update App.tsx to use wrapper
```typescript
// In App.tsx, replace the complex conditional rendering with:
{selectedProject && (
  <InteractiveModuleWrapper
    selectedProject={selectedProject}
    isEditingMode={isEditingMode}
    isMobile={isMobile}
    onClose={handleCloseModal}
    onSave={handleSaveProjectData}
  />
)}
```

### Phase 2: Fix useEffect Dependencies

#### Step 2.1: Stabilize useEffect dependencies in InteractiveModule.tsx
```typescript
// ❌ WRONG: Dependencies change based on conditions
useEffect(() => {
  if (isEditing && isMobile) {
    // Some mobile-specific effect
  }
}, [isEditing, isMobile, /* other conditional deps */]);

// ✅ CORRECT: Split effects with stable dependencies
useEffect(() => {
  // Effect always runs, but early return for conditions
  if (!isEditing || !isMobile) return;
  
  // Mobile-specific effect logic
}, [isEditing, isMobile]); // Stable dependencies

useEffect(() => {
  // Another effect with different stable dependencies
}, [otherStableDep]);
```

#### Step 2.2: Fix MobileEditorLayout.tsx hook order
```typescript
const MobileEditorLayout: React.FC<MobileEditorLayoutProps> = (props) => {
  // ✅ ALWAYS declare all hooks first
  const [viewport, setViewport] = useState<ViewportState>(initialViewportState);
  const [editorMode, setEditorMode] = useState<'compact' | 'fullscreen' | 'modal'>('compact');
  const [activePanel, setActivePanel] = useState<'image' | 'properties' | 'timeline'>(
    props.activePanelOverride || 'image'
  );
  
  const layoutRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // ✅ All useEffect hooks with stable dependencies
  useEffect(() => {
    if (props.activePanelOverride) {
      setActivePanel(props.activePanelOverride);
    }
  }, [props.activePanelOverride]);
  
  // Other effects...
  
  // ✅ Conditional logic after hooks
  const shouldShowPanel = props.isEditing && activePanel === 'properties';
  
  return (
    // Conditional rendering here is fine
  );
};
```

### Phase 3: Add Error Boundary Protection

#### Step 3.1: Create HookErrorBoundary component
```typescript
// Create new file: src/client/components/HookErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class HookErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a hooks-related error
    const isHookError = error.message.includes('hooks') || 
                       error.message.includes('render') ||
                       error.message.includes('Invariant');
    
    return { 
      hasError: true, 
      error: isHookError ? error : undefined 
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Hook Error Boundary caught an error:', error, errorInfo);
    
    // Log specific information for React error #310
    if (error.message.includes('hooks')) {
      console.error('React Hooks Error - Check component hook order:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold mb-4">Component Error</h2>
            <p className="text-slate-300 mb-4">
              A rendering error occurred. This is usually due to component state issues.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default HookErrorBoundary;
```

#### Step 3.2: Wrap InteractiveModule with error boundary
```typescript
// In App.tsx
import HookErrorBoundary from './HookErrorBoundary';

// Wrap the InteractiveModuleWrapper with error boundary
{selectedProject && (
  <HookErrorBoundary>
    <InteractiveModuleWrapper
      selectedProject={selectedProject}
      isEditingMode={isEditingMode}
      isMobile={isMobile}
      onClose={handleCloseModal}
      onSave={handleSaveProjectData}
    />
  </HookErrorBoundary>
)}
```

## 🧪 Testing & Verification

### Test Case 1: View/Edit Mode Switching
```typescript
// Test function to verify hook consistency
const testHookConsistency = async () => {
  // 1. Load project in view mode
  // 2. Click "Edit" button
  // 3. Verify no React error #310
  // 4. Switch back to view mode
  // 5. Verify no errors
  
  console.log('Testing view/edit mode switching...');
  // Implementation would go here
};
```

### Test Case 2: Mobile/Desktop Consistency
```typescript
// Test function to verify mobile/desktop rendering
const testMobileDesktopConsistency = async () => {
  // 1. Test on mobile viewport
  // 2. Test on desktop viewport
  // 3. Verify same hook order in both
  
  console.log('Testing mobile/desktop consistency...');
  // Implementation would go here
};
```

## 🎛️ Development Mode Debugging

### Enable React Development Mode
```typescript
// In your main.tsx or App.tsx
if (process.env.NODE_ENV === 'development') {
  // Enable React's strict mode to catch hook violations
  const StrictModeApp = () => (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  ReactDOM.render(<StrictModeApp />, document.getElementById('root'));
} else {
  ReactDOM.render(<App />, document.getElementById('root'));
}
```

### Add Hook Debugging
```typescript
// Add to InteractiveModule.tsx for debugging
const InteractiveModule: React.FC<InteractiveModuleProps> = (props) => {
  // Debug hook calls in development
  if (process.env.NODE_ENV === 'development') {
    console.log('InteractiveModule hooks called:', {
      isEditing: props.isEditing,
      timestamp: Date.now(),
      hookCount: 'Starting hook calls...'
    });
  }
  
  // All your hooks here...
  
  if (process.env.NODE_ENV === 'development') {
    console.log('InteractiveModule hooks completed successfully');
  }
  
  // Rest of component...
};
```

## 🚀 Quick Fix Command List

Run these commands in Claude Code to implement the fixes:

```bash
# 1. Create the wrapper component
touch src/client/components/InteractiveModuleWrapper.tsx

# 2. Create the error boundary
touch src/client/components/HookErrorBoundary.tsx

# 3. Backup current files before modification
cp src/client/components/InteractiveModule.tsx src/client/components/InteractiveModule.tsx.backup
cp src/client/components/App.tsx src/client/components/App.tsx.backup

# 4. Apply the fixes (manual editing required)
# Edit the files according to the code examples above
```

## ⚠️ Important Notes

1. **Hook Order Rule**: Always call hooks in the exact same order on every render
2. **No Conditional Hooks**: Never call hooks inside loops, conditions, or nested functions
3. **Early Returns**: Place conditional logic after all hook calls, not before
4. **Consistent Keys**: Use stable keys for components that mount/unmount
5. **Error Boundaries**: Always wrap complex components with error boundaries

## 🔄 Rollback Plan

If issues persist after applying fixes:

1. **Restore Backups**:
   ```bash
   cp src/client/components/InteractiveModule.tsx.backup src/client/components/InteractiveModule.tsx
   cp src/client/components/App.tsx.backup src/client/components/App.tsx
   ```

2. **Identify Specific Hook**: Add debugging to isolate which hook is causing the issue

3. **Gradual Implementation**: Apply fixes one component at a time rather than all at once

## 📋 Success Criteria

- ✅ No React error #310 when clicking View/Edit buttons
- ✅ Smooth transitions between viewing and editing modes
- ✅ Consistent behavior on mobile and desktop
- ✅ No console errors related to hook order
- ✅ All existing functionality preserved

## 🔧 Implementation Priority

### Immediate (Critical)
1. Fix hook order in `InteractiveModule.tsx`
2. Create `InteractiveModuleWrapper.tsx`
3. Update `App.tsx` conditional rendering

### Short-term (High Priority)
1. Add `HookErrorBoundary.tsx`
2. Fix `MobileEditorLayout.tsx` hooks
3. Add development debugging

### Medium-term (Nice to Have)
1. Add comprehensive testing
2. Create hook linting rules
3. Document hook patterns

This guide should resolve the React error #310 issue by ensuring consistent hook ordering across all component renders and render paths.