import React from 'react';

interface ErrorScreenProps {
  error: Error;
  onReload?: () => void;
  title?: string;
}

const ErrorScreen: React.FC<ErrorScreenProps> = ({ 
  error, 
  onReload, 
  title = "Initialization Error" 
}) => (
  <div className="flex items-center justify-center h-full">
    <div className="bg-red-800 text-white p-6 rounded-lg max-w-md">
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="mb-4">{error.message}</p>
      <button
        onClick={onReload || (() => window.location.reload())}
        className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded transition-colors"
      >
        Reload Page
      </button>
    </div>
  </div>
);

export default ErrorScreen;