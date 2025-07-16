import { Hotspot } from '../../types/hotspot';

const STATE_KEY = 'mobileEditorState';

export interface MobileEditorState {
  hotspots: Hotspot[];
  selectedHotspotId?: string;
}

export const mobileStateManager = {
  saveState: (state: MobileEditorState) => {
    try {
      const serializedState = JSON.stringify(state);
      sessionStorage.setItem(STATE_KEY, serializedState);
    } catch (error) {
      console.error('Error saving mobile editor state:', error);
    }
  },

  loadState: (): MobileEditorState | null => {
    try {
      const serializedState = sessionStorage.getItem(STATE_KEY);
      if (serializedState === null) {
        return null;
      }
      return JSON.parse(serializedState);
    } catch (error) {
      console.error('Error loading mobile editor state:', error);
      return null;
    }
  },

  clearState: () => {
    try {
      sessionStorage.removeItem(STATE_KEY);
    } catch (error) {
      console.error('Error clearing mobile editor state:', error);
    }
  },
};
