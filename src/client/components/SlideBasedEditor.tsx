import React, { useState, useCallback, useMemo } from 'react';
import { SlideDeck, InteractiveSlide, SlideElement, ThemePreset, BackgroundMedia } from '../../shared/slideTypes';
import { MigrationResult } from '../../shared/migrationUtils';
import { useIsMobile } from '../hooks/useIsMobile';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import { SlideEditor } from './slides/SlideEditor';
import { MobileSlideEditor } from './slides/MobileSlideEditor';
import SlideEditorToolbar from './SlideEditorToolbar';
import { generateId } from '../utils/generateId';
import HeaderInsertDropdown from './HeaderInsertDropdown';
import EnhancedPropertiesPanel from './EnhancedPropertiesPanel';
import AspectRatioSelector from './AspectRatioSelector';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { EyeIcon } from './icons/EyeIcon';
import { PencilIcon } from './icons/PencilIcon';
import { SaveIcon } from './icons/SaveIcon';
import { getHotspotPixelDimensions, defaultHotspotSize } from '../../shared/hotspotStylePresets';
import { CheckIcon } from './icons/CheckIcon';
import { GearIcon } from './icons/GearIcon';
import AuthButton from './AuthButton';
import ShareModal from './ShareModal';
  
import ProjectSettingsModal from './ProjectSettingsModal';
import { DeviceType } from '../../shared/slideTypes';
import { calculateContainerDimensions } from '../utils/aspectRatioUtils';
import { ProjectThemeProvider } from '../hooks/useProjectTheme';
import { firebaseAPI } from '../../lib/firebaseApi';
import { MobileFloatingMenu } from './mobile/MobileFloatingMenu';
import { MobileSlidesModal } from './mobile/MobileSlidesModal';
import { MobileBackgroundModal } from './mobile/MobileBackgroundModal';
import { MobileInsertModal } from './mobile/MobileInsertModal';

interface SlideBasedEditorProps {
  slideDeck: SlideDeck;
  projectName: string;
  projectId?: string;
  projectTheme?: ThemePreset;
  onSlideDeckChange: (slideDeck: SlideDeck) => void;
  onSave: (currentSlideDeck: SlideDeck) => Promise<void>;
  onImageUpload: (file: File) => Promise<void>;
  onClose: () => void;
  isPublished: boolean;
  migrationResult?: MigrationResult | null;
}

/**
 * SlideBasedEditor - Visual editor for creating and editing slide-based content
 * 
 * Provides a comprehensive editing interface for slide decks with drag-and-drop,
 * properties panels, and real-time preview capabilities.
 */
