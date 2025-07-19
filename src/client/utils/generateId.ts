/**
 * Generates a unique ID for hotspots and other entities
 */
export function generateId(): string {
  return `h${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generates a unique ID for timeline events
 */
export function generateEventId(): string {
  return `e${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}