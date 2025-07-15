import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import ViewerToolbar from '../client/components/ViewerToolbar';
import { AuthProvider } from '../lib/authContext';

describe('ViewerToolbar', () => {
  const mockOnBack = vi.fn();
  const mockOnStartLearning = vi.fn();
  const mockOnStartExploring = vi.fn();

  const defaultProps = {
    projectName: 'Test Project',
    onBack: mockOnBack,
    moduleState: 'idle' as 'idle' | 'learning',
    onStartLearning: mockOnStartLearning,
    onStartExploring: mockOnStartExploring,
    hasContent: true,
    isMobile: false,
  };

  // Helper function to render with AuthProvider
  const renderWithAuth = (component: React.ReactElement) => {
    return render(
      <AuthProvider>
        {component}
      </AuthProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders both Explore and Tour buttons by default', () => {
    renderWithAuth(<ViewerToolbar {...defaultProps} />);
    expect(screen.getByText('Explore Mode')).toBeInTheDocument();
    expect(screen.getByText('Guided Tour')).toBeInTheDocument();
  });

  test('renders only Explore button if only explore mode is enabled', () => {
    renderWithAuth(<ViewerToolbar {...defaultProps} viewerModes={{ explore: true, selfPaced: false, timed: false }} />);
    expect(screen.getByText('Explore Mode')).toBeInTheDocument();
    expect(screen.queryByText('Guided Tour')).not.toBeInTheDocument();
  });

  test('renders only Tour button if only selfPaced mode is enabled', () => {
    renderWithAuth(<ViewerToolbar {...defaultProps} viewerModes={{ explore: false, selfPaced: true, timed: false }} />);
    expect(screen.queryByText('Explore Mode')).not.toBeInTheDocument();
    expect(screen.getByText('Guided Tour')).toBeInTheDocument();
  });

  test('renders only Tour button if only timed mode is enabled', () => {
    renderWithAuth(<ViewerToolbar {...defaultProps} viewerModes={{ explore: false, selfPaced: false, timed: true }} />);
    expect(screen.queryByText('Explore Mode')).not.toBeInTheDocument();
    expect(screen.getByText('Guided Tour')).toBeInTheDocument();
  });

  test('renders Tour button if both selfPaced and timed modes are enabled (explore disabled)', () => {
    renderWithAuth(<ViewerToolbar {...defaultProps} viewerModes={{ explore: false, selfPaced: true, timed: true }} />);
    expect(screen.queryByText('Explore Mode')).not.toBeInTheDocument();
    expect(screen.getByText('Guided Tour')).toBeInTheDocument();
  });

  test('renders no mode buttons if all modes are disabled', () => {
    renderWithAuth(<ViewerToolbar {...defaultProps} viewerModes={{ explore: false, selfPaced: false, timed: false }} />);
    expect(screen.queryByText('Explore Mode')).not.toBeInTheDocument();
    expect(screen.queryByText('Guided Tour')).not.toBeInTheDocument();
  });

  test('calls onStartExploring when Explore Mode button is clicked', () => {
    renderWithAuth(<ViewerToolbar {...defaultProps} viewerModes={{ explore: true }} />);
    fireEvent.click(screen.getByText('Explore Mode'));
    expect(mockOnStartExploring).toHaveBeenCalledTimes(1);
  });

  test('calls onStartLearning when Guided Tour button is clicked', () => {
    renderWithAuth(<ViewerToolbar {...defaultProps} viewerModes={{ selfPaced: true }} />);
    fireEvent.click(screen.getByText('Guided Tour'));
    expect(mockOnStartLearning).toHaveBeenCalledTimes(1);
  });

  // Mobile tests
  test('renders mobile Explore and Tour buttons by default', () => {
    renderWithAuth(<ViewerToolbar {...defaultProps} isMobile={true} />);
    expect(screen.getByText('Explore')).toBeInTheDocument();
    expect(screen.getByText('Tour')).toBeInTheDocument();
  });

  test('renders only mobile Explore button if only explore mode is enabled', () => {
    renderWithAuth(<ViewerToolbar {...defaultProps} isMobile={true} viewerModes={{ explore: true, selfPaced: false, timed: false }} />);
    expect(screen.getByText('Explore')).toBeInTheDocument();
    expect(screen.queryByText('Tour')).not.toBeInTheDocument();
  });

  test('renders only mobile Tour button if only selfPaced mode is enabled', () => {
    renderWithAuth(<ViewerToolbar {...defaultProps} isMobile={true} viewerModes={{ explore: false, selfPaced: true, timed: false }} />);
    expect(screen.queryByText('Explore')).not.toBeInTheDocument();
    expect(screen.getByText('Tour')).toBeInTheDocument();
  });

  test('calls onStartExploring when mobile Explore button is clicked', () => {
    renderWithAuth(<ViewerToolbar {...defaultProps} isMobile={true} viewerModes={{ explore: true }} />);
    fireEvent.click(screen.getByText('Explore'));
    expect(mockOnStartExploring).toHaveBeenCalledTimes(1);
  });

  test('calls onStartLearning when mobile Tour button is clicked', () => {
    renderWithAuth(<ViewerToolbar {...defaultProps} isMobile={true} viewerModes={{ selfPaced: true }} />);
    fireEvent.click(screen.getByText('Tour'));
    expect(mockOnStartLearning).toHaveBeenCalledTimes(1);
  });
});
