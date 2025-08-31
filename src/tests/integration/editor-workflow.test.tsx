import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import HotspotEditorPage from '@/client/pages/HotspotEditorPage';

// Mock child components to isolate the page logic
vi.mock('@/client/components/hotspot/HotspotEditor', () => ({
  __esModule: true,
  default: ({ walkthrough, onChange, onSave }) => (
    <div>
      <h1>Hotspot Editor Mock</h1>
      <p>Walkthrough: {walkthrough.title}</p>
      <button onClick={() => onChange({ ...walkthrough, title: 'Updated Title' })}>
        Change Title
      </button>
      <button onClick={onSave}>Save</button>
    </div>
  ),
}));

describe('Editor Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.alert
    window.alert = vi.fn();
  });

  it('should create a new walkthrough and allow editing', async () => {
    render(
      <MemoryRouter initialEntries={['/editor']}>
        <Routes>
          <Route path="/editor" element={<HotspotEditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for the editor to load with a new walkthrough
    await waitFor(() => {
      expect(screen.getByText('Walkthrough: New Walkthrough')).toBeInTheDocument();
    });

    // Simulate changing the title
    fireEvent.click(screen.getByText('Change Title'));

    // Check if the title is updated in the component's state
    await waitFor(() => {
        expect(screen.getByText('Walkthrough: Updated Title')).toBeInTheDocument();
    });

    // Simulate saving the walkthrough
    fireEvent.click(screen.getByText('Save'));

    // Check that the alert is shown on save
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Walkthrough saved successfully!');
    });
  });
});
