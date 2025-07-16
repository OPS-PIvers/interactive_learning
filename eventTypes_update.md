# Event Types Unification - Implementation Instructions

## Overview
This document provides step-by-step instructions to simplify and unify the interactive learning event types from 8 confusing options down to 4 streamlined, intuitive options.

## Current State vs Target State

### Before (8 confusing event types):
- `PLAY_VIDEO` (inline only)
- `SHOW_VIDEO` (modal only) 
- `SHOW_YOUTUBE` (YouTube only)
- `PLAY_AUDIO` (background only)
- `SHOW_AUDIO_MODAL` (modal only)
- `SHOW_MESSAGE` (legacy text)
- `SHOW_TEXT` (enhanced text)
- `HIGHLIGHT_HOTSPOT` (legacy spotlight)
- `SPOTLIGHT` (enhanced spotlight)

### After (4 streamlined event types):
- `PLAY_VIDEO` (handles ALL video sources with flexible display)
- `PLAY_AUDIO` (handles ALL audio sources with flexible display)
- `SHOW_TEXT` (unified text display with positioning)
- `SPOTLIGHT` (unified spotlight with shape, size, and dimming controls)

## Implementation Steps

### Step 1: Update Type Definitions

**File: `src/shared/types.ts`**

1. **Remove deprecated enum values:**
```typescript
export enum InteractionType {
  // ... existing types
  
  // REMOVE these deprecated types:
  // SHOW_VIDEO = 'SHOW_VIDEO',
  // SHOW_AUDIO_MODAL = 'SHOW_AUDIO_MODAL', 
  // SHOW_YOUTUBE = 'SHOW_YOUTUBE',
  // SHOW_MESSAGE = 'SHOW_MESSAGE',
  // HIGHLIGHT_HOTSPOT = 'HIGHLIGHT_HOTSPOT',
  
  // Keep these unified types:
  PLAY_VIDEO = 'PLAY_VIDEO',
  PLAY_AUDIO = 'PLAY_AUDIO', 
  SHOW_TEXT = 'SHOW_TEXT',
  SPOTLIGHT = 'SPOTLIGHT',
}
```

2. **Add new video source type:**
```typescript
export type VideoSourceType = 'file' | 'youtube' | 'device' | 'url';
export type SpotlightShape = 'circle' | 'rectangle' | 'oval';
```

3. **Enhance TimelineEventData interface:**
```typescript
export interface TimelineEventData {
  id: string;
  step: number;
  name: string;
  type: InteractionType;
  targetId?: string;
  
  // === UNIFIED VIDEO PROPERTIES ===
  videoSource?: VideoSourceType;
  videoUrl?: string;
  videoFile?: File;
  videoBlob?: Blob;
  youtubeVideoId?: string;
  youtubeStartTime?: number;
  youtubeEndTime?: number;
  videoDisplayMode?: 'inline' | 'modal' | 'overlay';
  videoShowControls?: boolean;
  videoPoster?: string;
  
  // === UNIFIED AUDIO PROPERTIES ===
  audioUrl?: string;
  audioDisplayMode?: 'background' | 'modal' | 'mini-player';
  audioShowControls?: boolean;
  audioTitle?: string;
  audioArtist?: string;
  
  // === UNIFIED TEXT PROPERTIES ===
  textContent?: string;
  textX?: number;        // Position X (percentage)
  textY?: number;        // Position Y (percentage) 
  textWidth?: number;    // Width in pixels
  textHeight?: number;   // Height in pixels
  textPosition?: 'center' | 'custom';
  
  // === UNIFIED SPOTLIGHT PROPERTIES ===
  spotlightShape?: SpotlightShape;
  spotlightX?: number;           // Center X (percentage)
  spotlightY?: number;           // Center Y (percentage)
  spotlightWidth?: number;       // Width in pixels
  spotlightHeight?: number;      // Height in pixels
  backgroundDimPercentage?: number; // 0-100 (how much to dim background)
  spotlightOpacity?: number;     // Always 0 for spotlighted area
  
  // === COMMON PROPERTIES ===
  autoplay?: boolean;
  loop?: boolean;
  volume?: number;
  duration?: number;
  
  // Legacy fields (keep for migration compatibility)
  message?: string;
  content?: string;
  imageUrl?: string;
  poster?: string;
  artist?: string;
}
```

