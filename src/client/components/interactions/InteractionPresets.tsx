import React from 'react';
import { InteractionType, interactionPresets } from '../../../shared/InteractionPresets';

interface InteractionPresetsProps {
  onPresetSelect: (type: InteractionType) => void;
  excludeTypes?: InteractionType[];
  isCompact?: boolean;
  className?: string;
}

/**
 * InteractionPresets - Visual preset selection component
 * 
 * Provides a grid of interaction type presets with descriptions
 * for quick interaction creation within the properties panel
 */
const InteractionPresets: React.FC<InteractionPresetsProps> = ({
  onPresetSelect,
  excludeTypes = [],
  isCompact = false,
  className = ''
}) => {
  const availablePresets = Object.entries(interactionPresets).filter(
    ([type]) => !excludeTypes.includes(type as InteractionType)
  );

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-slate-300">
          Interaction Templates
        </h4>
        <span className="text-xs text-slate-400">
          {availablePresets.length} available
        </span>
      </div>
      
      <div className={`grid gap-3 ${isCompact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {availablePresets.map(([type, preset]) => (
          <button
            key={type}
            onClick={() => onPresetSelect(type as InteractionType)}
            className="p-4 text-left border border-slate-600 rounded-lg hover:border-purple-400 hover:bg-purple-500/5 transition-all duration-200 group"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                {preset.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-white text-sm group-hover:text-purple-100 mb-1">
                  {preset.name}
                </div>
                <div className="text-sm text-slate-400 group-hover:text-slate-300 leading-relaxed">
                  {preset.description}
                </div>
                
                {/* Common use cases */}
                <div className="mt-2 pt-2 border-t border-slate-700 group-hover:border-slate-600">
                  <div className="text-xs text-slate-500 group-hover:text-slate-400">
                    {getUseCaseForType(type as InteractionType)}
                  </div>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
      
      {availablePresets.length === 0 && (
        <div className="text-center py-6 text-slate-400">
          <div className="text-2xl mb-2">🎯</div>
          <p className="text-sm">No interaction presets available</p>
        </div>
      )}
    </div>
  );
};

/**
 * Get common use case description for each interaction type
 */
function getUseCaseForType(type: InteractionType): string {
  switch (type) {
    case InteractionType.TOOLTIP:
      return 'Provide contextual help and additional information on hover';
    case InteractionType.TEXT:
      return 'Reveal text content progressively or on demand';
    case InteractionType.SPOTLIGHT:
      return 'Draw attention to important elements or guide user focus';
    case InteractionType.QUIZ:
      return 'Create interactive learning and assessment experiences';
    case InteractionType.AUDIO:
      return 'Background music, narration, or sound effects';
    case InteractionType.VIDEO:
      return 'Video content and multimedia experiences';
    case InteractionType.PAN_ZOOM:
      return 'Allow users to explore detailed images or diagrams';
    default:
      return 'Interactive behavior for enhanced user engagement';
  }
}

export default InteractionPresets;