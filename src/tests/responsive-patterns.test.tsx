import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { ResponsiveModal } from '../client/components/responsive/ResponsiveModal';
import SimpleSlideEditor from '../client/components/slides/SimpleSlideEditor';
import { AuthProvider } from '../lib/authContext';
import { createTestDemoSlideDeck } from '../shared/testDemoSlideDeck';

describe('CSS-only responsive design', () => {
  test('ResponsiveModal should use CSS media queries for responsiveness', () => {
    render(
      <ResponsiveModal
        type="share"
        isOpen={true}
        onClose={() => {}}
        title="Share Project"
      >
        <div>Modal Content</div>
      </ResponsiveModal>
    );

    const modal = screen.getByRole('dialog');
    expect(modal.parentElement).toHaveClass('responsive-modal-backdrop');

    const dragHandle = screen.getByRole('dialog').querySelector('.drag-handle');
    expect(dragHandle).toHaveClass('md:hidden');
  });

  test('SimpleSlideEditor should use responsive components', () => {
    const testSlideDeck = createTestDemoSlideDeck();
    const testSlide = testSlideDeck.slides[0] || {
      id: 'test-slide',
      title: 'Test Slide',
      elements: [],
      backgroundMedia: {
        type: 'image',
        url: ''
      },
      layout: {
        aspectRatio: '16:9',
        scaling: 'fit',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      },
      transitions: []
    };
    
    render(
      <AuthProvider>
        <SimpleSlideEditor
          slide={testSlide}
          onSlideChange={() => {}}
        />
      </AuthProvider>
    );

    // Check for the presence of the slide editor
    const slideEditor = screen.getByText('Hotspots');
    expect(slideEditor).toBeInTheDocument();

    // Check for background selector
    const backgroundSelector = screen.getByText('Background');
    expect(backgroundSelector).toBeInTheDocument();
  });
});
