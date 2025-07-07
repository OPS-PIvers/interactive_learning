/**
 * Triggers haptic feedback using the Web Vibration API.
 *
 * Provides a set of predefined feedback types mapped to vibration patterns.
 * This utility centralizes haptic feedback calls and ensures graceful fallback
 * if the Vibration API is not supported.
 *
 * @example
 * triggerHapticFeedback('milestone'); // For timeline navigation
 * triggerHapticFeedback('hotspotDiscovery'); // When a user interacts with a hotspot
 *
 * @param type - The type of haptic feedback to trigger.
 *               Determines the vibration pattern.
 *               Supported types: 'light', 'medium', 'heavy', 'success', 'warning', 'error', 'selection', 'milestone', 'hotspotDiscovery'.
 *               Actual vibration may vary based on browser/device support.
 */
export const triggerHapticFeedback = (
  type:
    | 'light'
    | 'medium'
    | 'heavy'
    | 'success'
    | 'warning'
    | 'error'
    | 'selection'
    | 'milestone'
    | 'hotspotDiscovery'
): void => {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    let pattern: number | number[];

    switch (type) {
      case 'light':
        pattern = 10; // A very short vibration
        break;
      case 'medium':
        pattern = 30;
        break;
      case 'heavy':
        pattern = 50;
        break;
      case 'selection': // For discrete selections, like picking an item
        pattern = 5;
        break;
      case 'milestone': // For timeline step changes
        pattern = [40, 20, 30]; // A slightly more complex pattern
        break;
      case 'hotspotDiscovery': // For discovering a hotspot
        pattern = [10, 30, 10]; // Quick buzz, pause, quick buzz
        break;
      // Patterns for success, warning, error are often specific and might feel intrusive if not used carefully.
      // Simple patterns are generally safer.
      case 'success':
        pattern = [50, 50, 50]; // Example: three short bursts
        break;
      case 'warning':
        pattern = [100, 50, 100]; // Example: long, short, long
        break;
      case 'error':
        pattern = [75, 50, 75, 50, 75]; // Example: more insistent
        break;
      default:
        pattern = 20; // Default to a short vibration
    }

    try {
      window.navigator.vibrate(pattern);
    } catch (error) {
      // console.warn('Haptic feedback failed:', error);
      // Vibration API can sometimes throw errors, e.g., if called too frequently or format is unsupported.
    }
  } else {
    // console.log('Haptic feedback not supported or window not available.');
  }
};
