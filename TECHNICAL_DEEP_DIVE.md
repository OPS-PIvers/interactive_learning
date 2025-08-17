# ExpliCoLearning Technical Deep Dive

## Core Architectural Philosophy

### Design System as Code
The entire rebuild centers on a design system that becomes the single source of truth for all visual and interaction patterns. This isn't just CSS tokens—it's a complete behavioral specification.

```typescript
// src/design/DesignSystem.ts
export const DesignSystem = {
  // Semantic color system with automatic dark mode
  colors: {
    brand: {
      primary: {
        50: '#eff6ff',
        500: '#6366f1',  // Primary brand color
        900: '#312e81',
        contrast: '#ffffff', // Guaranteed contrast
      },
      semantic: {
        success: { base: '#10b981', contrast: '#ffffff' },
        warning: { base: '#f59e0b', contrast: '#000000' },
        error: { base: '#ef4444', contrast: '#ffffff' },
        info: { base: '#3b82f6', contrast: '#ffffff' },
      }
    },
    // Automatic dark mode variants
    surface: {
      light: { primary: '#ffffff', secondary: '#f8fafc' },
      dark: { primary: '#0f172a', secondary: '#1e293b' }
    }
  },

  // Behavioral specifications
  interactions: {
    // Touch target minimum sizes for accessibility
    touchTarget: {
      minimum: 44,      // iOS/Android standard
      comfortable: 56,  // Material Design standard
      large: 64        // Thumb-friendly
    },
    
    // Animation curves based on user research
    animations: {
      // Perceived performance curves
      entrance: 'cubic-bezier(0.0, 0.0, 0.2, 1)',    // Decelerate
      exit: 'cubic-bezier(0.4, 0.0, 1, 1)',          // Accelerate  
      interaction: 'cubic-bezier(0.4, 0.0, 0.2, 1)', // Standard
      spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Bouncy
      
      // Timing based on cognitive load
      micro: 150,       // UI feedback
      short: 300,       // State changes
      medium: 500,      // Content transitions
      long: 800,        // Page transitions
    },

    // Gesture thresholds based on human factors
    gestures: {
      tap: { maxDuration: 200, maxDistance: 10 },
      longPress: { minDuration: 500, maxDistance: 10 },
      swipe: { minVelocity: 300, minDistance: 50 },
      pinch: { minScale: 0.5, maxScale: 3.0 },
      pan: { threshold: 10, momentum: 0.95 }
    }
  },

  // Responsive breakpoint system
  breakpoints: {
    mobile: { min: 0, max: 767 },
    tablet: { min: 768, max: 1023 },
    desktop: { min: 1024, max: Infinity },
    
    // Content-based breakpoints for specific components
    hotspotEditor: {
      compact: { max: 640 },    // Single column layout
      comfortable: { min: 641 }, // Multi-column layout
    }
  },

  // Typography system with perfect vertical rhythm
  typography: {
    scale: {
      xs: { size: 12, lineHeight: 16, letterSpacing: 0.05 },
      sm: { size: 14, lineHeight: 20, letterSpacing: 0.025 },
      base: { size: 16, lineHeight: 24, letterSpacing: 0 },
      lg: { size: 18, lineHeight: 28, letterSpacing: -0.025 },
      xl: { size: 20, lineHeight: 32, letterSpacing: -0.025 },
      '2xl': { size: 24, lineHeight: 36, letterSpacing: -0.05 },
      '3xl': { size: 30, lineHeight: 42, letterSpacing: -0.05 },
    },
    
    // Semantic typography for specific use cases
    semantic: {
      hotspotLabel: 'sm',
      effectDescription: 'base', 
      canvasCoordinates: 'xs',
      toolbarAction: 'sm',
      modalTitle: 'xl',
      slideTitle: '2xl'
    }
  },

  // Spacing system with mathematical progression
  spacing: {
    // Base 4px system with golden ratio scaling for larger sizes
    px: 1,
    0: 0,
    1: 4,    // 4px
    2: 8,    // 8px 
    3: 12,   // 12px
    4: 16,   // 16px
    5: 20,   // 20px
    6: 24,   // 24px
    8: 32,   // 32px
    10: 40,  // 40px
    12: 48,  // 48px
    16: 64,  // 64px
    20: 80,  // 80px
    24: 96,  // 96px
    32: 128, // 128px
    
    // Semantic spacing for specific layouts
    semantic: {
      hotspotPadding: 3,      // 12px
      canvasMargin: 6,        // 24px
      modalPadding: 8,        // 32px
      toolbarHeight: 16,      // 64px
      sidebarWidth: 80,       // 320px
    }
  }
}

// Theme system with automatic variants
export const createTheme = (mode: 'light' | 'dark' = 'light') => ({
  ...DesignSystem,
  mode,
  colors: {
    ...DesignSystem.colors,
    current: DesignSystem.colors.surface[mode]
  }
})
```

### Data Architecture: Hotspot-Centric Model

The revolutionary change to hotspot-only elements requires a complete data model restructure:

