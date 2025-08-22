import React, { useState } from 'react';
import { InteractiveSlide } from '../../../shared/slideTypes';
import { Project } from '../../../shared/types';
import { generateId } from '../../utils/generateId';
import ModernSlideEditor from './ModernSlideEditor';

/**
 * ModernSlideEditorDemo - Demo component to test the new editor layout
 * 
 * This demonstrates the modern editor with:
 * - Dark blue theme matching the HTML mockup
 * - Centered canvas with aspect ratio badge
 * - Footer controls for Background, Aspect Ratio, and Add Hotspot
 * - Material Icons integration
 * - Responsive design
 */
const ModernSlideEditorDemo: React.FC = () => {
  const [slide, setSlide] = useState<InteractiveSlide>({
    id: generateId(),
    title: 'Demo Slide',
    elements: [],
    transitions: [],
    layout: {
      aspectRatio: '16:9',
      scaling: 'fit',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    },
    backgroundMedia: {
      type: 'image',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1B3UYDDD9ofX1aPglVGY1wkW_Bfq_y_u-J4qfXf54N97ySwDWyjfc46WdxUCwQ5J-BtIspMmiDX7OLXEZXP7tP85cCrShzXfv7tfUFgP_VE4RLYB0Fj3zWBfsHhPVpYOWR3zSjCRzlPfgACHFXY039A_qzm2XknhsIkGkJ5msDlo6t7WOndTN9_pIvTyDMgLis_q0UYaJE0YLpwsl1OBtmpbVrV8BIsl--LKzTM0-o2nYmZFojaU96caP4PBy1WJeHLNKBHjWKg'
    }
  });

  const [isSaving, setIsSaving] = useState(false);

  const mockProject: Project = {
    id: generateId(),
    title: 'Demo Project',
    description: 'Modern slide editor demonstration',
    createdBy: 'demo-user',
    isPublished: false,
    interactiveData: {},
    projectType: 'slide',
    slideDeck: {
      id: generateId(),
      title: 'Demo Slide Deck',
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
        isPublic: false
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    console.log('Slide saved:', slide);
  };

  const handleClose = () => {
    console.log('Editor closed');
  };

  const handleImageUpload = (file: File) => {
    console.log('Image uploaded:', file);
    // In a real implementation, this would upload the file and get a URL
    const fakeUrl = URL.createObjectURL(file);
    const updatedSlide = {
      ...slide,
      backgroundMedia: {
        type: 'image' as const,
        url: fakeUrl
      }
    };
    setSlide(updatedSlide);
  };

  const handleLivePreview = () => {
    console.log('Live preview opened');
  };

  return (
    <ModernSlideEditor
      slide={slide}
      onSlideChange={setSlide}
      projectName="Demo"
      onSave={handleSave}
      onClose={handleClose}
      isSaving={isSaving}
      isPublished={false}
      onImageUpload={handleImageUpload}
      project={mockProject}
      onLivePreview={handleLivePreview}
    />
  );
};

export default ModernSlideEditorDemo;