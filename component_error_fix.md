# Fix Component Error - React Hook Order Violations

## Issue Description

React component error "A rendering error occurred. This is usually due to component state issues or hook order violations" occurs when:
1. Clicking "Start guided tour" in viewer mode
2. Clicking "Edit" mode (immediate error)

**Root Cause:** Early returns after hooks in `InteractiveModule.tsx` violate React's Rules of Hooks.

## Implementation Tasks

### Task 1: Fix Hook Order Violations in InteractiveModule.tsx

**File:** `src/client/components/InteractiveModule.tsx`

**Problem:** Early returns after ~60 hooks cause hook order inconsistencies

**Solution:** Replace early returns with conditional rendering in main return statement

```typescript
// FIND these problematic early returns (around line 400-450):
if (!isInitialized) {
  return <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center">
    <div className="text-white">Initializing module...</div>
  </div>;
}

if (initError) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center">
      <div className="bg-red-800 text-white p-6 rounded-lg max-w-md">
        <h2 className="text-xl font-bold mb-2">Initialization Error</h2>
        <p className="mb-4">{initError.message}</p>
        <button
          onClick={onReloadRequest ? onReloadRequest : () => window.location.reload()}
          className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded"
        >
          {onReloadRequest ? 'Retry Initialization' : 'Reload Page'}
        </button>
      </div>
    </div>
  );
}

// REPLACE with conditional rendering in the main return statement:
return (
  <div className="fixed inset-0 z-50 bg-slate-900">
    {!isInitialized ? (
      <LoadingScreen />
    ) : initError ? (
      <ErrorScreen error={initError} onReload={onReloadRequest} />
    ) : (
      <div
        id="main-content"
        tabIndex={-1}
        className={`text-slate-200 ${isEditing ? 'fixed inset-0 z-50 bg-slate-900' : 'fixed inset-0 z-50 bg-slate-900'}`}
        role="main"
        aria-label={isEditing ? 'Interactive module editor' : 'Interactive module viewer'}
        aria-live="polite"
      >
        {/* ALL EXISTING JSX CONTENT GOES HERE - just move it inside this conditional */}
      </div>
    )}
  </div>
);
```

### Task 2: Create Reusable Loading Screen Component

**Create:** `src/client/components/shared/LoadingScreen.tsx`

```typescript
import React from 'react';
import LoadingSpinnerIcon from '../icons/LoadingSpinnerIcon';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Initializing module..." 
}) => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <LoadingSpinnerIcon className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
      <div className="text-white text-lg">{message}</div>
    </div>
  </div>
);

export default LoadingScreen;
```

**Add import to InteractiveModule.tsx:**
```typescript
import LoadingScreen from './shared/LoadingScreen';
```

### Task 3: Create Reusable Error Screen Component

**Create:** `src/client/components/shared/ErrorScreen.tsx`

```typescript
import React from 'react';

interface ErrorScreenProps {
  error: Error;
  onReload?: () => void;
  title?: string;
}

const ErrorScreen: React.FC<ErrorScreenProps> = ({ 
  error, 
  onReload, 
  title = "Initialization Error" 
}) => (
  <div className="flex items-center justify-center h-full">
    <div className="bg-red-800 text-white p-6 rounded-lg max-w-md">
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="mb-4">{error.message}</p>
      <button
        onClick={onReload || (() => window.location.reload())}
        className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded transition-colors"
      >
        Reload Page
      </button>
    </div>
  </div>
);

export default ErrorScreen;
```

**Add import to InteractiveModule.tsx:**
```typescript
import ErrorScreen from './shared/ErrorScreen';
```

### Task 4: Enhance Error Boundary Logging

**File:** `src/client/components/HookErrorBoundary.tsx`

**Update the `componentDidCatch` method:**

```typescript
componentDidCatch(error: Error, errorInfo: any) {
  console.error('Hook Error Boundary caught an error:', error, errorInfo);
  
  // Enhanced detection for hook-related errors
  const isHookError = error.message.includes('hooks') || 
                     error.message.includes('Rendered more hooks') ||
                     error.message.includes('Rendered fewer hooks') ||
                     error.message.includes('Invariant');
  
  if (isHookError) {
    console.error('🚨 React Hooks Error Detected:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      // Help developers identify the component
      possibleComponent: errorInfo.componentStack?.split('\n')[1]?.trim()
    });
  }
}
```

### Task 5: Create shared Directory

**Create directory:** `src/client/components/shared/`

This directory will hold reusable UI components like LoadingScreen and ErrorScreen.

## Testing Checklist

After implementation, test these scenarios:

### Critical Tests:
- [ ] Click "View" on a module → "Start guided tour" works without error
- [ ] Click "Edit" on a module → Editor loads without immediate error
- [ ] Verify no console errors about hook order violations

### Regression Tests:
- [ ] Mobile editing still works
- [ ] Desktop editing still works  
- [ ] Hotspot creation and editing works
- [ ] Timeline functionality works
- [ ] Save functionality works

### Error Handling Tests:
- [ ] Test with invalid module data to trigger error screen
- [ ] Verify error screen shows reload button
- [ ] Verify loading screen appears during initialization

## Expected Outcomes

✅ **Immediate Fix:** "Start guided tour" and Edit mode work without errors  
✅ **Better UX:** Clean loading and error states  
✅ **Maintainable:** Reusable components for future use  
✅ **Robust:** Enhanced error detection and logging  
✅ **Minimal Risk:** Keeps all existing functionality intact  

## Implementation Time

**Estimated:** 20 minutes total
- Task 1: 5 minutes (main fix)
- Task 2: 5 minutes (loading component)  
- Task 3: 5 minutes (error component)
- Task 4: 3 minutes (error boundary)
- Task 5: 2 minutes (directory + testing)

## Priority

**CRITICAL** - This blocks core user workflows (viewing and editing modules)
