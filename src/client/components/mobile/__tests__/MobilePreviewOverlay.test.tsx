import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import MobilePreviewOverlay from '../MobilePreviewOverlay';
import { vi } from 'vitest';

describe('MobilePreviewOverlay', () => {
  it('renders correctly', () => {
    const { getByLabelText } = render(
      <MobilePreviewOverlay onExit={() => {}} isPlaying={false} />
    );
    expect(getByLabelText('Exit preview')).toBeInTheDocument();
  });

  it('calls onExit when the exit button is clicked', () => {
    const handleExit = vi.fn();
    const { getByLabelText } = render(
      <MobilePreviewOverlay onExit={handleExit} isPlaying={false} />
    );
    fireEvent.click(getByLabelText('Exit preview'));
    expect(handleExit).toHaveBeenCalled();
  });

  it('renders playback controls when provided', () => {
    const { getByLabelText } = render(
      <MobilePreviewOverlay
        onExit={() => {}}
        isPlaying={false}
        onPlay={() => {}}
        onPause={() => {}}
        onRestart={() => {}}
      />
    );
    expect(getByLabelText('Play preview')).toBeInTheDocument();
    expect(getByLabelText('Restart preview')).toBeInTheDocument();
  });
});
