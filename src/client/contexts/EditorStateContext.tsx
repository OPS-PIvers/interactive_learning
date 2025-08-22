import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { InteractiveSlide } from '../../shared/slideTypes';

// Editor state types
export type EditingMode = 'design' | 'preview' | 'test';

export interface EditorAction {
  type: string;
  payload: any;
  timestamp: number;
}

export interface EditorState {
  currentSlide: InteractiveSlide | null;
  selectedElements: string[];
  editingMode: EditingMode;
  undoHistory: EditorAction[];
  redoHistory: EditorAction[];
  isDirty: boolean;
  lastSaved: Date | null;
}

// Action types
export const EDITOR_ACTIONS = {
  SET_CURRENT_SLIDE: 'SET_CURRENT_SLIDE',
  SELECT_ELEMENTS: 'SELECT_ELEMENTS',
  ADD_ELEMENT_SELECTION: 'ADD_ELEMENT_SELECTION',
  REMOVE_ELEMENT_SELECTION: 'REMOVE_ELEMENT_SELECTION',
  CLEAR_SELECTION: 'CLEAR_SELECTION',
  SET_EDITING_MODE: 'SET_EDITING_MODE',
  ADD_TO_HISTORY: 'ADD_TO_HISTORY',
  UNDO: 'UNDO',
  REDO: 'REDO',
  MARK_SAVED: 'MARK_SAVED',
  MARK_DIRTY: 'MARK_DIRTY',
} as const;

type EditorActionType = keyof typeof EDITOR_ACTIONS;

// Initial state
const initialState: EditorState = {
  currentSlide: null,
  selectedElements: [],
  editingMode: 'design',
  undoHistory: [],
  redoHistory: [],
  isDirty: false,
  lastSaved: null,
};

// Reducer
function editorStateReducer(state: EditorState, action: { type: EditorActionType; payload?: any }): EditorState {
  switch (action.type) {
    case 'SET_CURRENT_SLIDE':
      return {
        ...state,
        currentSlide: action.payload,
        selectedElements: [], // Clear selection when changing slides
      };

    case 'SELECT_ELEMENTS':
      return {
        ...state,
        selectedElements: Array.isArray(action.payload) ? action.payload : [action.payload],
      };

    case 'ADD_ELEMENT_SELECTION':
      return {
        ...state,
        selectedElements: [...state.selectedElements, action.payload],
      };

    case 'REMOVE_ELEMENT_SELECTION':
      return {
        ...state,
        selectedElements: state.selectedElements.filter(id => id !== action.payload),
      };

    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedElements: [],
      };

    case 'SET_EDITING_MODE':
      return {
        ...state,
        editingMode: action.payload,
      };

    case 'ADD_TO_HISTORY':
      const historyAction: EditorAction = {
        ...action.payload,
        timestamp: Date.now(),
      };
      return {
        ...state,
        undoHistory: [...state.undoHistory, historyAction],
        redoHistory: [], // Clear redo history when new action is performed
        isDirty: true,
      };

    case 'UNDO':
      if (state.undoHistory.length === 0) return state;
      const lastAction = state.undoHistory[state.undoHistory.length - 1]!;
      return {
        ...state,
        undoHistory: state.undoHistory.slice(0, -1),
        redoHistory: [...state.redoHistory, lastAction],
      };

    case 'REDO':
      if (state.redoHistory.length === 0) return state;
      const nextAction = state.redoHistory[state.redoHistory.length - 1]!;
      return {
        ...state,
        undoHistory: [...state.undoHistory, nextAction],
        redoHistory: state.redoHistory.slice(0, -1),
      };

    case 'MARK_SAVED':
      return {
        ...state,
        isDirty: false,
        lastSaved: new Date(),
      };

    case 'MARK_DIRTY':
      return {
        ...state,
        isDirty: true,
      };

    default:
      return state;
  }
}

// Context
interface EditorStateContextType {
  state: EditorState;
  dispatch: React.Dispatch<{ type: EditorActionType; payload?: any }>;
  // Helper functions
  setCurrentSlide: (slide: InteractiveSlide) => void;
  selectElements: (elementIds: string | string[]) => void;
  clearSelection: () => void;
  setEditingMode: (mode: EditingMode) => void;
  addToHistory: (action: Omit<EditorAction, 'timestamp'>) => void;
  undo: () => void;
  redo: () => void;
  markSaved: () => void;
  markDirty: () => void;
}

const EditorStateContext = createContext<EditorStateContextType | null>(null);

// Provider component
interface EditorStateProviderProps {
  children: ReactNode;
  initialSlide?: InteractiveSlide;
}

export const EditorStateProvider: React.FC<EditorStateProviderProps> = ({ 
  children, 
  initialSlide 
}) => {
  const [state, dispatch] = useReducer(editorStateReducer, {
    ...initialState,
    currentSlide: initialSlide || null,
  });

  // Helper functions
  const setCurrentSlide = (slide: InteractiveSlide) => {
    dispatch({ type: 'SET_CURRENT_SLIDE', payload: slide });
  };

  const selectElements = (elementIds: string | string[]) => {
    dispatch({ type: 'SELECT_ELEMENTS', payload: elementIds });
  };

  const clearSelection = () => {
    dispatch({ type: 'CLEAR_SELECTION' });
  };

  const setEditingMode = (mode: EditingMode) => {
    dispatch({ type: 'SET_EDITING_MODE', payload: mode });
  };

  const addToHistory = (action: Omit<EditorAction, 'timestamp'>) => {
    dispatch({ type: 'ADD_TO_HISTORY', payload: action });
  };

  const undo = () => {
    dispatch({ type: 'UNDO' });
  };

  const redo = () => {
    dispatch({ type: 'REDO' });
  };

  const markSaved = () => {
    dispatch({ type: 'MARK_SAVED' });
  };

  const markDirty = () => {
    dispatch({ type: 'MARK_DIRTY' });
  };

  const contextValue: EditorStateContextType = {
    state,
    dispatch,
    setCurrentSlide,
    selectElements,
    clearSelection,
    setEditingMode,
    addToHistory,
    undo,
    redo,
    markSaved,
    markDirty,
  };

  return (
    <EditorStateContext.Provider value={contextValue}>
      {children}
    </EditorStateContext.Provider>
  );
};

// Hook to use the context
export const useEditorState = () => {
  const context = useContext(EditorStateContext);
  if (!context) {
    throw new Error('useEditorState must be used within an EditorStateProvider');
  }
  return context;
};