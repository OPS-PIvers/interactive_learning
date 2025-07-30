import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

import { UnifiedSlideEditor } from '../../client/components/slides/UnifiedSlideEditor';
import { SlideDeck, InteractiveSlide } from '../../shared/slideTypes';
import { AuthProvider, useAuth } from '../../lib/authContext';
import { ToastProvider, useToast } from '../../client/hooks/useToast';
import { useIsMobile } from '../../client/hooks/useIsMobile';
import { firebaseAPI } from '../../lib/firebaseApi';
import { firebaseManager } from '../../lib/firebaseConfig';

// Mock dependencies
vi.mock('../../lib/authContext', async () => {
  const actual = await vi.importActual('../../lib/authContext');
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

vi.mock('../../client/hooks/useToast', async () => {
    const actual = await vi.importActual('../../client/hooks/useToast');
    return {
        ...actual,
        useToast: vi.fn(),
    };
});

vi.mock('../../client/hooks/useIsMobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('../../lib/firebaseApi', () => ({
  firebaseAPI: {
    saveSlideDeck: vi.fn().mockResolvedValue(true),
    loadSlideDeck: vi.fn().mockResolvedValue(null),
    saveProject: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('../../lib/firebaseConfig', () => {
    const auth = {
        onAuthStateChanged: (callback: (user: any) => void) => {
            callback({ uid: 'test-user' });
            return () => {}; // Unsubscribe function
        },
        currentUser: { uid: 'test-user' }
    };

    return {
        firebaseManager: {
            isReady: () => true,
            getAuth: () => auth,
            getFirestore: () => ({}),
        },
        auth,
    };
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

const mockUseAuth = useAuth as vi.Mock;
const mockUseToast = useToast as vi.Mock;

const mockSlideDeck: SlideDeck = {
  id: 'unified-deck-1',
  title: 'Unified Test Deck',
  slides: [
    {
      id: 'slide-1',
      title: 'First Slide',
      elements: [],
      layout: { aspectRatio: '16:9' },
    } as InteractiveSlide,
  ],
  metadata: {
      version: '3.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
  }
};

const renderEditor = (props = {}) => {
  const defaultProps = {
    slideDeck: mockSlideDeck,
    projectName: 'Unified Editor Test',
    onSlideDeckChange: vi.fn(),
    onSave: vi.fn().mockResolvedValue(undefined),
    onImageUpload: vi.fn().mockResolvedValue(undefined),
    onClose: vi.fn(),
    isPublished: false,
  };

  return render(
    <AuthProvider>
      <ToastProvider>
        <UnifiedSlideEditor {...defaultProps} {...props} />
      </ToastProvider>
    </AuthProvider>
  );
};

describe('UnifiedSlideEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { uid: 'test-user' }, loading: false });
    mockUseToast.mockReturnValue({ showToast: vi.fn() });
  });

  test('renders the editor with the project name', () => {
    renderEditor();
    expect(screen.getByText('Unified Editor Test')).toBeInTheDocument();
  });

  test('adds a new element when "Add Text" is clicked', async () => {
    const onSlideDeckChange = vi.fn();
    renderEditor({ onSlideDeckChange });

    // Open the insert modal
    const insertButton = screen.getByRole('button', { name: /insert/i });
    fireEvent.click(insertButton);

    // Click the "Add Text" button in the modal
    const addTextButton = await screen.findByRole('button', { name: /add text/i });
    fireEvent.click(addTextButton);

    await waitFor(() => {
      expect(onSlideDeckChange).toHaveBeenCalled();
    });

    const updatedDeck = onSlideDeckChange.mock.calls[0][0] as SlideDeck;
    expect(updatedDeck.slides[0].elements).toHaveLength(1);
    expect(updatedDeck.slides[0].elements[0].type).toBe('text');
  });

  test('adds a new slide', async () => {
    const onSlideDeckChange = vi.fn();
    renderEditor({ onSlideDeckChange });

    const addSlideButton = screen.getByRole('button', { name: /add slide/i });
    fireEvent.click(addSlideButton);

    await waitFor(() => {
        expect(onSlideDeckChange).toHaveBeenCalled();
    });

    const updatedDeck = onSlideDeckChange.mock.calls[0][0] as SlideDeck;
    expect(updatedDeck.slides).toHaveLength(2);
  });

  test('saves the project when save button is clicked', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderEditor({ onSave });

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(mockSlideDeck);
    });
  });
});