```typescript
// src/types/slide-architecture.ts

// New simplified slide element - ONLY hotspots exist
export interface SlideElement {
  id: string
  type: 'hotspot'  // Single type eliminates complexity
  
  // Positioning system with device-optimized coordinates
  position: ResponsivePosition
  
  // Visual presentation of the hotspot itself
  appearance: HotspotAppearance
  
  // What happens when interacted with
  effects: SlideEffect[]
  
  // Behavioral settings
  behavior: HotspotBehavior
  
  // Metadata for editor
  metadata: ElementMetadata
}

// Enhanced responsive positioning with sub-pixel precision
export interface ResponsivePosition {
  desktop: PrecisePosition
  tablet: PrecisePosition  
  mobile: PrecisePosition
  
  // Positioning strategy for different content types
  strategy: 'absolute' | 'relative' | 'sticky' | 'fixed'
  
  // Constraint system for maintaining relationships
  constraints?: PositionConstraints
}

export interface PrecisePosition {
  x: number        // Sub-pixel precision for crisp rendering
  y: number        // Sub-pixel precision
  width: number    // Can be percentage or pixels
  height: number   // Can be percentage or pixels
  
  // Advanced positioning options
  anchor: 'top-left' | 'center' | 'bottom-right' // etc
  offset?: { x: number, y: number }  // Fine-tuning
  zIndex?: number  // Local z-index within slide
}

// Constraint system for responsive behavior
export interface PositionConstraints {
  // Maintain relationships between elements
  relativeTo?: string  // Element ID to position relative to
  
  // Minimum/maximum bounds
  minWidth?: number
  maxWidth?: number
  minHeight?: number  
  maxHeight?: number
  
  // Aspect ratio maintenance
  aspectRatio?: number
  
  // Safe area handling for mobile
  respectSafeArea: boolean
}

// Rich hotspot appearance system
export interface HotspotAppearance {
  // Visual style determines how hotspot looks
  style: HotspotVisualStyle
  
  // Animation and attention-getting behavior
  animation: HotspotAnimation
  
  // Custom styling overrides
  customStyle?: CustomHotspotStyle
}

export interface HotspotVisualStyle {
  // Shape and size
  shape: 'circle' | 'square' | 'rounded-square' | 'diamond' | 'custom'
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom'
  
  // Color and styling
  variant: 'primary' | 'secondary' | 'accent' | 'neutral' | 'invisible' | 'custom'
  
  // Icon or content inside hotspot
  icon?: string | React.ReactNode
  
  // Border and shadow
  border?: {
    width: number
    style: 'solid' | 'dashed' | 'dotted'
    color: string
  }
  shadow?: {
    size: 'sm' | 'md' | 'lg'
    color: string
    opacity: number
  }
}

export interface HotspotAnimation {
  // Base animation type
  type: 'none' | 'pulse' | 'glow' | 'bounce' | 'shake' | 'custom'
  
  // Timing and behavior
  duration: number      // milliseconds
  delay?: number        // milliseconds
  iteration: number | 'infinite'
  
  // Trigger conditions
  trigger: 'immediate' | 'viewport' | 'hover' | 'focus' | 'custom'
  
  // Custom animation properties
  custom?: {
    keyframes: string
    easing: string
  }
}

// Advanced hotspot behavior
export interface HotspotBehavior {
  // Interaction triggers
  triggers: InteractionTrigger[]
  
  // State management
  states: HotspotState[]
  
  // Accessibility
  accessibility: HotspotAccessibility
  
  // Performance hints
  performance: HotspotPerformance
}

export interface InteractionTrigger {
  type: 'tap' | 'double-tap' | 'long-press' | 'hover' | 'focus' | 'viewport-enter' | 'custom'
  
  // Gesture configuration for touch
  gesture?: {
    minDuration?: number
    maxDuration?: number
    pressure?: number
    radius?: number
  }
  
  // Conditions for trigger activation
  conditions?: TriggerCondition[]
  
  // Debouncing to prevent accidental triggers
  debounce?: number
}

export interface TriggerCondition {
  type: 'device' | 'viewport' | 'time' | 'user-state' | 'custom'
  value: any
  operator: 'equals' | 'greater' | 'less' | 'contains' | 'custom'
}

export interface HotspotState {
  id: string
  name: string
  
  // Visual changes for this state
  appearance?: Partial<HotspotAppearance>
  
  // Available effects in this state
  availableEffects: string[]  // Effect IDs
  
  // Transition conditions to other states
  transitions: StateTransition[]
}

export interface StateTransition {
  toState: string
  condition: TriggerCondition
  animation?: TransitionAnimation
}

export interface HotspotAccessibility {
  // Screen reader support
  label: string
  description?: string
  role?: string
  
  // Keyboard navigation
  tabIndex?: number
  shortcut?: string
  
  // High contrast mode support
  highContrast?: {
    borderWidth: number
    borderColor: string
    backgroundColor: string
  }
}

export interface HotspotPerformance {
  // Rendering optimization hints
  preload: boolean          // Preload effects for instant response
  priority: 'high' | 'normal' | 'low'  // Rendering priority
  
  // Effect loading strategy
  effectLoading: 'eager' | 'lazy' | 'intersection'
  
  // Memory management
  unloadWhenHidden: boolean
}

// Effects become the content delivery system
export interface SlideEffect {
  id: string
  
  // Effect categorization
  category: 'content' | 'interaction' | 'navigation' | 'feedback'
  type: EffectType
  
  // Effect execution
  execution: EffectExecution
  
  // Content payload
  content: EffectContent
  
  // Presentation settings
  presentation: EffectPresentation
  
  // Performance settings
  performance: EffectPerformance
}

export type EffectType = 
  // Content effects (replace old element types)
  | 'text-display'      // Rich text content
  | 'image-display'     // Image galleries, single images
  | 'video-display'     // Video playback with controls
  | 'audio-playback'    // Audio with visualizations
  | 'shape-display'     // Vector graphics, illustrations
  | 'quiz-interaction'  // Interactive questions
  
  // Interaction effects (camera and feedback)
  | 'spotlight-focus'   // Highlight specific areas
  | 'pan-zoom-camera'   // Camera movement
  | 'tooltip-info'      // Quick information
  | 'modal-content'     // Full-screen overlays
  | 'notification'      // Toast/banner messages
  
  // Navigation effects
  | 'slide-transition'  // Navigate between slides
  | 'scroll-to'         // Scroll to specific content
  | 'external-link'     // Open external URLs
  
  // Feedback effects
  | 'haptic-feedback'   // Device vibration
  | 'sound-effect'      // UI sound feedback
  | 'visual-feedback'   // Visual confirmations

export interface EffectExecution {
  // When the effect triggers
  timing: 'immediate' | 'delayed' | 'queued' | 'conditional'
  delay?: number
  
  // Effect duration and lifecycle
  duration?: number | 'infinite' | 'user-controlled'
  
  // Repeat behavior
  repeat?: {
    count: number | 'infinite'
    interval: number
  }
  
  // Cleanup behavior
  cleanup: 'auto' | 'manual' | 'slide-exit'
  
  // Concurrent execution with other effects
  concurrency: 'exclusive' | 'parallel' | 'queued'
}

// Rich content system for effects
export interface EffectContent {
  // Content varies by effect type
  text?: RichTextContent
  media?: MediaContent
  shape?: ShapeContent
  quiz?: QuizContent
  interaction?: InteractionContent
}

export interface RichTextContent {
  // Rich text with full formatting
  content: string          // HTML or Markdown
  format: 'html' | 'markdown' | 'plain'
  
  // Typography overrides
  typography?: {
    fontSize?: string
    fontFamily?: string
    fontWeight?: string
    color?: string
    alignment?: 'left' | 'center' | 'right' | 'justify'
  }
  
  // Interactive text features
  interactive?: {
    selectable: boolean
    copyable: boolean
    linkable: boolean
  }
}

export interface MediaContent {
  // Unified media handling
  type: 'image' | 'video' | 'audio'
  
  // Source information
  source: MediaSource
  
  // Display settings
  display: MediaDisplay
  
  // Interactive features
  controls: MediaControls
}

export interface MediaSource {
  // Multiple source types for flexibility
  url?: string
  file?: File
  blob?: Blob
  base64?: string
  
  // Streaming sources
  youtube?: { videoId: string, startTime?: number, endTime?: number }
  vimeo?: { videoId: string, startTime?: number, endTime?: number }
  
  // Fallbacks and alternatives
  fallback?: string
  poster?: string  // For videos
  
  // Optimization settings
  quality?: 'auto' | 'low' | 'medium' | 'high' | 'original'
  compression?: number  // 0-100
}

export interface MediaDisplay {
  // Size and positioning
  sizing: 'contain' | 'cover' | 'fill' | 'original'
  position: 'center' | 'top' | 'bottom' | 'left' | 'right'
  
  // Visual enhancements
  filter?: {
    brightness?: number
    contrast?: number
    saturation?: number
    blur?: number
    sepia?: number
  }
  
  // Frame and borders
  frame?: {
    style: 'none' | 'simple' | 'shadow' | 'rounded' | 'custom'
    padding: number
    backgroundColor?: string
  }
}

export interface MediaControls {
  // Playback controls for video/audio
  autoplay: boolean
  loop: boolean
  muted: boolean
  volume: number
  
  // User control options
  showControls: boolean
  allowFullscreen: boolean
  allowDownload: boolean
  
  // Interaction behavior
  pauseOnBlur: boolean
  resumeOnFocus: boolean
}

export interface ShapeContent {
  // Vector shape definitions
  shape: ShapeDefinition
  
  // Styling
  style: ShapeStyle
  
  // Animation
  animation?: ShapeAnimation
}

export interface ShapeDefinition {
  type: 'rectangle' | 'circle' | 'triangle' | 'polygon' | 'path' | 'custom'
  
  // Geometric properties
  dimensions: {
    width: number
    height: number
  }
  
  // Shape-specific properties
  properties?: {
    // For polygons
    points?: Array<{ x: number, y: number }>
    
    // For paths
    pathData?: string
    
    // For circles
    radius?: number
    
    // For custom shapes
    customSVG?: string
  }
}

export interface ShapeStyle {
  // Fill and stroke
  fill?: {
    color: string
    opacity: number
    gradient?: GradientDefinition
  }
  
  stroke?: {
    color: string
    width: number
    style: 'solid' | 'dashed' | 'dotted'
    opacity: number
  }
  
  // Visual effects
  shadow?: {
    offsetX: number
    offsetY: number
    blur: number
    color: string
  }
  
  // Filters
  filter?: {
    blur?: number
    brightness?: number
    contrast?: number
  }
}

export interface GradientDefinition {
  type: 'linear' | 'radial'
  stops: Array<{
    offset: number
    color: string
    opacity?: number
  }>
  direction?: number  // For linear gradients (degrees)
  center?: { x: number, y: number }  // For radial gradients
}

export interface QuizContent {
  // Question and answers
  question: string
  questionFormat: 'text' | 'html' | 'markdown'
  
  // Question type determines answer format
  type: 'multiple-choice' | 'multiple-select' | 'true-false' | 'fill-blank' | 'essay' | 'matching'
  
  // Answer options (for choice-based questions)
  options?: QuizOption[]
  
  // Correct answers
  correctAnswers: string[]
  
  // Feedback system
  feedback: QuizFeedback
  
  // Scoring and attempts
  scoring: QuizScoring
}

export interface QuizOption {
  id: string
  text: string
  explanation?: string
  
  // Visual enhancements
  image?: string
  icon?: string
}

export interface QuizFeedback {
  // Immediate feedback
  correct: {
    message: string
    animation?: 'celebration' | 'checkmark' | 'glow' | 'custom'
  }
  
  incorrect: {
    message: string
    hint?: string
    animation?: 'shake' | 'flash' | 'fade' | 'custom'
  }
  
  // Partial credit feedback (for multiple-select)
  partial?: {
    message: string
    animation?: string
  }
}

export interface QuizScoring {
  // Point values
  pointsCorrect: number
  pointsIncorrect: number
  pointsPartial?: number
  
  // Attempt settings
  maxAttempts: number | 'unlimited'
  penaltyPerAttempt?: number
  
  // Time constraints
  timeLimit?: number  // seconds
  showTimer: boolean
  
  // Progression requirements
  requireCorrect: boolean
  minimumScore?: number
}

export interface InteractionContent {
  // Camera and viewport effects
  spotlight?: SpotlightDefinition
  panZoom?: PanZoomDefinition
  
  // Navigation effects
  navigation?: NavigationDefinition
  
  // Feedback effects
  feedback?: FeedbackDefinition
}

export interface SpotlightDefinition {
  // Target area to highlight
  target: SpotlightTarget
  
  // Visual properties
  visual: SpotlightVisual
  
  // Behavior
  behavior: SpotlightBehavior
}

export interface SpotlightTarget {
  // Target specification
  type: 'element' | 'area' | 'coordinate'
  
  // Target reference
  elementId?: string
  area?: { x: number, y: number, width: number, height: number }
  coordinate?: { x: number, y: number }
  
  // Target shape
  shape: 'circle' | 'rectangle' | 'custom'
  padding?: number  // Extra space around target
}

export interface SpotlightVisual {
  // Overlay properties
  overlay: {
    color: string
    opacity: number
    blur?: number
  }
  
  // Spotlight hole properties
  spotlight: {
    border?: {
      width: number
      color: string
      style: 'solid' | 'dashed' | 'animated'
    }
    glow?: {
      size: number
      color: string
      intensity: number
    }
  }
  
  // Animation
  animation?: {
    entrance: 'fade' | 'zoom' | 'slide'
    duration: number
    easing: string
  }
}

export interface SpotlightBehavior {
  // Interaction with spotlight
  allowClick: boolean
  closeOnClick: boolean
  closeOnOutsideClick: boolean
  
  // Multiple spotlights
  sequence?: Array<{
    target: SpotlightTarget
    duration?: number
    transition?: 'fade' | 'move' | 'morph'
  }>
}

export interface PanZoomDefinition {
  // Target camera position
  target: {
    x: number
    y: number
    zoom: number
  }
  
  // Animation properties
  animation: {
    duration: number
    easing: string
    curve?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'custom'
  }
  
  // Behavior after animation
  behavior: {
    returnToOriginal?: {
      delay: number
      duration: number
    }
    allowUserControl: boolean
    constrainToBounds: boolean
  }
}

// Effect presentation controls how effects appear
export interface EffectPresentation {
  // Display mode
  mode: 'inline' | 'overlay' | 'modal' | 'fullscreen' | 'sidebar' | 'tooltip'
  
  // Positioning (for overlay modes)
  position?: {
    anchor: 'hotspot' | 'center' | 'top' | 'bottom' | 'left' | 'right' | 'custom'
    offset?: { x: number, y: number }
    strategy: 'absolute' | 'fixed' | 'relative'
  }
  
  // Size constraints
  size?: {
    width?: number | 'auto' | 'fill' | 'content'
    height?: number | 'auto' | 'fill' | 'content'
    maxWidth?: number
    maxHeight?: number
    aspectRatio?: number
  }
  
  // Visual styling
  styling?: {
    background?: string
    border?: string
    borderRadius?: number
    shadow?: string
    backdrop?: 'blur' | 'darken' | 'none'
  }
  
  // Animation and transitions
  animation?: {
    entrance: 'fade' | 'slide' | 'zoom' | 'bounce' | 'custom'
    exit: 'fade' | 'slide' | 'zoom' | 'custom'
    duration: number
    easing: string
  }
  
  // User interaction
  interaction?: {
    dismissible: boolean
    dismissOnOutsideClick: boolean
    dismissOnEscape: boolean
    resizable: boolean
    draggable: boolean
  }
}

export interface EffectPerformance {
  // Loading strategy
  loading: 'eager' | 'lazy' | 'intersection' | 'hover'
  
  // Caching
  cache: {
    strategy: 'memory' | 'disk' | 'network' | 'hybrid'
    duration: number  // milliseconds
    maxSize?: number  // bytes
  }
  
  // Resource management
  resources: {
    preload: string[]  // URLs to preload
    priority: 'high' | 'normal' | 'low'
    timeout?: number   // Maximum load time
  }
  
  // Memory management
  memory: {
    unloadWhenHidden: boolean
    maxConcurrent?: number  // Maximum concurrent effects
    cleanupDelay?: number   // Delay before cleanup
  }
}
```

