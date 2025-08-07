import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  freezeOnceVisible?: boolean;
}

export const useIntersectionObserver = (
  options: UseIntersectionObserverOptions = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // If freezeOnceVisible is true and element has already intersected, don't create observer
    if (options.freezeOnceVisible && hasIntersected) {
      return;
    }

    observer.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        const isElementIntersecting = entry.isIntersecting;
        setIsIntersecting(isElementIntersecting);
        
        if (isElementIntersecting) {
          setHasIntersected(true);
        }
      },
      {
        root: options.root ?? null,
        rootMargin: options.rootMargin || '0px',
        threshold: options.threshold || 0,
      }
    );

    observer.current.observe(element);

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [options.root, options.rootMargin, options.threshold, options.freezeOnceVisible, hasIntersected]);

  return { ref: elementRef, isIntersecting, hasIntersected };
};