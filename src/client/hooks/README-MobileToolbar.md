# Mobile Toolbar System Integration Guide

## Overview

The enhanced mobile toolbar system provides a comprehensive solution for consistent mobile UI layout across all devices, with special handling for iOS Safari viewport quirks and very small screens.

## Core Components

### 1. `useMobileToolbar` Hook

The main hook that manages all toolbar-related calculations and CSS variable synchronization.

```typescript
const { dimensions, positioning, cssVariables, isReady } = useMobileToolbar(isTimelineVisible);
```

**Returns:**
- `dimensions`: Responsive height calculations and screen size detection
- `positioning`: Fixed positioning values with iOS Safari compensation
- `cssVariables`: Synchronized CSS custom properties
- `isReady`: Boolean indicating when the system is initialized

### 2. `useToolbarSpacing` Hook

Utility hook for components that need responsive spacing around the toolbar.

```typescript
const { marginBottom, maxHeight, paddingBottom, variables } = useToolbarSpacing(isTimelineVisible);
```

### 3. `useContentAreaHeight` Hook

Specialized hook for calculating available content area height.

```typescript
const { contentHeight, availableHeight, maxHeight } = useContentAreaHeight(isTimelineVisible);
```

## Responsive Breakpoints

### Very Small Screens (height < 500px)
- Toolbar height: 44px
- Header height: 48px
- Timeline offset: 50px (when visible)
- Reduced padding and button sizes

### Standard Mobile Screens (height ≥ 500px)
- Toolbar height: 56px
- Header height: 60px
- Timeline offset: 64px (when visible)
- Standard padding and button sizes

## CSS Variables

The system automatically synchronizes these CSS variables:

```css
--mobile-toolbar-height: 44px | 56px
--mobile-header-height: 48px | 60px
--mobile-content-height: calculated available height
--mobile-timeline-offset: 0px | 50px | 64px
--mobile-very-small-screen: 0 | 1
--mobile-safari-ui-offset: dynamic iOS Safari compensation
--mobile-available-height: viewport height excluding iOS Safari UI
--mobile-viewport-height: actual viewport height
```

## Component Integration

### 1. Mobile Toolbar Component

```typescript
import { useMobileToolbar } from '../../hooks/useMobileToolbar';

const { dimensions, positioning, cssVariables, isReady } = useMobileToolbar(isTimelineVisible);

return (
  <div style={{
    ...cssVariables, // Apply synchronized variables
    position: 'fixed',
    bottom: positioning.bottom,
    transform: positioning.transform,
    height: `${dimensions.toolbarHeight}px`,
    // ... other styles
  }}>
    {/* toolbar content */}
  </div>
);
```

### 2. Mobile Header Component

```typescript
import { MobileHeader } from './mobile/MobileHeader';

<MobileHeader 
  title="Page Title"
  onBack={() => navigate(-1)}
  rightContent={<ActionButton />}
/>
```

### 3. Mobile Layout Container

```typescript
import { MobileLayoutContainer } from './mobile/MobileLayoutContainer';

<MobileLayoutContainer 
  isTimelineVisible={timelineVisible}
  enableScrolling={true}
>
  {/* your content */}
</MobileLayoutContainer>
```

## iOS Safari Compatibility

The system automatically handles:

- **Dynamic Viewport Units**: Uses visualViewport API when available
- **Safe Area Insets**: Respects device notches and home indicators
- **UI Compensation**: Adjusts for changing Safari UI (address bar, etc.)
- **Transform Offsets**: Applies translateY compensation when Safari UI is visible

## Performance Optimizations

- **Debounced Updates**: Viewport changes are handled with requestAnimationFrame
- **GPU Acceleration**: Transform-based positioning for smooth animations
- **CSS Variable Caching**: Reduces DOM manipulation overhead
- **Conditional Rendering**: Components wait for `isReady` before rendering

## Usage Examples

### Basic Page Layout

```typescript
function MobilePage() {
  const [timelineVisible, setTimelineVisible] = useState(false);
  
  return (
    <MobileLayoutContainer isTimelineVisible={timelineVisible}>
      <MobileHeader title="My Page" onBack={() => history.back()} />
      
      {/* Your page content */}
      <div className="page-content">
        Content that automatically accounts for header and toolbar
      </div>
      
      <MobileToolbar 
        isTimelineVisible={timelineVisible}
        onSlidesOpen={() => {}}
        onBackgroundOpen={() => {}}
        onInsertOpen={() => {}}
      />
    </MobileLayoutContainer>
  );
}
```

### Content Area with Specific Height

```typescript
function EditorCanvas() {
  const { contentHeight } = useContentAreaHeight(isTimelineVisible);
  
  return (
    <div style={{ 
      height: `${contentHeight}px`,
      overflow: 'hidden' 
    }}>
      {/* Canvas content that fits exactly in available space */}
    </div>
  );
}
```

### Custom Spacing

```typescript
function ScrollableContent() {
  const { marginBottom, maxHeight } = useToolbarSpacing(isTimelineVisible);
  
  return (
    <div style={{ 
      marginBottom,
      maxHeight,
      overflow: 'auto' 
    }}>
      {/* Content with proper toolbar spacing */}
    </div>
  );
}
```

## CSS Utility Classes

Use these classes for common mobile layout patterns:

```css
.mobile-toolbar-aware { /* margin-bottom with toolbar + timeline + safe area */ }
.mobile-header-aware { /* margin-top with header + safe area */ }
.mobile-full-layout-aware { /* padding for full header + toolbar layout */ }
.mobile-gpu-accelerated { /* GPU acceleration for smooth performance */ }
.mobile-smooth-scroll { /* Enhanced scrolling behavior */ }
```

## Migration Guide

### From Legacy System

1. **Replace manual height calculations** with `useMobileToolbar` hook
2. **Update CSS variables** to use the new synchronized system
3. **Replace fixed positioning logic** with the positioning object
4. **Add `isReady` checks** to prevent layout flashes

### Legacy Support

The system maintains backward compatibility with:
- `--mobile-bottom-toolbar-height` (maps to `--mobile-toolbar-height`)
- Existing timeline positioning logic
- Current modal and panel systems

## Troubleshooting

### Common Issues

1. **Layout Flash on Load**: Ensure components check `isReady` before rendering
2. **iOS Safari UI Jumps**: Verify transform compensation is applied
3. **Very Small Screen Issues**: Check responsive breakpoint logic
4. **Timeline Positioning**: Ensure `isTimelineVisible` prop is passed correctly

### Debug Mode

Add this to see current values:

```typescript
const { dimensions, positioning, cssVariables } = useMobileToolbar(true);
console.log('Mobile Toolbar Debug:', { dimensions, positioning, cssVariables });
```

## Testing

Test on these scenarios:
- iPhone SE (375x667) - very small screen
- iPhone 13 (390x844) - standard mobile
- iPad portrait (768x1024) - tablet
- iOS Safari with/without address bar
- Android Chrome with/without address bar
- Landscape orientation changes
- Timeline show/hide transitions