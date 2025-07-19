import React from 'react';
import LoadingSpinnerIcon from '../icons/LoadingSpinnerIcon';

interface LazyLoadingFallbackProps {
  type?: 'modal' | 'component' | 'media';
  message?: string;
}

const LazyLoadingFallback: React.FC<LazyLoadingFallbackProps> = ({ 
  type = 'component',
  message 
}) => {
  const getDefaultMessage = () => {
    switch (type) {
      case 'modal':
        return 'Loading editor...';
      case 'media':
        return 'Loading media player...';
      default:
        return 'Loading component...';
    }
  };

  return (
    <div className="flex items-center justify-center p-4 min-h-[100px]">
      <div className="flex items-center space-x-3 text-slate-400">
        <LoadingSpinnerIcon className="w-5 h-5 animate-spin" />
        <span className="text-sm">{message || getDefaultMessage()}</span>
      </div>
    </div>
  );
};

export default LazyLoadingFallback;