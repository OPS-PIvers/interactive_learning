import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { ViewerModes } from '../../shared/interactiveTypes';
import { SlideDeck } from '../../shared/slideTypes';
import { InteractiveModuleState } from '../../shared/types';
import ErrorScreen from './shared/ErrorScreen';
import LoadingScreen from './shared/LoadingScreen';
import SlideBasedViewer from './SlideBasedViewer';

// Lazy load the heavy editor component
const ModernSlideEditor = lazy(() => import('./editors/ModernSlideEditor'));

interface SlideBasedInteractiveModuleProps {
  initialData: InteractiveModuleState;
  slideDeck?: SlideDeck;
  projectType?: 'hotspot' | 'slide';
  isEditing: boolean;
  onSave: (projectData: InteractiveModuleState & {projectType?: string;slideDeck?: SlideDeck;thumbnailUrl?: string;}) => void;
  onImageUpload: (file: File) => Promise<void>;
  onClose?: (callback?: () => void) => void;
  projectName: string;
  projectId?: string;
  isSharedView?: boolean;
  theme?: 'light' | 'dark';
  autoStart?: boolean;
  onReloadRequest?: () => void;
  viewerModes?: ViewerModes;
  isPublished?: boolean;
}

/**
 * SlideBasedInteractiveModule - Main component for slide-based interactive experiences
 * 
 * Replaces the legacy hotspot-based InteractiveModule with a modern slide architecture.
 * Automatically migrates existing hotspot projects to slide format.
 */
const SlideBasedInteractiveModule: React.FC<SlideBasedInteractiveModuleProps> = (props) => {
  const {
    initialData,
    slideDeck,
    isEditing,
    onSave,
    onImageUpload,
    onClose,
    projectName,
    projectId,
    autoStart = false,
    viewerModes = { explore: true, selfPaced: true, timed: true },
    isPublished = false,
    onReloadRequest,
    ...rest
  } = props;

  // State management
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [currentSlideDeck, setCurrentSlideDeck] = useState<SlideDeck | null>(null);

  // Handle project initialization
  const processedSlideDeck = useMemo(() => {
    try {
      // Use slide deck directly - no migration needed
      if (slideDeck) {
        return { slideDeck };
      }

      // For now, require slide deck format
      return { slideDeck: null };
    } catch (error) {
      console.error('Failed to process project:', error);
      throw new Error(`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [slideDeck]);

  // Initialize component
  useEffect(() => {
    try {
      if (!processedSlideDeck?.slideDeck) {
        throw new Error('Failed to process project data');
      }

      setCurrentSlideDeck(processedSlideDeck.slideDeck);
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize slide-based module:', error);
      setInitError(error instanceof Error ? error.message : 'Failed to initialize module');
    }
  }, [processedSlideDeck]);

  // Handle slide deck changes from editor
  const handleSlideDeckChange = useCallback((newSlideDeck: SlideDeck) => {
    setCurrentSlideDeck(newSlideDeck);
  }, []);

  const [isSaving, setIsSaving] = useState(false);

  // Save functionality - properly pass slide deck data for persistence
  const handleSave = useCallback(async () => {
    if (!currentSlideDeck) return;

    setIsSaving(true);
    // Create updated interactive data that preserves the original structure 
    // but includes any legacy compatibility needs
    const newBackgroundImage = currentSlideDeck?.slides?.[0]?.backgroundMedia?.type === 'image' ?
    currentSlideDeck?.slides?.[0]?.backgroundMedia?.url :
    initialData.backgroundImage;
    const updatedData: InteractiveModuleState = {
      ...initialData,
      // Preserve any legacy properties while ensuring background compatibility
      ...(newBackgroundImage && { backgroundImage: newBackgroundImage })
    };

    // CRITICAL FIX: Create a proper project object with slide deck data
    const projectWithSlideDeck = {
      ...initialData,
      projectType: 'slide' as const, // Mark as slide-based project
      slideDeck: currentSlideDeck, // Include the slide deck with all elements
      interactiveData: updatedData
    };

    // Save the complete project object with slide deck data
    await onSave(projectWithSlideDeck);
    setIsSaving(false);
  }, [onSave, currentSlideDeck, initialData]);

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  // Loading state
  if (!isInitialized) {
    return <LoadingScreen />;
  }

  // Error state
  if (initError || !currentSlideDeck) {
    return (
      <ErrorScreen
        error={initError ? new Error(initError) : new Error('Failed to load slide deck')}
        {...onReloadRequest && { onReload: onReloadRequest }} />);


  }

  // Route to appropriate component
  if (isEditing) {
    return (
      <Suspense fallback={<LoadingScreen message="Loading Editor..." />}>
        <ModernSlideEditor
          {...rest}
          slide={currentSlideDeck.slides[0] || {
            id: 'default-slide',
            title: projectName || 'New Slide',
            elements: [],
            backgroundMedia: {
              type: 'image',
              url: ''
            },
            layout: {
              aspectRatio: '16:9',
              scaling: 'fit',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            },
            transitions: []
          }}
          onSlideChange={(updatedSlide) => {
            const updatedDeck = {
              ...currentSlideDeck,
              slides: [updatedSlide]
            };
            handleSlideDeckChange(updatedDeck);
          }}
          projectName={projectName}
          onSave={handleSave}
          onClose={handleClose}
          isSaving={isSaving}
          isPublished={isPublished}
          onImageUpload={onImageUpload}
          project={{
            id: projectId || '',
            title: projectName,
            description: '',
            createdBy: 'dev-user', // TODO: Replace with actual user ID when auth is available
            createdAt: new Date(),
            updatedAt: new Date(),
            isPublished: isPublished,
            thumbnailUrl: '',
            interactiveData: initialData,
            slideDeck: currentSlideDeck,
          }}
          onLivePreview={() => {
            if (projectId) {
              window.open(`/shared/${projectId}`, '_blank');
            }
          }}
        />

      </Suspense>);

  } else {
    return (
      <SlideBasedViewer
        slideDeck={currentSlideDeck}
        projectName={projectName}
        viewerModes={viewerModes}
        autoStart={autoStart}
        onClose={handleClose}
 />);


  }
};

export default SlideBasedInteractiveModule;