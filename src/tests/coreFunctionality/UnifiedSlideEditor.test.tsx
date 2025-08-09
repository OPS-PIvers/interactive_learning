import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { vi, describe, test, expect, beforeEach, Mock } from 'vitest';
import '@testing-library/jest-dom';
import { UnifiedSlideEditor, UnifiedSlideEditorProps } from '../../client/components/slides/UnifiedSlideEditor';
import { ToastProvider, useToast } from '../../client/hooks/useToast';
import { AuthProvider, useAuth } from '../../lib/authContext';
import { SlideDeck } from '../../shared/slideTypes';

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

vi.mock('../../client/hooks/useDeviceDetection', () => ({
  useDeviceDetection: () => ({
    isMobile: false,
    deviceType: 'desktop',
    isTablet: false,
    isDesktop: true,
    viewportInfo: { width: 1920, height: 1080, orientation: 'landscape' },
  }),
}));

vi.mock('../../lib/firebaseApi', () => ({
  firebaseAPI: {
    saveSlideDeck: vi.fn().mockResolvedValue(true),
    loadSlideDeck: vi.fn().mockResolvedValue(null),
    saveProject: vi.fn().mockResolvedValue(true),
  },
}));


// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

const mockUseAuth = useAuth as Mock;
const mockUseToast = useToast as Mock;

const mockSlideDeck: SlideDeck = {
  id: 'unified-deck-1',
  title: 'Unified Test Deck',
  slides: [
    {
      id: 'slide-1',
      title: 'First Slide',
      elements: [],
      transitions: [],

      layout: {
        aspectRatio: '16:9',

        containerWidth: 1200,
        containerHeight: 800,
        scaling: 'fit',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      },
    },
  ],
  settings: {
    autoAdvance: false,
    allowNavigation: true,
    showProgress: false,
    showControls: false,
    keyboardShortcuts: true,
    touchGestures: false,
    fullscreenMode: false,
  },
  metadata: {
      version: '3.0',
      created: Date.now(),
      modified: Date.now(),
      isPublic: false,
  }
};

const renderEditor = (props: Partial<UnifiedSlideEditorProps> = {}) => {
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
    // The project name might be rendered in multiple places in the responsive header
    const projectTitles = screen.getAllByText('Unified Editor Test');
    expect(projectTitles).toBeDefined();
    if (projectTitles) {
        expect(projectTitles.length).toBeGreaterThan(0);
        projectTitles.forEach(title => {
            if (title) {
                expect(title).toBeInTheDocument();
            }
        });
    }
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

    const updatedDeck = onSlideDeckChange.mock.calls[0]?.[0] as SlideDeck;
    if (updatedDeck) {
        expect(updatedDeck.slides[0]!.elements).toHaveLength(1);
        expect(updatedDeck.slides[0]!.elements[0]!.type).toBe('text');
    }
  });

  test('adds a new slide', async () => {
    const onSlideDeckChange = vi.fn();
    renderEditor({ onSlideDeckChange });

    // Open the slides modal
    const slidesButton = screen.getByRole('button', { name: /slides/i });
    fireEvent.click(slidesButton);

    // Click the "Add New Slide" button in the modal
    const addSlideButton = await screen.findByRole('button', { name: /add new slide/i });
    fireEvent.click(addSlideButton);

    await waitFor(() => {
        expect(onSlideDeckChange).toHaveBeenCalled();
    });

    const updatedDeck = onSlideDeckChange.mock.calls[0]?.[0] as SlideDeck;
    if (updatedDeck) {
        expect(updatedDeck.slides!).toHaveLength(2);
    }
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
