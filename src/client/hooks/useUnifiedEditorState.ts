/**
 * Unified Editor State Hook
 * 
 * Consolidates the complex state management from SlideBasedEditor into organized,
 * cohesive state objects. Uses mobile-first patterns as foundation while supporting
 * desktop enhancements.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { DeviceType } from '../../shared/slideTypes';
import { useIsMobile } from './useIsMobile';
import { useDeviceDetection } from './useDeviceDetection';

/**
 * Navigation and slide management state
 */
export interface NavigationState {
  currentSlideIndex: number;
  isPreviewMode: boolean;
  isSlidePanelCollapsed: boolean;
  deviceTypeOverride: DeviceType | null;
}

/**
 * Element selection and editing state
 */
export interface ElementEditingState {
  selectedElementId: string | null;
  isDragging: boolean;
  isTransforming: boolean;
}

/**
 * UI visibility and modal state
 */
export interface UIVisibilityState {
  // Modal states
  slidesModal: boolean;
  backgroundModal: boolean;
  insertModal: boolean;
  aspectRatioModal: boolean;
  shareModal: boolean;
  settingsModal: boolean;
  propertiesPanel: boolean;
  
  // UI elements
  showMobileHint: boolean;
  showSuccessMessage: boolean;
  activeDropdownId: string | null;
}

/**
 * Application operation state
 */
export interface OperationState {
  isSaving: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Consolidated editor state
 */
export interface UnifiedEditorState {
  navigation: NavigationState;
  editing: ElementEditingState;
  ui: UIVisibilityState;
  operations: OperationState;
}

/**
 * State update actions
 */
export interface EditorStateActions {
  // Navigation actions
  setCurrentSlide: (index: number) => void;
  togglePreviewMode: () => void;
  toggleSlidePanelCollapse: () => void;
  setDeviceTypeOverride: (deviceType: DeviceType | null) => void;
  
  // Element editing actions
  selectElement: (elementId: string | null) => void;
  setDragging: (isDragging: boolean) => void;
  setTransforming: (isTransforming: boolean) => void;
  
  // UI visibility actions
  openModal: (modalType: keyof Omit<UIVisibilityState, 'showMobileHint' | 'showSuccessMessage' | 'activeDropdownId'>) => void;
  closeModal: (modalType: keyof Omit<UIVisibilityState, 'showMobileHint' | 'showSuccessMessage' | 'activeDropdownId'>) => void;
  closeAllModals: () => void;
  setActiveDropdown: (dropdownId: string | null) => void;
  dismissMobileHint: () => void;
  showSuccessMessage: () => void;
  hideSuccessMessage: () => void;
  
