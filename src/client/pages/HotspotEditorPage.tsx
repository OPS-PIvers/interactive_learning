import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HotspotWalkthrough } from '../../shared/hotspotTypes';
import { EffectExecutor } from '../utils/EffectExecutor';
import HotspotEditor from '../components/hotspot/HotspotEditor';
import LoadingScreen from '../components/shared/LoadingScreen';
import ErrorScreen from '../components/shared/ErrorScreen';

export default function HotspotEditorPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  
  const [walkthrough, setWalkthrough] = useState<HotspotWalkthrough | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const effectExecutor = useMemo(() => {
    const container = document.getElementById('effect-container') || document.body;
    return new EffectExecutor(container);
  }, []);
  
  useEffect(() => {
    // Load existing walkthrough or create new one
    const loadWalkthrough = async () => {
      try {
        if (id) {
          // TODO: Load existing walkthrough from Firebase
          // const data = await getWalkthrough(id);
          // setWalkthrough(data);
          
          // Temporary: Create demo walkthrough
          setWalkthrough(createDemoWalkthrough(id));
        } else {
          // Create new walkthrough
          setWalkthrough(createNewWalkthrough());
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load walkthrough');
      } finally {
        setLoading(false);
      }
    };
    
    loadWalkthrough();
  }, [id]);
  
  const handleSave = async () => {
    if (!walkthrough) return;
    
    try {
      // TODO: Save to Firebase
      // if (walkthrough.id) {
      //   await updateWalkthrough(walkthrough);
      // } else {
      //   const newWalkthrough = await createWalkthrough(walkthrough);
      //   setWalkthrough(newWalkthrough);
      //   navigate(`/editor/${newWalkthrough.id}`, { replace: true });
      // }
      
      console.log('Walkthrough saved:', walkthrough);
      // Show success message
      alert('Walkthrough saved successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save walkthrough');
    }
  };
  
  const handlePreview = () => {
    if (walkthrough?.id) {
      window.open(`/view/${walkthrough.id}`, '_blank');
    }
  };
  
  if (loading) {
    return <LoadingScreen message="Loading editor..." />;
  }
  
  if (error) {
    return (
      <ErrorScreen
        error={new Error(error)}
        onReload={() => window.location.reload()}
        title="Editor Error"
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
      <HotspotEditor
        walkthrough={walkthrough}
        onChange={setWalkthrough}
        onSave={handleSave}
        onPreview={handlePreview}
        effectExecutor={effectExecutor}
      />
      <div id="effect-container" />
    </>
  );
}

// Helper functions
function createNewWalkthrough(): HotspotWalkthrough {
  return {
    id: `walkthrough_${Date.now()}`,
    title: 'New Walkthrough',
    description: '',
    backgroundMedia: { type: 'image', url: '', alt: '' },
    hotspots: [],
    sequence: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isPublished: false,
    creatorId: 'current_user_id' // TODO: Get from auth
  };
}

function createDemoWalkthrough(id: string): HotspotWalkthrough {
  // Demo walkthrough for development
  return {
    id,
    title: 'Demo Walkthrough',
    description: 'A sample walkthrough for testing',
    backgroundMedia: {
      type: 'image',
      url: 'https://via.placeholder.com/800x600/f0f0f0/333333?text=Demo+Background',
      alt: 'Demo background'
    },
    hotspots: [],
    sequence: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isPublished: true,
    creatorId: 'demo_user'
  };
}