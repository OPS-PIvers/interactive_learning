import React, { useCallback, useState } from 'react';
import { BackgroundMedia } from '../../../shared/slideTypes';

interface ImageUploadProps {
  onUpload: (media: BackgroundMedia) => void;
  currentMedia?: BackgroundMedia;
  maxSizeMB?: number;
}

export default function ImageUpload({
  onUpload,
  currentMedia,
  maxSizeMB = 10
}: ImageUploadProps) {
  
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  
  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file';
    }
    
    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size must be less than ${maxSizeMB}MB`;
    }
    
    return null;
  };
  
  const uploadFile = async (file: File): Promise<BackgroundMedia> => {
    // TODO: Implement Firebase Storage upload
    // For now, create object URL for local development
    
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      
      // Create image to get dimensions
      const img = new Image();
      img.onload = () => {
        resolve({
          type: 'image',
          url,
          alt: file.name,
          width: img.width,
          height: img.height
        });
      };
      img.src = url;
    });
  };
  
  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file) return;
    
    const error = validateFile(file);
    
    if (error) {
      alert(error);
      return;
    }
    
    setUploading(true);
    
    try {
      const media = await uploadFile(file);
      onUpload(media);
    } catch (err) {
      alert('Upload failed. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  }, [onUpload]);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);
  
  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);
  
  return (
    <div className="space-y-4">
      {/* Current Image */}
      {currentMedia?.url && (
        <div className="relative">
          <img
            src={currentMedia.url}
            alt={currentMedia.alt}
            className="w-full h-48 object-cover rounded-lg border border-gray-200"
          />
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
            {currentMedia.width} × {currentMedia.height}
          </div>
        </div>
      )}
      
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver
            ? 'border-blue-500 bg-blue-50'
            : uploading
            ? 'border-gray-300 bg-gray-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        {uploading ? (
          <div className="space-y-2">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-600">Uploading...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            
            <div>
              <p className="text-gray-700 font-medium">
                Drop an image here, or{' '}
                <button
                  onClick={() => document.getElementById('file-input')?.click()}
                  className="text-blue-600 hover:text-blue-700 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                >
                  browse
                </button>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Supports JPG, PNG, GIF up to {maxSizeMB}MB
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Hidden File Input */}
      <input
        id="file-input"
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files && e.target.files.length > 0 && handleFileSelect(e.target.files)}
        className="hidden"
      />
    </div>
  );
}