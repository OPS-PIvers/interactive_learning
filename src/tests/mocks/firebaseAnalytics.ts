export const getAnalytics = () => ({});
export const logEvent = () => {};
export const setAnalyticsCollectionEnabled = () => {};
export const isSupported = () => Promise.resolve(false);
export const initializeAnalytics = () => ({});
export const setUserId = () => {};
export const setUserProperties = () => {};

// Comprehensive mock for Firebase Analytics
export default {
  getAnalytics,
  logEvent,
  setAnalyticsCollectionEnabled,
  isSupported,
  initializeAnalytics,
  setUserId,
  setUserProperties,
};
