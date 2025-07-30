/**
 * Shared Base Properties Panel Interface
 * 
 * Unified interface for both desktop and mobile properties panels.
 * Provides a consistent API while allowing for device-specific implementations.
 */

import { SlideElement, DeviceType, InteractiveSlide } from '../../../shared/slideTypes';

/**
 * Base properties that all property panels must support
 */
export interface BasePropertiesPanelProps {
  /** Currently selected element to edit */
  selectedElement: SlideElement | null;
  
  /** Current device type for responsive positioning */
  deviceType: DeviceType;
  
  /** Callback to update element properties */
  onElementUpdate: (elementId: string, updates: Partial<SlideElement>) => void;
  
  /** Callback to delete the current element (optional for desktop versions) */
  onDelete?: () => void;
  
  /** Callback to close the properties panel (optional for desktop versions) */
  onClose?: () => void;
}

/**
 * Extended properties for desktop/full-featured implementations
 */
export interface ExtendedPropertiesPanelProps extends BasePropertiesPanelProps {
  /** Current slide context for background and slide-level operations */
  currentSlide: InteractiveSlide | null;
  
  /** Callback to update slide-level properties */
  onSlideUpdate: (slideUpdates: Partial<InteractiveSlide>) => void;
  
  /** Whether panel is running in mobile mode (for responsive behavior) */
  isMobile?: boolean;
}

/**
 * Mobile-specific properties for mobile implementations
 */
export interface MobilePropertiesPanelProps extends BasePropertiesPanelProps {
  /** Callback to delete the current element (required for mobile) */
  onDelete: () => void;
  
  /** Callback to close the properties panel (required for mobile) */
  onClose: () => void;
}

/**
 * Desktop-specific properties for desktop implementations
 */
export interface DesktopPropertiesPanelProps extends ExtendedPropertiesPanelProps {
  /** Additional desktop-specific props can be added here if needed */
}

/**
 * Unified properties panel configuration
 */
export interface UnifiedPropertiesPanelProps extends ExtendedPropertiesPanelProps {
  /** Render mode for the properties panel */
  mode: 'mobile' | 'desktop' | 'auto';
  
  /** Override mobile detection for testing/forced modes */
  forceMobile?: boolean;
  
  /** Additional styling classes */
  className?: string;
  
  /** Custom styles */
  style?: React.CSSProperties;
}

/**
 * Common collapsible section interface used by both implementations
 */
export interface CollapsibleSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  /** Icon to display next to title */
  icon?: React.ReactNode;
  /** Whether section can be collapsed */
  collapsible?: boolean;
}

/**
 * Properties panel section state
 */
export interface PropertiesPanelSections {
  properties: boolean;
  style: boolean;
  content: boolean;
  position: boolean;
  interactions: boolean;
  background?: boolean; // Desktop-only slide background section
}

/**
 * Element editing state shared between implementations
 */
export interface ElementEditingState {
  /** Currently selected interaction for editing */
  selectedInteractionId: string | null;
  
  /** Currently open sections */
  openSections: PropertiesPanelSections;
  
  /** Whether panel is in edit mode */
  isEditing: boolean;
}

/**
 * Utility type for panel-specific props
 */
export type PanelSpecificProps<T extends 'mobile' | 'desktop' | 'unified'> = 
  T extends 'mobile' ? MobilePropertiesPanelProps :
  T extends 'desktop' ? DesktopPropertiesPanelProps :
  T extends 'unified' ? UnifiedPropertiesPanelProps :
  never;

/**
 * Type guard to check if props include slide operations
 */
export function hasSlideOperations(
  props: BasePropertiesPanelProps
): props is ExtendedPropertiesPanelProps {
  return 'currentSlide' in props && 'onSlideUpdate' in props;
}

/**
 * Default section state for different element types
 */
export const getDefaultSections = (elementType?: string): PropertiesPanelSections => ({
  properties: elementType === 'hotspot',
  style: elementType !== 'hotspot',
  content: false,
  position: false,
  interactions: false,
  background: false,
});

/**
 * Responsive breakpoints for properties panel behavior
 */
export const PROPERTIES_PANEL_BREAKPOINTS = {
  /** Switch to mobile mode below this width */
  MOBILE_THRESHOLD: 768,
  
  /** Compact mode threshold */
  COMPACT_THRESHOLD: 1024,
  
  /** Full desktop mode above this width */
  DESKTOP_THRESHOLD: 1280,
} as const;

/**
 * Common animation durations for panel transitions
 */
export const PANEL_ANIMATIONS = {
  /** Panel slide in/out duration */
  SLIDE_DURATION: 300,
  
  /** Section expand/collapse duration */
  SECTION_DURATION: 200,
  
  /** Element selection feedback duration */
  SELECTION_DURATION: 150,
} as const;