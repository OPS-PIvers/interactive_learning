
import React, { useCallback, useState, useRef } from 'react';
import { validateFileUpload, createSanitizedFile, FileValidationResult } from '../../utils/inputSecurity';

interface FileUploadProps {
  onFileUpload: (file: File) => Promise<void>;
  acceptedTypes?: 'image' | 'video' | 'audio' | 'all';
  label?: string;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  acceptedTypes = 'image',
  label,
  disabled = false,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAcceptString = (): string => {
    switch (acceptedTypes) {
      case 'image':
        return 'image/jpeg,image/png,image/webp,image/gif';
      case 'video':
        return 'video/*';
      case 'audio':
        return 'audio/*';
      case 'all':
        return 'image/jpeg,image/png,image/webp,image/gif,video/*,audio/*';
      default:
        return 'image/jpeg,image/png,image/webp,image/gif';
    }
  };

  const getTypeLabel = useCallback((): string => {
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
  }, [label, acceptedTypes]);

  const handleFile = useCallback(async (file: File | null) => {
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const validation: FileValidationResult = validateFileUpload(file);

      if (!validation.isValid) {
        const error = validation.error || 'File validation failed';
        setUploadError(error);
        return;
      }

      const finalFile = validation.sanitizedName && validation.sanitizedName !== file.name
        ? createSanitizedFile(file, validation.sanitizedName)
        : file;

      await onFileUpload(finalFile);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(errorMessage);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [onFileUpload]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0] || null);
  }, [handleFile]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
    if (disabled || isUploading) return;
    handleFile(event.dataTransfer?.files?.[0] || null);
  }, [handleFile, disabled, isUploading]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled || isUploading) return;
    setDragOver(true);
  }, [disabled, isUploading]);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
  }, []);

  const handleClick = () => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  }

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  const isDisabled = disabled || isUploading;

  return (
    <div>
      <div
        className={`mb-4 p-6 border-2 border-dashed rounded-lg text-center transition-colors duration-200
          ${isDisabled ? 'cursor-not-allowed bg-slate-800 border-slate-700' : 'cursor-pointer'}
          ${dragOver && !isDisabled ? 'border-purple-500 bg-slate-700' : 'border-slate-600 hover:border-slate-500 bg-slate-700/50'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        aria-label={label || `File upload for ${getTypeLabel()}`}
        aria-describedby="file-upload-instructions"
        aria-disabled={isDisabled}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptString()}
          onChange={handleFileChange}
          className="hidden"
          disabled={isDisabled}
        />
        {isUploading ? (
          <div className="flex items-center justify-center text-slate-400">
            <div className="animate-spin mr-3 h-5 w-5 border-2 border-slate-500 border-t-purple-500 rounded-full" />
            Uploading...
          </div>
        ) : (
          <p id="file-upload-instructions" className="text-slate-400">
            {dragOver
              ? `Drop ${getTypeLabel()} here!`
              : `Drag & drop ${getTypeLabel()} here, or click to select.`
            }
          </p>
        )}
      </div>
      {uploadError && (
        <div className="mt-2 text-sm text-red-500 bg-red-900/20 border border-red-500/30 rounded-md p-2">
          <strong>Upload Error:</strong> {uploadError}
        </div>
      )}
      <div className="mt-2 text-xs text-gray-500">
        <p>Allowed: JPEG, PNG, WebP, GIF (max 10MB)</p>
        <p>Files are automatically scanned for security</p>
      </div>
    </div>
  );
};

export default FileUpload;
