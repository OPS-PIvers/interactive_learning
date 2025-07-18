import React, { useState, useEffect } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { optimizeImageForMobile, getProgressiveImageUrl } from '../utils/mobileImageOptimization';
import { useIsMobile } from '../hooks/useIsMobile';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
  style?: React.CSSProperties;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder,
  onLoad,
  onError,
  style = {}
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  
  const isMobile = useIsMobile();
  const { ref, isIntersecting, hasIntersected } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
    freezeOnceVisible: true
  });

  useEffect(() => {
    if (isIntersecting || hasIntersected) {
      const optimizedSrc = isMobile ? optimizeImageForMobile(src) : src;
      
      if (isMobile && !placeholder) {
        // Use progressive loading for mobile
        const { placeholder: placeholderSrc, full: fullSrc } = getProgressiveImageUrl(src);
        
        // Load placeholder first
        const placeholderImg = new Image();
        placeholderImg.onload = () => {
          setImageSrc(placeholderSrc);
          setShowPlaceholder(false);
          
          // Then load full image
          const fullImg = new Image();
          fullImg.onload = () => {
            setImageSrc(fullSrc);
            setImageStatus('loaded');
            onLoad?.();
          };
          fullImg.onerror = () => {
            setImageStatus('error');
            onError?.();
          };
          fullImg.src = fullSrc;
        };
        placeholderImg.src = placeholderSrc;
      } else {
        // Standard loading
        const img = new Image();
        img.onload = () => {
          setImageSrc(optimizedSrc);
          setImageStatus('loaded');
          setShowPlaceholder(false);
          onLoad?.();
        };
        img.onerror = () => {
          setImageStatus('error');
          setShowPlaceholder(false);
          onError?.();
        };
        img.src = optimizedSrc;
      }
    }
  }, [isIntersecting, hasIntersected, src, isMobile, placeholder, onLoad, onError]);

  if (imageStatus === 'error') {
    return (
      <div 
        ref={ref}
        className={`flex items-center justify-center bg-gray-200 text-gray-500 ${className}`}
        style={style}
      >
        <span className="text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <div ref={ref} className={`relative ${className}`} style={style}>
      {showPlaceholder && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          {placeholder ? (
            <img src={placeholder} alt={alt} className="w-full h-full object-cover opacity-50" />
          ) : (
            <div className="w-8 h-8 bg-gray-300 rounded"></div>
          )}
        </div>
      )}
      
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageStatus === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ transition: 'opacity 0.3s ease-in-out' }}
        />
      )}
    </div>
  );
};