This represents a complete reimagining of the data architecture, where hotspots become the universal interaction mechanism and effects become the content delivery system. The complexity moves from element type management to rich effect configuration, providing much more flexibility while maintaining simplicity in the user interface.

## State Management Architecture

### Unified State Management with Zustand + React Query

The new architecture eliminates the complex useState patterns in favor of a clear separation of concerns:

```typescript
// src/stores/EditorStore.ts
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface EditorState {
  // Current editing context
  currentSlide: string | null
  selectedElements: string[]
  clipboardElements: SlideElement[]
  
  // Editor mode and tools
  mode: 'select' | 'hotspot-insert' | 'effect-edit' | 'preview'
  activeTool: string | null
  
  // Canvas state
  canvas: {
    zoom: number
    pan: { x: number, y: number }
    viewportSize: { width: number, height: number }
    devicePreview: 'desktop' | 'tablet' | 'mobile'
  }
  
  // UI state
  ui: {
    sidebarVisible: boolean
    propertiesPanelVisible: boolean
    timelineVisible: boolean
    
    // Modal states
    modals: {
      effectEditor: { open: boolean, effectId?: string }
      contentUploader: { open: boolean, type?: string }
      projectSettings: { open: boolean }
    }
  }
  
  // Undo/redo system
  history: {
    past: EditorSnapshot[]
    present: EditorSnapshot
    future: EditorSnapshot[]
    maxSize: number
  }
}

interface EditorActions {
  // Element management
  selectElement: (elementId: string, multiSelect?: boolean) => void
  deselectAll: () => void
  deleteSelected: () => void
  duplicateSelected: () => void
  
  // Hotspot operations  
  insertHotspot: (position: { x: number, y: number }) => void
  updateHotspot: (elementId: string, updates: Partial<SlideElement>) => void
  
  // Effect management
  addEffect: (elementId: string, effect: SlideEffect) => void
  updateEffect: (elementId: string, effectId: string, updates: Partial<SlideEffect>) => void
  removeEffect: (elementId: string, effectId: string) => void
  
  // Canvas operations
  setCanvasZoom: (zoom: number) => void
  setCanvasPan: (pan: { x: number, y: number }) => void
  setDevicePreview: (device: 'desktop' | 'tablet' | 'mobile') => void
  
  // History management
  saveSnapshot: () => void
  undo: () => void
  redo: () => void
  
  // UI operations
  toggleSidebar: () => void
  openModal: (modal: keyof EditorState['ui']['modals'], data?: any) => void
  closeModal: (modal: keyof EditorState['ui']['modals']) => void
}

export const useEditorStore = create<EditorState & EditorActions>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      currentSlide: null,
      selectedElements: [],
      clipboardElements: [],
      mode: 'select',
      activeTool: null,
      
      canvas: {
        zoom: 1,
        pan: { x: 0, y: 0 },
        viewportSize: { width: 1024, height: 768 },
        devicePreview: 'desktop'
      },
      
      ui: {
        sidebarVisible: true,
        propertiesPanelVisible: true,
        timelineVisible: false,
        modals: {
          effectEditor: { open: false },
          contentUploader: { open: false },
          projectSettings: { open: false }
        }
      },
      
      history: {
        past: [],
        present: { timestamp: Date.now(), state: {} },
        future: [],
        maxSize: 50
      },
      
      // Actions
      selectElement: (elementId, multiSelect = false) => set(draft => {
        if (multiSelect) {
          if (draft.selectedElements.includes(elementId)) {
            draft.selectedElements = draft.selectedElements.filter(id => id !== elementId)
          } else {
            draft.selectedElements.push(elementId)
          }
        } else {
          draft.selectedElements = [elementId]
        }
      }),
      
      deselectAll: () => set(draft => {
        draft.selectedElements = []
      }),
      
      insertHotspot: (position) => set(draft => {
        // Create new hotspot with default settings
        const newHotspot: SlideElement = {
          id: crypto.randomUUID(),
          type: 'hotspot',
          position: {
            desktop: { x: position.x, y: position.y, width: 40, height: 40 },
            tablet: { x: position.x, y: position.y, width: 44, height: 44 },
            mobile: { x: position.x, y: position.y, width: 48, height: 48 }
          },
          appearance: {
            style: {
              shape: 'circle',
              size: 'md',
              variant: 'primary'
            },
            animation: {
              type: 'pulse',
              duration: 2000,
              iteration: 'infinite',
              trigger: 'immediate'
            }
          },
          effects: [],
          behavior: {
            triggers: [{ type: 'tap' }],
            states: [{ id: 'default', name: 'Default', availableEffects: [], transitions: [] }],
            accessibility: { label: 'Interactive hotspot' },
            performance: { preload: false, priority: 'normal', effectLoading: 'lazy', unloadWhenHidden: false }
          },
          metadata: {
            created: Date.now(),
            modified: Date.now(),
            name: 'New Hotspot'
          }
        }
        
        // Add to current slide (this would integrate with React Query)
        draft.selectedElements = [newHotspot.id]
        draft.mode = 'select'
      }),
      
      setCanvasZoom: (zoom) => set(draft => {
        draft.canvas.zoom = Math.max(0.1, Math.min(5, zoom))
      }),
      
      saveSnapshot: () => set(draft => {
        const snapshot = {
          timestamp: Date.now(),
          state: { /* current editor state */ }
        }
        
        draft.history.past.push(draft.history.present)
        draft.history.present = snapshot
        draft.history.future = []
        
        // Limit history size
        if (draft.history.past.length > draft.history.maxSize) {
          draft.history.past = draft.history.past.slice(-draft.history.maxSize)
        }
      }),
      
      undo: () => set(draft => {
        if (draft.history.past.length > 0) {
          const previous = draft.history.past.pop()!
          draft.history.future.unshift(draft.history.present)
          draft.history.present = previous
          
          // Apply the previous state (would need proper state restoration)
        }
      }),
      
      redo: () => set(draft => {
        if (draft.history.future.length > 0) {
          const next = draft.history.future.shift()!
          draft.history.past.push(draft.history.present)
          draft.history.present = next
          
          // Apply the next state
        }
      })
    }))
  )
)

// Keyboard shortcuts integration
export const useEditorKeyboard = () => {
  const { undo, redo, deleteSelected, duplicateSelected } = useEditorStore()
  
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return // Don't interfere with text input
      }
      
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const cmdKey = isMac ? e.metaKey : e.ctrlKey
      
      if (cmdKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if (cmdKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        deleteSelected()
      } else if (cmdKey && e.key === 'd') {
        e.preventDefault()
        duplicateSelected()
      }
    }
    
    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [undo, redo, deleteSelected, duplicateSelected])
}
```

