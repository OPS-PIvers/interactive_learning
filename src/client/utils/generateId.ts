/**
 * Generates a unique ID with an optional prefix.
 * This is a consolidated utility to ensure consistent and unique ID generation.
 *
 * @param prefix - An optional prefix for the ID (e.g., 'h' for hotspot, 'e' for event).
 * @returns A unique string ID.
 */
export const generateId = (prefix = 'id'): string => {
  const timestamp = Date.now().toString(36);
  
  // Use crypto.getRandomValues for better randomness and guaranteed length
  const array = new Uint8Array(5); // 5 bytes = 40 bits, enough for 7 base36 chars
  crypto.getRandomValues(array);
  const randomPart = Array.from(array)
    .map(b => b.toString(36).padStart(2, '0'))
    .join('')
    .substring(0, 7); // Ensure exactly 7 characters
    
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