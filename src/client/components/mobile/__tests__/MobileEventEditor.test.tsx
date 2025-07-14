import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import MobileEventEditor from '../MobileEventEditor';
import { InteractionType, TimelineEvent } from '../../../../shared/types';
import { vi } from 'vitest';

describe('MobileEventEditor', () => {
  const events: TimelineEvent[] = [
    {
      type: InteractionType.SHOW_TEXT,
      id: '1',
      text: 'Initial text',
    },
  ];

  it('renders correctly', () => {
    const { getByText } = render(
      <MobileEventEditor
        events={events}
        onEventsChange={() => {}}
        onSelectEvent={() => {}}
        onAddEvent={() => {}}
        onPreviewEvent={() => {}}
      />
    );
    expect(getByText('Add New Event')).toBeInTheDocument();
  });

  it('calls onAddEvent when the add button is clicked', () => {
    const handleAddEvent = vi.fn();
    const { getByText } = render(
      <MobileEventEditor
        events={events}
        onEventsChange={() => {}}
        onSelectEvent={() => {}}
        onAddEvent={handleAddEvent}
        onPreviewEvent={() => {}}
      />
    );
    fireEvent.click(getByText('Add New Event'));
    expect(handleAddEvent).toHaveBeenCalled();
  });
});