### React Query for Server State

```typescript
// src/queries/slideQueries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SlideAPI } from '../services/api'

// Slide data fetching
export const useSlide = (slideId: string) => {
  return useQuery({
    queryKey: ['slide', slideId],
    queryFn: () => SlideAPI.getSlide(slideId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
    
    // Optimistic updates for better UX
    select: (data) => ({
      ...data,
      elements: data.elements.map(element => ({
        ...element,
        // Add computed properties for editor
        bounds: calculateElementBounds(element),
        isSelected: useEditorStore.getState().selectedElements.includes(element.id)
      }))
    })
  })
}

// Slide updating with optimistic updates
export const useUpdateSlide = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ slideId, updates }: { slideId: string, updates: Partial<InteractiveSlide> }) =>
      SlideAPI.updateSlide(slideId, updates),
    
    // Optimistic update for instant UI feedback
    onMutate: async ({ slideId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['slide', slideId] })
      
      const previousSlide = queryClient.getQueryData(['slide', slideId])
      
      queryClient.setQueryData(['slide', slideId], (old: any) => ({
        ...old,
        ...updates,
        metadata: {
          ...old.metadata,
          modified: Date.now()
        }
      }))
      
      return { previousSlide }
    },
    
    // Rollback on error
    onError: (err, { slideId }, context) => {
      if (context?.previousSlide) {
        queryClient.setQueryData(['slide', slideId], context.previousSlide)
      }
    },
    
    // Ensure we have latest data
    onSettled: (data, error, { slideId }) => {
      queryClient.invalidateQueries({ queryKey: ['slide', slideId] })
    }
  })
}

// Real-time collaboration support
export const useSlideSubscription = (slideId: string) => {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    const unsubscribe = SlideAPI.subscribeToSlide(slideId, (update) => {
      queryClient.setQueryData(['slide', slideId], (old: any) => ({
        ...old,
        ...update,
        // Merge elements with conflict resolution
        elements: mergeElementsWithConflictResolution(old.elements, update.elements)
      }))
    })
    
    return unsubscribe
  }, [slideId, queryClient])
}

// Effect management
export const useAddEffect = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ elementId, effect }: { elementId: string, effect: SlideEffect }) =>
      SlideAPI.addEffect(elementId, effect),
    
    onMutate: async ({ elementId, effect }) => {
      const slideId = useEditorStore.getState().currentSlide
      if (!slideId) return
      
      await queryClient.cancelQueries({ queryKey: ['slide', slideId] })
      
      const previousSlide = queryClient.getQueryData(['slide', slideId])
      
      queryClient.setQueryData(['slide', slideId], (old: any) => ({
        ...old,
        elements: old.elements.map((element: SlideElement) =>
          element.id === elementId
            ? { ...element, effects: [...element.effects, effect] }
            : element
        )
      }))
      
      return { previousSlide }
    }
  })
}
```

