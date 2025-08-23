import { SlideDeck, BackgroundMedia, InteractiveSlide } from './slideTypes';
import { Project, InteractiveModuleState } from './types';

/**
 * Migration utilities for converting between legacy and new slide formats
 */

/**
 * Migrates a legacy background image to the new BackgroundMedia format
 */
export function migrateBackgroundImageToMedia(backgroundImage: string, backgroundType?: 'image' | 'video', backgroundVideoType?: 'youtube' | 'mp4'): BackgroundMedia {
  if (!backgroundImage) {
    return { type: 'none' };
  }

  // Detect YouTube URLs
  if (backgroundImage.includes('youtube.com') || backgroundImage.includes('youtu.be')) {
    const youtubeId = extractYouTubeVideoId(backgroundImage);
    return {
      type: 'youtube',
      url: backgroundImage,
      ...(youtubeId && { youtubeId })
    };
  }

  // Use the provided background type or default to image
  const mediaType = backgroundType === 'video' ? 
    (backgroundVideoType === 'youtube' ? 'youtube' : 'video') : 'image';
  
  return {
    type: mediaType,
    url: backgroundImage
  };
}

/**
 * Extracts YouTube video ID from various YouTube URL formats
 */
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Migrates legacy InteractiveModuleState to SlideDeck format
 */
export function migrateLegacyToSlideDeck(project: Project): SlideDeck | null {
  const { interactiveData, title, id } = project;
  
  // If project already has a slideDeck, return it as-is
  if (project.slideDeck) {
    return project.slideDeck;
  }

  // Create a default slide from legacy data
  const slide: InteractiveSlide = {
    id: 'migrated-slide',
    title: title || 'Migrated Slide',
    elements: [],
    transitions: [],
    layout: {
      aspectRatio: '16:9',
      scaling: 'fit',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  };

  // Migrate background image if it exists
  if (interactiveData.backgroundImage) {
    slide.backgroundMedia = migrateBackgroundImageToMedia(
      interactiveData.backgroundImage, 
      interactiveData.backgroundType,
      interactiveData.backgroundVideoType
    );
  }

  // TODO: Migrate hotspots to slide elements (future enhancement)
  // if (interactiveData.hotspots?.length > 0) {
  //   slide.elements = migrateHotspotsToElements(interactiveData.hotspots);
  // }

  const slideDeck: SlideDeck = {
    id: id,
    title: title,
    slides: [slide],
    settings: {
      autoAdvance: false,
      allowNavigation: true,
      showProgress: true,
      showControls: true,
      keyboardShortcuts: true,
      touchGestures: true,
      fullscreenMode: false
    },
    metadata: {
      created: Date.now(),
      modified: Date.now(),
      version: '1.0.0',
      isPublic: project.isPublished || false
    }
  };

  return slideDeck;
}

/**
 * Ensures a project has both legacy and new formats for compatibility
 */
export function ensureProjectCompatibility(project: Project): Project {
  // Create slide deck if it doesn't exist
  if (!project.slideDeck) {
    const migratedSlideDeck = migrateLegacyToSlideDeck(project);
    if (migratedSlideDeck) {
      project.slideDeck = migratedSlideDeck;
    }
  }

  // Sync legacy backgroundImage with slide deck background
  const firstSlide = project.slideDeck?.slides?.[0];
  if (firstSlide?.backgroundMedia?.url && !project.interactiveData.backgroundImage) {
    project.interactiveData = {
      ...project.interactiveData,
      backgroundImage: firstSlide.backgroundMedia.url,
      backgroundType: firstSlide.backgroundMedia.type === 'image' ? 'image' : 'video',
      backgroundVideoType: firstSlide.backgroundMedia.type === 'youtube' ? 'youtube' : 'mp4'
    };
  }

  return project;
}

/**
 * Checks if a project needs migration from legacy format
 */
export function needsMigration(project: Project): boolean {
  // Needs migration if has legacy data but no slide deck
  return !project.slideDeck && (
    !!project.interactiveData.backgroundImage || 
    !!project.interactiveData.hotspots?.length
  );
}

/**
 * Gets the current background media from either legacy or new format
 */
export function getCurrentBackgroundMedia(project: Project): BackgroundMedia | null {
  // Check slide deck first (new format)
  const firstSlide = project.slideDeck?.slides?.[0];
  if (firstSlide?.backgroundMedia) {
    return firstSlide.backgroundMedia;
  }

  // Fall back to legacy format
  if (project.interactiveData.backgroundImage) {
    return migrateBackgroundImageToMedia(
      project.interactiveData.backgroundImage,
      project.interactiveData.backgroundType,
      project.interactiveData.backgroundVideoType
    );
  }

  return null;
}