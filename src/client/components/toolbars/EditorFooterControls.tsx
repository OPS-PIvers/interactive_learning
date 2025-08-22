import React, { useState, useRef, useEffect } from 'react';
import { Z_INDEX_TAILWIND } from '../../utils/zIndexLevels';
import BackgroundSettingsPopup from '../popups/BackgroundSettingsPopup';
import AspectRatioSettingsPopup from '../popups/AspectRatioSettingsPopup';

interface EditorFooterControlsProps {
  // Background settings
  backgroundImage?: string;
  backgroundType?: 'image' | 'video';
  backgroundVideoType?: 'youtube' | 'mp4';
  onBackgroundImageChange: (url: string) => void;
  onBackgroundTypeChange: (type: 'image' | 'video') => void;
  onBackgroundVideoTypeChange: (type: 'youtube' | 'mp4') => void;
  onReplaceImage: (file: File) => void;
  
  // Aspect ratio settings
  aspectRatio: string;
  developmentMode: 'desktop' | 'mobile';
  onAspectRatioChange: (ratio: string) => void;
  onDevelopmentModeChange: (mode: 'desktop' | 'mobile') => void;
  
  // Hotspot functionality
  onAddHotspot: () => void;
}

/**
 * EditorFooterControls - Modern footer control bar with three main buttons
 * 
 * Features:
 * - Background settings popup with 5 options (None, Color, Image, Video, YouTube)
 * - Aspect ratio popup with 4 main ratios and development mode toggle
 * - Add Hotspot button to open hotspot editor
 * - Matches the design from the HTML mockup with dark blue theme
 * - Responsive design with proper touch targets
 */
const EditorFooterControls: React.FC<EditorFooterControlsProps> = ({
  backgroundImage,
  backgroundType = 'image',
  backgroundVideoType = 'mp4',
  onBackgroundImageChange,
  onBackgroundTypeChange,
  onBackgroundVideoTypeChange,
  onReplaceImage,
  aspectRatio,
  developmentMode,
  onAspectRatioChange,
  onDevelopmentModeChange,
  onAddHotspot
}) => {
  const [backgroundPopupOpen, setBackgroundPopupOpen] = useState(false);
  const [aspectRatioPopupOpen, setAspectRatioPopupOpen] = useState(false);
  
  const backgroundRef = useRef<HTMLDivElement>(null);
  const aspectRatioRef = useRef<HTMLDivElement>(null);

  // Close popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (backgroundRef.current && !backgroundRef.current.contains(event.target as Node)) {
        setBackgroundPopupOpen(false);
      }
      if (aspectRatioRef.current && !aspectRatioRef.current.contains(event.target as Node)) {
        setAspectRatioPopupOpen(false);
      }
    };

    if (backgroundPopupOpen || aspectRatioPopupOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [backgroundPopupOpen, aspectRatioPopupOpen]);

  // Close popups on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setBackgroundPopupOpen(false);
        setAspectRatioPopupOpen(false);
      }
    };

    if (backgroundPopupOpen || aspectRatioPopupOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [backgroundPopupOpen, aspectRatioPopupOpen]);

  const handleBackgroundClick = () => {
    setAspectRatioPopupOpen(false);
    setBackgroundPopupOpen(!backgroundPopupOpen);
  };

  const handleAspectRatioClick = () => {
    setBackgroundPopupOpen(false);
    setAspectRatioPopupOpen(!aspectRatioPopupOpen);
  };

  const handleAddHotspotClick = () => {
    setBackgroundPopupOpen(false);
    setAspectRatioPopupOpen(false);
    onAddHotspot();
  };

  return (
    <footer 
      className={`bg-[#17214a] text-white shadow-md ${Z_INDEX_TAILWIND.TOOLBAR} p-3 flex justify-center items-center space-x-2`}
    >
      {/* Background Button */}
      <div className="relative" ref={backgroundRef}>
        <button
          onClick={handleBackgroundClick}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors min-h-[44px] ${
            backgroundPopupOpen
              ? 'bg-[#545b60] text-white'
              : 'bg-[#687178] hover:bg-[#545b60] text-white'
          }`}
          aria-label="Background settings"
          aria-expanded={backgroundPopupOpen}
        >
          <span className="material-icons text-lg">wallpaper</span>
          <span className="font-medium">Background</span>
        </button>
        
        <BackgroundSettingsPopup
          isOpen={backgroundPopupOpen}
          onClose={() => setBackgroundPopupOpen(false)}
          backgroundImage={backgroundImage || ''}
          backgroundType={backgroundType}
          backgroundVideoType={backgroundVideoType}
          onBackgroundImageChange={onBackgroundImageChange}
          onBackgroundTypeChange={onBackgroundTypeChange}
          onBackgroundVideoTypeChange={onBackgroundVideoTypeChange}
          onReplaceImage={onReplaceImage}
          position="bottom-left"
        />
      </div>

      {/* Aspect Ratio Button */}
      <div className="relative" ref={aspectRatioRef}>
        <button
          onClick={handleAspectRatioClick}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors min-h-[44px] ${
            aspectRatioPopupOpen
              ? 'bg-[#545b60] text-white'
              : 'bg-[#687178] hover:bg-[#545b60] text-white'
          }`}
          aria-label="Aspect ratio settings"
          aria-expanded={aspectRatioPopupOpen}
        >
          <span className="material-icons text-lg">aspect_ratio</span>
          <span className="font-medium">Aspect Ratio</span>
        </button>
        
        <AspectRatioSettingsPopup
          isOpen={aspectRatioPopupOpen}
          onClose={() => setAspectRatioPopupOpen(false)}
          aspectRatio={aspectRatio}
          developmentMode={developmentMode}
          onAspectRatioChange={onAspectRatioChange}
          onDevelopmentModeChange={onDevelopmentModeChange}
          position="bottom-center"
        />
      </div>

      {/* Add Hotspot Button */}
      <button
        onClick={handleAddHotspotClick}
        className="flex items-center space-x-2 px-4 py-2 bg-[#b73031] hover:bg-[#9c2829] text-white rounded-lg transition-colors min-h-[44px]"
        aria-label="Add hotspot"
      >
        <span className="material-icons text-lg">add_circle</span>
        <span className="font-medium">Add Hotspot</span>
      </button>
    </footer>
  );
};

export default EditorFooterControls;