### Component State Patterns

```typescript
// src/components/hotspot/HotspotEditor.tsx
import { memo, useMemo, useCallback } from 'react'
import { useEditorStore } from '../../stores/EditorStore'
import { useSlide, useUpdateSlide } from '../../queries/slideQueries'

interface HotspotEditorProps {
  elementId: string
}

export const HotspotEditor = memo<HotspotEditorProps>(({ elementId }) => {
  const currentSlide = useEditorStore(state => state.currentSlide)
  const { data: slide } = useSlide(currentSlide!)
  const updateSlide = useUpdateSlide()
  
  // Find the element efficiently
  const element = useMemo(() => 
    slide?.elements.find(el => el.id === elementId),
    [slide?.elements, elementId]
  )
  
  // Update handler with debouncing for performance
  const handleUpdate = useCallback(
    debounce((updates: Partial<SlideElement>) => {
      if (!currentSlide || !element) return
      
      const updatedElements = slide!.elements.map(el =>
        el.id === elementId ? { ...el, ...updates } : el
      )
      
      updateSlide.mutate({
        slideId: currentSlide,
        updates: { elements: updatedElements }
      })
    }, 300), // 300ms debounce
    [currentSlide, elementId, element, updateSlide, slide]
  )
  
  // Position update with device-specific handling
  const handlePositionUpdate = useCallback((device: DeviceType, position: PrecisePosition) => {
    handleUpdate({
      position: {
        ...element!.position,
        [device]: position
      }
    })
  }, [element, handleUpdate])
  
  // Appearance update
  const handleAppearanceUpdate = useCallback((appearance: Partial<HotspotAppearance>) => {
    handleUpdate({
      appearance: {
        ...element!.appearance,
        ...appearance
      }
    })
  }, [element, handleUpdate])
  
  if (!element) return null
  
  return (
    <div className="hotspot-editor">
      <PositionEditor 
        position={element.position}
        onUpdate={handlePositionUpdate}
      />
      <AppearanceEditor
        appearance={element.appearance}
        onUpdate={handleAppearanceUpdate}
      />
      <EffectEditor
        effects={element.effects}
        elementId={elementId}
      />
    </div>
  )
})
```

## Component API Specifications

### Primitive Components

```typescript
// src/components/primitives/Button.tsx
import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '../../utils/className'
import { DesignSystem } from '../../design/DesignSystem'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  children,
  ...props
}, ref) => {
  const baseClasses = cn(
    // Base styles
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    
    // Size variants
    {
      'h-6 px-2 text-xs': size === 'xs',
      'h-8 px-3 text-sm': size === 'sm', 
      'h-10 px-4 text-sm': size === 'md',
      'h-12 px-6 text-base': size === 'lg',
      'h-14 px-8 text-lg': size === 'xl',
    },
    
    // Color variants
    {
      'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500': variant === 'primary',
      'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500': variant === 'secondary',
      'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500': variant === 'ghost',
      'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-gray-500': variant === 'outline',
      'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500': variant === 'danger',
    },
    
    // Width
    {
      'w-full': fullWidth,
    },
    
    className
  )
  
  return (
    <button
      ref={ref}
      className={baseClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      
      {icon && iconPosition === 'left' && !loading && icon}
      
      {children}
      
      {icon && iconPosition === 'right' && !loading && icon}
    </button>
  )
})

Button.displayName = 'Button'
export { Button, type ButtonProps }
```

### Hotspot Component System