  // Operation actions
  setSaving: (isSaving: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Composite actions
  resetEditorState: () => void;
  enterEditMode: (elementId: string) => void;
  exitEditMode: () => void;
}

/**
 * Hook return type
 */
export interface UseUnifiedEditorStateReturn {
  state: UnifiedEditorState;
  actions: EditorStateActions;
  computed: {
    isMobile: boolean;
    deviceType: DeviceType;
    effectiveDeviceType: DeviceType;
    isLandscape: boolean;
    hasActiveModal: boolean;
    canEdit: boolean;
  };
}

/**
 * Default state values
 */
const createDefaultNavigationState = (): NavigationState => ({
  currentSlideIndex: 0,
  isPreviewMode: false,
  isSlidePanelCollapsed: false,
  deviceTypeOverride: null,
});

const createDefaultElementEditingState = (): ElementEditingState => ({
  selectedElementId: null,
  isDragging: false,
  isTransforming: false,
});

const createDefaultUIVisibilityState = (): UIVisibilityState => ({
  slidesModal: false,
  backgroundModal: false,
  insertModal: false,
  aspectRatioModal: false,
  shareModal: false,
  settingsModal: false,
  propertiesPanel: false,
  showMobileHint: true,
  showSuccessMessage: false,
  activeDropdownId: null,
});

const createDefaultOperationState = (): OperationState => ({
  isSaving: false,
  isLoading: false,
  error: null,
});

/**
 * Unified Editor State Hook
 * 
 * Consolidates all editor state management into organized, cohesive objects
 * with actions and computed values.
 */
export const useUnifiedEditorState = (): UseUnifiedEditorStateReturn => {
  // Device detection
  const isMobile = useIsMobile();
  const { deviceType } = useDeviceDetection();
  
  // Core state objects
  const [navigation, setNavigation] = useState<NavigationState>(createDefaultNavigationState);
  const [editing, setEditing] = useState<ElementEditingState>(createDefaultElementEditingState);
  const [ui, setUI] = useState<UIVisibilityState>(createDefaultUIVisibilityState);
  const [operations, setOperations] = useState<OperationState>(createDefaultOperationState);
  
  // Computed values
  const computed = useMemo(() => {
    const effectiveDeviceType = navigation.deviceTypeOverride || deviceType;
    const isLandscape = window.innerWidth > window.innerHeight;
    const hasActiveModal = Object.values(ui).some((value, index, arr) => {
      // Check only boolean modal states, skip string/null values
      return typeof value === 'boolean' && value && index < 7; // First 7 are modal states
    });
    const canEdit = !navigation.isPreviewMode && !operations.isSaving && !hasActiveModal;
    
    return {
      isMobile,
      deviceType,
      effectiveDeviceType,
      isLandscape,
      hasActiveModal,
      canEdit,
    };
  }, [isMobile, deviceType, navigation.deviceTypeOverride, navigation.isPreviewMode, operations.isSaving, ui]);
  
  // Navigation actions
  const setCurrentSlide = useCallback((index: number) => {
    setNavigation(prev => ({ ...prev, currentSlideIndex: index }));
    // Clear element selection when changing slides
    setEditing(prev => ({ ...prev, selectedElementId: null }));
  }, []);
  
  const togglePreviewMode = useCallback(() => {
    setNavigation(prev => ({ ...prev, isPreviewMode: !prev.isPreviewMode }));
    // Clear element selection when entering preview mode
    setEditing(prev => ({ ...prev, selectedElementId: null }));
  }, []);
  
  const toggleSlidePanelCollapse = useCallback(() => {
    setNavigation(prev => ({ ...prev, isSlidePanelCollapsed: !prev.isSlidePanelCollapsed }));
  }, []);
  
  const setDeviceTypeOverride = useCallback((deviceType: DeviceType | null) => {
    setNavigation(prev => ({ ...prev, deviceTypeOverride: deviceType }));
  }, []);
  
  // Element editing actions
  const selectElement = useCallback((elementId: string | null) => {
    setEditing(prev => ({ ...prev, selectedElementId: elementId }));
  }, []);
  
  const setDragging = useCallback((isDragging: boolean) => {
    setEditing(prev => ({ ...prev, isDragging }));
  }, []);
  
  const setTransforming = useCallback((isTransforming: boolean) => {
    setEditing(prev => ({ ...prev, isTransforming }));
  }, []);
  
  // UI visibility actions
  const openModal = useCallback((modalType: keyof Omit<UIVisibilityState, 'showMobileHint' | 'showSuccessMessage' | 'activeDropdownId'>) => {
    setUI(prev => ({ 
      ...prev, 
      [modalType]: true,
      // Close other modals when opening a new one
      slidesModal: modalType === 'slidesModal' ? true : false,
      backgroundModal: modalType === 'backgroundModal' ? true : false,
      insertModal: modalType === 'insertModal' ? true : false,
      aspectRatioModal: modalType === 'aspectRatioModal' ? true : false,
      shareModal: modalType === 'shareModal' ? true : false,
      settingsModal: modalType === 'settingsModal' ? true : false,
      propertiesPanel: modalType === 'propertiesPanel' ? true : prev.propertiesPanel,
    }));
  }, []);
  
  const closeModal = useCallback((modalType: keyof Omit<UIVisibilityState, 'showMobileHint' | 'showSuccessMessage' | 'activeDropdownId'>) => {
    setUI(prev => ({ ...prev, [modalType]: false }));
  }, []);
  
  const closeAllModals = useCallback(() => {
    setUI(prev => ({
      ...prev,
      slidesModal: false,
      backgroundModal: false,
      insertModal: false,
      aspectRatioModal: false,
      shareModal: false,
      settingsModal: false,
      propertiesPanel: false,
    }));
  }, []);
  
  const setActiveDropdown = useCallback((dropdownId: string | null) => {
    setUI(prev => ({ ...prev, activeDropdownId: dropdownId }));
  }, []);
  
  const dismissMobileHint = useCallback(() => {
    setUI(prev => ({ ...prev, showMobileHint: false }));
  }, []);
  
  const showSuccessMessage = useCallback(() => {
    setUI(prev => ({ ...prev, showSuccessMessage: true }));
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setUI(prev => ({ ...prev, showSuccessMessage: false }));
    }, 3000);
  }, []);
  
  const hideSuccessMessage = useCallback(() => {
    setUI(prev => ({ ...prev, showSuccessMessage: false }));
  }, []);
  
  // Operation actions
  const setSaving = useCallback((isSaving: boolean) => {
    setOperations(prev => ({ ...prev, isSaving }));
  }, []);
  
  const setLoading = useCallback((isLoading: boolean) => {
    setOperations(prev => ({ ...prev, isLoading }));
  }, []);
  
  const setError = useCallback((error: string | null) => {
    setOperations(prev => ({ ...prev, error }));
  }, []);
  
  // Composite actions
  const resetEditorState = useCallback(() => {
    setNavigation(createDefaultNavigationState());
    setEditing(createDefaultElementEditingState());
    setUI(createDefaultUIVisibilityState());
    setOperations(createDefaultOperationState());
  }, []);
  
  const enterEditMode = useCallback((elementId: string) => {
    setEditing(prev => ({ 
      ...prev, 
      selectedElementId: elementId,
      isDragging: false,
      isTransforming: false 
    }));
    setNavigation(prev => ({ ...prev, isPreviewMode: false }));
    
    // Open properties panel if on desktop
    if (!isMobile) {
      setUI(prev => ({ ...prev, propertiesPanel: true }));
    }
  }, [isMobile]);
  
  const exitEditMode = useCallback(() => {
    setEditing(prev => ({ 
      ...prev, 
      selectedElementId: null,
      isDragging: false,
      isTransforming: false 
    }));
    
    // Close properties panel
    setUI(prev => ({ ...prev, propertiesPanel: false }));
  }, []);
  
  // Auto-dismiss mobile hint after 5 seconds
  React.useEffect(() => {
    if (isMobile && ui.showMobileHint) {
      const timer = setTimeout(() => {
        dismissMobileHint();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isMobile, ui.showMobileHint, dismissMobileHint]);
  
  return {
    state: {
      navigation,
      editing,
      ui,
      operations,
    },
    actions: {
      setCurrentSlide,
      togglePreviewMode,
      toggleSlidePanelCollapse,
      setDeviceTypeOverride,
      selectElement,
      setDragging,
      setTransforming,
      openModal,
      closeModal,
      closeAllModals,
      setActiveDropdown,
      dismissMobileHint,
      showSuccessMessage,
      hideSuccessMessage,
      setSaving,
      setLoading,
      setError,
      resetEditorState,
      enterEditMode,
      exitEditMode,
    },
    computed,
  };
};

export default useUnifiedEditorState;