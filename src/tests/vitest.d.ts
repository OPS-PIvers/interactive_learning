// Global test environment declarations

declare global {
  var pauseGlobalErrorHandler: () => void;
  var resumeGlobalErrorHandler: () => void;
}

// This empty export is needed to treat the file as a module.
export {};