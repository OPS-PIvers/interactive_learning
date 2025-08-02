export { TouchContainer } from './TouchContainer';
export { ViewportManager, MobileViewportManager } from './ViewportManager';

// Re-export main types
export type {
  TouchPoint,
  TouchGestureState,
  TouchContainerProps
} from './TouchContainer';

export type {
  ViewportState,
  ViewportConfig,
  ViewportManagerProps,
  // Maintain backward compatibility
  ViewportConfig as MobileViewportConfig,
  ViewportManagerProps as MobileViewportManagerProps
} from './ViewportManager';