```typescript
// src/components/hotspot/HotspotRenderer.tsx
import { memo, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDeviceDetection } from '../../hooks/useDeviceDetection'
import { useEditorStore } from '../../stores/EditorStore'

interface HotspotRendererProps {
  element: SlideElement
  isSelected?: boolean
  isPreview?: boolean
  onTrigger?: (trigger: InteractionTrigger, element: SlideElement) => void
  onSelect?: (elementId: string, multiSelect: boolean) => void
}

export const HotspotRenderer = memo<HotspotRendererProps>(({
  element,
  isSelected = false,
  isPreview = false,
  onTrigger,
  onSelect
}) => {
  const deviceType = useDeviceDetection()
  const canvasZoom = useEditorStore(state => state.canvas.zoom)
  
  // Get device-specific position
  const position = useMemo(() => 
    element.position[deviceType],
    [element.position, deviceType]
  )
  
  // Calculate actual rendered position with zoom
  const renderedPosition = useMemo(() => ({
    x: position.x * canvasZoom,
    y: position.y * canvasZoom,
    width: position.width * canvasZoom,
    height: position.height * canvasZoom
  }), [position, canvasZoom])
  
  // Handle interaction triggers
  const handleInteraction = useCallback((trigger: InteractionTrigger) => {
    if (isPreview) {
      onTrigger?.(trigger, element)
    } else {
      // In editor mode, select the element
      onSelect?.(element.id, false)
    }
  }, [isPreview, onTrigger, onSelect, element])
  
  // Gesture handlers
  const handleTap = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    event.stopPropagation()
    
    const trigger = element.behavior.triggers.find(t => t.type === 'tap')
    if (trigger) {
      handleInteraction(trigger)
    }
  }, [element.behavior.triggers, handleInteraction])
  
  const handleLongPress = useCallback(() => {
    const trigger = element.behavior.triggers.find(t => t.type === 'long-press')
    if (trigger) {
      handleInteraction(trigger)
    }
  }, [element.behavior.triggers, handleInteraction])
  
  // Animation variants based on hotspot animation settings
  const animationVariants = useMemo(() => {
    const { animation } = element.appearance
    
    switch (animation.type) {
      case 'pulse':
        return {
          animate: {
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8],
            transition: {
              duration: animation.duration / 1000,
              repeat: animation.iteration === 'infinite' ? Infinity : animation.iteration,
              ease: 'easeInOut'
            }
          }
        }
      case 'glow':
        return {
          animate: {
            boxShadow: [
              '0 0 0 0 rgba(99, 102, 241, 0)',
              '0 0 0 10px rgba(99, 102, 241, 0.3)',
              '0 0 0 0 rgba(99, 102, 241, 0)'
            ],
            transition: {
              duration: animation.duration / 1000,
              repeat: animation.iteration === 'infinite' ? Infinity : animation.iteration
            }
          }
        }
      case 'bounce':
        return {
          animate: {
            y: [0, -10, 0],
            transition: {
              duration: animation.duration / 1000,
              repeat: animation.iteration === 'infinite' ? Infinity : animation.iteration,
              ease: 'easeOut'
            }
          }
        }
      default:
        return {}
    }
  }, [element.appearance.animation])
  
  // Style computation based on appearance settings
  const hotspotStyle = useMemo(() => {
    const { style } = element.appearance
    
    return {
      width: renderedPosition.width,
      height: renderedPosition.height,
      borderRadius: style.shape === 'circle' ? '50%' : 
                   style.shape === 'rounded-square' ? '8px' : '0px',
      backgroundColor: getVariantColor(style.variant),
      border: style.border ? `${style.border.width}px ${style.border.style} ${style.border.color}` : 'none',
      boxShadow: style.shadow ? getShadowStyle(style.shadow) : 'none',
      cursor: isPreview ? 'pointer' : 'grab',
      
      // Selection indicator in editor mode
      ...(isSelected && !isPreview && {
        outline: '2px solid #6366f1',
        outlineOffset: '2px'
      })
    }
  }, [renderedPosition, element.appearance.style, isSelected, isPreview])
  
  return (
    <motion.div
      className="absolute flex items-center justify-center"
      style={{
        left: renderedPosition.x,
        top: renderedPosition.y,
        ...hotspotStyle
      }}
      onClick={handleTap}
      onTouchStart={handleTap}
      {...animationVariants}
      
      // Accessibility
      role="button"
      tabIndex={0}
      aria-label={element.behavior.accessibility.label}
      aria-describedby={element.behavior.accessibility.description}
      
      // Long press handling
      onMouseDown={() => {
        const timeoutId = setTimeout(handleLongPress, 500)
        const cleanup = () => clearTimeout(timeoutId)
        
        window.addEventListener('mouseup', cleanup, { once: true })
        window.addEventListener('mouseleave', cleanup, { once: true })
      }}
    >
      {/* Icon or content inside hotspot */}
      {element.appearance.style.icon && (
        <div className="flex items-center justify-center w-full h-full">
          {typeof element.appearance.style.icon === 'string' ? (
            <img src={element.appearance.style.icon} alt="" className="w-1/2 h-1/2 object-contain" />
          ) : (
            element.appearance.style.icon
          )}
        </div>
      )}
      
      {/* Selection handles in editor mode */}
      <AnimatePresence>
        {isSelected && !isPreview && (
          <ResizeHandles
            position={renderedPosition}
            onResize={(newSize) => {
              // Handle resize logic
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
})

// Helper functions
const getVariantColor = (variant: string) => {
  switch (variant) {
    case 'primary': return '#6366f1'
    case 'secondary': return '#8b5cf6'
    case 'accent': return '#06b6d4'
    case 'neutral': return '#6b7280'
    case 'invisible': return 'transparent'
    default: return '#6366f1'
  }
}

const getShadowStyle = (shadow: any) => {
  const sizeMap = { sm: '0 1px 2px', md: '0 4px 6px', lg: '0 10px 15px' }
  return `${sizeMap[shadow.size]} ${shadow.color}${Math.round(shadow.opacity * 255).toString(16)}`
}
```

## Performance Optimization Strategies

### Rendering Performance

The hotspot-only architecture enables several critical performance optimizations:

```typescript
// src/hooks/useVirtualizedHotspots.ts
import { useMemo } from 'react'
import { useIntersectionObserver } from './useIntersectionObserver'

/**
 * Virtual scrolling for large numbers of hotspots
 * Only renders hotspots visible in viewport + buffer zone
 */
export const useVirtualizedHotspots = (
  elements: SlideElement[],
  canvasSize: { width: number, height: number },
  viewportSize: { width: number, height: number },
  zoom: number
) => {
  // Calculate visible region with buffer for smooth scrolling
  const visibleRegion = useMemo(() => {
    const buffer = 200 // 200px buffer outside viewport
    return {
      left: -buffer / zoom,
      top: -buffer / zoom,
      right: (viewportSize.width + buffer) / zoom,
      bottom: (viewportSize.height + buffer) / zoom
    }
  }, [viewportSize, zoom])
  
  // Filter to only visible hotspots
  const visibleElements = useMemo(() => {
    return elements.filter(element => {
      const pos = element.position.desktop // Use current device position
      return (
        pos.x < visibleRegion.right &&
        pos.x + pos.width > visibleRegion.left &&
        pos.y < visibleRegion.bottom &&
        pos.y + pos.height > visibleRegion.top
      )
    })
  }, [elements, visibleRegion])
  
  return {
    visibleElements,
    totalElements: elements.length,
    visibleCount: visibleElements.length
  }
}

// src/hooks/useIntersectionObserver.ts
export const useIntersectionObserver = (
  elementRef: RefObject<Element>,
  callback: (isIntersecting: boolean) => void,
  options: IntersectionObserverInit = {}
) => {
  useEffect(() => {
    const element = elementRef.current
    if (!element) return
    
    const observer = new IntersectionObserver(
      ([entry]) => callback(entry.isIntersecting),
      {
        rootMargin: '200px', // Start loading 200px before visible
        threshold: 0,
        ...options
      }
    )
    
    observer.observe(element)
    return () => observer.unobserve(element)
  }, [callback, options])
}
```

### Memory Management

