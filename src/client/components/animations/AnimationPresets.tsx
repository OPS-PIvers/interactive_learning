import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { slideTransitionVariants } from './SlideTransitions';
import { elementAnimationVariants } from './ElementAnimations';

// Animation preset configurations
export interface AnimationPreset {
  id: string;
  name: string;
  description: string;
  category: 'entrance' | 'exit' | 'emphasis' | 'transition';
  variants: any;
  duration: number;
  preview: React.ComponentType<{ isActive: boolean }>;
}

// Create preview components for each animation type
const createPreviewComponent = (variants: any, duration: number = 300) => {
  return ({ isActive }: { isActive: boolean }) => (
    <motion.div
      className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xs font-bold"
      variants={variants}
      initial="initial"
      animate={isActive ? "animate" : "initial"}
      transition={{ duration: duration / 1000 }}
    >
      A
    </motion.div>
  );
};

// Animation presets library
export const animationPresets: AnimationPreset[] = [
  {
    id: 'fade-in',
    name: 'Fade In',
    description: 'Smooth opacity transition',
    category: 'entrance',
    variants: slideTransitionVariants.fade,
    duration: 300,
    preview: createPreviewComponent(slideTransitionVariants.fade, 300)
  },
  {
    id: 'slide-left',
    name: 'Slide Left',
    description: 'Enter from right, exit to left',
    category: 'transition',
    variants: slideTransitionVariants.slideLeft,
    duration: 400,
    preview: createPreviewComponent(slideTransitionVariants.slideLeft, 400)
  },
  {
    id: 'slide-up',
    name: 'Slide Up',
    description: 'Enter from bottom, exit to top',
    category: 'transition',
    variants: slideTransitionVariants.slideUp,
    duration: 400,
    preview: createPreviewComponent(slideTransitionVariants.slideUp, 400)
  },
  {
    id: 'zoom-in',
    name: 'Zoom In',
    description: 'Scale from small to normal',
    category: 'entrance',
    variants: slideTransitionVariants.zoom,
    duration: 350,
    preview: createPreviewComponent(slideTransitionVariants.zoom, 350)
  },
  {
    id: 'bounce',
    name: 'Bounce',
    description: 'Spring-powered entrance',
    category: 'entrance',
    variants: slideTransitionVariants.bounce,
    duration: 600,
    preview: createPreviewComponent(slideTransitionVariants.bounce, 600)
  },
  {
    id: 'flip',
    name: 'Flip',
    description: '3D rotation transition',
    category: 'transition',
    variants: slideTransitionVariants.flip,
    duration: 500,
    preview: createPreviewComponent(slideTransitionVariants.flip, 500)
  },
  {
    id: 'text-reveal',
    name: 'Text Reveal',
    description: 'Slide up with spring animation',
    category: 'entrance',
    variants: elementAnimationVariants.textReveal,
    duration: 400,
    preview: createPreviewComponent(elementAnimationVariants.textReveal, 400)
  },
  {
    id: 'popup',
    name: 'Pop Up',
    description: 'Scale from zero with bounce',
    category: 'emphasis',
    variants: elementAnimationVariants.popup,
    duration: 450,
    preview: createPreviewComponent(elementAnimationVariants.popup, 450)
  },
  {
    id: 'slide-in',
    name: 'Slide In',
    description: 'Horizontal slide with spring',
    category: 'entrance',
    variants: elementAnimationVariants.slideIn,
    duration: 400,
    preview: createPreviewComponent(elementAnimationVariants.slideIn, 400)
  },
  {
    id: 'pulse',
    name: 'Pulse',
    description: 'Continuous scale animation',
    category: 'emphasis',
    variants: elementAnimationVariants.pulse,
    duration: 2000,
    preview: ({ isActive }: { isActive: boolean }) => (
      <motion.div
        className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-white text-xs font-bold"
        animate={isActive ? elementAnimationVariants.pulse.animate : {}}
      >
        P
      </motion.div>
    )
  }
];

interface AnimationPresetsLibraryProps {
  onSelectPreset: (preset: AnimationPreset) => void;
  selectedPresetId?: string;
  category?: 'entrance' | 'exit' | 'emphasis' | 'transition' | 'all';
}

/**
 * AnimationPresetsLibrary - Visual library of animation presets with live previews
 */
export const AnimationPresetsLibrary: React.FC<AnimationPresetsLibraryProps> = ({
  onSelectPreset,
  selectedPresetId,
  category = 'all'
}) => {
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  const filteredPresets = category === 'all' 
    ? animationPresets 
    : animationPresets.filter(preset => preset.category === category);

  const categories = ['all', 'entrance', 'transition', 'emphasis', 'exit'] as const;

  return (
    <div className="animation-presets-library">
      {/* Category filter */}
      <div className="flex gap-2 mb-4">
        {categories.map(cat => (
          <button
            key={cat}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              category === cat
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => {/* Handle category change */}}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Presets grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredPresets.map(preset => {
          const PreviewComponent = preset.preview;
          const isSelected = selectedPresetId === preset.id;
          const isPreviewing = previewingId === preset.id;

          return (
            <motion.div
              key={preset.id}
              className={`preset-card p-4 border rounded-lg cursor-pointer transition-colors ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => onSelectPreset(preset)}
              onMouseEnter={() => setPreviewingId(preset.id)}
              onMouseLeave={() => setPreviewingId(null)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Preview area */}
              <div className="h-16 flex items-center justify-center mb-3 bg-gray-100 rounded-md">
                <PreviewComponent isActive={isPreviewing} />
              </div>

              {/* Preset info */}
              <div className="text-center">
                <h3 className="font-medium text-sm text-gray-900 mb-1">
                  {preset.name}
                </h3>
                <p className="text-xs text-gray-500 mb-2">
                  {preset.description}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    preset.category === 'entrance' ? 'bg-green-400' :
                    preset.category === 'exit' ? 'bg-red-400' :
                    preset.category === 'emphasis' ? 'bg-yellow-400' :
                    'bg-blue-400'
                  }`} />
                  <span className="text-xs text-gray-400">
                    {preset.duration}ms
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Selected preset info */}
      {selectedPresetId && (
        <motion.div
          className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {(() => {
            const preset = animationPresets.find(p => p.id === selectedPresetId);
            return preset ? (
              <div>
                <h4 className="font-medium text-blue-900 mb-2">
                  Selected: {preset.name}
                </h4>
                <p className="text-sm text-blue-700 mb-2">
                  {preset.description}
                </p>
                <div className="flex gap-4 text-xs text-blue-600">
                  <span>Category: {preset.category}</span>
                  <span>Duration: {preset.duration}ms</span>
                </div>
              </div>
            ) : null;
          })()}
        </motion.div>
      )}
    </div>
  );
};

export default AnimationPresetsLibrary;