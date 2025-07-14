import React from 'react';
import { render } from '@testing-library/react';
import { MobileMediaSettings } from '../MobileMediaSettings';
import { InteractionType, TimelineEvent } from '../../../../shared/types';
import { vi } from 'vitest';

vi.mock('../MobileMediaUpload', () => ({
  MobileMediaUpload: () => <div data-testid="mobile-media-upload" />,
}));

describe('MobileMediaSettings', () => {
  const event: TimelineEvent = {
    type: InteractionType.SHOW_IMAGE_MODAL,
    id: '1',
    mediaUrl: 'https://example.com/image.png',
  };

  it('renders correctly', () => {
    const { getByTestId } = render(
      <MobileMediaSettings event={event} onUpdate={() => {}} />
    );
    expect(getByTestId('mobile-media-upload')).toBeInTheDocument();
  });
});