```typescript
// src/utils/MemoryManager.ts
class MemoryManager {
  private static instance: MemoryManager
  private cache = new Map<string, CacheEntry>()
  private maxCacheSize = 50 * 1024 * 1024 // 50MB
  private currentCacheSize = 0
  
  static getInstance() {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager()
    }
    return MemoryManager.instance
  }
  
  // Intelligent caching for effects content
  cacheEffect(effectId: string, content: any, priority: 'high' | 'normal' | 'low' = 'normal') {
    const size = this.calculateSize(content)
    
    // Evict low priority items if needed
    if (this.currentCacheSize + size > this.maxCacheSize) {
      this.evictByPriority('low')
    }
    
    if (this.currentCacheSize + size > this.maxCacheSize) {
      this.evictByPriority('normal')
    }
    
    // Still too big? Evict by LRU
    if (this.currentCacheSize + size > this.maxCacheSize) {
      this.evictLRU(size)
    }
    
    this.cache.set(effectId, {
      content,
      size,
      priority,
      lastAccessed: Date.now(),
      accessCount: 0
    })
    
    this.currentCacheSize += size
  }
  
  getEffect(effectId: string) {
    const entry = this.cache.get(effectId)
    if (entry) {
      entry.lastAccessed = Date.now()
      entry.accessCount++
      return entry.content
    }
    return null
  }
  
  // Smart preloading based on user behavior
  preloadEffects(hotspotElement: SlideElement, userBehavior: UserBehaviorPattern) {
    const effects = hotspotElement.effects
    
    effects.forEach(effect => {
      // Calculate preload probability based on:
      // 1. Effect type popularity
      // 2. User's historical interaction patterns  
      // 3. Current context (device, time, etc.)
      const probability = this.calculatePreloadProbability(effect, userBehavior)
      
      if (probability > 0.7) {
        this.preloadEffect(effect, 'high')
      } else if (probability > 0.4) {
        this.preloadEffect(effect, 'normal')  
      }
    })
  }
  
  private calculatePreloadProbability(effect: SlideEffect, behavior: UserBehaviorPattern): number {
    let probability = 0.5 // Base probability
    
    // Boost for frequently used effect types
    if (behavior.favoriteEffectTypes.includes(effect.type)) {
      probability += 0.3
    }
    
    // Boost for content effects vs interaction effects
    if (['text-display', 'image-display', 'video-display'].includes(effect.type)) {
      probability += 0.2
    }
    
    // Reduce for large media files on slow connections
    if (effect.type === 'video-display' && navigator.connection?.effectiveType === 'slow-2g') {
      probability -= 0.4
    }
    
    return Math.max(0, Math.min(1, probability))
  }
  
  // Cleanup when component unmounts or slide changes
  cleanup(slideId: string) {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.startsWith(`${slideId}:`)
    )
    
    keysToDelete.forEach(key => {
      const entry = this.cache.get(key)
      if (entry) {
        this.currentCacheSize -= entry.size
        this.cache.delete(key)
      }
    })
  }
}

interface CacheEntry {
  content: any
  size: number
  priority: 'high' | 'normal' | 'low'
  lastAccessed: number
  accessCount: number
}

interface UserBehaviorPattern {
  favoriteEffectTypes: string[]
  averageInteractionDelay: number
  deviceCapabilities: DeviceCapabilities
  networkCondition: NetworkCondition
}
```

### Effect Loading Optimization

```typescript
// src/components/effects/EffectLoader.tsx
import { lazy, Suspense, memo } from 'react'
import { ErrorBoundary } from '../shared/ErrorBoundary'

// Lazy load effect components for code splitting
const TextEffect = lazy(() => import('./content/TextEffect'))
const ImageEffect = lazy(() => import('./content/ImageEffect'))
const VideoEffect = lazy(() => import('./content/VideoEffect'))
const AudioEffect = lazy(() => import('./content/AudioEffect'))
const QuizEffect = lazy(() => import('./content/QuizEffect'))

// Interaction effects
const SpotlightEffect = lazy(() => import('./interaction/SpotlightEffect'))
const PanZoomEffect = lazy(() => import('./interaction/PanZoomEffect'))

interface EffectLoaderProps {
  effect: SlideEffect
  isVisible: boolean
  onLoad?: () => void
  onError?: (error: Error) => void
}

export const EffectLoader = memo<EffectLoaderProps>(({
  effect,
  isVisible,
  onLoad,
  onError
}) => {
  // Smart loading strategy based on effect type and performance settings
  const loadingStrategy = getLoadingStrategy(effect)
  
  // Don't render if not visible and lazy loading
  if (!isVisible && loadingStrategy === 'lazy') {
    return null
  }
  
  const EffectComponent = getEffectComponent(effect.type)
  
  return (
    <ErrorBoundary onError={onError}>
      <Suspense 
        fallback={<EffectLoadingSkeleton type={effect.type} />}
      >
        <EffectComponent
          effect={effect}
          onLoad={onLoad}
          loadingStrategy={loadingStrategy}
        />
      </Suspense>
    </ErrorBoundary>
  )
})

const getEffectComponent = (type: string) => {
  switch (type) {
    case 'text-display': return TextEffect
    case 'image-display': return ImageEffect
    case 'video-display': return VideoEffect
    case 'audio-playback': return AudioEffect
    case 'quiz-interaction': return QuizEffect
    case 'spotlight-focus': return SpotlightEffect
    case 'pan-zoom-camera': return PanZoomEffect
    default: return () => <div>Unknown effect type</div>
  }
}

const getLoadingStrategy = (effect: SlideEffect): 'eager' | 'lazy' | 'intersection' => {
  // High priority effects load immediately
  if (effect.performance.priority === 'high') {
    return 'eager'
  }
  
  // Large video files use intersection loading
  if (effect.type === 'video-display') {
    return 'intersection'
  }
  
  // Default to lazy loading
  return effect.performance.loading as 'eager' | 'lazy' | 'intersection'
}
```

### Touch Performance Optimization

```typescript
// src/hooks/useOptimizedTouch.ts
import { useCallback, useRef, useMemo } from 'react'
import { throttle, debounce } from 'lodash'

export const useOptimizedTouch = (
  onTouchStart?: (event: TouchEvent) => void,
  onTouchMove?: (event: TouchEvent) => void,
  onTouchEnd?: (event: TouchEvent) => void
) => {
  const touchState = useRef({
    isActive: false,
    startPosition: { x: 0, y: 0 },
    lastPosition: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 }
  })
  
  // Throttle move events for performance
  const throttledMove = useMemo(
    () => throttle((event: TouchEvent) => {
      if (!touchState.current.isActive) return
      
      const touch = event.touches[0]
      const now = Date.now()
      const deltaTime = now - touchState.current.lastTime
      
      if (deltaTime > 0) {
        const deltaX = touch.clientX - touchState.current.lastPosition.x
        const deltaY = touch.clientY - touchState.current.lastPosition.y
        
        touchState.current.velocity = {
          x: deltaX / deltaTime,
          y: deltaY / deltaTime
        }
        
        touchState.current.lastPosition = {
          x: touch.clientX,
          y: touch.clientY
        }
        touchState.current.lastTime = now
      }
      
      onTouchMove?.(event)
    }, 16), // ~60fps
    [onTouchMove]
  )
  
  // Debounce end events to prevent multiple triggers
  const debouncedEnd = useMemo(
    () => debounce((event: TouchEvent) => {
      touchState.current.isActive = false
      onTouchEnd?.(event)
    }, 50),
    [onTouchEnd]
  )
  
  const handleTouchStart = useCallback((event: TouchEvent) => {
    const touch = event.touches[0]
    touchState.current = {
      isActive: true,
      startPosition: { x: touch.clientX, y: touch.clientY },
      lastPosition: { x: touch.clientX, y: touch.clientY },
      velocity: { x: 0, y: 0 },
      lastTime: Date.now()
    }
    
    onTouchStart?.(event)
  }, [onTouchStart])
  
  return {
    handleTouchStart,
    handleTouchMove: throttledMove,
    handleTouchEnd: debouncedEnd,
    getTouchState: () => touchState.current
  }
}
```

