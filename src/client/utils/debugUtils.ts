// Debug utility to conditionally log only in development

let debugEnabled = process.env.NODE_ENV === 'development' || localStorage.getItem('debug_enabled') === 'true';

export const debugLog = {
  log: (message: string, ...args: any[]) => {
    if (debugEnabled) {
      console.log(message, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (debugEnabled) {
      console.warn(message, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    // Always log errors, even if debug is not enabled
    console.error(message, ...args);
  },
  info: (message: string, ...args: any[]) => {
    if (debugEnabled) {
      console.info(message, ...args);
    }
  },
  // New method to control debug logging dynamically
  setDebugEnabled: (enabled: boolean) => {
    debugEnabled = enabled;
    if (enabled) {
      localStorage.setItem('debug_enabled', 'true');
    } else {
      localStorage.removeItem('debug_enabled');
    }
    console.log(`Debug logging ${enabled ? 'enabled' : 'disabled'}.`);
  },
  // Method to check current debug status
  isDebugEnabled: () => debugEnabled,
};