4. **Add utility functions:**
```typescript
// Video source detection utility
export const detectVideoSource = (input: string): VideoSourceType => {
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];
  
  for (const pattern of youtubePatterns) {
    if (pattern.test(input)) return 'youtube';
  }
  
  const videoExtensions = /\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)$/i;
  if (videoExtensions.test(input)) return 'file';
  
  return 'url';
};

// Extract YouTube video ID from various URL formats
export const extractYouTubeVideoId = (input: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  return null;
};
```

### Step 2: Update Interaction Presets

**File: `src/shared/InteractionPresets.ts`**

Replace the existing media and text presets with these unified versions:

```typescript
export const interactionPresets: Record<InteractionType, InteractionPreset> = {
  // ... keep existing non-media presets
  
  // === UNIFIED MEDIA TYPES ===
  [InteractionType.PLAY_VIDEO]: {
    icon: '🎥',
    name: 'Play Video',
    color: 'bg-red-500',
    settings: [
      'videoSource',
      'videoUrl', 
      'videoDisplayMode', 
      'videoShowControls', 
      'videoPoster', 
      'autoplay', 
      'loop',
      'youtubeStartTime',
      'youtubeEndTime'
    ],
    description: 'Play video from any source (file, YouTube, device recording, URL)'
  },
  
  [InteractionType.PLAY_AUDIO]: {
    icon: '🔊',
    name: 'Play Audio',
    color: 'bg-indigo-500',
    settings: [
      'audioUrl', 
      'audioDisplayMode', 
      'audioShowControls', 
      'volume', 
      'autoplay', 
      'loop',
      'audioTitle',
      'audioArtist'
    ],
    description: 'Play audio from any source with flexible display options'
  },
  
  // === UNIFIED TEXT AND SPOTLIGHT ===
  [InteractionType.SHOW_TEXT]: {
    icon: '💬',
    name: 'Show Text',
    color: 'bg-blue-500',
    settings: [
      'textContent',
      'textPosition',
      'textX',
      'textY', 
      'textWidth',
      'textHeight'
    ],
    description: 'Display text content with flexible positioning'
  },
  
  [InteractionType.SPOTLIGHT]: {
    icon: '💡',
    name: 'Spotlight',
    color: 'bg-yellow-500',
    settings: [
      'spotlightShape',
      'spotlightX',
      'spotlightY',
      'spotlightWidth', 
      'spotlightHeight',
      'backgroundDimPercentage'
    ],
    description: 'Focus attention with customizable spotlight effect'
  },
  
  // REMOVE these deprecated presets:
  // [InteractionType.SHOW_VIDEO]
  // [InteractionType.SHOW_AUDIO_MODAL]
  // [InteractionType.SHOW_YOUTUBE]
  // [InteractionType.SHOW_MESSAGE]
  // [InteractionType.HIGHLIGHT_HOTSPOT]
};
```

### Step 3: Create Video Source Selector Component

**File: `src/client/components/VideoSourceSelector.tsx`** (NEW FILE)

Create a component that allows users to:
- Paste YouTube URLs
- Upload video files
- Record video with device camera
- Enter direct video URLs

Key features:
- Tab-based interface for different source types
- YouTube URL validation and ID extraction
- File type validation for uploads
- Media recording with proper permissions handling
- Mobile-optimized interface

### Step 4: Create Unified Event Editors

**File: `src/client/components/UnifiedVideoEventEditor.tsx`** (NEW FILE)
**File: `src/client/components/UnifiedAudioEventEditor.tsx`** (NEW FILE)
**File: `src/client/components/UnifiedTextEventEditor.tsx`** (NEW FILE)
**File: `src/client/components/UnifiedSpotlightEventEditor.tsx`** (NEW FILE)

Each editor should include:
- Smart defaults based on event type
- Quick preset buttons for common configurations
- Progressive disclosure (simple by default, advanced options available)
- Real-time preview capabilities

#### Spotlight Editor Specific Requirements:
- Shape selector: circle, rectangle, oval
- Size controls: width and height in pixels
- Position controls: X and Y as percentages
- Background dim slider: 0-100% (how much to dim the background)
- Spotlighted area is ALWAYS 0% dimmed (bright/focused)
- Visual preview of spotlight effect

### Step 5: Update Event Handling in InteractiveModule

**File: `src/client/components/InteractiveModule.tsx`**

1. **Add unified event handlers:**

