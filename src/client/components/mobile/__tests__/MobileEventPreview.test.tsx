import React from 'react';
import { render } from '@testing-library/react';
import MobileEventPreview from '../MobileEventPreview';
import { InteractionType, TimelineEvent, HotspotData } from '../../../../shared/types';
import { vi } from 'vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('MobileEventPreview', () => {
  const hotspot: HotspotData = {
    id: 'hs1',
    x: 50,
    y: 50,
    title: 'Hotspot 1',
  };

  // it('renders text preview correctly', () => {
  //   const event: TimelineEvent = {
  //     type: InteractionType.SHOW_TEXT,
  //     id: '1',
  //     text: 'Hello World',
  //     textX: 50,
  //     textY: 50,
  //     textWidth: 200,
  //     textHeight: 100,
  //     textContent: 'Hello World',
  //   };
  //   const { getByText } = render(
  //     <MobileEventPreview
  //       event={event}
  //       hotspot={hotspot}
  //       onUpdateEvent={() => {}}
  //       backgroundImageUrl=""
  //     />
  //   );
  //   expect(getByText('Hello World')).toBeInTheDocument();
  // });

  it('renders image preview correctly', () => {
    const event: TimelineEvent = {
      type: InteractionType.SHOW_IMAGE_MODAL,
      id: '1',
      mediaUrl: 'https://example.com/image.png',
    };
    const { getByAltText } = render(
      <MobileEventPreview
        event={event}
        hotspot={hotspot}
        onUpdateEvent={() => {}}
        backgroundImageUrl=""
      />
    );
    expect(getByAltText('Image preview')).toHaveAttribute('src', 'https://example.com/image.png');
  });

  it('renders a placeholder for events without a visual preview', () => {
    const event: TimelineEvent = {
      type: InteractionType.PULSE_HOTSPOT,
      id: '1',
    };
    const { getByText } = render(
      <MobileEventPreview
        event={event}
        hotspot={hotspot}
        onUpdateEvent={() => {}}
        backgroundImageUrl=""
      />
    );
    expect(getByText(/Preview for ".*" event type is not yet available./)).toBeInTheDocument();
  });
});
