/**
 * Secure image loader that preserves Firebase authentication tokens
 * Works around browser security policies that strip tokens from img src
 */

import React from 'react';

export interface SecureImageOptions {
  onLoad?: () => void;
  onError?: (error: Error) => void;
  timeout?: number;
  crossOrigin?: string | null;
}

/**
 * Load Firebase image using fetch with authentication tokens preserved
 * Then convert to blob URL for safe display
 */
export async function loadSecureFirebaseImage(
url: string,
options: SecureImageOptions = {})
: Promise<string> {
  const { onLoad, onError, timeout = 30000 } = options;

  try {


    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Fetch the image with preserved authentication
      const response = await fetch(url, {
        signal: controller.signal,
        mode: 'cors',
        credentials: 'omit', // Don't send cookies, token is in URL
        cache: 'default'
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Convert to blob
      const blob = await response.blob();

      // Create blob URL for safe display
      const blobUrl = URL.createObjectURL(blob);



      if (onLoad) {
        onLoad();
      }

      return blobUrl;

    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }

  } catch (error) {
    console.error('❌ SecureImageLoader: Failed to load image:', error);

    if (onError) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }

    throw error;
  }
}

/**
 * Cleanup blob URLs to prevent memory leaks
 */
export function cleanupBlobUrl(blobUrl: string): void {
  if (blobUrl && blobUrl.startsWith('blob:')) {
    URL.revokeObjectURL(blobUrl);

  }
}

/**
 * Hook for React components to use secure image loading
 */
export function useSecureImage(url: string | undefined, options: SecureImageOptions = {}) {
  const [secureUrl, setSecureUrl] = React.useState<string | undefined>(undefined);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!url) {
      setSecureUrl(undefined);
      setLoading(false);
      setError(null);
      return;
    }

    // Only use secure loading for Firebase URLs
    if (!url.includes('firebasestorage.googleapis.com')) {
      setSecureUrl(url);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    loadSecureFirebaseImage(url, {
      ...options,
      onLoad: () => {
        setLoading(false);
        if (options.onLoad) options.onLoad();
      },
      onError: (err) => {
        setLoading(false);
        setError(err);
        if (options.onError) options.onError(err);
      }
    }).
    then((blobUrl) => {
      setSecureUrl(blobUrl);
    }).
    catch((err) => {
      setError(err);
      setLoading(false);
    });

    // Cleanup function
    return () => {
      if (secureUrl && secureUrl.startsWith('blob:')) {
        cleanupBlobUrl(secureUrl);
      }
    };
  }, [url, options?.onLoad, options?.onError, options?.timeout, options?.crossOrigin]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (secureUrl && secureUrl.startsWith('blob:')) {
        cleanupBlobUrl(secureUrl);
      }
    };
  }, [secureUrl]);

  return { secureUrl, loading, error };
}