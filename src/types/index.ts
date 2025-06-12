export enum InteractionType {
  SHOW_HOTSPOT = 'SHOW_HOTSPOT',
  HIDE_HOTSPOT = 'HIDE_HOTSPOT',
  SHOW_INFO = 'SHOW_INFO',
  HIDE_INFO = 'HIDE_INFO',
  PLAY_AUDIO = 'PLAY_AUDIO',
  PAUSE_AUDIO = 'PAUSE_AUDIO',
  JUMP_TO_STEP = 'JUMP_TO_STEP',
}

export interface HotspotData {
  id: string;
  title: string;
  description: string;
  x: number;
  y: number;
  size: 'small' | 'medium' | 'large';
  color: string;
  pulse?: boolean;
  targetSceneId?: string; // For linking to other scenes (future)
  infoPanelContent?: string; // Content for an info panel (future)
}

export interface TimelineEventData {
  id: string;
  name: string;
  step: number;
  type: InteractionType;
  targetId: string; // ID of the hotspot or element this event affects
  duration?: number; // Optional duration for timed events
  // Additional properties based on event type
  newHotspotState?: Partial<HotspotData>; // For SHOW_HOTSPOT/HIDE_HOTSPOT
  infoPanelContent?: string; // For SHOW_INFO
  audioUrl?: string; // For PLAY_AUDIO
  jumpToStep?: number; // For JUMP_TO_STEP
}
