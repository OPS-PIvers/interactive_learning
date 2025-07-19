import React, { useId, useState } from 'react';
import { compressImage } from '../../utils/imageCompression';

interface MobileMediaUploadProps {
  label: string;
  onUpload: (file: File) => void;
  acceptedTypes?: string;
  maxSizeBytes?: number;
  className?: string;
}

export const MobileMediaUpload: React.FC<MobileMediaUploadProps> = ({
  label,
  onUpload,
  acceptedTypes = 'image/*,video/*,audio/*',
  maxSizeBytes = 10 * 1024 * 1024, // 10MB default
  className = ''
}) => {
  const id = useId();
  const [isCompressing, setIsCompressing] = useState(false);
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > maxSizeBytes) {
        alert(`File size must be less than ${Math.round(maxSizeBytes / (1024 * 1024))}MB`);
        return;
      }

      if (file.type.startsWith('image/')) {
        setIsCompressing(true);
        try {
          const compressedFile = await compressImage(file);
          onUpload(compressedFile);
        } finally {
          setIsCompressing(false);
        }
      } else {
        onUpload(file);
      }
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor={id}>{label}</label>
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor={id}
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-lg cursor-pointer bg-slate-800 hover:bg-slate-700"
          aria-label={label}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {isCompressing ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-sm text-gray-400">Compressing image...</p>
              </>
            ) : (
              <>
                <svg
                  className="w-10 h-10 mb-3 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h2a4 4 0 014 4v1m-4 8l-4-4m0 0l-4 4m4-4v12"
                  ></path>
                </svg>
                <p className="mb-2 text-sm text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
              </>
            )}
          </div>
          <input 
            id={id} 
            type="file" 
            accept={acceptedTypes}
            className="hidden" 
            onChange={handleFileChange} 
          />
        </label>
      </div>
    </div>
  );
};
