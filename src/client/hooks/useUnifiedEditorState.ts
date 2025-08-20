/**
 * Unified Editor State Hook
 * 
 * Consolidates the complex state management from SlideBasedEditor into organized,
 * cohesive state objects. Uses mobile-first patterns as foundation while supporting
 * desktop enhancements.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { DeviceType } from '../../shared/slideTypes';
import { useDeviceDetection } from './useDeviceDetection';

/**
 * Navigation and slide management state
 */
export interface NavigationState {
  currentSlideIndex: number;
  isPreviewMode: boolean;
  isSlidePanelCollapsed: boolean;
  deviceTypeOverride: DeviceType | undefined;
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
 * Hotspot editor modal state
 */
export interface HotspotEditorState {
  isOpen: boolean;
  selectedHotspotId: string | null;
}

/**
 * Interaction settings modal state
 */
export interface InteractionEditorState {
  isOpen: boolean;
  editingEventId: string | null;
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
  hotspotEditorModal: boolean;
  interactionEditor: boolean;
  
  // UI elements
  showHelpHint: boolean;
  showSuccessMessage: boolean;
  activeDropdownId: string | null;
  isMobilePropertiesPanelOpen: boolean;
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
  hotspotEditor: HotspotEditorState;
  interactionEditor: InteractionEditorState;
}

/**
 * State update actions
 */
export interface EditorStateActions {
  // Navigation actions
  setCurrentSlide: (index: number) => void;
  togglePreviewMode: () => void;
  toggleSlidePanelCollapse: () => void;
  setDeviceTypeOverride: (deviceType: DeviceType | undefined) => void;
  
  // Element editing actions
  selectElement: (elementId: string | null) => void;
  setDragging: (isDragging: boolean) => void;
  setTransforming: (isTransforming: boolean) => void;
  
  // Hotspot editor actions
  openHotspotEditor: (hotspotId: string) => void;
  closeHotspotEditor: () => void;
  
  // Interaction editor actions
  openInteractionEditor: (eventId: string) => void;
  closeInteractionEditor: () => void;

