import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HotspotWalkthrough } from '../../shared/hotspotTypes';
import { EffectExecutor } from '../utils/EffectExecutor';
import HotspotViewer from '../components/viewers/HotspotViewer';
import LoadingScreen from '../components/shared/LoadingScreen';
import ErrorScreen from '../components/shared/ErrorScreen';

export default function WalkthroughViewerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [walkthrough, setWalkthrough] = useState<HotspotWalkthrough | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const effectExecutor = useMemo(() => {
    const container = document.getElementById('effect-container') || document.body;
    return new EffectExecutor(container);
  }, []);
  
  useEffect(() => {
    const loadWalkthrough = async () => {
      if (!id) {
        setError('No walkthrough ID provided');
        setLoading(false);
        return;
      }

      try {
        // TODO: Load walkthrough from Firebase
        // const data = await getWalkthrough(id);
        // setWalkthrough(data);
        
        // Temporary: Create demo walkthrough with sample hotspots
        setWalkthrough(createDemoWalkthroughWithHotspots(id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load walkthrough');
      } finally {
        setLoading(false);
      }
    };
    
    loadWalkthrough();
  }, [id]);
  
  const handleComplete = () => {
    // Navigate back to dashboard or show completion message
    navigate('/dashboard');
  };
  
  const handleStepChange = (step: number) => {
    console.log('Current step:', step);
    // Track analytics or update user progress
  };
  
  if (loading) {
    return <LoadingScreen message="Loading walkthrough..." />;
  }
  
  if (error) {
    return (
      <ErrorScreen
        error={new Error(error)}
        onReload={() => window.location.reload()}
        title="Walkthrough Error"
      />
    );
  }
  
  if (!walkthrough) {
    return (
      <ErrorScreen
        error={new Error("The requested walkthrough could not be found.")}
        onReload={() => navigate('/dashboard')}
        title="Walkthrough Not Found"
      />
    );
  }
  
  return (
    <>
      <HotspotViewer
        walkthrough={walkthrough}
        effectExecutor={effectExecutor}
        onComplete={handleComplete}
        onStepChange={handleStepChange}
      />
      <div id="effect-container" />
    </>
  );
}

// Helper function to create demo walkthrough with sample hotspots
function createDemoWalkthroughWithHotspots(id: string): HotspotWalkthrough {
  const hotspot1 = {
    id: 'hotspot_1',
    type: 'hotspot' as const,
    position: {
      desktop: { x: 200, y: 150, width: 48, height: 48 },
      tablet: { x: 160, y: 120, width: 40, height: 40 },
      mobile: { x: 120, y: 90, width: 32, height: 32 }
    },
    content: {
      title: 'Welcome Step',
      description: 'This is the first step of your walkthrough'
    },
    interaction: {
      trigger: 'click' as const,
      effect: {
        type: 'spotlight' as const,
        duration: 3000,
        parameters: { shape: 'circle', intensity: 70 }
      }
    },
    style: {
      color: '#2d3f89', // OPS Primary Blue
      pulseAnimation: true,
      hideAfterTrigger: false,
      size: 'medium' as const
    },
    sequenceIndex: 0
  };

  const hotspot2 = {
    id: 'hotspot_2',
    type: 'hotspot' as const,
    position: {
      desktop: { x: 400, y: 300, width: 48, height: 48 },
      tablet: { x: 320, y: 240, width: 40, height: 40 },
      mobile: { x: 240, y: 180, width: 32, height: 32 }
    },
    content: {
      title: 'Second Step',
      description: 'Here we show additional information'
    },
    interaction: {
      trigger: 'click' as const,
      effect: {
        type: 'text' as const,
        duration: 4000,
        parameters: { text: 'This is a text popup with helpful information!' }
      }
    },
    style: {
      color: '#ad2122', // OPS Accent Red
      pulseAnimation: true,
      hideAfterTrigger: false,
      size: 'medium' as const
    },
    sequenceIndex: 1
  };

  const hotspot3 = {
    id: 'hotspot_3',
    type: 'hotspot' as const,
    position: {
      desktop: { x: 600, y: 200, width: 48, height: 48 },
      tablet: { x: 480, y: 160, width: 40, height: 40 },
      mobile: { x: 360, y: 120, width: 32, height: 32 }
    },
    content: {
      title: 'Final Step',
      description: 'This completes the walkthrough'
    },
    interaction: {
      trigger: 'click' as const,
      effect: {
        type: 'tooltip' as const,
        duration: 2000,
        parameters: { message: 'Congratulations! You completed the walkthrough.' }
      }
    },
    style: {
      color: '#2e8540', // OPS Success Green
      pulseAnimation: true,
      hideAfterTrigger: false,
      size: 'medium' as const
    },
    sequenceIndex: 2
  };

  return {
    id,
    title: 'Demo Interactive Walkthrough',
    description: 'A sample walkthrough showcasing the hotspot system',
    backgroundMedia: {
      type: 'image',
      url: 'https://via.placeholder.com/1000x600/f8f9fa/6c757d?text=Interactive+Demo+Background',
      alt: 'Demo background for walkthrough'
    },
    hotspots: [hotspot1, hotspot2, hotspot3],
    sequence: ['hotspot_1', 'hotspot_2', 'hotspot_3'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isPublished: true,
    creatorId: 'demo_user'
  };
}