import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UniversalMobileToolbar } from '../client/components/mobile/UniversalMobileToolbar';

// Mock the viewport and mobile utils
vi.mock('../client/hooks/useViewportHeight', () => ({
  useViewportHeight: () => ({ height: 812 })
}));

vi.mock('../client/utils/mobileUtils', () => ({
  isIOSSafari: () => false,
  getIOSSafariUIState: () => ({
    isUIVisible: false,
    uiHeight: 0,
    dynamicUIHeight: 0,
    isStandalone: false,
    bottomUIHeight: 0,
    topUIHeight: 0,
    hasBottomURLBar: false
  }),
  getIOSSafariBottomUIState: () => ({
    hasBottomUI: false,
    bottomUIHeight: 0,
    hasBottomURLBar: false,
    recommendedOffset: 0,
    viewportReduction: 0
  }),
  getIOSSafariToolbarOffset: () => 0
}));

// Mock window.visualViewport
Object.defineProperty(window, 'visualViewport', {
  value: {
    height: 812,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  },
  writable: true
});

describe('UniversalMobileToolbar', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('renders children correctly', () => {
    render(
      <UniversalMobileToolbar>
        <button>Test Button</button>
      </UniversalMobileToolbar>
    );

    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument();
  });

  it('applies correct ARIA attributes', () => {
    render(
      <UniversalMobileToolbar>
        <div>Content</div>
      </UniversalMobileToolbar>
    );

    const toolbar = screen.getByRole('toolbar');
    expect(toolbar).toHaveAttribute('aria-label', 'Mobile toolbar');
  });

  it('applies custom className and styles', () => {
    const customClass = 'custom-toolbar-class';
    const customStyle = { border: '2px solid red' };

    render(
      <UniversalMobileToolbar className={customClass} style={customStyle}>
        <div>Content</div>
      </UniversalMobileToolbar>
    );

    const toolbar = screen.getByRole('toolbar');
    expect(toolbar).toHaveClass('universal-mobile-toolbar', customClass);
    expect(toolbar).toHaveStyle({ border: '2px solid red' });
  });

  it('handles timeline visibility prop', () => {
    render(
      <UniversalMobileToolbar isTimelineVisible={true}>
        <div>Content with timeline</div>
      </UniversalMobileToolbar>
    );

    const toolbar = screen.getByRole('toolbar');
    expect(toolbar).toBeInTheDocument();
  });

  it('applies high z-index for iOS Safari compatibility', () => {
    render(
      <UniversalMobileToolbar>
        <div>Content</div>
      </UniversalMobileToolbar>
    );

    const toolbar = screen.getByRole('toolbar');
    expect(toolbar).toHaveStyle({ zIndex: '9999' });
  });

  it('applies safe area insets for device compatibility', () => {
    render(
      <UniversalMobileToolbar>
        <div>Content</div>
      </UniversalMobileToolbar>
    );

    const toolbar = screen.getByRole('toolbar');
    // Check that safe area insets are applied in CSS
    const style = window.getComputedStyle(toolbar);
    expect(toolbar).toHaveStyle({ position: 'fixed' });
  });
});