import React from 'react';
import { render, screen, within, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import InteractiveModule from '../client/components/InteractiveModule';
import { InteractiveModuleState } from '../shared/types';

// Mock child components that are not relevant to these specific tests
vi.mock('../client/components/ViewerToolbar', () => ({
  default: (props: any) => (
    <div data-testid="viewer-toolbar">
      ViewerToolbar ({props.viewerModes?.explore ? 'ExploreEnabled' : ''} {props.viewerModes?.selfPaced || props.viewerModes?.timed ? 'TourEnabled' : ''})
    </div>
  )
}));
vi.mock('../client/components/EditorToolbar', () => ({
  default: () => <div data-testid="editor-toolbar">EditorToolbar</div>
}));
vi.mock('../client/components/HotspotViewer', () => ({
  default: () => <div data-testid="hotspot-viewer">HotspotViewer</div>
}));
vi.mock('../client/components/HorizontalTimeline', () => ({
  default: () => <div data-testid="horizontal-timeline">HorizontalTimeline</div>
}));
vi.mock('../client/components/ImageEditCanvas', () => ({
  default: () => <div data-testid="image-edit-canvas">ImageEditCanvas</div>
}));
vi.mock('../client/components/HotspotEditorModal', () => ({
  default: () => <div data-testid="hotspot-editor-modal">HotspotEditorModal</div>
}));
vi.mock('../lib/firebaseProxy', () => ({
  appScriptProxy: {
    uploadImage: vi.fn().mockResolvedValue('mockImageUrl'),
  },
}));


describe('InteractiveModule', () => {
  const mockOnSave = vi.fn();
  const mockOnClose = vi.fn();

  const defaultInitialData: InteractiveModuleState = {
    backgroundImage: 'test-image.jpg',
    hotspots: [],
    timelineEvents: [],
    imageFitMode: 'contain',
    // viewerModes will be overridden in tests
  };

  const getProps = (viewerModesOptions?: { explore?: boolean; selfPaced?: boolean; timed?: boolean }) => ({
    initialData: defaultInitialData,
    isEditing: false,
    onSave: mockOnSave,
    onClose: mockOnClose,
    projectName: 'Test Project',
    isSharedView: true, // To ensure viewer mode UI is shown
    viewerModes: viewerModesOptions || { explore: true, selfPaced: true, timed: true },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test suite for initial overlay buttons in viewer mode
  describe('Initial Overlay Buttons (Viewer Mode)', () => {
    test('renders both "Explore Module" and "Start Guided Tour" buttons by default (all modes enabled)', () => {
      render(<InteractiveModule {...getProps()} />);
      // The buttons are inside a specific overlay div, let's target that
      const overlay = screen.getByText('Interactive Module Ready').closest('div.bg-black\\/40');
      expect(overlay).toBeInTheDocument();
      if (!overlay) return; // Type guard

      expect(within(overlay).getByText('Explore Module')).toBeInTheDocument();
      expect(within(overlay).getByText('Start Guided Tour')).toBeInTheDocument();
    });

    test('renders only "Explore Module" button if only explore mode is enabled', () => {
      render(<InteractiveModule {...getProps({ explore: true, selfPaced: false, timed: false })} />);
      const overlay = screen.getByText('Interactive Module Ready').closest('div.bg-black\\/40');
      expect(overlay).toBeInTheDocument();
      if (!overlay) return;

      expect(within(overlay).getByText('Explore Module')).toBeInTheDocument();
      expect(within(overlay).queryByText('Start Guided Tour')).not.toBeInTheDocument();
    });

    test('renders only "Start Guided Tour" button if only selfPaced mode is enabled', () => {
      render(<InteractiveModule {...getProps({ explore: false, selfPaced: true, timed: false })} />);
      const overlay = screen.getByText('Interactive Module Ready').closest('div.bg-black\\/40');
      expect(overlay).toBeInTheDocument();
      if (!overlay) return;

      expect(within(overlay).queryByText('Explore Module')).not.toBeInTheDocument();
      expect(within(overlay).getByText('Start Guided Tour')).toBeInTheDocument();
    });

    test('renders only "Start Guided Tour" button if only timed mode is enabled', () => {
      render(<InteractiveModule {...getProps({ explore: false, selfPaced: false, timed: true })} />);
      const overlay = screen.getByText('Interactive Module Ready').closest('div.bg-black\\/40');
      expect(overlay).toBeInTheDocument();
      if (!overlay) return;

      expect(within(overlay).queryByText('Explore Module')).not.toBeInTheDocument();
      expect(within(overlay).getByText('Start Guided Tour')).toBeInTheDocument();
    });

    test('renders "Start Guided Tour" button if both selfPaced and timed modes are enabled (explore disabled)', () => {
      render(<InteractiveModule {...getProps({ explore: false, selfPaced: true, timed: true })} />);
      const overlay = screen.getByText('Interactive Module Ready').closest('div.bg-black\\/40');
      expect(overlay).toBeInTheDocument();
      if (!overlay) return;

      expect(within(overlay).queryByText('Explore Module')).not.toBeInTheDocument();
      expect(within(overlay).getByText('Start Guided Tour')).toBeInTheDocument();
    });

    test('renders no mode selection buttons in overlay if all viewer modes are disabled', () => {
      render(<InteractiveModule {...getProps({ explore: false, selfPaced: false, timed: false })} />);
      const overlay = screen.getByText('Interactive Module Ready').closest('div.bg-black\\/40');
      expect(overlay).toBeInTheDocument();
      if (!overlay) return;

      expect(within(overlay).queryByText('Explore Module')).not.toBeInTheDocument();
      expect(within(overlay).queryByText('Start Guided Tour')).not.toBeInTheDocument();
      // It should still show the "Interactive Module Ready" text.
      expect(within(overlay).getByText('Interactive Module Ready')).toBeInTheDocument();
    });

    test('does not render initial overlay if not in idle state', () => {
      // To achieve this, we can simulate that the module is already in 'learning' state.
      // This requires a bit more setup or a way to pass initial moduleState.
      // For now, we assume the default initial state is 'idle' for viewer mode.
      // A more complex test would involve changing moduleState after initial render.
      // This test might be better as an integration test if moduleState changes are involved.
      // Current component logic initializes to 'idle' when isEditing is false.
      const { rerender } = render(<InteractiveModule {...getProps()} />);
      let overlay = screen.getByText('Interactive Module Ready').closest('div.bg-black\\/40');
      expect(overlay).toBeInTheDocument();

      // Simulate clicking "Start Guided Tour" which changes moduleState to 'learning'
      if(overlay) fireEvent.click(within(overlay).getByText('Start Guided Tour'));

      // Re-render or wait for state update. For this component, it might auto-hide.
      // Check if the overlay is gone. This depends on the component's internal logic for hiding the overlay.
      const moduleReadyText = screen.queryByText('Interactive Module Ready');
      const overlayAfterClick = moduleReadyText?.closest('div.bg-black\\/40') || null;
      expect(overlayAfterClick).not.toBeInTheDocument();

    });
  });
});
