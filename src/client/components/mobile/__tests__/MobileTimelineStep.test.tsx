import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import MobileTimelineStep from '../MobileTimelineStep';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { vi } from 'vitest';

describe('MobileTimelineStep', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <DndProvider backend={HTML5Backend}>
        <MobileTimelineStep
          index={0}
          step={1}
          isActive={false}
          events={[]}
          isEditing={false}
          onSelect={() => {}}
          onDelete={() => {}}
          onUpdate={() => {}}
          onMove={() => {}}
        />
      </DndProvider>
    );
    expect(getByText('1')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const handleSelect = vi.fn();
    const { getByText } = render(
      <DndProvider backend={HTML5Backend}>
        <MobileTimelineStep
          index={0}
          step={1}
          isActive={false}
          events={[]}
          isEditing={false}
          onSelect={handleSelect}
          onDelete={() => {}}
          onUpdate={() => {}}
          onMove={() => {}}
        />
      </DndProvider>
    );
    fireEvent.click(getByText('1'));
    expect(handleSelect).toHaveBeenCalled();
  });
});
