import React from 'react';
import { HotspotData } from '../../shared/types';

interface SimpleHotspotPreviewProps {
  backgroundImage: string;
  hotspot: HotspotData;
  showPreview?: boolean; // Eye icon toggle state
}

const SimpleHotspotPreview: React.FC<SimpleHotspotPreviewProps> = ({
  backgroundImage,
  hotspot,
  showPreview = false
}) => {
  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      <img
        src={backgroundImage}
        alt="Background"
        className="w-full h-full object-contain"
      />
      
      {/* Render the hotspot */}
      <div
        className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
        style={{
          left: `${hotspot.x}%`,
          top: `${hotspot.y}%`,
        }}
      >
        <span 
          className={`relative inline-flex rounded-full h-5 w-5 ${hotspot.color || 'bg-sky-500'} ${
            showPreview ? 'animate-pulse' : ''
          }`}
        />
      </div>
      
      {/* Preview overlay when eye icon is toggled */}
      {showPreview && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg shadow-lg max-w-xs">
            <h3 className="font-semibold text-gray-900">{hotspot.title}</h3>
            <p className="text-sm text-gray-600 mt-2">
              Preview mode - interactions would appear here
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleHotspotPreview;