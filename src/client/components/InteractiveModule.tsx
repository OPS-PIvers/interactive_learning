import React, { useState, useEffect, useCallback } from 'react';
import { InteractiveModuleState } from '../../shared/types';
import { ViewerModes, EditorCallbacks } from '../../shared/interactiveTypes';
import { migrateEventTypesWithHotspots } from '../../shared/migration';
import LoadingScreen from './shared/LoadingScreen';
import ErrorScreen from './shared/ErrorScreen';
import InteractiveViewer from './InteractiveViewer';
import InteractiveEditor from './InteractiveEditor';

interface InteractiveModuleProps {
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
}

const InteractiveModule: React.FC<InteractiveModuleProps> = ({
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
  viewerModes = { explore: true, selfPaced: true, timed: true }
}) => {
  // State management
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [moduleData, setModuleData] = useState<InteractiveModuleState>(initialData);

  // Initialize component
  useEffect(() => {
    try {
      // Migrate event types if needed, including setting target coordinates for pan & zoom events
      const migratedEvents = migrateEventTypesWithHotspots(
        initialData.timelineEvents || [], 
        initialData.hotspots || []
      );
      
      const processedData: InteractiveModuleState = {
        ...initialData,
        timelineEvents: migratedEvents,
        hotspots: initialData.hotspots || [],
        backgroundImage: initialData.backgroundImage || null,
        backgroundType: initialData.backgroundType || 'image',
        backgroundVideoType: initialData.backgroundVideoType || 'upload'
      };

      setModuleData(processedData);
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize interactive module:', error);
      setInitError(error instanceof Error ? error.message : 'Failed to initialize module');
    }
  }, [initialData]);

  // Editor callbacks
  const handleSave = useCallback(async () => {
    await onSave(moduleData);
  }, [onSave, moduleData]);

  const handleHotspotsChange = useCallback((hotspots) => {
    setModuleData(prev => ({ ...prev, hotspots }));
  }, []);

  const handleTimelineEventsChange = useCallback((timelineEvents) => {
    setModuleData(prev => ({ ...prev, timelineEvents }));
  }, []);

  const handleBackgroundImageChange = useCallback((backgroundImage) => {
    setModuleData(prev => ({ ...prev, backgroundImage }));
  }, []);

  const handleBackgroundTypeChange = useCallback((backgroundType) => {
    setModuleData(prev => ({ ...prev, backgroundType }));
  }, []);

  const handleBackgroundVideoTypeChange = useCallback((backgroundVideoType) => {
    setModuleData(prev => ({ ...prev, backgroundVideoType }));
  }, []);

  const handleImageUpload = useCallback(async (file: File) => {
    onImageUpload(file);
  }, [onImageUpload]);

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
  if (initError) {
    return <ErrorScreen error={initError} onReload={onReloadRequest} />;
  }

  // Route to appropriate component
  if (isEditing) {
    return (
      <InteractiveEditor
        projectName={projectName}
        backgroundImage={moduleData.backgroundImage}
        hotspots={moduleData.hotspots || []}
        timelineEvents={moduleData.timelineEvents || []}
        backgroundType={moduleData.backgroundType || 'image'}
        backgroundVideoType={moduleData.backgroundVideoType}
        onClose={handleClose}
        onSave={handleSave}
        onHotspotsChange={handleHotspotsChange}
        onTimelineEventsChange={handleTimelineEventsChange}
        onBackgroundImageChange={handleBackgroundImageChange}
        onBackgroundTypeChange={handleBackgroundTypeChange}
        onBackgroundVideoTypeChange={handleBackgroundVideoTypeChange}
        onImageUpload={onImageUpload}
      />
    );
  } else {
    return (
      <InteractiveViewer
        projectName={projectName}
        backgroundImage={moduleData.backgroundImage}
        hotspots={moduleData.hotspots || []}
        timelineEvents={moduleData.timelineEvents || []}
        viewerModes={viewerModes}
        onClose={handleClose}
      />
    );
  }
};

export default InteractiveModule;