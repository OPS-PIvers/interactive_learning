import { InteractiveModuleState, InteractionType, HotspotData, TimelineEventData } from './types';

const hotspots: HotspotData[] = [
  { id: 'hs1', x: 20, y: 20, title: 'Pan & Zoom', description: 'The view will pan and zoom to this location.' },
  { id: 'hs2', x: 60, y: 20, title: 'Show Image', description: 'An image will be displayed.' },
  { id: 'hs3', x: 80, y: 40, title: 'Quiz', description: 'An interactive quiz question.' },
  { id: 'hs4', x: 40, y: 60, title: 'Play Video', description: 'A video will be played.' },
  { id: 'hs5', x: 15, y: 75, title: 'Play Audio', description: 'An audio file will be played.' },
  { id: 'hs6', x: 70, y: 75, title: 'Show Text', description: 'A text message will be displayed.' },
  { id: 'hs7', x: 40, y: 40, title: 'Spotlight', description: 'A spotlight effect will be shown.', pulseWhenActive: true },
];

const timelineEvents: TimelineEventData[] = [
  // Step 1: Pan & Zoom
  { id: 'te1', step: 1, name: 'Pan & Zoom to hs1', type: InteractionType.PAN_ZOOM, targetId: 'hs1', zoomLevel: 2, smooth: true },
  // Step 2: Show Image
  { id: 'te2', step: 2, name: 'Show Image for hs2', type: InteractionType.SHOW_IMAGE, targetId: 'hs2', imageUrl: '/assets/demo-background.jpg', caption: 'This is a demo image.', imageDisplayMode: 'inline' },
  // Step 3: Quiz
  { id: 'te3', step: 3, name: 'Quiz for hs3', type: InteractionType.QUIZ, targetId: 'hs3', quizQuestion: 'What is the capital of France?', quizOptions: ['London', 'Paris', 'Berlin'], quizCorrectAnswer: 1 },
  // Step 4: Play Video
  { id: 'te4', step: 4, name: 'Play Video for hs4', type: InteractionType.PLAY_VIDEO, targetId: 'hs4', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', autoplay: true, loop: true, videoSource: 'url', videoDisplayMode: 'inline', videoShowControls: true },
  // Step 5: Play Audio
  { id: 'te5', step: 5, name: 'Play Audio for hs5', type: InteractionType.PLAY_AUDIO, targetId: 'hs5', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', volume: 80, audioDisplayMode: 'mini-player', audioShowControls: true },
  // Step 6: Show Text
  { id: 'te6', step: 6, name: 'Show Text for hs6', type: InteractionType.SHOW_TEXT, targetId: 'hs6', textContent: 'This is a demonstration text message!', textPosition: 'center' },
  // Step 7: Spotlight (with pulsing hotspot)
  { id: 'te7', step: 7, name: 'Spotlight on hs7', type: InteractionType.SPOTLIGHT, targetId: 'hs7', spotlightShape: 'circle', spotlightWidth: 150, spotlightHeight: 150, backgroundDimPercentage: 80 },
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
