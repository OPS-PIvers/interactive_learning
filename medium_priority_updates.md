## Medium Priority Features

Based on my research of both the current codebase and the `main_revert` branch, here's a comprehensive plan for implementing the remaining medium priority tasks:

### Task Overview

1.  Migrate hotspot event settings from `main_revert` branch to slide system
2.  Implement hotspot appearance customization with enhanced UI based on legacy StreamlinedHotspotEditor
3.  Create comprehensive properties panels for element editing
4.  Add theme selector to project settings menu
5.  Implement color palette selection interface

### Detailed Implementation Plan

#### Phase 1: Event Settings Migration & Enhancement

*   Migrate event settings from `main_revert` `MobileEventSettings.tsx`
    *   Extract rich event parameter interfaces (spotlight, pan-zoom, media, text, quiz settings)
    *   Adapt `MobileSpotlightSettings`, `MobilePanZoomSettings`, `MobileMediaSettings` to work with slide elements
    *   Update `slideTypes.ts` with comprehensive event parameter definitions that match the legacy system
    *   Create element interaction editor components for each effect type

#### Phase 2: Enhanced Hotspot Appearance Customization

*   Migrate `StreamlinedHotspotEditor` appearance controls to slide system
    *   Extract color presets system from `main_revert` (bg-red-500, bg-blue-500, etc.)
    *   Add hotspot size controls (small/medium/large) to element properties panel
    *   Implement pulse animation controls and custom shape options
    *   Create enhanced style section in `EnhancedPropertiesPanel` with:
        *   Color picker with preset swatches
        *   Size selector (small/medium/large)
        *   Animation controls (pulse settings)
        *   Shadow and opacity controls

#### Phase 3: Comprehensive Properties Panels Enhancement

*   Extend `EnhancedPropertiesPanel.tsx` with expanded sections:
    *   Enhanced Style section with color presets and size controls
    *   Advanced Interactions section with full event editing capabilities
    *   Animation & Effects section for pulse, hover states, and transitions
    *   Element-specific property panels (hotspot vs text vs media specific controls)

#### Phase 4: Theme System Integration

*   Add `ProjectThemeProvider` to `SlideBasedEditor` component
    *   Wrap the editor with theme context provider
    *   Apply theme CSS variables to slide elements and properties panels
    *   Connect theme colors to hotspot appearance controls

#### Phase 5: Settings Menu & Theme Selector

*   Implement Project Settings Menu
    *   Add settings modal triggered by gear icon in `SlideBasedEditor` header (line 455)
    *   Create `ProjectSettingsModal` component with tabs: General, Theme, Export
    *   Build `ThemeSelector` component with preview cards showing different color palettes
    *   Connect theme selection to `useProjectTheme` hook and persist theme choice

#### Phase 6: Color Palette Interface

*   Enhanced Theme Selection UI
    *   Visual theme preview cards showing hotspot colors and modal styles
    *   Live preview of theme changes on the slide canvas
    *   Theme customization panel for creating custom color combinations
    *   Integration with existing `themePresets` (Professional, Vibrant, Earth, Dark)

### Key Technical Decisions

1.  **Leverage Existing Foundation:** Build upon the completed theme system, `slideTypes` extensions, and timeline integration
2.  **Maintain Backward Compatibility:** Ensure legacy hotspot projects continue working while enabling enhanced features
3.  **Progressive Enhancement:** Add new features as optional enhancements that don't break existing functionality
4.  **Mobile-First Design:** Ensure all new UI components work well on both desktop and mobile
5.  **Theme Integration:** Connect all new appearance controls to the theme system for consistent styling

### Expected Outcomes

*   Rich event editing capabilities matching the legacy system
*   Professional appearance customization UI with color presets and animations
*   Comprehensive properties panels for all element types
*   Integrated theme system with visual selector in project settings
*   Enhanced user experience with consistent styling and theming

This plan builds systematically on the completed high-priority work while integrating seamlessly with the existing slide-based architecture.