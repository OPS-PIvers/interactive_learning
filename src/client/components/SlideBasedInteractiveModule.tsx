import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { ViewerModes, EditorCallbacks } from '../../shared/interactiveTypes';
import { migrateProjectToSlides, MigrationResult } from '../../shared/migrationUtils';
import { SlideDeck } from '../../shared/slideTypes';
import { InteractiveModuleState } from '../../shared/types';
import ErrorScreen from './shared/ErrorScreen';
import LoadingScreen from './shared/LoadingScreen';
import SlideBasedViewer from './SlideBasedViewer';

// Lazy load the heavy editor component
const UnifiedSlideEditor = lazy(() => import('./slides/UnifiedSlideEditor'));

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
const SlideBasedInteractiveModule: React.FC<SlideBasedInteractiveModuleProps> = ({
  initialData,
  slideDeck,
  projectType: _projectType = 'slide',
  isEditing,
  onSave,
  onImageUpload,
  onClose,
  projectName,
  projectId,
  isSharedView: _isSharedView = false,
  theme: _theme = 'dark',
  autoStart = false,
  onReloadRequest,
  viewerModes = { explore: true, selfPaced: true, timed: true },
  isPublished = false
}) => {
  // State management
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [currentSlideDeck, setCurrentSlideDeck] = useState<SlideDeck | null>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);

  // Handle project initialization based on type
  const processedSlideDeck = useMemo(() => {
    try {
      // If we have a slide deck passed in, use it directly (for published slide projects)
      if (slideDeck) {
        if (process.env['NODE_ENV'] === 'development') {





        }
        return { slideDeck, migrationResult: null };
      }

      // If it's a hotspot project or needs migration, migrate the hotspot data
      if (!initialData) return { slideDeck: null, migrationResult: null };

      const result = migrateProjectToSlides(
        initialData,
        projectName,
        {
          preserveHotspotIds: true,
          canvasWidth: 1200,
          canvasHeight: 800,
          defaultSlideTitle: `${projectName} - Interactive Slide`
        }
      );

      if (process.env['NODE_ENV'] === 'development') {








      }

      return { slideDeck: result.slideDeck, migrationResult: result };
    } catch (error) {
      console.error('Failed to process project:', error);
      throw new Error(`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [initialData, slideDeck, projectName]);

  // Initialize component
  useEffect(() => {
    try {
      if (!processedSlideDeck?.slideDeck) {
        throw new Error('Failed to process project data');
      }

      setCurrentSlideDeck(processedSlideDeck.slideDeck);
      setMigrationResult(processedSlideDeck.migrationResult);
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

  // Save functionality - properly pass slide deck data for persistence
  const handleSave = useCallback(async () => {
    if (!currentSlideDeck) return;










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
        <UnifiedSlideEditor
          slideDeck={currentSlideDeck}
          projectName={projectName}
          {...projectId && { projectId }}
          onSlideDeckChange={handleSlideDeckChange}
          onSave={handleSave}
          onImageUpload={onImageUpload}
          onClose={handleClose}
          isPublished={isPublished}
          migrationResult={migrationResult} />

      </Suspense>);

  } else {
    return (
      <SlideBasedViewer
        slideDeck={currentSlideDeck}
        projectName={projectName}
        viewerModes={viewerModes}
        autoStart={autoStart}
        onClose={handleClose}
        migrationResult={migrationResult} />);


  }
};

export default SlideBasedInteractiveModule;