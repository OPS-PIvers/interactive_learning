import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { MobilePanZoomSettings } from '../MobilePanZoomSettings';
import { InteractionType, TimelineEvent } from '../../../../shared/types';
import { vi } from 'vitest';

describe('MobilePanZoomSettings', () => {
  const event: TimelineEvent = {
    type: InteractionType.PAN_ZOOM,
    id: '1',
    zoomLevel: 2,
    targetX: 50,
    targetY: 50,
  };

  it('renders correctly', () => {
    const { getByLabelText } = render(
      <MobilePanZoomSettings event={event} onUpdate={() => {}} />
    );
    expect(getByLabelText('Zoom Level')).toBeInTheDocument();
  });

  it('calls onUpdate when the zoom level is changed', () => {
    const handleUpdate = vi.fn();
    const { getByLabelText } = render(
      <MobilePanZoomSettings event={event} onUpdate={handleUpdate} />
    );
    const zoomInput = getByLabelText('Zoom Level');
    fireEvent.change(zoomInput, { target: { value: '3' } });
    expect(handleUpdate).toHaveBeenCalledWith({ zoomLevel: 3 });
  });
});
