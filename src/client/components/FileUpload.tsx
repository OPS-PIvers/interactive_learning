
import React, { useCallback, useState } from 'react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  acceptedTypes?: 'image' | 'video' | 'audio' | 'all';
  label?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileUpload, 
  acceptedTypes = 'image',
  label 
}) => {
  const [dragOver, setDragOver] = useState(false);

  const getAcceptString = (): string => {
    switch (acceptedTypes) {
      case 'image':
        return 'image/*';
      case 'video':
        return 'video/*';
      case 'audio':
        return 'audio/*';
      case 'all':
        return 'image/*,video/*,audio/*';
      default:
        return 'image/*';
    }
  };

  const getTypeLabel = (): string => {
    if (label) return label;
    
    switch (acceptedTypes) {
      case 'image':
        return 'image';
      case 'video':
        return 'video';
      case 'audio':
        return 'audio';
      case 'all':
        return 'media file';
      default:
        return 'image';
    }
  };

  const validateFileType = (file: File): boolean => {
    switch (acceptedTypes) {
      case 'image':
        return file.type.startsWith('image/');
      case 'video':
        return file.type.startsWith('video/');
      case 'audio':
        return file.type.startsWith('audio/');
      case 'all':
        return file.type.startsWith('image/') || 
               file.type.startsWith('video/') || 
               file.type.startsWith('audio/');
      default:
        return file.type.startsWith('image/');
    }
  };

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (validateFileType(file)) {
        onFileUpload(file);
      } else {
        alert(`Please select a valid ${getTypeLabel()} file.`);
      }
    }
  }, [onFileUpload, acceptedTypes]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      if (validateFileType(file)) {
        onFileUpload(file);
      } else {
        alert(`Please select a valid ${getTypeLabel()} file.`);
      }
    }
  }, [onFileUpload, acceptedTypes]);

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

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      document.getElementById('file-upload-input')?.click();
    }
  }, []);

  return (
    <div 
      className={`mb-4 p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors duration-200
        ${dragOver ? 'border-purple-500 bg-slate-700' : 'border-slate-600 hover:border-slate-500 bg-slate-700/50'}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => document.getElementById('file-upload-input')?.click()}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={label || `File upload for ${getTypeLabel()}`}
      aria-describedby="file-upload-instructions"
    >
      <input
        id="file-upload-input"
        type="file"
        accept={getAcceptString()}
        onChange={handleFileChange}
        className="hidden"
        aria-describedby="file-upload-instructions" // Keep describedby for context if input is somehow focused
      />
      <p id="file-upload-instructions" className="text-slate-400">
        {dragOver 
          ? `Drop ${getTypeLabel()} here!` 
          : `Drag & drop ${getTypeLabel()} here, or click to select.`
        }
      </p>
    </div>
  );
};

export default FileUpload;