```typescript
const handleUnifiedVideoEvent = (event: TimelineEventData) => {
  if (!event.videoSource || !event.videoUrl) return;

  const displayMode = event.videoDisplayMode || 'inline';

  switch (event.videoSource) {
    case 'youtube':
      if (!event.youtubeVideoId) return;
      // Handle YouTube with different display modes
      break;
    case 'file':
    case 'device': 
    case 'url':
      // Handle file-based videos with different display modes
      break;
  }
};

const handleUnifiedAudioEvent = (event: TimelineEventData) => {
  if (!event.audioUrl) return;
  
  const displayMode = event.audioDisplayMode || 'background';
  
  switch (displayMode) {
    case 'background':
      // Simple background audio playback
      break;
    case 'modal':
      // Modal audio player
      break;
    case 'mini-player':
      // Floating mini player
      break;
  }
};

const handleUnifiedTextEvent = (event: TimelineEventData) => {
  if (!event.textContent) return;
  
  const position = event.textPosition || 'center';
  
  if (position === 'center') {
    // Show centered text modal
  } else {
    // Show positioned text at custom coordinates
  }
};

const handleUnifiedSpotlightEvent = (event: TimelineEventData) => {
  if (!event.targetId) return;
  
  const shape = event.spotlightShape || 'circle';
  const dimPercentage = event.backgroundDimPercentage || 70;
  
  // Create spotlight effect with:
  // - Custom shape and size
  // - Background dimmed by dimPercentage
  // - Spotlighted area always bright (0% dim)
};
```

2. **Update main event handling switch:**

```typescript
switch (event.type) {
  case InteractionType.PLAY_VIDEO:
    handleUnifiedVideoEvent(event);
    break;
  case InteractionType.PLAY_AUDIO:
    handleUnifiedAudioEvent(event);
    break;
  case InteractionType.SHOW_TEXT:
    handleUnifiedTextEvent(event);
    break;
  case InteractionType.SPOTLIGHT:
    handleUnifiedSpotlightEvent(event);
    break;
  // Remove old cases for deprecated types
}
```

### Step 6: Update Mobile Interface

**File: `src/client/components/mobile/MobileEventTypeSelector.tsx`**

Update the mobile interface to show only the 4 unified event types:

```typescript
const MOBILE_INTERACTION_TYPES = [
  {
    category: 'Visual Effects',
    types: [
      { value: InteractionType.SPOTLIGHT, label: 'Spotlight', icon: '💡', description: 'Focus attention on area' },
      { value: InteractionType.PAN_ZOOM, label: 'Pan & Zoom', icon: '🔍', description: 'Focus on area' },
      { value: InteractionType.PULSE_HOTSPOT, label: 'Pulse', icon: '💓', description: 'Animate hotspot' },
    ]
  },
  {
    category: 'Media',
    types: [
      { value: InteractionType.PLAY_VIDEO, label: 'Video', icon: '🎥', description: 'File, YouTube, or record video' },
      { value: InteractionType.PLAY_AUDIO, label: 'Audio', icon: '🔊', description: 'File or record audio' },
      { value: InteractionType.SHOW_IMAGE_MODAL, label: 'Image', icon: '🖼️', description: 'Show image' },
    ]
  },
  {
    category: 'Interactive',
    types: [
      { value: InteractionType.SHOW_TEXT, label: 'Text', icon: '💬', description: 'Show text content' },
      { value: InteractionType.QUIZ, label: 'Quiz', icon: '❓', description: 'Ask question' },
    ]
  }
];
```

### Step 7: Add Migration Functions

**File: `src/shared/migration.ts`** (NEW FILE)

Create migration functions to convert existing events:

