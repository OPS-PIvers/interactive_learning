import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import WalkthroughViewerPage from '@/client/pages/WalkthroughViewerPage';

// Mock child components to isolate the page logic
vi.mock('@/client/components/viewers/HotspotViewer', () => ({
  __esModule: true,
  default: ({ walkthrough, onStepChange }) => (
    <div>
      <h1>Hotspot Viewer Mock</h1>
      <p>Walkthrough: {walkthrough.title}</p>
      <button onClick={() => onStepChange(1)}>Next Step</button>
    </div>
  ),
}));

describe('Viewer Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load a walkthrough and allow navigation', async () => {
    render(
      <MemoryRouter initialEntries={['/view/demo-walkthrough']}>
        <Routes>
          <Route path="/view/:id" element={<WalkthroughViewerPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for the viewer to load with the demo walkthrough
    await waitFor(() => {
      expect(screen.getByText('Walkthrough: Demo Interactive Walkthrough')).toBeInTheDocument();
    });

    // Mock console.log to verify onStepChange call
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Simulate clicking the next step
    fireEvent.click(screen.getByText('Next Step'));

    // Check if the onStepChange handler was called
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Current step:', 1);
    });

    consoleSpy.mockRestore();
  });
});
