import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ViewerFooterToolbar } from '../client/components/ViewerFooterToolbar';
import { AuthContext } from '../lib/authContext';
import { InteractiveSlide } from '../shared/slideTypes';

// Mock the AuthContext to provide a dummy user
const mockAuth = {
    user: {
      displayName: "Test User",
      email: "test@example.com",
      uid: "123",
    },
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signInWithGoogle: vi.fn(),
    logout: vi.fn(),
    resetPassword: vi.fn(),
    switchAccount: vi.fn(),
  };

  // Test wrapper component that provides the mock auth context
  const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AuthContext.Provider value={mockAuth}>
      {children}
    </AuthContext.Provider>
  );

  // Helper function to render with auth context
  const renderWithAuthProvider = (ui: React.ReactElement) => {
    return render(ui, { wrapper: TestWrapper });
  };

  const mockOnBack = vi.fn();
  const mockOnPreviousSlide = vi.fn();
  const mockOnNextSlide = vi.fn();
  const mockOnSlideSelect = vi.fn();
  const mockOnStartExploring = vi.fn();
  const mockOnStartLearning = vi.fn();
  const mockOnPreviousStep = vi.fn();
  const mockOnNextStep = vi.fn();

  const mockSlides: InteractiveSlide[] = [
    {
      id: '1',
      title: 'First Slide',
      elements: [],
      transitions: [],
      layout: {
        containerWidth: 1920,
        containerHeight: 1080,
        aspectRatio: '16:9',
        scaling: 'fit',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }
    },
    {
      id: '2',
      title: 'Second Slide',
      elements: [],
      transitions: [],
      layout: {
        containerWidth: 1920,
        containerHeight: 1080,
        aspectRatio: '16:9',
        scaling: 'fit',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }
    },
    {
      id: '3',
      title: 'Third Slide',
      elements: [],
      transitions: [],
      layout: {
        containerWidth: 1920,
        containerHeight: 1080,
        aspectRatio: '16:9',
        scaling: 'fit',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }
    },
  ];

  const defaultProps = {
    projectName: 'My Awesome Project',
    onBack: mockOnBack,
    currentSlideIndex: 1,
    totalSlides: mockSlides.length,
    onPreviousSlide: mockOnPreviousSlide,
    onNextSlide: mockOnNextSlide,
    canGoPrevious: true,
    canGoNext: true,
    slides: mockSlides,
    onSlideSelect: mockOnSlideSelect,
    showProgress: true,
    moduleState: 'learning' as const,
    onStartLearning: mockOnStartLearning,
    onStartExploring: mockOnStartExploring,
    hasContent: true,
    isMobile: false,
    viewerModes: { explore: true, selfPaced: true, timed: true },
  };

  describe('ViewerFooterToolbar', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    describe('Desktop Layout', () => {
      it('renders project name and back button', () => {
        renderWithAuthProvider(<ViewerFooterToolbar {...defaultProps} />);
        expect(screen.getByText('My Awesome Project')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Back to projects/i })).toBeInTheDocument();
      });

      it('calls onBack when back button is clicked', () => {
        renderWithAuthProvider(<ViewerFooterToolbar {...defaultProps} />);
        fireEvent.click(screen.getByRole('button', { name: /Back to projects/i }));
        expect(mockOnBack).toHaveBeenCalledTimes(1);
      });

      it('displays slide progress and navigation buttons in learning mode', () => {
        renderWithAuthProvider(<ViewerFooterToolbar {...defaultProps} moduleState="learning" />);
        expect(screen.getByText('Slide 2 of 3')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Previous slide/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Next slide/i })).toBeInTheDocument();
      });

      it('calls onPreviousSlide and onNextSlide when navigation buttons are clicked', () => {
        renderWithAuthProvider(<ViewerFooterToolbar {...defaultProps} moduleState="learning" />);
        fireEvent.click(screen.getByRole('button', { name: /Previous slide/i }));
        expect(mockOnPreviousSlide).toHaveBeenCalledTimes(1);
        fireEvent.click(screen.getByRole('button', { name: /Next slide/i }));
        expect(mockOnNextSlide).toHaveBeenCalledTimes(1);
      });

      it('disables navigation buttons when at the beginning or end', () => {
        const { rerender } = renderWithAuthProvider(<ViewerFooterToolbar {...defaultProps} currentSlideIndex={0} canGoPrevious={false} />);
        expect(screen.getByRole('button', { name: /Previous slide/i })).toBeDisabled();

        rerender(<ViewerFooterToolbar {...defaultProps} currentSlideIndex={2} canGoNext={false} />);
        expect(screen.getByRole('button', { name: /Next slide/i })).toBeDisabled();
      });

      it('renders progress dots and handles clicks', () => {
        renderWithAuthProvider(<ViewerFooterToolbar {...defaultProps} />);
        const dotButtons = screen.getAllByRole('button', { name: /Go to slide/i });
        expect(dotButtons).toHaveLength(3);
        fireEvent.click(dotButtons[2]);
        expect(mockOnSlideSelect).toHaveBeenCalledWith('3');
      });

      it('renders step navigation when provided', () => {
        renderWithAuthProvider(<ViewerFooterToolbar {...defaultProps} currentStep={2} totalSteps={5} stepLabel="Step 2/5" onPreviousStep={mockOnPreviousStep} onNextStep={mockOnNextStep} />);
        expect(screen.getByText('Step 2/5')).toBeInTheDocument();
        const prevButton = screen.getByRole('button', { name: /Previous step/i });
        const nextButton = screen.getByRole('button', { name: /Next step/i });
        fireEvent.click(prevButton);
        expect(mockOnPreviousStep).toHaveBeenCalledTimes(1);
        fireEvent.click(nextButton);
        expect(mockOnNextStep).toHaveBeenCalledTimes(1);
      });

      it('renders mode buttons in idle state', () => {
        renderWithAuthProvider(<ViewerFooterToolbar {...defaultProps} moduleState="idle" />);
        expect(screen.getByRole('button', { name: /Explore Mode/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Guided Tour/i })).toBeInTheDocument();
      });

      it('calls onStartExploring and onStartLearning when mode buttons are clicked', () => {
        renderWithAuthProvider(<ViewerFooterToolbar {...defaultProps} moduleState="idle" />);
        fireEvent.click(screen.getByRole('button', { name: /Explore Mode/i }));
        expect(mockOnStartExploring).toHaveBeenCalledTimes(1);
        fireEvent.click(screen.getByRole('button', { name: /Guided Tour/i }));
        expect(mockOnStartLearning).toHaveBeenCalledTimes(1);
      });

      it('renders "Back to Menu" button in learning/exploring state', () => {
          renderWithAuthProvider(<ViewerFooterToolbar {...defaultProps} moduleState="exploring" />);
          expect(screen.getByRole('button', { name: /Back to Menu/i })).toBeInTheDocument();
      });

      it('opens and closes the keyboard shortcuts modal', () => {
        renderWithAuthProvider(<ViewerFooterToolbar {...defaultProps} />);
        const shortcutsButton = screen.getByRole('button', { name: /Show keyboard shortcuts/i });
        fireEvent.click(shortcutsButton);

        expect(screen.getByRole('dialog', { name: /Keyboard Shortcuts/i })).toBeInTheDocument();
        expect(screen.getByText('Next Slide')).toBeInTheDocument();

        const closeButton = screen.getByRole('button', { name: /Close/i });
        fireEvent.click(closeButton);

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    describe('Mobile Layout', () => {
      const mobileProps = { ...defaultProps, isMobile: true };

      it('renders mobile layout correctly', () => {
        renderWithAuthProvider(<ViewerFooterToolbar {...mobileProps} />);
        expect(screen.getByRole('button', { name: /Back to projects/i })).toBeInTheDocument();
        expect(screen.queryByText('My Awesome Project')).not.toBeInTheDocument();
      });

      it('renders compact navigation in learning mode', () => {
        renderWithAuthProvider(<ViewerFooterToolbar {...mobileProps} moduleState="learning" />);
        expect(screen.getByText('2/3')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Previous slide/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Next slide/i })).toBeInTheDocument();
      });

      it('renders compact mode buttons in idle state', () => {
        renderWithAuthProvider(<ViewerFooterToolbar {...mobileProps} moduleState="idle" />);
        expect(screen.getByRole('button', { name: 'Explore' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Tour' })).toBeInTheDocument();
      });

      it('renders "Menu" button in learning/exploring state', () => {
          renderWithAuthProvider(<ViewerFooterToolbar {...mobileProps} moduleState="exploring" />);
          expect(screen.getByRole('button', { name: /Menu/i })).toBeInTheDocument();
      });
    });

    describe('Accessibility', () => {
      it('has correct aria attributes for navigation buttons', () => {
        renderWithAuthProvider(<ViewerFooterToolbar {...defaultProps} />);
        expect(screen.getByRole('button', { name: /Previous slide/i })).toHaveAttribute('aria-label', 'Previous slide');
        expect(screen.getByRole('button', { name: /Next slide/i })).toHaveAttribute('aria-label', 'Next slide');
      });

      it('has correct aria attributes for progress dots', () => {
        renderWithAuthProvider(<ViewerFooterToolbar {...defaultProps} />);
        const dot = screen.getByRole('button', { name: /Go to slide 1: First Slide/i });
        expect(dot).toBeInTheDocument();
      });

      it('has correct aria attributes for shortcuts modal', () => {
          renderWithAuthProvider(<ViewerFooterToolbar {...defaultProps} />);
          fireEvent.click(screen.getByRole('button', { name: /Show keyboard shortcuts/i }));
          const dialog = screen.getByRole('dialog');
          expect(dialog).toHaveAttribute('aria-modal', 'true');
          expect(dialog).toHaveAttribute('aria-labelledby', 'shortcuts-title');
      });
    });
  });
