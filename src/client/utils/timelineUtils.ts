import { TimelineEventData } from '../../shared/type-defs';

/**
 * Get the next available timeline step number for a new event
 */
export const getNextTimelineStep = (existingEvents: TimelineEventData[]): number => {
  if (existingEvents.length === 0) return 1;
  return Math.max(...existingEvents.map(e => e.step)) + 1;
};

/**
 * Move an event up in the timeline (decrease step number)
 * Swaps step numbers with the previous event
 */
export const moveEventUp = (
  eventId: string,
  events: TimelineEventData[]
): TimelineEventData[] => {
  const currentIndex = events.findIndex(e => e.id === eventId);
  if (currentIndex <= 0) return events; // Can't move up if already first
  
  const sortedEvents = [...events].sort((a, b) => a.step - b.step);
  const sortedIndex = sortedEvents.findIndex(e => e.id === eventId);
  
  if (sortedIndex <= 0) return events; // Already at the top
  
  const currentEvent = sortedEvents[sortedIndex];
  const previousEvent = sortedEvents[sortedIndex - 1];
  
  if (!currentEvent || !previousEvent) return events;
  
  // Swap step numbers
  const updatedEvents = events.map(event => {
    if (event.id === currentEvent.id) {
      return { ...event, step: previousEvent.step };
    }
    if (event.id === previousEvent.id) {
      return { ...event, step: currentEvent.step };
    }
    return event;
  });
  
  return updatedEvents;
};

/**
 * Move an event down in the timeline (increase step number)
 * Swaps step numbers with the next event
 */
export const moveEventDown = (
  eventId: string,
  events: TimelineEventData[]
): TimelineEventData[] => {
  const sortedEvents = [...events].sort((a, b) => a.step - b.step);
  const sortedIndex = sortedEvents.findIndex(e => e.id === eventId);
  
  if (sortedIndex >= sortedEvents.length - 1) return events; // Already at the bottom
  
  const currentEvent = sortedEvents[sortedIndex];
  const nextEvent = sortedEvents[sortedIndex + 1];
  
  if (!currentEvent || !nextEvent) return events;
  
  // Swap step numbers
  const updatedEvents = events.map(event => {
    if (event.id === currentEvent.id) {
      return { ...event, step: nextEvent.step };
    }
    if (event.id === nextEvent.id) {
      return { ...event, step: currentEvent.step };
    }
    return event;
  });
  
  return updatedEvents;
};

/**
 * Reorder events to ensure sequential step numbering (1, 2, 3, ...)
 * Useful after deletions or bulk changes
 */
export const reorderEventSteps = (events: TimelineEventData[]): TimelineEventData[] => {
  const sortedEvents = [...events].sort((a, b) => a.step - b.step);
  
  return sortedEvents.map((event, index) => ({
    ...event,
    step: index + 1
  }));
};

/**
 * Get events sorted by their timeline step
 */
export const getSortedEvents = (events: TimelineEventData[]): TimelineEventData[] => {
  return [...events].sort((a, b) => a.step - b.step);
};

/**
 * Check if an event can be moved up in the timeline
 */
export const canMoveUp = (eventId: string, events: TimelineEventData[]): boolean => {
  const sortedEvents = getSortedEvents(events);
  const index = sortedEvents.findIndex(e => e.id === eventId);
  return index > 0;
};

/**
 * Check if an event can be moved down in the timeline
 */
export const canMoveDown = (eventId: string, events: TimelineEventData[]): boolean => {
  const sortedEvents = getSortedEvents(events);
  const index = sortedEvents.findIndex(e => e.id === eventId);
  return index >= 0 && index < sortedEvents.length - 1;
};