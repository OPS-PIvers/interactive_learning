import React from 'react';
import LoadingSpinnerIcon from '../icons/LoadingSpinnerIcon';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Initializing module..." 
}) => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <LoadingSpinnerIcon className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
      <div className="text-white text-lg">{message}</div>
    </div>
  </div>
);

export default LoadingScreen;