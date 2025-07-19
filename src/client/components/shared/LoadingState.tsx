import React from 'react';
import SkeletonLoader, { ImageSkeleton, TextSkeleton, CardSkeleton } from './SkeletonLoader';

interface LoadingStateProps {
  type?: 'spinner' | 'skeleton' | 'dots' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'spinner',
  size = 'md',
  message,
  className = '',
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-12 h-12';
      default:
        return 'w-8 h-8';
    }
  };

  const renderSpinner = () => (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${getSizeClasses()}`} />
      {message && (
        <p className="text-gray-600 text-sm animate-pulse">{message}</p>
      )}
    </div>
  );

  const renderDots = () => (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      {message && (
        <p className="text-gray-600 text-sm">{message}</p>
      )}
    </div>
  );

  const renderPulse = () => (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className={`bg-blue-600 rounded-full animate-pulse ${getSizeClasses()}`} />
      {message && (
        <p className="text-gray-600 text-sm animate-pulse">{message}</p>
      )}
    </div>
  );

  const renderSkeleton = () => (
    <div className={`space-y-4 ${className}`}>
      <SkeletonLoader lines={3} />
      {message && (
        <p className="text-gray-600 text-sm text-center">{message}</p>
      )}
    </div>
  );

  switch (type) {
    case 'dots':
      return renderDots();
    case 'pulse':
      return renderPulse();
    case 'skeleton':
      return renderSkeleton();
    default:
      return renderSpinner();
  }
};

// Specialized loading components for common use cases
export const ModuleLoadingState: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-6 ${className}`}>
    <div className="space-y-4">
      <ImageSkeleton className="w-full h-48" />
      <TextSkeleton lines={2} />
      <div className="flex gap-2">
        <SkeletonLoader width="100px" height="40px" rounded />
        <SkeletonLoader width="100px" height="40px" rounded />
      </div>
    </div>
  </div>
);

export const HotspotLoadingState: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: 3 }).map((_, index) => (
      <CardSkeleton key={index} />
    ))}
  </div>
);

export const TimelineLoadingState: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex gap-2 ${className}`}>
    {Array.from({ length: 8 }).map((_, index) => (
      <SkeletonLoader
        key={index}
        width="40px"
        height="40px"
        rounded
        className="flex-shrink-0"
      />
    ))}
  </div>
);

export default LoadingState;