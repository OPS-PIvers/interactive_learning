/**
 * Secure File Upload Component
 * 
 * Enhanced file upload component with comprehensive security validation.
 * Part of Phase 2 security hardening implementation.
 */

import React, { useState, useCallback } from 'react';
import { validateFileUpload, createSanitizedFile, FileValidationResult } from '../../utils/inputSecurity';

interface SecureFileUploadProps {
  onFileUpload: (file: File) => Promise<void>;
  onError?: (error: string) => void;
  accept?: string;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export const SecureFileUpload: React.FC<SecureFileUploadProps> = ({
  onFileUpload,
  onError,
  accept = 'image/*',
  className = '',
  disabled = false,
  children
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // Validate file security
      const validation: FileValidationResult = validateFileUpload(file);
      
      if (!validation.isValid) {
        const error = validation.error || 'File validation failed';
        setUploadError(error);
        onError?.(error);
        return;
      }

      // Create sanitized file if name was changed
      const finalFile = validation.sanitizedName && validation.sanitizedName !== file.name
        ? createSanitizedFile(file, validation.sanitizedName)
        : file;

      // Upload the validated file
      await onFileUpload(finalFile);
      
      // Clear the input for future uploads
      event.target.value = '';
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }, [onFileUpload, onError]);

  return (
    <div className={`secure-file-upload ${className}`}>
      <input
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        className="hidden"
        id="secure-file-upload"
      />
      
      <label
        htmlFor="secure-file-upload"
        className={`
          cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 
          rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white 
          hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 
          focus:ring-indigo-500 transition-colors
          ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {isUploading ? (
          <>
            <div className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500">
              <div className="rounded-full border-2 border-gray-300 border-t-gray-600 w-full h-full" />
            </div>
            Uploading...
          </>
        ) : (
          children || 'Choose File'
        )}
      </label>

      {uploadError && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          <strong>Upload Error:</strong> {uploadError}
        </div>
      )}

      {/* Security information */}
      <div className="mt-2 text-xs text-gray-500">
        <p>Allowed: JPEG, PNG, WebP, GIF (max 10MB)</p>
        <p>Files are automatically scanned for security</p>
      </div>
    </div>
  );
};