```typescript
export const migrateEventTypes = (events: TimelineEventData[]): TimelineEventData[] => {
  return events.map(event => {
    // Migrate SHOW_YOUTUBE to PLAY_VIDEO
    if (event.type === 'SHOW_YOUTUBE' as any) {
      return {
        ...event,
        type: InteractionType.PLAY_VIDEO,
        videoSource: 'youtube' as VideoSourceType,
        videoUrl: `https://youtube.com/watch?v=${event.youtubeVideoId}`,
        videoDisplayMode: 'modal' as const,
        videoShowControls: true,
      };
    }
    
    // Migrate SHOW_VIDEO to PLAY_VIDEO  
    if (event.type === 'SHOW_VIDEO' as any) {
      return {
        ...event,
        type: InteractionType.PLAY_VIDEO,
        videoSource: 'url' as VideoSourceType,
        videoDisplayMode: 'modal' as const,
        videoShowControls: true,
        videoPoster: event.poster,
      };
    }
    
    // Migrate SHOW_AUDIO_MODAL to PLAY_AUDIO
    if (event.type === 'SHOW_AUDIO_MODAL' as any) {
      return {
        ...event,
        type: InteractionType.PLAY_AUDIO,
        audioDisplayMode: 'modal' as const,
        audioShowControls: true,
        audioTitle: event.textContent,
        audioArtist: event.artist
      };
    }
    
    // Migrate SHOW_MESSAGE to SHOW_TEXT
    if (event.type === 'SHOW_MESSAGE' as any) {
      return {
        ...event,
        type: InteractionType.SHOW_TEXT,
        textContent: event.message,
        textPosition: 'center' as const
      };
    }
    
    // Migrate HIGHLIGHT_HOTSPOT to SPOTLIGHT
    if (event.type === 'HIGHLIGHT_HOTSPOT' as any) {
      return {
        ...event,
        type: InteractionType.SPOTLIGHT,
        spotlightShape: 'circle' as SpotlightShape,
        spotlightWidth: 120,
        spotlightHeight: 120,
        backgroundDimPercentage: 70,
        spotlightOpacity: 0 // Always bright in spotlight
      };
    }
    
    return event;
  });
};
```

### Step 8: Update Event Creation

**File: `src/client/components/HotspotEditorModal.tsx`**

Update the `handleAddEvent` function to create unified events with smart defaults:

```typescript
const handleAddEvent = (type: InteractionType) => {
  if (!localHotspot) return;
  
  const newEvent: TimelineEventData = { 
    id: `event_${Date.now()}`, 
    name: `New ${type.toLowerCase().replace('_', ' ')} event`,
    step: currentStep,
    type,
    targetId: localHotspot.id,
    
    // UNIFIED VIDEO
    ...(type === InteractionType.PLAY_VIDEO && {
      videoSource: undefined, // User will select
      videoDisplayMode: 'inline',
      videoShowControls: true,
      autoplay: false,
      loop: false,
    }),
    
    // UNIFIED AUDIO  
    ...(type === InteractionType.PLAY_AUDIO && {
      audioUrl: '',
      audioDisplayMode: 'background',
      audioShowControls: false,
      autoplay: true,
      volume: 80,
    }),
    
    // UNIFIED TEXT
    ...(type === InteractionType.SHOW_TEXT && {
      textContent: 'Enter your text here',
      textPosition: 'center',
      textX: 50,
      textY: 50,
      textWidth: 300,
      textHeight: 100,
    }),
    
    // UNIFIED SPOTLIGHT
    ...(type === InteractionType.SPOTLIGHT && {
      spotlightShape: 'circle',
      spotlightX: localHotspot.x,
      spotlightY: localHotspot.y, 
      spotlightWidth: 120,
      spotlightHeight: 120,
      backgroundDimPercentage: 70,
      spotlightOpacity: 0, // Always bright
    }),
  };
  
  onAddEvent(newEvent);
};
```

### Step 9: Update Tests

**File: `src/tests/eventSystem.test.ts`**

Update tests to cover the unified event types and migration functions.

### Step 10: Clean Up Legacy Code

1. Remove deprecated event type handlers
2. Remove old component files that are no longer needed
3. Update any remaining references to old event types
4. Clean up unused imports and dependencies

## Testing Checklist

- [ ] All 4 unified event types can be created
- [ ] Video source selector works for all source types (YouTube, file, device, URL)
- [ ] Audio display modes work correctly (background, modal, mini-player)
- [ ] Text positioning works for both center and custom positions
- [ ] Spotlight shape, size, and dimming controls work properly
- [ ] Spotlighted area is always bright (0% dim) while background dims correctly
- [ ] Migration function converts all legacy events correctly
- [ ] Mobile interface shows simplified event options
- [ ] No broken references to deprecated event types
- [ ] All existing projects load and work after migration

## Success Criteria

✅ **User Experience**: From 8 confusing options to 4 intuitive options  
✅ **Video Workflow**: Single "Add Video" button that handles all sources  
✅ **Audio Workflow**: Single "Add Audio" button with flexible display modes  
✅ **Text Workflow**: One text event that handles all positioning needs  
✅ **Spotlight Workflow**: One spotlight event with full shape/size/dimming control  
✅ **Mobile Optimized**: Touch-friendly interface for all unified events  
✅ **Backward Compatible**: All existing projects migrate seamlessly  
✅ **Developer Friendly**: Cleaner code with less duplication  

## Implementation Notes

- Prioritize user experience over technical complexity
- Use progressive disclosure (simple by default, powerful when needed)  
- Provide smart defaults and quick presets for common use cases
- Ensure mobile interfaces are touch-optimized
- Test migration thoroughly with real project data
- Document the changes for future developers

---

*This implementation will reduce user confusion while providing more powerful and flexible event creation capabilities.*