import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { ResponsiveModal } from '../client/components/responsive/ResponsiveModal';
import ModernSlideEditor from '../client/components/editors/ModernSlideEditor';
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

  test('ModernSlideEditor should use responsive components', () => {
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
        <ModernSlideEditor
          slide={testSlide}
          onSlideChange={() => {}}
          projectName="Test Project"
          onSave={async () => {}}
          onClose={() => {}}
          isSaving={false}
          isPublished={false}
          onImageUpload={async () => {}}
          project={{
            id: 'test-project',
            title: 'Test Project',
            description: 'Test Description',
            createdBy: 'test-user',
            interactiveData: {},
            projectType: 'slide'
          }}
          onLivePreview={() => {}}
        />
      </AuthProvider>
    );

    // Check for the presence of the modern slide editor
    const slideEditor = screen.getByTestId('modern-slide-editor');
    expect(slideEditor).toBeInTheDocument();

    // Check for modern footer controls
    const backgroundButton = screen.getByText('Background');
    expect(backgroundButton).toBeInTheDocument();
  });
});
