/**
 * EffectSettingsPanel - Unified settings panel for all slide effects
 * 
 * Coordinates different effect setting components and provides a consistent
 * interface for editing element interactions
 */

import React, { useCallback } from 'react';
import { SlideEffect, SlideEffectType } from '../../../../shared/slideTypes';
import SpotlightEffectSettings from './SpotlightEffectSettings';
import PanZoomEffectSettings from './PanZoomEffectSettings';
import MediaEffectSettings from './MediaEffectSettings';
import TextEffectSettings from './TextEffectSettings';
import QuizEffectSettings from './QuizEffectSettings';

interface EffectSettingsPanelProps {
  effect: SlideEffect;
  onUpdate: (updates: Partial<SlideEffect>) => void;
  onCancel: () => void;
  onSave: () => void;
}

const EFFECT_TYPE_LABELS: Record<SlideEffectType, string> = {
  'spotlight': 'Spotlight Effect',
  'pan_zoom': 'Pan & Zoom Effect',
  'play_video': 'Video Playback',
  'play_audio': 'Audio Playback',
  'show_text': 'Text Display',
  'quiz': 'Interactive Quiz',
  'transition': 'Slide Transition',
  'animate': 'Element Animation'
};

const EFFECT_TYPE_DESCRIPTIONS: Record<SlideEffectType, string> = {
  'spotlight': 'Highlight an area with a focused spotlight',
  'pan_zoom': 'Pan and zoom to a specific location',
  'play_video': 'Play video content in various display modes',
  'play_audio': 'Play audio content with customizable controls',
  'show_text': 'Display text content in modals, tooltips, or overlays',
  'quiz': 'Present interactive questions and quizzes to users',
  'transition': 'Navigate to another slide with animation',
  'animate': 'Apply animations to slide elements'
};

export const EffectSettingsPanel: React.FC<EffectSettingsPanelProps> = ({
  effect,
  onUpdate,
  onCancel,
  onSave
}) => {
  const handleEffectTypeChange = useCallback((newType: SlideEffectType) => {
    // Reset parameters when changing effect type
    const defaultParameters = getDefaultParametersForType(newType);
    onUpdate({
      type: newType,
      parameters: defaultParameters
    });
  }, [onUpdate]);

  const renderEffectSettings = () => {
    switch (effect.type) {
      case 'spotlight':
        return <SpotlightEffectSettings effect={effect} onUpdate={onUpdate} />;
      
      case 'pan_zoom':
        return <PanZoomEffectSettings effect={effect} onUpdate={onUpdate} />;
      
      case 'play_video':
      case 'play_audio':
        return <MediaEffectSettings effect={effect} onUpdate={onUpdate} />;
      
      case 'show_text':
        return <TextEffectSettings effect={effect} onUpdate={onUpdate} />;
      
      case 'quiz':
        return <QuizEffectSettings effect={effect} onUpdate={onUpdate} />;
      
      case 'transition':
        return (
          <div className="text-center py-8 text-slate-400">
            <div className="text-2xl mb-2">🔄</div>
            <p className="text-sm">Transition effects coming soon</p>
          </div>
        );
      
      case 'animate':
        return (
          <div className="text-center py-8 text-slate-400">
            <div className="text-2xl mb-2">✨</div>
            <p className="text-sm">Animation effects coming soon</p>
          </div>
        );
      
      default:
        return (
          <div className="text-center py-8 text-slate-400">
            <div className="text-2xl mb-2">❓</div>
            <p className="text-sm">Unknown effect type: {effect.type}</p>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-800 border-l border-slate-700">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-white">
            {EFFECT_TYPE_LABELS[effect.type] || 'Effect Settings'}
          </h3>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-200 p-1 rounded transition-colors"
            title="Cancel editing"
          >
            ×
          </button>
        </div>
        <p className="text-xs text-slate-400">
          {EFFECT_TYPE_DESCRIPTIONS[effect.type] || 'Configure effect parameters'}
        </p>
      </div>

      {/* Effect Type Selector */}
      <div className="p-4 border-b border-slate-700">
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Effect Type
        </label>
        <select
          value={effect.type}
          onChange={(e) => handleEffectTypeChange(e.target.value as SlideEffectType)}
          className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
        >
          <option value="spotlight">Spotlight</option>
          <option value="pan_zoom">Pan & Zoom</option>
          <option value="play_video">Play Video</option>
          <option value="play_audio">Play Audio</option>
          <option value="show_text">Show Text</option>
          <option value="quiz">Quiz</option>
          <option value="transition">Transition (Coming Soon)</option>
          <option value="animate">Animate (Coming Soon)</option>
        </select>
      </div>

      {/* Effect-Specific Settings */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderEffectSettings()}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-700 flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-medium transition-colors"
        >
          Save Effect
        </button>
      </div>
    </div>
  );
};

// Helper function to get default parameters for each effect type
function getDefaultParametersForType(type: SlideEffectType): any {
  switch (type) {
    case 'spotlight':
      return {
        shape: 'circle',
        width: 150,
        height: 150,
        spotlightOpacity: 0,
        backgroundDimPercentage: 70
      };
    
    case 'pan_zoom':
      return {
        zoomLevel: 2,
        smooth: true,
        easing: 'ease-in-out'
      };
    
    case 'play_video':
      return {
        mediaType: 'youtube',
        url: '',
        displayMode: 'modal',
        autoplay: false,
        showControls: true,
        volume: 1
      };
    
    case 'play_audio':
      return {
        mediaType: 'url',
        url: '',
        displayMode: 'modal',
        autoplay: false,
        showControls: true,
        volume: 1
      };
    
    case 'show_text':
      return {
        text: '',
        displayMode: 'modal',
        fontSize: 16,
        textAlign: 'center',
        modalWidth: 400,
        modalPosition: 'center'
      };
    
    case 'quiz':
      return {
        questionType: 'multiple-choice',
        question: '',
        options: ['Option 1', 'Option 2'],
        correctAnswer: 0,
        explanation: '',
        displayMode: 'modal',
        points: 1
      };
    
    default:
      return {};
  }
}

export default EffectSettingsPanel;