import React, { useState, useCallback } from 'react';
import { PlusIcon } from './icons/PlusIcon';

interface ImageControlsProps {
  backgroundImage?: string;
  onImageUpload: (file: File) => void;
  onImageFit?: (fitMode: 'cover' | 'contain' | 'fill') => void;
  currentFitMode?: 'cover' | 'contain' | 'fill';
  viewportZoom?: number;
  onViewportZoomChange?: (zoom: number) => void;
}

const ImageControls: React.FC<ImageControlsProps> = ({ 
  backgroundImage, 
  onImageUpload, 
  onImageFit,
  currentFitMode = 'cover',
  viewportZoom = 1,
  onViewportZoomChange
}) => {
  const [showReplaceUpload, setShowReplaceUpload] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onImageUpload(event.target.files[0]);
      setShowReplaceUpload(false);
    }
  }, [onImageUpload]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      onImageUpload(event.dataTransfer.files[0]);
      setShowReplaceUpload(false);
    }
  }, [onImageUpload]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
  }, []);

  if (!backgroundImage) {
    return null; // FileUpload component will handle initial upload
  }

  return (
    <div className="mb-4 p-4 bg-slate-800 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-lg font-semibold text-slate-100">Image Settings</h4>
        <button
          onClick={() => setShowReplaceUpload(!showReplaceUpload)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1 transition-colors"
          title="Replace the current background image"
        >
          <PlusIcon className="w-4 h-4" />
          <span>{showReplaceUpload ? 'Cancel' : 'Replace Image'}</span>
        </button>
      </div>

      {/* Image Fit Controls Commented Out
      <div className="mb-3">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Image Display Mode
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onImageFit?.('cover')}
            className={`p-2 rounded text-sm transition-colors ${
              currentFitMode === 'cover' 
                ? 'bg-purple-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Cover
          </button>
          <button
            onClick={() => onImageFit?.('contain')}
            className={`p-2 rounded text-sm transition-colors ${
              currentFitMode === 'contain' 
                ? 'bg-purple-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Contain
          </button>
          <button
            onClick={() => onImageFit?.('fill')}
            className={`p-2 rounded text-sm transition-colors ${
              currentFitMode === 'fill' 
                ? 'bg-purple-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Fill
          </button>
        </div>
        <div className="mt-2 text-xs text-slate-400">
          <div className="space-y-1">
            <p><strong>Cover:</strong> Fills area completely, may crop image (recommended)</p>
            <p><strong>Contain:</strong> Shows entire image, may have letterboxing</p>
            <p><strong>Fill:</strong> Stretches image to fill exactly (may distort)</p>
          </div>
        </div>
      </div>
      */}

      {/* Viewport Zoom Controls Commented Out
      {onViewportZoomChange && (
        <div className="mb-3">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Viewport Zoom ({Math.round(viewportZoom * 100)}%)
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onViewportZoomChange(Math.max(0.25, viewportZoom - 0.25))}
              className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-2 rounded text-sm transition-colors"
              title="Zoom out"
            >
              -
            </button>
            <div className="flex-1">
              <input
                type="range"
                min="0.25"
                max="3"
                step="0.25"
                value={viewportZoom}
                onChange={(e) => onViewportZoomChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            <button
              onClick={() => onViewportZoomChange(Math.min(3, viewportZoom + 0.25))}
              className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-2 rounded text-sm transition-colors"
              title="Zoom in"
            >
              +
            </button>
            <button
              onClick={() => onViewportZoomChange(1)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm transition-colors"
              title="Reset zoom"
            >
              Reset
            </button>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            <p><strong>Viewport Zoom:</strong> Scales the entire image view like a magnifying glass</p>
          </div>
        </div>
      )}
      */}

      {/* Image Replacement Upload */}
      {showReplaceUpload && (
        <div className="border-t border-slate-600 pt-3">
          <div 
            className={`p-4 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors duration-200
              ${dragOver ? 'border-purple-500 bg-slate-700' : 'border-slate-600 hover:border-slate-500 bg-slate-700/50'}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById('replace-image-input')?.click()}
          >
            <input
              id="replace-image-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="text-slate-400 text-sm">
              {dragOver ? 'Drop new image here!' : 'Drag & drop new image or click to select'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              This will replace the current background image
            </p>
          </div>
          <div className="flex justify-end mt-2">
            <button
              onClick={() => setShowReplaceUpload(false)}
              className="text-slate-400 hover:text-slate-300 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageControls;