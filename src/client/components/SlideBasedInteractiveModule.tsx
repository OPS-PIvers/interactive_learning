import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { InteractiveModuleState } from '../../shared/types';
import { ViewerModes, EditorCallbacks } from '../../shared/interactiveTypes';
import { SlideDeck } from '../../shared/slideTypes';
import { migrateProjectToSlides, MigrationResult } from '../../shared/migrationUtils';
import LoadingScreen from './shared/LoadingScreen';
import ErrorScreen from './shared/ErrorScreen';
import SlideBasedViewer from './SlideBasedViewer';
import SlideBasedEditor from './SlideBasedEditor';

interface SlideBasedInteractiveModuleProps {
  initialData: InteractiveModuleState;
  isEditing: boolean;
  onSave: (data: InteractiveModuleState, thumbnailUrl?: string) => void;
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
  isEditing,
  onSave,
  onImageUpload,
  onClose,
  projectName,
  projectId,
  isSharedView = false,
  theme = 'dark',
  autoStart = false,
  onReloadRequest,
  viewerModes = { explore: true, selfPaced: true, timed: true },
  isPublished = false
}) => {
  // State management
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [slideDeck, setSlideDeck] = useState<SlideDeck | null>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);

  // Migrate hotspot data to slide format
  const migratedSlideDeck = useMemo(() => {
    if (!initialData) return null;

    try {
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

      setMigrationResult(result);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Hotspot → Slide Migration:', {
          projectName,
          slidesCreated: result.slideDeck.slides.length,
          elementsConverted: result.elementsConverted,
          interactionsConverted: result.interactionsConverted,
          warnings: result.warnings
        });
      }

      return result.slideDeck;
    } catch (error) {
      console.error('Failed to migrate project to slides:', error);
      throw new Error(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [initialData, projectName]);

  // Initialize component
  useEffect(() => {
    try {
      if (!migratedSlideDeck) {
        throw new Error('Failed to migrate project to slide format');
      }

      setSlideDeck(migratedSlideDeck);
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize slide-based module:', error);
      setInitError(error instanceof Error ? error.message : 'Failed to initialize module');
    }
  }, [migratedSlideDeck]);

  // Handle slide deck changes from editor
  const handleSlideDeckChange = useCallback((newSlideDeck: SlideDeck) => {
    setSlideDeck(newSlideDeck);
  }, []);

  // Save functionality - convert slide deck back to hotspot format if needed
  const handleSave = useCallback(async () => {
    if (!slideDeck) return;

    // For now, we'll save the original format
    // TODO: Implement slide deck → hotspot conversion or update backend to support slides
    console.log('[SlideBasedInteractiveModule] Saving slide deck:', {
      slideCount: slideDeck.slides.length,
      title: slideDeck.title,
      id: slideDeck.id
    });

    // Preserve original data structure for compatibility
    await onSave(initialData);
  }, [onSave, slideDeck, initialData]);

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
  if (initError || !slideDeck) {
    return (
      <ErrorScreen 
        error={initError || 'Failed to load slide deck'} 
        onReload={onReloadRequest} 
      />
    );
  }

  // Route to appropriate component
  if (isEditing) {
    return (
      <SlideBasedEditor
        slideDeck={slideDeck}
        projectName={projectName}
        projectId={projectId}
        onSlideDeckChange={handleSlideDeckChange}
        onSave={handleSave}
        onImageUpload={onImageUpload}
        onClose={handleClose}
        isPublished={isPublished}
        migrationResult={migrationResult}
      />
    );
  } else {
    return (
      <SlideBasedViewer
        slideDeck={slideDeck}
        projectName={projectName}
        viewerModes={viewerModes}
        autoStart={autoStart}
        onClose={handleClose}
        migrationResult={migrationResult}
      />
    );
  }
};

export default SlideBasedInteractiveModule;