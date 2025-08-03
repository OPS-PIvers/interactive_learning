import React from 'react';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { AuthProvider } from '../lib/authContext';
import { ToastProvider } from '../client/hooks/useToast';
import '@testing-library/jest-dom';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import SlideBasedInteractiveModule from '../client/components/SlideBasedInteractiveModule';
import { SlideDeck, DeviceType } from '../shared/slideTypes';

vi.mock('../lib/firebaseProxy', () => ({
  appScriptProxy: {
    uploadImage: vi.fn().mockResolvedValue('mockImageUrl'),
  },
}));

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('Unified Component Behavior Tests', () => {
  const mockOnSave = vi.fn();
  const mockOnClose = vi.fn();

  const unifiedSlideData: SlideDeck = {
    id: 'unified-test-deck',
    title: 'Unified Test Deck',
    slides: [{ id: 'slide1', elements: [], backgroundMedia: null }],
    metadata: { version: '2.0', createdAt: '', updatedAt: '' },
  };

  const getProps = (isEditing: boolean, deviceType: DeviceType) => ({
    slideDeck: unifiedSlideData,
    isEditing,
    onSave: mockOnSave,
    onClose: mockOnClose,
    projectName: 'Unified Project',
    projectId: 'unified-project-id',
    deviceType,
  });

  afterEach(cleanup);

  const renderComponent = (props: any) => {
    return render(
      <AuthProvider>
        <ToastProvider>
          <SlideBasedInteractiveModule {...props} />
        </ToastProvider>
      </AuthProvider>
    );
  };

  describe('When on a desktop device', () => {
    beforeEach(() => {
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: false, // Simulate desktop
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
    });

    test('should render the desktop editor layout', async () => {
      const props = getProps(true, 'desktop');
      renderComponent(props);
      const projectTitles = await screen.findAllByText('Unified Project');
      expect(projectTitles.length).toBeGreaterThan(0);
    });
  });

  describe('When on a mobile device', () => {
    beforeEach(() => {
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: true, // Simulate mobile
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
    });

    test('should render the mobile editor layout', async () => {
      const props = getProps(true, 'mobile');
      renderComponent(props);
      const projectTitles = await screen.findAllByText('Unified Project');
      expect(projectTitles.length).toBeGreaterThan(0);
    });
  });
});
