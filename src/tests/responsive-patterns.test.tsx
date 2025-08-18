import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ResponsiveModal } from '../client/components/responsive/ResponsiveModal';
import { UnifiedSlideEditor } from '../client/components/slides/UnifiedSlideEditor';
import { createTestDemoSlideDeck } from '../shared/testDemoSlideDeck';
import { AuthProvider } from '../lib/authContext';
import React from 'react';

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
    expect(modal.parentElement).toHaveClass('md:items-center');
    expect(modal.parentElement).toHaveClass('justify-center');

    const dragHandle = screen.getByRole('dialog').querySelector('.drag-handle');
    expect(dragHandle).toHaveClass('md:hidden');
  });

  test('UnifiedSlideEditor should use responsive components', () => {
    const testSlideDeck = createTestDemoSlideDeck();
    render(
      <AuthProvider>
        <UnifiedSlideEditor
          slideDeck={testSlideDeck}
          projectName="Test Project"
          onSlideDeckChange={() => {}}
          onSave={() => Promise.resolve()}
          onImageUpload={() => Promise.resolve()}
          onClose={() => {}}
          isPublished={false}
        />
      </AuthProvider>
    );

    // Check for the presence of the responsive toolbar
    const responsiveToolbar = screen.getByRole('toolbar');
    expect(responsiveToolbar).toBeInTheDocument();

    // Check that the mobile toolbar is not present
    const mobileToolbar = screen.queryByTestId('mobile-toolbar');
    expect(mobileToolbar).not.toBeInTheDocument();
  });
});