  // UI visibility actions
  openModal: (modalType: keyof Omit<UIVisibilityState, 'showHelpHint' | 'showSuccessMessage' | 'activeDropdownId'>) => void;
  closeModal: (modalType: keyof Omit<UIVisibilityState, 'showHelpHint' | 'showSuccessMessage' | 'activeDropdownId'>) => void;
  closeAllModals: () => void;
  setActiveDropdown: (dropdownId: string | null) => void;
  dismissHelpHint: () => void;
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
  toggleMobilePropertiesPanel: () => void;
}

/**
 * Hook return type
 */
export interface UseUnifiedEditorStateReturn {
  state: UnifiedEditorState;
  actions: EditorStateActions;
  computed: {
    hasActiveModal: boolean;
    canEdit: boolean;
    effectiveDeviceType: DeviceType;
  };
}

/**
 * Default state values
 */
const createDefaultNavigationState = (): NavigationState => ({
  currentSlideIndex: 0,
  isPreviewMode: false,
  isSlidePanelCollapsed: false,
  deviceTypeOverride: undefined,
});

const createDefaultElementEditingState = (): ElementEditingState => ({
  selectedElementId: null,
  isDragging: false,
  isTransforming: false,
});

const createDefaultHotspotEditorState = (): HotspotEditorState => ({
  isOpen: false,
  selectedHotspotId: null,
});

const createDefaultInteractionEditorState = (): InteractionEditorState => ({
  isOpen: false,
  editingEventId: null,
});

const createDefaultUIVisibilityState = (): UIVisibilityState => ({
  slidesModal: false,
  backgroundModal: false,
  insertModal: false,
  aspectRatioModal: false,
  shareModal: false,
  settingsModal: false,
  propertiesPanel: false,
  hotspotEditorModal: false,
  interactionEditor: false,
  showHelpHint: true,
  showSuccessMessage: false,
  activeDropdownId: null,
  isMobilePropertiesPanelOpen: false,
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
  // Core state objects
  const [navigation, setNavigation] = useState<NavigationState>(createDefaultNavigationState);
  const [editing, setEditing] = useState<ElementEditingState>(createDefaultElementEditingState);
  const [ui, setUI] = useState<UIVisibilityState>(createDefaultUIVisibilityState);
  const [operations, setOperations] = useState<OperationState>(createDefaultOperationState);
  const [hotspotEditor, setHotspotEditor] = useState<HotspotEditorState>(createDefaultHotspotEditorState);
  const [interactionEditor, setInteractionEditor] = useState<InteractionEditorState>(createDefaultInteractionEditorState);
  const { viewportInfo } = useDeviceDetection();
  const deviceType = viewportInfo.width < 768 ? 'mobile' : viewportInfo.width < 1024 ? 'tablet' : 'desktop';
  
  // Computed values (device-agnostic)
  const computed = useMemo(() => {
    const hasActiveModal = Object.values(ui).some((value, index, arr) => {
      // Check only boolean modal states, skip string/null values
      return typeof value === 'boolean' && value && index < 8; // First 8 are modal states
    }) || hotspotEditor.isOpen || interactionEditor.isOpen;
    const canEdit = !navigation.isPreviewMode && !operations.isSaving && !hasActiveModal;
    const effectiveDeviceType = navigation.deviceTypeOverride || deviceType;
    
    return {
      hasActiveModal,
      canEdit,
      effectiveDeviceType,
    };
  }, [navigation.isPreviewMode, navigation.deviceTypeOverride, deviceType, operations.isSaving, ui, hotspotEditor.isOpen, interactionEditor.isOpen]);
  
  // Navigation actions
  const setCurrentSlide = useCallback((index: number) => {
    setNavigation(prev => ({ ...prev, currentSlideIndex: index }));
    // Clear element selection when changing slides
    setEditing(prev => ({ ...prev, selectedElementId: null }));
    // Close hotspot editor when changing slides
    setHotspotEditor(prev => ({ ...prev, isOpen: false, selectedHotspotId: null }));
  }, []);
  
  const togglePreviewMode = useCallback(() => {
    setNavigation(prev => ({ ...prev, isPreviewMode: !prev.isPreviewMode }));
    // Clear element selection when entering preview mode
    setEditing(prev => ({ ...prev, selectedElementId: null }));
    // Close hotspot editor in preview mode
    setHotspotEditor(prev => ({ ...prev, isOpen: false, selectedHotspotId: null }));
  }, []);
  
  const toggleSlidePanelCollapse = useCallback(() => {
    setNavigation(prev => ({ ...prev, isSlidePanelCollapsed: !prev.isSlidePanelCollapsed }));
  }, []);
  
  const setDeviceTypeOverride = useCallback((deviceType: DeviceType | undefined) => {
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
  
  // Hotspot editor actions
  const openHotspotEditor = useCallback((hotspotId: string) => {
    setHotspotEditor(prev => ({ ...prev, isOpen: true, selectedHotspotId: hotspotId }));
    // Close other modals when opening hotspot editor
    setUI(prev => ({
      ...prev,
      slidesModal: false,
      backgroundModal: false,
      insertModal: false,
      aspectRatioModal: false,
      shareModal: false,
      settingsModal: false,
      propertiesPanel: false,
      hotspotEditorModal: true,
    }));
  }, []);
  
  const closeHotspotEditor = useCallback(() => {
    setHotspotEditor(prev => ({ ...prev, isOpen: false, selectedHotspotId: null }));
    setUI(prev => ({ ...prev, hotspotEditorModal: false }));
  }, []);
  

  // Interaction editor actions
  const openInteractionEditor = useCallback((eventId: string) => {
    setInteractionEditor({ isOpen: true, editingEventId: eventId });
    setUI(prev => ({
      ...prev,
      slidesModal: false,
      backgroundModal: false,
      insertModal: false,
      aspectRatioModal: false,
      shareModal: false,
      settingsModal: false,
      propertiesPanel: false,
      hotspotEditorModal: false,
      interactionEditor: true,
    }));
  }, []);

  const closeInteractionEditor = useCallback(() => {
    setInteractionEditor({ isOpen: false, editingEventId: null });
    setUI(prev => ({ ...prev, interactionEditor: false }));
  }, []);
  
  // UI visibility actions
  const openModal = useCallback((modalType: keyof Omit<UIVisibilityState, 'showHelpHint' | 'showSuccessMessage' | 'activeDropdownId'>) => {
    // Close hotspot editor when opening other modals
    if (modalType !== 'hotspotEditorModal') {
      setHotspotEditor(prev => ({ ...prev, isOpen: false, selectedHotspotId: null }));
    }
    
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
      hotspotEditorModal: modalType === 'hotspotEditorModal' ? true : false,
    }));
  }, []);
  
  const closeModal = useCallback((modalType: keyof Omit<UIVisibilityState, 'showHelpHint' | 'showSuccessMessage' | 'activeDropdownId'>) => {
    setUI(prev => ({ ...prev, [modalType]: false }));
    
    // Close hotspot editor if closing the hotspot editor modal
    if (modalType === 'hotspotEditorModal') {
      setHotspotEditor(prev => ({ ...prev, isOpen: false, selectedHotspotId: null }));
    }
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
      hotspotEditorModal: false,
    }));
    
