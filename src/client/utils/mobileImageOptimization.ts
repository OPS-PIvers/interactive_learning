// This utility will handle mobile image optimization strategies.
// For now, it's a placeholder.

import { TimelineEventData } from '../../shared/types';

interface ImageOptimizationOptions {
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  width?: number;
  height?: number;
}

export const optimizeImageUrl = (
  imageUrl: string,
  options: ImageOptimizationOptions = {}
): string => {
  // In a real implementation, this would use a service like Cloudinary,
  // Akamai Image Manager, or a custom serverless function to resize
  // and optimize images on the fly.
  // For now, we'll just return the original URL.

  const queryParams = new URLSearchParams();
  if (options.quality) queryParams.set('q', String(options.quality));
  if (options.format) queryParams.set('fm', options.format);
  if (options.width) queryParams.set('w', String(options.width));
  if (options.height) queryParams.set('h', String(options.height));

  const queryString = queryParams.toString();

  if (queryString) {
    return `${imageUrl}?${queryString}`;
  }

  return imageUrl;
};

export const getProgressiveImageUrl = (imageUrl: string) => {
  // This would return a very low-quality placeholder image first,
  // which would then be replaced by the full-quality image.
  return {
    placeholder: optimizeImageUrl(imageUrl, { quality: 20, width: 100 }),
    full: optimizeImageUrl(imageUrl, { quality: 80 }),
  };
};

export const optimizeImageForMobile = (imageUrl: string): string => {
  // Validate input
  if (!imageUrl || typeof imageUrl !== 'string') {
    return imageUrl;
  }

  try {
    const url = new URL(imageUrl);
    
    // NEVER optimize Firebase Storage URLs - they need specific CORS handling
    if (url.hostname.includes('firebasestorage.googleapis.com') || 
        url.hostname.includes('firebase.com') ||
        url.hostname.includes('appspot.com')) {
      console.log('Skipping optimization for Firebase Storage URL:', imageUrl);
      return imageUrl; // Return original URL unchanged
    }
    
    // Check if URL already has optimization parameters
    if (url.searchParams.has('w') || url.searchParams.has('q')) {
      return imageUrl; // Return as-is if already optimized
    }
    
    // Only optimize for proven compatible domains
    const compatibleDomains = ['cloudinary.com', 'imgix.com'];
    const isCompatible = compatibleDomains.some(domain => url.hostname.includes(domain));
    
    if (!isCompatible) {
      return imageUrl; // Return original for unknown domains
    }
    
    // Add mobile optimization parameters only for compatible services
    url.searchParams.set('w', '800');  // Max width
    url.searchParams.set('q', '85');   // Quality
    
    return url.toString();
  } catch (error) {
    // If URL parsing fails, return original
    console.warn('Failed to parse image URL:', error);
    return imageUrl;
  }
};

export const preloadNextStepContent = (
  currentStep: number,
  timelineEvents: TimelineEventData[]
): void => {
  const nextStep = currentStep + 1;
  const nextStepEvents = timelineEvents.filter(event => event.step === nextStep);
  
  nextStepEvents.forEach(event => {
    if (event.imageUrl) {
      const optimizedUrl = optimizeImageForMobile(event.imageUrl);
      const img = new Image();
      img.src = optimizedUrl;
    }
  });
};

export const preloadCriticalImages = (
  timelineEvents: TimelineEventData[],
  currentStep: number = 1
): void => {
  // Preload images for current step and next 2 steps
  const stepsToPreload = [currentStep, currentStep + 1, currentStep + 2];
  
  stepsToPreload.forEach(step => {
    const stepEvents = timelineEvents.filter(event => event.step === step);
    stepEvents.forEach(event => {
      if (event.imageUrl) {
        const optimizedUrl = optimizeImageForMobile(event.imageUrl);
        const img = new Image();
        img.src = optimizedUrl;
      }
      if (event.mediaUrl && event.mediaType === 'image') {
        const optimizedUrl = optimizeImageForMobile(event.mediaUrl);
        const img = new Image();
        img.src = optimizedUrl;
      }
    });
  });
};

export const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.85): Promise<Blob> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      const { width, height } = img;
      const aspectRatio = width / height;
      
      let newWidth = width;
      let newHeight = height;
      
      if (width > maxWidth) {
        newWidth = maxWidth;
        newHeight = maxWidth / aspectRatio;
      }
      
      // Set canvas size
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, newWidth, newHeight);
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/webp', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};
