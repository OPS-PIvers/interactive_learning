import React, { useId } from 'react';

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
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > maxSizeBytes) {
        alert(`File size must be less than ${Math.round(maxSizeBytes / (1024 * 1024))}MB`);
        return;
      }
      onUpload(file);
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor={id}
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-lg cursor-pointer bg-slate-800 hover:bg-slate-700"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg
              className="w-10 h-10 mb-3 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
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
