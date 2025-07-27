import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MobileNavigationBar } from '../client/components/mobile/MobileNavigationBar';
import { Project } from '../shared/types';

// Mock AuthButton since it may have external dependencies
vi.mock('../client/components/AuthButton', () => ({
  default: ({ variant, size }: { variant?: string; size?: string }) => (
    <div data-testid="auth-button" data-variant={variant} data-size={size}>
      Auth Button
    </div>
  )
}));

// Mock ChevronLeftIcon
vi.mock('../client/components/icons/ChevronLeftIcon', () => ({
  ChevronLeftIcon: ({ className }: { className?: string }) => (
    <svg data-testid="chevron-left-icon" className={className}>
      <path />
    </svg>
  )
}));

const mockProject: Project = {
  id: 'test-project',
  title: 'Test Project',
  createdBy: 'user-id',
  createdAt: new Date(),
  updatedAt: new Date(),
  imageUrl: '',
  hotspots: []
};

const mockEditorProps = {
  mode: 'editor' as const,
  project: mockProject,
  onBack: vi.fn(),
  onSave: vi.fn(),
  isSaving: false,
  showSuccessMessage: false,
  currentZoom: 1,
  onZoomIn: vi.fn(),
  onZoomOut: vi.fn(),
  onZoomReset: vi.fn(),
  viewerModes: { explore: true, selfPaced: true, timed: true },
  onViewerModeChange: vi.fn()
};

const mockViewerProps = {
  mode: 'viewer' as const,
  projectName: 'Test Viewer Project',
  onBack: vi.fn(),
  moduleState: 'idle' as const,
  onStartLearning: vi.fn(),
  onStartExploring: vi.fn(),
  hasContent: true,
  viewerModes: { explore: true, selfPaced: true, timed: true }
};

describe('MobileNavigationBar', () => {
  describe('Editor Mode', () => {
    it('renders editor navigation with project title', () => {
      render(<MobileNavigationBar {...mockEditorProps} />);
      
      expect(screen.getByText('Test Project')).toBeInTheDocument();
      expect(screen.getByText('← Back')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByLabelText('Open settings menu')).toBeInTheDocument();
    });

    it('shows saving state when isSaving is true', () => {
      render(<MobileNavigationBar {...mockEditorProps} isSaving={true} />);
      
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(screen.getByLabelText('Saving project...')).toBeDisabled();
    });

    it('shows success message when showSuccessMessage is true', () => {
      render(<MobileNavigationBar {...mockEditorProps} showSuccessMessage={true} />);
      
      expect(screen.getByText('Project saved successfully!')).toBeInTheDocument();
    });
  });

  describe('Viewer Mode', () => {
    it('renders viewer navigation with project name and gradient styling', () => {
      render(<MobileNavigationBar {...mockViewerProps} />);
      
      expect(screen.getByText('Test Viewer Project')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('auth-button')).toBeInTheDocument();
    });

    it('renders mode toggle buttons when hasContent is true', () => {
      render(<MobileNavigationBar {...mockViewerProps} />);
      
      expect(screen.getByText('Explore')).toBeInTheDocument();
      expect(screen.getByText('Tour')).toBeInTheDocument();
    });

    it('does not render mode buttons when hasContent is false', () => {
      render(<MobileNavigationBar {...mockViewerProps} hasContent={false} />);
      
      expect(screen.queryByText('Explore')).not.toBeInTheDocument();
      expect(screen.queryByText('Tour')).not.toBeInTheDocument();
    });

    it('highlights active mode button based on moduleState', () => {
      render(<MobileNavigationBar {...mockViewerProps} moduleState="learning" />);
      
      const tourButton = screen.getByText('Tour');
      const exploreButton = screen.getByText('Explore');
      
      // Tour button should have purple background when learning mode is active
      expect(tourButton).toHaveClass('bg-purple-500');
      // Explore button should have slate background when not active
      expect(exploreButton).toHaveClass('bg-slate-700');
    });

    it('renders only explore button when only explore mode is enabled', () => {
      render(<MobileNavigationBar {...mockViewerProps} viewerModes={{ explore: true, selfPaced: false, timed: false }} />);
      
      expect(screen.getByText('Explore')).toBeInTheDocument();
      expect(screen.queryByText('Tour')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels in editor mode', () => {
      render(<MobileNavigationBar {...mockEditorProps} />);
      
      expect(screen.getByLabelText('Go back to projects')).toBeInTheDocument();
      expect(screen.getByLabelText('Save project')).toBeInTheDocument();
      expect(screen.getByLabelText('Open settings menu')).toBeInTheDocument();
    });

    it('has proper ARIA labels in viewer mode', () => {
      render(<MobileNavigationBar {...mockViewerProps} />);
      
      expect(screen.getByLabelText('Back to projects')).toBeInTheDocument();
      // When moduleState is 'idle', explore mode is active
      expect(screen.getByLabelText('Explore mode active')).toBeInTheDocument();
      expect(screen.getByLabelText('Switch to tour mode')).toBeInTheDocument();
    });
  });
});