
import React, { useCallback, useState } from 'react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onFileUpload(event.target.files[0]);
    }
  }, [onFileUpload]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      onFileUpload(event.dataTransfer.files[0]);
    }
  }, [onFileUpload]);

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

  return (
    <div 
      className={`mb-4 p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors duration-200
        ${dragOver ? 'border-purple-500 bg-slate-700' : 'border-slate-600 hover:border-slate-500 bg-slate-700/50'}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => document.getElementById('file-upload-input')?.click()}
    >
      <input
        id="file-upload-input"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <p className="text-slate-400">
        {dragOver ? 'Drop image here!' : 'Drag & drop background image here, or click to select.'}
      </p>
    </div>
  );
};

export default FileUpload;
