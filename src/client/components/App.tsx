import React, { useState, useCallback, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import HotspotEditor from './hotspot/HotspotEditor';
import HotspotViewer from './viewers/HotspotViewer';
import { EffectExecutor } from '../utils/EffectExecutor';
import { HotspotWalkthrough, WalkthroughHotspot } from '../../shared/hotspotTypes';
import LoadingScreen from './shared/LoadingScreen';

// Sample walkthrough data for demo
const createSampleWalkthrough = (): HotspotWalkthrough => ({
  id: 'sample-walkthrough',
  title: 'Sample Interactive Walkthrough',
  description: 'Demonstrate the hotspot system with interactive elements',
  backgroundMedia: {
    type: 'color',
    color: '#f8fafc',
    alt: 'Light background'
  },
  hotspots: [
    {
      id: 'hotspot-1',
      type: 'hotspot',
      position: {
        desktop: { x: 200, y: 150, width: 40, height: 40 },
        tablet: { x: 150, y: 120, width: 35, height: 35 },
        mobile: { x: 100, y: 80, width: 30, height: 30 }
      },
      content: {
        title: 'Welcome!',
        description: 'Click this hotspot to see a spotlight effect'
      },
      interaction: {
        trigger: 'click',
        effect: {
          type: 'spotlight',
          duration: 4000,
          parameters: {
            shape: 'circle',
            intensity: 80,
            message: 'Welcome to the interactive learning experience!'
          }
        }
      },
      style: {
        color: '#3b82f6',
        pulseAnimation: true,
        hideAfterTrigger: false,
        size: 'medium'
      },
      sequenceIndex: 0
    },
    {
      id: 'hotspot-2', 
      type: 'hotspot',
      position: {
        desktop: { x: 400, y: 250, width: 40, height: 40 },
        tablet: { x: 300, y: 200, width: 35, height: 35 },
        mobile: { x: 200, y: 150, width: 30, height: 30 }
      },
      content: {
        title: 'Text Display',
        description: 'This hotspot shows text content'
      },
      interaction: {
        trigger: 'click',
        effect: {
          type: 'text',
          duration: 3000,
          parameters: {
            text: 'This is an interactive text display! Click anywhere to dismiss.'
          }
        }
      },
      style: {
        color: '#10b981',
        pulseAnimation: true,
        hideAfterTrigger: false,
        size: 'medium'
      },
      sequenceIndex: 1
    },
    {
      id: 'hotspot-3',
      type: 'hotspot', 
      position: {
        desktop: { x: 600, y: 180, width: 40, height: 40 },
        tablet: { x: 450, y: 140, width: 35, height: 35 },
        mobile: { x: 300, y: 100, width: 30, height: 30 }
      },
      content: {
        title: 'Tooltip Demo',
        description: 'Shows a quick tooltip message'
      },
      interaction: {
        trigger: 'click',
        effect: {
          type: 'tooltip',
          duration: 2500,
          parameters: {
            text: 'Quick tooltip message!'
          }
        }
      },
      style: {
        color: '#f59e0b',
        pulseAnimation: true,
        hideAfterTrigger: false,
        size: 'medium'
      },
      sequenceIndex: 2
    }
  ],
  sequence: ['hotspot-1', 'hotspot-2', 'hotspot-3'],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  isPublished: true,
  creatorId: 'demo-user'
});

// Home page component
const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Interactive Learning
        </h1>
        <p className="text-gray-600 mb-8">
          Create and experience interactive walkthroughs with hotspots and effects.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => navigate('/editor')}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Create New Walkthrough
          </button>
          
          <button
            onClick={() => navigate('/viewer/sample-walkthrough')}
            className="w-full px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium"
          >
            Try Sample Walkthrough
          </button>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Phase 2 Implementation Complete
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Working hotspot system with real effects
          </p>
        </div>
      </div>
    </div>
  );
};

// Editor page wrapper
const EditorPage: React.FC = () => {
  const navigate = useNavigate();
  const [walkthrough, setWalkthrough] = useState<HotspotWalkthrough>(createSampleWalkthrough);
  const effectExecutorRef = useRef<EffectExecutor | null>(null);

  useEffect(() => {
    const container = document.getElementById('root') || document.body;
    effectExecutorRef.current = new EffectExecutor(container);
    
    return () => {
      effectExecutorRef.current?.cleanup();
    };
  }, []);

  const handleSave = useCallback(() => {
    console.log('Saving walkthrough:', walkthrough);
    // In a real app, this would save to Firebase
    alert('Walkthrough saved successfully!');
  }, [walkthrough]);

  const handlePreview = useCallback(() => {
    navigate(`/viewer/${walkthrough.id}`);
  }, [navigate, walkthrough.id]);

  if (!effectExecutorRef.current) {
    return <LoadingScreen />;
  }

  return (
    <HotspotEditor
      walkthrough={walkthrough}
      onChange={setWalkthrough}
      onSave={handleSave}
      onPreview={handlePreview}
      effectExecutor={effectExecutorRef.current}
    />
  );
};

// Viewer page wrapper
const ViewerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [walkthrough, setWalkthrough] = useState<HotspotWalkthrough | null>(null);
  const effectExecutorRef = useRef<EffectExecutor | null>(null);

  useEffect(() => {
    const container = document.getElementById('root') || document.body;
    effectExecutorRef.current = new EffectExecutor(container);
    
    return () => {
      effectExecutorRef.current?.cleanup();
    };
  }, []);

  useEffect(() => {
    // In a real app, this would load from Firebase
    if (id === 'sample-walkthrough') {
      setWalkthrough(createSampleWalkthrough());
    } else {
      // For demo, just use sample data
      setWalkthrough(createSampleWalkthrough());
    }
  }, [id]);

  const handleComplete = useCallback(() => {
    alert('Walkthrough completed!');
    navigate('/');
  }, [navigate]);

  const handleStepChange = useCallback((step: number) => {
    console.log('Step changed to:', step);
  }, []);

  if (!walkthrough || !effectExecutorRef.current) {
    return <LoadingScreen />;
  }

  return (
    <HotspotViewer
      walkthrough={walkthrough}
      effectExecutor={effectExecutorRef.current}
      onComplete={handleComplete}
      onStepChange={handleStepChange}
    />
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/viewer/:id" element={<ViewerPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
