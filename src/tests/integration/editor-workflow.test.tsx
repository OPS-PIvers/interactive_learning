import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import HotspotEditorPage from '@/client/pages/HotspotEditorPage';

// Mock Firebase API
vi.mock('@/lib/firebaseApi', () => ({
  getWalkthrough: vi.fn().mockResolvedValue({
    id: 'test-id',
    title: 'Test Walkthrough',
    description: 'Test description',
    backgroundMedia: { type: 'image', url: '', alt: '' },
    hotspots: [],
    sequence: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isPublished: false,
    creatorId: 'test-user'
  }),
  createWalkthrough: vi.fn().mockResolvedValue({
    id: 'new-test-id',
    title: 'New Walkthrough',
    description: '',
    backgroundMedia: { type: 'image', url: '', alt: '' },
    hotspots: [],
    sequence: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isPublished: false,
    creatorId: 'test-user'
  }),
  updateWalkthrough: vi.fn().mockResolvedValue(undefined)
}));

// Mock auth hook
vi.mock('@/client/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'test-user', email: 'test@example.com' },
    loading: false
  })
}));

// Mock toast provider
vi.mock('@/client/components/feedback/ToastProvider', () => ({
  useToast: () => ({
    showToast: vi.fn()
  })
}));

// Mock child components to isolate the page logic
vi.mock('@/client/components/hotspot/HotspotEditor', () => ({
  __esModule: true,
  default: ({ walkthrough, onChange, onSave }: { walkthrough: any, onChange: any, onSave: any }) => (
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

    // Check that the toast is shown on save - we mock the toast provider
    // The actual toast call is mocked, so we can't test it directly in this integration test
  });
});
