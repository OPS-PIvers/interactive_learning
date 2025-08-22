import React, { useState, useEffect } from 'react';
import { SlideElement, ElementInteraction, SlideEffect } from '../../../../shared/slideTypes';
import { ResponsiveModal } from '../../responsive/ResponsiveModal';

interface HotspotEditorModalProps {
  hotspot: SlideElement;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedHotspot: SlideElement) => void;
  onDelete: (hotspotId: string) => void;
}

/**
 * Modern HotspotEditorModal - Clean hotspot editor using current slide types
 * 
 * Features:
 * - Effect configuration (spotlight, text, video, quiz, etc.)
 * - Position and size controls
 * - Interaction settings
 * - Direct SlideElement updates (no legacy conversions)
 */
const HotspotEditorModal: React.FC<HotspotEditorModalProps> = ({
  hotspot,
  isOpen,
  onClose,
  onSave,
  onDelete
}) => {
  const [title, setTitle] = useState(hotspot.content?.title || 'Untitled Hotspot');
  const [description, setDescription] = useState(hotspot.content?.description || '');
  const [selectedEffectType, setSelectedEffectType] = useState<string>('spotlight');
  
  // Initialize with existing interaction if available
  const existingInteraction = hotspot.interactions?.[0];
  const [effectParameters, setEffectParameters] = useState<Record<string, any>>(() => {
    if (existingInteraction?.effect) {
      return existingInteraction.effect.parameters || {};
    }
    return { shape: 'circle', intensity: 70 }; // Default spotlight params
  });

  useEffect(() => {
    if (existingInteraction?.effect) {
      setSelectedEffectType(existingInteraction.effect.type);
      setEffectParameters(existingInteraction.effect.parameters || {});
    }
  }, [existingInteraction]);

  const handleSave = () => {
    // Create effect parameters based on type
    let finalParameters: any = {};
    
    switch (selectedEffectType) {
      case 'spotlight':
        finalParameters = {
          position: { x: 0, y: 0, width: 100, height: 100 }, // Default position
          shape: effectParameters['shape'] || 'circle',
          intensity: effectParameters['intensity'] || 70,
          fadeEdges: true,
          message: effectParameters['message']
        };
        break;
      case 'text':
        finalParameters = {
          text: effectParameters['text'] || '',
          position: { x: 0, y: 0, width: 200, height: 100 }, // Default position  
          style: { fontSize: 16, color: '#000000' }, // Default style
          displayMode: effectParameters['displayMode'] || 'modal'
        };
        break;
      case 'video':
        finalParameters = {
          videoSource: effectParameters['videoSource'] || 'url',
          videoUrl: effectParameters['videoUrl'],
          youtubeVideoId: effectParameters['youtubeVideoId'],
          displayMode: 'modal',
          showControls: true,
          autoplay: false
        };
        break;
      case 'quiz':
        finalParameters = {
          question: effectParameters['question'] || '',
          questionType: effectParameters['questionType'] || 'multiple-choice',
          choices: effectParameters['choices'] || [],
          correctAnswer: effectParameters['correctAnswer'] || 0,
          allowMultipleAttempts: true,
          resumeAfterCompletion: true
        };
        break;
      default:
        finalParameters = effectParameters;
    }

    const updatedHotspot: SlideElement = {
      ...hotspot,
      content: {
        ...hotspot.content,
        title,
        description
      },
      interactions: [{
        id: existingInteraction?.id || `interaction-${Date.now()}`,
        trigger: 'click',
        effect: {
          id: `effect-${Date.now()}`,
          type: selectedEffectType as any,
          duration: 3000,
          parameters: finalParameters
        }
      }]
    };
    
    onSave(updatedHotspot);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this hotspot?')) {
      onDelete(hotspot.id);
    }
  };

  const renderEffectParameters = () => {
    switch (selectedEffectType) {
      case 'spotlight':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shape</label>
              <select 
                value={effectParameters['shape'] || 'circle'}
                onChange={(e) => setEffectParameters(prev => ({ ...prev, shape: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="circle">Circle</option>
                <option value="rectangle">Rectangle</option>
                <option value="oval">Oval</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Intensity: {effectParameters['intensity'] || 70}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={effectParameters['intensity'] || 70}
                onChange={(e) => setEffectParameters(prev => ({ ...prev, intensity: Number(e.target.value) }))}
                className="w-full"
              />
            </div>
          </div>
        );
        
      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Text to Display</label>
              <textarea 
                value={effectParameters['text'] || ''}
                onChange={(e) => setEffectParameters(prev => ({ ...prev, text: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2 h-20"
                placeholder="Enter text to display..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Mode</label>
              <select 
                value={effectParameters['displayMode'] || 'modal'}
                onChange={(e) => setEffectParameters(prev => ({ ...prev, displayMode: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="modal">Modal</option>
                <option value="tooltip">Tooltip</option>
                <option value="overlay">Overlay</option>
              </select>
            </div>
          </div>
        );
        
      case 'video':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Video Source</label>
              <select 
                value={effectParameters['videoSource'] || 'url'}
                onChange={(e) => setEffectParameters(prev => ({ ...prev, videoSource: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="url">URL</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>
            {effectParameters['videoSource'] === 'youtube' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">YouTube Video ID</label>
                <input
                  type="text"
                  value={effectParameters['youtubeVideoId'] || ''}
                  onChange={(e) => setEffectParameters(prev => ({ ...prev, youtubeVideoId: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="e.g. dQw4w9WgXcQ"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
                <input
                  type="url"
                  value={effectParameters['videoUrl'] || ''}
                  onChange={(e) => setEffectParameters(prev => ({ ...prev, videoUrl: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="https://example.com/video.mp4"
                />
              </div>
            )}
          </div>
        );
        
      case 'quiz':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
              <input
                type="text"
                value={effectParameters['question'] || ''}
                onChange={(e) => setEffectParameters(prev => ({ ...prev, question: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Enter your question..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
              <select 
                value={effectParameters['questionType'] || 'multiple-choice'}
                onChange={(e) => setEffectParameters(prev => ({ ...prev, questionType: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="multiple-choice">Multiple Choice</option>
                <option value="true-false">True/False</option>
                <option value="fill-in-the-blank">Fill in the Blank</option>
              </select>
            </div>
            {effectParameters['questionType'] === 'multiple-choice' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Choices (one per line)</label>
                <textarea 
                  value={(effectParameters['choices'] as string[])?.join('\n') || ''}
                  onChange={(e) => setEffectParameters(prev => ({ 
                    ...prev, 
                    choices: e.target.value.split('\n').filter(c => c.trim())
                  }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 h-20"
                  placeholder="Option A&#10;Option B&#10;Option C"
                />
              </div>
            )}
          </div>
        );
        
      default:
        return (
          <div className="text-gray-500 text-sm">
            Select an effect type to configure its parameters.
          </div>
        );
    }
  };

  return (
    <ResponsiveModal
      type="properties"
      size="fullscreen"
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Hotspot"
    >
      <div className="p-4 sm:p-6 space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Hotspot title..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 h-20"
              placeholder="Optional description..."
            />
          </div>
        </div>

        {/* Effect Configuration */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Effect Type</label>
            <select 
              value={selectedEffectType}
              onChange={(e) => setSelectedEffectType(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="spotlight">Spotlight</option>
              <option value="text">Show Text</option>
              <option value="video">Play Video</option>
              <option value="quiz">Quiz</option>
              <option value="pan_zoom">Pan & Zoom</option>
              <option value="tooltip">Tooltip</option>
            </select>
          </div>
          
          {renderEffectParameters()}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm sm:text-base"
          >
            Delete
          </button>
          
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm sm:text-base"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default HotspotEditorModal;