import { useEffect, useRef } from 'react';

type CleanupCallback = () => void;

/**
 * Custom hook to manage cleanup for event listeners or other side effects.
 * It ensures that a cleanup function is called only once when the component
 * unmounts or before the effect runs again.
 *
 * @param cleanupCallback The function to call for cleanup.
 */
export const useEventCleanup = (cleanupCallback: CleanupCallback) => {
  const cleanupRef = useRef(cleanupCallback);

  useEffect(() => {
    cleanupRef.current = cleanupCallback;
  }, [cleanupCallback]);

  useEffect(() => {
    const finalCleanup = () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };

    return finalCleanup;
  }, []);
};
