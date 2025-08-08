// Debug utility to conditionally log only in development

let debugEnabled: boolean;
try {
  debugEnabled = process.env['NODE_ENV'] === 'development' ||
  typeof localStorage !== 'undefined' && localStorage.getItem('debug_enabled') === 'true';
} catch {
  debugEnabled = process.env['NODE_ENV'] === 'development';
}

export const debugLog = {
  log: (message: string, ...args: unknown[]) => {
    if (debugEnabled) {

    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (debugEnabled) {
      console.warn(message, ...args);
    }
  },
  error: (message: string, ...args: unknown[]) => {
    // Always log errors, even if debug is not enabled
    console.error(message, ...args);
  },
  info: (message: string, ...args: unknown[]) => {
    if (debugEnabled) {

    }
  },
  // New method to control debug logging dynamically
  setDebugEnabled: (enabled: boolean) => {
    debugEnabled = enabled;
    try {
      if (typeof localStorage !== 'undefined') {
        if (enabled) {
          localStorage.setItem('debug_enabled', 'true');
        } else {
          localStorage.removeItem('debug_enabled');
        }
      }
    } catch {

      // Ignore localStorage errors (e.g., in private browsing mode)
    }
  },
  // Method to check current debug status
  isDebugEnabled: () => debugEnabled
};