### Bundle Optimization Strategy

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import { splitVendorChunkPlugin } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Smart chunking strategy
        manualChunks: {
          // Framework chunks
          'react-vendor': ['react', 'react-dom'],
          'state-vendor': ['zustand', '@tanstack/react-query'],
          'animation-vendor': ['framer-motion'],
          
          // Feature-based chunks
          'editor-core': [
            './src/features/editor/EditorLayout',
            './src/features/editor/canvas/Canvas',
            './src/stores/EditorStore'
          ],
          'hotspot-system': [
            './src/components/hotspot/HotspotRenderer',
            './src/components/hotspot/HotspotEditor',
            './src/utils/hotspot-utils'
          ],
          'effect-content': [
            './src/components/effects/content/TextEffect',
            './src/components/effects/content/ImageEffect',
            './src/components/effects/content/VideoEffect'
          ],
          'effect-interaction': [
            './src/components/effects/interaction/SpotlightEffect',
            './src/components/effects/interaction/PanZoomEffect'
          ],
          'viewer-core': [
            './src/features/viewer/ViewerLayout',
            './src/components/SlideBasedViewer'
          ]
        }
      }
    },
    
    // Enable tree shaking
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'] // Remove specific logging
      }
    }
  },
  
  plugins: [
    splitVendorChunkPlugin(),
    
    // Bundle analyzer
    visualizer({
      filename: 'dist/bundle-analysis.html',
      open: false,
      gzipSize: true
    })
  ],
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'zustand',
      '@tanstack/react-query',
      'framer-motion'
    ],
    exclude: [
      // Large optional dependencies
      'firebase/analytics',
      'firebase/performance'
    ]
  }
})
```

### Real-time Performance Monitoring

```typescript
// src/utils/PerformanceMonitor.ts
class PerformanceMonitor {
  private metrics = new Map<string, PerformanceMetric>()
  private observers: PerformanceObserver[] = []
  
  constructor() {
    this.initializeObservers()
  }
  
  // Monitor specific operations
  measureOperation<T>(name: string, operation: () => T): T {
    const startTime = performance.now()
    
    try {
      const result = operation()
      const duration = performance.now() - startTime
      
      this.recordMetric(name, {
        duration,
        success: true,
        timestamp: Date.now()
      })
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      
      this.recordMetric(name, {
        duration,
        success: false,
        error: error.message,
        timestamp: Date.now()
      })
      
      throw error
    }
  }
  
  // Monitor component render times
  measureRender(componentName: string, renderCount: number) {
    this.recordMetric(`render:${componentName}`, {
      duration: 0, // Will be calculated by React DevTools
      renderCount,
      timestamp: Date.now()
    })
  }
  
  // Monitor memory usage
  getMemoryUsage() {
    if ('memory' in performance) {
      return {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize,
        limit: (performance as any).memory.jsHeapSizeLimit
      }
    }
    return null
  }
  
  // Monitor FPS
  private frameCount = 0
  private lastFPSCheck = Date.now()
  
  measureFPS() {
    this.frameCount++
    
    const now = Date.now()
    if (now - this.lastFPSCheck >= 1000) {
      const fps = this.frameCount
      this.frameCount = 0
      this.lastFPSCheck = now
      
      this.recordMetric('fps', {
        value: fps,
        timestamp: now
      })
      
      return fps
    }
    
    requestAnimationFrame(() => this.measureFPS())
  }
  
  // Get performance insights
  getInsights(): PerformanceInsights {
    const insights: PerformanceInsights = {
      slowOperations: [],
      memoryLeaks: [],
      renderBottlenecks: [],
      recommendations: []
    }
    
    // Analyze slow operations
    this.metrics.forEach((metric, name) => {
      if (metric.averageDuration > 100) { // > 100ms
        insights.slowOperations.push({
          name,
          averageDuration: metric.averageDuration,
          occurrences: metric.count
        })
      }
    })
    
    // Memory analysis
    const memoryUsage = this.getMemoryUsage()
    if (memoryUsage && memoryUsage.used > memoryUsage.limit * 0.8) {
      insights.memoryLeaks.push({
        currentUsage: memoryUsage.used,
        percentage: (memoryUsage.used / memoryUsage.limit) * 100
      })
    }
    
    return insights
  }
  
  private initializeObservers() {
    // Long task observer
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordMetric('long-task', {
            duration: entry.duration,
            timestamp: Date.now()
          })
        })
      })
      
      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] })
        this.observers.push(longTaskObserver)
      } catch (e) {
        // Long task API not supported
      }
    }
  }
  
  private recordMetric(name: string, data: any) {
    const existing = this.metrics.get(name)
    
    if (existing) {
      existing.count++
      existing.totalDuration += data.duration || 0
      existing.averageDuration = existing.totalDuration / existing.count
      existing.lastRecorded = data.timestamp
    } else {
      this.metrics.set(name, {
        count: 1,
        totalDuration: data.duration || 0,
        averageDuration: data.duration || 0,
        lastRecorded: data.timestamp,
        ...data
      })
    }
  }
}

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const monitor = useMemo(() => new PerformanceMonitor(), [])
  
  useEffect(() => {
    // Start FPS monitoring
    monitor.measureFPS()
    
    return () => {
      // Cleanup
    }
  }, [monitor])
  
  return {
    measureOperation: monitor.measureOperation.bind(monitor),
    measureRender: monitor.measureRender.bind(monitor),
    getInsights: monitor.getInsights.bind(monitor),
    getMemoryUsage: monitor.getMemoryUsage.bind(monitor)
  }
}

interface PerformanceMetric {
  count: number
  totalDuration: number
  averageDuration: number
  lastRecorded: number
  success?: boolean
  error?: string
}

interface PerformanceInsights {
  slowOperations: Array<{ name: string, averageDuration: number, occurrences: number }>
  memoryLeaks: Array<{ currentUsage: number, percentage: number }>
  renderBottlenecks: Array<{ component: string, renderTime: number }>
  recommendations: string[]
}
```

This comprehensive technical deep dive shows how the hotspot-only architecture enables significant performance optimizations while maintaining the rich functionality users expect. The combination of intelligent caching, virtualization, code splitting, and real-time monitoring creates a foundation for exceptional performance at scale.