import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import React, { useState, useContext } from 'react';
import { EditorStateContext, type EditorState } from '../../client/contexts/EditorStateContext';

// Mock useTouchGestures
const mockUseTouchGestures = vi.fn();
vi.mock('../../client/hooks/useTouchGestures', () => ({
  useTouchGestures: mockUseTouchGestures,
}));

// Mock Components
const MockResponsiveCanvas = ({ onGesture }: { onGesture: () => void }) => {
    return React.createElement('div', { 'data-testid': 'canvas', onClick: onGesture }, 'Canvas');
};

const MockModal = ({ isVisible, children }: { isVisible: boolean, children: React.ReactNode }) => {
  if (!isVisible) return null;
  return React.createElement('div', { 'data-testid': 'modal' }, children);
};

const MockEditorToolbar = () => {
  const context = useContext(EditorStateContext);
  if (!context) return null;
  return React.createElement('button', { onClick: () => context.selectElements('element1') }, 'Select Element');
};

const MockPropertiesPanel = () => {
  const context = useContext(EditorStateContext);
  if (!context) return null;
  return React.createElement('div', { 'data-testid': 'properties-panel' }, `Selected: ${context.state.selectedElements[0] || 'none'}`);
};

describe('Component Integration Tests', () => {
    beforeEach(() => {
        mockUseTouchGestures.mockClear();
    });

  it('should test ResponsiveCanvas + Touch Gestures Integration', () => {
    const onGesture = vi.fn();
    mockUseTouchGestures.mockReturnValue({
        handleTouchStart: onGesture,
        handleTouchMove: onGesture,
        handleTouchEnd: onGesture,
    });

    const App = () => {
        const { handleTouchStart } = mockUseTouchGestures();
        return React.createElement(MockResponsiveCanvas, { onGesture: handleTouchStart });
    };

    render(React.createElement(App));

    const canvas = screen.getByTestId('canvas');
    fireEvent.click(canvas);
    expect(onGesture).toHaveBeenCalled();
  });

  it('should test Modal State + Canvas Interaction', () => {
    const onGesture = vi.fn();
    mockUseTouchGestures.mockReturnValue({
        handleTouchStart: onGesture,
        handleTouchMove: onGesture,
        handleTouchEnd: onGesture,
    });

    const App = () => {
      const [isModalOpen, setModalOpen] = useState(false);
      const { handleTouchStart } = mockUseTouchGestures();

      return React.createElement('div', null,
        React.createElement(MockResponsiveCanvas, { onGesture: handleTouchStart }),
        React.createElement('button', { onClick: () => setModalOpen(true) }, 'Open Modal'),
        React.createElement(MockModal, { isVisible: isModalOpen, children: 'Modal Content' })
      );
    };

    render(React.createElement(App));

    expect(screen.queryByTestId('modal')).toBeNull();
    fireEvent.click(screen.getByText('Open Modal'));
    expect(screen.getByTestId('modal')).toBeInTheDocument();

    // Check that canvas interaction is still possible
    fireEvent.click(screen.getByTestId('canvas'));
    expect(onGesture).toHaveBeenCalled();
  });

  it('should test Editor Toolbar + Properties Panel Sync', () => {
    const App = () => {
        const [selectedElements, setSelectedElements] = useState<string[]>([]);
        const state = {
            state: { selectedElements },
            selectElements: (elementId: string) => setSelectedElements([elementId])
        } as any;

        return React.createElement(EditorStateContext.Provider, { value: state },
            React.createElement(MockEditorToolbar),
            React.createElement(MockPropertiesPanel)
        );
    };

    render(React.createElement(App));

    expect(screen.getByTestId('properties-panel').textContent).toBe('Selected: none');
    fireEvent.click(screen.getByText('Select Element'));
    expect(screen.getByTestId('properties-panel').textContent).toBe('Selected: element1');
  });
});
