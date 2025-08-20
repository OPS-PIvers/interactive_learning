 
export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastFunc: number | undefined;
  let lastRan: number | undefined;

  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
     
    const context = this;
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      if (lastFunc) {
        window.clearTimeout(lastFunc);
      }
      lastFunc = window.setTimeout(
        () => {
          if (Date.now() - (lastRan || 0) >= limit) {
            func.apply(context, args);
            lastRan = Date.now();
          }
        },
        limit - (Date.now() - (lastRan || 0))
      );
    }
  };
}

// Debounce function
 
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | undefined;

  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
     
    const context = this;
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
    timeoutId = window.setTimeout(() => {
      func.apply(context, args);
    }, delay);
  };
}
