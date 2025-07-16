import { InteractiveModuleState, InteractionType, HotspotData, TimelineEventData } from './types';

const hotspots: HotspotData[] = [
  { id: 'hs1', x: 10, y: 10, title: 'Show/Hide Hotspot', description: 'This hotspot will be shown and hidden.' },
  { id: 'hs2', x: 30, y: 10, title: 'Pulse Hotspot', description: 'This hotspot will pulse.' },
  { id: 'hs3', x: 50, y: 10, title: 'Show Message', description: 'A message will be shown.' },
  { id: 'hs4', x: 70, y: 10, title: 'Pan & Zoom to Hotspot', description: 'The view will pan and zoom to this hotspot.' },
  { id: 'hs5', x: 90, y: 10, title: 'Highlight Hotspot', description: 'This hotspot will be highlighted.' },
  { id: 'hs6', x: 10, y: 30, title: 'Show Text', description: 'A text box will be shown.' },
  { id: 'hs7', x: 30, y: 30, title: 'Show Image', description: 'An image will be shown.' },
  { id: 'hs8', x: 50, y: 30, title: 'Pan & Zoom', description: 'The view will pan and zoom to this location.' },
  { id: 'hs9', x: 70, y: 30, title: 'Spotlight', description: 'A spotlight will be shown.' },
  { id: 'hs10', x: 90, y: 30, title: 'Quiz', description: 'A quiz will be shown.' },
  { id: 'hs11', x: 10, y: 50, title: 'Pulse Highlight', description: 'This hotspot will pulse with a highlight.' },
  { id: 'hs12', x: 30, y: 50, title: 'Play Audio', description: 'An audio file will be played.' },
  { id: 'hs13', x: 50, y: 50, title: 'Play Video', description: 'A video will be played inline.' },
  { id: 'hs14', x: 70, y: 50, title: 'Show Video', description: 'A video will be shown in a modal.' },
  { id: 'hs15', x: 90, y: 50, title: 'Show Audio Modal', description: 'An audio player will be shown in a modal.' },
  { id: 'hs16', x: 10, y: 70, title: 'Show Image Modal', description: 'An image will be shown in a modal.' },
  { id: 'hs17', x: 30, y: 70, title: 'Show YouTube', description: 'A YouTube video will be shown.' },
];

const timelineEvents: TimelineEventData[] = [
  // Step 1: Show Hotspot
  { id: 'te1', step: 1, name: 'Show Hotspot hs1', type: InteractionType.SHOW_HOTSPOT, targetId: 'hs1' },
  // Step 2: Hide Hotspot
  { id: 'te2', step: 2, name: 'Hide Hotspot hs1', type: InteractionType.HIDE_HOTSPOT, targetId: 'hs1' },
  // Step 3: Pulse Hotspot
  { id: 'te3', step: 3, name: 'Pulse Hotspot hs2', type: InteractionType.PULSE_HOTSPOT, targetId: 'hs2', duration: 3000 },
  // Step 4: Show Message
  { id: 'te4', step: 4, name: 'Show Message for hs3', type: InteractionType.SHOW_MESSAGE, targetId: 'hs3', message: 'This is a test message.' },
  // Step 5: Pan & Zoom to Hotspot
  { id: 'te5', step: 5, name: 'Pan & Zoom to hs4', type: InteractionType.PAN_ZOOM_TO_HOTSPOT, targetId: 'hs4', zoomFactor: 2 },
  // Step 6: Highlight Hotspot
  { id: 'te6', step: 6, name: 'Highlight hs5', type: InteractionType.HIGHLIGHT_HOTSPOT, targetId: 'hs5', highlightRadius: 100 },
  // Step 7: Show Text
  { id: 'te7', step: 7, name: 'Show Text for hs6', type: InteractionType.SHOW_TEXT, targetId: 'hs6', textContent: 'This is a rich text box.' },
  // Step 8: Show Image
  { id: 'te8', step: 8, name: 'Show Image for hs7', type: InteractionType.SHOW_IMAGE, targetId: 'hs7', imageUrl: '/assets/demo-background.jpg', caption: 'This is a caption.' },
  // Step 9: Pan & Zoom
  { id: 'te9', step: 9, name: 'Pan & Zoom to hs8', type: InteractionType.PAN_ZOOM, targetId: 'hs8', zoomLevel: 3, smooth: true },
  // Step 10: Spotlight
  { id: 'te10', step: 10, name: 'Spotlight on hs9', type: InteractionType.SPOTLIGHT, targetId: 'hs9', radius: 150, intensity: 80 },
  // Step 11: Quiz
  { id: 'te11', step: 11, name: 'Quiz for hs10', type: InteractionType.QUIZ, targetId: 'hs10', quizQuestion: 'What is the capital of France?', quizOptions: ['London', 'Paris', 'Berlin'], quizCorrectAnswer: 1 },
  // Step 12: Pulse Highlight
  { id: 'te12', step: 12, name: 'Pulse Highlight hs11', type: InteractionType.PULSE_HIGHLIGHT, targetId: 'hs11', duration: 3000, intensity: 90 },
  // Step 13: Play Audio
  { id: 'te13', step: 13, name: 'Play Audio for hs12', type: InteractionType.PLAY_AUDIO, targetId: 'hs12', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', volume: 80 },
  // Step 14: Play Video
  { id: 'te14', step: 14, name: 'Play Video for hs13', type: InteractionType.PLAY_VIDEO, targetId: 'hs13', videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', autoplay: true, loop: true },
  // Step 15: Show Video
  { id: 'te15', step: 15, name: 'Show Video for hs14', type: InteractionType.SHOW_VIDEO, targetId: 'hs14', videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
  // Step 16: Show Audio Modal
  { id: 'te16', step: 16, name: 'Show Audio Modal for hs15', type: InteractionType.SHOW_AUDIO_MODAL, targetId: 'hs15', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  // Step 17: Show Image Modal
  { id: 'te17', step: 17, name: 'Show Image Modal for hs16', type: InteractionType.SHOW_IMAGE_MODAL, targetId: 'hs16', imageUrl: '/assets/demo-background.jpg', title: 'Demo Image' },
  // Step 18: Show YouTube
  { id: 'te18', step: 18, name: 'Show YouTube for hs17', type: InteractionType.SHOW_YOUTUBE, targetId: 'hs17', youtubeVideoId: 'dQw4w9WgXcQ' },
];


export const demoModuleData: InteractiveModuleState = {
  backgroundImage: '/assets/demo-background.jpg',
  backgroundType: 'image',
  hotspots,
  timelineEvents,
  imageFitMode: 'contain',
  viewerModes: {
    explore: true,
    selfPaced: true,
    timed: true,
  },
};
