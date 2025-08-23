/**
 * Generates a unique ID with an optional prefix.
 * This is a consolidated utility to ensure consistent and unique ID generation.
 *
 * @param prefix - An optional prefix for the ID (e.g., 'h' for hotspot, 'e' for event).
 * @returns A unique string ID.
 */
export const generateId = (prefix = 'id'): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${timestamp}-${randomPart}`;
};

/**
 * Generates a unique ID for a hotspot element.
 */
export const generateHotspotId = () => generateId('h');

/**
 * Generates a unique ID for a timeline event.
 */
export const generateEventId = () => generateId('e');