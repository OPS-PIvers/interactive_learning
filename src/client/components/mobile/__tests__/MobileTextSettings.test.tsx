import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import MobileTextSettings from '../MobileTextSettings';
import { InteractionType, TimelineEvent } from '../../../../shared/types';
import { vi } from 'vitest';

describe('MobileTextSettings', () => {
  const event: TimelineEvent = {
    type: InteractionType.SHOW_TEXT,
    id: '1',
    textContent: 'Hello World',
  };

  it('renders correctly', () => {
    const { getByDisplayValue } = render(
      <MobileTextSettings event={event} onUpdate={() => {}} />
    );
    expect(getByDisplayValue('Hello World')).toBeInTheDocument();
  });

  it('calls onUpdate when the text is changed', () => {
    const handleUpdate = vi.fn();
    const { getByLabelText } = render(
      <MobileTextSettings event={event} onUpdate={handleUpdate} />
    );
    const textInput = getByLabelText('Text Content');
    fireEvent.change(textInput, { target: { value: 'New Text' } });
    fireEvent.blur(textInput);
    expect(handleUpdate).toHaveBeenCalledWith(expect.objectContaining({ textContent: 'New Text' }));
  });
});
