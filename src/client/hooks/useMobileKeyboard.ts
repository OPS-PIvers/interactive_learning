import { useEffect, useCallback, useRef } from 'react';
import { getKeyboardHeight, isKeyboardVisible, isMobileDevice } from '../utils/mobileUtils';

interface KeyboardInfo {
  isVisible: boolean;
  height: number;
}

interface UseMobileKeyboardOptions {
  onKeyboardShow?: (height: number) => void;
  onKeyboardHide?: () => void;
  threshold?: number; // Minimum height to consider keyboard visible
  debounceMs?: number; // Debounce rapid changes
}

export const useMobileKeyboard = (options: UseMobileKeyboardOptions = {}) => {
  const {
    onKeyboardShow,
    onKeyboardHide,
    threshold = 100,
    debounceMs = 150
  } = options;

  const keyboardInfoRef = useRef<KeyboardInfo>({ isVisible: false, height: 0 });
  const debounceTimerRef = useRef<number | null>(null);

  const updateKeyboardState = useCallback((keyboardHeight: number) => {
    const isVisible = keyboardHeight > threshold;
    const previousState = keyboardInfoRef.current;
    
    // Update CSS custom properties for dynamic styling
    document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
    
    // Update content height calculation
    const contentHeight = window.innerHeight - keyboardHeight;
    document.documentElement.style.setProperty('--content-height', `${contentHeight}px`);
    
    // Add/remove keyboard classes on body for global styling
    if (isVisible && !previousState.isVisible) {
      document.body.classList.add('keyboard-open');
      onKeyboardShow?.(keyboardHeight);
    } else if (!isVisible && previousState.isVisible) {
      document.body.classList.remove('keyboard-open');
      onKeyboardHide?.();
    }
    
    keyboardInfoRef.current = { isVisible, height: keyboardHeight };
    
    return { isVisible, height: keyboardHeight };
  }, [threshold, onKeyboardShow, onKeyboardHide]);

  const handleViewportChange = useCallback(() => {
    if (!isMobileDevice()) return;

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce the update to avoid excessive calculations
    debounceTimerRef.current = window.setTimeout(() => {
      const keyboardHeight = getKeyboardHeight();
      updateKeyboardState(keyboardHeight);
    }, debounceMs);
  }, [updateKeyboardState, debounceMs]);

  const getCurrentKeyboardInfo = useCallback((): KeyboardInfo => {
    return { ...keyboardInfoRef.current };
  }, []);

  useEffect(() => {
    if (!isMobileDevice()) return;

    // Initial state
    const initialHeight = getKeyboardHeight();
    updateKeyboardState(initialHeight);

    // Listen for viewport changes
    window.addEventListener('resize', handleViewportChange);
    
    // Listen to visual viewport changes for better mobile support
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    }

    // Also listen for orientationchange
    window.addEventListener('orientationchange', handleViewportChange);

    // Listen for focus/blur on input elements for additional keyboard detection
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        // Small delay to allow keyboard to appear
        setTimeout(() => {
          const keyboardHeight = getKeyboardHeight();
          updateKeyboardState(keyboardHeight);
        }, 300);
      }
    };

    const handleBlur = () => {
      // Small delay to allow keyboard to disappear
      setTimeout(() => {
        const keyboardHeight = getKeyboardHeight();
        updateKeyboardState(keyboardHeight);
      }, 300);
    };

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('orientationchange', handleViewportChange);
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
      
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      }

      // Reset CSS custom properties
      document.documentElement.style.setProperty('--keyboard-height', '0px');
      document.documentElement.style.setProperty('--content-height', '100vh');
      document.body.classList.remove('keyboard-open');
    };
  }, [handleViewportChange, updateKeyboardState]);

  return {
    getCurrentKeyboardInfo,
    isVisible: keyboardInfoRef.current.isVisible,
    height: keyboardInfoRef.current.height
  };
};

export default useMobileKeyboard;