    // Close hotspot editor too
    setHotspotEditor(prev => ({ ...prev, isOpen: false, selectedHotspotId: null }));
    // Close interaction editor too
    setInteractionEditor({ isOpen: false, editingEventId: null });
  }, []);
  
  const setActiveDropdown = useCallback((dropdownId: string | null) => {
    setUI(prev => ({ ...prev, activeDropdownId: dropdownId }));
  }, []);
  
  const dismissHelpHint = useCallback(() => {
    setUI(prev => ({ ...prev, showHelpHint: false }));
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
    setHotspotEditor(createDefaultHotspotEditorState());
    setInteractionEditor(createDefaultInteractionEditorState());
  }, []);
  
  const enterEditMode = useCallback((elementId: string) => {
    setEditing(prev => ({ 
      ...prev, 
      selectedElementId: elementId,
      isDragging: false,
      isTransforming: false 
    }));
    setNavigation(prev => ({ ...prev, isPreviewMode: false }));
    
    // Open properties panel, its visibility will be controlled by CSS
    setUI(prev => ({ ...prev, propertiesPanel: true }));
  }, []);
  
  const exitEditMode = useCallback(() => {
    setEditing(prev => ({ 
      ...prev, 
      selectedElementId: null,
      isDragging: false,
      isTransforming: false 
    }));
    
    // Close properties panel
    setUI(prev => ({ ...prev, propertiesPanel: false, isMobilePropertiesPanelOpen: false }));
  }, []);

  const toggleMobilePropertiesPanel = useCallback(() => {
    setUI(prev => ({ ...prev, isMobilePropertiesPanelOpen: !prev.isMobilePropertiesPanelOpen }));
  }, []);
  
  // Auto-dismiss help hint after 5 seconds
  React.useEffect(() => {
    if (ui.showHelpHint) {
      const timer = setTimeout(() => {
        dismissHelpHint();
      }, 5000);
      return () => clearTimeout(timer);
    }
    return undefined; // Explicit return for else case
  }, [ui.showHelpHint, dismissHelpHint]);
  
  return {
    state: {
      navigation,
      editing,
      ui,
      operations,
      hotspotEditor,
      interactionEditor,
    },
    actions: {
      setCurrentSlide,
      togglePreviewMode,
      toggleSlidePanelCollapse,
      setDeviceTypeOverride,
      selectElement,
      setDragging,
      setTransforming,
      openHotspotEditor,
      closeHotspotEditor,
      openInteractionEditor,
      closeInteractionEditor,
      openModal,
      closeModal,
      closeAllModals,
      setActiveDropdown,
      dismissHelpHint,
      showSuccessMessage,
      hideSuccessMessage,
      setSaving,
      setLoading,
      setError,
      resetEditorState,
      enterEditMode,
      exitEditMode,
      toggleMobilePropertiesPanel,
    },
    computed,
  };
};

export default useUnifiedEditorState;
