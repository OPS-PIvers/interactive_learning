import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: boolean;
  lines?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className = '',
  width = '100%',
  height = '1rem',
  rounded = false,
  lines = 1,
}) => {
  const skeletonClass = `
    animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 
    bg-size-200 animate-shimmer
    ${rounded ? 'rounded-full' : 'rounded'}
    ${className}
  `;

  if (lines === 1) {
    return (
      <div 
        className={skeletonClass}
        style={{ width, height }}
        role="status"
        aria-label="Loading..."
      />
    );
  }

  return (
    <div className="space-y-2" role="status" aria-label="Loading...">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={skeletonClass}
          style={{ 
            width: index === lines - 1 ? `${75 + Math.random() * 25}%` : width,
            height 
          }}
        />
      ))}
    </div>
  );
};

// Specialized skeleton components for common use cases
export const ImageSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <SkeletonLoader
    className={`aspect-video ${className}`}
    width="100%"
    height="100%"
    rounded={false}
  />
);

export const TextSkeleton: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 3, 
  className = '' 
}) => (
  <SkeletonLoader
    className={className}
    lines={lines}
    height="1rem"
  />
);

export const ButtonSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <SkeletonLoader
    className={`px-4 py-2 ${className}`}
    width="auto"
    height="2.5rem"
    rounded={true}
  />
);

export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-4 border rounded-lg ${className}`}>
    <div className="space-y-3">
      <SkeletonLoader width="60%" height="1.25rem" />
      <TextSkeleton lines={2} />
      <div className="flex gap-2">
        <ButtonSkeleton />
        <ButtonSkeleton />
      </div>
    </div>
  </div>
);

export default SkeletonLoader;