const SlideBasedEditor: React.FC<SlideBasedEditorProps> = ({
  slideDeck,
  projectName,
  projectId,
  projectTheme = 'professional',
  onSlideDeckChange,
  onSave,
  onImageUpload,
  onClose,
  isPublished,
  migrationResult
}) => {
  const isMobile = useIsMobile();
  const { deviceType } = useDeviceDetection();
  
  // Editor state
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deviceTypeOverride, setDeviceTypeOverride] = useState<DeviceType | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSlidePanelCollapsed, setIsSlidePanelCollapsed] = useState(false);
  
  // Mobile modal states
  const [isMobileSlidesModalOpen, setIsMobileSlidesModalOpen] = useState(false);
  const [isMobileBackgroundModalOpen, setIsMobileBackgroundModalOpen] = useState(false);
  const [isMobileInsertModalOpen, setIsMobileInsertModalOpen] = useState(false);
  const [showMobileHint, setShowMobileHint] = useState(true);
  
  // Check if device is in landscape mode
  const isLandscape = window.innerWidth > window.innerHeight;
  const shouldCollapsePanelOnMobile = isMobile && isLandscape;

  const currentSlide = slideDeck.slides[currentSlideIndex];

  // Handle slide changes
  const handleSlideChange = useCallback((slideIndex: number) => {
    setCurrentSlideIndex(slideIndex);
    setSelectedElementId(null);
  }, []);

  // Handle slide deck updates
  const handleSlideDeckUpdate = useCallback((newSlideDeck: SlideDeck) => {
    console.log('[SlideBasedEditor] handleSlideDeckUpdate called:', {
      slideCount: newSlideDeck.slides.length,
      totalElements: newSlideDeck.slides.reduce((acc, slide) => acc + slide.elements.length, 0),
      currentSlideElements: newSlideDeck.slides[currentSlideIndex]?.elements?.length || 0,
      slideDeckId: newSlideDeck.id,
      modified: newSlideDeck.metadata?.modified,
      timestamp: new Date().toISOString()
    });
    
    onSlideDeckChange(newSlideDeck);
    
    console.log('[SlideBasedEditor] onSlideDeckChange callback completed');
  }, [onSlideDeckChange, currentSlideIndex]);

  // Add new slide
  const handleAddSlide = useCallback(() => {
    const newSlide: InteractiveSlide = {
      id: generateId(),
      title: `Slide ${slideDeck.slides.length + 1}`,
      elements: [],
      transitions: [],
      layout: {
        containerWidth: 1200,
        containerHeight: 800,
        aspectRatio: '16:9',
        scaling: 'fit',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }
    };

    const updatedSlideDeck: SlideDeck = {
      ...slideDeck,
      slides: [...slideDeck.slides, newSlide],
      metadata: {
        ...slideDeck.metadata,
        modified: Date.now()
      }
    };

    handleSlideDeckUpdate(updatedSlideDeck);
    setCurrentSlideIndex(slideDeck.slides.length);
  }, [slideDeck, handleSlideDeckUpdate]);

  // Delete slide
  const handleDeleteSlide = useCallback((slideIndex: number) => {
    if (slideDeck.slides.length <= 1) return; // Don't delete the last slide

    const updatedSlides = slideDeck.slides.filter((_, index) => index !== slideIndex);
    const newCurrentIndex = slideIndex >= updatedSlides.length ? updatedSlides.length - 1 : slideIndex;

    const updatedSlideDeck: SlideDeck = {
      ...slideDeck,
      slides: updatedSlides,
      metadata: {
        ...slideDeck.metadata,
        modified: Date.now()
      }
    };

    handleSlideDeckUpdate(updatedSlideDeck);
    setCurrentSlideIndex(newCurrentIndex);
  }, [slideDeck, handleSlideDeckUpdate]);

  // Add element to current slide
  const handleAddElement = useCallback((elementType: 'hotspot' | 'text' | 'media' | 'shape') => {
    console.log('[SlideBasedEditor] handleAddElement called:', {
      elementType,
      currentSlideIndex,
      slideDeckExists: !!slideDeck,
      currentSlideElements: slideDeck?.slides[currentSlideIndex]?.elements?.length || 0,
      timestamp: new Date().toISOString()
    });

    // For hotspots, use size-appropriate dimensions based on default size preset
    const getInitialDimensions = (deviceType: 'desktop' | 'tablet' | 'mobile') => {
      if (elementType === 'hotspot') {
        const isMobile = deviceType === 'mobile';
        const dimensions = getHotspotPixelDimensions(defaultHotspotSize, isMobile);
        return { width: dimensions.width, height: dimensions.height };
      }
      // Default dimensions for other element types
      return deviceType === 'desktop' ? { width: 100, height: 100 } :
             deviceType === 'tablet' ? { width: 80, height: 80 } :
             { width: 60, height: 60 };
    };

    const newElement: SlideElement = {
      id: generateId(),
      type: elementType,
      position: {
        desktop: { x: 100, y: 100, ...getInitialDimensions('desktop') },
        tablet: { x: 80, y: 80, ...getInitialDimensions('tablet') },
        mobile: { x: 60, y: 60, ...getInitialDimensions('mobile') }
      },
      content: elementType === 'hotspot' ? {
        title: 'New Hotspot',
        description: 'Click to interact'
      } : elementType === 'text' ? {
        title: 'New Text Element',
        description: 'Edit this text'
      } : elementType === 'media' ? {
        title: 'New Media Element',
        description: 'Upload media content',
        mediaType: 'image',
        mediaUrl: ''
      } : {
        title: 'New Shape',
        description: 'Shape element',
        shapeType: 'rectangle'
      },
      interactions: [],
      style: elementType === 'hotspot' ? {
        backgroundColor: '#3b82f6',
        borderRadius: 50,
        opacity: 0.9
      } : elementType === 'text' ? {
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
        color: '#ffffff',
        borderRadius: 8,
        opacity: 1
      } : elementType === 'media' ? {
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderRadius: 8,
        opacity: 1
      } : {
        backgroundColor: '#8b5cf6',
        borderRadius: 8,
        opacity: 0.9
      },
      isVisible: true
    };

    console.log('[SlideBasedEditor] Created new element:', {
      elementId: newElement.id,
      elementType: newElement.type,
      position: newElement.position,
      content: newElement.content
    });

    const updatedSlide: InteractiveSlide = {
      ...currentSlide,
      elements: [...currentSlide.elements, newElement]
    };

    console.log('[SlideBasedEditor] Updated slide with new element:', {
      slideId: updatedSlide.id,
      slideTitle: updatedSlide.title,
      totalElements: updatedSlide.elements.length,
      newElementCount: updatedSlide.elements.length - currentSlide.elements.length,
      elementIds: updatedSlide.elements.map(el => el.id)
    });

    const updatedSlides = slideDeck.slides.map((slide, index) =>
      index === currentSlideIndex ? updatedSlide : slide
    );

    const updatedSlideDeck: SlideDeck = {
      ...slideDeck,
      slides: updatedSlides,
      metadata: {
        ...slideDeck.metadata,
        modified: Date.now()
      }
    };

    console.log('[SlideBasedEditor] Updated slide deck:', {
      slideCount: updatedSlideDeck.slides.length,
      totalElements: updatedSlideDeck.slides.reduce((acc, slide) => acc + slide.elements.length, 0),
      currentSlideElements: updatedSlideDeck.slides[currentSlideIndex].elements.length,
      aboutToCallUpdate: true
    });

    handleSlideDeckUpdate(updatedSlideDeck);
    setSelectedElementId(newElement.id);
    
    console.log('[SlideBasedEditor] Element addition completed, selected element ID:', newElement.id);
  }, [currentSlide, currentSlideIndex, slideDeck, handleSlideDeckUpdate]);

  // Save functionality
  const handleSaveProject = useCallback(async () => {
    setIsSaving(true);
    try {
      // Debug logging for save operations
      if (process.env.NODE_ENV === 'development') {
        console.log('[SlideBasedEditor] Starting save operation', {
          slideCount: slideDeck.slides.length,
          currentSlideElements: slideDeck.slides[currentSlideIndex]?.elements.length || 0,
          allElements: slideDeck.slides.reduce((acc, slide) => acc + slide.elements.length, 0),
          slideDeckModified: slideDeck.metadata?.modified
        });
      }
      
      await onSave(slideDeck);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 2000);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[SlideBasedEditor] Project saved successfully', {
          slideCount: slideDeck.slides.length,
          backgroundMedia: slideDeck.slides.map(s => s.backgroundMedia?.type || 'none'),
          elementCounts: slideDeck.slides.map(s => s.elements.length)
        });
      }
    } catch (error) {
      console.error('[SlideBasedEditor] Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [onSave, slideDeck, currentSlideIndex]);

  // Toggle preview mode
  const handleTogglePreview = useCallback(() => {
    setIsPreviewMode(prev => !prev);
    setSelectedElementId(null);
  }, []);

  // Handle device type change
  const handleDeviceTypeChange = useCallback((deviceType: DeviceType) => {
    setDeviceTypeOverride(deviceType);
  }, []);

  // Handle background media addition
  const handleAddBackgroundMedia = useCallback(() => {
    // Clear any selected element to show slide properties panel
    setSelectedElementId(null);
    // The background media panel will be accessible through the properties panel
    // when no element is selected (showing slide properties)
  }, []);

  // Handle slide updates from properties panel
  const handleSlideUpdate = useCallback((slideUpdates: Partial<InteractiveSlide>) => {
    if (!currentSlide) return;

    const updatedSlide: InteractiveSlide = {
      ...currentSlide,
      ...slideUpdates
    };

    const updatedSlides = slideDeck.slides.map((slide, index) =>
      index === currentSlideIndex ? updatedSlide : slide
    );

    const updatedSlideDeck: SlideDeck = {
      ...slideDeck,
      slides: updatedSlides,
      metadata: {
        ...slideDeck.metadata,
        modified: Date.now()
      }
    };

    handleSlideDeckUpdate(updatedSlideDeck);
  }, [currentSlide, currentSlideIndex, slideDeck, handleSlideDeckUpdate]);

  // Handle element updates from properties panel
  const handleElementUpdate = useCallback((elementId: string, updates: Partial<SlideElement>) => {
    if (!currentSlide) return;

    const updatedElements = currentSlide.elements.map(element =>
      element.id === elementId ? { ...element, ...updates } : element
    );

    const updatedSlide: InteractiveSlide = {
      ...currentSlide,
      elements: updatedElements
    };

    const updatedSlides = slideDeck.slides.map((slide, index) =>
      index === currentSlideIndex ? updatedSlide : slide
    );

    const updatedSlideDeck: SlideDeck = {
      ...slideDeck,
      slides: updatedSlides,
      metadata: {
        ...slideDeck.metadata,
        modified: Date.now()
      }
    };

    handleSlideDeckUpdate(updatedSlideDeck);
  }, [currentSlide, currentSlideIndex, slideDeck, handleSlideDeckUpdate]);


  // Duplicate slide
  const handleDuplicateSlide = useCallback((slideIndex: number) => {
    const slideToClone = slideDeck.slides[slideIndex];
    if (!slideToClone) return;

    const duplicatedSlide: InteractiveSlide = {
      ...slideToClone,
      id: generateId(),
      title: `${slideToClone.title} (Copy)`,
      elements: slideToClone.elements.map(element => ({
        ...element,
        id: generateId()
      }))
    };

    const updatedSlides = [
      ...slideDeck.slides.slice(0, slideIndex + 1),
      duplicatedSlide,
      ...slideDeck.slides.slice(slideIndex + 1)
    ];

    const updatedSlideDeck: SlideDeck = {
      ...slideDeck,
      slides: updatedSlides,
      metadata: {
        ...slideDeck.metadata,
        modified: Date.now()
      }
    };

    handleSlideDeckUpdate(updatedSlideDeck);
    setCurrentSlideIndex(slideIndex + 1); // Navigate to the duplicated slide
    setActiveDropdownId(null);
  }, [slideDeck, handleSlideDeckUpdate]);

  // Handle dropdown toggle
  const handleDropdownToggle = useCallback((slideId: string) => {
    setActiveDropdownId(prev => prev === slideId ? null : slideId);
  }, []);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdownId(null);
    };

    if (activeDropdownId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeDropdownId]);

  // Handle aspect ratio changes for slides
  const handleAspectRatioChange = useCallback((slideIndex: number, newAspectRatio: string) => {
    const targetSlide = slideDeck.slides[slideIndex];
    if (!targetSlide) return;

    // Calculate new container dimensions based on aspect ratio
    const newDimensions = calculateContainerDimensions(newAspectRatio);
    
    const updatedSlide: InteractiveSlide = {
      ...targetSlide,
      layout: {
        ...targetSlide.layout,
        aspectRatio: newAspectRatio,
        containerWidth: newDimensions.width,
        containerHeight: newDimensions.height
      }
    };

    const updatedSlides = slideDeck.slides.map((slide, index) =>
      index === slideIndex ? updatedSlide : slide
    );

    const updatedSlideDeck: SlideDeck = {
      ...slideDeck,
      slides: updatedSlides,
      metadata: {
        ...slideDeck.metadata,
        modified: Date.now()
      }
    };

    handleSlideDeckUpdate(updatedSlideDeck);
  }, [slideDeck, handleSlideDeckUpdate]);

  // Theme change handler
  const handleThemeChange = useCallback(async (theme: any, themeId: ThemePreset) => {
    if (projectId) {
      try {
        await firebaseAPI.updateProject(projectId, { theme: themeId });
      } catch (error) {
        console.error('Failed to save theme:', error);
      }
    }
  }, [projectId]);

  // Auto-dismiss mobile hint after 5 seconds
  React.useEffect(() => {
    if (isMobile && showMobileHint) {
      const timer = setTimeout(() => {
        setShowMobileHint(false);
      }, 5000); // 5 seconds

      return () => clearTimeout(timer);
    }
  }, [isMobile, showMobileHint]);

  // Add mobile body classes when mobile editor is active
  React.useEffect(() => {
    if (isMobile) {
      document.body.classList.add('mobile-editor-active');
      return () => {
        document.body.classList.remove('mobile-editor-active');
      };
    }
  }, [isMobile]);

  // Mobile modal handlers
  const handleMobileSlidesOpen = useCallback(() => {
    setIsMobileSlidesModalOpen(true);
  }, []);

  const handleMobileBackgroundOpen = useCallback(() => {
    setIsMobileBackgroundModalOpen(true);
  }, []);

  const handleMobileInsertOpen = useCallback(() => {
    setIsMobileInsertModalOpen(true);
  }, []);

  // Get effective device type (override or detected)
  const effectiveDeviceType = deviceTypeOverride || deviceType;

  // Get selected element object
  const selectedElement = selectedElementId 
    ? currentSlide?.elements.find(el => el.id === selectedElementId) || null
    : null;

  // Enhanced slide deck for editor
  const editorSlideDeck = useMemo(() => ({
    ...slideDeck,
    settings: {
      ...slideDeck.settings,
      autoAdvance: false,
      allowNavigation: true,
      showProgress: false,
      showControls: false,
      keyboardShortcuts: true,
      touchGestures: isMobile,
      fullscreenMode: false
    }
  }), [slideDeck, isMobile]);

  return (
    <ProjectThemeProvider 
      initialThemeId={projectTheme}
      onThemeChange={handleThemeChange}
    >
      <div className={`slide-editor fixed inset-0 w-full h-full flex flex-col bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden ${isMobile ? 'mobile-full-height mobile-viewport-fix' : ''}`}>
      {/* Custom scrollbar styles for slide list */}
      <style>{`
        .slide-list::-webkit-scrollbar {
          width: 6px;
        }
        .slide-list::-webkit-scrollbar-track {
          background: #2d3748;
        }
        .slide-list::-webkit-scrollbar-thumb {
          background: #4a5568;
          border-radius: 3px;
        }
        .slide-list::-webkit-scrollbar-thumb:hover {
          background: #718096;
        }
      `}</style>
      {/* Header - 3-Section Layout */}
      <div className="bg-slate-800 border-b border-slate-700 text-white px-4 py-2 flex items-center justify-between shadow-2xl">
        {/* Left Section: Back + Title */}
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors rounded-lg px-2 py-1 hover:bg-slate-700"
            aria-label="Back to projects"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            {!isMobile && <span className="font-medium">Back</span>}
          </button>
          
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
              {projectName}
            </h1>
            <button
              onClick={handleTogglePreview}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 px-2 py-1 rounded text-xs font-semibold text-white shadow-lg transition-all cursor-pointer"
              aria-label={isPreviewMode ? 'Switch to edit mode' : 'Switch to preview mode'}
            >
              {isPreviewMode ? 'PREVIEW' : 'EDIT'}
            </button>
          </div>
        </div>

        {/* Center Section: Insert and Controls */}
        <div className="flex items-center gap-3 flex-1 justify-center">


          {/* Insert Dropdown */}
          {!isPreviewMode && (
            <>
              <HeaderInsertDropdown
                onAddElement={handleAddElement}
                onAddBackgroundMedia={handleAddBackgroundMedia}
                isMobile={isMobile}
              />
              
              {/* Aspect Ratio Selector */}
              {currentSlide?.layout && (
                <AspectRatioSelector
                  currentRatio={currentSlide.layout.aspectRatio || '16:9'}
                  onRatioChange={(ratio) => handleAspectRatioChange(currentSlideIndex, ratio)}
                  isMobile={isMobile}
                />
              )}
            </>
          )}
        </div>

        {/* Right Section: Settings + Save + Share + Auth */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="text-slate-300 hover:text-white transition-colors rounded-lg p-2 hover:bg-slate-700"
            aria-label="Project settings"
          >
            <GearIcon className="w-5 h-5" />
          </button>

          <button
            onClick={handleSaveProject}
            disabled={isSaving}
            className={`font-semibold py-1.5 px-4 rounded-md shadow-md transition-all duration-200 flex items-center gap-2 ${
              isSaving 
                ? 'bg-green-500 cursor-not-allowed' 
                : showSuccessMessage 
                  ? 'bg-green-500' 
                  : 'bg-green-600 hover:bg-green-700'
            } text-white`}
            aria-label="Save project"
          >
            {isSaving ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                {!isMobile && <span>Saving...</span>}
              </>
            ) : showSuccessMessage ? (
              <>
                <CheckIcon className="w-4 h-4" />
                {!isMobile && <span>Saved!</span>}
              </>
            ) : (
              <>
                <SaveIcon className="w-4 h-4" />
                {!isMobile && <span>Save</span>}
              </>
            )}
          </button>

          {projectId && (
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-2"
              aria-label="Share project"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              {!isMobile && <span>Share</span>}
            </button>
          )}

          <AuthButton variant={isMobile ? "compact" : "toolbar"} />
        </div>
      </div>

      {/* Main editor content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Slide navigation panel - hidden on mobile, responsive and collapsible on desktop */}
        {!isMobile && (
          <div className={`${isSlidePanelCollapsed ? 'w-12' : shouldCollapsePanelOnMobile ? 'w-48' : 'w-64'} bg-slate-800/50 border-r border-slate-700 flex flex-col transition-all duration-300 relative`}>
          {/* Header with collapse toggle */}
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className={`text-white font-semibold transition-opacity duration-300 ${isSlidePanelCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>Slides</h2>
            <button
              onClick={() => setIsSlidePanelCollapsed(!isSlidePanelCollapsed)}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded"
              title={isSlidePanelCollapsed ? 'Expand slide panel' : 'Collapse slide panel'}
              aria-label={isSlidePanelCollapsed ? 'Expand slide panel' : 'Collapse slide panel'}
            >
              {isSlidePanelCollapsed ? '→' : '←'}
            </button>
          </div>

          {/* Scrollable slide list */}
          <div className={`flex-1 overflow-y-auto p-2 space-y-2 slide-list transition-opacity duration-300 ${isSlidePanelCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            {isSlidePanelCollapsed ? (
              /* Collapsed view - just slide numbers */
              slideDeck.slides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`w-8 h-8 rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center text-xs font-bold ${
                    index === currentSlideIndex
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white'
                  }`}
                  onClick={() => handleSlideChange(index)}
                  title={`Slide ${index + 1}: ${slide.title}`}
                >
                  {index + 1}
                </div>
              ))
            ) : (
              /* Expanded view - full slide cards */
              slideDeck.slides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                    index === currentSlideIndex
                      ? 'bg-blue-600/30 border border-blue-500 text-white'
                      : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white'
                  }`}
                  onClick={() => handleSlideChange(index)}
                >
                  <div className="flex justify-between items-center">
                    <div className="min-w-0 flex-1">
                      <span className={`font-semibold ${shouldCollapsePanelOnMobile ? 'text-xs' : 'text-sm'} truncate block`}>
                        {index + 1}. {slide.title}
                      </span>
                      {!shouldCollapsePanelOnMobile && (
                        <p className="text-xs text-slate-300 mt-1">
                          {slide.elements.length} element{slide.elements.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    
                    {/* Three-dot menu - hidden in mobile landscape for space */}
                    {!shouldCollapsePanelOnMobile && (
                      <div className="relative ml-2">
                        <button
                          className="text-slate-400 hover:text-white p-1 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDropdownToggle(slide.id);
                          }}
                          title="Slide options"
                        >
                          ⋯
                        </button>
                        
                        {/* Dropdown menu */}
                        {activeDropdownId === slide.id && (
                          <div className="absolute right-0 top-8 w-36 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50">
                            <div className="py-1">
                              <button
                                className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors rounded-t-lg"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicateSlide(index);
                                  setActiveDropdownId(null);
                                }}
                              >
                                📋 Duplicate
                              </button>
                              {slideDeck.slides.length > 1 && (
                                <button
                                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-slate-700 hover:text-red-300 transition-colors rounded-b-lg"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm('Delete this slide?')) {
                                      handleDeleteSlide(index);
                                      setActiveDropdownId(null);
                                    }
                                  }}
                                >
                                  🗑️ Delete
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with Add Slide button */}
          <div className={`p-4 border-t border-slate-700 transition-opacity duration-300 ${isSlidePanelCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            {isSlidePanelCollapsed ? (
              <button
                className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-xs transition-colors flex items-center justify-center"
                onClick={handleAddSlide}
                title="Add Slide"
              >
                +
              </button>
            ) : (
              <button
                className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors ${
                  shouldCollapsePanelOnMobile ? 'text-xs' : 'text-sm'
                }`}
                onClick={handleAddSlide}
              >
                + Add Slide
              </button>
            )}
          </div>
          </div>
        )}

        {/* Main canvas area */}
        <div className="flex-1 flex flex-col relative">
          {isMobile ? (
            <>
              <MobileSlideEditor
                slideDeck={editorSlideDeck}
                currentSlideIndex={currentSlideIndex}
                onSlideDeckChange={handleSlideDeckUpdate}
                onClose={onClose}
                className="flex-1"
                deviceTypeOverride={effectiveDeviceType}
                onAspectRatioChange={handleAspectRatioChange}
                selectedElementId={selectedElementId}
                onElementSelect={setSelectedElementId}
                onElementUpdate={handleElementUpdate}
                onSlideUpdate={handleSlideUpdate}
              />
              
              {/* Mobile Floating Menu */}
              {!isPreviewMode && (
                <MobileFloatingMenu
                  onSlidesOpen={handleMobileSlidesOpen}
                  onBackgroundOpen={handleMobileBackgroundOpen}
                  onInsertOpen={handleMobileInsertOpen}
                  isTimelineVisible={false} // TODO: Check if timeline is actually visible
                />
              )}
            </>
          ) : (
            <SlideEditor
              slideDeck={editorSlideDeck}
              currentSlideIndex={currentSlideIndex}
              onSlideDeckChange={handleSlideDeckUpdate}
              onClose={onClose}
              className="flex-1"
              deviceTypeOverride={effectiveDeviceType}
              onAspectRatioChange={handleAspectRatioChange}
              selectedElementId={selectedElementId}
              onElementSelect={setSelectedElementId}
              onElementUpdate={handleElementUpdate}
              onSlideUpdate={handleSlideUpdate}
            />
          )}
        </div>

        {/* Properties panel - hidden on mobile */}
        {!isPreviewMode && !isMobile && (
          <EnhancedPropertiesPanel
            selectedElement={selectedElement}
            currentSlide={currentSlide}
            deviceType={effectiveDeviceType}
            onElementUpdate={handleElementUpdate}
            onSlideUpdate={handleSlideUpdate}
            isMobile={isMobile}
          />
        )}
        
        {/* Mobile Landscape Floating Toolbar */}
        {shouldCollapsePanelOnMobile && !isPreviewMode && (
          <>
            <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 bg-slate-800/90 backdrop-blur-sm border border-slate-600 rounded-full px-4 py-2 flex items-center gap-3 shadow-lg">
              <button
                onClick={() => handleSlideChange(Math.max(0, currentSlideIndex - 1))}
                disabled={currentSlideIndex === 0}
                className="p-2 text-white disabled:text-slate-500 hover:bg-slate-700 rounded-full transition-colors"
                title="Previous slide"
              >
                ←
              </button>
              
              <span className="text-white text-sm font-medium px-2">
                {currentSlideIndex + 1}/{slideDeck.slides.length}
              </span>
              
              <button
                onClick={() => handleSlideChange(Math.min(slideDeck.slides.length - 1, currentSlideIndex + 1))}
                disabled={currentSlideIndex === slideDeck.slides.length - 1}
                className="p-2 text-white disabled:text-slate-500 hover:bg-slate-700 rounded-full transition-colors"
                title="Next slide"
              >
                →
              </button>
              
              <div className="w-px h-6 bg-slate-600 mx-1" />
              
              <button
                onClick={handleAddSlide}
                className="p-2 text-white hover:bg-slate-700 rounded-full transition-colors"
                title="Add slide"
              >
                +
              </button>
              
              <button
                onClick={() => setIsSlidePanelCollapsed(!isSlidePanelCollapsed)}
                className="p-2 text-white hover:bg-slate-700 rounded-full transition-colors"
                title="Toggle slide panel"
              >
                ☰
              </button>
            </div>
            
            {/* Mobile landscape help hint - auto-dismisses after 5 seconds */}
            {showMobileHint && (
              <div className="fixed top-4 right-4 z-30 bg-blue-600/90 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg shadow-lg max-w-xs">
                <div className="flex items-center gap-2">
                  <span className="text-blue-200">📱</span>
                  <span>Pinch to zoom, swipe to navigate slides, tap elements to select</span>
                  <button
                    onClick={() => setShowMobileHint(false)}
                    className="ml-2 text-blue-200 hover:text-white"
                    aria-label="Dismiss hint"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer with migration info - hidden on mobile landscape for space */}
      {migrationResult && !shouldCollapsePanelOnMobile && (
        <div className="bg-slate-800 border-t border-slate-700 text-slate-400 p-3 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent font-semibold">
                Slide Editor
              </span>
              <span className="mx-2">•</span>
              {migrationResult.elementsConverted} elements migrated
              <span className="mx-2">•</span>
              {migrationResult.interactionsConverted} interactions preserved
            </div>
            
            {migrationResult.warnings.length > 0 && (
              <div className="text-yellow-400">
                ⚠️ {migrationResult.warnings.length} migration warnings
              </div>
            )}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {isShareModalOpen && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          project={{
            id: projectId || '',
            name: projectName,
            published: isPublished
          } as any}
        />
      )}


        {/* Project Settings Modal */}
        <ProjectSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          projectName={projectName}
          projectId={projectId || ''}
        />

        {/* Mobile Modals */}
        {isMobile && (
          <>
            {isMobileSlidesModalOpen && (
              <MobileSlidesModal
                slides={slideDeck.slides}
                currentSlideIndex={currentSlideIndex}
                onSlideSelect={handleSlideChange}
                onSlideAdd={handleAddSlide}
                onSlideDelete={handleDeleteSlide}
                onSlideDuplicate={handleDuplicateSlide}
                onClose={() => setIsMobileSlidesModalOpen(false)}
              />
            )}

            {isMobileBackgroundModalOpen && currentSlide && (
              <MobileBackgroundModal
                currentSlide={currentSlide}
                onAspectRatioChange={(ratio) => handleAspectRatioChange(currentSlideIndex, ratio)}
                onBackgroundUpload={async (file: File) => {
                  try {
                    // Use Firebase API to upload the file
                    const imageUrl = await firebaseAPI.uploadImage(file);
                    
                    // Create BackgroundMedia object
                    const backgroundMedia: BackgroundMedia = {
                      type: file.type.startsWith('video/') ? 'video' : 'image',
                      url: imageUrl,
                      size: 'cover',
                      position: 'center'
                    };
                    
                    // Update the slide with the new background
                    handleSlideUpdate({ backgroundMedia });
                  } catch (error) {
                    console.error('Background upload failed:', error);
                    throw error; // Re-throw to be handled by the modal
                  }
                }}
                onBackgroundRemove={() => handleSlideUpdate({ backgroundMedia: undefined })}
                onBackgroundUpdate={(mediaConfig) => handleSlideUpdate({ backgroundMedia: mediaConfig })}
                onClose={() => setIsMobileBackgroundModalOpen(false)}
              />
            )}

            {isMobileInsertModalOpen && (
              <MobileInsertModal
                onInsertElement={handleAddElement}
                onClose={() => setIsMobileInsertModalOpen(false)}
              />
            )}
          </>
        )}
      </div>
    </ProjectThemeProvider>
  );
};

export default SlideBasedEditor;