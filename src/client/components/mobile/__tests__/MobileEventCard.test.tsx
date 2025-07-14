import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import MobileEventCard from '../MobileEventCard';
import { InteractionType } from '../../../../shared/types';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { vi } from 'vitest';

describe('MobileEventCard', () => {
  const event = {
    type: InteractionType.SHOW_TEXT,
    id: '1',
    name: 'Test Event',
    step: 1,
  };

  const renderComponent = (props: any) =>
    render(
      <DndProvider backend={HTML5Backend}>
        <MobileEventCard {...props} />
      </DndProvider>
    );

  it('renders correctly', () => {
    const { getByText } = renderComponent({
      event,
      onUpdate: () => {},
      onDelete: () => {},
      onSelect: () => {},
      onPreview: () => {},
    });
    expect(getByText('Test Event')).toBeInTheDocument();
  });

  it('calls onSelect when the card is clicked', () => {
    const handleSelect = vi.fn();
    const { getByText } = renderComponent({
      event,
      onUpdate: () => {},
      onDelete: () => {},
      onSelect: handleSelect,
      onPreview: () => {},
    });
    fireEvent.click(getByText('Test Event'));
    expect(handleSelect).toHaveBeenCalled();
  });

  it('calls onPreview when the preview button is clicked', () => {
    const handlePreview = vi.fn();
    const { getByLabelText } = renderComponent({
      event,
      onUpdate: () => {},
      onDelete: () => {},
      onSelect: () => {},
      onPreview: handlePreview,
    });
    fireEvent.click(getByLabelText('Preview event'));
    expect(handlePreview).toHaveBeenCalled();
  });

  it('calls onDelete when the delete button is clicked', () => {
    const handleDelete = vi.fn();
    const { getByLabelText, getByText } = renderComponent({
      event,
      onUpdate: () => {},
      onDelete: handleDelete,
      onSelect: () => {},
      onPreview: () => {},
    });
    fireEvent.click(getByLabelText('Expand event details'));
    fireEvent.click(getByText('Delete Event'));
    expect(handleDelete).toHaveBeenCalled();
  });
});
